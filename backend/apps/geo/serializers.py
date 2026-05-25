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

# GeoFeatureModelSerializer : serializer spécial qui produit du GeoJSON
# Utilisé pour les modèles qui ont un champ géographique (PointField, MultiPolygonField)
from rest_framework_gis.serializers import GeoFeatureModelSerializer

# On importe les modèles Django dont on veut sérialiser les données
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
        # model : quel modèle Django on sérialise
        model = RegionSynodale

        # geo_field : quel champ contient la géométrie à mettre dans "geometry" du GeoJSON
        # Le champ "geometrie" est un MultiPolygonField stocké en PostGIS
        geo_field = "geometrie"

        # fields : liste des champs à inclure dans la réponse JSON
        # "geometrie" sera mis dans "geometry" (GeoJSON standard)
        # Les autres iront dans "properties"
        fields = ["id", "nom", "code", "geometrie", "nb_districts", "nb_paroisses"]


# =============================================================================
# SERIALIZER 2 : Régions synodales (version légère SANS polygone)
# =============================================================================
class RegionSynodaleListSerializer(serializers.ModelSerializer):
    """
    Version allégée de RegionSynodaleSerializer.

    POURQUOI AVOIR DEUX SERIALIZERS POUR LA MÊME TABLE ?
    - Version complète : utilisée pour la carte (besoin du polygone)
    - Version légère  : utilisée pour les menus déroulants, les filtres,
                        les listes de régions sans la lourde donnée géométrique

    Le polygone d'une région peut peser plusieurs kilooctets en JSON.
    Pour un menu déroulant avec 22 régions, on n'a besoin que de id/nom/code.
    Cette version légère est 100x plus rapide à transférer.

    Hérite de ModelSerializer (pas GeoFeatureModelSerializer) car pas de géométrie.
    """

    class Meta:
        model = RegionSynodale
        # Seulement 3 champs légers, pas de géométrie
        fields = ["id", "nom", "code"]


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

    # CharField(source="region.nom") : traverser la FK pour lire region.nom
    # read_only=True : ce champ est calculé, pas modifiable
    region_nom = serializers.CharField(source="region.nom", read_only=True)

    # IntegerField(source="region.id") : l'ID numérique de la région parente
    region_id  = serializers.IntegerField(source="region.id",  read_only=True)

    # nb_paroisses : calculé via annotate() dans la view (voir geo/views.py)
    nb_paroisses = serializers.IntegerField(read_only=True)

    class Meta:
        model = District
        fields = ["id", "nom", "region_id", "region_nom", "nb_paroisses"]


# =============================================================================
# SERIALIZER 4 : Paroisses (version liste = GeoJSON pour la carte)
# =============================================================================
class ParoisseListSerializer(GeoFeatureModelSerializer):
    """
    Convertit une Paroisse en GeoJSON avec son point GPS.

    C'EST LE SERIALIZER LE PLUS IMPORTANT DU PROJET.
    Il produit les données que Leaflet.js utilisera pour placer
    les 402 markers de paroisses sur la carte.

    FORMAT DE SORTIE (GeoJSON Feature) :
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [10.056422, 5.444976]   ← [longitude, latitude]
      },
      "properties": {
        "id": 1,
        "nom": "Jourdain de beka hossere",
        "adresse": "250",
        "district_id": 1,
        "district_nom": "NGAOUNDERE",
        "region_id": 10,
        "region_nom": "ADAMAOUA"
      }
    }

    COMMENT UTILISER DANS LEAFLET.JS ?
    const geojson = response.data.results;  // GeoJSON FeatureCollection
    L.geoJSON(geojson, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(feature.properties.nom);  // popup avec le nom
      }
    }).addTo(map);

    RELATIONS TRAVERSÉES :
    paroisse → district → region (deux niveaux de FK)
    """

    # Traverser la relation paroisse→district pour avoir le nom du district
    district_nom = serializers.CharField(source="district.nom",          read_only=True)

    # Traverser deux niveaux : paroisse→district→region pour avoir le nom de la région
    region_nom   = serializers.CharField(source="district.region.nom",   read_only=True)

    # Les IDs numériques pour les filtres frontend
    district_id  = serializers.IntegerField(source="district.id",        read_only=True)
    region_id    = serializers.IntegerField(source="district.region.id", read_only=True)

    class Meta:
        model = Paroisse

        # geo_field : le champ PointField à convertir en geometry GeoJSON
        # position est un Point(longitude, latitude, srid=4326) stocké en PostGIS
        geo_field = "position"

        fields = [
            "id", "nom", "adresse",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "position",   # → sera mis dans "geometry" du GeoJSON
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
            "id", "nom", "adresse",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "latitude", "longitude",  # coordonnées extraites séparément
        ]
