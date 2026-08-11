from rest_framework import serializers

from .models import News, NewsImage


class NewsImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = NewsImage
        fields = ["id", "image_url", "ordre"]


class NewsListSerializer(serializers.ModelSerializer):
    """Lecture — utilisée aussi bien par la landing page publique que par
    le tableau admin (le queryset filtre déjà par visibilité selon le rôle)."""
    images = NewsImageSerializer(many=True, read_only=True)
    auteur_nom = serializers.SerializerMethodField()

    def get_auteur_nom(self, obj):
        return obj.auteur.get_full_name() if obj.auteur else None

    class Meta:
        model = News
        fields = [
            "id", "titre", "contenu", "est_publiee",
            "auteur_nom", "images", "created_at", "updated_at",
        ]


class NewsWriteSerializer(serializers.ModelSerializer):
    """Création/édition — les images se gèrent via les endpoints dédiés
    (upload_images / delete_image), pas dans ce serializer."""

    class Meta:
        model = News
        fields = ["id", "titre", "contenu", "est_publiee"]
