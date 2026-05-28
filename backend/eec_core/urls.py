from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

# ViewSets — données métier
from apps.geo.views      import RegionSynodaleViewSet, DistrictViewSet, ParoisseViewSet
from apps.oeuvres.views  import TypeOeuvreViewSet, OeuvreViewSet
from apps.accounts.views import StatistiqueAnnuelleViewSet
from apps.ouvriers.views import GradeViewSet, OuvrierViewSet
from apps.audit.views    import LogActiviteViewSet

# Vues auth
from apps.accounts.auth_views import (
    csrf_token,
    login_view,
    logout_view,
    me_view,
    change_password,
    list_users,
    create_user,
    user_detail,
    toggle_user_active,
    reset_user_password,
    dashboard_stats,
)

# Vues visitors + analytics
from apps.visitors.urls import visitor_patterns, analytics_patterns

# Vues exports
from apps.exports.views import (
    export_paroisses_excel,
    export_oeuvres_excel,
    export_statistiques_excel,
    export_statistiques_pdf,
    template_paroisses,
    template_oeuvres,
    template_ouvriers,
    import_paroisses,
    import_oeuvres,
    import_ouvriers,
)

# ---------------------------------------------------------------------------
# Router DRF — enregistrement des ViewSets
# ---------------------------------------------------------------------------
router = DefaultRouter()
router.register(r"geo/regions",       RegionSynodaleViewSet,      basename="region")
router.register(r"geo/districts",     DistrictViewSet,            basename="district")
router.register(r"geo/paroisses",     ParoisseViewSet,            basename="paroisse")
router.register(r"oeuvres/types",     TypeOeuvreViewSet,          basename="typeoeuvre")
router.register(r"oeuvres/oeuvres",   OeuvreViewSet,              basename="oeuvre")
router.register(r"statistiques",      StatistiqueAnnuelleViewSet, basename="statistique")
router.register(r"ouvriers/grades",   GradeViewSet,               basename="grade")
router.register(r"ouvriers/ouvriers", OuvrierViewSet,             basename="ouvrier")
router.register(r"audit/journal",     LogActiviteViewSet,         basename="logactivite")

# ---------------------------------------------------------------------------
# Patterns auth
# ---------------------------------------------------------------------------
auth_patterns = [
    path("csrf/",                            csrf_token),
    path("login/",                           login_view),
    path("logout/",                          logout_view),
    path("me/",                              me_view),
    path("change-password/",                 change_password),
    path("dashboard-stats/",                 dashboard_stats),
    path("users/",                           list_users),
    path("users/create/",                    create_user),
    path("users/<int:pk>/",                  user_detail),
    path("users/<int:pk>/toggle-active/",    toggle_user_active),
    path("users/<int:pk>/reset-password/",   reset_user_password),
]

# ---------------------------------------------------------------------------
# Patterns exports (téléchargements de fichiers)
# ---------------------------------------------------------------------------
export_patterns = [
    path("paroisses/excel/",          export_paroisses_excel),
    path("oeuvres/excel/",            export_oeuvres_excel),
    path("statistiques/excel/",       export_statistiques_excel),
    path("statistiques/pdf/",         export_statistiques_pdf),
    path("templates/paroisses/",      template_paroisses),
    path("templates/oeuvres/",        template_oeuvres),
    path("templates/ouvriers/",       template_ouvriers),
]

# ---------------------------------------------------------------------------
# Patterns imports (upload de fichiers Excel)
# ---------------------------------------------------------------------------
import_patterns = [
    path("paroisses/",  import_paroisses),
    path("oeuvres/",    import_oeuvres),
    path("ouvriers/",   import_ouvriers),
]

# ---------------------------------------------------------------------------
# URL principale
# ---------------------------------------------------------------------------
urlpatterns = [
    path("admin/",               admin.site.urls),

    # API REST — ViewSets via le router
    path("api/",                 include(router.urls)),

    # API Auth
    path("api/auth/",            include(auth_patterns)),

    # API Exports
    path("api/exports/",         include(export_patterns)),

    # API Imports
    path("api/imports/",         include(import_patterns)),

    # API Visiteurs authentifiés
    path("api/visitor/",         include(visitor_patterns)),

    # API Analytics visiteurs (SUPER + REGION)
    path("api/analytics/",       include(analytics_patterns)),

    # Documentation OpenAPI
    path("api/schema/",          SpectacularAPIView.as_view(),                             name="schema"),
    path("api/schema/swagger/",  SpectacularSwaggerView.as_view(url_name="schema"),        name="swagger-ui"),
    path("api/schema/redoc/",    SpectacularRedocView.as_view(url_name="schema"),          name="redoc"),
]
