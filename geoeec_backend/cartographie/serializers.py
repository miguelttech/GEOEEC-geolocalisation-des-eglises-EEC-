from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import (
    Region, District, Paroisse, Grade, Ouvrier, 
    TypeOeuvre, Oeuvre, StatistiqueAnnuelle,
    ZoneInfluence, Itineraire, HistoriquePosition
)

# Serializers de base
class RegionSerializer(serializers.ModelSerializer):
    total_paroisses = serializers.ReadOnlyField()
    total_fideles = serializers.ReadOnlyField()
    
    class Meta:
        model = Region
        fields = ['id', 'nom', 'code', 'description', 'date_creation', 'total_paroisses', 'total_fideles']

class DistrictSerializer(serializers.ModelSerializer):
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    
    class Meta:
        model = District
        fields = ['id', 'nom', 'code', 'region', 'region_nom', 'description', 'date_creation']

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'nom', 'niveau', 'description']

class TypeOeuvreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeOeuvre
        fields = ['id', 'nom', 'icone', 'couleur', 'description']

class StatistiqueAnnuelleSerializer(serializers.ModelSerializer):
    paroisse_nom = serializers.CharField(source='paroisse.nom', read_only=True)
    total_fideles = serializers.ReadOnlyField()
    
    class Meta:
        model = StatistiqueAnnuelle
        fields = [
            'id', 'paroisse', 'paroisse_nom', 'annee', 'communiants', 'non_communiants',
            'total_fideles', 'baptemes', 'confirmations', 'mariages', 'deces',
            'offrandes', 'dimes', 'validee', 'date_saisie'
        ]

# Serializers géographiques (GeoJSON)
class ParoisseGeoSerializer(GeoFeatureModelSerializer):
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    district_nom = serializers.CharField(source='district.nom', read_only=True)
    total_fideles = serializers.ReadOnlyField()
    pourcentage_communiants = serializers.ReadOnlyField()
    
    class Meta:
        model = Paroisse
        geo_field = 'localisation'
        fields = [
            'id', 'nom', 'quartier', 'niveau', 'region', 'region_nom',
            'district', 'district_nom', 'communiants', 'non_communiants',
            'ouvriers', 'total_fideles', 'pourcentage_communiants', 'adresse',
            'date_creation', 'actif'
        ]

class OuvrierGeoSerializer(GeoFeatureModelSerializer):
    grade_nom = serializers.CharField(source='grade.nom', read_only=True)
    paroisse_nom = serializers.CharField(source='paroisse.nom', read_only=True)
    region_nom = serializers.CharField(source='paroisse.region.nom', read_only=True)
    nom_complet = serializers.ReadOnlyField()
    
    class Meta:
        model = Ouvrier
        geo_field = 'localisation'
        fields = [
            'id', 'nom', 'prenom', 'nom_complet', 'grade', 'grade_nom',
            'paroisse', 'paroisse_nom', 'region_nom', 'statut',
            'date_naissance', 'date_ordination', 'telephone', 'email', 'adresse'
        ]

class OeuvreGeoSerializer(GeoFeatureModelSerializer):
    type_oeuvre_nom = serializers.CharField(source='type_oeuvre.nom', read_only=True)
    type_oeuvre_couleur = serializers.CharField(source='type_oeuvre.couleur', read_only=True)
    paroisse_nom = serializers.CharField(source='paroisse.nom', read_only=True)
    region_nom = serializers.CharField(source='paroisse.region.nom', read_only=True)
    
    class Meta:
        model = Oeuvre
        geo_field = 'localisation'
        fields = [
            'id', 'nom', 'type_oeuvre', 'type_oeuvre_nom', 'type_oeuvre_couleur',
            'niveau', 'paroisse', 'paroisse_nom', 'region_nom', 'description',
            'capacite', 'budget_annuel', 'statut', 'adresse', 'date_creation',
            'date_inauguration'
        ]

class ZoneInfluenceGeoSerializer(GeoFeatureModelSerializer):
    paroisse_nom = serializers.CharField(source='paroisse.nom', read_only=True)
    
    class Meta:
        model = ZoneInfluence
        geo_field = 'geometrie'
        fields = [
            'id', 'nom', 'paroisse', 'paroisse_nom', 'rayon_km',
            'population_estimee', 'description', 'active'
        ]

