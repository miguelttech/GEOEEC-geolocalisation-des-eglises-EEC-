from django.core.cache import cache

from rest_framework.test import APITestCase
from rest_framework import status

from apps.geo.models import RegionSynodale, District
from apps.audit.models import LogActivite
from .models import User


class PatchCompteEscaladePrivilegesTests(APITestCase):
    """
    SEC-1 (audit du 20/07/2026) : le PATCH générique de user_detail utilisait
    UserSerializer sans restreindre role/region/district/paroisse/
    permissions_custom/is_active. Un admin REGION ou DISTRICT pouvait donc,
    une fois le contrôle de zone initial passé, s'auto-attribuer ou attribuer
    à un tiers un rôle supérieur, ou déplacer un compte vers une autre zone.
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.region_b = RegionSynodale.objects.create(nom="CENTRE")
        self.district_a = District.objects.create(nom="WOURI", region=self.region_a)

        self.admin_region = User.objects.create_user(
            username="admin_region", password="x", role="REGION", region=self.region_a,
        )
        self.admin_district = User.objects.create_user(
            username="admin_district", password="x", role="DISTRICT",
            region=self.region_a, district=self.district_a,
        )

    def test_region_ne_peut_pas_promouvoir_un_compte_en_super(self):
        self.client.force_authenticate(self.admin_region)
        resp = self.client.patch(
            f"/api/auth/users/{self.admin_district.id}/", {"role": "SUPER"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)  # champ ignoré, pas d'erreur
        self.admin_district.refresh_from_db()
        self.assertEqual(self.admin_district.role, "DISTRICT")

    def test_region_ne_peut_pas_deplacer_un_compte_vers_une_autre_region(self):
        self.client.force_authenticate(self.admin_region)
        resp = self.client.patch(
            f"/api/auth/users/{self.admin_district.id}/",
            {"region": self.region_b.id}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.admin_district.refresh_from_db()
        self.assertEqual(self.admin_district.region_id, self.region_a.id)

    def test_region_ne_peut_pas_sauto_attribuer_des_permissions_custom(self):
        self.client.force_authenticate(self.admin_region)
        resp = self.client.patch(
            f"/api/auth/users/{self.admin_district.id}/",
            {"permissions_custom": {"peut_supprimer_paroisse": True}}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.admin_district.refresh_from_db()
        self.assertEqual(self.admin_district.permissions_custom, {})

    def test_region_ne_peut_pas_reactiver_un_compte_via_ce_patch(self):
        self.admin_district.is_active = False
        self.admin_district.save(update_fields=["is_active"])
        self.client.force_authenticate(self.admin_region)
        resp = self.client.patch(
            f"/api/auth/users/{self.admin_district.id}/", {"is_active": True}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.admin_district.refresh_from_db()
        self.assertFalse(self.admin_district.is_active)

    def test_les_champs_de_profil_restent_modifiables(self):
        """Non-régression : le PATCH doit toujours fonctionner pour un usage légitime."""
        self.client.force_authenticate(self.admin_region)
        resp = self.client.patch(
            f"/api/auth/users/{self.admin_district.id}/",
            {"telephone": "699000000", "first_name": "Jean"}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.admin_district.refresh_from_db()
        self.assertEqual(self.admin_district.telephone, "699000000")
        self.assertEqual(self.admin_district.first_name, "Jean")


class DashboardActiviteRecenteScopeTests(APITestCase):
    """
    SEC-3 (audit du 20/07/2026) : le bloc "activité récente" de
    /api/auth/dashboard-stats/ n'était filtré par aucun scope — un admin
    REGION/DISTRICT y voyait les dernières actions de TOUTE la plateforme,
    toutes régions confondues, alors que le reste de l'endpoint est scopé.
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

    def test_admin_region_ne_voit_pas_lactivite_dune_autre_region(self):
        self.client.force_authenticate(self.admin_region_a)
        resp = self.client.get("/api/auth/dashboard-stats/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        descriptions = [a["description"] for a in resp.data["activite_recente"]]
        self.assertIn("Connexion région A", descriptions)
        self.assertNotIn("Connexion région B", descriptions)

    def test_super_voit_lactivite_de_toutes_les_regions(self):
        super_admin = User.objects.create_user(
            username="super", password="x", role="SUPER",
        )
        self.client.force_authenticate(super_admin)
        resp = self.client.get("/api/auth/dashboard-stats/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        descriptions = [a["description"] for a in resp.data["activite_recente"]]
        self.assertIn("Connexion région A", descriptions)
        self.assertIn("Connexion région B", descriptions)


class PasswordResetThrottleTests(APITestCase):
    """
    SEC-4 (audit du 20/07/2026) : password_reset_request n'avait aucune
    limite de débit, contrairement à login/register — un attaquant pouvait
    spammer les e-mails de réinitialisation d'un compte ciblé ou saturer
    le SMTP configuré. Taux : 5/heure par IP (voir DEFAULT_THROTTLE_RATES).
    """

    def setUp(self):
        # Évite qu'un compteur de throttle laissé par un run précédent
        # (même IP, même scope, cache Redis partagé) ne fausse le test.
        cache.clear()

    def test_password_reset_est_limite_en_debit(self):
        for _ in range(5):
            resp = self.client.post(
                "/api/auth/password-reset/", {"email": "inconnu@example.com"}, format="json",
            )
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        resp = self.client.post(
            "/api/auth/password-reset/", {"email": "inconnu@example.com"}, format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class RbacCreationEtSuppressionCompteTests(APITestCase):
    """
    QA-1 (audit du 20/07/2026) — cas de test T1 (hiérarchie de création) et
    T2 (suppression d'admin réservée au SUPER) de
    docs/TODO_REFONTE_ADMIN.md §5, jusqu'ici jamais couverts par des tests.
    """

    def setUp(self):
        self.region_a = RegionSynodale.objects.create(nom="LITTORAL")
        self.district_a = District.objects.create(nom="WOURI", region=self.region_a)

        self.super_admin = User.objects.create_user(username="super", password="x", role="SUPER")
        self.admin_region = User.objects.create_user(
            username="admin_region", password="x", role="REGION", region=self.region_a,
        )
        self.admin_district = User.objects.create_user(
            username="admin_district", password="x", role="DISTRICT",
            region=self.region_a, district=self.district_a,
        )

    # T1 — un admin RÉGION ne peut créer que des admins DISTRICT, jamais PAROISSE
    def test_region_ne_peut_pas_creer_un_admin_paroisse(self):
        self.client.force_authenticate(self.admin_region)
        resp = self.client.post(
            "/api/auth/users/create/",
            {"username": "nouvel_admin", "email": "n@example.com", "role": "PAROISSE"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="nouvel_admin").exists())

    # T1 — un admin PAROISSE ne peut créer aucun compte
    def test_paroisse_ne_peut_creer_aucun_compte(self):
        admin_paroisse = User.objects.create_user(
            username="admin_paroisse", password="x", role="PAROISSE",
        )
        self.client.force_authenticate(admin_paroisse)
        resp = self.client.post(
            "/api/auth/users/create/",
            {"username": "x", "email": "x@example.com", "role": "PAROISSE"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # T2 — suppression d'un compte admin réservée au SUPER
    def test_district_ne_peut_pas_supprimer_un_compte(self):
        self.client.force_authenticate(self.admin_district)
        resp = self.client.delete(f"/api/auth/users/{self.admin_region.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(id=self.admin_region.id).exists())

    def test_super_peut_supprimer_un_compte(self):
        self.client.force_authenticate(self.super_admin)
        resp = self.client.delete(f"/api/auth/users/{self.admin_district.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.admin_district.id).exists())
