from rest_framework import serializers

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

    def get_grade_id(self, obj):          return obj.grade_id
    def get_grade_nom(self, obj):         return obj.grade.nom if obj.grade_id else None
    def get_grade_abreviation(self, obj): return obj.grade.abreviation if obj.grade_id else None
    def get_paroisse_id(self, obj):       return obj.paroisse_id
    def get_paroisse_nom(self, obj):      return obj.paroisse.nom
    def get_district_id(self, obj):       return obj.paroisse.district_id
    def get_district_nom(self, obj):      return obj.paroisse.district.nom
    def get_region_id(self, obj):         return obj.paroisse.district.region_id
    def get_region_nom(self, obj):        return obj.paroisse.district.region.nom

    class Meta:
        model = Ouvrier
        # EXIGENCES : jamais géolocalisable ; email / date de naissance /
        # ordination retirés (données non collectées — principe de faisabilité).
        fields = [
            "id", "nom", "prenom", "sexe", "statut",
            "grade_id", "grade_nom", "grade_abreviation",
            "paroisse_id", "paroisse_nom",
            "district_id", "district_nom",
            "region_id", "region_nom",
            "telephone",
            "created_at", "updated_at",
        ]


class OuvrierWriteSerializer(serializers.ModelSerializer):
    """Création d'un ouvrier : identité (nom, prénom, sexe) + téléphone
    + statut + grade + affectation. Rien d'autre (faisabilité)."""

    class Meta:
        model = Ouvrier
        fields = [
            "id", "nom", "prenom", "sexe", "statut",
            "grade", "paroisse", "telephone",
        ]
        extra_kwargs = {
            "grade": {"required": False, "allow_null": True},
        }


class OuvrierAffectationSerializer(serializers.ModelSerializer):
    """
    EXIGENCE : l'identité d'un ouvrier (nom, prénom, sexe) n'est JAMAIS
    modifiable. Seuls le TÉLÉPHONE, le STATUT (Occupé/Inoccupé) et
    l'AFFECTATION (paroisse unique) peuvent changer.

    RÈGLE MÉTIER OBLIGATOIRE : un ouvrier ne travaille que dans UNE paroisse.
    Pour le réaffecter, il faut d'abord le RETIRER de son ancienne paroisse
    (statut « Inoccupé ») — sinon le système refuse en indiquant où il
    travaille actuellement.
    """

    class Meta:
        model = Ouvrier
        fields = ["paroisse", "statut", "telephone"]

    def validate(self, attrs):
        inst = self.instance
        nouvelle = attrs.get("paroisse")
        if inst and nouvelle and nouvelle.id != inst.paroisse_id:
            if inst.statut == "OCCUPE":
                raise serializers.ValidationError(
                    f"Impossible : cet ouvrier travaille actuellement à la paroisse "
                    f"« {inst.paroisse.nom} » ({inst.paroisse.district.nom}, "
                    f"{inst.paroisse.district.region.nom}). Retirez-le d'abord "
                    f"(statut « Inoccupé ») avant de le réaffecter."
                )
            # Réaffectation d'un ouvrier inoccupé → il redevient occupé
            attrs.setdefault("statut", "OCCUPE")
        return attrs
