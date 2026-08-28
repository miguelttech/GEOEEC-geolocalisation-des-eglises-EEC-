"""
=============================================================================
Cache des listes publiques de l'API EEC
=============================================================================

POURQUOI CE FICHIER ?
  La carte publique charge, à chaque ouverture, six listes complètes
  (régions, districts, paroisses, œuvres, ouvriers, statistiques). Ces
  données sont quasi statiques — elles ne bougent que lorsqu'un
  administrateur les modifie — mais elles étaient resérialisées depuis
  PostgreSQL à chaque visiteur : ~1,8 s de CPU backend par ouverture de
  carte, soit un plafond d'environ 1,6 carte/s avec les workers gunicorn
  de production. Insuffisant pour l'audience nationale visée.

  Ce module centralise la mise en cache Redis de ces listes. Il existait
  déjà dans apps/geo/views.py, appliqué aux seules entités géographiques ;
  il est extrait ici pour être réutilisé par les œuvres, les ouvriers et
  les statistiques, sans dupliquer la logique quatre fois.

LA CLÉ DE CACHE DOIT DÉPENDRE DES PARAMÈTRES QUI CHANGENT LA RÉPONSE
  L'implémentation précédente utilisait une clé fixe ("geo:paroisses:list:v1")
  alors que la réponse, elle, dépend de la pagination : `page_size` n'était
  pas pris en compte. Conséquence, reproduite en local :

      1. GET /api/geo/paroisses/                → 50 paroisses, mises en cache
      2. GET /api/geo/paroisses/?page_size=3000 → 50 paroisses (au lieu de 488)

  La première requête arrivée imposait sa réponse à toutes les autres
  pendant 10 minutes. En production, une requête sans `page_size` (robot
  d'indexation, sonde de supervision, essai depuis Swagger) suffisait à
  faire afficher 50 paroisses sur 488 à la carte, par intermittence.

  Chaque vue déclare donc `cache_key_params` : l'ensemble EXACT des
  paramètres qu'elle honore réellement dans get_queryset(), pagination
  comprise. La clé est dérivée de ceux-là seulement.

POURQUOI PAS SIMPLEMENT TOUTE LA QUERY STRING ?
  Ce serait plus simple, mais ça ouvrirait une porte : un visiteur anonyme
  bouclant sur /api/geo/paroisses/?zzz=1, ?zzz=2, ?zzz=3… créerait autant
  d'entrées Redis de ~190 Ko chacune, sans jamais toucher le même cache —
  saturation mémoire garantie, et aucune authentification requise pour le
  faire. En ne retenant que les paramètres reconnus, un paramètre inconnu
  est ignoré : il ne change ni le queryset ni la clé, donc les deux
  requêtes partagent légitimement la même entrée. Le nombre de clés
  possibles reste borné par les valeurs réelles en base.

CE QUI N'EST PAS MIS EN CACHE
  · Les requêtes authentifiées — leur contenu dépend du périmètre RBAC de
    l'utilisateur (filter_*_by_scope). Les mutualiser dans un cache commun
    ferait fuiter les données d'une région vers une autre. Un administrateur
    voit donc toujours l'état réel de la base, sans délai.
  · Les requêtes portant un filtre à forte cardinalité (`search=...`) —
    texte libre, donc une entrée Redis distincte par frappe de clavier.

FRAÎCHEUR
  TTL de 10 minutes. Une modification faite par un administrateur peut donc
  mettre jusqu'à 10 minutes à apparaître sur la carte **publique** ; elle est
  visible immédiatement dans l'interface d'administration, qui est
  authentifiée et n'emprunte jamais ce cache. C'est le compromis déjà retenu
  pour les paroisses, étendu ici aux autres listes.
=============================================================================
"""

import hashlib

from django.core.cache import cache
from rest_framework.response import Response

# Durée de vie par défaut d'une liste publique en cache (secondes).
DEFAULT_LIST_TTL = 600

# Paramètres de pagination honorés par StandardPagination — ils changent la
# réponse de TOUTE liste paginée, donc ils entrent dans toutes les clés.
PAGINATION_PARAMS = frozenset({"page", "page_size"})


def get_or_compute_cached(cache_key, compute_fn, ttl=DEFAULT_LIST_TTL):
    """Cache simple, sans attente bloquante : en cas de miss, calcule et
    stocke. Pas de sleep() ici — un worker WSGI sync bloqué en sleep ne
    peut traiter aucune autre requête, ce qui aggrave la charge au lieu
    de la réduire quand beaucoup de requêtes arrivent en même temps."""
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = compute_fn()
    cache.set(cache_key, result, ttl)
    return result


def build_public_list_cache_key(prefix, request, params_pertinents):
    """Clé de cache dérivée du préfixe et des seuls paramètres pertinents.

    On passe par .lists() (et non .items()) pour gérer correctement les
    paramètres répétés (?annee=2025&annee=2026), dont QueryDict.items() ne
    renverrait que la dernière valeur — deux requêtes différentes
    partageraient alors la même clé.

    Le suffixe de version (v2) invalide d'un coup les entrées écrites par
    l'ancienne implémentation à clé fixe : sans lui, un déploiement
    hériterait des réponses tronquées déjà présentes dans Redis.
    """
    retenus = sorted(
        (cle, sorted(valeurs))
        for cle, valeurs in request.query_params.lists()
        if cle in params_pertinents
    )
    if not retenus:
        return f"{prefix}:v2:nu"
    empreinte = hashlib.sha1(repr(retenus).encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:v2:{empreinte}"


class PublicListCacheMixin:
    """Met en cache la réponse de `list()` pour les visiteurs anonymes.

    À placer AVANT le ViewSet dans les bases de la classe, pour que son
    `list()` s'intercale devant celui de DRF :

        class OeuvreViewSet(PublicListCacheMixin, viewsets.ModelViewSet):
            cache_prefix = "oeuvres:list"
            cache_key_params = frozenset({"type", "region", ...})
            cache_bypass_params = frozenset({"search"})

    `cache_key_params` doit lister TOUS les paramètres que get_queryset()
    prend en compte, hors pagination (ajoutée automatiquement) et hors
    paramètres de `cache_bypass_params`. En oublier un ramène exactement le
    bug corrigé ici : deux réponses différentes sous une même clé.

    `cache_bypass_params` désigne les paramètres à trop forte cardinalité
    pour être mis en cache (texte libre) : leur présence court-circuite
    entièrement le cache.
    """

    cache_prefix = None
    cache_ttl = DEFAULT_LIST_TTL
    cache_key_params = frozenset()
    cache_bypass_params = frozenset()

    def list(self, request, *args, **kwargs):
        # `super().list` est résolu MAINTENANT, hors du lambda : la forme
        # super() sans argument s'appuie sur la cellule __class__ de la
        # méthode courante, absente du scope d'un lambda.
        liste_parente = super().list

        if self.cache_prefix is None:
            return liste_parente(request, *args, **kwargs)

        # Réponse dépendante du périmètre RBAC → jamais mutualisée.
        if request.user.is_authenticated:
            return liste_parente(request, *args, **kwargs)

        if any(p in request.query_params for p in self.cache_bypass_params):
            return liste_parente(request, *args, **kwargs)

        cle = build_public_list_cache_key(
            self.cache_prefix, request, self.cache_key_params | PAGINATION_PARAMS
        )
        data = get_or_compute_cached(
            cle,
            lambda: liste_parente(request, *args, **kwargs).data,
            self.cache_ttl,
        )
        return Response(data)
