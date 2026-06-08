from rest_framework import serializers
from .models import StatistiqueAnnuelle, User


# ---------------------------------------------------------------------------
# Statistiques annuelles
# ---------------------------------------------------------------------------

class StatistiqueAnnuelleSerializer(serializers.ModelSerializer):
    paroisse_nom = serializers.CharField(source="paroisse.nom", read_only=True)
    district_nom = serializers.CharField(source="paroisse.district.nom", read_only=True)
    region_nom   = serializers.CharField(source="paroisse.district.region.nom", read_only=True)
    total_fideles = serializers.SerializerMethodField()

    def get_total_fideles(self, obj):
        return (obj.communiants or 0) + (obj.non_communiants or 0)

    class Meta:
        model = StatistiqueAnnuelle
        fields = [
            "id", "annee",
            "paroisse", "paroisse_nom", "district_nom", "region_nom",
            "communiants", "non_communiants", "total_fideles",
            "baptemes", "confirmations", "mariages", "deces",
            "offrandes", "dimes", "validee",
        ]


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    scope_label  = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    region_nom   = serializers.CharField(source="region.nom",   read_only=True, default=None)
    district_nom = serializers.CharField(source="district.nom", read_only=True, default=None)
    paroisse_nom = serializers.CharField(source="paroisse.nom", read_only=True, default=None)

    def get_scope_label(self, obj):  return obj.get_scope_label()
    def get_role_display(self, obj): return obj.get_role_display()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "telephone", "role", "role_display", "is_active",
            "region", "region_nom",
            "district", "district_nom",
            "paroisse", "paroisse_nom",
            "scope_label", "permissions_custom",
            "force_password_change",
            "date_joined", "last_login",
        ]
        read_only_fields = ["date_joined", "last_login", "username"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Création d'un nouveau compte admin avec mot de passe temporaire."""
    password = serializers.CharField(write_only=True, min_length=12)

    class Meta:
        model = User
        fields = [
            "username", "email", "first_name", "last_name",
            "telephone", "role", "password",
            "region", "district", "paroisse",
            "permissions_custom",
        ]

    def validate(self, data):
        request_user = self.context["request"].user
        target_role = data.get("role", "PAROISSE")

        # Un REGION ne peut créer que DISTRICT ou PAROISSE
        if request_user.role == "REGION" and target_role not in ("DISTRICT", "PAROISSE"):
            raise serializers.ValidationError("Vous ne pouvez créer que des admins District ou Paroisse.")

        # Un DISTRICT ne peut créer que PAROISSE
        if request_user.role == "DISTRICT" and target_role != "PAROISSE":
            raise serializers.ValidationError("Vous ne pouvez créer que des admins Paroisse.")

        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.force_password_change = True
        # username par défaut = préfixe email
        if not user.username:
            base = validated_data.get("email", "user").split("@")[0]
            user.username = base
        user.save()
        return user
