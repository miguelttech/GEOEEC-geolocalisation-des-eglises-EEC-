"""
=============================================================================
FICHIER N°10 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/oeuvres/serializers.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/oeuvres/models.py
UTILISÉ PAR: apps/oeuvres/views.py
=============================================================================

OBJECTIF :
  Convertir les oeuvres (écoles, hôpitaux, terrains…) en JSON/GeoJSON
  pour que le frontend puisse les afficher sur la carte.

COMPLEXITÉ PARTICULIÈRE :
  Une oeuvre peut être liée à TROIS niveaux différents :
    - Une paroisse spécifique  (oeuvres paroissiales)
    - Un district entier       (oeuvres de district)
    - Une région entière       (oeuvres régionales)
  Les serializers doivent gérer ces trois cas et toujours retourner
  un nom lisible (paroisse_nom, district_nom, region_nom).

SERIALIZERS DÉFINIS ICI :
  1. TypeOeuvreSerializer  → les 7 types (Scolaire, Médical…)
  2. OeuvreListSerializer  → GeoJSON pour la carte (markers)
  3. OeuvreDetailSerializer → fiche détaillée d'une oeuvre
=============================================================================
"""

from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import TypeOeuvre, Oeuvre


# =============================================================================
# SERIALIZER 1 : TypeOeuvre (les 7 catégories d'oeuvres)
# =============================================================================
class TypeOeuvreSerializer(serializers.ModelSerializer):
    """
    Convertit un TypeOeuvre en JSON.

    FORMAT DE SORTIE :
    {
      "id": 1,
      "nom": "SCOLAIRE",
      "icone": "school",
      "couleur": "#2563EB"
    }

    UTILISATION :
    - Le frontend utilisera "couleur" pour colorier les markers selon le type
    - "icone" sera le nom de l'icône Lucide/FontAwesome à afficher sur le marker
    """

    class Meta:
        model = TypeOeuvre
        # Tous les champs utiles pour l'affichage frontend
        fields = ["id", "nom", "icone", "couleur"]


# =============================================================================
# SERIALIZER 2 : Oeuvres (version liste = GeoJSON pour la carte)
# =============================================================================
class OeuvreListSerializer(GeoFeatureModelSerializer):
    """
    Convertit une Oeuvre en GeoJSON pour les markers de la carte.

    UTILISATION SUR LA CARTE :
    Chaque oeuvre géolocalisée apparaîtra comme un marker sur la carte.
    La couleur et l'icône du marker viendront de type_couleur et type_icone.

    EXEMPLE DE SORTIE :
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [10.056, 5.444]},
      "properties": {
        "nom": "Lycée de Dschang",
        "type_nom": "SCOLAIRE",
        "type_icone": "school",
        "type_couleur": "#2563EB",
        "paroisse_nom": null,
        "district_nom": "DSCHANG II",
        "region_nom": "MENOUA",
        "est_active": true
      }
    }

    GESTION DES TROIS NIVEAUX GÉOGRAPHIQUES :
    Les méthodes get_paroisse_nom(), get_district_nom(), get_region_nom()
    gèrent les trois cas possibles (région/district/paroisse).
    """

    # source="type_oeuvre.nom" : traverser la FK oeuvre→type_oeuvre pour avoir le nom
    # ATTENTION : dans le modèle, le champ s'appelle "type_oeuvre" (pas "type")
    type_nom     = serializers.CharField(source="type_oeuvre.nom",     read_only=True)
    type_icone   = serializers.CharField(source="type_oeuvre.icone",   read_only=True)
    type_couleur = serializers.CharField(source="type_oeuvre.couleur", read_only=True)

    # SerializerMethodField : champs calculés par les méthodes ci-dessous
    # Nécessaires car la localisation peut être région, district OU paroisse
    paroisse_nom = serializers.SerializerMethodField()
    district_nom = serializers.SerializerMethodField()
    region_nom   = serializers.SerializerMethodField()

    def get_paroisse_nom(self, obj):
        """
        Retourne le nom de la paroisse liée à cette oeuvre.
        Si l'oeuvre est régionale ou de district (pas de paroisse) → None.
        obj.paroisse est la FK vers Paroisse (nullable).
        """
        return obj.paroisse.nom if obj.paroisse else None

    def get_district_nom(self, obj):
        """
        Retourne le nom du district de cette oeuvre.
        Cas 1 : l'oeuvre a une FK district directe → utilise obj.district.nom
        Cas 2 : l'oeuvre a une paroisse → remonte à paroisse.district.nom
        Cas 3 : aucun → None
        """
        if obj.district:
            return obj.district.nom
        if obj.paroisse:
            return obj.paroisse.district.nom
        return None

    def get_region_nom(self, obj):
        """
        Retourne le nom de la région de cette oeuvre.
        Remonte la chaîne region → district.region → paroisse.district.region
        selon ce qui est disponible.
        """
        if obj.region:
            return obj.region.nom
        if obj.district:
            return obj.district.region.nom
        if obj.paroisse:
            return obj.paroisse.district.region.nom
        return None

    class Meta:
        model = Oeuvre
        # geo_field : "position" est le PointField qui sera mis dans "geometry"
        geo_field = "position"
        fields = [
            "id", "nom", "description",
            "type_nom", "type_icone", "type_couleur",   # infos du type d'oeuvre
            "paroisse_nom", "district_nom", "region_nom",  # localisation lisible
            "est_active", "position",                    # statut + GPS
        ]


