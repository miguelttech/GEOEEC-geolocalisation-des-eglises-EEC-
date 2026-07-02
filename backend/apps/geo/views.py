import json

from django.db.models import Count, Func, Value, F, Q
from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.functions import AsGeoJSON

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
)


class STSimplify(Func):
    """ST_Simplify(geom, tolerance) de PostGIS — réduit le nombre de sommets
    des polygones → payload beaucoup plus léger."""
    function = "ST_Simplify"
    output_field = GeometryField()


# ---------------------------------------------------------------------------
# Régions — lecture publique, pas de CRUD (entités stables de l'EEC)
# ---------------------------------------------------------------------------

class RegionSynodaleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return (
            RegionSynodale.objects
            .annotate(
                nb_districts=Count("districts", filter=~Q(districts__nom="NON PRÉCISÉ"), distinct=True),
                nb_paroisses=Count("districts__paroisses", distinct=True),
            )
            .order_by("nom")
        )

    def get_serializer_class(self):
        return RegionSynodaleSerializer

    def list(self, request, *args, **kwargs):
        """GET /api/geo/regions/ — FeatureCollection GeoJSON des 22 régions synodales.
        La géométrie est SIMPLIFIÉE et convertie en GeoJSON directement par PostGIS
        (ST_Simplify + ST_AsGeoJSON) → réponse légère et quasi instantanée
        (vs ~6,5 Mo / 16 s avec les polygones bruts)."""
        qs = self.get_queryset().annotate(
            geojson=AsGeoJSON(STSimplify(F("geometrie"), Value(0.002)), precision=5)
        )
        features = [
            {
                "type": "Feature",
                "id": r.id,
                "geometry": json.loads(r.geojson) if r.geojson else None,
                "properties": {
                    "id": r.id, "nom": r.nom, "code": r.code,
                    "nb_districts": r.nb_districts, "nb_paroisses": r.nb_paroisses,
                },
            }
            for r in qs
        ]
        return Response({"type": "FeatureCollection", "features": features})

    @action(detail=False, url_path="liste")
    def liste(self, request):
        """GET /api/geo/regions/liste/ — sans géométrie, pour dropdowns et
        tableau admin. Enrichi avec fidèles et ouvriers par région (toutes les
        statistiques réellement disponibles)."""
        from django.db.models import Sum
        from apps.ouvriers.models import Ouvrier

        qs = (
            RegionSynodale.objects
            .annotate(
                nb_districts=Count("districts", filter=~Q(districts__nom="NON PRÉCISÉ"), distinct=True),
                nb_paroisses=Count("districts__paroisses", distinct=True),
            )
            .order_by("nom")
        )
        data = RegionSynodaleListSerializer(qs, many=True).data
        fideles = {r["district__region"]: r["total"] or 0
                   for r in Paroisse.objects.values("district__region").annotate(total=Sum("nombre_fideles"))}
        ouvriers = {r["paroisse__district__region"]: r["n"]
                    for r in Ouvrier.objects.values("paroisse__district__region").annotate(n=Count("id"))}
        for d in data:
            d["nb_fideles"] = fideles.get(d["id"], 0)
            d["nb_ouvriers"] = ouvriers.get(d["id"], 0)
        return Response(data)


# ---------------------------------------------------------------------------
# Districts — lecture publique, CRUD réservé admin
# ---------------------------------------------------------------------------

class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    """EXIGENCE : il est IMPOSSIBLE de modifier ou supprimer un district
    (comme une région). Lecture seule pour tout le monde."""
    permission_classes = [ReadPublicWriteAdmin]
    serializer_class = DistrictSerializer

    def get_queryset(self):
        from django.db.models import OuterRef, Subquery, Sum, IntegerField
        from apps.ouvriers.models import Ouvrier

        # Sous-requêtes (évitent la multiplication des lignes par jointures croisées)
        fideles_sq = (Paroisse.objects.filter(district=OuterRef("pk"))
                      .values("district").annotate(t=Sum("nombre_fideles")).values("t")[:1])
        ouvriers_sq = (Ouvrier.objects.filter(paroisse__district=OuterRef("pk"))
                       .values("paroisse__district").annotate(n=Count("id")).values("n")[:1])
        # EXIGENCE : le nombre de districts est FIXE (137). Les districts
        # techniques « NON PRÉCISÉ » n'apparaissent ni dans la liste ni
        # dans les compteurs.
        qs = (
            District.objects
            .exclude(nom="NON PRÉCISÉ")
            .select_related("region")
            .annotate(
                nb_paroisses=Count("paroisses", distinct=True),
                nb_fideles=Subquery(fideles_sq, output_field=IntegerField()),
                nb_ouvriers=Subquery(ouvriers_sq, output_field=IntegerField()),
            )
            .order_by("region__nom", "nom")
        )
        region_id = self.request.query_params.get("region")
        if region_id:
            qs = qs.filter(region_id=region_id)
        return qs



# ---------------------------------------------------------------------------
# Paroisses — lecture publique, CRUD complet avec RBAC
# ---------------------------------------------------------------------------

class ParoisseViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]

    def get_queryset(self):
        from django.db.models import OuterRef, Subquery
        from apps.accounts.models import StatistiqueAnnuelle

        # Statistique de l'année la plus récente (communiants / non-communiants)
        derniere_stat = (StatistiqueAnnuelle.objects
                         .filter(paroisse=OuterRef("pk"))
                         .order_by("-annee"))
        qs = (
            Paroisse.objects
            .select_related("district", "district__region")
            .annotate(
                nb_ouvriers=Count("ouvriers", distinct=True),
                communiants=Subquery(derniere_stat.values("communiants")[:1]),
                non_communiants=Subquery(derniere_stat.values("non_communiants")[:1]),
            )
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

        categorie = params.get("categorie")
        if categorie:
            qs = qs.filter(categorie=categorie)

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

    def create(self, request, *args, **kwargs):
        # EXIGENCE : SEUL l'Administrateur Général peut créer une paroisse.
        if request.user.role != "SUPER":
            return Response(
                {"detail": "Seul l'administrateur général peut créer une paroisse."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    # Champs modifiables sur une paroisse existante — EXIGENCE : uniquement
    # le NOM (+ l'état de prospection). District, région, position, catégorie,
    # statistiques : verrouillés en modification.
    CHAMPS_MODIFIABLES = {"nom", "en_prospection"}

    def update(self, request, *args, **kwargs):
        paroisse = self.get_object()
        user = request.user
        if not _can_write_paroisse(user, paroisse):
            return Response(status=status.HTTP_403_FORBIDDEN)
        interdits = set(request.data.keys()) - self.CHAMPS_MODIFIABLES
        if interdits:
            return Response(
                {"detail": "Seul le nom (et l'état de prospection) d'une paroisse "
                           f"peut être modifié. Champs refusés : {sorted(interdits)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # EXIGENCE : il est IMPOSSIBLE de supprimer une paroisse — pour TOUS
        # les niveaux d'administration, y compris l'administrateur général.
        return Response(
            {"detail": "La suppression d'une paroisse est définitivement désactivée."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

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
