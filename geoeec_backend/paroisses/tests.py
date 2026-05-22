import io
import pandas as pd
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from paroisses.models import Paroisse
from django.urls import reverse
from io import BytesIO

class ImportParoisseTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def create_test_file(self):
        # Générer un DataFrame équivalent au fichier d'import
        df = pd.DataFrame([{
            'Nom de la paroisse': 'Paroisse Test',
            'Niveau': 'Paroisse',
            'Region_synodale': 'Centre',
            'districts': 'District A',
            'Quartier': 'Quartier 1',
            'Latitude': 3.867,
            'Longitude': 11.502,
            'Altitude': 100,
            'Précision': 5,
            'Effectif des fidèles (communiants)': 120,
            '(non-communiants)': 30,
            'Effectif des ouvriers': 3
        }])

        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        return SimpleUploadedFile("paroisses.xlsx", buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    def test_import_paroisses_success(self):
        file = self.create_test_file()
        response = self.client.post("/api/import/paroisses/", {"file": file}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Paroisse.objects.count(), 1)
        self.assertEqual(response.data["importes"], 1)
        self.assertEqual(response.data["erreurs"], [])

    def test_import_paroisses_missing_file(self):
        response = self.client.post("/api/import/paroisses/", {}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn("Aucun fichier fourni", response.data["error"])


class ExportParoissesExcelTests(TestCase):
    def setUp(self):
        Paroisse.objects.create(
            nom="Paroisse Centrale",
            niveau="Paroisse",
            region_synodale="Centre",
            district="District 1",
            quartier="Essos",
            latitude=3.88,
            longitude=11.52,
            altitude=720,
            precision="Bonne",
            effectif_fideles=120,
            effectif_non_communiants=40,
            effectif_ouvriers=4
        )

    def test_export_paroisses_excel(self):
        url = reverse('export_paroisses_excel')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        df = pd.read_excel(BytesIO(response.content))
        self.assertGreaterEqual(len(df), 1)
        self.assertIn("Nom de la paroisse", df.columns)


class ExportParoissesPDFTests(TestCase):
    def test_export_paroisses_pdf(self):
        url = reverse('export_paroisses_pdf')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn(b"%PDF", response.content[:1024])  # signature PDF
        

class ExportTemplateParoissesTests(TestCase):
    def test_export_template_paroisses_excel(self):
        url = reverse('export_template_paroisses')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        # Vérifier les colonnes du fichier
        excel_data = BytesIO(response.content)
        df = pd.read_excel(excel_data)
        expected_columns = [
            "Nom de la paroisse", "Niveau", "Region_synodale", "districts",
            "Quartier", "Latitude", "Longitude", "Altitude", "Précision",
            "Effectif des fidèles (communiants)", "(non-communiants)", "Effectif des ouvriers"
        ]
        self.assertListEqual(list(df.columns), expected_columns)
