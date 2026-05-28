from django.contrib import admin
from .models import (
    ProfilVisiteur, ParoisseVue, RechercheHistorique,
    ItinerairePersonnel, ParoisseEnregistree,
)


@admin.register(ProfilVisiteur)
class ProfilVisiteurAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "langue", "paroisse_affiliee", "region_preferee", "created_at")
    search_fields = ("utilisateur__email", "utilisateur__first_name", "utilisateur__last_name")
    list_filter = ("langue",)


@admin.register(ParoisseVue)
class ParoisseVueAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "paroisse", "vue_at")
    list_filter = ("vue_at",)
    search_fields = ("utilisateur__email", "paroisse__nom")
    date_hierarchy = "vue_at"


@admin.register(RechercheHistorique)
class RechercheHistoriqueAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "query", "resultats_count", "created_at")
    search_fields = ("utilisateur__email", "query")
    date_hierarchy = "created_at"


@admin.register(ItinerairePersonnel)
class ItinerairePersonnelAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "arrivee_paroisse", "distance_km", "duree_minutes", "created_at")
    search_fields = ("utilisateur__email", "arrivee_paroisse__nom")


@admin.register(ParoisseEnregistree)
class ParoisseEnregistreeAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "paroisse", "enregistree_at")
    search_fields = ("utilisateur__email", "paroisse__nom")
