"""
Tests de non-régression du cache des listes publiques (eec_core/cache.py).

Le bug d'origine : la clé de cache était fixe ("geo:paroisses:list:v1") alors
que la réponse dépend de la pagination. La première requête arrivée imposait
donc sa réponse à toutes les autres pendant 10 minutes — une requête sans
`page_size` (robot, sonde de supervision, essai depuis Swagger) suffisait à
faire afficher 50 paroisses sur 488 à la carte publique, par intermittence et
sans trace dans les logs.

Ces tests verrouillent les trois propriétés qui doivent tenir :
  1. deux paginations différentes ne partagent jamais une entrée de cache ;
  2. le cache anonyme n'est jamais servi à un utilisateur authentifié
     (son contenu dépend de son périmètre RBAC) — et réciproquement ;
  3. un paramètre inconnu ne crée pas d'entrée de cache supplémentaire
     (sinon un visiteur anonyme peut saturer Redis en bouclant sur ?x=1,2,3…).

Le cache est forcé en mémoire locale : ces tests ne doivent ni dépendre de
Redis, ni polluer le cache de développement — dans lequel vivent aussi les
sessions (SESSION_ENGINE = cache).
"""

from django.core.cache import cache
from django.test import override_settings
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory, APITestCase

from apps.accounts.models import User
from apps.geo.models import RegionSynodale, District, Paroisse
from eec_core.cache import build_public_list_cache_key


CACHE_LOCAL = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "tests-cache-listes-publiques",
    }
}


@override_settings(CACHES=CACHE_LOCAL)
class CacheListePubliqueTests(APITestCase):

    def setUp(self):
        cache.clear()
        self.region = RegionSynodale.objects.create(nom="LITTORAL")
        self.autre_region = RegionSynodale.objects.create(nom="CENTRE")
        self.district = District.objects.create(nom="WOURI", region=self.region)
        self.autre_district = District.objects.create(nom="MFOUNDI", region=self.autre_region)
        # 12 paroisses dans le district principal, 3 dans l'autre : de quoi
        # distinguer une réponse paginée d'une réponse complète.
        for i in range(12):
            Paroisse.objects.create(nom=f"Paroisse {i:02d}", district=self.district)
        for i in range(3):
            Paroisse.objects.create(nom=f"Autre {i:02d}", district=self.autre_district)

    def _noms(self, resp):
        return [p["nom"] for p in resp.json()["results"]]

    # ------------------------------------------------------------------
    # 1. La pagination fait partie de l'identité de la réponse
    # ------------------------------------------------------------------

    def test_page_size_ne_partage_pas_le_cache_dune_requete_sans_page_size(self):
        """Le scénario exact qui tronquait la carte en production."""
        # Une requête « nue » arrive en premier et remplit le cache.
        nue = self.client.get("/api/geo/paroisses/?page_size=5")
        self.assertEqual(len(self._noms(nue)), 5)

        # La carte demande tout : elle doit recevoir les 15, pas les 5 en cache.
        carte = self.client.get("/api/geo/paroisses/?page_size=3000")
        self.assertEqual(len(self._noms(carte)), 15)

        # Et la requête nue doit toujours renvoyer 5 après coup.
        self.assertEqual(len(self._noms(self.client.get("/api/geo/paroisses/?page_size=5"))), 5)

    def test_deux_pages_ne_partagent_pas_le_cache(self):
        page1 = self._noms(self.client.get("/api/geo/paroisses/?page_size=5&page=1"))
        page2 = self._noms(self.client.get("/api/geo/paroisses/?page_size=5&page=2"))
        self.assertEqual(len(page1), 5)
        self.assertEqual(len(page2), 5)
        self.assertNotEqual(page1, page2, "page 2 a servi la réponse mise en cache pour la page 1")

    def test_deux_filtres_differents_ne_partagent_pas_le_cache(self):
        a = self._noms(self.client.get(f"/api/geo/paroisses/?district={self.district.id}&page_size=3000"))
        b = self._noms(self.client.get(f"/api/geo/paroisses/?district={self.autre_district.id}&page_size=3000"))
        self.assertEqual(len(a), 12)
        self.assertEqual(len(b), 3)

    # ------------------------------------------------------------------
    # 2. Étanchéité entre le cache public et les périmètres RBAC
    # ------------------------------------------------------------------

    def test_un_admin_ne_recoit_pas_le_cache_public(self):
        # Le visiteur anonyme remplit le cache avec la liste nationale.
        public = self._noms(self.client.get("/api/geo/paroisses/?page_size=3000"))
        self.assertEqual(len(public), 15)

        admin_district = User.objects.create_user(
            username="admin_wouri", password="x", role="DISTRICT",
            region=self.region, district=self.district,
        )
        self.client.force_authenticate(admin_district)
        vu_par_admin = self._noms(self.client.get("/api/geo/paroisses/?page_size=3000"))
        self.assertEqual(len(vu_par_admin), 12, "l'admin district a hérité de la liste nationale en cache")

    def test_un_admin_qui_passe_en_premier_nempoisonne_pas_le_public(self):
        admin_district = User.objects.create_user(
            username="admin_wouri", password="x", role="DISTRICT",
            region=self.region, district=self.district,
        )
        self.client.force_authenticate(admin_district)
        self.assertEqual(len(self._noms(self.client.get("/api/geo/paroisses/?page_size=3000"))), 12)

        self.client.force_authenticate(None)
        public = self._noms(self.client.get("/api/geo/paroisses/?page_size=3000"))
        self.assertEqual(len(public), 15, "le visiteur public a hérité du périmètre de l'admin")

    # ------------------------------------------------------------------
    # 3. Un paramètre inconnu ne crée pas d'entrée de cache
    # ------------------------------------------------------------------

    def _requete_drf(self, url):
        """build_public_list_cache_key() lit .query_params : c'est un attribut
        de la Request de DRF, absent de la WSGIRequest de Django."""
        return Request(APIRequestFactory().get(url))

    def test_parametre_inconnu_partage_la_meme_cle(self):
        """Sinon : /api/geo/paroisses/?x=1, ?x=2… sature Redis sans authentification."""
        pagination = {"page", "page_size"}
        cle_nue = build_public_list_cache_key(
            "geo:paroisses:list", self._requete_drf("/api/geo/paroisses/?page_size=3000"), pagination
        )
        cle_bruit = build_public_list_cache_key(
            "geo:paroisses:list", self._requete_drf("/api/geo/paroisses/?page_size=3000&zzz=42"), pagination
        )
        self.assertEqual(cle_nue, cle_bruit)

    def test_parametres_repetes_donnent_des_cles_distinctes(self):
        """QueryDict.items() n'aurait gardé que la dernière valeur."""
        self.assertNotEqual(
            build_public_list_cache_key(
                "statistiques:list", self._requete_drf("/api/statistiques/?annee=2025"), {"annee"}
            ),
            build_public_list_cache_key(
                "statistiques:list", self._requete_drf("/api/statistiques/?annee=2025&annee=2026"), {"annee"}
            ),
        )
