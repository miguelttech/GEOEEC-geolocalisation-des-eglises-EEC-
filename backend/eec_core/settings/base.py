import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "changez-en-prod")

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_gis",
    "corsheaders",
    "django_ratelimit",
    "drf_spectacular",
    "simple_history",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.geo",
    "apps.oeuvres",
    "apps.ouvriers",
    "apps.audit",
    "apps.exports",
    "apps.visitors",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Sert les fichiers statiques (admin Django, Swagger) directement depuis
    # gunicorn — suffisant tant qu'aucun reverse proxy n'est en place devant
    # le backend (voir docker-compose.prod.yml).
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "eec_core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "eec_core.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("DB_NAME", "eec_db"),
        "USER": os.environ.get("DB_USER", "eec_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "db"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "eec_core.pagination.StandardPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Pas de throttle global : la carte publique charge des centaines
    # d'enregistrements paginés. On ne limite que login / register (voir
    # apps/accounts/throttles.py et les vues d'authentification).
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        # 60/min laissait passer un bruteforce complet (20 tentatives en
        # quelques secondes sans blocage, audit sécurité du 24/07/2026).
        "login":           "5/min",
        "register":        "30/hour",
        "password_reset":  "5/hour",
        "export":          "20/min",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "EEC Géolocalisation API",
    "DESCRIPTION": "API REST de la plateforme de géolocalisation des paroisses et œuvres de l'EEC",
    "VERSION": "1.0.0",
    "LANGUAGE": "fr",
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://redis:6379/0"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_COOKIE_NAME = "eec_sessionid"  # Unique pour éviter les conflits localhost
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax" # Modifié pour le dev cross-origin par défaut

# Configuration CSRF
CSRF_COOKIE_NAME = "eec_csrftoken"     # Unique pour éviter les conflits localhost
CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = False          # Permet au frontend de le lire si besoin
CSRF_COOKIE_SAMESITE = "Lax"

GEOSERVER_URL = os.environ.get("GEOSERVER_URL", "http://geoserver:8080/geoserver")

# Email — SMTP si credentials fournis, sinon affichage console (logs Docker)
EMAIL_HOST_USER     = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
_smtp_ready = bool(EMAIL_HOST_USER and EMAIL_HOST_PASSWORD and "REMPLACER" not in EMAIL_HOST_PASSWORD)
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend" if _smtp_ready
    else "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST     = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT     = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS  = os.environ.get("EMAIL_USE_TLS", "True") == "True"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "GÉOEEC EEC Cameroun <noreply@eec-cameroun.org>")

# URL publique du frontend (pour les liens de reset dans les emails)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3004")

# Durée de validité des tokens de réinitialisation (en secondes) — 1 heure
PASSWORD_RESET_TIMEOUT = 3600

# ---------------------------------------------------------------------------
# Journalisation (INFRA-5) — base commune console-only. prod.py ajoute un
# fichier avec rotation (persisté hors du conteneur) et, en option, une
# alerte e-mail sur erreur serveur (ADMINS_EMAILS).
# ---------------------------------------------------------------------------
LOG_LEVEL = os.environ.get("DJANGO_LOG_LEVEL", "INFO")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} — {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        # Django lève déjà des logs propres — on les redirige plutôt que de
        # les dupliquer avec un logger racine trop bavard.
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        # Erreurs serveur (500) — c'est le logger le plus important à ne
        # jamais perdre, quel que soit l'environnement.
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        # Alertes sécurité (CSRF, hôtes suspects, etc.)
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
