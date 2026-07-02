from rest_framework import serializers
from django.contrib.gis.geos import Point

from .models import TypeOeuvre, Oeuvre


class TypeOeuvreSerializer(serializers.ModelSerializer):
    nb_oeuvres = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = TypeOeuvre
        fields = ["id", "nom", "icone", "couleur", "nb_oeuvres"]


class OeuvreListSerializer(serializers.ModelSerializer):
    """Flat JSON for admin table — compatible with DRF pagination."""
    type_oeuvre_id      = serializers.SerializerMethodField()
    type_oeuvre_nom     = serializers.SerializerMethodField()
    type_oeuvre_label   = serializers.SerializerMethodField()
    type_oeuvre_couleur = serializers.SerializerMethodField()
    type_oeuvre_icone   = serializers.SerializerMethodField()
    paroisse_id         = serializers.SerializerMethodField()
    paroisse_nom        = serializers.SerializerMethodField()
    district_id         = serializers.SerializerMethodField()
    district_nom        = serializers.SerializerMethodField()
    region_id           = serializers.SerializerMethodField()
    region_nom          = serializers.SerializerMethodField()
    latitude            = serializers.SerializerMethodField()
    longitude           = serializers.SerializerMethodField()

    def get_type_oeuvre_id(self, obj):      return obj.type_oeuvre_id
    def get_type_oeuvre_nom(self, obj):     return obj.type_oeuvre.nom
    def get_type_oeuvre_label(self, obj):   return obj.type_oeuvre.get_nom_display()
    def get_type_oeuvre_couleur(self, obj): return obj.type_oeuvre.couleur
    def get_type_oeuvre_icone(self, obj):   return obj.type_oeuvre.icone
    def get_paroisse_id(self, obj):         return obj.paroisse_id
    def get_paroisse_nom(self, obj):        return obj.paroisse.nom if obj.paroisse else None

    def get_district_id(self, obj):
        if obj.district_id:  return obj.district_id
        if obj.paroisse_id:  return obj.paroisse.district_id
        return None

    def get_district_nom(self, obj):
        if obj.district:  return obj.district.nom
        if obj.paroisse:  return obj.paroisse.district.nom
        return None

    def get_region_id(self, obj):
        if obj.region_id:    return obj.region_id
        if obj.district:     return obj.district.region_id
        if obj.paroisse:     return obj.paroisse.district.region_id
        return None

    def get_region_nom(self, obj):
        if obj.region:    return obj.region.nom
        if obj.district:  return obj.district.region.nom
        if obj.paroisse:  return obj.paroisse.district.region.nom
        return None

    def get_latitude(self, obj):  return obj.position.y if obj.position else None
    def get_longitude(self, obj): return obj.position.x if obj.position else None

    class Meta:
        model = Oeuvre
        fields = [
            "id", "nom", "adresse", "description",
            "type_oeuvre_id", "type_oeuvre_nom", "type_oeuvre_label",
            "type_oeuvre_couleur", "type_oeuvre_icone",
            "paroisse_id", "paroisse_nom",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "est_active", "capacite", "nb_personnels", "en_prospection", "annee_creation", "telephone", "email",
            "latitude", "longitude",
            "created_at", "updated_at",
        ]


class OeuvreWriteSerializer(serializers.ModelSerializer):
    latitude  = serializers.FloatField(required=False, allow_null=True, write_only=True)
    longitude = serializers.FloatField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Oeuvre
        fields = [
            "id", "nom", "adresse", "description",
            "type_oeuvre",
            "paroisse", "district", "region",
            "est_active", "capacite", "nb_personnels", "en_prospection", "annee_creation", "telephone", "email",
            "latitude", "longitude",
        ]
        extra_kwargs = {
            "paroisse": {"required": False, "allow_null": True},
            "district": {"required": False, "allow_null": True},
            "region":   {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        has_lat = "latitude" in attrs
        has_lng = "longitude" in attrs
        lat = attrs.pop("latitude", None)
        lng = attrs.pop("longitude", None)
        if has_lat and has_lng:
            if lat is not None and lng is not None:
                attrs["position"] = Point(lng, lat, srid=4326)
            else:
                attrs["position"] = None
        elif has_lat or has_lng:
            raise serializers.ValidationError("Fournir latitude ET longitude ensemble.")
        return attrs
