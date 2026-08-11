from django.db.models import Count, Q

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Grade, Ouvrier
from .serializers import (
    GradeSerializer,
    OuvrierListSerializer,
    OuvrierWriteSerializer,
    OuvrierAffectationSerializer,
)
from apps.accounts.permissions import (
    ReadPublicWriteAdmin,
    filter_ouvriers_by_scope,
)


# ---------------------------------------------------------------------------
# Grades — référence stable, lecture publique uniquement
# ---------------------------------------------------------------------------

class GradeViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = GradeSerializer

    def get_queryset(self):
        # EXIGENCE : nb_ouvriers doit refléter le scope de l'admin connecté
        # (comme OuvrierViewSet via filter_ouvriers_by_scope) — sinon un
        # admin régional/district/paroissial voit des totaux nationaux
        # alors que sa liste d'ouvriers, elle, est bien filtrée.
        user = self.request.user
        ouvrier_filter = Q()
        if getattr(user, "is_authenticated", False) and getattr(user, "is_admin", False):
            if user.role == "REGION" and user.region_id:
                ouvrier_filter = Q(ouvriers__paroisse__district__region_id=user.region_id)
            elif user.role == "DISTRICT" and user.district_id:
                ouvrier_filter = Q(ouvriers__paroisse__district_id=user.district_id)
            elif user.role == "PAROISSE" and user.paroisse_id:
                ouvrier_filter = Q(ouvriers__paroisse_id=user.paroisse_id)
            # SUPER → aucun filtre, comptage national (comme filter_ouvriers_by_scope)

        return (
            Grade.objects
            .annotate(nb_ouvriers=Count("ouvriers", filter=ouvrier_filter, distinct=True))
            .order_by("niveau")
        )


# ---------------------------------------------------------------------------
# Ouvriers — lecture publique, CRUD avec RBAC
# ---------------------------------------------------------------------------

class OuvrierViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return OuvrierWriteSerializer
        if self.action in ("update", "partial_update"):
            # EXIGENCE : l'identité d'un ouvrier n'est jamais modifiable ;
            # seule son affectation (paroisse unique) peut changer.
            return OuvrierAffectationSerializer
        return OuvrierListSerializer

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

    def create(self, request, *args, **kwargs):
        """EXIGENCE : un ouvrier ne peut être créé QUE dans la zone de l'admin.
          · SUPER    → partout
          · RÉGION   → paroisse de SA région
          · DISTRICT → paroisse de SON district
          · PAROISSE → SA paroisse (forcée dans perform_create)"""
        user = request.user
        paroisse_id = request.data.get("paroisse")
        if user.role in ("REGION", "DISTRICT") and paroisse_id:
            from apps.geo.models import Paroisse
            p = Paroisse.objects.filter(id=paroisse_id).select_related("district").first()
            if p is None:
                return Response({"detail": "Paroisse introuvable."},
                                status=status.HTTP_400_BAD_REQUEST)
            if user.role == "REGION" and p.district.region_id != user.region_id:
                return Response(
                    {"detail": "Cette paroisse n'est pas dans votre région : "
                               "vous ne pouvez créer un ouvrier que dans votre zone."},
                    status=status.HTTP_403_FORBIDDEN)
            if user.role == "DISTRICT" and p.district_id != user.district_id:
                return Response(
                    {"detail": "Cette paroisse n'est pas dans votre district : "
                               "vous ne pouvez créer un ouvrier que dans votre zone."},
                    status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

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
        # La réaffectation vers une paroisse cible doit AUSSI rester dans la zone
        paroisse_id = request.data.get("paroisse")
        if paroisse_id and request.user.role in ("REGION", "DISTRICT"):
            from apps.geo.models import Paroisse
            p = Paroisse.objects.filter(id=paroisse_id).select_related("district").first()
            if p is None:
                return Response({"detail": "Paroisse introuvable."},
                                status=status.HTTP_400_BAD_REQUEST)
            if request.user.role == "REGION" and p.district.region_id != request.user.region_id:
                return Response({"detail": "Réaffectation refusée : paroisse hors de votre région."},
                                status=status.HTTP_403_FORBIDDEN)
            if request.user.role == "DISTRICT" and p.district_id != request.user.district_id:
                return Response({"detail": "Réaffectation refusée : paroisse hors de votre district."},
                                status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # EXIGENCE : la suppression d'un ouvrier n'existe plus — pour AUCUN rôle.
        return Response(
            {"detail": "La suppression d'un ouvrier est définitivement désactivée."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, url_path="stats", permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        """GET /api/ouvriers/ouvriers/stats/ — répartition par grade et statut."""
        qs = self.get_queryset()
        total = qs.count()
        par_statut = {
            s: qs.filter(statut=s).count()
            for s in ("OCCUPE", "INOCCUPE")
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
