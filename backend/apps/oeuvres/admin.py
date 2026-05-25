"""
=============================================================================
FICHIER : backend/apps/oeuvres/admin.py
RÔLE    : Enregistre les types d'oeuvres et les oeuvres dans Django Admin.
=============================================================================

UTILISATION PRINCIPALE :
  - Ajouter de nouvelles oeuvres (une école construite récemment)
  - Corriger les GPS manquants des oeuvres
  - Modifier le type d'une oeuvre mal classifiée
  - Désactiver une oeuvre fermée (est_active = False)
=============================================================================
"""

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import TypeOeuvre, Oeuvre


@admin.register(TypeOeuvre)
class TypeOeuvreAdmin(admin.ModelAdmin):
    """
    Interface Admin pour les 7 types d'oeuvres.
    Ces données sont stables — rarement modifiées.
    """
    list_display = ["nom", "icone", "couleur", "nb_oeuvres_admin"]
    ordering     = ["nom"]

    def nb_oeuvres_admin(self, obj):
        """Affiche le nombre d'oeuvres pour chaque type."""
        return obj.oeuvres.count()
    nb_oeuvres_admin.short_description = "Nb oeuvres"


@admin.register(Oeuvre)
class OeuvreAdmin(GISModelAdmin):
    """
    Interface Admin pour les 311 oeuvres de l'EEC.
    GeoModelAdmin : affiche une mini-carte pour éditer la position GPS.
    """

    # Colonnes dans la liste
    list_display = [
        "nom", "type_oeuvre", "est_active",
        "niveau_geographique", "lieu_admin", "a_gps"
    ]

    # Filtres : par type, par statut actif/inactif, par niveau géographique
    list_filter = [
        "type_oeuvre",
        "est_active",
        "region",
        "district__region",
        "paroisse__district__region",
    ]

    # Barre de recherche par nom d'oeuvre
    search_fields = ["nom", "region__nom", "district__nom", "paroisse__nom"]

    # Tri par nom
    ordering = ["nom"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "type_oeuvre", "region", "district", "district__region",
            "paroisse", "paroisse__district", "paroisse__district__region",
        )

    def niveau_geographique(self, obj):
        """Indique si c'est une oeuvre Régionale, de District ou Paroissiale."""
        if obj.paroisse:
            return "Paroissiale"
        elif obj.district:
            return "District"
        elif obj.region:
            return "Régionale"
        return "—"
    niveau_geographique.short_description = "Niveau"

    def lieu_admin(self, obj):
        """Affiche le lieu de rattachement de l'oeuvre."""
        if obj.paroisse:
            return f"{obj.paroisse.nom} ({obj.paroisse.district.nom})"
        elif obj.district:
            return f"{obj.district.nom} ({obj.district.region.nom})"
        elif obj.region:
            return obj.region.nom
        return "—"
    lieu_admin.short_description = "Lieu"

    def a_gps(self, obj):
        return "OUI" if obj.position else "NON"
    a_gps.short_description = "GPS ?"
