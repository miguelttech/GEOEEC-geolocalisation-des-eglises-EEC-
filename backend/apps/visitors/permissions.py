from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsVisiteur(BasePermission):
    """Réservé aux visiteurs authentifiés (role == VISITEUR)."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "VISITEUR"
        )


class IsAuthentifiedUser(BasePermission):
    """
    Visiteurs authentifiés ET administrateurs.
    Utilisé pour les fonctionnalités communes aux deux (historique,
    itinéraires, paroisse la plus proche, paroisse affiliée, favoris).
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("VISITEUR", "SUPER", "REGION", "DISTRICT", "PAROISSE")
        )


class CanSeeAnalytics(BasePermission):
    """
    Accès aux statistiques visiteurs.
    Réservé aux administrateurs SUPER et REGION uniquement.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER", "REGION")
        )


class IsOwnerOrAdmin(BasePermission):
    """
    L'utilisateur peut accéder/modifier uniquement ses propres données.
    Les admins SUPER peuvent tout voir.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == "SUPER":
            return True
        return obj.utilisateur == request.user
