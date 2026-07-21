#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Pas de valeur par défaut : un DJANGO_SETTINGS_MODULE manquant doit être
    # une erreur bloquante, pas un démarrage silencieux en configuration de
    # développement (DEBUG=True, CORS ouvert) si la variable est oubliée en
    # production. Le flag --settings=... (ex: pour lancer les tests avec
    # eec_core.settings.test) reste accepté même sans la variable d'env.
    has_settings_flag = any(
        arg == "--settings" or arg.startswith("--settings=") for arg in sys.argv[1:]
    )
    if not os.environ.get("DJANGO_SETTINGS_MODULE") and not has_settings_flag:
        sys.exit(
            "DJANGO_SETTINGS_MODULE n'est pas défini. Positionnez-le "
            "explicitement (ex: eec_core.settings.dev en local, "
            "eec_core.settings.prod en production) avant de lancer manage.py, "
            "ou passez --settings=... en argument."
        )
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
