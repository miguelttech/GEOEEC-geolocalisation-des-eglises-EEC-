from rest_framework import viewsets, permissions

from .models import TypeOeuvre, Oeuvre
from .serializers import TypeOeuvreSerializer, OeuvreListSerializer, OeuvreDetailSerializer


class TypeOeuvreViewSet(viewsets.ReadOnlyModelViewSet):
    """7 types d'oeuvres (Scolaire, Médicale, Universitaire…)"""
    permission_classes = [permissions.AllowAny]
    queryset = TypeOeuvre.objects.order_by("nom")
    serializer_class = TypeOeuvreSerializer


class OeuvreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Oeuvres de l'EEC (311 au total).

    Filtres disponibles :
      ?type={id}      — par type d'oeuvre
      ?region={id}    — oeuvres régionales d'une région
      ?district={id}  — oeuvres d'un district
      ?paroisse={id}  — oeuvres d'une paroisse
      ?avec_gps=1     — uniquement les oeuvres géolocalisées
    """
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            Oeuvre.objects
            .select_related("type_oeuvre", "paroisse", "district", "region",
                            "paroisse__district", "paroisse__district__region",
                            "district__region")
            .order_by("type_oeuvre__nom", "nom")
        )
        params = self.request.query_params

        type_id = params.get("type")
        if type_id:
            qs = qs.filter(type_oeuvre_id=type_id)

        region_id = params.get("region")
        if region_id:
            qs = qs.filter(region_id=region_id)

        district_id = params.get("district")
        if district_id:
            qs = qs.filter(district_id=district_id)

        paroisse_id = params.get("paroisse")
        if paroisse_id:
            qs = qs.filter(paroisse_id=paroisse_id)

        if params.get("avec_gps") == "1":
            qs = qs.exclude(position__isnull=True)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OeuvreDetailSerializer
        return OeuvreListSerializer
