# Plateforme EEC — Géolocalisation des paroisses et œuvres

Plateforme web officielle de géolocalisation nationale des paroisses et œuvres de l'Église Évangélique du Cameroun (EEC), commanditée par la Direction Nationale.

## Démarrage rapide (< 5 minutes)

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Git

### 1. Cloner et configurer

```powershell
git clone <url-du-repo>
cd GEOEEC
copy backend\.env.example backend\.env
# Editer backend\.env avec vos valeurs
```

### 2. Lancer tous les services

```powershell
docker compose up -d --build
```

### 3. Vérifier que tout fonctionne

| Service | URL | Description |
|---|---|---|
| Django Admin | http://localhost:8000/admin/ | Interface d'administration |
| API REST | http://localhost:8000/api/v1/ | API métier |
| GeoServer | http://localhost:8080/geoserver/web/ | Serveur cartographique |
| Frontend | http://localhost:3000/ | Application web |

### 4. Arrêter les services

```powershell
docker compose down
```

## Structure du projet

```
GEOEEC/
├── backend/        # Django 5 + GeoDjango + DRF
├── frontend/       # Next.js 14 + TypeScript + Tailwind
├── infra/          # Configuration GeoServer, Nginx
├── data/           # Données sources (lecture seule)
│   └── gis/        # Shapefiles
├── docs/           # Documentation technique
└── docker-compose.yml
```

## Stack technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Leaflet
- **Backend** : Django 5, GeoDjango, Django REST Framework
- **Carte** : GeoServer (WMS/WFS), Leaflet
- **Base de données** : PostgreSQL 16 + PostGIS 3.4
- **Cache** : Redis 7

## Sécurité

- Ne jamais committer le fichier `.env`
- Changer le mot de passe GeoServer dès le premier démarrage
- Voir `docs/GEOSERVER.md` pour les procédures de sécurité GeoServer
