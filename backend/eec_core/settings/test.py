from .base import *

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "eec_test_db",
        "USER": "eec_user",
        "PASSWORD": "EecDb@Dev2026!Secure",
        "HOST": "db",
        "PORT": "5432",
    }
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
