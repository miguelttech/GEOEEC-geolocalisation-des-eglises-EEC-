#!/bin/sh
# Point d'accroche hors-site — appelé par backup.sh après CHAQUE dump réussi,
# avec le chemin du fichier en argument ($1).
#
# NO-OP PAR DÉFAUT — tant qu'aucune destination hors-site n'est choisie, les
# sauvegardes restent uniquement locales (voir INFRA-4 : "distinct de
# l'hôte" reste à faire tant que ce script ne fait rien).
#
# Pour l'activer plus tard, éditer CE fichier (pas backup.sh) puis
# reconstruire l'image du service "backup" :
#   docker compose -f docker-compose.prod.yml --env-file .env.prod build backup
#   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backup
#
# Exemple — stockage S3-compatible (AWS S3, Backblaze B2, Scaleway, OVH...),
# nécessite d'ajouter "aws-cli" ou "rclone" au Dockerfile :
#   aws s3 cp "$1" "s3://votre-bucket/postgres/$(basename "$1")"
#
# Exemple — serveur distant via SSH/rsync, nécessite une clé SSH montée en
# volume (lecture seule) et "openssh-client" ajouté au Dockerfile :
#   rsync -az -e "ssh -i /run/secrets/backup_ssh_key" \
#     "$1" backup@votre-serveur.exemple:/backups/geoeec/

DUMP_FILE="$1"
echo "[$(date -Iseconds)] offsite-hook.sh : aucune destination configurée (no-op) — $DUMP_FILE reste local uniquement."
