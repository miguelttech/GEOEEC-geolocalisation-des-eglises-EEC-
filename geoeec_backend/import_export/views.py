# import_export/views.py

import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from paroisses.models import Paroisse
from paroisses.serializers import ParoisseSerializer
from ouvriers.models import Ouvrier
from ouvriers.serializers import OuvrierSerializer
import pandas as pd
from django.contrib.gis.geos import Point
from oeuvres.models import Oeuvre, TypeOeuvre, NiveauOeuvre
from oeuvres.serializers import OeuvreSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

def normalize_type(type_str):
    """Normalise le nom de colonne en type connu."""
    mapping = {
        "scolaire": TypeOeuvre.SCOLAIRE,
        "universitaire": TypeOeuvre.UNIVERSITAIRE,
        "médicale": TypeOeuvre.MEDICALE,
        "agropastorale": TypeOeuvre.AGROPASTORALE,
        "immeuble": TypeOeuvre.IMMEUBLE,
        "terrain": TypeOeuvre.TERRAIN,
        "autre": TypeOeuvre.AUTRE
    }

    for key in mapping:
        if key in type_str.lower():
            return mapping[key]
    return TypeOeuvre.AUTRE



class ImportParoissesView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'file', openapi.IN_FORM,
                description="Fichier Excel contenant les paroisses",
                type=openapi.TYPE_FILE,
                required=True
            )
        ]
    )
    def post(self, request):
        excel_file = request.FILES.get("file")
        if not excel_file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            return Response({"error": f"Erreur de lecture : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        imported, errors = 0, []

        for index, row in df.iterrows():
            try:
                latitude = row.get('Coord_x')
                longitude = row.get('Coord_y')
                localisation = Point(float(longitude), float(latitude)) if pd.notna(latitude) and pd.notna(longitude) else None

                data = {
                    'nom': str(row.get('Nom de la paroisse')).strip(),
                    'niveau': str(row.get('Niveau')).strip(),
                    'region_synodale': str(row.get('Region_synodale')).strip(),
                    'district': str(row.get('districts')).strip(),
                    'quartier': str(row.get('Quartier')).strip(),
                    'communiants': row.get('communiants') or 0,
                    'non_communiants': row.get('non-communiants') or 0,
                    'ouvriers': row.get('ouvriers') or 0,
                    'localisation': localisation
                }

                serializer = ParoisseSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()
                    imported += 1
                else:
                    errors.append({"ligne": index + 2, "erreurs": serializer.errors})

            except Exception as e:
                errors.append({"ligne": index + 2, "erreurs": str(e)})

        return Response({
            "message": f"{imported} paroisses importées avec succès.",
            "erreurs": errors
        }, status=status.HTTP_200_OK)
        
class ImportOuvriersView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('file', openapi.IN_FORM, description="Fichier Excel ", type=openapi.TYPE_FILE, required=True)
        ]
    )
    def post(self, request):
        excel_file = request.FILES.get("file")
        if not excel_file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            return Response({"error": f"Erreur de lecture : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        imported, errors = 0, []

        for index, row in df.iterrows():
            data= {
                'paroisse_nom' : str(row.get('Nom de la paroisse')).strip(),
                'region_synodale': str(row.get('Region_synodale')).strip(),
                'district': str(row.get('districts')).strip(),
                'nom': str(row.get('Nom')).strip(),
                'grade': str(row.get('Grade')).strip(),
                'contact': str(row.get('Contact')).strip(),
            }
            serializer = OuvrierSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                imported += 1
            else:
                errors.append({"ligne": index + 2, "erreurs": serializer.errors})

        return Response({
            "message": f"{imported} ouvriers importées avec succès.",
            "erreurs": errors
        }, status=status.HTTP_200_OK)

class ImportOeuvresView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'file', openapi.IN_FORM,
                description="Fichier Excel à importer (feuilles : Oeuvres_regionales, Oeuvres_districts, Oeuvres_paroissiales)",
                type=openapi.TYPE_FILE,
                required=True
            )
        ]
    )
    def post(self, request):
        excel_file = request.FILES.get("file")
        if not excel_file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            xls = pd.ExcelFile(excel_file)
        except Exception as e:
            return Response({"error": f"Erreur de lecture du fichier Excel : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        imported = 0
        errors = []

        # ===== 1. Oeuvres régionales =====
        if "Oeuvres_regionales" in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name="Oeuvres_regionales")
            for idx, row in df.iterrows():
                region = str(row.get("Region Synodale", "")).strip()

                columns = list(df.columns)
                i = 1
                while i < len(columns) - 2:
                    nom_col = columns[i]
                    if "Point_X" in nom_col:
                        type_col = columns[i - 1]
                        y_col = columns[i + 1]

                        nom_oeuvre = str(row.get(type_col, "")).strip()
                        x = row.get(nom_col)
                        y = row.get(y_col)

                        if pd.notna(nom_oeuvre) and pd.notna(x) and pd.notna(y):
                            oeuvre_data = {
                                "nom": nom_oeuvre,
                                "type": normalize_type(type_col),
                                "niveau": NiveauOeuvre.REGIONAL,
                                "region_synodale": region,  # ✅ garder la région
                                "localisation": Point(float(x), float(y))
                            }

                            serializer = OeuvreSerializer(data=oeuvre_data)
                            if serializer.is_valid():
                                serializer.save()
                                imported += 1
                            else:
                                errors.append({"ligne": idx + 2, "erreurs": serializer.errors})
                        i += 3
                    else:
                        i += 1

        # ===== 2. Oeuvres de districts =====
        if "Oeuvres_districts" in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name="Oeuvres_districts")
            for idx, row in df.iterrows():
                district = str(row.get("œuvres_districts", "")).strip()
                region = str(row.get("Region Synodale", "")).strip()

                columns = list(df.columns)
                i = 2
                while i < len(columns) - 2:
                    nom_col = columns[i]
                    if "Point_X" in nom_col:
                        type_col = columns[i - 1]
                        y_col = columns[i + 1]

                        nom_oeuvre = str(row.get(type_col, "")).strip()
                        x = row.get(nom_col)
                        y = row.get(y_col)

                        if pd.notna(nom_oeuvre) and pd.notna(x) and pd.notna(y):
                            oeuvre_data = {
                                "nom": nom_oeuvre,
                                "type": normalize_type(type_col),
                                "niveau": NiveauOeuvre.DISTRICT,
                                "region_synodale": region,     # ✅ garder la région
                                "district": district, # ✅ ajouter le district
                                "localisation": Point(float(x), float(y))
                            }

                            serializer = OeuvreSerializer(data=oeuvre_data)
                            if serializer.is_valid():
                                serializer.save()
                                imported += 1
                            else:
                                errors.append({"ligne": idx + 2, "erreurs": serializer.errors})
                        i += 3
                    else:
                        i += 1

        # ===== 3. Oeuvres paroissiales =====
        if "Oeuvres_paroissiales" in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name="Oeuvres_paroissiales")
            for idx, row in df.iterrows():
                nom_paroisse = str(row.get("Nom de la paroisse", "")).strip()
                region = str(row.get("Region Synodale", "")).strip()
                district = str(row.get("District", "")).strip()

                if not nom_paroisse:
                    continue
                try:
                    paroisse = Paroisse.objects.get(nom__iexact=nom_paroisse)
                except Paroisse.DoesNotExist:
                    errors.append({"ligne": idx + 2, "erreurs": f"Paroisse '{nom_paroisse}' non trouvée"})
                    continue

                columns = list(df.columns)
                i = 3
                while i < len(columns) - 2:
                    nom_col = columns[i]
                    if "P_X" in nom_col:
                        type_col = columns[i - 1]
                        y_col = columns[i + 1]

                        nom_oeuvre = str(row.get(type_col, "")).strip()
                        x = row.get(nom_col)
                        y = row.get(y_col)

                        if pd.notna(nom_oeuvre) and pd.notna(x) and pd.notna(y):
                            oeuvre_data = {
                                "nom": nom_oeuvre,
                                "type": normalize_type(type_col),
                                "niveau": NiveauOeuvre.PAROISSIAL,
                                "region_synodale": region,         # ✅ garder la région
                                "district": district,     # ✅ garder le district
                                "paroisse": paroisse.id,  # ✅ garder la paroisse
                                "localisation": Point(float(x), float(y))
                            }

                            serializer = OeuvreSerializer(data=oeuvre_data)
                            if serializer.is_valid():
                                serializer.save()
                                imported += 1
                            else:
                                errors.append({"ligne": idx + 2, "erreurs": serializer.errors})
                        i += 3
                    else:
                        i += 1

        return Response({
            "message": f"{imported} œuvres importées avec succès.",
            "erreurs": errors
        }, status=status.HTTP_200_OK)




