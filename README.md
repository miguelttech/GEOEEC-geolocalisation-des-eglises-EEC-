# Plateforme EEC — Géolocalisation des paroisses et œuvres

Plateforme web officielle de géolocalisation nationale des paroisses et œuvres de l'Église Évangélique du Cameroun (EEC), commanditée par la Direction Nationale.

## Démarrage rapide (< 5 minutes)

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Git

### 1. Cloner et configurer

```powershell
# Windows (PowerShell)
git clone <url-du-repo>
cd GEOEEC
copy backend\.env.example backend\.env
# Editer backend\.env avec vos valeurs (dont DJANGO_SETTINGS_MODULE=eec_core.settings.dev)
```

```bash
# macOS / Linux
git clone <url-du-repo>
cd GEOEEC
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos valeurs (dont DJANGO_SETTINGS_MODULE=eec_core.settings.dev)
```

### 2. Lancer les services (backend + DB + GeoServer + Redis)

```bash
docker compose up -d --build
```

Le frontend, lui, tourne en dehors de Docker en développement (rechargement à chaud) :

```bash
cd frontend && npm install && npm run dev
```

### 3. Vérifier que tout fonctionne

| Service | URL | Description |
|---|---|---|
| Django Admin | http://localhost:8000/admin/ | Interface d'administration |
| API REST | http://localhost:8000/api/ | API métier |
| API Docs (Swagger) | http://localhost:8000/api/schema/swagger/ | Documentation interactive de l'API |
| GeoServer | http://localhost:8080/geoserver/web/ | Serveur cartographique |
| Frontend | http://localhost:3004/ | Application web |

### 4. Arrêter les services

```bash
docker compose down
```

## Structure du projet

```
GEOEEC/
├── backend/                  # Django 5 + GeoDjango + DRF
├── frontend/                 # Next.js + TypeScript + Tailwind
├── infra/
│   ├── nginx/                # Reverse proxy + template TLS (prod)
│   ├── backup/               # Service de sauvegarde PostgreSQL (prod)
│   ├── scripts/              # Bootstrap TLS, restauration DB
│   └── geoserver/            # Styles SLD
├── data/                     # Données sources (lecture seule)
│   └── gis/                  # Shapefiles
├── docs/                     # Documentation technique
├── .github/workflows/        # CI (tests + build automatiques)
├── docker-compose.yml        # Stack de développement
└── docker-compose.prod.yml   # Stack de production
```

## Stack technique

- **Frontend** : Next.js, TypeScript, Tailwind CSS, Leaflet (versions exactes : voir `frontend/package.json`)
- **Backend** : Django 5, GeoDjango, Django REST Framework
- **Carte** : GeoServer (WMS/WFS), Leaflet
- **Base de données** : PostgreSQL 16 + PostGIS 3.4
- **Cache** : Redis 7
- **Production** : gunicorn + nginx (TLS Let's Encrypt) — voir `docker-compose.prod.yml`

## Déploiement en production

Stack distincte de celle de développement — voir l'en-tête de `docker-compose.prod.yml` pour la procédure complète (fichiers `.env.prod` à créer depuis les `.example`, bootstrap TLS via `infra/scripts/init-letsencrypt.sh`, sauvegardes automatiques PostgreSQL, restauration via `infra/scripts/restore-postgres.sh`).

## Intégration continue

Chaque push/PR déclenche `.github/workflows/ci.yml` : suite de tests backend (bloquante) et build frontend (bloquant). Lint/formatage (`ruff`, `black`, `ESLint`) sont pour l'instant informatifs — le code existant n'a jamais été mis à niveau sur ce point.

## Sécurité

- Ne jamais committer les fichiers `.env`, `.env.prod` ou `backend/.env.prod`
- Changer le mot de passe GeoServer dès le premier démarrage (variable `GEOSERVER_ADMIN_PASSWORD`)
- En production, la console d'administration GeoServer (`/geoserver/web/`) est bloquée par le reverse proxy — voir `infra/nginx/templates/geoeec.conf.template`
