"""
ASGI config for eec_core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

# Pas de valeur par défaut : voir manage.py pour l'explication (éviter un
# démarrage silencieux en configuration dev si la variable est oubliée).
if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    raise RuntimeError(
        "DJANGO_SETTINGS_MODULE n'est pas défini. Positionnez-le "
        "explicitement (ex: eec_core.settings.dev en local, "
        "eec_core.settings.prod en production) avant de démarrer le serveur ASGI."
    )

from django.core.asgi import get_asgi_application

application = get_asgi_application()
