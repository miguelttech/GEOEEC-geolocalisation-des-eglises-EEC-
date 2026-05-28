from django.urls import path
from . import views, analytics

# ── Routes visiteur authentifié ───────────────────────────────────────────────
visitor_patterns = [
    # Inscription
    path("register/",                       views.register_visitor),

    # Profil
    path("me/",                             views.visitor_me),

    # Historique de recherche
    path("history/",                        views.search_history),
    path("history/clear/",                  views.clear_history),

    # Paroisses vues (historique de consultation)
    path("paroisses/<int:pk>/vue/",         views.log_paroisse_vue),
    path("paroisses/recentes/",             views.paroisses_recentes),

    # Paroisse la plus proche (PostGIS — requiert lat + lng en query params)
    path("paroisses/plus-proche/",          views.paroisse_plus_proche),

    # Favoris
    path("favoris/",                        views.favoris_list_create),
    path("favoris/<int:pk>/",               views.favori_delete),

    # Itinéraires
    path("itineraires/",                    views.itineraires_list),
    path("itineraires/calculer/",           views.calculer_itineraire),
]

# ── Routes analytics (SUPER + REGION uniquement) ──────────────────────────────
analytics_patterns = [
    path("paroisses/top/",                  analytics.top_paroisses),
    path("visiteurs/stats/",               analytics.visiteurs_stats),
    path("activite/courbe/",               analytics.courbe_activite),
    path("itineraires/stats/",             analytics.itineraires_stats),
    path("recherches/tendances/",          analytics.recherches_tendances),
]
