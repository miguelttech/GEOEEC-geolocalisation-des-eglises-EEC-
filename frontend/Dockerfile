FROM node:20-alpine

ENV NODE_ENV=development

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker optimisé)
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