class ItineraireGeoSerializer(GeoFeatureModelSerializer):
    paroisse_depart_nom = serializers.CharField(source='paroisse_depart.nom', read_only=True)
    paroisse_arrivee_nom = serializers.CharField(source='paroisse_arrivee.nom', read_only=True)
    
    class Meta:
        model = Itineraire
        geo_field = 'geometrie'
        fields = [
            'id', 'nom', 'paroisse_depart', 'paroisse_depart_nom',
            'paroisse_arrivee', 'paroisse_arrivee_nom', 'distance_km',
            'duree_minutes', 'type_transport', 'difficulte', 'description', 'active'
        ]

# Serializers pour les listes simples
class ParoisseListSerializer(serializers.ModelSerializer):
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    district_nom = serializers.CharField(source='district.nom', read_only=True)
    total_fideles = serializers.ReadOnlyField()
    
    class Meta:
        model = Paroisse
        fields = [
            'id', 'nom', 'quartier', 'niveau', 'region_nom', 'district_nom',
            'communiants', 'non_communiants', 'total_fideles', 'ouvriers'
        ]

# Serializers pour les statistiques
class StatistiquesGeneralesSerializer(serializers.Serializer):
    total_regions = serializers.IntegerField()
    total_districts = serializers.IntegerField()
    total_paroisses = serializers.IntegerField()
    total_stations = serializers.IntegerField()
    total_annexes = serializers.IntegerField()
    total_fideles = serializers.IntegerField()
    total_communiants = serializers.IntegerField()
    total_ouvriers_actifs = serializers.IntegerField()
    total_oeuvres_actives = serializers.IntegerField()
    pourcentage_communiants = serializers.FloatField()

class StatistiquesRegionalesSerializer(serializers.Serializer):
    region = serializers.CharField()
    total_paroisses = serializers.IntegerField()
    total_fideles = serializers.IntegerField()
    total_communiants = serializers.IntegerField()
    total_ouvriers = serializers.IntegerField()
    pourcentage_communiants = serializers.FloatField()

class HeatmapDataSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    intensity = serializers.FloatField()
    nom = serializers.CharField()
    type = serializers.CharField()

class StatisticsResponseSerializer(serializers.Serializer):
    """Serializer pour la réponse des statistiques générales"""
    overview = serializers.DictField()
    regions_stats = serializers.ListField()
    oeuvres_stats = serializers.ListField()
    grades_stats = serializers.ListField()
    evolution_data = serializers.ListField()
    top_paroisses = serializers.ListField()
    filters = serializers.DictField()

class StatistiquesSerializer(serializers.Serializer):
    """Serializer pour les statistiques de cartographie"""
    total_paroisses = serializers.IntegerField()
    total_ouvriers = serializers.IntegerField()
    total_oeuvres = serializers.IntegerField()
    total_fideles = serializers.IntegerField()
    total_communiants = serializers.IntegerField()
    total_non_communiants = serializers.IntegerField()
    pourcentage_communiants = serializers.FloatField()
    paroisses_geolocalises = serializers.IntegerField()
    oeuvres_geolocalisees = serializers.IntegerField()
    taux_geolocalisation_paroisses = serializers.FloatField()
    taux_geolocalisation_oeuvres = serializers.FloatField()
    derniere_mise_a_jour = serializers.DateTimeField()

# Serializers pour les zones d'influence et itinéraires
class ZoneInfluenceSerializer(serializers.ModelSerializer):
    paroisse_nom = serializers.CharField(source='paroisse.nom', read_only=True)
    
    class Meta:
        model = ZoneInfluence
        fields = ['id', 'nom', 'paroisse', 'paroisse_nom', 'rayon_km', 'population_estimee', 'active']

class ItineraireSerializer(serializers.ModelSerializer):
    paroisse_depart_nom = serializers.CharField(source='paroisse_depart.nom', read_only=True)
    paroisse_arrivee_nom = serializers.CharField(source='paroisse_arrivee.nom', read_only=True)
    
    class Meta:
        model = Itineraire
        fields = [
            'id', 'nom', 'paroisse_depart', 'paroisse_depart_nom',
            'paroisse_arrivee', 'paroisse_arrivee_nom', 'distance_km',
            'duree_minutes', 'type_transport', 'difficulte', 'active'
        ]
