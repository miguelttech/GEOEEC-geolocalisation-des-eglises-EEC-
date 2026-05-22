# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin_general', 'Administrateur Général'),
        ('admin_regional', 'Administrateur Régional'),
        ('utilisateur_auth', 'Utilisateur Authentifié'),
        ('visiteur', 'Visiteur Public'),
    ]

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='visiteur')
    region_synodale = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=128, null=True, blank=True)
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
