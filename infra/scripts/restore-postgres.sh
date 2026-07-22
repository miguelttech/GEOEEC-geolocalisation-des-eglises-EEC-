#!/bin/bash
# Restauration d'un dump PostgreSQL (INFRA-4) — à exécuter depuis le serveur
# de production, avec la stack "docker-compose.prod.yml" démarrée (au moins
# le service "db").
#
# ATTENTION : écrase la base de données cible. À utiliser en cas de sinistre
# réel ou pour un test de restauration périodique (recommandé) sur une base
# de test, jamais directement sur la prod sans y avoir réfléchi à deux fois.
#
# Usage : ./infra/scripts/restore-postgres.sh <fichier.dump> [nom_base_cible]
#   ./infra/scripts/restore-postgres.sh backups/postgres/eec_db_20260722_030000.dump
#   ./infra/scripts/restore-postgres.sh backups/postgres/eec_db_20260722_030000.dump eec_db_test

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage : $0 <fichier.dump> [nom_base_cible]"
    exit 1
fi

DUMP_FILE="$1"
if [ ! -f "$DUMP_FILE" ]; then
    echo "Fichier introuvable : $DUMP_FILE"
    exit 1
fi

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)

# Charge DB_NAME depuis .env.prod (pour la valeur par défaut ci-dessous) sans
# polluer l'environnement du script avec le reste du fichier.
DB_NAME_DEFAULT=$(grep -m1 '^DB_NAME=' .env.prod | cut -d= -f2)
DB_NAME_TARGET="${2:-${DB_NAME_DEFAULT:-eec_db}}"
DUMP_BASENAME=$(basename "$DUMP_FILE")

echo "### Copie du dump dans le conteneur db ..."
docker cp "$DUMP_FILE" "$("${COMPOSE[@]}" ps -q db)":"/tmp/$DUMP_BASENAME"

if [ "$DB_NAME_TARGET" = "${DB_NAME_DEFAULT:-eec_db}" ]; then
    echo "### ATTENTION : restauration dans la base ACTIVE '$DB_NAME_TARGET'."
    read -r -p "Confirmer (taper OUI en majuscules) : " CONFIRM
    [ "$CONFIRM" = "OUI" ] || { echo "Annulé."; exit 1; }
fi

echo "### Création de la base cible '$DB_NAME_TARGET' si nécessaire ..."
"${COMPOSE[@]}" exec -T db sh -c "psql -U \"\$POSTGRES_USER\" -tc \"SELECT 1 FROM pg_database WHERE datname = '$DB_NAME_TARGET'\" | grep -q 1 || \
  psql -U \"\$POSTGRES_USER\" -c \"CREATE DATABASE \\\"$DB_NAME_TARGET\\\"\""

echo "### Restauration (pg_restore, écrase les objets existants du même nom) ..."
"${COMPOSE[@]}" exec -T db sh -c "pg_restore --clean --if-exists --no-owner -U \"\$POSTGRES_USER\" -d '$DB_NAME_TARGET' /tmp/$DUMP_BASENAME"

echo "### Nettoyage ..."
"${COMPOSE[@]}" exec -T db rm -f "/tmp/$DUMP_BASENAME"

echo
echo "Terminé — base '$DB_NAME_TARGET' restaurée depuis $DUMP_FILE"
