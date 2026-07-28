#!/bin/sh
set -e

# Point d'entrée de PRODUCTION uniquement — le service dev (docker-compose.yml)
# écrase toujours "command:" par "python manage.py runserver", donc ce script
# ne s'exécute jamais en développement.

# Ce script démarre root (voir Dockerfile) UNIQUEMENT pour corriger les
# permissions du volume de logs — bind-mount hôte que Docker crée en root
# s'il n'existe pas encore. Tout le reste (migrate, collectstatic, gunicorn)
# tourne en non-root via gosu : le process applicatif final n'est jamais root.
LOG_DIR="${LOG_DIR:-/app/logs}"
mkdir -p "$LOG_DIR"
chown -R appuser:appuser "$LOG_DIR"

exec gosu appuser sh -c '
    set -e
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
    exec gunicorn eec_core.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers "${GUNICORN_WORKERS:-3}" \
        --access-logfile - \
        --error-logfile -
'
