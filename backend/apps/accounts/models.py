from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ("SUPER", "Super Administrateur National"),
        ("REGION", "Administrateur Régional"),
        ("DISTRICT", "Administrateur District"),
        ("PAROISSE", "Administrateur Paroissial"),
    ]
    role = models.CharField(max_length=10, choices=ROLES, default="PAROISSE")

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
