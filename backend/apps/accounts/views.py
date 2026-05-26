from django.db.models import Sum

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
      ?paroisse={id}    — stats d'une paroisse
      ?district={id}    — stats d'un district
      ?region={id}      — stats d'une région
      ?annee={year}     — année précise
      ?non_validee=1    — uniquement les stats non validées
    """
    permission_classes = [ReadPublicWriteAdmin]
    serializer_class = StatistiqueAnnuelleSerializer

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
        params = self.request.query_params

        paroisse_id = params.get("paroisse")
        if paroisse_id:
            qs = qs.filter(paroisse_id=paroisse_id)

        district_id = params.get("district")
        if district_id:
            qs = qs.filter(paroisse__district_id=district_id)

        region_id = params.get("region")
        if region_id:
            qs = qs.filter(paroisse__district__region_id=region_id)

        annee = params.get("annee")
        if annee:
            qs = qs.filter(annee=annee)

        if params.get("non_validee") == "1":
            qs = qs.filter(validee=False)

        # Scope : les admins ne voient que leurs propres données
        if self.request.user.is_authenticated:
            qs = _filter_stats_by_scope(qs, self.request.user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Un admin PAROISSE ne peut créer des stats que pour sa propre paroisse
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

    @action(detail=True, methods=["post"], url_path="valider",
            permission_classes=[permissions.IsAuthenticated])
    def valider(self, request, pk=None):
        """POST /api/statistiques/{id}/valider/ — marque la stat comme validée."""
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
        """GET /api/statistiques/totaux/?annee=2025&region=5 — totaux agrégés."""
        qs = self.get_queryset()
        totaux = qs.aggregate(
            total_communiants=Sum("communiants"),
            total_non_communiants=Sum("non_communiants"),
            total_baptemes=Sum("baptemes"),
            total_mariages=Sum("mariages"),
            total_deces=Sum("deces"),
        )
        totaux["total_fideles"] = (
            (totaux["total_communiants"] or 0)
            + (totaux["total_non_communiants"] or 0)
        )
        totaux["nb_paroisses"] = qs.count()
        return Response(totaux)

    @action(detail=False, url_path="par-annee", permission_classes=[permissions.IsAuthenticated])
    def par_annee(self, request):
        """GET /api/statistiques/par-annee/ — totaux groupés par année."""
        qs = self.get_queryset()
        annees = (
            qs.values("annee")
            .annotate(
                total_communiants=Sum("communiants"),
                total_non_communiants=Sum("non_communiants"),
                total_baptemes=Sum("baptemes"),
                nb_paroisses=Sum("id"),  # compte les lignes
            )
            .order_by("-annee")
        )
        # Recalcule nb_paroisses correctement
        result = []
        for row in annees:
            year_qs = qs.filter(annee=row["annee"])
            result.append({
                "annee": row["annee"],
                "nb_paroisses": year_qs.count(),
                "total_communiants": row["total_communiants"] or 0,
                "total_non_communiants": row["total_non_communiants"] or 0,
                "total_fideles": (row["total_communiants"] or 0) + (row["total_non_communiants"] or 0),
                "total_baptemes": row["total_baptemes"] or 0,
            })
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
