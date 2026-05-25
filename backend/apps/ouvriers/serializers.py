"""
=============================================================================
FICHIER N°12 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/ouvriers/serializers.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/ouvriers/models.py (Grade, Ouvrier)
           apps/geo/models.py (Paroisse)
UTILISÉ PAR: apps/ouvriers/views.py
=============================================================================

OBJECTIF :
  Convertir les grades et ouvriers en JSON lisible par le frontend.

QU'EST-CE QU'UN OUVRIER DANS L'EEC ?
  Un "ouvrier" est tout agent de l'Église Évangélique du Cameroun :
  pasteurs, évangélistes, délégués pastoraux, etc.
  Ce terme vient de la Bible (Luc 10:2 : "La moisson est grande, mais
  les ouvriers sont peu nombreux").

SERIALIZERS DÉFINIS ICI :
  1. GradeSerializer   → les 8 grades ecclésiastiques avec comptage
  2. OuvrierSerializer → informations complètes d'un ouvrier
=============================================================================
"""

from rest_framework import serializers

from .models import Grade, Ouvrier


# =============================================================================
# SERIALIZER 1 : Grade ecclésiastique
# =============================================================================
class GradeSerializer(serializers.ModelSerializer):
    """
    Convertit un Grade en JSON.

    EXEMPLE DE SORTIE :
    {
      "id": 2,
      "nom": "Pasteur",
      "abreviation": "P.",
      "niveau": 2,
      "nb_ouvriers": 296
    }

    nb_ouvriers : calculé via .annotate(Count("ouvriers")) dans la view.
    Permet au frontend d'afficher "296 Pasteurs" dans la légende de la carte.
    """

    # IntegerField(read_only=True) : ce champ est fourni par annotate() dans la view
    # Il n'est pas dans le modèle Grade, mais Django l'ajoute dynamiquement via SQL
    nb_ouvriers = serializers.IntegerField(read_only=True)

    class Meta:
        model = Grade
        fields = [
            "id",
            "nom",          # ex: "Pasteur", "Évangéliste"
            "abreviation",  # ex: "P.", "Ev." (utilisé sur la carte, espace limité)
            "niveau",       # 1=plus haut grade, 8=plus bas (pour trier)
            "nb_ouvriers",  # calculé : nombre d'ouvriers ayant ce grade
        ]


# =============================================================================
# SERIALIZER 2 : Ouvrier
# =============================================================================
class OuvrierSerializer(serializers.ModelSerializer):
    """
    Convertit un Ouvrier en JSON.

    EXEMPLE DE SORTIE :
    {
      "id": 1,
      "nom": "TAKAM",
      "prenom": "Roger Ernest",
      "sexe": "M",
      "statut": "ACTIF",
      "grade": 2,
      "grade_nom": "Pasteur",
      "grade_abreviation": "P.",
      "paroisse": 42,
      "paroisse_nom": "Jourdain de beka hossere",
      "district_nom": "NGAOUNDERE",
      "region_nom": "ADAMAOUA",
      "telephone": ""
    }

    CONVENTION DE NOMMAGE :
    Les Camerounais écrivent souvent leur nom de famille en MAJUSCULES.
    Lors de l'import, on a coupé sur le premier espace :
      "TAKAM Roger Ernest" → nom="TAKAM", prenom="Roger Ernest"
    Cette convention n'est pas parfaite mais c'est la plus cohérente
    avec les données sources.

    CHAMPS CALCULÉS :
      grade_nom, grade_abreviation : traversent la FK ouvrier→grade
      paroisse_nom : traverse la FK ouvrier→paroisse
      district_nom : traverse deux FK : ouvrier→paroisse→district
      region_nom   : traverse trois FK : ouvrier→paroisse→district→region
    """

    # Champs du grade (traverser la FK grade)
    # allow_null=True : si grade est None (ouvrier sans grade reconnu), pas d'erreur
    grade_nom         = serializers.CharField(
        source="grade.nom",          read_only=True, allow_null=True
    )
    grade_abreviation = serializers.CharField(
        source="grade.abreviation",  read_only=True, allow_null=True
    )

    # Champ de la paroisse (traverser la FK paroisse)
    paroisse_nom = serializers.CharField(source="paroisse.nom",                  read_only=True)

    # Champs district et région (traverser deux et trois FK)
    district_nom = serializers.CharField(source="paroisse.district.nom",         read_only=True)
    region_nom   = serializers.CharField(source="paroisse.district.region.nom",  read_only=True)

    class Meta:
        model = Ouvrier
        fields = [
            "id",
            "nom",              # nom de famille (souvent en MAJUSCULES)
            "prenom",           # prénom(s)
            "sexe",             # "M" ou "F"
            "statut",           # "ACTIF", "RETRAITE", "SUSPENDU", "DECEDE"
            "grade",            # ID numérique du grade (FK)
            "grade_nom",        # nom lisible du grade
            "grade_abreviation",# abréviation du grade (pour affichage compact)
            "paroisse",         # ID numérique de la paroisse (FK)
            "paroisse_nom",     # nom lisible de la paroisse
            "district_nom",     # nom du district (via paroisse)
            "region_nom",       # nom de la région (via district)
            "telephone",        # numéro de contact (peut être vide)
        ]
