from django.db.models import Count

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TypeOeuvre, Oeuvre
from .serializers import TypeOeuvreSerializer, OeuvreListSerializer, OeuvreWriteSerializer
from apps.accounts.permissions import (
    ReadPublicWriteAdmin,
    filter_oeuvres_by_scope,
)


# ---------------------------------------------------------------------------
# Types d'oeuvres — référence stable, lecture publique uniquement
# ---------------------------------------------------------------------------

class TypeOeuvreViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = TypeOeuvreSerializer

    def get_queryset(self):
        return TypeOeuvre.objects.annotate(nb_oeuvres=Count("oeuvres")).order_by("nom")


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
        if self.action in ("create", "update", "partial_update"):
            return OeuvreWriteSerializer
        return OeuvreListSerializer

    def create(self, request, *args, **kwargs):
        """EXIGENCE : une œuvre appartient obligatoirement à une zone, et
        chaque admin ne peut créer QUE dans SA zone.
          · SUPER    → partout, y compris œuvre NATIONALE (aucun rattachement)
          · RÉGION   → rattachement dans SA région (région, district ou paroisse de la région)
          · DISTRICT → rattachement dans SON district (district ou paroisse du district)
          · PAROISSE → SA paroisse uniquement
        La validation se fait AVANT la création (aucun contournement possible)."""
        user = request.user
        data = request.data

        def _err(msg):
            return Response({"detail": msg}, status=status.HTTP_403_FORBIDDEN)

        paroisse_id = data.get("paroisse")
        district_id = data.get("district")
        region_id = data.get("region")

        if user.role != "SUPER":
            # Œuvre nationale (aucun rattachement) : SUPER uniquement
            if not (paroisse_id or district_id or region_id):
                return _err("Seul l'administrateur général peut créer une œuvre nationale.")

            if user.role == "REGION":
                if region_id and int(region_id) != user.region_id:
                    return _err("Cette région n'est pas la vôtre.")
                if district_id:
                    from apps.geo.models import District
                    d = District.objects.filter(id=district_id).first()
                    if not d or d.region_id != user.region_id:
                        return _err("Ce district n'est pas dans votre région.")
                if paroisse_id:
                    from apps.geo.models import Paroisse
                    p = Paroisse.objects.filter(id=paroisse_id).select_related("district").first()
                    if not p or p.district.region_id != user.region_id:
                        return _err("Cette paroisse n'est pas dans votre région.")
            elif user.role == "DISTRICT":
                if region_id:
                    return _err("Un admin de district ne peut pas créer d'œuvre régionale.")
                if district_id and int(district_id) != user.district_id:
                    return _err("Ce district n'est pas le vôtre.")
                if paroisse_id:
                    from apps.geo.models import Paroisse
                    p = Paroisse.objects.filter(id=paroisse_id).first()
                    if not p or p.district_id != user.district_id:
                        return _err("Cette paroisse n'est pas dans votre district.")
            elif user.role == "PAROISSE":
                if region_id or district_id:
                    return _err("Un admin paroissial ne peut créer que des œuvres de sa paroisse.")
                if paroisse_id and int(paroisse_id) != user.paroisse_id:
                    return _err("Cette paroisse n'est pas la vôtre.")

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        # Si l'admin scopé n'a fourni aucun rattachement précis, on rattache
        # par défaut à son propre niveau (jamais hors zone — validé dans create()).
        data = self.request.data
        if not (data.get("paroisse") or data.get("district") or data.get("region")):
            if user.role == "PAROISSE" and user.paroisse_id:
                extra["paroisse"] = user.paroisse
            elif user.role == "DISTRICT" and user.district_id:
                extra["district"] = user.district
            elif user.role == "REGION" and user.region_id:
                extra["region"] = user.region
            # SUPER sans rattachement = œuvre NATIONALE (les 3 FK restent nuls)
        serializer.save(**extra)

    # EXIGENCE : en MODIFICATION, seuls le nom, le téléphone et l'adresse
    # sont modifiables. Le GPS et le rattachement administratif : JAMAIS.
    CHAMPS_MODIFIABLES = {"nom", "telephone", "adresse"}

    def update(self, request, *args, **kwargs):
        oeuvre = self.get_object()
        if not _can_write_oeuvre(request.user, oeuvre):
            return Response(status=status.HTTP_403_FORBIDDEN)
        interdits = set(request.data.keys()) - self.CHAMPS_MODIFIABLES
        if interdits:
            return Response(
                {"detail": "Seuls le nom, le téléphone et l'adresse d'une œuvre "
                           f"sont modifiables. Champs refusés : {sorted(interdits)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # EXIGENCE : la suppression d'une œuvre n'existe plus — pour AUCUN rôle.
        return Response(
            {"detail": "La suppression d'une œuvre est définitivement désactivée."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

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
    """Vérifie que l'admin a le droit d'écrire sur cette œuvre.
    Résout la RÉGION/le DISTRICT effectifs via la chaîne de rattachement
    (une œuvre paroissiale appartient aussi à son district et sa région)."""
    if user.role == "SUPER":
        return True

    # Région / district effectifs de l'œuvre selon son rattachement
    if oeuvre.paroisse_id:
        eff_district_id = oeuvre.paroisse.district_id
        eff_region_id = oeuvre.paroisse.district.region_id
    elif oeuvre.district_id:
        eff_district_id = oeuvre.district_id
        eff_region_id = oeuvre.district.region_id
    else:
        eff_district_id = None
        eff_region_id = oeuvre.region_id          # None = œuvre nationale

    if user.role == "REGION":
        return eff_region_id == user.region_id
    if user.role == "DISTRICT":
        return eff_district_id == user.district_id
    if user.role == "PAROISSE":
        return oeuvre.paroisse_id == user.paroisse_id
    return False
