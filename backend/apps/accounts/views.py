"""
=============================================================================
FICHIER N°15 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/accounts/views.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/accounts/serializers.py, apps/accounts/models.py
UTILISÉ PAR: eec_core/urls.py
=============================================================================

OBJECTIF :
  Logique des endpoints pour les statistiques annuelles.

ENDPOINTS GÉRÉS ICI :
  GET /api/statistiques/                  → liste de toutes les statistiques
  GET /api/statistiques/{id}/             → une statistique précise
  GET /api/statistiques/?paroisse=5       → stats d'une paroisse
  GET /api/statistiques/?annee=2025       → stats d'une année
  GET /api/statistiques/totaux/?annee=2025 → totaux agrégés EEC

LA PARTICULARITÉ DE CETTE VIEW :
  En plus des actions standard (list, retrieve), elle a une action
  personnalisée "totaux" qui retourne les SOMMES (agrégats) de toutes
  les statistiques filtrées.
  C'est utile pour le tableau de bord : "Total fidèles EEC 2025 = 183 470"
=============================================================================
"""

# Sum : fonction SQL d'agrégation pour calculer la somme d'une colonne
# Exemple : Sum("communiants") → SELECT SUM(communiants) FROM ...
from django.db.models import Sum

from rest_framework import viewsets, permissions
from rest_framework.decorators import action   # Pour l'action personnalisée "totaux"
from rest_framework.response import Response   # Pour retourner une réponse JSON custom

from .models import StatistiqueAnnuelle
from .serializers import StatistiqueAnnuelleSerializer


class StatistiqueAnnuelleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 545 statistiques annuelles (une par paroisse pour 2025).

    FILTRES DISPONIBLES (cumulables) :
      ?paroisse={id}  → stats d'une paroisse spécifique
      ?district={id}  → stats de toutes les paroisses d'un district
      ?region={id}    → stats de toutes les paroisses d'une région
      ?annee={year}   → stats d'une année précise (ex: ?annee=2025)

    ACTION SPÉCIALE :
      GET /api/statistiques/totaux/          → sommes de toutes les stats
      GET /api/statistiques/totaux/?annee=2025 → sommes pour 2025 uniquement
      GET /api/statistiques/totaux/?region=5   → sommes pour une région
    """

    # AllowAny : les statistiques EEC sont publiques (pas de données personnelles)
    permission_classes = [permissions.AllowAny]
    serializer_class = StatistiqueAnnuelleSerializer

    def get_queryset(self):
        """
        Construit la requête SQL de base et applique les filtres.

        .select_related() charge les relations FK en une seule requête SQL :
          paroisse → district → region
        Sans select_related, Django ferait une requête séparée pour chaque
        stat pour chercher la paroisse, puis une autre pour le district, etc.
        Avec 545 stats, ça ferait 545 × 3 = 1635 requêtes → très lent !
        Avec select_related, c'est 1 seule requête SQL (JOIN).
        """
        qs = (
            StatistiqueAnnuelle.objects
            .select_related(
                "paroisse",                    # charge la paroisse liée
                "paroisse__district",          # charge aussi le district de la paroisse
                "paroisse__district__region",  # charge aussi la région du district
            )
            # Tri : d'abord par année décroissante (2025 avant 2024), puis par nom
            .order_by("-annee", "paroisse__nom")
        )

        params = self.request.query_params  # Dictionnaire des paramètres d'URL

        # Filtre par paroisse : WHERE paroisse_id = ?
        paroisse_id = params.get("paroisse")
        if paroisse_id:
            qs = qs.filter(paroisse_id=paroisse_id)

        # Filtre par district : WHERE paroisse.district_id = ?
        district_id = params.get("district")
        if district_id:
            qs = qs.filter(paroisse__district_id=district_id)

        # Filtre par région : WHERE paroisse.district.region_id = ?
        region_id = params.get("region")
        if region_id:
            qs = qs.filter(paroisse__district__region_id=region_id)

        # Filtre par année : WHERE annee = ?
        annee = params.get("annee")
        if annee:
            qs = qs.filter(annee=annee)

        return qs

    @action(detail=False, url_path="totaux")
    def totaux(self, request):
        """
        Action personnalisée : retourne les totaux agrégés (sommes) EEC.

        URL : GET /api/statistiques/totaux/
        URL : GET /api/statistiques/totaux/?annee=2025
        URL : GET /api/statistiques/totaux/?region=10

        EXEMPLE DE RÉPONSE :
        {
          "total_communiants": 133935,
          "total_non_communiants": 49535,
          "total_baptemes": 0,
          "total_mariages": 0,
          "total_deces": 0,
          "total_fideles": 183470,
          "nb_paroisses": 545
        }

        COMMENT FONCTIONNE .aggregate() ?
        C'est une requête SQL avec des fonctions d'agrégation :
          SELECT
            SUM(communiants) AS total_communiants,
            SUM(non_communiants) AS total_non_communiants,
            ...
          FROM accounts_statistiqueannuelle
          WHERE annee = 2025   (si filtré par année)

        detail=False : l'URL est /totaux/ sur la collection, pas sur un objet
        url_path="totaux" : le segment final de l'URL
        """
        # get_queryset() applique déjà les filtres (?annee=, ?region=, etc.)
        qs = self.get_queryset()

        # .aggregate() exécute un seul SELECT avec plusieurs SUM()
        totaux = qs.aggregate(
            total_communiants=Sum("communiants"),        # SUM(communiants)
            total_non_communiants=Sum("non_communiants"),# SUM(non_communiants)
            total_baptemes=Sum("baptemes"),              # SUM(baptemes) — vaut 0 pour 2025
            total_mariages=Sum("mariages"),              # SUM(mariages) — vaut 0 pour 2025
            total_deces=Sum("deces"),                    # SUM(deces) — vaut 0 pour 2025
        )

        # Calculer le total fidèles (pas en SQL, en Python)
        # "or 0" protège contre None (si aucune stat n'existe, Sum() retourne None)
        totaux["total_fideles"] = (
            (totaux["total_communiants"] or 0)
            + (totaux["total_non_communiants"] or 0)
        )

        # Ajouter le nombre de paroisses concernées (COUNT en Python)
        totaux["nb_paroisses"] = qs.count()

        # Response() retourne une réponse JSON custom (pas via le serializer)
        return Response(totaux)
