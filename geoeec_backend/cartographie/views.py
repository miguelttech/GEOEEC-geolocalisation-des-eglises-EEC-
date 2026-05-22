from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum, Q, F
from paroisses.models import Paroisse
from oeuvres.models import Oeuvre
from ouvriers.models import Ouvrier
from django.contrib.gis.geos import Point
from django.core.serializers.json import DjangoJSONEncoder
import json
from django.db.models import Case, When, IntegerField

class GeoJSONEncoder(DjangoJSONEncoder):
    """
    Encodeur JSON personnalisé pour gérer les objets géographiques
    """
    def default(self, obj):
        if hasattr(obj, 'coords'):
            return {
                'type': 'Point',
                'coordinates': list(obj.coords)
            }
        elif isinstance(obj, Point):
            return {
                'type': 'Point',
                'coordinates': [obj.x, obj.y]
            }
        return super().default(obj)

def serialize_location(location_field):
    """
    Fonction utilitaire pour sérialiser les champs de localisation
    """
    if location_field is None:
        return None
        
    if isinstance(location_field, Point):
        return {
            'latitude': location_field.y,
            'longitude': location_field.x,
            'coordinates': [location_field.x, location_field.y]  # GeoJSON format [lng, lat]
        }
    elif hasattr(location_field, 'coords'):
        coords = location_field.coords
        return {
            'latitude': coords[1],
            'longitude': coords[0],
            'coordinates': [coords[0], coords[1]]  # GeoJSON format [lng, lat]
        }
    elif isinstance(location_field, dict):
        return location_field
    else:
        return None

class CartographieStatisticsView(APIView):
    """
    Vue pour récupérer les statistiques globales de cartographie
    """
    def get(self, request):
        try:
            # Filtres dynamiques
            region_filter = request.query_params.get('region', 'all')
            district_filter = request.query_params.get('district', 'all')
            type_filter = request.query_params.get('type', 'all')
            
            # Construction des filtres
            paroisses_filter = Q()
            oeuvres_filter = Q()
            ouvriers_filter = Q()
            
            if region_filter != 'all':
                paroisses_filter &= Q(region_synodale__iexact=region_filter)
                ouvriers_filter &= Q(region_synodale__iexact=region_filter)
                
            if district_filter != 'all':
                paroisses_filter &= Q(district__iexact=district_filter)
                ouvriers_filter &= Q(district__iexact=district_filter)
                
            if type_filter != 'all':
                oeuvres_filter &= Q(type__iexact=type_filter)

            # Calculs de base
            paroisses_queryset = Paroisse.objects.filter(paroisses_filter)
            oeuvres_queryset = Oeuvre.objects.filter(oeuvres_filter)
            ouvriers_queryset = Ouvrier.objects.filter(ouvriers_filter)
            
            # Statistiques globales
            total_regions = paroisses_queryset.values('region_synodale').distinct().count()
            total_districts = paroisses_queryset.values('district').distinct().count()
            total_paroisses = paroisses_queryset.count()
            total_stations = paroisses_queryset.filter(niveau='station').count()
            total_annexes = paroisses_queryset.filter(niveau='annexe').count()
            
            # Calculs fidèles
            total_communiants = paroisses_queryset.aggregate(total=Sum('communiants'))['total'] or 0
            total_non_communiants = paroisses_queryset.aggregate(total=Sum('non_communiants'))['total'] or 0
            total_fideles = total_communiants + total_non_communiants
            
            # Œuvres et ouvriers
            total_oeuvres_actives = oeuvres_queryset.count()
            total_ouvriers_actifs = ouvriers_queryset.count()
            
            # Calculs géolocalisation
            paroisses_geolocalises = paroisses_queryset.filter(localisation__isnull=False).count()
            oeuvres_geolocalisees = oeuvres_queryset.filter(localisation__isnull=False).count()
            
            # Taux de géolocalisation
            taux_geolocalisation_paroisses = (paroisses_geolocalises / max(total_paroisses, 1)) * 100
            taux_geolocalisation_oeuvres = (oeuvres_geolocalisees / max(total_oeuvres_actives, 1)) * 100
            
            # Pourcentage communiants
            pourcentage_communiants = (total_communiants / max(total_fideles, 1)) * 100
            
            response_data = {
                "total_regions": total_regions,
                "total_districts": total_districts,
                "total_paroisses": total_paroisses,
                "total_stations": total_stations,
                "total_annexes": total_annexes,
                "total_fideles": total_fideles,
                "total_communiants": total_communiants,
                "total_non_communiants": total_non_communiants,
                "total_ouvriers_actifs": total_ouvriers_actifs,
                "total_oeuvres_actives": total_oeuvres_actives,
                "paroisses_geolocalises": paroisses_geolocalises,
                "oeuvres_geolocalisees": oeuvres_geolocalisees,
                "taux_geolocalisation_paroisses": round(taux_geolocalisation_paroisses, 1),
                "taux_geolocalisation_oeuvres": round(taux_geolocalisation_oeuvres, 1),
                "pourcentage_communiants": round(pourcentage_communiants, 1),
                "derniere_mise_a_jour": "2024-01-20T10:30:00Z"
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                "error": str(e),
                "total_regions": 0,
                "total_districts": 0,
                "total_paroisses": 0,
                "total_stations": 0,
                "total_annexes": 0,
                "total_fideles": 0,
                "total_communiants": 0,
                "total_non_communiants": 0,
                "total_ouvriers_actifs": 0,
                "total_oeuvres_actives": 0,
                "paroisses_geolocalises": 0,
                "oeuvres_geolocalisees": 0,
                "taux_geolocalisation_paroisses": 0,
                "taux_geolocalisation_oeuvres": 0,
                "pourcentage_communiants": 0,
                "derniere_mise_a_jour": None
            }, status=500)

