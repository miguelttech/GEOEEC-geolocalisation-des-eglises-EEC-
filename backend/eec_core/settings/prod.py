from .base import *

from django.core.exceptions import ImproperlyConfigured

# Garde-fou : refuser de démarrer en production si SECRET_KEY est resté à sa
# valeur par défaut (variable d'environnement oubliée) — mieux vaut un crash
# explicite au démarrage qu'une clé secrète connue et partagée par tous les
# déploiements non configurés.
if SECRET_KEY == "changez-en-prod":
    raise ImproperlyConfigured(
        "SECRET_KEY n'a pas été défini via une variable d'environnement — "
        "impossible de démarrer en production avec la valeur par défaut."
    )

DEBUG = False

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True
