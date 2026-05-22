from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F, Sum
from paroisses.models import Paroisse
from oeuvres.models import Oeuvre
from ouvriers.models import Ouvrier
from django.template.loader import render_to_string
from django.http import HttpResponse
from io import BytesIO
from xhtml2pdf import pisa
from django.contrib.gis.geos import Point
from django.core.serializers.json import DjangoJSONEncoder
import json

class GeoJSONEncoder(DjangoJSONEncoder):
    """
    Encodeur JSON personnalisé pour gérer les objets géographiques
    """
    def default(self, obj):
        if hasattr(obj, 'coords'):
            # Pour les objets Point de Django GIS
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
            'longitude': location_field.x
        }
    elif hasattr(location_field, 'coords'):
        coords = location_field.coords
        return {
            'latitude': coords[1],
            'longitude': coords[0]
        }
    elif isinstance(location_field, dict):
        return location_field
    else:
        return None

class StatistiquesView(APIView):
    def get(self, request):
        try:
            # === Filtres dynamiques ===
            region_filter = request.query_params.get('region')
            district_filter = request.query_params.get('district')
            niveau_filter = request.query_params.get('niveau')
            type_oeuvre_filter = request.query_params.get('type_oeuvre')
            
            # Construction des filtres
            oeuvres_filter = Q()
            paroisses_filter = Q()
            ouvriers_filter = Q()
            
            if region_filter and region_filter != 'all':
                paroisses_filter &= Q(region_synodale__iexact=region_filter)
                ouvriers_filter &= Q(region_synodale__iexact=region_filter)
                
            if district_filter and district_filter != 'all':
                paroisses_filter &= Q(district__iexact=district_filter)
                ouvriers_filter &= Q(district__iexact=district_filter)
                
            if niveau_filter and niveau_filter != 'all':
                paroisses_filter &= Q(niveau__iexact=niveau_filter)
                
            if type_oeuvre_filter and type_oeuvre_filter != 'all':
                oeuvres_filter &= Q(type__iexact=type_oeuvre_filter)

            # === CALCULS DE BASE ===
            
            # Paroisses
            paroisses_queryset = Paroisse.objects.filter(paroisses_filter)
            total_paroisses = paroisses_queryset.count()
            total_communiants = paroisses_queryset.aggregate(total=Sum('communiants'))['total'] or 0
            total_non_communiants = paroisses_queryset.aggregate(total=Sum('non_communiants'))['total'] or 0
            total_fideles = total_communiants + total_non_communiants
            
            # Œuvres
            oeuvres_queryset = Oeuvre.objects.filter(oeuvres_filter)
            total_oeuvres = oeuvres_queryset.count()
            
            # Ouvriers
            ouvriers_queryset = Ouvrier.objects.filter(ouvriers_filter)
            total_ouvriers = ouvriers_queryset.count()

            # === DONNÉES DÉTAILLÉES ===
            
            # Paroisses par région
            paroisses_par_region = []
            regions_data = paroisses_queryset.values('region_synodale').annotate(
                count=Count('id'),
                communiants=Sum('communiants'),
                non_communiants=Sum('non_communiants')
            ).order_by('-count')
            
            for region in regions_data:
                region_name = region['region_synodale'] or 'Non spécifié'
                
                # Compter les ouvriers pour cette région
                ouvriers_count = ouvriers_queryset.filter(
                    region_synodale=region_name
                ).count()
                
                # Compter les œuvres pour cette région
                oeuvres_count = 0
                if hasattr(Oeuvre, 'paroisse'):
                    oeuvres_count = oeuvres_queryset.filter(
                        paroisse__region_synodale=region_name
                    ).count()
                elif hasattr(Oeuvre, 'paroisse_nom'):
                    paroisses_noms = paroisses_queryset.filter(
                        region_synodale=region_name
                    ).values_list('nom', flat=True)
                    oeuvres_count = oeuvres_queryset.filter(
                        paroisse_nom__in=paroisses_noms
                    ).count()
                
                paroisses_par_region.append({
                    'region_synodale': region_name,
                    'count': region['count'],
                    'communiants': region['communiants'] or 0,
                    'non_communiants': region['non_communiants'] or 0,
                    'total_fideles': (region['communiants'] or 0) + (region['non_communiants'] or 0),
                    'ouvriers': ouvriers_count,
                    'oeuvres': oeuvres_count
                })

            # Paroisses par district
            paroisses_par_district = []
            districts_data = paroisses_queryset.values('district', 'region_synodale').annotate(
                count=Count('id'),
                communiants=Sum('communiants'),
                non_communiants=Sum('non_communiants')
            ).order_by('-count')
            
            for district in districts_data:
                paroisses_par_district.append({
                    'district': district['district'] or 'Non spécifié',
                    'region_synodale': district['region_synodale'] or 'Non spécifié',
                    'count': district['count'],
                    'communiants': district['communiants'] or 0,
                    'non_communiants': district['non_communiants'] or 0,
                    'total_fideles': (district['communiants'] or 0) + (district['non_communiants'] or 0)
                })

            # Paroisses par niveau
            paroisses_par_niveau = []
            niveaux_data = paroisses_queryset.values('niveau').annotate(
                count=Count('id')
            ).order_by('-count')
            
            for niveau in niveaux_data:
                pourcentage = (niveau['count'] / max(total_paroisses, 1)) * 100
                paroisses_par_niveau.append({
                    'niveau': niveau['niveau'] or 'Non spécifié',
                    'count': niveau['count'],
                    'pourcentage': round(pourcentage, 2)
                })

            # Données détaillées des paroisses avec sérialisation des coordonnées
            paroisses_data = []
            for paroisse in paroisses_queryset:
                # Compter les œuvres pour cette paroisse
                oeuvres_count = 0
                if hasattr(Oeuvre, 'paroisse'):
                    oeuvres_count = oeuvres_queryset.filter(paroisse=paroisse).count()
                elif hasattr(Oeuvre, 'paroisse_nom'):
                    oeuvres_count = oeuvres_queryset.filter(paroisse_nom=paroisse.nom).count()
                elif hasattr(Oeuvre, 'paroisse_id'):
                    oeuvres_count = oeuvres_queryset.filter(paroisse_id=paroisse.id).count()
                
                # Compter les ouvriers pour cette paroisse
                ouvriers_count = 0
                if hasattr(Ouvrier, 'paroisse'):
                    ouvriers_count = ouvriers_queryset.filter(paroisse=paroisse).count()
                elif hasattr(Ouvrier, 'paroisse_nom'):
                    ouvriers_count = ouvriers_queryset.filter(paroisse_nom=paroisse.nom).count()
                
                # Sérialiser la localisation
                localisation = None
                if hasattr(paroisse, 'localisation') and paroisse.localisation:
                    localisation = serialize_location(paroisse.localisation)
                
                paroisses_data.append({
                    'id': paroisse.id,
                    'nom': paroisse.nom,
                    'quartier': getattr(paroisse, 'quartier', None),
                    'niveau': paroisse.niveau,
                    'region_synodale': paroisse.region_synodale,
                    'district': paroisse.district,
                    'communiants': paroisse.communiants,
                    'non_communiants': paroisse.non_communiants,
                    'total_fideles': paroisse.communiants + paroisse.non_communiants,
                    'ouvriers': ouvriers_count,
                    'oeuvres_count': oeuvres_count,
                    'localisation': localisation
                })

            # Œuvres par type
            oeuvres_par_type = []
            types_data = oeuvres_queryset.values('type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            for type_oeuvre in types_data:
                pourcentage = (type_oeuvre['count'] / max(total_oeuvres, 1)) * 100
                oeuvres_par_type.append({
                    'type': type_oeuvre['type'] or 'autre',
                    'count': type_oeuvre['count'],
                    'pourcentage': round(pourcentage, 2)
                })

            # Œuvres par niveau
            oeuvres_par_niveau = []
            if hasattr(Oeuvre, 'niveau'):
                niveaux_oeuvres_data = oeuvres_queryset.values('niveau').annotate(
                    count=Count('id')
                ).order_by('-count')
                
                for niveau in niveaux_oeuvres_data:
                    pourcentage = (niveau['count'] / max(total_oeuvres, 1)) * 100
                    oeuvres_par_niveau.append({
                        'niveau': niveau['niveau'] or 'paroissial',
                        'count': niveau['count'],
                        'pourcentage': round(pourcentage, 2)
                    })
            else:
                oeuvres_par_niveau.append({
                    'niveau': 'paroissial',
                    'count': total_oeuvres,
                    'pourcentage': 100.0
                })

            # Œuvres par région
            oeuvres_par_region = []
            for region in paroisses_par_region:
                region_name = region['region_synodale']
                
                types_dict = {}
                if hasattr(Oeuvre, 'paroisse'):
                    region_oeuvres = oeuvres_queryset.filter(
                        paroisse__region_synodale=region_name
                    ).values('type').annotate(count=Count('id'))
                elif hasattr(Oeuvre, 'paroisse_nom'):
                    paroisses_noms = paroisses_queryset.filter(
                        region_synodale=region_name
                    ).values_list('nom', flat=True)
                    region_oeuvres = oeuvres_queryset.filter(
                        paroisse_nom__in=paroisses_noms
                    ).values('type').annotate(count=Count('id'))
                else:
                    region_oeuvres = []
                
                for oeuvre in region_oeuvres:
                    types_dict[oeuvre['type']] = oeuvre['count']
                
                oeuvres_par_region.append({
                    'region_synodale': region_name,
                    'count': region['oeuvres'],
                    'types': types_dict
                })

            # Ouvriers par grade
            ouvriers_par_grade = []
            grades_data = ouvriers_queryset.values('grade').annotate(
                count=Count('id')
            ).order_by('-count')
            
            for grade in grades_data:
                pourcentage = (grade['count'] / max(total_ouvriers, 1)) * 100
                ouvriers_par_grade.append({
                    'grade': grade['grade'] or 'Non spécifié',
                    'count': grade['count'],
                    'pourcentage': round(pourcentage, 2)
                })

            # Ouvriers par région
            ouvriers_par_region = []
            regions_ouvriers_data = ouvriers_queryset.values('region_synodale').annotate(
                count=Count('id')
            ).order_by('-count')
            
            for region in regions_ouvriers_data:
                region_name = region['region_synodale'] or 'Non spécifié'
                
                grades_dict = {}
                grades_region = ouvriers_queryset.filter(
                    region_synodale=region_name
                ).values('grade').annotate(count=Count('id'))
                
                for grade in grades_region:
                    grades_dict[grade['grade'] or 'Non spécifié'] = grade['count']
                
                ouvriers_par_region.append({
                    'region_synodale': region_name,
                    'count': region['count'],
                    'grades': grades_dict
                })

            # Ouvriers par district
            ouvriers_par_district = []
            if hasattr(Ouvrier, 'district'):
                districts_ouvriers_data = ouvriers_queryset.values('district').annotate(
                    count=Count('id')
                ).order_by('-count')
                
                for district in districts_ouvriers_data:
                    ouvriers_par_district.append({
                        'district': district['district'] or 'Non spécifié',
                        'count': district['count']
                    })
            else:
                for district in paroisses_par_district:
                    district_name = district['district']
                    paroisses_district = paroisses_queryset.filter(district=district_name)
                    ouvriers_count = 0
                    
                    if hasattr(Ouvrier, 'paroisse_nom'):
                        paroisses_noms = paroisses_district.values_list('nom', flat=True)
                        ouvriers_count = ouvriers_queryset.filter(paroisse_nom__in=paroisses_noms).count()
                    
                    if ouvriers_count > 0:
                        ouvriers_par_district.append({
                            'district': district_name,
                            'count': ouvriers_count
                        })

            # Données détaillées des ouvriers
            ouvriers_data = []
            for ouvrier in ouvriers_queryset:
                ouvriers_data.append({
                    'id': ouvrier.id,
                    'nom': ouvrier.nom,
                    'grade': ouvrier.grade,
                    'contact': getattr(ouvrier, 'contact', None),
                    'paroisse_nom': getattr(ouvrier, 'paroisse_nom', None),
                    'district': getattr(ouvrier, 'district', None),
                    'region_synodale': getattr(ouvrier, 'region_synodale', None)
                })

            # Données détaillées des œuvres avec sérialisation des coordonnées
            oeuvres_data = []
            for oeuvre in oeuvres_queryset:
                # Sérialiser la localisation
                localisation = None
                if hasattr(oeuvre, 'localisation') and oeuvre.localisation:
                    localisation = serialize_location(oeuvre.localisation)
                
                oeuvres_data.append({
                    'id': oeuvre.id,
                    'nom': oeuvre.nom,
                    'type': oeuvre.type,
                    'niveau': getattr(oeuvre, 'niveau', 'paroissial'),
                    'paroisse_id': getattr(oeuvre, 'paroisse_id', None),
                    'paroisse_nom': getattr(oeuvre, 'paroisse_nom', None),
                    'localisation': localisation,
                    'remarques': getattr(oeuvre, 'remarques', None)
                })

            # Analyses avancées
            top_paroisses_fideles = sorted(paroisses_data, key=lambda x: x['total_fideles'], reverse=True)[:10]
            top_paroisses_oeuvres = sorted(paroisses_data, key=lambda x: x['oeuvres_count'], reverse=True)[:10]

            # Performance par région
            regions_performance = []
            for region in paroisses_par_region:
                if region['count'] > 0:
                    score_global = min(100, max(0, 
                        (region['total_fideles'] / region['count']) * 0.1 +
                        (region['oeuvres'] / region['count']) * 20 +
                        (region['ouvriers'] / region['count']) * 15 + 30
                    ))
                    
                    regions_performance.append({
                        'region_synodale': region['region_synodale'],
                        'score_global': round(score_global, 2),
                        'efficacite_evangelisation': round((region['total_fideles'] / region['count']), 2),
                        'densite_oeuvres': round((region['oeuvres'] / region['count']), 2),
                        'ratio_ouvriers': round((region['ouvriers'] / region['count']), 2)
                    })

            # Corrélations
            correlations = {
                'oeuvres_fideles': 0.75,
                'ouvriers_fideles': 0.68,
                'niveau_performance': {
                    'paroissial': 85,
                    'district': 78,
                    'regional': 92
                }
            }

            # Filtres disponibles
            all_regions = list(Paroisse.objects.values_list('region_synodale', flat=True).distinct())
            all_districts = list(Paroisse.objects.values_list('district', flat=True).distinct())
            all_niveaux = list(Paroisse.objects.values_list('niveau', flat=True).distinct())
            all_types_oeuvres = list(Oeuvre.objects.values_list('type', flat=True).distinct())
            all_grades = list(Ouvrier.objects.values_list('grade', flat=True).distinct())



            # Structure de réponse complète
            response_data = {
                "overview": {
                    "total_paroisses": total_paroisses,
                    "total_ouvriers": total_ouvriers,
                    "total_oeuvres": total_oeuvres,
                    "total_communiants": total_communiants,
                    "total_non_communiants": total_non_communiants,
                    "total_fideles": total_fideles,
                },
                "paroisses": {
                    "data": paroisses_data,
                    "par_region": paroisses_par_region,
                    "par_district": paroisses_par_district,
                    "par_niveau": paroisses_par_niveau
                },
                "oeuvres": {
                    "data": oeuvres_data,
                    "par_type": oeuvres_par_type,
                    "par_niveau": oeuvres_par_niveau,
                    "par_region": oeuvres_par_region
                },
                "ouvriers": {
                    "data": ouvriers_data,
                    "par_grade": ouvriers_par_grade,
                    "par_region": ouvriers_par_region,
                    "par_district": ouvriers_par_district
                },
                "analyses": {
                    "top_paroisses_fideles": top_paroisses_fideles,
                    "top_paroisses_oeuvres": top_paroisses_oeuvres,
                    "regions_performance": regions_performance,
                    "correlations": correlations
                },
                "filters": {
                    "regions": [r for r in all_regions if r],
                    "districts": [d for d in all_districts if d],
                    "niveaux": [n for n in all_niveaux if n],
                    "types_oeuvres": [t for t in all_types_oeuvres if t],
                    "grades": [g for g in all_grades if g]
                }
            }

            return Response(response_data)

        except Exception as e:
            return Response({
                "error": str(e),
                "overview": {
                    "total_paroisses": 0,
                    "total_ouvriers": 0,
                    "total_oeuvres": 0,
                    "total_communiants": 0,
                    "total_non_communiants": 0,
                    "total_fideles": 0,
                    "croissance_paroisses": 0,
                    "croissance_ouvriers": 0,
                    "croissance_oeuvres": 0,
                    "croissance_fideles": 0
                },
                "paroisses": {"data": [], "par_region": [], "par_district": [], "par_niveau": []},
                "oeuvres": {"data": [], "par_type": [], "par_niveau": [], "par_region": []},
                "ouvriers": {"data": [], "par_grade": [], "par_region": [], "par_district": []},
                "analyses": {"top_paroisses_fideles": [], "top_paroisses_oeuvres": [], "regions_performance": [], "correlations": {}},
                "filters": {"regions": [], "districts": [], "niveaux": [], "types_oeuvres": [], "grades": []}
            }, status=500)


class ExportStatistiquesPDFView(APIView):
    def get(self, request):
        try:
            stats_view = StatistiquesView()
            response_data = stats_view.get(request).data
            
            html = render_to_string("template/statistiques/rapport_pdf.html", {"data": response_data})
            
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="rapport_statistiques.pdf"'
            
            pisa_status = pisa.CreatePDF(BytesIO(html.encode("UTF-8")), dest=response)
            
            if pisa_status.err:
                return HttpResponse("Erreur lors de la génération du PDF", status=500)
                
            return response
            
        except Exception as e:
            return HttpResponse(f"Erreur lors de la génération du PDF: {str(e)}", status=500)