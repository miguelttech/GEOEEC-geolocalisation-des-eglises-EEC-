"""
=============================================================================
FICHIER : backend/apps/geo/admin.py
RÔLE    : Enregistre les modèles géographiques dans l'interface Django Admin.
=============================================================================

POURQUOI CE FICHIER EST IMPORTANT :
  Sans ce fichier, Django Admin ne montre rien — la base de données est remplie
  mais aucun modèle n'est visible dans l'interface d'administration.
  Ce fichier "déclare" quels modèles sont gérables depuis l'Admin, et COMMENT
  ils sont affichés (colonnes, filtres, recherche).

ACCÈS :
  http://localhost:8000/admin/
  Identifiants : admin / EecAdmin@2026!

CE QU'ON CONFIGURE ICI :
  1. RegionSynodale  → 22 régions (lecture seule, données du shapefile)
  2. District        → 137 districts
  3. Paroisse        → 576 paroisses (avec correction des GPS erronés)
=============================================================================
"""

from django.contrib import admin

# GeoModelAdmin : version géographique de ModelAdmin
# Permet d'afficher une mini-carte pour éditer les champs géographiques (Point, Polygon)
from django.contrib.gis.admin import GISModelAdmin

from .models import RegionSynodale, District, Paroisse


# =============================================================================
# ADMIN 1 : Régions Synodales
#
# Les régions sont importées depuis le Shapefile et ne devraient PAS être
# modifiées manuellement (les géométries sont complexes).
# On les rend donc en lecture seule (readonly_fields).
# =============================================================================
@admin.register(RegionSynodale)
class RegionSynodaleAdmin(GISModelAdmin):
    """
    Interface Admin pour les 22 régions synodales de l'EEC.

    @admin.register(RegionSynodale) :
    Décorateur Python qui enregistre ce ModelAdmin pour le modèle RegionSynodale.
    Équivalent à : admin.site.register(RegionSynodale, RegionSynodaleAdmin)

    GeoModelAdmin : hérite de ModelAdmin mais ajoute le support des champs géographiques.
    """

    # list_display : colonnes affichées dans la liste des régions
    # C'est ce qu'on voit quand on clique sur "Régions" dans l'Admin
    list_display = ["nom", "nb_districts_admin", "nb_paroisses_admin"]

    # search_fields : champs sur lesquels la barre de recherche fonctionne
    # Permet de chercher une région par son nom
    search_fields = ["nom"]

    # readonly_fields : champs affichés mais non modifiables
    # La géométrie (polygone) ne doit pas être modifiée manuellement
    readonly_fields = ["geometrie"]

    # ordering : ordre d'affichage par défaut (alphabétique par nom)
    ordering = ["nom"]

    def nb_districts_admin(self, obj):
        """Affiche le nombre de districts de chaque région dans la liste."""
        # obj.districts : relation inverse définie par related_name="districts" dans District
        # .count() : fait un COUNT SQL, plus efficace que len()
        return obj.districts.count()
    nb_districts_admin.short_description = "Nb districts"  # En-tête de colonne

    def nb_paroisses_admin(self, obj):
        """Affiche le nombre de paroisses de chaque région dans la liste."""
        # On traverse deux relations : region → districts → paroisses
        from apps.geo.models import Paroisse
        return Paroisse.objects.filter(district__region=obj).count()
    nb_paroisses_admin.short_description = "Nb paroisses"


# =============================================================================
# ADMIN 2 : Districts
# =============================================================================
@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    """
    Interface Admin pour les 137 districts de l'EEC.

    admin.ModelAdmin : classe de base pour les modèles sans géométrie.
    (Les districts n'ont pas de champ géographique, juste nom + région)
    """

    # Colonnes visibles dans la liste des districts
    list_display = ["nom", "region", "nb_paroisses_admin"]

    # Filtre latéral par région (très utile pour naviguer)
    # Affiche un panneau "Filtrer par région" sur le côté droit
    list_filter = ["region"]

    # Barre de recherche sur le nom du district
    search_fields = ["nom", "region__nom"]

    # Tri par région puis par nom de district
    ordering = ["region__nom", "nom"]

    # select_related : charge la région de chaque district en un seul SQL JOIN
    # Sans ça, Django ferait une requête SQL séparée pour chaque district → très lent
    def get_queryset(self, request):
        return super().get_queryset(request).select_related("region")

    def nb_paroisses_admin(self, obj):
        """Affiche le nombre de paroisses de chaque district."""
        # obj.paroisses : relation inverse définie par related_name="paroisses" dans Paroisse
        return obj.paroisses.count()
    nb_paroisses_admin.short_description = "Nb paroisses"


# =============================================================================
# ADMIN 3 : Paroisses
#
# C'EST L'ADMIN LE PLUS IMPORTANT pour la correction des données.
# On l'utilise pour :
# - Corriger les 5 paroisses avec GPS erroné (modifier les coordonnées)
# - Corriger les 23 paroisses importées avec district estimé
# - Ajouter de nouvelles paroisses
# =============================================================================
@admin.register(Paroisse)
class ParoisseAdmin(GISModelAdmin):
    """
    Interface Admin pour les 576 paroisses de l'EEC.

    GeoModelAdmin : affiche une mini-carte OpenStreetMap pour éditer le champ
    'position' (PointField). On peut glisser-déposer le marqueur sur la carte !
    C'est très pratique pour corriger les GPS erronés.
    """

    # Colonnes dans la liste des paroisses
    # "a_gps" : méthode personnalisée qui indique si la paroisse a des coordonnées GPS
    list_display = ["nom", "district", "region_admin", "adresse", "a_gps"]

    # Filtres latéraux : par district et par région
    # Permet de filtrer rapidement "montrez-moi seulement les paroisses de l'ADAMAOUA"
    list_filter = ["district__region", "district"]

    # Barre de recherche : chercher par nom de paroisse, district ou région
    search_fields = ["nom", "district__nom", "district__region__nom"]

    # Tri par région puis district puis nom
    ordering = ["district__region__nom", "district__nom", "nom"]

    # Chargement optimisé (évite N+1 requêtes SQL)
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "district", "district__region"
        )

    def region_admin(self, obj):
        """Affiche le nom de la région de chaque paroisse dans la liste."""
        # obj.district.region : traverser deux FK pour accéder à la région
        return obj.district.region.nom
    region_admin.short_description = "Région"

    def a_gps(self, obj):
        """Affiche OUI ou NON selon si la paroisse a des coordonnées GPS."""
        # obj.position : PointField, vaut None si pas de GPS
        return "OUI" if obj.position else "NON"
    a_gps.short_description = "GPS ?"

    # POUR CORRIGER LES GPS ERRONÉS :
    # Quand on ouvre une paroisse dans l'Admin avec GeoModelAdmin,
    # une mini-carte s'affiche avec le champ "position".
    # On peut cliquer sur la carte pour définir la position du marqueur.
    # Puis cliquer "Sauvegarder" pour enregistrer les nouvelles coordonnées.
