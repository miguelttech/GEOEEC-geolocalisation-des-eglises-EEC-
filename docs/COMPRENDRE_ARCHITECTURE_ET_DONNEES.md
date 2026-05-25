# Comprendre l'architecture, les données et la base de données
## Projet EEC Géolocalisation — Guide complet pour Miguel

---

## Table des matières

1. [Tout est réel — rien n'est fictif](#1-tout-est-réel--rien-nest-fictif)
2. [L'architecture en 5 services Docker](#2-larchitecture-en-5-services-docker)
3. [PostgreSQL vs PostGIS — quelle différence ?](#3-postgresql-vs-postgis--quelle-différence-)
4. [Où sont stockées nos données ?](#4-où-sont-stockées-nos-données-)
5. [Le fichier Shapefile — où est-il allé ?](#5-le-fichier-shapefile--où-est-il-allé-)
6. [GeoServer — à quoi ça sert concrètement ?](#6-geoserver--à-quoi-ça-sert-concrètement-)
7. [Comment VOIR la base de données ?](#7-comment-voir-la-base-de-données-)
8. [phpMyAdmin ne fonctionne pas ici — pourquoi ?](#8-phpmyadmin-ne-fonctionne-pas-ici--pourquoi-)
9. [Récapitulatif complet des tables et données importées](#9-récapitulatif-complet-des-tables-et-données-importées)
10. [Récapitulatif de toutes les commandes d'import](#10-récapitulatif-de-toutes-les-commandes-dimport)
11. [Schéma global — comment tout s'articule](#11-schéma-global--comment-tout-sarticule)

---

## 1. Tout est réel — rien n'est fictif

Miguel, quand on lance des commandes comme `python manage.py import_paroisses`, les données
ne disparaissent pas dans le néant. Elles sont **réellement écrites dans une base de données
PostgreSQL** qui tourne en permanence sur ton ordinateur — à l'intérieur d'un conteneur Docker.

L'impression de "virtuel" vient du fait que tout est dans Docker : on ne voit pas de dossier
de fichiers `.db` sur le bureau, pas d'interface qui s'ouvre automatiquement. Mais les données
existent bien, sont persistantes (elles survivent aux redémarrages), et on va voir ensemble
comment les visualiser.

---

## 2. L'architecture en 5 services Docker

Docker est un outil qui crée des "boîtes isolées" (appelées conteneurs) sur ton ordinateur.
Chaque service du projet est dans sa propre boîte :

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TON ORDINATEUR (Windows 11)                     │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │  FRONTEND   │  │   BACKEND   │  │           BASE DE           │ │
│  │  Next.js    │  │   Django    │  │         DONNÉES             │ │
│  │  (React)    │  │  (Python)   │  │    PostgreSQL + PostGIS     │ │
│  │             │  │             │  │                             │ │
│  │ Port: 3000  │  │ Port: 8000  │  │       Port: 5432            │ │
│  │             │  │             │  │                             │ │
│  │  La carte   │  │  Les APIs   │  │  Toutes les données EEC     │ │
│  │  Leaflet    │  │  REST       │  │  (paroisses, oeuvres, etc.) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────────────────┐  │
│  │      GEOSERVER        │  │             REDIS                 │  │
│  │  Serveur cartographique│  │         (Cache rapide)           │  │
│  │  Affiche les polygones │  │  Accélère les requêtes répétées  │  │
│  │  (régions, districts) │  │                                   │  │
│  │       Port: 8080      │  │          Port: 6379               │  │
│  └───────────────────────┘  └───────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Ce que fait chaque service :**

| Service | Rôle | Accès depuis le navigateur |
|---------|------|---------------------------|
| `backend` (Django) | Traite les requêtes, gère les données | `http://localhost:8000` |
| `frontend` (Next.js) | Affiche l'interface et la carte | `http://localhost:3000` |
| `db` (PostgreSQL+PostGIS) | **Stocke TOUTES les données** | Non accessible directement par le navigateur |
| `geoserver` | Sert les cartes (polygones des régions) | `http://localhost:8080/geoserver` |
| `redis` | Cache rapide (optimisation) | Non accessible directement |

---

## 3. PostgreSQL vs PostGIS — quelle différence ?

C'est ici que beaucoup de gens sont perdus. La réponse est simple :

```
PostgreSQL = Base de données classique (comme MySQL ou MariaDB)
PostGIS    = Extension de PostgreSQL qui ajoute les données géographiques
```

**Ce n'est PAS deux bases de données séparées.**  
PostGIS est un "module complémentaire" installé À L'INTÉRIEUR de PostgreSQL,
exactement comme un plugin.

```
┌──────────────────────────────────────────────────────┐
│                  PostgreSQL 16                       │
│                                                      │
│   Données normales (texte, nombres, dates...)        │
│   ┌───────────────────────────────────────────────┐  │
│   │  Table geo_paroisse                           │  │
│   │   id | nom | adresse | district_id | ...      │  │
│   └───────────────────────────────────────────────┘  │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │  Extension PostGIS (installée à l'intérieur) │   │
│   │                                              │   │
│   │  Ajoute les types de données géographiques : │   │
│   │  • PointField    → un point GPS (lat, lon)   │   │
│   │  • PolygonField  → un polygone fermé          │   │
│   │  • MultiPolygon  → plusieurs polygones        │   │
│   │  • LineString    → une ligne (itinéraire)     │   │
│   │                                              │   │
│   │  Ajoute les fonctions géographiques :        │   │
│   │  • ST_Distance() → distance entre 2 points   │   │
│   │  • ST_Contains() → un point est dans un zone │   │
│   │  • ST_AsGeoJSON() → export format GeoJSON    │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**En résumé :**
- **Données normales** (noms, chiffres, texte) → stockées dans PostgreSQL
- **Données géographiques** (coordonnées GPS, frontières, polygones) → aussi stockées dans PostgreSQL, mais grâce aux types AJOUTÉS par PostGIS
- **UNE SEULE base de données** contient tout : `eec_db`

---

## 4. Où sont stockées nos données ?

**TOUT est dans la même base de données : `eec_db` sur PostgreSQL+PostGIS.**

```
Base de données : eec_db
Serveur         : localhost:5432 (accessible depuis ton ordi)
Utilisateur     : eec_user
Mot de passe    : EecDb@2026!SecurePass

┌─────────────────────────────────────────────────────────────────┐
│                    Base de données : eec_db                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DONNÉES GÉOGRAPHIQUES (PostGIS)                        │   │
│  │                                                         │   │
│  │  geo_regionsynodale  → 22 régions EEC                   │   │
│  │    - nom, code                                          │   │
│  │    - geometrie = MultiPolygon (frontières du shapefile) │   │
│  │                                                         │   │
│  │  geo_district        → 137 districts                    │   │
│  │    - nom, region_id (FK)                                │   │
│  │    - geometrie = MultiPolygon (optionnel)               │   │
│  │                                                         │   │
│  │  geo_paroisse        → 553 paroisses                    │   │
│  │    - nom, adresse, district_id (FK)                     │   │
│  │    - position = Point (latitude, longitude)             │   │
│  │      402 paroisses avec GPS / 151 sans GPS              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DONNÉES MÉTIER (PostgreSQL classique)                  │   │
│  │                                                         │   │
│  │  oeuvres_typeoeuvre  → 7 types (Scolaire, Médical...)   │   │
│  │  oeuvres_oeuvre      → 311 oeuvres EEC                  │   │
│  │    - nom, type_oeuvre_id, paroisse_id (ou district/reg) │   │
│  │    - position = Point (GPS si disponible)               │   │
│  │                                                         │   │
│  │  accounts_statistiqueannuelle → 545 statistiques 2025   │   │
│  │    - paroisse_id, annee, communiants, non_communiants.. │   │
│  │                                                         │   │
│  │  accounts_user       → utilisateurs admin               │   │
│  │  ouvriers_grade      → grades EEC (vide pour l'instant) │   │
│  │  ouvriers_ouvrier    → ouvriers (vide pour l'instant)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TABLES SYSTÈME DJANGO (gestion automatique)            │   │
│  │                                                         │   │
│  │  django_migrations   → historique des migrations        │   │
│  │  auth_permission     → permissions Django               │   │
│  │  spatial_ref_sys     → systèmes de coordonnées (PostGIS)│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Le fichier Shapefile — où est-il allé ?

Le Shapefile (`Region_synodale_ok2.shp` + ses 6 fichiers complémentaires) était
le fichier source contenant les **frontières géographiques** des 22 régions EEC.

Voici ce qui s'est passé lors de la commande `python manage.py import_regions` :

```
AVANT l'import                          APRÈS l'import
─────────────────                       ──────────────────────────────────
data/                                   Table geo_regionsynodale en base :
└── gis/                                ┌──────────────────────────────────┐
    ├── Region_synodale_ok2.shp  ──────▶│ id | nom          | geometrie    │
    ├── Region_synodale_ok2.dbf  ──────▶│ 1  | ADAMAOUA     | 0106000020  │
    ├── Region_synodale_ok2.prj  ──────▶│    |               | E6100000... │
    ├── Region_synodale_ok2.shx        │ 2  | BAMBOUTOS ... | (polygone)  │
    ├── Region_synodale_ok2.sbn        │ ...| ...           | ...          │
    └── Region_synodale_ok2.sbx        │ 22 | WOURI SUD    | (polygone)  │
                                        └──────────────────────────────────┘
                                              ↑
                                        Stocké dans PostgreSQL/PostGIS
                                        Format interne : WKB binaire
                                        Système de coord. : EPSG:4326 (GPS)
```

**Le Shapefile lui-même n'est plus nécessaire** : ses données (noms + géométries)
ont été extraites et copiées dans la base PostgreSQL. Le dossier `data/gis/` peut
être conservé comme archive, mais la base de données est la source de vérité.

La colonne `geometrie` de type `MultiPolygon` contient les coordonnées de TOUTES
les frontières de chaque région — c'est ce qui permet d'afficher les polygones
sur la carte Leaflet.

---

## 6. GeoServer — à quoi ça sert concrètement ?

**GeoServer est un serveur cartographique.** Il lit les données géographiques de
PostgreSQL/PostGIS et les publie sous forme de **tuiles d'images** ou de **couches
vectorielles** que le navigateur peut afficher directement sur une carte.

```
SANS GeoServer (ce que ferait le frontend seul) :
─────────────────────────────────────────────────
Frontend         Demande 22 polygones à l'API Django
(navigateur) ──▶ Django lit 22 lignes en base
                 Django renvoie 22 gros objets GeoJSON (beaucoup de données)
                 Frontend dessine 22 polygones avec Leaflet

Problème : Si on a 553 paroisses + 137 districts + 22 régions,
           cela fait des MILLIERS de coordonnées à envoyer à chaque fois.
           La carte devient lente.


AVEC GeoServer (ce qu'on a configuré) :
────────────────────────────────────────────────────────────────────────
                ┌─────────────┐    lit les géométries     ┌────────────┐
Frontend  ──── ▶│  GeoServer  │ ◀──────────────────────── │ PostgreSQL │
(carte)         │             │    "donne-moi les régions" │  PostGIS   │
                │ Génère une  │                            └────────────┘
                │ image PNG   │
                │ ou un JSON  │
                │ optimisé    │
                └─────────────┘
                      │
                      ▼
          Frontend affiche une image déjà prête
          Beaucoup plus rapide !

GeoServer sert les couches via deux protocoles standards :
  • WMS (Web Map Service)  → des images PNG des polygones
  • WFS (Web Feature Service) → des données vectorielles GeoJSON
```

**Pour notre projet, GeoServer sert à :**
1. Afficher les **polygones des 22 régions** sur la carte (frontières colorées)
2. Afficher les **polygones des 137 districts** quand on zoome
3. Appliquer des **styles SLD** (couleurs, opacité, bordures) aux couches
4. Optimiser les performances : au lieu d'envoyer tous les polygones au navigateur,
   GeoServer envoie une image déjà rendue

**État actuel de GeoServer :**  
GeoServer tourne sur `http://localhost:8080/geoserver` mais les couches
(layers) n'ont pas encore été configurées. C'est une étape qu'on fera
lors de la phase de développement du frontend.

---

## 7. Comment VOIR la base de données ?

Il existe plusieurs façons de voir concrètement les tables et les données.

### Option A — Via l'interface Django Admin (la plus simple)

Django fournit une interface d'administration automatique.
Elle est disponible à : **`http://localhost:8000/admin/`**

Pour y accéder, il faut d'abord créer un compte super-administrateur :

```powershell
# Dans PowerShell, depuis le dossier d:\Academique\GEOEEC\
docker compose run --rm backend python manage.py createsuperuser
```

Répondre aux questions (username, email, password), puis aller sur
`http://localhost:8000/admin/` et se connecter.

On y voit TOUTES les tables avec une interface graphique pour lire,
modifier, filtrer les données.

### Option B — Via DBeaver (outil gratuit, le meilleur pour PostgreSQL)

DBeaver est un outil de gestion de bases de données compatible avec
PostgreSQL, MySQL, SQLite, Oracle, etc.

**Téléchargement gratuit :** https://dbeaver.io/download/

**Paramètres de connexion :**
```
Type de base    : PostgreSQL
Hôte            : localhost
Port            : 5432
Base de données : eec_db
Utilisateur     : eec_user
Mot de passe    : EecDb@2026!SecurePass
```

Une fois connecté, on peut voir toutes les tables, leurs colonnes,
leurs données, et même exécuter des requêtes SQL.

### Option C — Via psql dans Docker (ligne de commande)

```powershell
# Se connecter à la base depuis PowerShell
docker compose exec db psql -U eec_user -d eec_db

# Quelques commandes psql utiles :
\dt              -- lister toutes les tables
\d geo_paroisse  -- voir la structure d'une table
SELECT COUNT(*) FROM geo_paroisse;   -- compter les paroisses
SELECT nom, communiants FROM accounts_statistiqueannuelle LIMIT 5;  -- voir les stats
\q               -- quitter
```

### Option D — Via pgAdmin (interface web pour PostgreSQL)

pgAdmin est l'équivalent de phpMyAdmin mais pour PostgreSQL.
On peut l'ajouter facilement à notre projet Docker.

---

## 8. phpMyAdmin ne fonctionne pas ici — pourquoi ?

C'est une confusion très courante. Voici la différence :

```
phpMyAdmin ──── conçu pour ──── MySQL / MariaDB
pgAdmin    ──── conçu pour ──── PostgreSQL ✅  (c'est ce qu'on utilise)
```

Notre projet utilise **PostgreSQL**, pas MySQL.
phpMyAdmin ne peut pas se connecter à une base PostgreSQL.

Si tu as phpMyAdmin installé sur ton bureau, il est connecté à une base
MySQL/MariaDB (probablement via WAMP ou XAMPP). Notre base EEC est une
base PostgreSQL **complètement séparée**, qui tourne dans Docker.

---

## 9. Récapitulatif complet des tables et données importées

### 9.1 — Liste de toutes les tables en base

```
Base de données : eec_db (PostgreSQL 16 + PostGIS 3.4)
Serveur         : localhost:5432
```

| Table | Description | Lignes | Colonnes |
|-------|-------------|--------|----------|
| `geo_regionsynodale` | 22 régions synodales EEC | **22** | 6 |
| `geo_district` | Subdivisions des régions | **137** | 5 |
| `geo_paroisse` | Paroisses avec GPS | **553** | 13 |
| `geo_zoneinfluence` | Zone autour d'une paroisse | 0 | 6 |
| `geo_itineraire` | Chemin entre paroisses | 0 | 9 |
| `geo_historiqueposition` | Historique GPS | 0 | 8 |
| `oeuvres_typeoeuvre` | 7 catégories d'oeuvres | **7** | 4 |
| `oeuvres_oeuvre` | Infrastructures EEC | **311** | 16 |
| `accounts_user` | Administrateurs | 0 | 12 |
| `accounts_statistiqueannuelle` | Stats annuelles 2025 | **545** | 12 |
| `ouvriers_grade` | Grades ecclésiaux | 0 | 4 |
| `ouvriers_ouvrier` | Ouvriers individuels | 0 | 14 |
| `spatial_ref_sys` | Systèmes de coord. (PostGIS) | 8500+ | 5 |
| `django_migrations` | Historique migrations | auto | 4 |

### 9.2 — Détail de chaque table importante

#### `geo_regionsynodale` — 22 lignes

| Colonne | Type | Contenu |
|---------|------|---------|
| id | bigint | Identifiant unique auto |
| nom | varchar(100) | Ex: "ADAMAOUA", "WOURI SUD" |
| code | varchar(10) | Code court (non rempli) |
| geometrie | **MultiPolygon** | **Frontières géographiques du shapefile** |
| population_estimee | integer | Null (non disponible) |
| date_creation | date | Null (non disponible) |

#### `geo_district` — 137 lignes

| Colonne | Type | Contenu |
|---------|------|---------|
| id | bigint | Identifiant unique auto |
| nom | varchar(150) | Ex: "NGAOUNDERE", "CENTRE 1" |
| code | varchar(20) | Null |
| region_id | bigint (FK) | Lien vers geo_regionsynodale |
| geometrie | MultiPolygon | Null (pas de shapefile districts) |

*Note : 134 districts originaux + 3 créés lors des corrections (NGAOUNDAL, BANA, KAELE)*

#### `geo_paroisse` — 553 lignes

| Colonne | Type | Contenu |
|---------|------|---------|
| id | bigint | Identifiant unique auto |
| nom | varchar(200) | Ex: "PAROISSE DE BONANJO" |
| code | varchar(20) | Null |
| **position** | **Point (GPS)** | **Coordonnées GPS (lon, lat) — 402/553 remplies** |
| adresse | text | Quartier / adresse |
| telephone | varchar(30) | Vide |
| email | varchar(254) | Vide |
| annee_creation | integer | Null |
| est_active | boolean | True pour toutes |
| nombre_fideles | integer | Null |
| created_at | timestamp | Date d'import |
| updated_at | timestamp | Date de dernière modif |
| district_id | bigint (FK) | Lien vers geo_district |

#### `oeuvres_oeuvre` — 311 lignes

| Colonne | Type | Contenu |
|---------|------|---------|
| id | bigint | Identifiant unique auto |
| nom | varchar(200) | Ex: "École Primaire de Ndoungué" |
| type_oeuvre_id | bigint (FK) | Lien vers oeuvres_typeoeuvre |
| **paroisse_id** | bigint (FK) | Lien vers geo_paroisse (204 oeuvres) |
| **district_id** | bigint (FK) | Lien vers geo_district (44 oeuvres) |
| **region_id** | bigint (FK) | Lien vers geo_regionsynodale (63 oeuvres) |
| position | Point (GPS) | GPS si disponible (159/311) |
| adresse | text | Vide |
| description | text | Vide |
| est_active | boolean | True pour toutes |

#### `accounts_statistiqueannuelle` — 545 lignes

| Colonne | Type | Contenu |
|---------|------|---------|
| id | bigint | Identifiant unique auto |
| paroisse_id | bigint (FK) | Lien vers geo_paroisse |
| annee | integer | **2025** pour toutes |
| communiants | integer | Membres adultes confirmés |
| non_communiants | integer | Membres non encore confirmés |
| baptemes | integer | **0** (non disponible dans l'Excel) |
| confirmations | integer | **0** (non disponible) |
| mariages | integer | **0** (non disponible) |
| deces | integer | **0** (non disponible) |
| offrandes | decimal | **0.00** (non disponible) |
| dimes | decimal | **0.00** (non disponible) |
| validee | boolean | False (non validée) |

### 9.3 — Statistiques globales EEC 2025 (calculées en base)

| Indicateur | Valeur |
|------------|--------|
| Total communiants EEC | **133 935** |
| Total non-communiants EEC | **49 535** |
| **Total fidèles EEC 2025** | **183 470** |
| Paroisses sans données statistiques | 8 (sur 553) |
| Paroisse avec le plus de communiants | **Makepe Tonnerre** (3 195) |

### 9.4 — Répartition des oeuvres par type

| Type | Oeuvres | Couleur carte |
|------|---------|---------------|
| Immeuble | **88** | Orange `#D97706` |
| Terrain | **100** | Gris-brun `#78716C` |
| Scolaire | **83** | Bleu `#2563EB` |
| Médicale | **30** | Rouge `#DC2626` |
| Universitaire | **4** | Violet `#7C3AED` |
| Agropastorale | **3** | Vert `#16A34A` |
| Autre | **3** | Gris `#64748B` |
| **TOTAL** | **311** | |

### 9.5 — Répartition des oeuvres par niveau

| Niveau | Oeuvres | Description |
|--------|---------|-------------|
| Paroissial | **204** | Gérées par une paroisse |
| Régional | **63** | Gérées par une région synodale |
| District | **44** | Gérées par un district |
| **TOTAL** | **311** | |

---

## 10. Récapitulatif de toutes les commandes d'import

Voici l'ordre exact dans lequel les imports ont été exécutés et leur résultat :

### Étape 1 — Régions synodales
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend `
  python manage.py import_regions
```
**Résultat :** 22 régions créées avec leurs polygones géographiques (depuis le Shapefile)

### Étape 2 — Districts et Paroisses
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend `
  python manage.py import_paroisses
```
**Résultat :** 134 districts + 532 paroisses créées, 10 mises à jour, 23 ignorées (district vide)

### Étape 3 — Paroisses manquantes (correction)
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend `
  python manage.py import_paroisses_manquantes
```
**Résultat :** 3 nouveaux districts + 21 paroisses créées, 2 mises à jour
→ **Total final : 137 districts + 553 paroisses**

### Étape 4 — Types d'oeuvres (données fixes)
```powershell
docker compose run --rm backend python manage.py import_typeoeuvre
```
**Résultat :** 7 types créés (Scolaire, Universitaire, Médicale, Agropastorale, Immeuble, Terrain, Autre)

### Étape 5 — Oeuvres EEC (3 feuilles Excel)
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend `
  python manage.py import_oeuvres
```
**Résultat :** 311 oeuvres créées (63 régionales + 44 districts + 204 paroissiales)

### Étape 6 — Statistiques annuelles 2025
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend `
  python manage.py import_statistiques
```
**Résultat :** 545 lignes StatistiqueAnnuelle créées (communiants + non-communiants 2025)

### Commandes à exécuter encore

```powershell
# Pour voir les données dans l'admin Django, créer d'abord un super-utilisateur :
docker compose run --rm backend python manage.py createsuperuser
# Puis aller sur : http://localhost:8000/admin/

# Pour importer les grades et ouvriers (prochaine étape) :
# → commandes à créer : import_grades, import_ouvriers
```

---

## 11. Schéma global — comment tout s'articule

```
                        ┌─────────────────────────┐
                        │    Fichiers sources EEC  │
                        │  (sur ton disque dur)    │
                        │                          │
                        │  • Shapefile (.shp)      │
                        │  • Excel paroisses       │
                        │  • Excel oeuvres         │
                        │  • Excel ouvriers        │
                        └────────────┬─────────────┘
                                     │ Import via
                                     │ management commands
                                     │ Django
                                     ▼
┌────────────────────────────────────────────────────────────────┐
│                  PostgreSQL + PostGIS (eec_db)                  │
│                      localhost:5432                            │
│                                                                │
│   geo_regionsynodale → geo_district → geo_paroisse             │
│         ↓                                 ↓                    │
│   (polygones)                    (points GPS + stats)          │
│                                           ↓                    │
│                              accounts_statistiqueannuelle       │
│                                           ↓                    │
│                              oeuvres_oeuvre (311 oeuvres)      │
└───────────────────┬───────────────────────┬────────────────────┘
                    │                       │
          Lire les  │             Lire les  │
          polygones │             données   │
          pour la   │             pour      │
          carte     │             l'API     │
                    ▼                       ▼
          ┌─────────────┐         ┌──────────────────┐
          │  GeoServer  │         │   Django Backend  │
          │  Port:8080  │         │   Port:8000       │
          │             │         │                   │
          │ Sert les    │         │ Sert les APIs REST│
          │ tuiles WMS  │         │ JSON pour le      │
          │ (images de  │         │ frontend          │
          │  polygones) │         │                   │
          └──────┬──────┘         └────────┬──────────┘
                 │                         │
                 └────────────┬────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   Frontend Next.js    │
                  │   Port:3000           │
                  │                       │
                  │   Carte Leaflet avec  │
                  │   • Polygones régions │
                  │   • Points paroisses  │
                  │   • Points oeuvres    │
                  │   • Statistiques      │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Navigateur de Miguel  │
                  │  (Chrome, Firefox...) │
                  │                       │
                  │  http://localhost:3000│
                  └───────────────────────┘
```

---

## Questions / Réponses directes

**Q : La base de données est-elle sauvegardée si j'éteins mon ordinateur ?**  
R : Oui. Docker utilise des **volumes persistants** (`pg_data`). Les données survivent
aux redémarrages. Si tu fais `docker compose down` (sans `--volumes`), les données
restent. Seul `docker compose down -v` efface tout.

**Q : Est-ce que je peux accéder à ma base depuis phpMyAdmin ?**  
R : Non. phpMyAdmin est pour MySQL/MariaDB. Pour PostgreSQL, utilise **DBeaver**
(gratuit) ou **pgAdmin** (gratuit). Paramètres : host=localhost, port=5432,
db=eec_db, user=eec_user, mdp=EecDb@2026!SecurePass.

**Q : Les données spatiales sont stockées différemment des données normales ?**  
R : Non, tout est dans la même table. Une paroisse a ses colonnes texte (nom, adresse)
ET sa colonne géographique (position en WGS84) dans la **même ligne** de la table
`geo_paroisse`. PostGIS gère le stockage interne de façon optimisée (format WKB binaire).

**Q : GeoServer, on l'a utilisé ou pas encore ?**  
R : Il tourne (`http://localhost:8080/geoserver`) mais pas encore configuré avec
nos couches. La configuration GeoServer (créer les layers pour les régions/districts)
est prévue dans la phase de développement du frontend.

**Q : Pourquoi les tables `ouvriers_grade` et `ouvriers_ouvrier` sont vides ?**  
R : Ces tables ont été créées par les migrations Django (structure prête), mais les
données n'ont pas encore été importées. Le fichier OUVRIERS.xlsx contient des
données statistiques par paroisse (pas des individus structurés). C'est la prochaine
étape : définir comment importer les ouvriers individuels.

---

*Document généré le 24 mai 2026 — Projet EEC Géolocalisation*  
*Pour toute question : consulter les fichiers dans `docs/` ou relire ce fichier.*
