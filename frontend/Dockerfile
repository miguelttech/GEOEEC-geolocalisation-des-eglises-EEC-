FROM node:20-alpine

ENV NODE_ENV=development

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker optimisé)
COPY package*.json ./

RUN npm install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000

COPY . .

EXPOSE 3004
