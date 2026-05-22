from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Paroisse, Ouvrier, Oeuvre, StatistiqueAnnuelle

@receiver([post_save, post_delete], sender=Paroisse)
@receiver([post_save, post_delete], sender=Ouvrier)
@receiver([post_save, post_delete], sender=Oeuvre)
@receiver([post_save, post_delete], sender=StatistiqueAnnuelle)
def clear_statistics_cache(sender, **kwargs):
    """Vide le cache des statistiques quand les données changent"""
    cache_keys = [
        'cartography_statistics',
        'cartography_regional_statistics',
        'cartography_layers',
        'cartography_heatmap',
        'statistics_overview'
    ]
    
    for key in cache_keys:
        cache.delete(key)
