#!/bin/bash
# Bootstrap TLS (INFRA-2) — à exécuter UNE SEULE FOIS sur le serveur de
# production, avant le tout premier "docker compose -f docker-compose.prod.yml up".
#
# Nginx référence un certificat dans sa configuration HTTPS (voir
# infra/nginx/templates/geoeec.conf.template) : sans certificat existant, il
# refuse même de démarrer pour servir le défi ACME qui permettrait d'en
# obtenir un — ce script résout ce problème de l'œuf et la poule en générant
# d'abord un certificat auto-signé temporaire.
#
# Usage : ./infra/scripts/init-letsencrypt.sh <domaine> [email]
#   ./infra/scripts/init-letsencrypt.sh geoeec.eec-cameroun.org contact@eec-cameroun.org

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage : $0 <domaine> [email]"
    exit 1
fi

DOMAIN="$1"
EMAIL="${2:-}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

echo "### [1/5] Certificat auto-signé temporaire pour $DOMAIN ..."
"${COMPOSE[@]}" run --rm --entrypoint "sh -c \"\
    mkdir -p '$CERT_PATH' && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout '$CERT_PATH/privkey.pem' \
      -out '$CERT_PATH/fullchain.pem' \
      -subj '/CN=localhost'\"" certbot

echo "### [2/5] Démarrage de nginx (sert désormais le défi ACME) ..."
"${COMPOSE[@]}" up -d nginx

echo "### [3/5] Suppression du certificat temporaire ..."
"${COMPOSE[@]}" run --rm --entrypoint "sh -c \"\
    rm -rf '$CERT_PATH' \
      '/etc/letsencrypt/archive/$DOMAIN' \
      '/etc/letsencrypt/renewal/$DOMAIN.conf'\"" certbot

echo "### [4/5] Demande du certificat Let's Encrypt réel ..."
EMAIL_ARG="--register-unsafely-without-email"
if [ -n "$EMAIL" ]; then
    EMAIL_ARG="--email $EMAIL --no-eff-email"
fi
"${COMPOSE[@]}" run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot \
    $EMAIL_ARG -d $DOMAIN --rsa-key-size 2048 --agree-tos --force-renewal" certbot

echo "### [5/5] Rechargement de nginx avec le vrai certificat ..."
"${COMPOSE[@]}" exec nginx nginx -s reload

echo
echo "Terminé — https://$DOMAIN doit maintenant servir un certificat Let's Encrypt valide."
echo "Le service 'certbot' du docker-compose.prod.yml renouvelle automatiquement ensuite."
