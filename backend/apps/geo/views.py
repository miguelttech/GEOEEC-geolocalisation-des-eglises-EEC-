"""
=============================================================================
FICHIER N°13 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/geo/views.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/geo/serializers.py (doit exister avant)
           apps/geo/models.py
UTILISÉ PAR: eec_core/urls.py
=============================================================================

OBJECTIF :
  Définir la logique des endpoints géographiques de l'API.
  Quand le frontend appelle /api/geo/paroisses/, ce fichier détermine :
    - Quelles données récupérer depuis la base
    - Quels filtres appliquer
    - Quel serializer utiliser pour formater la réponse

QU'EST-CE QU'UN ViewSet ?
  Un ViewSet = une classe Python qui gère automatiquement deux types d'appels :
    - list()     : GET /api/geo/paroisses/      → retourne TOUTES les paroisses
    - retrieve() : GET /api/geo/paroisses/5/    → retourne SEULEMENT la paroisse n°5
  On n'a pas besoin d'écrire deux fonctions séparées.

QU'EST-CE QUE ReadOnlyModelViewSet ?
  Un ViewSet qui accepte UNIQUEMENT les requêtes en lecture (GET).
  Il refuse automatiquement POST (créer), PUT (modifier), DELETE (supprimer).
  Pour l'instant, les utilisateurs peuvent seulement LIRE les données.
  Les modifications se font via l'interface d'administration Django (/admin/).

VIEWS DÉFINIES ICI :
  1. RegionSynodaleViewSet → /api/geo/regions/
  2. DistrictViewSet        → /api/geo/districts/
  3. ParoisseViewSet        → /api/geo/paroisses/
=============================================================================
"""

# Count : fonction SQL pour compter des enregistrements liés
# Exemple : Count("districts") dans une requête région → donne le nombre de districts
from django.db.models import Count

# viewsets : classes de base pour les ViewSets DRF
# permissions : contrôle qui peut accéder à l'API
from rest_framework import viewsets, permissions

# action : décorateur pour ajouter des URLs personnalisées à un ViewSet
# Exemple : /api/geo/regions/liste/ (une URL supplémentaire non-standard)
from rest_framework.decorators import action

# Response : classe pour retourner une réponse JSON depuis une action personnalisée
from rest_framework.response import Response

# Modèles Django de l'application geo
from .models import RegionSynodale, District, Paroisse

# Serializers définis dans geo/serializers.py
from .serializers import (
    RegionSynodaleSerializer,       # Version complète avec polygone
    RegionSynodaleListSerializer,   # Version légère sans polygone
    DistrictSerializer,
    ParoisseListSerializer,         # GeoJSON pour la carte
    ParoisseDetailSerializer,       # Fiche détaillée
)


# =============================================================================
# VIEW 1 : Régions Synodales
# URL : GET /api/geo/regions/
# URL : GET /api/geo/regions/{id}/
# URL : GET /api/geo/regions/liste/   (action personnalisée)
# =============================================================================
class RegionSynodaleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 22 régions synodales de l'EEC.

    RETOURNE : GeoJSON FeatureCollection avec les polygones des régions.
    Le frontend Leaflet utilisera ces polygones pour dessiner les contours
    des régions sur la carte (carte choroplèthe = régions colorées).

    EXEMPLE DE RÉPONSE :
    {
      "count": 22,
      "results": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {"type": "MultiPolygon", "coordinates": [[...]]},
            "properties": {"id": 1, "nom": "ADAMAOUA", "code": "ADA", ...}
          },
          ...
        ]
      }
    }
    """

    # AllowAny : n'importe qui peut appeler cet endpoint, même sans être connecté.
    # Justification : les données géographiques sont publiques (pas d'info sensible).
    # On pourra restreindre plus tard si nécessaire.
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Définit QUELLES données récupérer depuis la base.

        .annotate() ajoute des colonnes calculées à chaque région :
          - nb_districts : COUNT des districts liés à cette région
          - nb_paroisses : COUNT des paroisses via district→paroisses

        "distinct=True" évite de compter plusieurs fois les mêmes paroisses
        quand une paroisse est liée à plusieurs districts (ne devrait pas arriver,
        mais c'est une précaution).

        .order_by("nom") : trie par ordre alphabétique
        """
        return (
            RegionSynodale.objects
            .annotate(
                # SQL généré : COUNT(DISTINCT districts.id)
                nb_districts=Count("districts", distinct=True),
                # SQL généré : COUNT(DISTINCT districts__paroisses.id)
                nb_paroisses=Count("districts__paroisses", distinct=True),
            )
            .order_by("nom")
        )

    def get_serializer_class(self):
        """
        Choisit quel serializer utiliser selon l'action en cours.
        Pour l'instant, toujours RegionSynodaleSerializer (avec polygone).
        """
        return RegionSynodaleSerializer

    @action(detail=False, url_path="liste")
    def liste(self, request):
        """
        Action personnalisée accessible à /api/geo/regions/liste/

        Retourne les régions SANS leur géométrie (polygone).
        Utilisée par le frontend pour remplir un menu déroulant "Choisir une région".
        Le polygone pèse plusieurs Ko par région — inutile pour un simple select.

        detail=False : cette URL s'applique à la collection (/regions/liste/)
                       pas à un objet individuel (/regions/5/liste/)
        url_path="liste" : le nom dans l'URL après /regions/
        """
        # Récupère toutes les régions triées par nom
        qs = RegionSynodale.objects.order_by("nom")
        # Utilise le serializer léger (sans géométrie)
        return Response(RegionSynodaleListSerializer(qs, many=True).data)


