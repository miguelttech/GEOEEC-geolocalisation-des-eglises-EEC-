"""
=============================================================================
FICHIER N°11 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/accounts/serializers.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/accounts/models.py (StatistiqueAnnuelle)
           apps/geo/models.py (Paroisse, District, RegionSynodale)
UTILISÉ PAR: apps/accounts/views.py
=============================================================================

OBJECTIF :
  Convertir les statistiques annuelles en JSON lisible par le frontend.

  Une StatistiqueAnnuelle contient les chiffres d'une paroisse pour une année :
  - communiants     : membres baptisés et confirmés qui participent à la communion
  - non_communiants : membres baptisés mais pas encore confirmés
  - baptemes        : nombre de baptêmes dans l'année
  - confirmations   : nombre de confirmations
  - mariages        : nombre de mariages célébrés
  - deces           : nombre de décès enregistrés
  - offrandes       : montant des offrandes (en FCFA)
  - dimes           : montant des dîmes (en FCFA)

  POUR L'INSTANT (données 2025) :
  Seuls communiants et non_communiants sont remplis depuis l'Excel.
  Les autres champs (baptemes, mariages, etc.) restent à 0 et seront
  remplis manuellement via l'administration Django.

SERIALIZER DÉFINI ICI :
  StatistiqueAnnuelleSerializer → format JSON complet avec noms lisibles
=============================================================================
"""

from rest_framework import serializers

# On importe le modèle StatistiqueAnnuelle depuis l'app accounts
from .models import StatistiqueAnnuelle


# =============================================================================
# SERIALIZER : StatistiqueAnnuelle
# =============================================================================
class StatistiqueAnnuelleSerializer(serializers.ModelSerializer):
    """
    Convertit une StatistiqueAnnuelle en JSON.

    EXEMPLE DE SORTIE :
    {
      "id": 1,
      "annee": 2025,
      "paroisse": 42,
      "paroisse_nom": "Jourdain de beka hossere",
      "district_nom": "NGAOUNDERE",
      "region_nom": "ADAMAOUA",
      "communiants": 96,
      "non_communiants": 0,
      "total_fideles": 96,
      "baptemes": 0,
      "confirmations": 0,
      "mariages": 0,
      "deces": 0,
      "offrandes": null,
      "dimes": null
    }

    CHAMPS CALCULÉS (traversent les relations FK) :
      paroisse_nom : le nom lisible de la paroisse (pas juste l'ID)
      district_nom : le nom du district de la paroisse
      region_nom   : le nom de la région du district
      total_fideles : communiants + non_communiants (calculé en Python)

    POURQUOI "total_fideles" EST CALCULÉ EN PYTHON ET PAS EN SQL ?
      On aurait pu faire communiants + non_communiants en SQL avec annotate().
      Mais il est plus simple et lisible de le calculer dans le serializer.
      C'est un champ "virtuel" (SerializerMethodField) — pas stocké en base.
    """

    # source="paroisse.nom" : traverser la FK stat→paroisse pour avoir le nom
    paroisse_nom = serializers.CharField(source="paroisse.nom",                  read_only=True)

    # source="paroisse.district.nom" : traverser deux FK : stat→paroisse→district
    district_nom = serializers.CharField(source="paroisse.district.nom",         read_only=True)

    # source="paroisse.district.region.nom" : traverser trois FK : stat→paroisse→district→region
    region_nom   = serializers.CharField(source="paroisse.district.region.nom",  read_only=True)

    # SerializerMethodField : champ calculé par la méthode get_total_fideles()
    total_fideles = serializers.SerializerMethodField()

    def get_total_fideles(self, obj):
        """
        Calcule le total des fidèles = communiants + non-communiants.
        'or 0' : si une valeur est None (pas encore remplie), on traite comme 0.
        Évite une erreur NoneType + NoneType si les deux champs sont vides.
        """
        return (obj.communiants or 0) + (obj.non_communiants or 0)

    class Meta:
        model = StatistiqueAnnuelle
        fields = [
            "id",
            "annee",                     # année de référence (ex: 2025)
            "paroisse",                  # ID numérique de la paroisse (FK)
            "paroisse_nom",              # nom lisible de la paroisse
            "district_nom",              # nom du district (via paroisse)
            "region_nom",                # nom de la région (via district)
            "communiants",               # membres baptisés + confirmés
            "non_communiants",           # membres baptisés non confirmés
            "total_fideles",             # somme calculée
            "baptemes",                  # nombre de baptêmes dans l'année
            "confirmations",             # nombre de confirmations
            "mariages",                  # nombre de mariages
            "deces",                     # nombre de décès
            "offrandes",                 # montant des offrandes (FCFA)
            "dimes",                     # montant des dîmes (FCFA)
        ]
