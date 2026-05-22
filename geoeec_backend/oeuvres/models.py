from django.contrib.gis.db import models as gis_models
from django.db import models
from paroisses.models import Paroisse


class TypeOeuvre(models.TextChoices):
    SCOLAIRE = 'scolaire', 'Scolaire'
    UNIVERSITAIRE = 'universitaire', 'Universitaire'
    MEDICALE = 'medicale', 'Médicale'
    AGROPASTORALE = 'agropastorale', 'Agropastorale'
    IMMEUBLE = 'immeuble', 'Immeuble'
    TERRAIN = 'terrain', 'Terrain'
    AUTRE = 'autre', 'Autre'


class NiveauOeuvre(models.TextChoices):
    PAROISSIAL = 'paroissial', 'Paroissial'
    DISTRICT = 'district', 'District'
    REGIONAL = 'regional', 'Régional'


class Oeuvre(models.Model):
    nom = models.CharField(max_length=255)
    type = models.CharField(max_length=30, choices=TypeOeuvre.choices)
    niveau = models.CharField(max_length=30, choices=NiveauOeuvre.choices)

    # ✅ Relation vers la paroisse (facultative si oeuvre est régionale ou de district)
    paroisse = models.ForeignKey(
        Paroisse,
        on_delete=models.CASCADE,
        related_name="oeuvres",
        null=True,
        blank=True
    )

    localisation = gis_models.PointField(geography=True, null=True, blank=True)
    remarques = models.TextField(blank=True, null=True)

    # ✅ Infos complémentaires
    region_synodale = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Œuvre"
        verbose_name_plural = "Œuvres"

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()} - {self.get_niveau_display()})"
