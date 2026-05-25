"""
=============================================================================
FICHIER N°17 — DERNIER FICHIER BACKEND (dans l'ordre de création)
CHEMIN   : backend/eec_core/urls.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: TOUS les fichiers views.py (doit être créé EN DERNIER)
UTILISÉ PAR: Django lui-même (point d'entrée de toutes les requêtes HTTP)
=============================================================================

OBJECTIF :
  Ce fichier est la "carte d'adresses" centrale de toute l'application.
  Quand une requête HTTP arrive, Django lit ce fichier pour savoir
  quelle view appeler.

  C'est ici qu'on branche ensemble :
    - L'administration Django (/admin/)
    - Toutes les APIs REST (/api/...)
    - La documentation automatique (/api/schema/...)

QU'EST-CE QUE LE ROUTER DRF ?
  Sans Router, il faudrait écrire chaque URL à la main :
    path("api/geo/paroisses/",      ParoisseViewSet.as_view({"get": "list"})),
    path("api/geo/paroisses/<pk>/", ParoisseViewSet.as_view({"get": "retrieve"})),
    path("api/geo/districts/",      DistrictViewSet.as_view({"get": "list"})),
    ...  (30+ lignes pour 8 ViewSets)

  Avec le Router, une seule ligne fait tout :
    router.register(r"geo/paroisses", ParoisseViewSet, basename="paroisse")
    → génère automatiquement :
      /api/geo/paroisses/         GET → list()     (toutes les paroisses)
      /api/geo/paroisses/{id}/    GET → retrieve() (une paroisse)
      /api/geo/paroisses/{id}/    OPTIONS → liste les méthodes disponibles

STRUCTURE DES URLs GÉNÉRÉES (17 endpoints au total) :
  /admin/                        → Interface d'administration Django
  /api/geo/regions/              → 22 régions synodales (GeoJSON polygones)
  /api/geo/regions/{id}/         → une région précise
  /api/geo/regions/liste/        → régions sans géométrie (pour les filtres)
  /api/geo/districts/            → 137 districts
  /api/geo/districts/{id}/       → un district
  /api/geo/paroisses/            → 553 paroisses (GeoJSON points)
  /api/geo/paroisses/{id}/       → une paroisse
  /api/oeuvres/types/            → 7 types d'oeuvres
  /api/oeuvres/types/{id}/       → un type
  /api/oeuvres/oeuvres/          → 311 oeuvres (GeoJSON)
  /api/oeuvres/oeuvres/{id}/     → une oeuvre
  /api/statistiques/             → 545 statistiques
  /api/statistiques/{id}/        → une statistique
  /api/statistiques/totaux/      → totaux agrégés EEC
  /api/ouvriers/grades/          → 8 grades
  /api/ouvriers/grades/{id}/     → un grade
  /api/ouvriers/ouvriers/        → 685 ouvriers
  /api/ouvriers/ouvriers/{id}/   → un ouvrier
  /api/schema/                   → schéma OpenAPI (format machine)
  /api/schema/swagger/           → documentation Swagger UI (interface web)
  /api/schema/redoc/             → documentation ReDoc (interface web alternative)
=============================================================================
"""

from django.contrib import admin
from django.urls import path, include  # path : définir une URL ; include : inclure d'autres fichiers d'URL

# DefaultRouter : génère automatiquement les URLs CRUD à partir des ViewSets
from rest_framework.routers import DefaultRouter

# SpectacularAPIView     : génère le schéma OpenAPI en JSON (format machine)
# SpectacularSwaggerView : affiche le schéma dans une interface Swagger UI (navigateur)
# SpectacularRedocView   : affiche le schéma dans une interface ReDoc (navigateur)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# ── Import de tous les ViewSets des 4 applications ──────────────────────────

# Application GEO : régions, districts, paroisses
from apps.geo.views import RegionSynodaleViewSet, DistrictViewSet, ParoisseViewSet

# Application OEUVRES : types et oeuvres
from apps.oeuvres.views import TypeOeuvreViewSet, OeuvreViewSet

# Application ACCOUNTS : statistiques annuelles
from apps.accounts.views import StatistiqueAnnuelleViewSet

# Application OUVRIERS : grades et ouvriers
from apps.ouvriers.views import GradeViewSet, OuvrierViewSet


# =============================================================================
# CRÉATION DU ROUTER
# Le router est le "registre" qui associe un préfixe URL à un ViewSet
# =============================================================================
router = DefaultRouter()

# ── Enregistrement des ViewSets géographiques ────────────────────────────────

# r"geo/regions" : le préfixe URL (sera /api/geo/regions/ après le /api/ global)
# RegionSynodaleViewSet : la class qui gère la logique
# basename="region" : nom de base pour les noms d'URL Django (reverse URLs)
router.register(r"geo/regions",   RegionSynodaleViewSet, basename="region")
router.register(r"geo/districts", DistrictViewSet,       basename="district")
router.register(r"geo/paroisses", ParoisseViewSet,       basename="paroisse")

# ── Enregistrement des ViewSets oeuvres ──────────────────────────────────────
router.register(r"oeuvres/types",   TypeOeuvreViewSet, basename="typeoeuvre")
router.register(r"oeuvres/oeuvres", OeuvreViewSet,     basename="oeuvre")

# ── Enregistrement des ViewSets statistiques ─────────────────────────────────
router.register(r"statistiques", StatistiqueAnnuelleViewSet, basename="statistique")

# ── Enregistrement des ViewSets ouvriers ─────────────────────────────────────
router.register(r"ouvriers/grades",   GradeViewSet,   basename="grade")
router.register(r"ouvriers/ouvriers", OuvrierViewSet, basename="ouvrier")


# =============================================================================
# DÉFINITION DES URL PATTERNS
# urlpatterns est la liste que Django lit pour router les requêtes HTTP
# =============================================================================
urlpatterns = [

    # ── Administration Django ─────────────────────────────────────────────────
    # URL : http://localhost:8000/admin/
    # Donne accès à l'interface d'administration pour gérer les données en base.
    # Connexion : admin / EecAdmin@2026!
    path("admin/", admin.site.urls),

    # ── Toutes les APIs REST ──────────────────────────────────────────────────
    # URL : http://localhost:8000/api/...
    # include(router.urls) : branche toutes les URLs générées par le router
    # sous le préfixe /api/
    # Exemple : router a enregistré "geo/paroisses" → devient /api/geo/paroisses/
    path("api/", include(router.urls)),

    # ── Documentation OpenAPI (drf-spectacular) ───────────────────────────────

    # Schéma brut en JSON/YAML (pour les outils automatiques, pas pour les humains)
    # URL : http://localhost:8000/api/schema/
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),

    # Interface Swagger UI : documentation interactive dans le navigateur
    # On peut tester les endpoints directement depuis cette page !
    # URL : http://localhost:8000/api/schema/swagger/
    path(
        "api/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),  # référence le schéma ci-dessus
        name="swagger-ui",
    ),

    # Interface ReDoc : documentation plus lisible, moins interactive que Swagger
    # URL : http://localhost:8000/api/schema/redoc/
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
