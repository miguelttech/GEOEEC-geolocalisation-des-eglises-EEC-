"""
=============================================================================
FICHIER : backend/apps/accounts/admin.py
RÔLE    : Enregistre les statistiques annuelles dans Django Admin.
=============================================================================

UTILISATION PRINCIPALE :
  - Compléter les données manquantes : baptemes, mariages, deces, offrandes, dimes
    (ces champs ne sont pas dans l'Excel 2025 et sont restés à 0 lors de l'import)
  - Saisir les statistiques des années suivantes (2026, 2027...)
  - Corriger des chiffres erronés signalés par les responsables EEC
=============================================================================
"""

from django.contrib import admin

from .models import StatistiqueAnnuelle


@admin.register(StatistiqueAnnuelle)
class StatistiqueAnnuelleAdmin(admin.ModelAdmin):
    """
    Interface Admin pour les 545 statistiques annuelles (une par paroisse × année).

    WORKFLOW TYPIQUE :
      Un secrétaire EEC reçoit les rapports annuels des paroisses.
      Il ouvre http://localhost:8000/admin/
      Il cherche la paroisse dans la barre de recherche.
      Il clique sur la statistique et complète les champs manquants.
      Il sauvegarde.
    """

    # Colonnes dans la liste
    list_display = [
        "paroisse", "district_admin", "region_admin", "annee",
        "communiants", "non_communiants", "total_fideles_admin",
        "baptemes", "mariages", "deces"
    ]

    # Filtres latéraux
    list_filter = [
        "annee",                             # Filtrer par année (2025, 2026...)
        "paroisse__district__region",        # Filtrer par région
        "paroisse__district",                # Filtrer par district
    ]

    # Barre de recherche : chercher par nom de paroisse, district ou région
    search_fields = [
        "paroisse__nom",
        "paroisse__district__nom",
        "paroisse__district__region__nom",
    ]

    # Tri : d'abord les plus récentes (2025 avant 2024), puis par nom de paroisse
    ordering = ["-annee", "paroisse__nom"]

    # Chargement optimisé
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "paroisse",
            "paroisse__district",
            "paroisse__district__region",
        )

    def district_admin(self, obj):
        return obj.paroisse.district.nom
    district_admin.short_description = "District"

    def region_admin(self, obj):
        return obj.paroisse.district.region.nom
    region_admin.short_description = "Région"

    def total_fideles_admin(self, obj):
        """Calcule et affiche le total fidèles = communiants + non_communiants."""
        return (obj.communiants or 0) + (obj.non_communiants or 0)
    total_fideles_admin.short_description = "Total fidèles"