# =============================================================================
# SERIALIZER 3 : Oeuvres (version détail = fiche complète)
# =============================================================================
class OeuvreDetailSerializer(serializers.ModelSerializer):
    """
    Version détaillée pour la fiche d'une oeuvre individuelle.
    Utilisé quand on appelle GET /api/oeuvres/oeuvres/5/

    DIFFÉRENCE AVEC OeuvreListSerializer :
    - type_detail : retourne l'objet TypeOeuvre complet (avec couleur et icône)
                    au lieu de juste le nom
    - Inclut plus de champs : capacite, annee_creation, adresse
    - Inclut les FKs numériques (paroisse, district, region) pour filtrage frontend
    """

    # Serializer imbriqué : retourne l'objet TypeOeuvre complet dans "type_detail"
    # source="type_oeuvre" : utilise la FK type_oeuvre du modèle
    type_detail  = TypeOeuvreSerializer(source="type_oeuvre", read_only=True)

    # Champs calculés (même logique que OeuvreListSerializer)
    paroisse_nom = serializers.SerializerMethodField()
    district_nom = serializers.SerializerMethodField()
    region_nom   = serializers.SerializerMethodField()

    def get_paroisse_nom(self, obj):
        """Nom de la paroisse (None si oeuvre régionale ou de district)."""
        return obj.paroisse.nom if obj.paroisse else None

    def get_district_nom(self, obj):
        """Nom du district (remonte paroisse→district si pas de FK directe)."""
        if obj.district:
            return obj.district.nom
        if obj.paroisse:
            return obj.paroisse.district.nom
        return None

    def get_region_nom(self, obj):
        """Nom de la région (remonte toute la chaîne si nécessaire)."""
        if obj.region:
            return obj.region.nom
        if obj.district:
            return obj.district.region.nom
        if obj.paroisse:
            return obj.paroisse.district.region.nom
        return None

    class Meta:
        model = Oeuvre
        fields = [
            "id", "nom", "description",
            "type_detail",                              # objet TypeOeuvre complet imbriqué
            "paroisse", "paroisse_nom",                 # FK numérique + nom lisible
            "district", "district_nom",
            "region", "region_nom",
            "est_active", "capacite",                  # infos supplémentaires
            "annee_creation", "adresse",
            "position",                                # coordonnées GPS (PointField)
        ]
