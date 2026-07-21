from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User
from apps.geo.models import RegionSynodale, District, Paroisse
from .models import Ouvrier


class RbacOuvrierTests(APITestCase):
    """
    QA-1 (audit du 20/07/2026) — cas de test T1 (création hors zone), T2
    (suppression désactivée) et T3 (isolation) de docs/TODO_REFONTE_ADMIN.md §5.
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.region_b = RegionSynodale.objects.create(nom="CENTRE")
        self.district_a = District.objects.create(nom="WOURI", region=self.region_a)
        self.district_b = District.objects.create(nom="MFOUNDI", region=self.region_b)
        self.paroisse_a = Paroisse.objects.create(nom="Paroisse A", district=self.district_a)
        self.paroisse_b = Paroisse.objects.create(nom="Paroisse B", district=self.district_b)

        self.ouvrier_a = Ouvrier.objects.create(nom="Dupont", prenom="Jean", paroisse=self.paroisse_a)
        self.ouvrier_b = Ouvrier.objects.create(nom="Martin", prenom="Paul", paroisse=self.paroisse_b)

        self.super_admin = User.objects.create_user(username="super", password="x", role="SUPER")
        self.admin_region_a = User.objects.create_user(
            username="admin_region_a", password="x", role="REGION", region=self.region_a,
        )

    # T1 — création hors zone refusée
    def test_region_ne_peut_pas_creer_un_ouvrier_dans_une_autre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.post(
            "/api/ouvriers/ouvriers/",
            {"nom": "Pirate", "prenom": "X", "sexe": "M", "paroisse": self.paroisse_b.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Ouvrier.objects.filter(nom="Pirate").exists())

    def test_region_peut_creer_un_ouvrier_dans_sa_propre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.post(
            "/api/ouvriers/ouvriers/",
            {"nom": "Nouveau", "prenom": "X", "sexe": "M", "paroisse": self.paroisse_a.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    # T2 — suppression désactivée pour tout le monde
    def test_suppression_ouvrier_toujours_desactivee(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.delete(f"/api/ouvriers/ouvriers/{self.ouvrier_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Ouvrier.objects.filter(id=self.ouvrier_a.id).exists())

    # T3 — isolation géographique en lecture
    def test_region_ne_voit_pas_les_ouvriers_dune_autre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.get("/api/ouvriers/ouvriers/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [o["nom"] for o in resp.data["results"]]
        self.assertIn("Dupont", noms)
        self.assertNotIn("Martin", noms)
