#!/bin/sh
set -e

# Point d'entrée de PRODUCTION uniquement — le service dev (docker-compose.yml)
# écrase toujours "command:" par "python manage.py runserver", donc ce script
# ne s'exécute jamais en développement.

# DIMENSIONNEMENT GUNICORN (VPS OVH VPS-2 : 4 vCores, 8 Go de RAM)
#   --workers 4 --threads 4  = 16 requêtes simultanées, ~1,2 Go de RAM.
#
#   Pourquoi pas les 9 workers de la formule classique (2 x vCPU) + 1 ?
#     1. Cette formule vise des workers *sync* saturant un cœur en CPU. Depuis
#        la mise en cache Redis des listes publiques (eec_core/cache.py), les
#        requêtes de la carte sont liées aux I/O — des threads les servent
#        bien moins cher que des processus.
#     2. Un worker GeoDjango charge GDAL/GEOS : environ 250 Mo à vide.
#        9 workers immobiliseraient ~2,25 Go pour rien.
#     3. Next.js (SSR) tourne sur les mêmes 4 cœurs ; 9 processus gunicorn
#        l'affameraient.
#
#   --max-requests recycle chaque worker après ~1000 requêtes (avec gigue,
#   pour ne pas les redémarrer tous en même temps) : borne la croissance
#   mémoire d'un processus Django à longue durée de vie.
#
#   --timeout 60 : le défaut de 30 s tuait les workers pendant les pointes,
#   au moment précis où la file était déjà pleine.
#
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
        --workers "${GUNICORN_WORKERS:-4}" \
        --worker-class gthread \
        --threads "${GUNICORN_THREADS:-4}" \
        --timeout 60 \
        --graceful-timeout 30 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --access-logfile - \
        --error-logfile -
'
