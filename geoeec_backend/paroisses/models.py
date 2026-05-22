from django.contrib.gis.db import models as gis_models
from django.db import models

class Paroisse(models.Model):
    nom = models.CharField(max_length=255)
    quartier = models.CharField(max_length=255, null=True, blank=True)
    niveau = models.CharField(max_length=255)
    region_synodale = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    communiants = models.PositiveIntegerField(default=0)
    non_communiants = models.PositiveIntegerField(default=0)
    ouvriers = models.PositiveIntegerField(default=0)  
    localisation = gis_models.PointField(geography=True, null=True)
 

    def __str__(self):
        return self.nom

