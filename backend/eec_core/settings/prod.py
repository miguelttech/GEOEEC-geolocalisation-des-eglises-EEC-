from .base import *

import os
from pathlib import Path

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

# Le TLS est terminé par nginx (INFRA-2) — la connexion gunicorn↔nginx est en
# clair sur le réseau Docker interne. Sans cette ligne, Django ne sait pas
# que la requête d'origine était bien en HTTPS (request.is_secure() renvoie
# False) et SECURE_SSL_REDIRECT la redirige à nouveau — boucle inutile,
# constatée lors de la vérification de l'INFRA-2. nginx doit envoyer
# "X-Forwarded-Proto: https" (déjà fait dans geoeec.conf.template).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS/CSRF de production — dérivés de FRONTEND_URL (déjà utilisé pour les
# liens de réinitialisation par e-mail), donc un seul domaine à configurer.
# INFRA-3 : à étendre si plusieurs origines front doivent être autorisées.
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CSRF_TRUSTED_ORIGINS = [FRONTEND_URL]
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Journalisation (INFRA-5) — ajoute un fichier avec rotation à la config
# console de base.py. Écrit dans LOG_DIR, monté en bind-mount hôte (voir
# docker-compose.prod.yml) pour survivre à la recréation du conteneur —
# "docker logs" seul ne suffit pas comme unique trace en production.
# ---------------------------------------------------------------------------
LOG_DIR = Path(os.environ.get("LOG_DIR", "/app/logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING["handlers"]["file"] = {
    "class": "logging.handlers.RotatingFileHandler",
    "filename": str(LOG_DIR / "django.log"),
    "maxBytes": 10 * 1024 * 1024,  # 10 Mo
    "backupCount": 10,
    "formatter": "verbose",
}
LOGGING["root"]["handlers"].append("file")
for _logger_name in ("django", "django.request", "django.security"):
    LOGGING["loggers"][_logger_name]["handlers"].append("file")

# Alerte e-mail optionnelle sur erreur serveur (500) — no-op tant
# qu'ADMINS_EMAILS n'est pas défini (aucun comportement par défaut imposé).
_admin_emails = [e.strip() for e in os.environ.get("ADMINS_EMAILS", "").split(",") if e.strip()]
if _admin_emails:
    ADMINS = [("Admin GÉOEEC", email) for email in _admin_emails]
    LOGGING["handlers"]["mail_admins"] = {
        "class": "django.utils.log.AdminEmailHandler",
        "level": "ERROR",
        "formatter": "verbose",
    }
    LOGGING["loggers"]["django.request"]["handlers"].append("mail_admins")
