"""
=============================================================================
FICHIER N°9 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/geo/serializers.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/geo/models.py (doit exister avant)
UTILISÉ PAR: apps/geo/views.py (doit être créé APRÈS ce fichier)
=============================================================================

OBJECTIF :
  Définir comment les données géographiques (régions, districts, paroisses)
  sont converties en JSON avant d'être envoyées au frontend.

POURQUOI UN SERIALIZER ?
  La base de données stocke les données en format PostgreSQL (binaire, complexe).
  Le frontend Next.js parle en JSON (texte simple).
  Le serializer est le "traducteur" entre les deux.

  Exemple : la base stocke un point GPS comme une donnée binaire PostGIS.
  Le serializer le convertit en :
    {"type": "Point", "coordinates": [10.056, 5.444]}
  Ce format s'appelle GeoJSON — Leaflet.js le comprend directement.

QU'EST-CE QUE GeoFeatureModelSerializer ?
  C'est un serializer spécial de la bibliothèque `djangorestframework-gis`.
  Il produit automatiquement du GeoJSON (format standard pour les cartes),
  c'est-à-dire une structure FeatureCollection avec des Features géolocalisées.

SERIALIZERS DÉFINIS ICI :
  1. RegionSynodaleSerializer      → pour la liste des régions (avec polygones)
  2. RegionSynodaleListSerializer  → version légère sans polygone (pour filtres)
  3. DistrictSerializer            → pour la liste des districts
  4. ParoisseListSerializer        → pour la carte (markers GPS en GeoJSON)
  5. ParoisseDetailSerializer      → pour la fiche d'une paroisse
=============================================================================
"""

# rest_framework.serializers : bibliothèque principale de DRF pour créer des serializers
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from django.contrib.gis.geos import Point

from .models import RegionSynodale, District, Paroisse


# =============================================================================
# SERIALIZER 1 : Régions synodales (version complète avec polygone)
# =============================================================================
class RegionSynodaleSerializer(GeoFeatureModelSerializer):
    """
    Convertit une RegionSynodale en GeoJSON avec son polygone géographique.

    POURQUOI GeoFeatureModelSerializer ?
    La RegionSynodale a un champ `geometrie` (MultiPolygonField).
    GeoFeatureModelSerializer le convertit automatiquement en GeoJSON polygon.
    Leaflet.js utilisera ce GeoJSON pour dessiner le contour de la région sur la carte.

    CHAMPS CALCULÉS (non stockés en base, calculés à la volée) :
      - nb_districts : nombre de districts dans cette région
      - nb_paroisses : nombre de paroisses dans cette région
    Ces champs sont calculés via .annotate() dans la view (voir geo/views.py).
    """

    # IntegerField(read_only=True) : champ en lecture seule, calculé par annotate() dans la view
    # S'il n'est pas fourni par la view, il vaut None (pas d'erreur)
    nb_districts = serializers.IntegerField(read_only=True)
    nb_paroisses = serializers.IntegerField(read_only=True)

    class Meta:
        model = RegionSynodale
        geo_field = "geometrie"
        fields = ["id", "nom", "code", "geometrie", "nb_districts", "nb_paroisses"]


# =============================================================================
# SERIALIZER 2 : Régions synodales (version légère SANS polygone)
# =============================================================================
class RegionSynodaleListSerializer(serializers.ModelSerializer):
    """
    Version sans géométrie de RegionSynodaleSerializer.
    Utilisée pour les menus déroulants et le tableau admin des régions.
    nb_districts et nb_paroisses sont fournis via annotate() dans la view.
    """

    nb_districts = serializers.IntegerField(read_only=True, default=0)
    nb_paroisses = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = RegionSynodale
        fields = ["id", "nom", "code", "nb_districts", "nb_paroisses"]


# =============================================================================
# SERIALIZER 3 : Districts
# =============================================================================
class DistrictSerializer(serializers.ModelSerializer):
    """
    Convertit un District en JSON avec le nom et l'ID de sa région parente.

    CONCEPT CLÉ : les champs calculés depuis une relation
    Un District est lié à une RegionSynodale via une clé étrangère (ForeignKey).
    En base, on stocke seulement l'ID de la région (ex: region_id=10).
    Mais pour le frontend, on veut aussi le nom lisible (ex: "ADAMAOUA").

    Pour ça, on utilise source="region.nom" qui dit :
    "traverse la relation FK district→region et prends le champ 'nom'"

    SANS ce champ calculé, le frontend recevrait :
      {"id": 5, "nom": "NGAOUNDERE", "region": 10}

    AVEC ce champ calculé, le frontend reçoit :
      {"id": 5, "nom": "NGAOUNDERE", "region_id": 10, "region_nom": "ADAMAOUA", "nb_paroisses": 7}
    C'est beaucoup plus utile pour l'affichage !
    """

    region_nom   = serializers.CharField(source="region.nom", read_only=True)
    region_id    = serializers.IntegerField(source="region.id", read_only=True)
    nb_paroisses = serializers.IntegerField(read_only=True, default=0)
    nb_fideles   = serializers.IntegerField(read_only=True, allow_null=True)
    nb_ouvriers  = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = District
        # Lecture seule (les districts ne se créent ni ne se modifient) —
        # enrichi des statistiques réellement disponibles.
        fields = ["id", "nom", "region_id", "region_nom",
                  "nb_paroisses", "nb_fideles", "nb_ouvriers"]


