from datetime import timedelta

from django.db.models import Count, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.models import User
from apps.geo.models import RegionSynodale
from .models import ParoisseVue, RechercheHistorique, ItinerairePersonnel
from .permissions import CanSeeAnalytics


def _since(days):
    return timezone.now() - timedelta(days=days)


@api_view(["GET"])
@permission_classes([CanSeeAnalytics])
def top_paroisses(request):
    """
    GET /api/analytics/paroisses/top/
    Query params : ?region=<id>&limit=10&periode=30
    Top paroisses les plus consultées (ParoisseVue).
    Les admins REGION voient uniquement leur région.
    """
    limit   = min(int(request.query_params.get("limit",  10)), 50)
    periode = min(int(request.query_params.get("periode", 30)), 365)
    depuis  = _since(periode)

    qs = ParoisseVue.objects.filter(vue_at__gte=depuis)

    # Restriction automatique pour les admins REGION
    if request.user.role == "REGION" and request.user.region:
        qs = qs.filter(paroisse__district__region=request.user.region)
    elif request.query_params.get("region"):
        try:
            region = RegionSynodale.objects.get(pk=request.query_params["region"])
            qs = qs.filter(paroisse__district__region=region)
        except RegionSynodale.DoesNotExist:
            return Response({"detail": "Région introuvable."}, status=status.HTTP_404_NOT_FOUND)

    rows = (
        qs
        .values("paroisse__id", "paroisse__nom", "paroisse__district__nom", "paroisse__district__region__nom")
        .annotate(nb_vues=Count("id"))
        .order_by("-nb_vues")[:limit]
    )

    return Response([
        {
            "paroisse_id":  r["paroisse__id"],
            "paroisse_nom": r["paroisse__nom"],
            "district":     r["paroisse__district__nom"],
            "region":       r["paroisse__district__region__nom"],
            "nb_vues":      r["nb_vues"],
        }
        for r in rows
    ])


@api_view(["GET"])
@permission_classes([CanSeeAnalytics])
def visiteurs_stats(request):
    """
    GET /api/analytics/visiteurs/stats/
    Statistiques globales sur les visiteurs authentifiés.
    """
    now        = timezone.now()
    debut_mois = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    visiteurs_qs = User.objects.filter(role="VISITEUR")

    nb_total         = visiteurs_qs.count()
    nb_nouveaux_mois = visiteurs_qs.filter(date_joined__gte=debut_mois).count()
    nb_actifs_mois   = visiteurs_qs.filter(last_login__gte=debut_mois).count()

    nb_consultations_mois = ParoisseVue.objects.filter(vue_at__gte=debut_mois).count()
    nb_itineraires_mois   = ItinerairePersonnel.objects.filter(created_at__gte=debut_mois).count()
    nb_recherches_mois    = RechercheHistorique.objects.filter(created_at__gte=debut_mois).count()

    return Response({
        "nb_inscrits_total":       nb_total,
        "nb_nouveaux_ce_mois":     nb_nouveaux_mois,
        "nb_actifs_ce_mois":       nb_actifs_mois,
        "nb_consultations_ce_mois": nb_consultations_mois,
        "nb_itineraires_ce_mois":  nb_itineraires_mois,
        "nb_recherches_ce_mois":   nb_recherches_mois,
    })


@api_view(["GET"])
@permission_classes([CanSeeAnalytics])
def courbe_activite(request):
    """
    GET /api/analytics/activite/courbe/?jours=30
    Courbe journalière : nb_consultations, nb_recherches, nb_itineraires par jour.
    """
    jours  = min(int(request.query_params.get("jours", 30)), 365)
    depuis = _since(jours)

    vues = (
        ParoisseVue.objects
        .filter(vue_at__gte=depuis)
        .annotate(jour=TruncDate("vue_at"))
        .values("jour")
        .annotate(nb=Count("id"))
    )
    recherches = (
        RechercheHistorique.objects
        .filter(created_at__gte=depuis)
        .annotate(jour=TruncDate("created_at"))
        .values("jour")
        .annotate(nb=Count("id"))
    )
    itineraires = (
        ItinerairePersonnel.objects
        .filter(created_at__gte=depuis)
        .annotate(jour=TruncDate("created_at"))
        .values("jour")
        .annotate(nb=Count("id"))
    )

    # Fusion en dict {date: {...}}
    data = {}
    for row in vues:
        d = str(row["jour"])
        data.setdefault(d, {"date": d, "nb_consultations": 0, "nb_recherches": 0, "nb_itineraires": 0})
        data[d]["nb_consultations"] = row["nb"]
    for row in recherches:
        d = str(row["jour"])
        data.setdefault(d, {"date": d, "nb_consultations": 0, "nb_recherches": 0, "nb_itineraires": 0})
        data[d]["nb_recherches"] = row["nb"]
    for row in itineraires:
        d = str(row["jour"])
        data.setdefault(d, {"date": d, "nb_consultations": 0, "nb_recherches": 0, "nb_itineraires": 0})
        data[d]["nb_itineraires"] = row["nb"]

    return Response(sorted(data.values(), key=lambda x: x["date"]))


@api_view(["GET"])
@permission_classes([CanSeeAnalytics])
def itineraires_stats(request):
    """
    GET /api/analytics/itineraires/stats/
    Statistiques globales des itinéraires calculés.
    """
    qs = ItinerairePersonnel.objects.all()

    nb_total         = qs.count()
    distance_moyenne = qs.aggregate(moy=Avg("distance_km"))["moy"]

    top_destinations = (
        qs
        .values("arrivee_paroisse__id", "arrivee_paroisse__nom", "arrivee_paroisse__district__region__nom")
        .annotate(nb=Count("id"))
        .order_by("-nb")[:10]
    )

    return Response({
        "nb_total":          nb_total,
        "distance_moyenne_km": round(distance_moyenne, 2) if distance_moyenne else None,
        "destinations_frequentes": [
            {
                "paroisse_id":  r["arrivee_paroisse__id"],
                "paroisse_nom": r["arrivee_paroisse__nom"],
                "region":       r["arrivee_paroisse__district__region__nom"],
                "nb_itineraires": r["nb"],
            }
            for r in top_destinations
        ],
    })


@api_view(["GET"])
@permission_classes([CanSeeAnalytics])
def recherches_tendances(request):
    """
    GET /api/analytics/recherches/tendances/?periode=30
    Queries les plus fréquentes et filtres les plus utilisés.
    """
    periode = min(int(request.query_params.get("periode", 30)), 365)
    depuis  = _since(periode)

    qs = RechercheHistorique.objects.filter(created_at__gte=depuis)

    # Top 20 queries non vides
    top_queries = (
        qs
        .exclude(query="")
        .values("query")
        .annotate(nb=Count("id"))
        .order_by("-nb")[:20]
    )

    # Régions les plus recherchées (filtre region dans filtres JSON)
    top_regions = (
        qs
        .exclude(filtres__region=None)
        .values("filtres__region")
        .annotate(nb=Count("id"))
        .order_by("-nb")[:10]
    )

    # Types d'oeuvres les plus filtrés
    top_types = (
        qs
        .exclude(filtres__type_oeuvre=None)
        .values("filtres__type_oeuvre")
        .annotate(nb=Count("id"))
        .order_by("-nb")[:10]
    )

    return Response({
        "top_queries":  [{"query": r["query"], "nb": r["nb"]} for r in top_queries],
        "top_regions":  [{"region": r["filtres__region"], "nb": r["nb"]} for r in top_regions],
        "top_types":    [{"type_oeuvre": r["filtres__type_oeuvre"], "nb": r["nb"]} for r in top_types],
    })
