import io
import uuid

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import News, NewsImage
from .serializers import NewsListSerializer, NewsWriteSerializer
from apps.accounts.permissions import ReadPublicWriteSuperOnly

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 Mo, comme upload_avatar


class NewsViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadPublicWriteSuperOnly]

    def get_queryset(self):
        qs = News.objects.prefetch_related("images").order_by("-created_at")
        user = self.request.user
        is_super = user.is_authenticated and getattr(user, "role", None) == "SUPER"
        # EXIGENCE : seul le SUPER voit les brouillons (non publiés) — le
        # grand public et les autres rôles admin ne voient que le publié.
        if not is_super:
            qs = qs.filter(est_publiee=True)
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return NewsWriteSerializer
        return NewsListSerializer

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    def perform_destroy(self, instance):
        for img in instance.images.all():
            img.image.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["post"], url_path="images",
            parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, pk=None):
        """POST /api/news/<id>/images/ — ajoute une ou plusieurs images
        (champ multipart 'images', répétable). Redimensionne à 1600×1600
        max, comme upload_avatar mais en plus grand (contenu éditorial)."""
        news = self.get_object()
        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "Aucune image fournie (champ 'images')."},
                             status=status.HTTP_400_BAD_REQUEST)

        next_ordre = news.images.count()
        for offset, f in enumerate(files):
            if f.size > MAX_IMAGE_SIZE:
                return Response({"detail": f"« {f.name} » dépasse 5 Mo."},
                                 status=status.HTTP_400_BAD_REQUEST)
            try:
                img = Image.open(f)
                img.verify()
                f.seek(0)
                img = Image.open(f)          # verify() consomme le flux, on rouvre
                img = img.convert("RGB")
            except (UnidentifiedImageError, OSError):
                return Response({"detail": f"« {f.name} » n'est pas une image valide."},
                                 status=status.HTTP_400_BAD_REQUEST)

            img.thumbnail((1600, 1600))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=87)
            buf.seek(0)

            ni = NewsImage(news=news, ordre=next_ordre + offset)
            ni.image.save(f"news_{news.id}_{uuid.uuid4().hex[:10]}.jpg",
                           ContentFile(buf.read()), save=True)

        # get_object() vient d'un queryset prefetch_related("images") figé
        # AVANT la création des images ci-dessus — sans refresh, le serializer
        # renverrait "images": [] malgré l'upload qui a bien réussi en base.
        news.refresh_from_db()
        return Response(
            NewsListSerializer(news, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>\d+)")
    def delete_image(self, request, pk=None, image_id=None):
        """DELETE /api/news/<id>/images/<image_id>/"""
        news = self.get_object()
        img = news.images.filter(id=image_id).first()
        if not img:
            return Response(status=status.HTTP_404_NOT_FOUND)
        img.image.delete(save=False)
        img.delete()
        # Même raison qu'en amont (upload_images) : invalider le cache
        # prefetch_related("images") figé par get_object() avant la suppression.
        news.refresh_from_db()
        return Response(NewsListSerializer(news, context={"request": request}).data)