# =============================================================================
# SERIALIZER 4 : Paroisses (version liste = JSON paginé pour le tableau admin)
# =============================================================================
class ParoisseListSerializer(serializers.ModelSerializer):
    """
    Version complète pour le tableau d'administration (liste paginée).
    Retourne un objet JSON plat compatible avec PagedResult<Paroisse> côté frontend.
    Pour la carte GeoJSON, utiliser un endpoint dédié /geojson/ à créer ultérieurement.
    """

    district_nom = serializers.CharField(source="district.nom",          read_only=True)
    region_nom   = serializers.CharField(source="district.region.nom",   read_only=True)
    district_id  = serializers.IntegerField(source="district.id",        read_only=True)
    region_id    = serializers.IntegerField(source="district.region.id", read_only=True)
    latitude     = serializers.SerializerMethodField()
    longitude    = serializers.SerializerMethodField()
    # Fournis par annotate() dans la view (année statistique la plus récente)
    nb_ouvriers      = serializers.IntegerField(read_only=True, default=0)
    communiants      = serializers.IntegerField(read_only=True, allow_null=True)
    non_communiants  = serializers.IntegerField(read_only=True, allow_null=True)

    def get_latitude(self, obj):
        return obj.position.y if obj.position else None

    def get_longitude(self, obj):
        return obj.position.x if obj.position else None

    class Meta:
        model = Paroisse
        # EXIGENCES : plus de statut actif/inactif ni de date de création ;
        # affichage fidèles / communiants / non-communiants / catégorie / ouvriers.
        fields = [
            "id", "nom", "adresse", "categorie", "en_prospection",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "latitude", "longitude",
            "nombre_fideles", "communiants", "non_communiants", "nb_ouvriers",
            "telephone", "email", "updated_at",
        ]


# =============================================================================
# SERIALIZER 5 : Paroisses (version détail = fiche complète)
# =============================================================================
class ParoisseDetailSerializer(serializers.ModelSerializer):
    """
    Version détaillée pour la fiche d'une paroisse individuelle.

    Utilisé quand on appelle GET /api/geo/paroisses/5/ (une seule paroisse).
    Retourne les mêmes infos que la liste, mais extrait latitude et longitude
    séparément pour faciliter l'affichage dans la fiche.

    DIFFÉRENCE AVEC ParoisseListSerializer :
    - Pas de GeoJSON (pas de geometry/Feature wrapper)
    - Latitude et longitude extraites séparément
    - Plus facile à afficher dans un tableau de données

    LA MÉTHODE SerializerMethodField :
    Quand le champ à retourner n'est pas directement dans le modèle
    mais nécessite du code Python, on utilise SerializerMethodField.
    Le champ `latitude` appelle automatiquement la méthode `get_latitude()`.
    """

    # Traverser les FK pour les noms
    district_nom = serializers.CharField(source="district.nom",          read_only=True)
    region_nom   = serializers.CharField(source="district.region.nom",   read_only=True)
    district_id  = serializers.IntegerField(source="district.id",        read_only=True)
    region_id    = serializers.IntegerField(source="district.region.id", read_only=True)

    # SerializerMethodField : ce champ sera calculé par la méthode get_latitude()
    latitude  = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    def get_latitude(self, obj):
        """
        Extrait la latitude depuis le PointField.
        obj.position est un objet Point GIS.
        .y = la deuxième coordonnée = latitude (nord/sud)
        Retourne None si la paroisse n'a pas de GPS.
        """
        return obj.position.y if obj.position else None

    def get_longitude(self, obj):
        """
        Extrait la longitude depuis le PointField.
        .x = la première coordonnée = longitude (est/ouest)
        Retourne None si la paroisse n'a pas de GPS.
        """
        return obj.position.x if obj.position else None

    class Meta:
        model = Paroisse
        fields = [
            "id", "nom", "adresse", "categorie", "en_prospection",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "latitude", "longitude",
            "nombre_fideles", "telephone", "email", "updated_at",
        ]


# =============================================================================
# SERIALIZER 6 : Paroisses (version écriture — create / update)
# =============================================================================
class ParoisseWriteSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer ou modifier une paroisse via l'API.

    Accepte latitude et longitude séparément (comme le frontend les envoie)
    et les convertit en Point(longitude, latitude) pour PostGIS.
    Le champ `district` est un PrimaryKeyRelatedField pour accepter un ID.
    """

    latitude  = serializers.FloatField(required=False, allow_null=True, write_only=True)
    longitude = serializers.FloatField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Paroisse
        # Champs de CRÉATION. En MODIFICATION, la view ne laisse passer que
        # le nom et l'état de prospection (exigence).
        fields = [
            "id", "nom", "adresse", "categorie", "en_prospection",
            "district",
            "latitude", "longitude",
            "nombre_fideles", "telephone", "email",
        ]

    def validate(self, attrs):
        lat = attrs.pop("latitude", None)
        lng = attrs.pop("longitude", None)
        if lat is not None and lng is not None:
            attrs["position"] = Point(lng, lat, srid=4326)
        elif lat is None and lng is None:
            attrs.setdefault("position", None)
        else:
            raise serializers.ValidationError(
                "Il faut fournir latitude ET longitude (ou aucun des deux)."
            )
        return attrs
