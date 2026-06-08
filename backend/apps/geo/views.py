from django.db.models import Count

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RegionSynodale, District, Paroisse
from .serializers import (
    RegionSynodaleSerializer,
    RegionSynodaleListSerializer,
    DistrictSerializer,
    ParoisseListSerializer,
    ParoisseDetailSerializer,
    ParoisseWriteSerializer,
)
from apps.accounts.permissions import (
    ReadPublicWriteAdmin,
    filter_paroisses_by_scope,
    can_delete_paroisse,
)


# ---------------------------------------------------------------------------
# Régions — lecture publique, pas de CRUD (entités stables de l'EEC)
# ---------------------------------------------------------------------------

class RegionSynodaleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            RegionSynodale.objects
            .annotate(
                nb_districts=Count("districts", distinct=True),
                nb_paroisses=Count("districts__paroisses", distinct=True),
            )
            .order_by("nom")
        )

    def get_serializer_class(self):
        return RegionSynodaleSerializer

    @action(detail=False, url_path="liste")
    def liste(self, request):
        """GET /api/geo/regions/liste/ — sans géométrie, pour dropdowns et tableau admin."""
        qs = (
            RegionSynodale.objects
            .annotate(
                nb_districts=Count("districts", distinct=True),
                nb_paroisses=Count("districts__paroisses", distinct=True),
            )
            .order_by("nom")
        )
        return Response(RegionSynodaleListSerializer(qs, many=True).data)


# ---------------------------------------------------------------------------
# Districts — lecture publique, CRUD réservé admin
# ---------------------------------------------------------------------------

class DistrictViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]
    serializer_class = DistrictSerializer

    def get_queryset(self):
        qs = (
            District.objects
            .select_related("region")
            .annotate(nb_paroisses=Count("paroisses", distinct=True))
            .order_by("region__nom", "nom")
        )
        region_id = self.request.query_params.get("region")
        if region_id:
            qs = qs.filter(region_id=region_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_super_admin:
            return Response(
                {"detail": "Seul l'administrateur national peut supprimer un district."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Paroisses — lecture publique, CRUD complet avec RBAC
# ---------------------------------------------------------------------------

class ParoisseViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]

    def get_queryset(self):
        qs = (
            Paroisse.objects
            .select_related("district", "district__region")
            .order_by("district__region__nom", "district__nom", "nom")
        )
        params = self.request.query_params

        district_id = params.get("district")
        if district_id:
            qs = qs.filter(district_id=district_id)

        region_id = params.get("region")
        if region_id:
            qs = qs.filter(district__region_id=region_id)

        search = params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)

        if params.get("avec_gps") == "1":
            qs = qs.exclude(position__isnull=True)

        if params.get("sans_gps") == "1":
            qs = qs.filter(position__isnull=True)

        niveau = params.get("niveau")
        if niveau:
            qs = qs.filter(niveau=niveau)

        # Pour les admins : filtrer par leur scope
        if self.request.user.is_authenticated:
            qs = filter_paroisses_by_scope(qs, self.request.user)

        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ParoisseWriteSerializer
        if self.action == "retrieve":
            return ParoisseDetailSerializer
        return ParoisseListSerializer

    def perform_create(self, serializer):
        # Forcer le district/région selon le scope de l'admin
        user = self.request.user
        extra = {}
        if user.role == "DISTRICT" and user.district:
            extra["district"] = user.district
        serializer.save(**extra)

    def update(self, request, *args, **kwargs):
        paroisse = self.get_object()
        user = request.user
        # Vérifier que l'admin a le droit de modifier cette paroisse
        if not _can_write_paroisse(user, paroisse):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        paroisse = self.get_object()
        user = request.user
        if not can_delete_paroisse(user):
            return Response(
                {"detail": "Vous n'avez pas la permission de supprimer une paroisse."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _can_write_paroisse(user, paroisse):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, url_path="sans-gps", permission_classes=[permissions.IsAuthenticated])
    def sans_gps(self, request):
        """GET /api/geo/paroisses/sans-gps/ — liste des paroisses sans coordonnées GPS."""
        qs = self.get_queryset().filter(position__isnull=True)
        return Response(ParoisseDetailSerializer(qs, many=True).data)

    @action(detail=False, url_path="stats-completion", permission_classes=[permissions.IsAuthenticated])
    def stats_completion(self, request):
        """GET /api/geo/paroisses/stats-completion/ — score de complétude."""
        qs = self.get_queryset()
        total = qs.count()
        avec_gps = qs.filter(position__isnull=False).count()
        return Response({
            "total": total,
            "avec_gps": avec_gps,
            "sans_gps": total - avec_gps,
            "pct_gps": round(avec_gps / total * 100, 1) if total else 0,
        })


def _can_write_paroisse(user, paroisse):
    """Vérifie que l'admin peut écrire sur cette paroisse spécifique."""
    if user.role == "SUPER":
        return True
    if user.role == "REGION":
        return paroisse.district.region_id == user.region_id
    if user.role == "DISTRICT":
        return paroisse.district_id == user.district_id
    if user.role == "PAROISSE":
        return paroisse.id == user.paroisse_id
    return False
