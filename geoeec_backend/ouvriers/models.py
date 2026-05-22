from django.db import models

class Ouvrier(models.Model):
    nom = models.CharField(max_length=255)
    grade = models.CharField(max_length=100)
    contact = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    region_synodale = models.CharField(max_length=255, blank=True, null=True) 
    paroisse_nom = models.CharField(max_length=255, blank=True, null=True) 


    def __str__(self):
        return f"{self.nom} - {self.grade}"
