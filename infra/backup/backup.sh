#!/bin/sh
# Sauvegarde PostgreSQL — dump complet + rotation locale + point d'accroche
# hors-site optionnel (voir offsite-hook.sh).
#
# Variables d'environnement (fournies par docker-compose.prod.yml) :
#   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD — connexion (lues
#     automatiquement par pg_dump, pas besoin de les passer en argument)
#   BACKUP_DIR             — dossier de sortie (défaut /backups)
#   BACKUP_RETENTION_DAYS  — durée de rétention locale (défaut 14 jours)

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$BACKUP_DIR/eec_db_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Démarrage du dump vers $DUMP_FILE"

# Format "custom" (-Fc) : compressé nativement, restauration sélective
# possible (table par table) et en parallèle avec pg_restore — voir
# restore.sh pour la procédure complète.
if pg_dump --format=custom --file="$DUMP_FILE"; then
    echo "[$(date -Iseconds)] Dump réussi ($(du -h "$DUMP_FILE" | cut -f1))"
else
    echo "[$(date -Iseconds)] ÉCHEC du dump — fichier partiel supprimé" >&2
    rm -f "$DUMP_FILE"
    exit 1
fi

# Rotation : supprime les dumps locaux plus vieux que RETENTION_DAYS.
# La copie hors-site (offsite-hook.sh) a sa propre rétention, indépendante.
find "$BACKUP_DIR" -name 'eec_db_*.dump' -mtime "+${RETENTION_DAYS}" -print -delete

# Point d'accroche hors-site — no-op par défaut (voir offsite-hook.sh).
/usr/local/bin/offsite-hook.sh "$DUMP_FILE"

echo "[$(date -Iseconds)] Terminé."