class CartographieLayersView(APIView):
    """
    Vue pour récupérer les couches de données géographiques (GeoJSON)
    """
    def get(self, request):
        try:
            # Filtres
            region_filter = request.query_params.get('region', 'all')
            district_filter = request.query_params.get('district', 'all')
            type_filter = request.query_params.get('type', 'all')
            
            # Construction des filtres
            paroisses_filter = Q()
            oeuvres_filter = Q()
            ouvriers_filter = Q()
            
            if region_filter != 'all':
                paroisses_filter &= Q(region_synodale__iexact=region_filter)
                ouvriers_filter &= Q(region_synodale__iexact=region_filter)
                
            if district_filter != 'all':
                paroisses_filter &= Q(district__iexact=district_filter)
                ouvriers_filter &= Q(district__iexact=district_filter)
                
            if type_filter != 'all':
                oeuvres_filter &= Q(type__iexact=type_filter)

            # === PAROISSES ===
            paroisses_features = []
            paroisses_queryset = Paroisse.objects.filter(
                paroisses_filter & Q(localisation__isnull=False)
            )
            
            for paroisse in paroisses_queryset:
                location = serialize_location(paroisse.localisation)
                if location and location['coordinates']:
                    # Compter les œuvres de cette paroisse
                    oeuvres_count = 0
                    if hasattr(Oeuvre, 'paroisse'):
                        oeuvres_count = Oeuvre.objects.filter(paroisse=paroisse).count()
                    elif hasattr(Oeuvre, 'paroisse_nom'):
                        oeuvres_count = Oeuvre.objects.filter(paroisse_nom=paroisse.nom).count()
                    
                    # Compter les ouvriers
                    ouvriers_count = 0
                    if hasattr(Ouvrier, 'paroisse'):
                        ouvriers_count = Ouvrier.objects.filter(paroisse=paroisse).count()
                    elif hasattr(Ouvrier, 'paroisse_nom'):
                        ouvriers_count = Ouvrier.objects.filter(paroisse_nom=paroisse.nom).count()
                    
                    paroisses_features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": location['coordinates']
                        },
                        "properties": {
                            "id": paroisse.id,
                            "nom": paroisse.nom,
                            "niveau": paroisse.niveau,
                            "region_synodale": paroisse.region_synodale,
                            "district": paroisse.district,
                            "quartier": getattr(paroisse, 'quartier', ''),
                            "communiants": paroisse.communiants,
                            "non_communiants": paroisse.non_communiants,
                            "total_fideles": paroisse.communiants + paroisse.non_communiants,
                            "telephone": getattr(paroisse, 'telephone', ''),
                            "email": getattr(paroisse, 'email', ''),
                            "adresse": getattr(paroisse, 'adresse', ''),
                            "statut": getattr(paroisse, 'statut', 'active'),
                            "oeuvres_count": oeuvres_count,
                            "ouvriers_count": ouvriers_count
                        }
                    })

            # === ŒUVRES ===
            oeuvres_features = []
            oeuvres_queryset = Oeuvre.objects.filter(
                oeuvres_filter & Q(localisation__isnull=False)
            )
            
            for oeuvre in oeuvres_queryset:
                location = serialize_location(oeuvre.localisation)
                if location and location['coordinates']:
                    # Récupérer la paroisse associée
                    paroisse_nom = ''
                    if hasattr(oeuvre, 'paroisse') and oeuvre.paroisse:
                        paroisse_nom = oeuvre.paroisse.nom
                    elif hasattr(oeuvre, 'paroisse_nom'):
                        paroisse_nom = oeuvre.paroisse_nom or ''
                    
                    oeuvres_features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": location['coordinates']
                        },
                        "properties": {
                            "id": oeuvre.id,
                            "nom": oeuvre.nom,
                            "type": oeuvre.type,
                            "type_oeuvre": oeuvre.type,
                            "niveau": getattr(oeuvre, 'niveau', 'paroissial'),
                            "paroisse_nom": paroisse_nom,
                            "paroisse_id": getattr(oeuvre, 'paroisse_id', None),
                            "statut": getattr(oeuvre, 'statut', 'active'),
                            "remarques": getattr(oeuvre, 'remarques', ''),
                            "telephone": getattr(oeuvre, 'telephone', ''),
                            "email": getattr(oeuvre, 'email', ''),
                            "responsable": getattr(oeuvre, 'responsable', '')
                        }
                    })

            # === OUVRIERS ===
            ouvriers_features = []
            ouvriers_queryset = Ouvrier.objects.filter(ouvriers_filter)
            
            for ouvrier in ouvriers_queryset:
                # Pour les ouvriers, on peut utiliser la localisation de leur paroisse
                location = None
                
                if hasattr(ouvrier, 'localisation') and ouvrier.localisation:
                    location = serialize_location(ouvrier.localisation)
                elif hasattr(ouvrier, 'paroisse') and ouvrier.paroisse and ouvrier.paroisse.localisation:
                    location = serialize_location(ouvrier.paroisse.localisation)
                elif hasattr(ouvrier, 'paroisse_nom') and ouvrier.paroisse_nom:
                    try:
                        paroisse = Paroisse.objects.filter(nom=ouvrier.paroisse_nom).first()
                        if paroisse and paroisse.localisation:
                            location = serialize_location(paroisse.localisation)
                    except:
                        pass
                
                if location and location['coordinates']:
                    ouvriers_features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": location['coordinates']
                        },
                        "properties": {
                            "id": ouvrier.id,
                            "nom": ouvrier.nom,
                            "prenom": getattr(ouvrier, 'prenom', ''),
                            "grade": ouvrier.grade,
                            "paroisse_nom": getattr(ouvrier, 'paroisse_nom', ''),
                            "district": getattr(ouvrier, 'district', ''),
                            "region_synodale": getattr(ouvrier, 'region_synodale', ''),
                            "contact": getattr(ouvrier, 'contact', ''),
                            "telephone": getattr(ouvrier, 'telephone', ''),
                            "email": getattr(ouvrier, 'email', ''),
                            "statut": getattr(ouvrier, 'statut', 'actif'),
                            "date_ordination": getattr(ouvrier, 'date_ordination', None)
                        }
                    })

            response_data = {
                "paroisses": {
                    "type": "FeatureCollection",
                    "features": paroisses_features
                },
                "oeuvres": {
                    "type": "FeatureCollection", 
                    "features": oeuvres_features
                },
                "ouvriers": {
                    "type": "FeatureCollection",
                    "features": ouvriers_features
                },
                "zones_influence": {
                    "type": "FeatureCollection",
                    "features": []  # À implémenter si nécessaire
                },
                "itineraires": {
                    "type": "FeatureCollection",
                    "features": []  # À implémenter si nécessaire
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                "error": str(e),
                "paroisses": {"type": "FeatureCollection", "features": []},
                "oeuvres": {"type": "FeatureCollection", "features": []},
                "ouvriers": {"type": "FeatureCollection", "features": []},
                "zones_influence": {"type": "FeatureCollection", "features": []},
                "itineraires": {"type": "FeatureCollection", "features": []}
            }, status=500)

