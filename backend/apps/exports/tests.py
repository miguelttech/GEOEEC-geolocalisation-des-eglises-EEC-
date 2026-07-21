from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User
from .views import MAX_IMPORT_SIZE


class ImportTailleFichierTests(APITestCase):
    """
    SEC-5 (audit du 20/07/2026) : les endpoints d'import Excel n'avaient
    aucune limite de taille, contrairement à l'upload d'avatar — un fichier
    volumineux pouvait saturer la mémoire/le CPU du worker au parsing
    openpyxl.
    """

    ENDPOINTS = [
        "/api/imports/paroisses/",
        "/api/imports/oeuvres/",
        "/api/imports/ouvriers/",
    ]

    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="super", password="x", role="SUPER",
        )
        self.client.force_authenticate(self.super_admin)

    def test_les_imports_refusent_un_fichier_trop_volumineux(self):
        contenu = b"0" * (MAX_IMPORT_SIZE + 1)
        for url in self.ENDPOINTS:
            with self.subTest(url=url):
                fichier = SimpleUploadedFile(
                    "gros_fichier.xlsx", contenu,
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                resp = self.client.post(url, {"file": fichier}, format="multipart")
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("volumineux", resp.data["detail"])
