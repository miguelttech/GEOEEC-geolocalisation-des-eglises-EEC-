from django.apps import AppConfig

class CartographieConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cartographie'
    verbose_name = 'Cartographie EEC'
    
    def ready(self):
        try:
            import cartographie.signals
        except ImportError:
            pass
