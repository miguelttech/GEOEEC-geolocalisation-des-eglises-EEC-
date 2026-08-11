from rest_framework.permissions import BasePermission, SAFE_METHODS

# Rôles d'administration agréés — un VISITEUR n'est JAMAIS un admin.
ADMIN_ROLES = ("SUPER", "REGION", "DISTRICT", "PAROISSE")


def is_admin_role(user) -> bool:
    """Vrai uniquement pour un compte administrateur agréé (jamais VISITEUR)."""
    return bool(user and user.is_authenticated and user.role in ADMIN_ROLES)


class IsAdminUser(BasePermission):
    """Utilisateur authentifié avec un compte admin EEC (VISITEUR exclu)."""
    def has_permission(self, request, view):
        return is_admin_role(request.user)


class IsSuperAdmin(BasePermission):
    """Accès réservé au Super Administrateur National."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SUPER"
        )


class IsRegionOrAbove(BasePermission):
    """SUPER ou REGION."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER", "REGION")
        )


class IsDistrictOrAbove(BasePermission):
    """SUPER, REGION ou DISTRICT."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER", "REGION", "DISTRICT")
        )


class ReadPublicWriteAdmin(BasePermission):
    """
    Lecture publique (sans authentification).
    Écriture STRICTEMENT réservée aux administrateurs agréés — un compte
    VISITEUR authentifié ne peut RIEN écrire (exigence de sécurité).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_admin_role(request.user)


class ReadPublicWriteSuperOnly(BasePermission):
    """
    Lecture publique (sans authentification) — pour les Actualités.
    Écriture strictement réservée au Super Administrateur National (un admin
    régional/district/paroisse n'a pas vocation à publier au grand public).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SUPER"
        )


# ---------------------------------------------------------------------------
# Helpers de filtrage de queryset selon le scope de l'utilisateur
# ---------------------------------------------------------------------------

def filter_by_scope(queryset, user, region_field="district__region", district_field="district"):
    """
    Filtre un queryset selon la portée géographique de l'utilisateur.

    - SUPER    → pas de filtre (tout voir)
    - REGION   → filtre sur sa région
    - DISTRICT → filtre sur son district
    - PAROISSE → filtre sur sa paroisse (via district)

    `region_field` et `district_field` permettent d'adapter le chemin ORM
    selon le modèle (ex: Paroisse → district__region, Oeuvre → district__region).
    """
    # Visiteur / rôle non-administrateur → données publiques complètes (comme un anonyme)
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset

    if user.role == "REGION" and user.region_id:
        return queryset.filter(**{f"{region_field}_id": user.region_id})

    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(**{f"{district_field}_id": user.district_id})

    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(id=user.paroisse_id)

    return queryset.none()


def filter_districts_by_scope(queryset, user):
    """Filtre spécialisé pour le modèle District — un admin REGION/DISTRICT/
    PAROISSE ne doit voir que les districts de sa propre zone."""
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(id=user.district_id)
    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(paroisses__id=user.paroisse_id)
    return queryset.none()


def filter_paroisses_by_scope(queryset, user):
    """Filtre spécialisé pour le modèle Paroisse."""
    # Visiteur / rôle non-administrateur → données publiques complètes (comme un anonyme)
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(district__region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(district_id=user.district_id)
    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(id=user.paroisse_id)
    return queryset.none()


def filter_oeuvres_by_scope(queryset, user):
    """Filtre spécialisé pour le modèle Oeuvre.

    Une œuvre peut être rattachée à une paroisse, un district OU une région
    (voire aucun des trois = œuvre NATIONALE). Le scope d'un admin couvre
    TOUS les rattachements situés dans sa zone — ex. un admin régional voit
    les œuvres régionales, celles des districts ET celles des paroisses de
    sa région (bug corrigé : seul le rattachement direct était couvert).
    Les œuvres nationales ne sont visibles en gestion que par le SUPER.
    """
    from django.db.models import Q

    # Visiteur / rôle non-administrateur → données publiques complètes (comme un anonyme)
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(
            Q(region_id=user.region_id)
            | Q(district__region_id=user.region_id)
            | Q(paroisse__district__region_id=user.region_id)
        )
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(
            Q(district_id=user.district_id)
            | Q(paroisse__district_id=user.district_id)
        )
    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(paroisse_id=user.paroisse_id)
    return queryset.none()


def filter_ouvriers_by_scope(queryset, user):
    """Filtre spécialisé pour le modèle Ouvrier."""
    # Visiteur / rôle non-administrateur → données publiques complètes (comme un anonyme)
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(paroisse__district__region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(paroisse__district_id=user.district_id)
    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(paroisse_id=user.paroisse_id)
    return queryset.none()


def can_delete_paroisse(user):
    return user.role == "SUPER" or (
        user.role == "REGION" and user.has_custom_perm("peut_supprimer_paroisse")
    )


def can_delete_ouvrier(user):
    return user.role in ("SUPER", "REGION")


def can_manage_accounts(user):
    return user.role in ("SUPER", "REGION", "DISTRICT")


def managed_user_ids(user):
    """
    Renvoie les IDs des comptes que `user` a le droit de superviser :
    lui-même, plus ses sous-administrateurs directs (REGION → admins DISTRICT
    de sa région ; DISTRICT → admins PAROISSE de son district). Un SUPER n'a
    pas besoin de ce filtre (accès global).

    Utilisé pour scoper par zone tout ce qui liste des actions/activités
    d'utilisateurs (journal d'audit, tableau de bord) — évite qu'un admin
    REGION/DISTRICT ne voie l'activité d'une autre zone.
    """
    from .models import User

    base = [user.id]
    if user.role == "REGION" and user.region_id:
        sub = list(
            User.objects
            .filter(region=user.region)
            .exclude(role="SUPER")
            .values_list("id", flat=True)
        )
        return base + sub
    if user.role == "DISTRICT" and user.district_id:
        sub = list(
            User.objects
            .filter(district=user.district, role="PAROISSE")
            .values_list("id", flat=True)
        )
        return base + sub
    return base
