from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from .models import (
    Region, District, Paroisse, Grade, Ouvrier, 
    TypeOeuvre, Oeuvre, StatistiqueAnnuelle,
    ZoneInfluence, Itineraire, HistoriquePosition
)

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'total_paroisses', 'date_creation']
    list_filter = ['date_creation']
    search_fields = ['nom', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'region', 'date_creation']
    list_filter = ['region', 'date_creation']
    search_fields = ['nom', 'code', 'region__nom']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Paroisse)
class ParoisseAdmin(gis_admin.GISModelAdmin):
    list_display = ['nom', 'quartier', 'niveau', 'district', 'region', 'total_fideles', 'actif']
    list_filter = ['niveau', 'district__region', 'district', 'actif']
    search_fields = ['nom', 'quartier', 'district__nom', 'region__nom']
    readonly_fields = ['id', 'created_at', 'updated_at', 'total_fideles', 'pourcentage_communiants']
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'quartier', 'niveau', 'region', 'district', 'actif')
        }),
        ('Statistiques', {
            'fields': ('communiants', 'non_communiants', 'ouvriers', 'total_fideles', 'pourcentage_communiants')
        }),
        ('Géolocalisation', {
            'fields': ('localisation', 'adresse')
        }),
        ('Métadonnées', {
            'fields': ('id', 'date_creation', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'niveau', 'description']
    list_filter = ['niveau']
    search_fields = ['nom']
    ordering = ['niveau', 'nom']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Ouvrier)
class OuvrierAdmin(gis_admin.GISModelAdmin):
    list_display = ['nom_complet', 'grade', 'paroisse', 'statut', 'date_ordination']
    list_filter = ['grade', 'statut', 'paroisse__district__region', 'paroisse__district']
    search_fields = ['nom', 'prenom', 'paroisse__nom', 'grade__nom']
    readonly_fields = ['id', 'created_at', 'updated_at', 'nom_complet']
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'nom_complet', 'date_naissance')
        }),
        ('Informations professionnelles', {
            'fields': ('grade', 'paroisse', 'statut', 'date_ordination')
        }),
        ('Contact', {
            'fields': ('telephone', 'email')
        }),
        ('Géolocalisation', {
            'fields': ('localisation', 'adresse')
        }),
        ('Métadonnées', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(TypeOeuvre)
class TypeOeuvreAdmin(admin.ModelAdmin):
    list_display = ['nom', 'icone', 'couleur', 'description']
    search_fields = ['nom']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Oeuvre)
class OeuvreAdmin(gis_admin.GISModelAdmin):
    list_display = ['nom', 'type_oeuvre', 'niveau', 'paroisse', 'statut', 'date_creation']
    list_filter = ['type_oeuvre', 'niveau', 'statut', 'paroisse__district__region']
    search_fields = ['nom', 'type_oeuvre__nom', 'paroisse__nom']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'type_oeuvre', 'niveau', 'paroisse', 'statut')
        }),
        ('Détails', {
            'fields': ('description', 'capacite', 'budget_annuel')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_inauguration')
        }),
        ('Géolocalisation', {
            'fields': ('localisation', 'adresse')
        }),
        ('Métadonnées', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(StatistiqueAnnuelle)
class StatistiqueAnnuelleAdmin(admin.ModelAdmin):
    list_display = ['paroisse', 'annee', 'total_fideles', 'communiants', 'validee']
    list_filter = ['annee', 'validee', 'paroisse__district__region']
    search_fields = ['paroisse__nom']
    readonly_fields = ['id', 'created_at', 'updated_at', 'total_fideles']
    fieldsets = (
        ('Informations générales', {
            'fields': ('paroisse', 'annee', 'validee')
        }),
        ('Statistiques des fidèles', {
            'fields': ('communiants', 'non_communiants', 'total_fideles')
        }),
        ('Événements', {
            'fields': ('baptemes', 'confirmations', 'mariages', 'deces')
        }),
        ('Finances', {
            'fields': ('offrandes', 'dimes')
        }),
        ('Métadonnées', {
            'fields': ('id', 'date_saisie', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ZoneInfluence)
class ZoneInfluenceAdmin(gis_admin.GISModelAdmin):
    list_display = ['paroisse', 'nom', 'rayon_km', 'population_estimee', 'active']
    list_filter = ['active', 'paroisse__district__region']
    search_fields = ['nom', 'paroisse__nom']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(Itineraire)
class ItineraireAdmin(gis_admin.GISModelAdmin):
    list_display = ['paroisse_depart', 'paroisse_arrivee', 'distance_km', 'type_transport', 'active']
    list_filter = ['type_transport', 'difficulte', 'active']
    search_fields = ['nom', 'paroisse_depart__nom', 'paroisse_arrivee__nom']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(HistoriquePosition)
class HistoriquePositionAdmin(gis_admin.GISModelAdmin):
    list_display = ['type_objet', 'objet_id', 'utilisateur', 'date_changement']
    list_filter = ['type_objet', 'date_changement']
    search_fields = ['objet_id', 'utilisateur__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
