# Service de sauvegarde PostgreSQL (INFRA-4) — postgres:16-alpine fournit
# pg_dump/pg_restore de la même version que la base (postgis/postgis:16-3.4).
FROM postgres:16-alpine

COPY backup.sh /usr/local/bin/backup.sh
COPY offsite-hook.sh /usr/local/bin/offsite-hook.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/offsite-hook.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
