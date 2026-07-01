from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.db.models import Sum
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, StatistiqueAnnuelle
from .permissions import can_manage_accounts
from .serializers import UserSerializer, UserCreateSerializer
from .throttles import LoginRateThrottle


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
@throttle_classes([LoginRateThrottle])
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
    """GET /api/auth/dashboard-stats/ — Compteurs et données agrégées pour le tableau de bord."""
    from django.db.models import Count, Q
    from apps.geo.models import RegionSynodale, District, Paroisse
    from apps.oeuvres.models import Oeuvre
    from apps.ouvriers.models import Ouvrier
    from apps.audit.models import LogActivite

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

    # ── Évolution fidèles par année (2020 → annee) ──────────────────────────
    annees_range = range(max(2020, annee - 6), annee + 1)
    fideles_par_annee = []
    for yr in annees_range:
        t = stats_qs.filter(annee=yr).aggregate(c=Sum("communiants"), nc=Sum("non_communiants"))
        fideles_par_annee.append({"year": yr, "comm": t["c"] or 0, "noncomm": t["nc"] or 0})

    # ── Top régions par fidèles (annee courante) ─────────────────────────────
    if user.role == "SUPER":
        top_regions_qs = (
            RegionSynodale.objects
            .annotate(
                nb_p=Count("districts__paroisses", distinct=True),
                comm=Sum("districts__paroisses__statistiques__communiants",
                         filter=Q(districts__paroisses__statistiques__annee=annee)),
                noncomm=Sum("districts__paroisses__statistiques__non_communiants",
                            filter=Q(districts__paroisses__statistiques__annee=annee)),
            )
            .order_by("-comm")[:10]
        )
        top_regions = [
            {"name": r.nom, "fideles": (r.comm or 0) + (r.noncomm or 0), "paroisses": r.nb_p}
            for r in top_regions_qs
        ]
    else:
        top_regions = []

    # ── Oeuvres par type ─────────────────────────────────────────────────────
    TYPE_COLORS = {
        "SCOLAIRE":      "#1565C0",
        "UNIVERSITAIRE": "#6A1B9A",
        "MEDICALE":      "#C62828",
        "AGROPASTORALE": "#E65100",
        "IMMEUBLE":      "#455A64",
        "TERRAIN":       "#2E9744",
        "AUTRE":         "#5B9BD5",
    }
    TYPE_LABELS = {
        "SCOLAIRE": "Scolaire", "UNIVERSITAIRE": "Universitaire",
        "MEDICALE": "Médical", "AGROPASTORALE": "Agropastoral",
        "IMMEUBLE": "Immeuble", "TERRAIN": "Terrain", "AUTRE": "Autre",
    }
    oeuvres_par_type = []
    for row in oeuvres_qs.values("type_oeuvre").annotate(count=Count("id")).order_by("type_oeuvre"):
        t = row["type_oeuvre"]
        oeuvres_par_type.append({
            "type": TYPE_LABELS.get(t, t),
            "count": row["count"],
            "color": TYPE_COLORS.get(t, "#888"),
        })

    # ── Niveaux de paroisses par région (top 6) ──────────────────────────────
    niveaux_par_region = []
    if user.role == "SUPER":
        regions_niveaux = (
            RegionSynodale.objects
            .annotate(
                nb_paroisse=Count("districts__paroisses",
                                  filter=Q(districts__paroisses__niveau="PAROISSE"), distinct=True),
                nb_station=Count("districts__paroisses",
                                 filter=Q(districts__paroisses__niveau="STATION"), distinct=True),
                nb_annexe=Count("districts__paroisses",
                                filter=Q(districts__paroisses__niveau="ANNEXE"), distinct=True),
                total=Count("districts__paroisses", distinct=True),
            )
            .order_by("-total")[:6]
        )
        niveaux_par_region = [
            {"name": r.nom, "paroisse": r.nb_paroisse, "station": r.nb_station, "annexe": r.nb_annexe}
            for r in regions_niveaux
        ]

    # ── Validations en attente ───────────────────────────────────────────────
    validations_attente = stats_qs.filter(validee=False).count()

    # ── Activité récente (6 dernières entrées du journal) ────────────────────
    log_qs = LogActivite.objects.select_related("utilisateur").order_by("-created_at")[:6]
    activite_recente = []
    for log in log_qs:
        nom = log.utilisateur.get_full_name() if log.utilisateur else "Système"
        role_disp = log.utilisateur.get_role_display() if log.utilisateur else "Système"
        initials = "".join(p[0].upper() for p in nom.split()[:2]) if nom != "Système" else "SY"
        activite_recente.append({
            "who": nom,
            "role": role_disp,
            "action": log.action,
            "entity": log.objet_nom or log.type_objet,
            "description": log.description,
            "when": log.created_at.strftime("%d/%m %H:%M"),
            "initials": initials,
        })

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
        "validations_attente":   validations_attente,
        "fideles_par_annee":     fideles_par_annee,
        "top_regions":           top_regions,
        "oeuvres_par_type":      oeuvres_par_type,
        "niveaux_par_region":    niveaux_par_region,
        "activite_recente":      activite_recente,
    })


# ---------------------------------------------------------------------------
# RÉINITIALISATION DU MOT DE PASSE (mot de passe oublié)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    POST /api/auth/password-reset/
    Body : { "email": "..." }
    Génère un token et envoie un email avec le lien de réinitialisation.
    En dev (EMAIL_BACKEND console), l'email s'affiche dans les logs backend.
    """
    email = request.data.get("email", "").strip().lower()
    if not email:
        return Response({"detail": "Email requis."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        # Ne pas révéler si l'email existe ou non (sécurité)
        return Response({"detail": "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation."})

    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}/"

    try:
        send_mail(
            subject="Réinitialisation de votre mot de passe — EEC Géolocalisation",
            message=(
                f"Bonjour {user.get_full_name() or user.username},\n\n"
                f"Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
                f"Cliquez sur ce lien pour définir un nouveau mot de passe (valable 1 heure) :\n"
                f"{reset_url}\n\n"
                f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n"
                f"— L'équipe EEC Cameroun"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        # En cas d'erreur SMTP, on renvoie quand même un succès (évite la fuite d'info)
        pass

    return Response({"detail": "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    POST /api/auth/password-reset/confirm/
    Body : { "uid": "...", "token": "...", "new_password": "...", "confirm_password": "..." }
    Valide le token et change le mot de passe.
    """
    uid            = request.data.get("uid", "")
    token          = request.data.get("token", "")
    new_password   = request.data.get("new_password", "")
    confirm        = request.data.get("confirm_password", "")

    if not all([uid, token, new_password, confirm]):
        return Response({"detail": "Tous les champs sont requis."}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm:
        return Response({"detail": "Les mots de passe ne correspondent pas."}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 12:
        return Response({"detail": "Le mot de passe doit contenir au moins 12 caractères."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pk   = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=pk, is_active=True)
    except (TypeError, ValueError, User.DoesNotExist):
        return Response({"detail": "Lien invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "Lien invalide ou expiré (plus d'1 heure)."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.force_password_change = False
    user.save()

    from apps.audit.utils import log_action
    log_action(request, "UPDATE", "user", objet_id=user.id,
               objet_nom=user.get_full_name() or user.username,
               description="Réinitialisation mot de passe via email")

    return Response({"detail": "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter."})
