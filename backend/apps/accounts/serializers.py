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

    avatar_url = serializers.SerializerMethodField()

    def get_scope_label(self, obj):  return obj.get_scope_label()
    def get_role_display(self, obj): return obj.get_role_display()

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

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
            "avatar_url", "theme",
            "date_joined", "last_login",
        ]
        # role/region/district/paroisse/permissions_custom/is_active : jamais
        # modifiables via ce serializer (utilisé pour le PATCH générique de
        # user_detail). Un changement de rôle ou de périmètre géographique
        # doit repasser par la logique stricte de UserCreateSerializer
        # (hiérarchie + un seul admin actif par zone) — pas par un simple
        # PATCH de profil, sous peine d'escalade de privilèges.
        read_only_fields = [
            "date_joined", "last_login", "username",
            "role", "region", "district", "paroisse",
            "permissions_custom", "is_active",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Création d'un compte administrateur — EXIGENCES OBLIGATOIRES :
      · le mot de passe est GÉNÉRÉ AUTOMATIQUEMENT côté serveur (jamais fourni
        par le client) et envoyé par e-mail à l'administrateur concerné ;
      · hiérarchie stricte : SUPER → tous ; REGION → DISTRICT/PAROISSE de SA
        région ; DISTRICT → PAROISSE de SON district ;
      · UN SEUL administrateur actif par région / district / paroisse
        (plusieurs SUPER autorisés) ;
      · un VISITEUR ne peut jamais être créé par ce circuit.
    """

    class Meta:
        model = User
        fields = [
            "username", "email", "first_name", "last_name",
            "telephone", "role",
            "region", "district", "paroisse",
            "permissions_custom",
        ]

    def validate(self, data):
        request_user = self.context["request"].user
        target_role = data.get("role", "PAROISSE")

        if target_role == "VISITEUR":
            raise serializers.ValidationError(
                "Un compte visiteur ne se crée pas ici (inscription publique uniquement).")
        if target_role not in ("SUPER", "REGION", "DISTRICT", "PAROISSE"):
            raise serializers.ValidationError("Rôle inconnu.")

        # ── Hiérarchie de création (STRICTE, un seul niveau vers le bas) ──
        #   SUPER    → RÉGION, DISTRICT, PAROISSE (tous)
        #   RÉGION   → DISTRICT uniquement (dans SA région)
        #   DISTRICT → PAROISSE uniquement (dans SON district)
        #   PAROISSE → aucun
        if request_user.role == "REGION" and target_role != "DISTRICT":
            raise serializers.ValidationError(
                "Un administrateur régional ne peut créer que des administrateurs de District.")
        if request_user.role == "DISTRICT" and target_role != "PAROISSE":
            raise serializers.ValidationError(
                "Un admin de district ne peut créer que des admins Paroisse.")
        if request_user.role == "PAROISSE":
            raise serializers.ValidationError(
                "Un administrateur paroissial ne peut créer aucun compte.")

        # ── Périmètre imposé par le créateur ─────────────────────────────
        if request_user.role == "REGION":
            data["region"] = request_user.region
            if data.get("district") and \
               data["district"].region_id != request_user.region_id:
                raise serializers.ValidationError("Ce district n'est pas dans votre région.")
        if request_user.role == "DISTRICT":
            data["district"] = request_user.district
            data["region"] = request_user.region
            if data.get("paroisse") and data["paroisse"].district_id != request_user.district_id:
                raise serializers.ValidationError("Cette paroisse n'est pas dans votre district.")

        # ── Rattachement obligatoire selon le rôle ───────────────────────
        if target_role == "REGION" and not data.get("region"):
            raise serializers.ValidationError("Un admin régional doit être rattaché à une région.")
        if target_role == "DISTRICT" and not data.get("district"):
            raise serializers.ValidationError("Un admin de district doit être rattaché à un district.")
        if target_role == "PAROISSE" and not data.get("paroisse"):
            raise serializers.ValidationError("Un admin paroissial doit être rattaché à une paroisse.")

        # ── UN SEUL admin actif par périmètre (SUPER : plusieurs autorisés) ──
        if target_role == "REGION" and User.objects.filter(
                role="REGION", region=data["region"], is_active=True).exists():
            raise serializers.ValidationError(
                f"La région « {data['region'].nom} » a déjà son administrateur (1 seul autorisé).")
        if target_role == "DISTRICT" and User.objects.filter(
                role="DISTRICT", district=data["district"], is_active=True).exists():
            raise serializers.ValidationError(
                f"Le district « {data['district'].nom} » a déjà son administrateur (1 seul autorisé).")
        if target_role == "PAROISSE" and User.objects.filter(
                role="PAROISSE", paroisse=data["paroisse"], is_active=True).exists():
            raise serializers.ValidationError(
                f"La paroisse « {data['paroisse'].nom} » a déjà son administrateur (1 seul autorisé).")

        return data

    def create(self, validated_data):
        import secrets
        import string
        # Mot de passe GÉNÉRÉ automatiquement (16 caractères, robuste)
        alphabet = string.ascii_letters + string.digits + "!#%*+-"
        password = "".join(secrets.choice(alphabet) for _ in range(16))

        user = User(**validated_data)
        user.set_password(password)
        user.force_password_change = True
        if not user.username:
            base = validated_data.get("email", "user").split("@")[0]
            candidate, i = base, 1
            while User.objects.filter(username=candidate).exists():
                i += 1
                candidate = f"{base}{i}"
            user.username = candidate
        user.save()
        # Transmis à la vue pour l'envoi par e-mail (jamais stocké en clair)
        user._generated_password = password
        return user