# =============================================================================
# VIEW 2 : Districts
# URL : GET /api/geo/districts/
# URL : GET /api/geo/districts/{id}/
# URL : GET /api/geo/districts/?region=10  (filtre par région)
# =============================================================================
class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 137 districts de l'EEC.

    FILTRE DISPONIBLE :
      ?region={id} → retourne uniquement les districts d'une région précise.
      Exemple : GET /api/geo/districts/?region=10 → districts de la région n°10

    UTILISATION TYPIQUE :
    Le frontend a un menu "Choisir une région" et un autre "Choisir un district".
    Quand l'utilisateur choisit la région ADAMAOUA (id=10), le frontend appelle
    GET /api/geo/districts/?region=10 pour remplir le second menu avec les
    districts de l'ADAMAOUA uniquement.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = DistrictSerializer  # Toujours ce serializer (pas de changement)

    def get_queryset(self):
        """
        Construit la requête SQL de base, puis applique le filtre si demandé.
        """
        # .select_related("region") : charge la région parente en une seule requête SQL
        # (optimisation : évite N+1 requêtes si on avait 137 districts séparément)
        qs = (
            District.objects
            .select_related("region")
            .annotate(nb_paroisses=Count("paroisses", distinct=True))
            .order_by("region__nom", "nom")  # tri par région puis par nom de district
        )

        # Lire le paramètre ?region=X depuis l'URL
        region_id = self.request.query_params.get("region")
        if region_id:
            # Si le paramètre est fourni, filtrer : WHERE region_id = {region_id}
            qs = qs.filter(region_id=region_id)

        return qs


# =============================================================================
# VIEW 3 : Paroisses
# URL : GET /api/geo/paroisses/                 (toutes les paroisses)
# URL : GET /api/geo/paroisses/{id}/            (une paroisse)
# URL : GET /api/geo/paroisses/?avec_gps=1      (seulement celles avec GPS)
# URL : GET /api/geo/paroisses/?district=5      (d'un district)
# URL : GET /api/geo/paroisses/?region=10       (d'une région)
# URL : GET /api/geo/paroisses/?search=NGUI     (recherche par nom)
# =============================================================================
class ParoisseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 553 paroisses de l'EEC.

    C'EST L'ENDPOINT LE PLUS UTILISÉ DU PROJET.
    Leaflet.js l'appelle pour placer les markers sur la carte.

    FILTRES DISPONIBLES (cumulables) :
      ?district={id}  → paroisses d'un district spécifique
      ?region={id}    → paroisses d'une région (via leurs districts)
      ?search={texte} → recherche insensible à la casse dans le nom
      ?avec_gps=1     → exclut les paroisses sans coordonnées GPS

    EXEMPLES :
      /api/geo/paroisses/?avec_gps=1           → 402 paroisses géolocalisées
      /api/geo/paroisses/?region=10&avec_gps=1 → paroisses de l'ADAMAOUA avec GPS
      /api/geo/paroisses/?search=NGUI          → paroisses dont le nom contient "NGUI"

    DEUX SERIALIZERS SELON LE CONTEXTE :
      - list()     : ParoisseListSerializer (GeoJSON, pour la carte)
      - retrieve() : ParoisseDetailSerializer (JSON simple, pour la fiche)
    """

    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Construit la requête SQL avec les filtres demandés.

        .select_related("district", "district__region") :
          Charge en une seule requête SQL la paroisse + son district + la région du district.
          Sans ça, accéder à paroisse.district.region.nom ferait 3 requêtes séparées
          pour chaque paroisse — très lent avec 553 paroisses !
        """
        qs = (
            Paroisse.objects
            .select_related("district", "district__region")
            # Tri : région → district → paroisse (ordre géographique logique)
            .order_by("district__region__nom", "district__nom", "nom")
        )

        # self.request.query_params est un dictionnaire des paramètres d'URL
        params = self.request.query_params

        # Filtre par district (WHERE district_id = ?)
        district_id = params.get("district")
        if district_id:
            qs = qs.filter(district_id=district_id)

        # Filtre par région (traverse la FK : paroisse→district→région)
        # SQL : WHERE district.region_id = ?
        region_id = params.get("region")
        if region_id:
            qs = qs.filter(district__region_id=region_id)

        # Recherche textuelle (insensible à la casse)
        # icontains = ILIKE '%search%' en SQL (insensible à la casse)
        search = params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)

        # Filtre GPS : exclure les paroisses sans coordonnées
        # exclude(position__isnull=True) = WHERE position IS NOT NULL
        if params.get("avec_gps") == "1":
            qs = qs.exclude(position__isnull=True)

        return qs

    def get_serializer_class(self):
        """
        Choisit le serializer selon l'action :
          - retrieve() → detail (une seule paroisse) : ParoisseDetailSerializer
          - list()     → liste (toutes les paroisses) : ParoisseListSerializer (GeoJSON)

        self.action est une propriété DRF qui vaut "list", "retrieve", etc.
        """
        if self.action == "retrieve":
            return ParoisseDetailSerializer
        return ParoisseListSerializer
