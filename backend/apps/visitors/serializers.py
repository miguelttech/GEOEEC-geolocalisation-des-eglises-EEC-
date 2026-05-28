from rest_framework import serializers
from .models import (
    ProfilVisiteur, ParoisseVue, RechercheHistorique,
    ItinerairePersonnel, ParoisseEnregistree,
)


class ProfilVisiteurSerializer(serializers.ModelSerializer):
    paroisse_affiliee_nom = serializers.CharField(
        source="paroisse_affiliee.nom", read_only=True, default=None
    )
    region_preferee_nom = serializers.CharField(
        source="region_preferee.nom", read_only=True, default=None
    )

    class Meta:
        model = ProfilVisiteur
        fields = [
            "langue",
            "paroisse_affiliee", "paroisse_affiliee_nom",
            "region_preferee",   "region_preferee_nom",
            "notifications_email",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ParoisseVueSerializer(serializers.ModelSerializer):
    paroisse_nom     = serializers.CharField(source="paroisse.nom",                  read_only=True)
    paroisse_region  = serializers.CharField(source="paroisse.district.region.nom",  read_only=True)
    paroisse_district= serializers.CharField(source="paroisse.district.nom",         read_only=True)
    has_gps          = serializers.SerializerMethodField()

    def get_has_gps(self, obj):
        return obj.paroisse.position is not None

    class Meta:
        model = ParoisseVue
        fields = [
            "id", "paroisse", "paroisse_nom",
            "paroisse_region", "paroisse_district",
            "has_gps", "vue_at",
        ]


class RechercheHistoriqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = RechercheHistorique
        fields = ["id", "query", "filtres", "resultats_count", "created_at"]
        read_only_fields = ["created_at"]


class ItinerairePersonnelSerializer(serializers.ModelSerializer):
    depart_nom   = serializers.SerializerMethodField()
    arrivee_nom  = serializers.CharField(source="arrivee_paroisse.nom",  read_only=True)
    arrivee_region = serializers.CharField(
        source="arrivee_paroisse.district.region.nom", read_only=True
    )

    def get_depart_nom(self, obj):
        if obj.depart_paroisse:
            return obj.depart_paroisse.nom
        if obj.depart_lat and obj.depart_lng:
            return f"Ma position ({obj.depart_lat:.4f}, {obj.depart_lng:.4f})"
        return "—"

    class Meta:
        model = ItinerairePersonnel
        fields = [
            "id",
            "depart_paroisse", "depart_nom",
            "depart_lat", "depart_lng",
            "arrivee_paroisse", "arrivee_nom", "arrivee_region",
            "distance_km", "duree_minutes",
            "created_at",
        ]
        read_only_fields = ["distance_km", "duree_minutes", "created_at"]


class ParoisseEnregistreeSerializer(serializers.ModelSerializer):
    paroisse_nom     = serializers.CharField(source="paroisse.nom",                 read_only=True)
    paroisse_district= serializers.CharField(source="paroisse.district.nom",        read_only=True)
    paroisse_region  = serializers.CharField(source="paroisse.district.region.nom", read_only=True)
    has_gps          = serializers.SerializerMethodField()

    def get_has_gps(self, obj):
        return obj.paroisse.position is not None

    class Meta:
        model = ParoisseEnregistree
        fields = [
            "id", "paroisse",
            "paroisse_nom", "paroisse_district", "paroisse_region",
            "has_gps", "note_personnelle", "enregistree_at",
        ]
        read_only_fields = ["enregistree_at"]
