"""
=============================================================================
FICHIER : apps/news/models.py
RÔLE    : Actualités publiées par le Super Administrateur, affichées
          publiquement sur la landing page (section Actualités, après la
          section Direction).

MODÈLES :
  - News      : une actualité (titre + texte optionnel), publiée ou brouillon
  - NewsImage : une image rattachée à une actualité (galerie, 0 à N images)
=============================================================================
"""

from django.conf import settings
from django.db import models


class News(models.Model):
    """Une actualité. Elle n'apparaît sur le site public qu'une fois
    est_publiee=True — permet au SUPER de préparer un contenu (texte +
    images) puis de le publier explicitement quand il est prêt."""

    titre = models.CharField(max_length=200)

    # Texte optionnel — une actualité peut être uniquement des photos.
    contenu = models.TextField(blank=True)

    # Contrôle de visibilité publique : brouillon (False) vs publiée (True).
    est_publiee = models.BooleanField(default=False)

    # SET_NULL : la suppression d'un compte admin ne doit jamais supprimer
    # les actualités déjà publiées.
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="actualites",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Actualité"
        verbose_name_plural = "Actualités"
        ordering = ["-created_at"]

    def __str__(self):
        return self.titre


class NewsImage(models.Model):
    """Une image d'une actualité — une actualité peut en avoir plusieurs
    (galerie) ou aucune (actualité texte seul). CASCADE : les images n'ont
    aucun sens sans leur actualité parente."""

    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="news/")

    # Ordre d'affichage dans la galerie (0 = premier / image de couverture).
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Image d'actualité"
        verbose_name_plural = "Images d'actualité"
        ordering = ["ordre", "id"]

    def __str__(self):
        return f"Image #{self.ordre} — {self.news.titre}"
