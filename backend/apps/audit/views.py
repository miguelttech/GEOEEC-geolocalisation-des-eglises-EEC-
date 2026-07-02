from rest_framework import viewsets, serializers as drf_serializers

from .models import LogActivite
from apps.accounts.permissions import IsAdminUser


class LogActiviteSerializer(drf_serializers.ModelSerializer):
    utilisateur_nom = drf_serializers.SerializerMethodField()
    action_display  = drf_serializers.CharField(source="get_action_display", read_only=True)

    def get_utilisateur_nom(self, obj):
        if obj.utilisateur:
            return obj.utilisateur.get_full_name() or obj.utilisateur.username
        return "Anonyme"

    class Meta:
        model = LogActivite
        fields = [
            "id", "utilisateur", "utilisateur_nom",
            "action", "action_display",
            "type_objet", "objet_id", "objet_nom",
            "description", "ip_address", "created_at",
        ]


class LogActiviteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/audit/journal/      — liste paginée des logs
    GET /api/audit/journal/{id}/ — détail d'un log

    Filtres :
      ?action=LOGIN|LOGOUT|CREATE|UPDATE|DELETE|IMPORT|EXPORT
      ?type_objet=paroisse|district|oeuvre|ouvrier|user|statistique
      ?utilisateur={id}
      ?date_debut=YYYY-MM-DD
      ?date_fin=YYYY-MM-DD
    """
    # Journal réservé aux administrateurs agréés (jamais un VISITEUR),
    # chacun limité à SA zone via _managed_user_ids ci-dessous.
    permission_classes = [IsAdminUser]
    serializer_class   = LogActiviteSerializer

    def get_queryset(self):
        qs = (
            LogActivite.objects
            .select_related("utilisateur")
            .order_by("-created_at")
        )
        p = self.request.query_params

        if p.get("action"):
            qs = qs.filter(action=p["action"])
        if p.get("type_objet"):
            qs = qs.filter(type_objet=p["type_objet"])
        if p.get("utilisateur"):
            qs = qs.filter(utilisateur_id=p["utilisateur"])
        if p.get("date_debut"):
            qs = qs.filter(created_at__date__gte=p["date_debut"])
        if p.get("date_fin"):
            qs = qs.filter(created_at__date__lte=p["date_fin"])

        # REGION/DISTRICT ne voient que les logs de leurs sous-admins
        user = self.request.user
        if user.role != "SUPER":
            qs = qs.filter(utilisateur_id__in=_managed_user_ids(user))

        return qs


def _managed_user_ids(user):
    from apps.accounts.models import User
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
