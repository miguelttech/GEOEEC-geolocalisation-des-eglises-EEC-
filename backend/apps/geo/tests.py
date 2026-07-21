from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User
from .models import RegionSynodale, District, Paroisse


class RbacParoisseTests(APITestCase):
    """
    QA-1 (audit du 20/07/2026) — matrice de permissions documentée dans
    docs/TODO_REFONTE_ADMIN.md §1.1 et §5 (T1, T2, T3), jusqu'ici jamais
    couverte par des tests automatisés.
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.region_b = RegionSynodale.objects.create(nom="CENTRE")
        self.district_a = District.objects.create(nom="WOURI", region=self.region_a)
        self.district_b = District.objects.create(nom="MFOUNDI", region=self.region_b)
        self.paroisse_a = Paroisse.objects.create(nom="Paroisse A", district=self.district_a)
        self.paroisse_b = Paroisse.objects.create(nom="Paroisse B", district=self.district_b)

        self.super_admin = User.objects.create_user(username="super", password="x", role="SUPER")
        self.admin_district_a = User.objects.create_user(
            username="admin_district_a", password="x", role="DISTRICT",
            region=self.region_a, district=self.district_a,
        )

    # T1 — création interdite d'une paroisse par un non-SUPER
    def test_seul_super_peut_creer_une_paroisse(self):
        self.client.force_authenticate(self.admin_district_a)
        resp = self.client.post(
            "/api/geo/paroisses/",
            {"nom": "Nouvelle Paroisse", "district": self.district_a.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Paroisse.objects.filter(nom="Nouvelle Paroisse").exists())

    def test_super_peut_creer_une_paroisse(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.post(
            "/api/geo/paroisses/",
            {"nom": "Nouvelle Paroisse", "district": self.district_a.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    # T2 — suppression désactivée pour tout le monde, y compris SUPER
    def test_suppression_paroisse_toujours_desactivee(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.delete(f"/api/geo/paroisses/{self.paroisse_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Paroisse.objects.filter(id=self.paroisse_a.id).exists())

    # T3 — isolation géographique en lecture
    def test_district_ne_voit_pas_les_paroisses_dune_autre_region(self):
        self.client.force_authenticate(self.admin_district_a)
        resp = self.client.get("/api/geo/paroisses/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [p["nom"] for p in resp.data["results"]]
        self.assertIn("Paroisse A", noms)
        self.assertNotIn("Paroisse B", noms)

    def test_district_ne_peut_pas_modifier_une_paroisse_dune_autre_region(self):
        self.client.force_authenticate(self.admin_district_a)
        resp = self.client.patch(
            f"/api/geo/paroisses/{self.paroisse_b.id}/", {"nom": "Piratée"}, format="json",
        )
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.paroisse_b.refresh_from_db()
        self.assertEqual(self.paroisse_b.nom, "Paroisse B")
