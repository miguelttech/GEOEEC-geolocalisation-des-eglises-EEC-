from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.accounts.models import User
from .models import ProfilVisiteur


@receiver(post_save, sender=User)
def create_profil_visiteur(sender, instance, created, **kwargs):
    if created and instance.role == "VISITEUR":
        ProfilVisiteur.objects.get_or_create(utilisateur=instance)