class CartographieSearchView(APIView):
    """
    Vue pour la recherche dans les données cartographiques
    """
    def get(self, request):
        try:
            query = request.query_params.get('q', '').strip()
            if not query:
                return Response({"results": []})
            
            results = []
            
            # Recherche dans les paroisses
            paroisses = Paroisse.objects.filter(
                Q(nom__icontains=query) | 
                Q(quartier__icontains=query) | 
                Q(region_synodale__icontains=query) |
                Q(district__icontains=query),
                localisation__isnull=False
            )[:10]
            
            for paroisse in paroisses:
                location = serialize_location(paroisse.localisation)
                if location:
                    results.append({
                        "id": f"paroisse_{paroisse.id}",
                        "nom": paroisse.nom,
                        "type": "paroisse",
                        "description": f"{paroisse.quartier}, {paroisse.district}",
                        "region": paroisse.region_synodale,
                        "district": paroisse.district,
                        "coordinates": location['coordinates'],
                        "details": {
                            "niveau": paroisse.niveau,
                            "communiants": paroisse.communiants,
                            "non_communiants": paroisse.non_communiants,
                            "total_fideles": paroisse.communiants + paroisse.non_communiants
                        }
                    })
            
            # Recherche dans les œuvres
            oeuvres = Oeuvre.objects.filter(
                Q(nom__icontains=query) | 
                Q(type__icontains=query) |
                Q(paroisse_nom__icontains=query),
                localisation__isnull=False
            )[:10]
            
            for oeuvre in oeuvres:
                location = serialize_location(oeuvre.localisation)
                if location:
                    results.append({
                        "id": f"oeuvre_{oeuvre.id}",
                        "nom": oeuvre.nom,
                        "type": "oeuvre",
                        "description": f"Œuvre {oeuvre.type}",
                        "paroisse": getattr(oeuvre, 'paroisse_nom', ''),
                        "coordinates": location['coordinates'],
                        "details": {
                            "type_oeuvre": oeuvre.type,
                            "niveau": getattr(oeuvre, 'niveau', 'paroissial'),
                            "statut": getattr(oeuvre, 'statut', 'active')
                        }
                    })
            
            return Response({"results": results[:20]})
            
        except Exception as e:
            return Response({
                "error": str(e),
                "results": []
            }, status=500)

# Nouvelles vues pour les options de filtre dynamiques
class RegionListView(APIView):
    """
    Vue pour récupérer la liste unique des régions synodales
    """
    def get(self, request):
        regions = Paroisse.objects.values_list('region_synodale', flat=True).distinct().order_by('region_synodale')
        # Filtrer les valeurs None ou vides
        return Response(list(filter(None, regions)))

class DistrictListView(APIView):
    """
    Vue pour récupérer la liste unique des districts
    """
    def get(self, request):
        districts = Paroisse.objects.values_list('district', flat=True).distinct().order_by('district')
        # Filtrer les valeurs None ou vides
        return Response(list(filter(None, districts)))

class OeuvreTypeListView(APIView):
    """
    Vue pour récupérer la liste unique des types d'œuvres
    """
    def get(self, request):
        types = Oeuvre.objects.values_list('type', flat=True).distinct().order_by('type')
        # Filtrer les valeurs None ou vides
        return Response(list(filter(None, types)))
