from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User
from apps.geo.models import RegionSynodale
from .models import LogActivite


class JournalIsolationTests(APITestCase):
    """
    QA-1 (audit du 20/07/2026) — cas de test T3 (isolation géographique) de
    docs/TODO_REFONTE_ADMIN.md §5, appliqué directement à /api/audit/journal/
    (au-delà du bloc "activité récente" du dashboard déjà couvert par SEC-3).
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.region_b = RegionSynodale.objects.create(nom="CENTRE")

        self.admin_region_a = User.objects.create_user(
            username="admin_region_a", password="x", role="REGION", region=self.region_a,
        )
        self.admin_region_b = User.objects.create_user(
            username="admin_region_b", password="x", role="REGION", region=self.region_b,
        )

        LogActivite.objects.create(
            utilisateur=self.admin_region_a, action="LOGIN",
            type_objet="systeme", description="Connexion région A",
        )
        LogActivite.objects.create(
            utilisateur=self.admin_region_b, action="LOGIN",
            type_objet="systeme", description="Connexion région B",
        )

    def test_admin_region_ne_voit_que_les_logs_de_sa_zone(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.get("/api/audit/journal/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        descriptions = [l["description"] for l in resp.data["results"]]
        self.assertIn("Connexion région A", descriptions)
        self.assertNotIn("Connexion région B", descriptions)

    def test_super_voit_tous_les_logs(self):
        super_admin = User.objects.create_user(username="super", password="x", role="SUPER")
        self.client.force_authenticate(super_admin)
        resp = self.client.get("/api/audit/journal/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        descriptions = [l["description"] for l in resp.data["results"]]
        self.assertIn("Connexion région A", descriptions)
        self.assertIn("Connexion région B", descriptions)
