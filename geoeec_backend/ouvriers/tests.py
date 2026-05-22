import io
import pandas as pd
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from paroisses.models import Paroisse
from ouvriers.models import Ouvrier
from django.urls import reverse
from io import BytesIO

class ImportOuvriersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.paroisse = Paroisse.objects.create(
            nom="Paroisse Test",
            niveau="Paroisse",
            region_synodale="Centre",
            district="District A",
            quartier="Quartier 1"
        )

    def create_test_file(self):
        ouvriers_text = "Jean Dupont; Pasteur; 699000000\nMarie Claire; Ancien; 690000001"
        df = pd.DataFrame([{
            'Nom de la paroisse': 'Paroisse Test',
            'Noms, grades et contacts': ouvriers_text
        }])

        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        return SimpleUploadedFile("ouvriers.xlsx", buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    def test_import_ouvriers_success(self):
        file = self.create_test_file()
        response = self.client.post("/api/import/ouvriers/", {"file": file}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Ouvrier.objects.count(), 2)
        self.assertEqual(response.data["importes"], 2)
        self.assertEqual(response.data["erreurs"], [])

    def test_import_ouvriers_paroisse_inexistante(self):
        # fichier avec une paroisse inexistante
        ouvriers_text = "Jean Dupont; Pasteur; 699000000"
        df = pd.DataFrame([{
            'Nom de la paroisse': 'Inconnue',
            'Noms, grades et contacts': ouvriers_text
        }])

        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        file = SimpleUploadedFile("ouvriers.xlsx", buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        response = self.client.post("/api/import/ouvriers/", {"file": file}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Ouvrier.objects.count(), 0)
        self.assertEqual(len(response.data["erreurs"]), 1)


class ExportOuvriersExcelTests(TestCase):
    def setUp(self):
        self.paroisse = Paroisse.objects.create(nom="Paroisse B")
        Ouvrier.objects.create(
            nom="Jean Doe",
            grade="Pasteur",
            contact="690123456",
            paroisse=self.paroisse
        )

    def test_export_ouvriers_excel(self):
        url = reverse('export_ouvriers_excel')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        df = pd.read_excel(BytesIO(response.content))
        self.assertGreaterEqual(len(df), 1)
        self.assertIn("nom", df.columns)


class ExportOuvriersPDFTests(TestCase):
    def test_export_ouvriers_pdf(self):
        url = reverse('export_ouvriers_pdf')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn(b"%PDF", response.content[:1024])


class ExportTemplateOuvriersTests(TestCase):
    def test_export_template_ouvriers_excel(self):
        url = reverse('export_template_ouvriers')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        excel_data = BytesIO(response.content)
        df = pd.read_excel(excel_data)
        expected_columns = ["Nom de la paroisse", "Noms, grades et contacts"]
        self.assertListEqual(list(df.columns), expected_columns)
