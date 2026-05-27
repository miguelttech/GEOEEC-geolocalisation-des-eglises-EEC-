from django.db.models import Sum, Count

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import StatistiqueAnnuelle
from .serializers import StatistiqueAnnuelleSerializer
from apps.accounts.permissions import ReadPublicWriteAdmin


class StatistiqueAnnuelleViewSet(viewsets.ModelViewSet):
    """
    Statistiques annuelles par paroisse.

    Filtres :
      ?paroisse={id}
      ?district={id}
      ?region={id}
      ?annee={year}
      ?non_validee=1
    """
    permission_classes = [ReadPublicWriteAdmin]
    serializer_class   = StatistiqueAnnuelleSerializer

    def get_queryset(self):
        qs = (
            StatistiqueAnnuelle.objects
            .select_related(
                "paroisse",
                "paroisse__district",
                "paroisse__district__region",
            )
            .order_by("-annee", "paroisse__nom")
        )
        p = self.request.query_params

        if p.get("paroisse"):
            qs = qs.filter(paroisse_id=p["paroisse"])
        if p.get("district"):
            qs = qs.filter(paroisse__district_id=p["district"])
        if p.get("region"):
            qs = qs.filter(paroisse__district__region_id=p["region"])
        if p.get("annee"):
            qs = qs.filter(annee=p["annee"])
        if p.get("non_validee") == "1":
            qs = qs.filter(validee=False)

        if self.request.user.is_authenticated:
            qs = _filter_stats_by_scope(qs, self.request.user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "PAROISSE" and user.paroisse_id:
            serializer.save(paroisse=user.paroisse)
        else:
            serializer.save()

    def update(self, request, *args, **kwargs):
        stat = self.get_object()
        if not _can_write_stat(request.user, stat):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "SUPER":
            return Response(
                {"detail": "Seul l'administrateur national peut supprimer des statistiques."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    # ------------------------------------------------------------------
    # Actions personnalisées
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="valider",
            permission_classes=[permissions.IsAuthenticated])
    def valider(self, request, pk=None):
        """POST /api/statistiques/{id}/valider/"""
        stat = self.get_object()
        if request.user.role not in ("SUPER", "REGION", "DISTRICT"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        if not _can_write_stat(request.user, stat):
            return Response(status=status.HTTP_403_FORBIDDEN)
        stat.validee = True
        stat.save(update_fields=["validee"])
        return Response({"validee": True})

    @action(detail=False, url_path="totaux")
    def totaux(self, request):
        """GET /api/statistiques/totaux/?annee=2025&region=5 — Totaux agrégés."""
        qs     = self.get_queryset()
        totaux = qs.aggregate(
            total_communiants=Sum("communiants"),
            total_non_communiants=Sum("non_communiants"),
            total_baptemes=Sum("baptemes"),
            total_mariages=Sum("mariages"),
            total_deces=Sum("deces"),
        )
        totaux["total_fideles"] = (
            (totaux["total_communiants"]     or 0)
            + (totaux["total_non_communiants"] or 0)
        )
        totaux["nb_paroisses"] = qs.count()
        return Response(totaux)

    @action(detail=False, url_path="par-annee",
            permission_classes=[permissions.IsAuthenticated])
    def par_annee(self, request):
        """GET /api/statistiques/par-annee/ — Totaux groupés par année."""
        qs     = self.get_queryset()
        result = []
        annees = (
            qs.values("annee")
            .annotate(
                total_communiants=Sum("communiants"),
                total_non_communiants=Sum("non_communiants"),
                total_baptemes=Sum("baptemes"),
            )
            .order_by("-annee")
        )
        for row in annees:
            year_count = qs.filter(annee=row["annee"]).count()
            result.append({
                "annee":                 row["annee"],
                "nb_paroisses":          year_count,
                "total_communiants":     row["total_communiants"]     or 0,
                "total_non_communiants": row["total_non_communiants"] or 0,
                "total_fideles":         (row["total_communiants"] or 0) + (row["total_non_communiants"] or 0),
                "total_baptemes":        row["total_baptemes"]        or 0,
            })
        return Response(result)

    @action(detail=False, url_path="top-paroisses")
    def top_paroisses(self, request):
        """
        GET /api/statistiques/top-paroisses/?annee=2025&limit=10

        Retourne les N paroisses avec le plus grand nombre de fidèles.
        Respecte le scope de l'utilisateur connecté.
        """
        annee = int(request.query_params.get("annee", 2025))
        limit = min(int(request.query_params.get("limit", 10)), 50)

        qs = (
            StatistiqueAnnuelle.objects
            .filter(annee=annee)
            .select_related("paroisse", "paroisse__district", "paroisse__district__region")
            .order_by("-communiants", "-non_communiants")
        )

        if self.request.user.is_authenticated:
            qs = _filter_stats_by_scope(qs, self.request.user)

        result = [
            {
                "rang":            i,
                "paroisse_id":     s.paroisse_id,
                "paroisse_nom":    s.paroisse.nom,
                "district_nom":    s.paroisse.district.nom,
                "region_nom":      s.paroisse.district.region.nom,
                "communiants":     s.communiants,
                "non_communiants": s.non_communiants,
                "total_fideles":   s.communiants + s.non_communiants,
                "annee":           s.annee,
            }
            for i, s in enumerate(qs[:limit], 1)
        ]
        return Response(result)

    @action(detail=False, url_path="performance-regions")
    def performance_regions(self, request):
        """
        GET /api/statistiques/performance-regions/?annee=2025

        Classement des régions par nombre total de fidèles.
        """
        annee = int(request.query_params.get("annee", 2025))

        rows = (
            StatistiqueAnnuelle.objects
            .filter(annee=annee)
            .values(
                "paroisse__district__region",
                "paroisse__district__region__nom",
            )
            .annotate(
                total_communiants=Sum("communiants"),
                total_non_communiants=Sum("non_communiants"),
                total_baptemes=Sum("baptemes"),
                nb_paroisses=Count("paroisse", distinct=True),
            )
            .order_by("-total_communiants")
        )

        result = [
            {
                "rang":                  i,
                "region_id":             row["paroisse__district__region"],
                "region_nom":            row["paroisse__district__region__nom"],
                "nb_paroisses":          row["nb_paroisses"],
                "total_communiants":     row["total_communiants"]     or 0,
                "total_non_communiants": row["total_non_communiants"] or 0,
                "total_fideles":         (row["total_communiants"] or 0) + (row["total_non_communiants"] or 0),
                "total_baptemes":        row["total_baptemes"]        or 0,
                "annee":                 annee,
            }
            for i, row in enumerate(rows, 1)
        ]
        return Response(result)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _filter_stats_by_scope(queryset, user):
    if user.role == "SUPER":
        return queryset
    if user.role == "REGION" and user.region_id:
        return queryset.filter(paroisse__district__region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return queryset.filter(paroisse__district_id=user.district_id)
    if user.role == "PAROISSE" and user.paroisse_id:
        return queryset.filter(paroisse_id=user.paroisse_id)
    return queryset.none()


def _can_write_stat(user, stat):
    if user.role == "SUPER":
        return True
    if user.role == "REGION":
        return stat.paroisse.district.region_id == user.region_id
    if user.role == "DISTRICT":
        return stat.paroisse.district_id == user.district_id
    if user.role == "PAROISSE":
        return stat.paroisse_id == user.paroisse_id
    return False
