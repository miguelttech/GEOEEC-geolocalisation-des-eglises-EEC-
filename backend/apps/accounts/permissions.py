from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Utilisateur authentifié avec un compte admin EEC."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


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
    Écriture réservée aux admins authentifiés.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


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
    """Filtre spécialisé pour le modèle Oeuvre."""
    # Visiteur / rôle non-administrateur → données publiques complètes (comme un anonyme)
    if not getattr(user, "is_admin", False):
        return queryset

    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(district_id=user.district_id)
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
