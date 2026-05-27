from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.middleware.csrf import get_token
from django.db.models import Sum

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, StatistiqueAnnuelle
from .permissions import can_manage_accounts
from .serializers import UserSerializer, UserCreateSerializer


# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """GET /api/auth/csrf/ — Retourne le token CSRF pour les requêtes POST."""
    return Response({"csrfToken": get_token(request)})


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Body : { "username": "...", "password": "..." }
    Accepte username OU email.
    """
    from apps.audit.utils import log_action

    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"detail": "Email et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        try:
            u    = User.objects.get(email__iexact=username)
            user = authenticate(request, username=u.username, password=password)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response(
            {"detail": "Identifiants incorrects."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"detail": "Ce compte est désactivé. Contactez l'administrateur."},
            status=status.HTTP_403_FORBIDDEN,
        )

    login(request, user)

    log_action(
        request, "LOGIN", "systeme",
        objet_nom=user.get_full_name() or user.username,
        description=f"Connexion réussie — rôle : {user.get_role_display()}",
    )

    return Response({
        "user":                  UserSerializer(user).data,
        "force_password_change": user.force_password_change,
    })


# ---------------------------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/auth/logout/ — Détruit la session courante."""
    from apps.audit.utils import log_action

    log_action(
        request, "LOGOUT", "systeme",
        objet_nom=request.user.get_full_name() or request.user.username,
        description="Déconnexion",
    )
    logout(request)
    return Response({"detail": "Déconnecté."})


