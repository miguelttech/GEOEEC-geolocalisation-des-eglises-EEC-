"""
Pagination standard de l'API EEC.

Par défaut DRF pagine à 50 et n'autorise PAS le client à demander plus.
La carte a besoin de charger des centaines d'entités (paroisses, œuvres,
ouvriers, statistiques) : avec 50/page, le frontend doit enchaîner ~48 requêtes
séquentielles → chargement très lent (plusieurs dizaines de secondes).

Cette classe autorise `?page_size=...` (jusqu'à max_page_size), ce qui permet au
frontend de tout récupérer en une seule requête par endpoint.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 3000
