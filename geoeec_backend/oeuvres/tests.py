import io
import pandas as pd
from django.test import TestCase
from paroisses.models import Paroisse
from django.urls import reverse
from io import BytesIO
from oeuvres.models import Oeuvre
from paroisses.models import Paroisse

def test_import_oeuvres_success(self):
    file = self.create_test_file()
    response = self.client.post(self.import_url, {'file': file}, format='multipart')

    print("Réponse API (succès) :", response.data)

    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["importes"], 1)
    self.assertEqual(Oeuvre.objects.count(), 1)

def test_import_oeuvres_paroisse_inexistante(self):
    file = self.create_test_file(include_existing_paroisse=False)
    response = self.client.post(self.import_url, {'file': file}, format='multipart')

    print("Réponse API (paroisse manquante) :", response.data)

    self.assertEqual(response.status_code, 200)
    self.assertIn("erreurs", response.data)
    self.assertGreaterEqual(len(response.data["erreurs"]), 1)


class ExportOeuvresExcelTests(TestCase):
    def setUp(self):
        self.paroisse = Paroisse.objects.create(nom="Paroisse C")
        Oeuvre.objects.create(
            nom="Hôpital Bethesda",
            categorie="Santé",
            type="Hôpital",
            quartier="Mimboman",
            latitude=3.89,
            longitude=11.53,
            paroisse=self.paroisse
        )

    def test_export_oeuvres_excel(self):
        url = reverse('export_oeuvres_excel')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        df = pd.read_excel(BytesIO(response.content))
        self.assertGreaterEqual(len(df), 1)
        self.assertIn("nom", df.columns)


class ExportOeuvresPDFTests(TestCase):
    def test_export_oeuvres_pdf(self):
        url = reverse('export_oeuvres_pdf')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn(b"%PDF", response.content[:1024])


class ExportTemplateOeuvresTests(TestCase):
    def test_export_template_oeuvres_excel(self):
        url = reverse('export_template_oeuvres')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        excel_data = BytesIO(response.content)
        df = pd.read_excel(excel_data)
        expected_columns = [
            "Nom de l'œuvre", "Catégorie de l'œuvre", "Type d'œuvre", "Quartier",
            "Latitude", "Longitude", "Paroisse de rattachement"
        ]
        self.assertListEqual(list(df.columns), expected_columns)