# ---------------------------------------------------------------------------
# ME
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """GET /api/auth/me/ — Retourne l'utilisateur courant avec son scope."""
    return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# CHANGEMENT DE MOT DE PASSE
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/auth/change-password/
    Body : { "old_password": "...", "new_password": "...", "confirm_password": "..." }
    """
    from apps.audit.utils import log_action

    user        = request.user
    old_password = request.data.get("old_password", "")
    new_password = request.data.get("new_password", "")
    confirm      = request.data.get("confirm_password", "")

    if not user.check_password(old_password):
        return Response(
            {"detail": "Mot de passe actuel incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if new_password != confirm:
        return Response(
            {"detail": "Les mots de passe ne correspondent pas."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(new_password) < 12:
        return Response(
            {"detail": "Le mot de passe doit contenir au moins 12 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.force_password_change = False
    user.save()
    update_session_auth_hash(request, user)

    log_action(request, "UPDATE", "user", objet_id=user.id, objet_nom=user.username,
               description="Changement de mot de passe")
    return Response({"detail": "Mot de passe modifié avec succès."})


# ---------------------------------------------------------------------------
# GESTION DES COMPTES (CRUD Users)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """
    GET /api/auth/users/
    SUPER   → tous les comptes
    REGION  → ses admins district et paroisse
    DISTRICT → ses admins paroisse
    """
    user = request.user
    if not can_manage_accounts(user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    qs = User.objects.select_related("region", "district", "paroisse").order_by("role", "last_name")

    if user.role == "REGION":
        qs = qs.filter(region=user.region).exclude(role="SUPER")
    elif user.role == "DISTRICT":
        qs = qs.filter(district=user.district, role="PAROISSE")

    return Response(UserSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user(request):
    """POST /api/auth/users/create/ — Crée un nouveau compte admin."""
    from apps.audit.utils import log_action

    user = request.user
    if not can_manage_accounts(user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = UserCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        new_user = serializer.save()
        log_action(
            request, "CREATE", "user",
            objet_id=new_user.id,
            objet_nom=new_user.get_full_name() or new_user.username,
            description=f"Création compte — rôle : {new_user.get_role_display()}",
        )
        return Response(UserSerializer(new_user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    """GET/PATCH/DELETE /api/auth/users/{pk}/"""
    from apps.audit.utils import log_action

    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not can_manage_accounts(user):
        return Response(status=status.HTTP_403_FORBIDDEN)
    if user.role == "REGION"   and target.region   != user.region:
        return Response(status=status.HTTP_403_FORBIDDEN)
    if user.role == "DISTRICT" and target.district != user.district:
        return Response(status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(UserSerializer(target).data)

    if request.method == "PATCH":
        serializer = UserSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request, "UPDATE", "user", objet_id=target.id,
                       objet_nom=target.get_full_name(), description="Modification compte utilisateur")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        if target.role == "SUPER" or target == user:
            return Response(
                {"detail": "Cette opération n'est pas autorisée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        target.is_active = False
        target.save()
        log_action(request, "DELETE", "user", objet_id=target.id,
                   objet_nom=target.get_full_name(), description="Désactivation compte utilisateur")
        return Response({"detail": "Compte désactivé."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_user_active(request, pk):
    """POST /api/auth/users/{pk}/toggle-active/"""
    from apps.audit.utils import log_action

    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if not can_manage_accounts(request.user) or target == request.user:
        return Response(status=status.HTTP_403_FORBIDDEN)

    target.is_active = not target.is_active
    target.save()
    action_label = "Activation" if target.is_active else "Désactivation"
    log_action(request, "UPDATE", "user", objet_id=target.id,
               objet_nom=target.get_full_name(), description=f"{action_label} du compte")
    return Response({"is_active": target.is_active})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reset_user_password(request, pk):
    """POST /api/auth/users/{pk}/reset-password/"""
    from apps.audit.utils import log_action

    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if not can_manage_accounts(request.user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    new_password = request.data.get("new_password", "")
    if len(new_password) < 12:
        return Response(
            {"detail": "Le mot de passe doit contenir au moins 12 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target.set_password(new_password)
    target.force_password_change = True
    target.save()
    log_action(request, "UPDATE", "user", objet_id=target.id,
               objet_nom=target.get_full_name(), description="Réinitialisation mot de passe")
    return Response({"detail": "Mot de passe réinitialisé."})


# ---------------------------------------------------------------------------
# STATISTIQUES DASHBOARD
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """GET /api/auth/dashboard-stats/ — Compteurs pour le tableau de bord admin."""
    from apps.geo.models import RegionSynodale, District, Paroisse
    from apps.oeuvres.models import Oeuvre
    from apps.ouvriers.models import Ouvrier

    user = request.user

    if user.role == "SUPER":
        paroisses_qs = Paroisse.objects.all()
        oeuvres_qs   = Oeuvre.objects.all()
        ouvriers_qs  = Ouvrier.objects.all()
        stats_qs     = StatistiqueAnnuelle.objects.all()
    elif user.role == "REGION" and user.region_id:
        paroisses_qs = Paroisse.objects.filter(district__region_id=user.region_id)
        oeuvres_qs   = Oeuvre.objects.filter(region_id=user.region_id)
        ouvriers_qs  = Ouvrier.objects.filter(paroisse__district__region_id=user.region_id)
        stats_qs     = StatistiqueAnnuelle.objects.filter(paroisse__district__region_id=user.region_id)
    elif user.role == "DISTRICT" and user.district_id:
        paroisses_qs = Paroisse.objects.filter(district_id=user.district_id)
        oeuvres_qs   = Oeuvre.objects.filter(district_id=user.district_id)
        ouvriers_qs  = Ouvrier.objects.filter(paroisse__district_id=user.district_id)
        stats_qs     = StatistiqueAnnuelle.objects.filter(paroisse__district_id=user.district_id)
    else:
        pid          = user.paroisse_id
        paroisses_qs = Paroisse.objects.filter(id=pid)        if pid else Paroisse.objects.none()
        oeuvres_qs   = Oeuvre.objects.filter(paroisse_id=pid) if pid else Oeuvre.objects.none()
        ouvriers_qs  = Ouvrier.objects.filter(paroisse_id=pid) if pid else Ouvrier.objects.none()
        stats_qs     = StatistiqueAnnuelle.objects.filter(paroisse_id=pid) if pid else StatistiqueAnnuelle.objects.none()

    annee  = int(request.query_params.get("annee", 2025))
    totaux = stats_qs.filter(annee=annee).aggregate(
        total_communiants=Sum("communiants"),
        total_non_communiants=Sum("non_communiants"),
    )

    nb_regions = (
        RegionSynodale.objects.count() if user.role == "SUPER"
        else (District.objects.filter(region=user.region).values("region").count() if user.role == "REGION" else 1)
    )
    nb_districts = (
        District.objects.count() if user.role == "SUPER"
        else (District.objects.filter(region=user.region).count() if user.role == "REGION" else 1)
    )

    return Response({
        "nb_paroisses":          paroisses_qs.count(),
        "nb_paroisses_sans_gps": paroisses_qs.filter(position__isnull=True).count(),
        "nb_oeuvres":            oeuvres_qs.count(),
        "nb_ouvriers":           ouvriers_qs.count(),
        "nb_regions":            nb_regions,
        "nb_districts":          nb_districts,
        "total_communiants":     totaux["total_communiants"]     or 0,
        "total_non_communiants": totaux["total_non_communiants"] or 0,
        "total_fideles":         (totaux["total_communiants"] or 0) + (totaux["total_non_communiants"] or 0),
        "annee":                 annee,
        "scope":                 user.get_scope_label(),
        "role":                  user.role,
    })
