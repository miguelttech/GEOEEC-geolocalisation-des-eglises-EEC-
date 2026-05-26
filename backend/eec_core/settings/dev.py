from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3004",
    "http://127.0.0.1:3004",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3004",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SECURE = False

