from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.middleware.csrf import get_token
from django.db.models import Sum

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, StatistiqueAnnuelle
from .permissions import IsAdminUser, IsSuperAdmin, can_manage_accounts
from .serializers import UserSerializer, UserCreateSerializer


# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """
    GET /api/auth/csrf/
    Retourne le token CSRF. Le frontend doit appeler cet endpoint
    au démarrage puis inclure le token dans l'en-tête X-CSRFToken.
    """
    return Response({"csrfToken": get_token(request)})


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }

    Crée une session Django (cookie HttpOnly sessionid).
    Retourne les infos de l'utilisateur connecté.
    """
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"detail": "Email et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Django accepte le login par username OU email
    user = authenticate(request, username=username, password=password)

    # Si authenticate échoue par username, on essaie par email
    if user is None:
        try:
            u = User.objects.get(email__iexact=username)
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

    return Response({
        "user": UserSerializer(user).data,
        "force_password_change": user.force_password_change,
    })


# ---------------------------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/auth/logout/ — Détruit la session courante."""
    logout(request)
    return Response({"detail": "Déconnecté."})


# ---------------------------------------------------------------------------
# ME — informations de l'utilisateur connecté
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
    Body: { "old_password": "...", "new_password": "...", "confirm_password": "..." }
    """
    user = request.user
    old_password = request.data.get("old_password", "")
    new_password = request.data.get("new_password", "")
    confirm = request.data.get("confirm_password", "")

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
    update_session_auth_hash(request, user)  # Garde la session active après le changement
    return Response({"detail": "Mot de passe modifié avec succès."})


# ---------------------------------------------------------------------------
# GESTION DES COMPTES (CRUD Users — réservé SUPER/REGION/DISTRICT)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """
    GET /api/auth/users/
    SUPER → tous les comptes
    REGION → ses admins district et paroisse
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
    """
    POST /api/auth/users/
    Crée un nouveau compte admin.
    """
    user = request.user
    if not can_manage_accounts(user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = UserCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        new_user = serializer.save()
        return Response(UserSerializer(new_user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    """
    GET/PATCH/DELETE /api/auth/users/{pk}/
    """
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not can_manage_accounts(user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    # Un REGION ne peut gérer que ses sous-admins
    if user.role == "REGION" and target.region != user.region:
        return Response(status=status.HTTP_403_FORBIDDEN)
    if user.role == "DISTRICT" and target.district != user.district:
        return Response(status=status.HTTP_403_FORBIDDEN)
    # Personne ne peut supprimer le SUPER ou se supprimer soi-même
    if request.method == "DELETE":
        if target.role == "SUPER" or target == user:
            return Response(
                {"detail": "Cette opération n'est pas autorisée."},
                status=status.HTTP_403_FORBIDDEN,
            )

    if request.method == "GET":
        return Response(UserSerializer(target).data)

    if request.method == "PATCH":
        serializer = UserSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        target.is_active = False
        target.save()
        return Response({"detail": "Compte désactivé."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_user_active(request, pk):
    """POST /api/auth/users/{pk}/toggle-active/ — Active ou désactive un compte."""
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if not can_manage_accounts(request.user) or target == request.user:
        return Response(status=status.HTTP_403_FORBIDDEN)

    target.is_active = not target.is_active
    target.save()
    return Response({"is_active": target.is_active})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reset_user_password(request, pk):
    """
    POST /api/auth/users/{pk}/reset-password/
    Body: { "new_password": "..." }
    Réservé SUPER ou manager direct de l'utilisateur cible.
    """
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
    return Response({"detail": "Mot de passe réinitialisé."})


# ---------------------------------------------------------------------------
# STATISTIQUES DASHBOARD (endpoint agrégé pour le tableau de bord admin)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    GET /api/auth/dashboard-stats/
    Retourne les compteurs pour les widgets du tableau de bord admin.
    Filtrés selon le scope de l'utilisateur.
    """
    from apps.geo.models import RegionSynodale, District, Paroisse
    from apps.oeuvres.models import Oeuvre
    from apps.ouvriers.models import Ouvrier

    user = request.user

    # Queryset de base filtré par scope
    if user.role == "SUPER":
        paroisses_qs = Paroisse.objects.all()
        oeuvres_qs = Oeuvre.objects.all()
        ouvriers_qs = Ouvrier.objects.all()
        stats_qs = StatistiqueAnnuelle.objects.all()
    elif user.role == "REGION" and user.region_id:
        paroisses_qs = Paroisse.objects.filter(district__region_id=user.region_id)
        oeuvres_qs = Oeuvre.objects.filter(region_id=user.region_id)
        ouvriers_qs = Ouvrier.objects.filter(paroisse__district__region_id=user.region_id)
        stats_qs = StatistiqueAnnuelle.objects.filter(paroisse__district__region_id=user.region_id)
    elif user.role == "DISTRICT" and user.district_id:
        paroisses_qs = Paroisse.objects.filter(district_id=user.district_id)
        oeuvres_qs = Oeuvre.objects.filter(district_id=user.district_id)
        ouvriers_qs = Ouvrier.objects.filter(paroisse__district_id=user.district_id)
        stats_qs = StatistiqueAnnuelle.objects.filter(paroisse__district_id=user.district_id)
    else:
        paroisses_qs = Paroisse.objects.filter(id=user.paroisse_id) if user.paroisse_id else Paroisse.objects.none()
        oeuvres_qs = Oeuvre.objects.filter(paroisse_id=user.paroisse_id) if user.paroisse_id else Oeuvre.objects.none()
        ouvriers_qs = Ouvrier.objects.filter(paroisse_id=user.paroisse_id) if user.paroisse_id else Ouvrier.objects.none()
        stats_qs = StatistiqueAnnuelle.objects.filter(paroisse_id=user.paroisse_id) if user.paroisse_id else StatistiqueAnnuelle.objects.none()

    annee = request.query_params.get("annee", 2025)
    totaux = stats_qs.filter(annee=annee).aggregate(
        total_communiants=Sum("communiants"),
        total_non_communiants=Sum("non_communiants"),
    )

    return Response({
        "nb_paroisses": paroisses_qs.count(),
        "nb_paroisses_sans_gps": paroisses_qs.filter(position__isnull=True).count(),
        "nb_oeuvres": oeuvres_qs.count(),
        "nb_ouvriers": ouvriers_qs.count(),
        "nb_regions": RegionSynodale.objects.count() if user.role == "SUPER" else 1,
        "nb_districts": District.objects.count() if user.role == "SUPER" else (
            District.objects.filter(region=user.region).count() if user.role == "REGION" else 1
        ),
        "total_communiants": totaux["total_communiants"] or 0,
        "total_non_communiants": totaux["total_non_communiants"] or 0,
        "total_fideles": (totaux["total_communiants"] or 0) + (totaux["total_non_communiants"] or 0),
        "annee": annee,
        "scope": user.get_scope_label(),
        "role": user.role,
    })
