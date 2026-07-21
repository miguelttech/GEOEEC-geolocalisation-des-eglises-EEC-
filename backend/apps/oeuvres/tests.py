from rest_framework.test import APITestCase
from rest_framework import status

from apps.accounts.models import User
from apps.geo.models import RegionSynodale, District, Paroisse
from .models import TypeOeuvre, Oeuvre


class RbacOeuvreTests(APITestCase):
    """
    QA-1 (audit du 20/07/2026) — matrice de permissions §1.1 et cas de test
    T1 (création hors zone), T2 (suppression désactivée) et T10 (champs
    modifiables restreints) de docs/TODO_REFONTE_ADMIN.md §5.
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.region_b = RegionSynodale.objects.create(nom="CENTRE")
        self.district_a = District.objects.create(nom="WOURI", region=self.region_a)
        self.district_b = District.objects.create(nom="MFOUNDI", region=self.region_b)
        self.paroisse_a = Paroisse.objects.create(nom="Paroisse A", district=self.district_a)
        self.paroisse_b = Paroisse.objects.create(nom="Paroisse B", district=self.district_b)

        self.type_scolaire = TypeOeuvre.objects.create(nom="SCOLAIRE")

        self.oeuvre_a = Oeuvre.objects.create(
            nom="École A", type_oeuvre=self.type_scolaire, paroisse=self.paroisse_a,
        )
        self.oeuvre_b = Oeuvre.objects.create(
            nom="École B", type_oeuvre=self.type_scolaire, paroisse=self.paroisse_b,
        )

        self.super_admin = User.objects.create_user(username="super", password="x", role="SUPER")
        self.admin_region_a = User.objects.create_user(
            username="admin_region_a", password="x", role="REGION", region=self.region_a,
        )

    # T1 — création hors zone refusée
    def test_region_ne_peut_pas_creer_une_oeuvre_dans_une_autre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.post(
            "/api/oeuvres/oeuvres/",
            {"nom": "École pirate", "type_oeuvre": self.type_scolaire.id,
             "paroisse": self.paroisse_b.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Oeuvre.objects.filter(nom="École pirate").exists())

    def test_region_peut_creer_une_oeuvre_dans_sa_propre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.post(
            "/api/oeuvres/oeuvres/",
            {"nom": "École neuve", "type_oeuvre": self.type_scolaire.id,
             "paroisse": self.paroisse_a.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    # T2 — suppression désactivée pour tout le monde
    def test_suppression_oeuvre_toujours_desactivee(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.delete(f"/api/oeuvres/oeuvres/{self.oeuvre_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Oeuvre.objects.filter(id=self.oeuvre_a.id).exists())

    # T10 — champs modifiables restreints à nom/telephone/adresse
    def test_modification_oeuvre_refuse_le_rattachement_et_accepte_le_nom(self):
        self.client.force_authenticate(self.super_admin)

        resp = self.client.patch(
            f"/api/oeuvres/oeuvres/{self.oeuvre_a.id}/",
            {"paroisse": self.paroisse_b.id}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.oeuvre_a.refresh_from_db()
        self.assertEqual(self.oeuvre_a.paroisse_id, self.paroisse_a.id)

        resp = self.client.patch(
            f"/api/oeuvres/oeuvres/{self.oeuvre_a.id}/",
            {"nom": "École A renommée", "telephone": "699000000"}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.oeuvre_a.refresh_from_db()
        self.assertEqual(self.oeuvre_a.nom, "École A renommée")

    # T3 — isolation géographique en lecture
    def test_region_ne_voit_pas_les_oeuvres_dune_autre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.get("/api/oeuvres/oeuvres/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [o["nom"] for o in resp.data["results"]]
        self.assertIn("École A", noms)
        self.assertNotIn("École B", noms)
