from .base import *

import os

# Lues depuis l'environnement (avec des défauts cohérents avec le réseau
# docker-compose local) plutôt qu'en dur — INFRA-6 : la CI GitHub Actions
# utilise un service PostGIS séparé, accessible via localhost, pas "db".
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("DB_NAME", "eec_test_db"),
        "USER": os.environ.get("DB_USER", "eec_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "eec_test_password"),
        "HOST": os.environ.get("DB_HOST", "db"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
