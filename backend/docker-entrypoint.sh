#!/bin/sh
set -e

# Point d'entrée de PRODUCTION uniquement — le service dev (docker-compose.yml)
# écrase toujours "command:" par "python manage.py runserver", donc ce script
# ne s'exécute jamais en développement.

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn eec_core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --access-logfile - \
    --error-logfile -
