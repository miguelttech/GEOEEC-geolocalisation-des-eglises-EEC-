from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.geo.views import RegionSynodaleViewSet, DistrictViewSet, ParoisseViewSet
from apps.oeuvres.views import TypeOeuvreViewSet, OeuvreViewSet
from apps.accounts.views import StatistiqueAnnuelleViewSet
from apps.ouvriers.views import GradeViewSet, OuvrierViewSet
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

router = DefaultRouter()
router.register(r"geo/regions",       RegionSynodaleViewSet,      basename="region")
router.register(r"geo/districts",     DistrictViewSet,            basename="district")
router.register(r"geo/paroisses",     ParoisseViewSet,            basename="paroisse")
router.register(r"oeuvres/types",     TypeOeuvreViewSet,          basename="typeoeuvre")
router.register(r"oeuvres/oeuvres",   OeuvreViewSet,              basename="oeuvre")
router.register(r"statistiques",      StatistiqueAnnuelleViewSet, basename="statistique")
router.register(r"ouvriers/grades",   GradeViewSet,               basename="grade")
router.register(r"ouvriers/ouvriers", OuvrierViewSet,             basename="ouvrier")

auth_patterns = [
    path("csrf/",                      csrf_token),
    path("login/",                     login_view),
    path("logout/",                    logout_view),
    path("me/",                        me_view),
    path("change-password/",           change_password),
    path("dashboard-stats/",           dashboard_stats),
    path("users/",                     list_users),
    path("users/create/",              create_user),
    path("users/<int:pk>/",            user_detail),
    path("users/<int:pk>/toggle-active/",  toggle_user_active),
    path("users/<int:pk>/reset-password/", reset_user_password),
]

urlpatterns = [
    path("admin/",       admin.site.urls),
    path("api/",         include(router.urls)),
    path("api/auth/",    include(auth_patterns)),
    path("api/schema/",  SpectacularAPIView.as_view(),                                    name="schema"),
    path("api/schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"),        name="swagger-ui"),
    path("api/schema/redoc/",   SpectacularRedocView.as_view(url_name="schema"),          name="redoc"),
]
