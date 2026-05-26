from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TypeOeuvre, Oeuvre
from .serializers import TypeOeuvreSerializer, OeuvreListSerializer, OeuvreDetailSerializer
from apps.accounts.permissions import (
    ReadPublicWriteAdmin,
    filter_oeuvres_by_scope,
)


# ---------------------------------------------------------------------------
# Types d'oeuvres — référence stable, lecture publique uniquement
# ---------------------------------------------------------------------------

class TypeOeuvreViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = TypeOeuvre.objects.order_by("nom")
    serializer_class = TypeOeuvreSerializer


# ---------------------------------------------------------------------------
# Oeuvres — lecture publique, CRUD avec RBAC
# ---------------------------------------------------------------------------

class OeuvreViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]

    def get_queryset(self):
        qs = (
            Oeuvre.objects
            .select_related(
                "type_oeuvre",
                "paroisse", "paroisse__district", "paroisse__district__region",
                "district", "district__region",
                "region",
            )
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

        search = params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)

        if params.get("avec_gps") == "1":
            qs = qs.exclude(position__isnull=True)

        if params.get("sans_gps") == "1":
            qs = qs.filter(position__isnull=True)

        active = params.get("active")
        if active == "1":
            qs = qs.filter(est_active=True)
        elif active == "0":
            qs = qs.filter(est_active=False)

        if self.request.user.is_authenticated:
            qs = filter_oeuvres_by_scope(qs, self.request.user)

        return qs

    def get_serializer_class(self):
        if self.action in ("retrieve", "create", "update", "partial_update"):
            return OeuvreDetailSerializer
        return OeuvreListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.role == "PAROISSE" and user.paroisse_id:
            extra["paroisse"] = user.paroisse
        elif user.role == "DISTRICT" and user.district_id:
            extra["district"] = user.district
        elif user.role == "REGION" and user.region_id:
            extra["region"] = user.region
        serializer.save(**extra)

    def update(self, request, *args, **kwargs):
        oeuvre = self.get_object()
        if not _can_write_oeuvre(request.user, oeuvre):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        oeuvre = self.get_object()
        user = request.user
        if user.role not in ("SUPER", "REGION"):
            return Response(
                {"detail": "Seuls les admins régionaux et nationaux peuvent supprimer une oeuvre."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _can_write_oeuvre(user, oeuvre):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, url_path="sans-gps", permission_classes=[permissions.IsAuthenticated])
    def sans_gps(self, request):
        """GET /api/oeuvres/oeuvres/sans-gps/ — oeuvres sans coordonnées GPS."""
        qs = self.get_queryset().filter(position__isnull=True)
        return Response(OeuvreListSerializer(qs, many=True).data)

    @action(detail=False, url_path="stats-completion", permission_classes=[permissions.IsAuthenticated])
    def stats_completion(self, request):
        """GET /api/oeuvres/oeuvres/stats-completion/ — taux de complétion GPS."""
        qs = self.get_queryset()
        total = qs.count()
        avec_gps = qs.filter(position__isnull=False).count()
        return Response({
            "total": total,
            "avec_gps": avec_gps,
            "sans_gps": total - avec_gps,
            "pct_gps": round(avec_gps / total * 100, 1) if total else 0,
        })


def _can_write_oeuvre(user, oeuvre):
    """Vérifie que l'admin a le droit d'écrire sur cette oeuvre."""
    if user.role == "SUPER":
        return True
    if user.role == "REGION":
        return oeuvre.region_id == user.region_id
    if user.role == "DISTRICT":
        return oeuvre.district_id == user.district_id
    if user.role == "PAROISSE":
        return oeuvre.paroisse_id == user.paroisse_id
    return False
