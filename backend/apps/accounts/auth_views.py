from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.db.models import Sum
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, StatistiqueAnnuelle
from .permissions import can_manage_accounts, IsAdminUser
from .serializers import UserSerializer, UserCreateSerializer
from .throttles import LoginRateThrottle, PasswordResetRateThrottle


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

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET   /api/auth/me/ — Retourne l'utilisateur courant avec son scope.
    PATCH /api/auth/me/ — Ne permet de modifier QUE le thème d'affichage
                          (nom, rôle, périmètre : jamais modifiables par
                          l'utilisateur lui-même — exigence Paramètres).
    """
    if request.method == "PATCH":
        theme = request.data.get("theme")
        if theme not in ("clair", "sombre"):
            return Response({"detail": "theme doit valoir 'clair' ou 'sombre'."},
                            status=status.HTTP_400_BAD_REQUEST)
        request.user.theme = theme
        request.user.save(update_fields=["theme"])

    return Response(UserSerializer(request.user, context={"request": request}).data)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """
    POST   /api/auth/me/avatar/ — multipart/form-data, champ « file ».
           Valide le type et la taille via Pillow, redimensionne (max 512×512),
           remplace l'ancienne photo, renvoie l'URL absolue de la nouvelle image.
    DELETE /api/auth/me/avatar/ — supprime la photo de profil courante.
    """
    from PIL import Image, UnidentifiedImageError
    from django.core.files.base import ContentFile
    import io

    if request.method == "DELETE":
        from apps.audit.utils import log_action
        user = request.user
        if user.avatar:
            user.avatar.delete(save=True)
        log_action(request, "UPDATE", "user", objet_id=user.id,
                   objet_nom=user.get_full_name(), description="Photo de profil supprimée")
        return Response(UserSerializer(user, context={"request": request}).data)

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Champ 'file' manquant."}, status=status.HTTP_400_BAD_REQUEST)

    MAX_SIZE = 5 * 1024 * 1024  # 5 Mo
    if file_obj.size > MAX_SIZE:
        return Response({"detail": "Image trop volumineuse (5 Mo maximum)."},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        img = Image.open(file_obj)
        img.verify()                      # détecte les fichiers corrompus/non-image
        file_obj.seek(0)
        img = Image.open(file_obj)        # verify() consomme l'image : on la rouvre
        img = img.convert("RGB")
    except (UnidentifiedImageError, OSError):
        return Response({"detail": "Fichier image invalide."}, status=status.HTTP_400_BAD_REQUEST)

    img.thumbnail((512, 512))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    buf.seek(0)

    user = request.user
    if user.avatar:
        user.avatar.delete(save=False)    # supprime l'ancien fichier du disque
    user.avatar.save(f"user_{user.id}.jpg", ContentFile(buf.read()), save=True)

    from apps.audit.utils import log_action
    log_action(request, "UPDATE", "user", objet_id=user.id,
               objet_nom=user.get_full_name(), description="Photo de profil modifiée")

    return Response(UserSerializer(user, context={"request": request}).data)


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
@permission_classes([IsAdminUser])
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
@permission_classes([IsAdminUser])
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
        # ── Envoi AUTOMATIQUE du mot de passe généré par e-mail ──────────
        email_ok = False
        try:
            send_mail(
                subject="EEC Géolocalisation — votre compte administrateur",
                message=(
                    f"Bonjour {new_user.get_full_name() or new_user.username},\n\n"
                    f"Votre compte administrateur ({new_user.get_role_display()}) vient d'être créé "
                    f"sur la plateforme de géolocalisation de l'Église Évangélique du Cameroun.\n\n"
                    f"Identifiant : {new_user.username}\n"
                    f"Mot de passe : {new_user._generated_password}\n\n"
                    f"Ce mot de passe est généré automatiquement. Il vous sera demandé "
                    f"de le changer à votre première connexion.\n\n"
                    f"— Plateforme EEC Géolocalisation"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[new_user.email],
                fail_silently=False,
            )
            email_ok = True
        except Exception:
            # Le compte existe mais l'e-mail n'est pas parti (SMTP non joignable) :
            # on l'indique au créateur pour qu'il transmette le mot de passe autrement.
            pass
        payload = UserSerializer(new_user).data
        payload["email_envoye"] = email_ok
        if not email_ok:
            payload["mot_de_passe_genere"] = new_user._generated_password
            payload["detail"] = ("Compte créé, mais l'e-mail n'a pas pu être envoyé "
                                 "(vérifier la configuration SMTP). Transmettez ce mot de passe manuellement.")
        return Response(payload, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
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
        # EXIGENCE : seul l'administrateur national (SUPER) peut supprimer
        # d'autres administrateurs. Aucun autre niveau n'a ce droit.
        if user.role != "SUPER":
            return Response(
                {"detail": "Seul l'administrateur national peut supprimer un compte."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if target.role == "SUPER" or target == user:
            return Response(
                {"detail": "Cette opération n'est pas autorisée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # EXIGENCE : suppression effective, immédiate et définitive — pas une
        # simple désactivation. Le journal d'audit conserve la trace (l'entrée
        # ci-dessous est enregistrée AVANT la suppression, avec utilisateur=SET_NULL
        # sur les logs déjà existants de ce compte).
        target_id, target_nom = target.id, target.get_full_name() or target.username
        log_action(request, "DELETE", "user", objet_id=target_id,
                   objet_nom=target_nom, description="Suppression définitive du compte")
        target.delete()
        return Response({"detail": "Compte supprimé définitivement."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
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
@permission_classes([IsAdminUser])
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
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """GET /api/auth/dashboard-stats/ — Compteurs et données agrégées pour le tableau de bord."""
    from django.db.models import Count, Q
    from apps.geo.models import RegionSynodale, District, Paroisse
    from apps.oeuvres.models import Oeuvre
    from apps.ouvriers.models import Ouvrier
    from apps.audit.models import LogActivite

    user = request.user

    from .permissions import filter_oeuvres_by_scope, managed_user_ids

    if user.role == "SUPER":
        paroisses_qs = Paroisse.objects.all()
        oeuvres_qs   = Oeuvre.objects.all()
        ouvriers_qs  = Ouvrier.objects.all()
        stats_qs     = StatistiqueAnnuelle.objects.all()
    elif user.role == "REGION" and user.region_id:
        paroisses_qs = Paroisse.objects.filter(district__region_id=user.region_id)
        # Scope œuvres via le filtre central (couvre les rattachements
        # région + district + paroisse de la zone — bug du rattachement
        # direct corrigé)
        oeuvres_qs   = filter_oeuvres_by_scope(Oeuvre.objects.all(), user)
        ouvriers_qs  = Ouvrier.objects.filter(paroisse__district__region_id=user.region_id)
        stats_qs     = StatistiqueAnnuelle.objects.filter(paroisse__district__region_id=user.region_id)
    elif user.role == "DISTRICT" and user.district_id:
        paroisses_qs = Paroisse.objects.filter(district_id=user.district_id)
        oeuvres_qs   = filter_oeuvres_by_scope(Oeuvre.objects.all(), user)
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
    # EXIGENCE : le nombre officiel de districts est 137 (fixe). Les districts
    # techniques « NON PRÉCISÉ » (créés pour héberger les paroisses officielles
    # en attente de rattachement) sont EXCLUS de tous les comptages.
    districts_reels = District.objects.exclude(nom="NON PRÉCISÉ")
    nb_districts = (
        districts_reels.count() if user.role == "SUPER"
        else (districts_reels.filter(region=user.region).count() if user.role == "REGION" else 1)
    )

    # ── Évolution fidèles par année ──────────────────────────────────────────
    # EXIGENCE : ne conserver que les années réellement renseignées (2024, 2025) —
    # pas d'années obsolètes/vides affichées comme si elles étaient réelles.
    annees_range = [2024, 2025]
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
    # BUGFIX : values("type_oeuvre") renvoyait l'ID de la FK (labels numériques,
    # couleur grise) — on agrège sur le NOM du type pour retrouver couleurs/libellés.
    for row in oeuvres_qs.values("type_oeuvre__nom").annotate(count=Count("id")).order_by("-count"):
        t = row["type_oeuvre__nom"]
        oeuvres_par_type.append({
            "type": TYPE_LABELS.get(t, t or "Autre"),
            "count": row["count"],
            "color": TYPE_COLORS.get(t, "#888"),
        })

    # ── EXIGENCE : top 10 des paroisses ayant le plus de fidèles ────────────
    top_paroisses_fideles = [
        {"name": p["nom"], "fideles": p["nombre_fideles"]}
        for p in paroisses_qs.exclude(nombre_fideles__isnull=True)
                             .order_by("-nombre_fideles")
                             .values("nom", "nombre_fideles")[:10]
    ]

    # ── EXIGENCE : œuvres par région ET par type (compte SUPER) ─────────────
    oeuvres_par_region = []
    if user.role == "SUPER":
        compte: dict = {}
        for o in oeuvres_qs.select_related(
                "type_oeuvre", "paroisse__district__region", "district__region", "region"):
            if o.paroisse_id:
                reg = o.paroisse.district.region.nom
            elif o.district_id:
                reg = o.district.region.nom
            else:
                reg = o.region.nom if o.region_id else "National"
            t = o.type_oeuvre.nom if o.type_oeuvre_id else "AUTRE"
            compte.setdefault(reg, {"name": reg, "total": 0})
            compte[reg][t] = compte[reg].get(t, 0) + 1
            compte[reg]["total"] += 1
        oeuvres_par_region = sorted(compte.values(), key=lambda r: -r["total"])[:12]

    # ── Catégories de paroisses par région (top 6) ───────────────────────────
    # Regroupées en 3 familles pour le graphique : A (A++, A1, A2),
    # B (B1, B2), C (C1 à C4) — catégories officielles R05/CSG.
    categories_par_region = []
    if user.role == "SUPER":
        regions_cats = (
            RegionSynodale.objects
            .annotate(
                nb_a=Count("districts__paroisses",
                           filter=Q(districts__paroisses__categorie__in=["A++", "A1", "A2"]), distinct=True),
                nb_b=Count("districts__paroisses",
                           filter=Q(districts__paroisses__categorie__in=["B1", "B2"]), distinct=True),
                nb_c=Count("districts__paroisses",
                           filter=Q(districts__paroisses__categorie__in=["C1", "C2", "C3", "C4"]), distinct=True),
                total=Count("districts__paroisses", distinct=True),
            )
            .order_by("-total")[:6]
        )
        categories_par_region = [
            {"name": r.nom, "cat_a": r.nb_a, "cat_b": r.nb_b, "cat_c": r.nb_c}
            for r in regions_cats
        ]

    # ── Validations en attente ───────────────────────────────────────────────
    validations_attente = stats_qs.filter(validee=False).count()

    # ── Activité récente (6 dernières entrées du journal) ────────────────────
    # Scopée par zone comme /api/audit/journal/ : un admin REGION/DISTRICT ne
    # doit voir que l'activité de ses propres sous-administrateurs, jamais
    # celle d'une autre région/district (SEC-3, audit du 20/07/2026).
    log_qs = LogActivite.objects.select_related("utilisateur").order_by("-created_at")
    if user.role != "SUPER":
        log_qs = log_qs.filter(utilisateur_id__in=managed_user_ids(user))
    log_qs = log_qs[:6]
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
        "top_paroisses_fideles": top_paroisses_fideles,
        "oeuvres_par_region":    oeuvres_par_region,
        "categories_par_region": categories_par_region,
        "activite_recente":      activite_recente,
    })


# ---------------------------------------------------------------------------
# RÉINITIALISATION DU MOT DE PASSE (mot de passe oublié)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def password_reset_request(request):
    """
    POST /api/auth/password-reset/
    Body : { "email": "..." }
    EXIGENCE : pas de lien de réinitialisation — un nouveau mot de passe est
    généré immédiatement et envoyé directement par e-mail (même mécanisme
    que la création de compte). L'utilisateur devra le changer à sa prochaine
    connexion (force_password_change=True).
    """
    import secrets
    import string
    from apps.audit.utils import log_action

    email = request.data.get("email", "").strip().lower()
    if not email:
        return Response({"detail": "Email requis."}, status=status.HTTP_400_BAD_REQUEST)

    generic_response = Response({
        "detail": "Si cet email est associé à un compte, un nouveau mot de passe vient de vous être envoyé."
    })

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        # Ne pas révéler si l'email existe ou non (sécurité)
        return generic_response

    alphabet = string.ascii_letters + string.digits + "!#%*+-"
    new_password = "".join(secrets.choice(alphabet) for _ in range(16))
    user.set_password(new_password)
    user.force_password_change = True
    user.save()

    log_action(request, "UPDATE", "user", objet_id=user.id,
               objet_nom=user.get_full_name() or user.username,
               description="Mot de passe réinitialisé via 'mot de passe oublié'")

    try:
        send_mail(
            subject="Votre nouveau mot de passe — EEC Géolocalisation",
            message=(
                f"Bonjour {user.get_full_name() or user.username},\n\n"
                f"Vous avez demandé la réinitialisation de votre mot de passe sur la "
                f"plateforme de géolocalisation de l'Église Évangélique du Cameroun.\n\n"
                f"Identifiant : {user.username}\n"
                f"Nouveau mot de passe : {new_password}\n\n"
                f"Ce mot de passe est temporaire. Il vous sera demandé de le changer "
                f"à votre prochaine connexion.\n\n"
                f"Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement "
                f"votre administrateur.\n\n"
                f"— Plateforme EEC Géolocalisation"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        # En cas d'erreur SMTP, le mot de passe a déjà été changé en base —
        # on ne le révèle pas dans la réponse (évite la fuite d'info), mais
        # on ne fait pas non plus échouer la requête (évite de révéler l'échec SMTP).
        pass

    return generic_response


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
