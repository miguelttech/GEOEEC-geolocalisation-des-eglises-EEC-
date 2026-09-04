"""
=============================================================================
FICHIER : backend/apps/ouvriers/admin.py
RÔLE    : Enregistre les modèles Grades et Ouvriers dans Django Admin.
=============================================================================

UTILISATION PRINCIPALE :
  - Assigner un grade aux 129 ouvriers importés sans grade reconnu
  - Corriger les noms mal orthographiés lors de l'import
  - Changer le statut d'un ouvrier (ACTIF → RETRAITE, SUSPENDU, DECEDE)
  - Ajouter un nouvel ouvrier sans re-lancer le script d'import
  - Muter un ouvrier d'une paroisse à une autre (changer la FK paroisse)
=============================================================================
"""

from django.contrib import admin

from .models import Grade, Ouvrier


# =============================================================================
# ADMIN 1 : Grades ecclésiastiques
# =============================================================================
@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    """
    Interface Admin pour les 8 grades de l'EEC.
    Ces données sont stables — on les consulte surtout, on les modifie rarement.
    """

    # Colonnes visibles dans la liste des grades
    list_display = ["niveau", "nom", "abreviation", "nb_ouvriers_admin"]

    # Tri par niveau hiérarchique (1=Révérant Docteur, 8=Aide-Évangéliste)
    ordering = ["niveau"]

    def nb_ouvriers_admin(self, obj):
        """Affiche le nombre d'ouvriers pour chaque grade."""
        # obj.ouvriers : relation inverse via related_name="ouvriers" dans Ouvrier
        return obj.ouvriers.count()
    nb_ouvriers_admin.short_description = "Nb ouvriers"


# =============================================================================
# ADMIN 2 : Ouvriers
#
# C'EST ICI QU'ON CORRIGE LES 129 OUVRIERS SANS GRADE.
# Utilisation typique :
#   1. Filtrer "Grade = Aucun grade (null)"
#   2. Cliquer sur un ouvrier
#   3. Sélectionner son grade dans la liste déroulante
#   4. Sauvegarder
# =============================================================================
@admin.register(Ouvrier)
class OuvrierAdmin(admin.ModelAdmin):
    """
    Interface Admin pour les 685 ouvriers de l'EEC.
    Permet de corriger les grades manquants, statuts, mutations.
    """

    # Colonnes dans la liste
    list_display = [
        "nom", "prenom", "grade", "statut",
        "paroisse", "district_admin", "region_admin", "telephone"
    ]

    # Filtres latéraux : très utiles pour naviguer dans 685 ouvriers
    # list_filter = [...] → panneau "Filtrer par" sur la droite de la page
    list_filter = [
        "grade",                      # Filtrer par grade (ex: "Pasteur" seulement)
        "statut",                     # Filtrer par statut (ACTIF, RETRAITE...)
        "paroisse__district__region", # Filtrer par région synodale
        "paroisse__district",         # Filtrer par district
    ]

    # Barre de recherche : chercher par nom, prénom ou téléphone
    search_fields = ["nom", "prenom", "telephone"]

    # Tri par défaut : alphabétique par nom de famille
    ordering = ["nom", "prenom"]

    # Chargement optimisé : charge grade + paroisse + district + région en 1 seule requête SQL
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "grade",
            "paroisse",
            "paroisse__district",
            "paroisse__district__region",
        )

    def district_admin(self, obj):
        """Affiche le district de l'ouvrier (via sa paroisse)."""
        return obj.paroisse.district.nom
    district_admin.short_description = "District"

    def region_admin(self, obj):
        """Affiche la région de l'ouvrier (via sa paroisse → district → région)."""
        return obj.paroisse.district.region.nom
    region_admin.short_description = "Région"
