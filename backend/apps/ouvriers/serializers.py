from rest_framework import serializers
from django.contrib.gis.geos import Point

from .models import Grade, Ouvrier


class GradeSerializer(serializers.ModelSerializer):
    nb_ouvriers = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Grade
        fields = ["id", "nom", "abreviation", "niveau", "nb_ouvriers"]


class OuvrierListSerializer(serializers.ModelSerializer):
    grade_id          = serializers.SerializerMethodField()
    grade_nom         = serializers.SerializerMethodField()
    grade_abreviation = serializers.SerializerMethodField()
    paroisse_id       = serializers.SerializerMethodField()
    paroisse_nom      = serializers.SerializerMethodField()
    district_id       = serializers.SerializerMethodField()
    district_nom      = serializers.SerializerMethodField()
    region_id         = serializers.SerializerMethodField()
    region_nom        = serializers.SerializerMethodField()
    latitude          = serializers.SerializerMethodField()
    longitude         = serializers.SerializerMethodField()

    def get_grade_id(self, obj):          return obj.grade_id
    def get_grade_nom(self, obj):         return obj.grade.nom if obj.grade_id else None
    def get_grade_abreviation(self, obj): return obj.grade.abreviation if obj.grade_id else None
    def get_paroisse_id(self, obj):       return obj.paroisse_id
    def get_paroisse_nom(self, obj):      return obj.paroisse.nom
    def get_district_id(self, obj):       return obj.paroisse.district_id
    def get_district_nom(self, obj):      return obj.paroisse.district.nom
    def get_region_id(self, obj):         return obj.paroisse.district.region_id
    def get_region_nom(self, obj):        return obj.paroisse.district.region.nom
    def get_latitude(self, obj):          return obj.position.y if obj.position else None
    def get_longitude(self, obj):         return obj.position.x if obj.position else None

    class Meta:
        model = Ouvrier
        fields = [
            "id", "nom", "prenom", "sexe", "statut",
            "grade_id", "grade_nom", "grade_abreviation",
            "paroisse_id", "paroisse_nom",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "telephone", "email", "date_naissance", "date_ordination",
            "latitude", "longitude",
            "created_at", "updated_at",
        ]


class OuvrierWriteSerializer(serializers.ModelSerializer):
    latitude  = serializers.FloatField(required=False, allow_null=True, write_only=True)
    longitude = serializers.FloatField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Ouvrier
        fields = [
            "id", "nom", "prenom", "sexe", "statut",
            "grade", "paroisse",
            "telephone", "email", "date_naissance", "date_ordination",
            "latitude", "longitude",
        ]
        extra_kwargs = {
            "grade": {"required": False, "allow_null": True},
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
