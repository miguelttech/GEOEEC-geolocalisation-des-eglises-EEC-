#!/bin/sh
# Planifie backup.sh via crond (busybox, déjà présent dans postgres:16-alpine)
# et lance un premier dump immédiat au démarrage (retour rapide en cas de
# mauvaise configuration, sans attendre la prochaine échéance planifiée).

set -eu

BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 3 * * *}"

# busybox crond ne propage PAS l'environnement du conteneur aux tâches
# planifiées — on l'exporte explicitement dans un fichier sourcé par le job.
{
    echo "export PGHOST='${PGHOST:-db}'"
    echo "export PGPORT='${PGPORT:-5432}'"
    echo "export PGDATABASE='${PGDATABASE:?PGDATABASE requis}'"
    echo "export PGUSER='${PGUSER:?PGUSER requis}'"
    echo "export PGPASSWORD='${PGPASSWORD:?PGPASSWORD requis}'"
    echo "export BACKUP_DIR='${BACKUP_DIR:-/backups}'"
    echo "export BACKUP_RETENTION_DAYS='${BACKUP_RETENTION_DAYS:-14}'"
} > /etc/backup_env

# Sortie redirigée vers le stdout/stderr du conteneur (PID 1) — visible via
# "docker logs eec_backup_prod", pas besoin d'exec dans le conteneur.
echo "$BACKUP_SCHEDULE . /etc/backup_env && /usr/local/bin/backup.sh >>/proc/1/fd/1 2>>/proc/1/fd/2" > /etc/crontabs/root

echo "[$(date -Iseconds)] Planification : '$BACKUP_SCHEDULE'. Premier dump immédiat :"
/usr/local/bin/backup.sh || echo "[$(date -Iseconds)] Le dump initial a échoué — vérifiez PGHOST/PGUSER/PGPASSWORD/PGDATABASE." >&2

exec crond -f -l 2
