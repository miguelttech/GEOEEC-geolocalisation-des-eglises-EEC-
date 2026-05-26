from django.db.models import Count

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Grade, Ouvrier
from .serializers import GradeSerializer, OuvrierSerializer
from apps.accounts.permissions import (
    ReadPublicWriteAdmin,
    filter_ouvriers_by_scope,
    can_delete_ouvrier,
)


# ---------------------------------------------------------------------------
# Grades — référence stable, lecture publique uniquement
# ---------------------------------------------------------------------------

class GradeViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = GradeSerializer

    def get_queryset(self):
        return (
            Grade.objects
            .annotate(nb_ouvriers=Count("ouvriers"))
            .order_by("niveau")
        )


# ---------------------------------------------------------------------------
# Ouvriers — lecture publique, CRUD avec RBAC
# ---------------------------------------------------------------------------

class OuvrierViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]
    serializer_class = OuvrierSerializer

    def get_queryset(self):
        qs = (
            Ouvrier.objects
            .select_related(
                "grade",
                "paroisse",
                "paroisse__district",
                "paroisse__district__region",
            )
            .order_by("nom", "prenom")
        )
        params = self.request.query_params

        grade_id = params.get("grade")
        if grade_id:
            qs = qs.filter(grade_id=grade_id)

        paroisse_id = params.get("paroisse")
        if paroisse_id:
            qs = qs.filter(paroisse_id=paroisse_id)

        district_id = params.get("district")
        if district_id:
            qs = qs.filter(paroisse__district_id=district_id)

        region_id = params.get("region")
        if region_id:
            qs = qs.filter(paroisse__district__region_id=region_id)

        search = params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)

        statut = params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)

        sexe = params.get("sexe")
        if sexe:
            qs = qs.filter(sexe=sexe)

        if self.request.user.is_authenticated:
            qs = filter_ouvriers_by_scope(qs, self.request.user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.role == "PAROISSE" and user.paroisse_id:
            extra["paroisse"] = user.paroisse
        serializer.save(**extra)

    def update(self, request, *args, **kwargs):
        ouvrier = self.get_object()
        if not _can_write_ouvrier(request.user, ouvrier):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        ouvrier = self.get_object()
        user = request.user
        if not can_delete_ouvrier(user):
            return Response(
                {"detail": "Vous n'avez pas la permission de supprimer un ouvrier."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _can_write_ouvrier(user, ouvrier):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, url_path="stats", permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        """GET /api/ouvriers/ouvriers/stats/ — répartition par grade et statut."""
        qs = self.get_queryset()
        total = qs.count()
        par_statut = {
            s: qs.filter(statut=s).count()
            for s in ("ACTIF", "RETRAITE", "SUSPENDU", "DECEDE")
        }
        return Response({
            "total": total,
            "par_statut": par_statut,
        })


def _can_write_ouvrier(user, ouvrier):
    """Vérifie que l'admin a le droit d'écrire sur cet ouvrier."""
    if user.role == "SUPER":
        return True
    if user.role == "REGION":
        return ouvrier.paroisse.district.region_id == user.region_id
    if user.role == "DISTRICT":
        return ouvrier.paroisse.district_id == user.district_id
    if user.role == "PAROISSE":
        return ouvrier.paroisse_id == user.paroisse_id
    return False
