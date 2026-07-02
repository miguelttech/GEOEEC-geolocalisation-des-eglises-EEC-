"""
Statistiques (refonte) — deux onglets exigés :
  1. Statistiques GLOBALES  : GET /api/stats/globales/
  2. Statistiques VISITEURS : GET /api/stats/visiteurs/

Toutes les données sont calculées en base — AUCUNE valeur fictive.
Chaque endpoint est scopé à la zone de l'utilisateur (comme le dashboard).
Baptêmes/mariages/décès/progression volontairement EXCLUS (exigence).
"""
from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .permissions import IsAdminUser, filter_oeuvres_by_scope, filter_ouvriers_by_scope
from .models import User
from apps.geo.models import RegionSynodale, District, Paroisse
from apps.oeuvres.models import Oeuvre
from apps.ouvriers.models import Ouvrier
from apps.audit.models import LogActivite


def _scope_paroisses(user):
    if user.role == "SUPER":
        return Paroisse.objects.all()
    if user.role == "REGION" and user.region_id:
        return Paroisse.objects.filter(district__region_id=user.region_id)
    if user.role == "DISTRICT" and user.district_id:
        return Paroisse.objects.filter(district_id=user.district_id)
    if user.role == "PAROISSE" and user.paroisse_id:
        return Paroisse.objects.filter(id=user.paroisse_id)
    return Paroisse.objects.none()


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_globales(request):
    """
    GET /api/stats/globales/ — onglet 1 : chiffres réels de la plateforme,
    scopés à la zone de l'administrateur.
    """
    user = request.user
    paroisses_qs = _scope_paroisses(user)
    oeuvres_qs   = filter_oeuvres_by_scope(Oeuvre.objects.all(), user)
    ouvriers_qs  = filter_ouvriers_by_scope(Ouvrier.objects.all(), user)

    is_super = user.role == "SUPER"

    # Comptages simples (le nb de districts/régions n'a de sens qu'au global)
    nb_regions = RegionSynodale.objects.count() if is_super else (1 if user.role in ("REGION",) else 0)
    nb_districts = (
        District.objects.exclude(nom="NON PRÉCISÉ").count() if is_super
        else (District.objects.filter(region_id=user.region_id).exclude(nom="NON PRÉCISÉ").count()
              if user.role == "REGION" else (1 if user.role == "DISTRICT" else 0))
    )
    nb_admins = User.objects.exclude(role="VISITEUR").count() if is_super else None

    # Répartition des paroisses par région (SUPER uniquement — vue globale)
    par_region = []
    if is_super:
        for r in RegionSynodale.objects.annotate(
                nb=Count("districts__paroisses", distinct=True)).order_by("-nb")[:15]:
            par_region.append({"name": r.nom, "value": r.nb})

    # Répartition des paroisses par district (scope courant)
    par_district = [
        {"name": row["district__nom"], "value": row["n"]}
        for row in paroisses_qs.values("district__nom").annotate(n=Count("id")).order_by("-n")[:15]
    ]

    return Response({
        "scope": user.get_scope_label(),
        "role": user.role,
        "nb_regions": nb_regions,
        "nb_districts": nb_districts,
        "nb_paroisses": paroisses_qs.count(),
        "nb_oeuvres": oeuvres_qs.count(),
        "nb_ouvriers": ouvriers_qs.count(),
        "nb_admins": nb_admins,
        "paroisses_par_region": par_region,
        "paroisses_par_district": par_district,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_visiteurs(request):
    """
    GET /api/stats/visiteurs/ — onglet 2 : comportement RÉEL des visiteurs,
    entièrement basé sur les modèles déjà persistés (aucune donnée simulée) :
    ConsultationCarte, ParoisseVue, FavoriCarte, ItinerairePersonnel,
    RechercheHistorique, LogActivite (connexions), User.last_login.
    """
    from apps.visitors.models import (
        ConsultationCarte, ParoisseVue, FavoriCarte,
        ItinerairePersonnel, RechercheHistorique,
    )

    user = request.user
    now = timezone.now()
    today = now.date()
    month_start = today.replace(day=1)

    # Scope : SUPER voit tout ; les autres se limitent à leur zone géographique
    # (consultations/favoris/itinéraires concernant des paroisses de leur zone).
    paroisse_ids = None
    if user.role != "SUPER":
        paroisse_ids = set(_scope_paroisses(user).values_list("id", flat=True))

    def _filter_entite(qs):
        if paroisse_ids is None:
            return qs
        return qs.filter(type_entite="paroisse", entite_id__in=paroisse_ids)

    # Régions/districts/paroisses les plus consultées (ConsultationCarte)
    cons = _filter_entite(ConsultationCarte.objects.filter(type_entite="paroisse"))
    top_paroisses_ids = list(
        cons.values("entite_id").annotate(n=Count("id")).order_by("-n")[:10]
    )
    par_map = {p.id: p for p in Paroisse.objects.filter(
        id__in=[r["entite_id"] for r in top_paroisses_ids]).select_related("district__region")}
    top_paroisses = [
        {"name": par_map[r["entite_id"]].nom, "value": r["n"]}
        for r in top_paroisses_ids if r["entite_id"] in par_map
    ]

    # Districts / régions les plus consultés (dérivés de ParoisseVue)
    vues = ParoisseVue.objects.select_related("paroisse__district__region")
    if paroisse_ids is not None:
        vues = vues.filter(paroisse_id__in=paroisse_ids)
    district_counts, region_counts = {}, {}
    for v in vues.only("paroisse__district__nom", "paroisse__district__region__nom"):
        d = v.paroisse.district
        district_counts[d.nom] = district_counts.get(d.nom, 0) + 1
        region_counts[d.region.nom] = region_counts.get(d.region.nom, 0) + 1
    top_districts = sorted(
        ({"name": k, "value": v} for k, v in district_counts.items()),
        key=lambda x: -x["value"])[:10]
    top_regions = sorted(
        ({"name": k, "value": v} for k, v in region_counts.items()),
        key=lambda x: -x["value"])[:10]

    # Œuvres les plus consultées
    cons_oeuvres = _filter_entite(ConsultationCarte.objects.filter(type_entite="oeuvre")) \
        if paroisse_ids is None else ConsultationCarte.objects.none()  # œuvres hors scope géo simple
    if paroisse_ids is None:
        top_oeuvres_ids = list(
            cons_oeuvres.values("entite_id").annotate(n=Count("id")).order_by("-n")[:10]
        )
        oeu_map = {o.id: o for o in Oeuvre.objects.filter(
            id__in=[r["entite_id"] for r in top_oeuvres_ids])}
        top_oeuvres = [
            {"name": oeu_map[r["entite_id"]].nom, "value": r["n"]}
            for r in top_oeuvres_ids if r["entite_id"] in oeu_map
        ]
    else:
        top_oeuvres = []

    # Favoris les plus enregistrés (paroisses)
    favoris = FavoriCarte.objects.filter(type_entite="paroisse")
    if paroisse_ids is not None:
        favoris = favoris.filter(entite_id__in=paroisse_ids)
    top_fav_ids = list(favoris.values("entite_id").annotate(n=Count("id")).order_by("-n")[:10])
    fav_map = {p.id: p for p in Paroisse.objects.filter(
        id__in=[r["entite_id"] for r in top_fav_ids])}
    top_favoris = [
        {"name": fav_map[r["entite_id"]].nom, "value": r["n"]}
        for r in top_fav_ids if r["entite_id"] in fav_map
    ]

    # Itinéraires les plus utilisés (destination la plus demandée)
    itin = ItinerairePersonnel.objects.select_related("arrivee_paroisse")
    if paroisse_ids is not None:
        itin = itin.filter(arrivee_paroisse_id__in=paroisse_ids)
    top_itin = [
        {"name": row["arrivee_paroisse__nom"], "value": row["n"]}
        for row in itin.values("arrivee_paroisse__nom")
                      .annotate(n=Count("id")).order_by("-n")[:10]
        if row["arrivee_paroisse__nom"]
    ]

    # Connexions (LogActivite action=LOGIN) — global uniquement (pas de notion
    # de zone pertinente pour les connexions elles-mêmes)
    connexions_total = LogActivite.objects.filter(action="LOGIN").count() if user.role == "SUPER" else None
    visiteurs_actifs = User.objects.filter(
        role="VISITEUR", last_login__date=today).count()
    visiteurs_quotidiens = User.objects.filter(
        role="VISITEUR", last_login__date=today).count()
    visiteurs_mensuels = User.objects.filter(
        role="VISITEUR", last_login__date__gte=month_start).count()
    recherches_total = RechercheHistorique.objects.count() if user.role == "SUPER" else None

    return Response({
        "scope": user.get_scope_label(),
        "role": user.role,
        "top_regions": top_regions,
        "top_districts": top_districts,
        "top_paroisses": top_paroisses,
        "top_oeuvres": top_oeuvres,
        "top_favoris": top_favoris,
        "top_itineraires": top_itin,
        "connexions_total": connexions_total,
        "recherches_total": recherches_total,
        "visiteurs_actifs_jour": visiteurs_actifs,
        "visiteurs_quotidiens": visiteurs_quotidiens,
        "visiteurs_mensuels": visiteurs_mensuels,
    })
