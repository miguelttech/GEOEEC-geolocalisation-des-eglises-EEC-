# Guide complet du Backend EEC Géolocalisation
## De l'import des données aux APIs visiteurs — explication détaillée

---

> **Pour qui est ce document ?**
> Ce guide est écrit pour quelqu'un qui commence en programmation.
> Chaque concept est expliqué simplement, sans jargon technique inutile.
> À la fin de ce document, tu comprendras exactement ce qu'on a fait, pourquoi,
> et ce qu'il reste à faire.

---

## Table des matières

1. [Vue d'ensemble : qu'est-ce qu'on a construit ?](#vue-densemble)
2. [Organigramme des fichiers créés](#organigramme)
3. [Concepts de base à comprendre](#concepts-de-base)
4. [Phase 1 — Les Modèles (la structure de la base de données)](#phase-1--les-modeles)
5. [Phase 2 — Les Imports (remplir la base de données)](#phase-2--les-imports)
   - [import_paroisses.py](#fichier-1--import_paroissespy)
   - [import_paroisses_manquantes.py](#fichier-2--import_paroisses_manquantespy)
   - [import_typeoeuvre.py](#fichier-3--import_typeoeuvrespy)
   - [import_oeuvres.py](#fichier-4--import_oeuvrespy)
   - [import_statistiques.py](#fichier-5--import_statistiquespy)
   - [import_grades.py](#fichier-6--import_gradespy)
   - [import_ouvriers.py](#fichier-7--import_ouvrierspy)
6. [Phase 3 — Les APIs REST (exposer les données)](#phase-3--les-apis-rest)
7. [Phase 4 — Authentification & RBAC](#phase-4--authentification--rbac)
8. [Phase 5 — Journal d'audit](#phase-5--journal-daudit)
9. [Phase 6 — Exports & Imports via API](#phase-6--exports--imports-via-api)
10. [Phase 7 — Visiteurs authentifiés](#phase-7--visiteurs-authentifies)
11. [Phase 8 — Analytics visiteurs](#phase-8--analytics-visiteurs)
12. [Résultats : ce qui est dans la base de données](#resultats)
13. [Les APIs disponibles : liste complète](#les-apis-disponibles)
14. [Plan de la Partie 2 — Le Frontend](#plan-partie-2)

---

## Vue d'ensemble

Imagine que tu construis une maison. Le backend est tout ce qui est **invisible mais indispensable** : fondations, plomberie, électricité. Voilà l'architecture complète qu'on a construite :

```
DONNÉES SOURCES                       POSTGRESQL / POSTGIS
(Excel, Shapefile)                    (base de données)
       │                                      │
       │  Scripts d'import (Python)           │
       └──────────────────────────────────────┤ ──►  553 paroisses
         import_paroisses.py                  │      137 districts
         import_oeuvres.py                    │      22 régions
         import_statistiques.py               │      311 oeuvres
         import_ouvriers.py                   │      685 ouvriers
                                              │      545 statistiques
                                              │
                                              │  6 apps Django
                                              │  ┌──────────────────────┐
                                              │  │ geo        (cartes)   │
                                              │  │ oeuvres               │
                                              │  │ accounts  (users+RBAC)│
                                              │  │ ouvriers              │
                                              │  │ audit     (journal)   │
                                              │  │ visitors  (public+auth)│
                                              │  └──────────────────────┘
                                              ▼
                                     APIs REST (Django DRF)
                                     /api/geo/             ← carte publique
                                     /api/auth/            ← connexion
                                     /api/exports/         ← téléchargements
                                     /api/imports/         ← uploads
                                     /api/visitor/         ← espace visiteur
                                     /api/analytics/       ← stats admin
                                              │
                                              ▼
                                     FRONTEND Next.js
                                     (carte Leaflet — en cours)
```

---

## Organigramme

Voici tous les fichiers créés, organisés par app :

```
backend/
│
├── apps/
│   │
│   ├── geo/                              ← Données géographiques
│   │   ├── management/commands/
│   │   │   ├── import_paroisses.py           Import principal des paroisses
│   │   │   ├── import_paroisses_manquantes.py Correction des 23 manquantes
│   │   │   └── setup_geoserver.py            Configuration GeoServer
│   │   ├── models.py                         RegionSynodale, District, Paroisse
│   │   ├── serializers.py                    Format GeoJSON des données géo
│   │   └── views.py                          Endpoints /api/geo/
│   │
│   ├── oeuvres/                          ← Oeuvres (écoles, hôpitaux, etc.)
│   │   ├── management/commands/
│   │   │   ├── import_typeoeuvre.py          Les 7 types d'oeuvres
│   │   │   └── import_oeuvres.py             Import des 311 oeuvres
│   │   ├── models.py                         TypeOeuvre, Oeuvre
│   │   ├── serializers.py                    Format GeoJSON des oeuvres
│   │   └── views.py                          Endpoints /api/oeuvres/
│   │
│   ├── accounts/                         ← Utilisateurs, stats, authentification
│   │   ├── management/commands/
│   │   │   └── import_statistiques.py        545 stats pour 2025
│   │   ├── models.py                         User (5 rôles), StatistiqueAnnuelle
│   │   ├── serializers.py                    UserSerializer, StatistiqueSerializer
│   │   ├── auth_views.py                     Login, logout, CRUD comptes, dashboard
│   │   ├── views.py                          StatistiqueAnnuelleViewSet
│   │   └── permissions.py                    can_manage_accounts, RBAC helpers
│   │
│   ├── ouvriers/                         ← Pasteurs, évangélistes, etc.
│   │   ├── management/commands/
│   │   │   ├── import_grades.py              Les 8 grades EEC
│   │   │   └── import_ouvriers.py            Import des 685 ouvriers
│   │   ├── models.py                         Grade, Ouvrier
│   │   ├── serializers.py                    Format de sortie API
│   │   └── views.py                          Endpoints /api/ouvriers/
│   │
│   ├── audit/                            ← Journal des actions admin  ★ NOUVEAU
│   │   ├── migrations/
│   │   ├── models.py                         LogActivite (8 types d'actions)
│   │   ├── views.py                          LogActiviteViewSet (lecture seule)
│   │   ├── admin.py                          Interface admin Django
│   │   └── utils.py                          log_action() — helper global
│   │
│   ├── exports/                          ← Exports & imports Excel/PDF  ★ NOUVEAU
│   │   └── views.py                          Export Excel/PDF, templates, imports
│   │
│   └── visitors/                         ← Visiteurs authentifiés  ★ NOUVEAU
│       ├── migrations/
│       ├── models.py                         5 modèles visiteur
│       ├── serializers.py                    5 serializers visiteur
│       ├── views.py                          11 endpoints visiteur
│       ├── analytics.py                      5 endpoints analytics admin
│       ├── permissions.py                    IsAuthentifiedUser, CanSeeAnalytics
│       ├── signals.py                        Auto-création ProfilVisiteur
│       ├── apps.py                           Signal connecté dans ready()
│       ├── admin.py                          Admin Django pour les 5 modèles
│       └── urls.py                           visitor_patterns + analytics_patterns
│
└── eec_core/
    ├── settings/
    │   └── base.py                           LOCAL_APPS + configuration
    └── urls.py                               Point d'entrée de toutes les URLs
```

---

## Concepts de base

### Qu'est-ce qu'une commande de gestion Django (management command) ?

C'est un **script Python qu'on exécute depuis le terminal** avec la commande :
```bash
python manage.py nom_de_la_commande
```
Dans notre cas, on a créé des commandes pour lire les fichiers Excel et remplir la base de données.

### Qu'est-ce qu'un Serializer ?

La base de données stocke les données dans son propre format binaire.
Le navigateur parle en **JSON** (texte simple lisible).
Le **serializer** est un traducteur : il convertit les objets Python en JSON.

```json
{
  "id": 1,
  "nom": "Paroisse de Ngui",
  "district_nom": "DSCHANG II",
  "position": {"type": "Point", "coordinates": [10.056, 5.444]}
}
```

### Qu'est-ce qu'une View / ViewSet ?

Une **view** est la logique qui s'exécute quand quelqu'un accède à une URL.
Le **ViewSet** gère automatiquement plusieurs URLs :
```
GET /api/geo/paroisses/      → list()     (retourne toutes les paroisses)
GET /api/geo/paroisses/5/    → retrieve() (retourne la paroisse n°5)
```

### Qu'est-ce que GeoJSON ?

C'est un format JSON spécial pour les données géographiques.
Leaflet.js (la carte) comprend nativement ce format.

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [10.056, 5.444]},
    "properties": {"nom": "Paroisse de Ngui", "district_nom": "DSCHANG II"}
  }]
}
```

### Qu'est-ce que le RBAC (contrôle d'accès par rôle) ?

RBAC = **Role-Based Access Control**. Chaque utilisateur a un rôle qui détermine ce qu'il peut voir et faire.
Dans notre système, il y a **5 rôles** distincts (voir Phase 4 ci-dessous).

### Qu'est-ce qu'un Signal Django ?

Un **signal** est un mécanisme qui permet d'exécuter du code automatiquement
quand un événement se produit. Par exemple, "après la création d'un User avec le rôle VISITEUR,
créer automatiquement son ProfilVisiteur".

---

## Phase 1 — Les Modèles

**Les modèles définissent la structure de la base de données.**
Un modèle Django = une table PostgreSQL.

Les migrations ont été générées et appliquées :
```bash
python manage.py makemigrations
python manage.py migrate
```

**Toutes les tables créées :**

| App | Table PostgreSQL | Modèle Django | Description |
|---|---|---|---|
| geo | `geo_regionsynodale` | RegionSynodale | 22 régions synodales avec polygones |
| geo | `geo_district` | District | 137 districts |
| geo | `geo_paroisse` | Paroisse | 553 paroisses |
| oeuvres | `oeuvres_typeoeuvre` | TypeOeuvre | 7 types d'oeuvres |
| oeuvres | `oeuvres_oeuvre` | Oeuvre | 311 oeuvres |
| accounts | `accounts_user` | User | Tous les utilisateurs (5 rôles) |
| accounts | `accounts_statistiqueannuelle` | StatistiqueAnnuelle | 545 statistiques |
| ouvriers | `ouvriers_grade` | Grade | 8 grades ecclésiastiques |
| ouvriers | `ouvriers_ouvrier` | Ouvrier | 685 ouvriers |
| audit | `audit_logactivite` | LogActivite | Journal de toutes les actions |
| visitors | `visitors_profilvisiteur` | ProfilVisiteur | Préférences des visiteurs |
| visitors | `visitors_paroissevu` | ParoisseVue | Consultations de paroisses |
| visitors | `visitors_recherchehistorique` | RechercheHistorique | Historique de recherche |
| visitors | `visitors_itinerairepersonnel` | ItinerairePersonnel | Itinéraires calculés |
| visitors | `visitors_paroisseenregistree` | ParoisseEnregistree | Favoris visiteurs |

---

## Phase 2 — Les Imports

---

### Fichier 1 — import_paroisses.py

**Chemin** : `backend/apps/geo/management/commands/import_paroisses.py`
**But** : Lire le fichier Excel des paroisses et remplir les tables `geo_regionsynodale`, `geo_district` et `geo_paroisse`

**Commande d'exécution** :
```bash
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend python manage.py import_paroisses
```

**Source de données** :
- Fichier : `Recap_paroisses_Projet_de_géolocalisation_26mai.xlsx`
- Feuille : **Feuil2** (la version nettoyée, pas Feuille1 qui a des doublons)
- 543 lignes valides

**Ce que le script fait étape par étape** :

```
1. Ouvre le fichier Excel                    → openpyxl.load_workbook()
2. Lit la feuille "Feuil2"                   → wb["Feuil2"]
3. Pour chaque ligne :
   a. Lit le nom de la région               → col 2
   b. Lit le nom du district               → col 3
   c. Lit le nom de la paroisse            → col 4
   d. Lit les coordonnées GPS              → col 11 (lat) et col 12 (lon)
   e. Corrige les noms de régions          → CORRECTIONS_REGIONS dict
   f. Cherche ou crée la région            → update_or_create()
   g. Cherche ou crée le district          → update_or_create()
   h. Cherche ou crée la paroisse          → update_or_create()
   i. Si GPS valide → crée un Point géo    → Point(lon, lat, srid=4326)
4. Affiche le bilan final
```

**Piège important** : dans le fichier Excel, les colonnes GPS sont **inversées** :
- Colonne 11 = "Coord_x" = en réalité la **LATITUDE**
- Colonne 12 = "Coord_y" = en réalité la **LONGITUDE**

```python
lat = float(row[11])  # Coord_x est en réalité la latitude
lon = float(row[12])  # Coord_y est en réalité la longitude
point = Point(lon, lat, srid=4326)  # Point(longitude, latitude)
```

**Résultat** :
- 22 régions synodales créées (avec leur géométrie shapefile)
- 134 districts créés
- 530 paroisses créées

---

### Fichier 2 — import_paroisses_manquantes.py

**Chemin** : `backend/apps/geo/management/commands/import_paroisses_manquantes.py`
**But** : Importer les 23 paroisses sautées parce que leur colonne "district" était vide dans l'Excel

**La solution** : Un dictionnaire de corrections écrit manuellement après recherche :
```python
CORRECTIONS = {
    "Bakap district de Bana": {
        "region": "HAUT-NKAM",
        "district": "BANA",       # le nom de la paroisse dit "district de Bana" !
        "confiance": "CERTAINE",
    },
    # ... 23 entrées au total
}
```

**Résultats** :
- 3 nouveaux districts créés (NGAOUNDAL, BANA, KAELE)
- 21 paroisses créées, 2 mises à jour
- **Total : 553 paroisses**

---

### Fichier 3 — import_typeoeuvre.py

**Chemin** : `backend/apps/oeuvres/management/commands/import_typeoeuvre.py`
**But** : Créer les 7 types d'oeuvres (données fixes, codées en dur)

| Nom | Icône | Couleur | Usage sur la carte |
|-----|-------|---------|-------------------|
| SCOLAIRE | school | #2563EB (bleu) | Écoles, lycées |
| UNIVERSITAIRE | graduation-cap | #7C3AED (violet) | Universités |
| MEDICALE | heart-pulse | #DC2626 (rouge) | Hôpitaux, dispensaires |
| AGROPASTORALE | sprout | #16A34A (vert) | Fermes, élevages |
| IMMEUBLE | building-2 | #D97706 (orange) | Bâtiments EEC |
| TERRAIN | map-pin | #78716C (gris) | Terrains EEC |
| AUTRE | circle-help | #64748B (gris clair) | Autres |

---

### Fichier 4 — import_oeuvres.py

**Chemin** : `backend/apps/oeuvres/management/commands/import_oeuvres.py`
**But** : Importer les 311 oeuvres depuis `Recap_oeuvres_EEC_2025.xlsx`

**3 feuilles Excel** :
1. `Oeuvres_regionales` — oeuvres d'une région entière
2. `Oeuvres_districts` — oeuvres d'un district
3. `Oeuvres_paroissialles` — oeuvres d'une paroisse

**Logique pivot** : une ligne Excel peut contenir plusieurs oeuvres de types différents.
Pour chaque ligne, le script lit chaque groupe de colonnes et crée une oeuvre si le nom n'est pas vide.

**Résultats** :
- 63 oeuvres régionales + 44 de districts + 204 paroissiales
- **Total : 311 oeuvres**

---

### Fichier 5 — import_statistiques.py

**Chemin** : `backend/apps/accounts/management/commands/import_statistiques.py`
**But** : Importer les statistiques annuelles 2025 (communiants, non-communiants)

**Logique de déduplication en deux passes** :
```
PASSE 1 : Pour chaque doublon → garder les valeurs avec le total le plus élevé
PASSE 2 : Insérer en base les meilleures valeurs
```

**Résultats** :
- 545 statistiques créées pour 2025
- Total communiants : **133 935**
- Total non-communiants : **49 535**
- **Total fidèles EEC 2025 : 183 470 personnes**

---

### Fichier 6 — import_grades.py

**Chemin** : `backend/apps/ouvriers/management/commands/import_grades.py`
**But** : Créer les 8 grades ecclésiastiques de l'EEC

| Niveau | Grade | Abréviation |
|--------|-------|-------------|
| 1 | Évêque | Év. |
| 2 | Pasteur | P. |
| 3 | Pasteur Proposant | P.P. |
| 4 | P.P. avec Délégation Pastorale | P.P.D.P. |
| 5 | Évangéliste | Ev. |
| 6 | Évangéliste avec Délégation Pastorale | Ev.D.P. |
| 7 | Délégué Pastoral | D.P. |
| 8 | Aide-Évangéliste | A.Ev. |

---

### Fichier 7 — import_ouvriers.py

**Chemin** : `backend/apps/ouvriers/management/commands/import_ouvriers.py`
**But** : Importer les 685 ouvriers depuis `OUVRIERS.xlsx`

**Problème : les grades sont du texte libre** (`"Pasteure"`, `"Rev"`, `"Ev/Dp"`, `"Licence en Théologie"`…).
**Solution** : la fonction `mapper_grade()` lit le texte et retourne le bon Grade.

**Résultats** :
- 685 ouvriers importés (296 Pasteurs, 206 Évangélistes, 43 Délégués Pastoraux)
- 129 sans grade reconnu (titres académiques dans la colonne grade)

---

## Phase 3 — Les APIs REST

Après les imports, on a exposé les données via une API REST. Une API REST est une **interface**
qui permet au frontend de récupérer les données via des URLs.

### Fonctionnement général

```
Frontend (Next.js)            Backend (Django)            Base de données
       │                              │                           │
       │  GET /api/geo/paroisses/     │                           │
       ├─────────────────────────────►│                           │
       │                              │  SELECT * FROM geo_paroisse│
       │                              ├──────────────────────────►│
       │                              │◄──────────────────────────│
       │                              │  [Serializer]             │
       │◄─────────────────────────────│                           │
       │  {GeoJSON retourné}          │                           │
```

### ViewSets créés

**`RegionSynodaleViewSet`** (`/api/geo/regions/`) :
- Retourne les 22 régions avec leurs polygones GeoJSON
- Compte automatiquement `nb_districts` et `nb_paroisses` via `.annotate()`
- Action `/liste` : régions sans géométrie (pour les menus déroulants)

**`DistrictViewSet`** (`/api/geo/districts/`) :
- Retourne les 137 districts
- Filtre `?region={id}` disponible

**`ParoisseViewSet`** (`/api/geo/paroisses/`) :
- Retourne les 553 paroisses en GeoJSON
- Filtres : `?district=`, `?region=`, `?search=`, `?avec_gps=1`

**`TypeOeuvreViewSet`** (`/api/oeuvres/types/`) :
- Retourne les 7 types avec couleur et icône

**`OeuvreViewSet`** (`/api/oeuvres/oeuvres/`) :
- Filtres : `?type=`, `?region=`, `?district=`, `?paroisse=`, `?avec_gps=1`

**`StatistiqueAnnuelleViewSet`** (`/api/statistiques/`) :
- Filtres : `?paroisse=`, `?district=`, `?region=`, `?annee=`
- Action `totaux` : `GET /api/statistiques/totaux/?annee=2025` → sommes agrégées

**`GradeViewSet`** + **`OuvrierViewSet`** (`/api/ouvriers/`) :
- Filtres ouvriers : `?grade=`, `?paroisse=`, `?district=`, `?region=`, `?search=`

**`LogActiviteViewSet`** (`/api/audit/journal/`) :
- Lecture seule, réservé aux Super Admin
- Retourne le journal de toutes les actions

---

## Phase 4 — Authentification & RBAC

### Pourquoi l'authentification ?

Avant d'ajouter l'authentification, n'importe qui pouvait lire toutes les APIs.
On a sécurisé l'accès en ajoutant un système de connexion basé sur les sessions Django
(cookies HttpOnly — le navigateur gère automatiquement la session).

### Le modèle User

Le modèle `User` (`backend/apps/accounts/models.py`) étend `AbstractUser` de Django.
On lui a ajouté un champ `role` avec **5 rôles possibles** :

```python
class User(AbstractUser):
    ROLES = [
        ("SUPER",    "Super Administrateur National"),
        ("REGION",   "Administrateur Régional"),
        ("DISTRICT", "Administrateur District"),
        ("PAROISSE", "Administrateur Paroissial"),
        ("VISITEUR", "Visiteur Authentifié"),       ← ajouté en Phase 7
    ]

    role                 = CharField(...)           # rôle de l'utilisateur
    region               = ForeignKey(RegionSynodale) # scope géographique
    district             = ForeignKey(District)
    paroisse             = ForeignKey(Paroisse)
    permissions_custom   = JSONField()              # permissions granulaires
    force_password_change = BooleanField()          # imposer changement au premier login
```

### Tableau des permissions par rôle

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR |
|--------|-------|--------|----------|----------|---------|
| Voir toutes les données géo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Importer paroisses | ✅ | ✅ (sa région) | ✅ (son district) | ❌ | ❌ |
| Importer oeuvres | ✅ | ✅ | ✅ | ❌ | ❌ |
| Importer ouvriers | ✅ | ✅ | ✅ | ✅ (sa paroisse) | ❌ |
| Exporter Excel/PDF | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gérer les comptes | ✅ | ✅ (sous lui) | ✅ (sous lui) | ❌ | ❌ |
| Voir le journal d'audit | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics visiteurs | ✅ | ✅ (sa région) | ❌ | ❌ | ❌ |
| Espace visiteur | ❌ | ❌ | ❌ | ❌ | ✅ |
| Carte publique | ✅ | ✅ | ✅ | ✅ | ✅ |

### Les endpoints d'authentification

**Fichier** : `backend/apps/accounts/auth_views.py`

```
GET  /api/auth/csrf/                  → Récupère le token CSRF (requis avant POST)
POST /api/auth/login/                 → Connexion (username ou email)
POST /api/auth/logout/                → Déconnexion
GET  /api/auth/me/                    → Utilisateur courant + scope
POST /api/auth/change-password/       → Changer son mot de passe
GET  /api/auth/dashboard-stats/       → Compteurs pour le tableau de bord
GET  /api/auth/users/                 → Liste des comptes (selon RBAC)
POST /api/auth/users/create/          → Créer un compte admin
GET/PATCH/DELETE /api/auth/users/{pk}/ → Détail / modifier / désactiver un compte
POST /api/auth/users/{pk}/toggle-active/ → Activer / désactiver un compte
POST /api/auth/users/{pk}/reset-password/ → Réinitialiser le mot de passe
```

**Comment fonctionne la connexion pas à pas** :

```
1. Le frontend récupère un token CSRF → GET /api/auth/csrf/
2. L'utilisateur saisit son email + mot de passe
3. Le frontend envoie POST /api/auth/login/ avec les credentials
4. Django authentifie (username OU email)
5. Django crée une session (stockée en base) et envoie un cookie sessionid au navigateur
6. Toutes les requêtes suivantes portent ce cookie → Django sait qui c'est
7. Le journal enregistre la connexion (voir Phase 5)
```

**Particularité : `force_password_change`**
Quand un admin crée un compte pour quelqu'un d'autre, ce flag est mis à `True`.
Le frontend redirige l'utilisateur vers la page "changement de mot de passe" au premier login.
Après changement, le flag passe à `False`.

**Particularité : `dashboard_stats` avec RBAC**
Cette vue retourne des compteurs différents selon le rôle :
- SUPER → compteurs nationaux (toutes les paroisses, tous les ouvriers…)
- REGION → compteurs de sa région seulement
- DISTRICT → compteurs de son district seulement
- PAROISSE → compteurs de sa paroisse seulement

---

## Phase 5 — Journal d'audit

### Pourquoi un journal d'audit ?

Le journal d'audit permet de savoir **qui a fait quoi et quand**.
C'est essentiel dans un système multi-admin : si une paroisse est supprimée par erreur,
on peut voir quel admin l'a fait, quand, depuis quelle adresse IP.

### Le modèle LogActivite

**Fichier** : `backend/apps/audit/models.py`

```python
class LogActivite(models.Model):
    ACTIONS = [
        ("LOGIN",  "Connexion"),
        ("LOGOUT", "Déconnexion"),
        ("CREATE", "Création"),
        ("UPDATE", "Modification"),
        ("DELETE", "Suppression"),
        ("IMPORT", "Import"),
        ("EXPORT", "Export"),
        ("VIEW",   "Consultation"),
    ]

    utilisateur  = ForeignKey(User)      # qui a fait l'action (null si compte supprimé)
    action       = CharField()           # type d'action (LOGIN, CREATE, etc.)
    type_objet   = CharField()           # sur quoi (paroisse, user, oeuvre, etc.)
    objet_id     = IntegerField()        # l'id de l'objet concerné
    objet_nom    = CharField()           # le nom de l'objet (pour lisibilité)
    description  = TextField()           # détail libre
    ip_address   = GenericIPAddressField() # adresse IP de l'utilisateur
    created_at   = DateTimeField()       # horodatage automatique
```

### Le helper log_action()

**Fichier** : `backend/apps/audit/utils.py`

Plutôt que de créer un `LogActivite` partout dans le code, on a un helper réutilisable :
```python
from apps.audit.utils import log_action

# Exemple d'utilisation dans n'importe quelle view
log_action(
    request,              # pour extraire l'utilisateur et l'IP automatiquement
    "CREATE",             # type d'action
    "paroisse",           # type d'objet
    objet_id=paroisse.id, # id de l'objet
    objet_nom=paroisse.nom,
    description="Paroisse créée via import Excel",
)
```

### Où log_action() est appelé

Le journal est alimenté automatiquement dans :
- `login_view` → action LOGIN à chaque connexion
- `logout_view` → action LOGOUT à chaque déconnexion
- `change_password` → action UPDATE
- `create_user`, `user_detail` → actions CREATE / UPDATE / DELETE
- `toggle_user_active`, `reset_user_password` → action UPDATE
- `export_paroisses_excel`, `export_oeuvres_excel`, etc. → action EXPORT
- `import_paroisses`, `import_oeuvres`, `import_ouvriers` → action IMPORT

### Accès au journal

```
GET /api/audit/journal/         → Liste paginée (Super Admin uniquement)
GET /api/audit/journal/{id}/    → Détail d'un log
```

---

## Phase 6 — Exports & Imports via API

### Pourquoi exports/imports via API ?

En plus des scripts d'import en ligne de commande (Phase 2),
on a créé des endpoints API pour que les admins puissent **depuis l'interface web** :
- **Télécharger** les données en Excel ou PDF
- **Uploader** un fichier Excel pour créer des données en masse

**Fichier** : `backend/apps/exports/views.py`

### Exports disponibles

**Export Excel paroisses** : `GET /api/exports/paroisses/excel/`
- Toutes les paroisses avec : ID, nom, district, région, GPS, téléphone, année création
- Styles EEC (vert foncé `#1B5E20`, lignes alternées, colonnes figées)
- Journal : enregistre qui a exporté et combien de lignes

**Export Excel oeuvres** : `GET /api/exports/oeuvres/excel/`
- Toutes les oeuvres avec type, niveau (régional/district/paroissial), GPS, capacité

**Export Excel statistiques** : `GET /api/exports/statistiques/excel/?annee=2025`
- Statistiques avec ligne de totaux automatique (formule Excel `=SUM(...)`)

**Export PDF statistiques** : `GET /api/exports/statistiques/pdf/?annee=2025`
- Rapport PDF A4 paysage généré avec WeasyPrint
- Style EEC (couleurs vertes, en-tête, tableau avec totaux)
- Retourne `501 Not Implemented` si WeasyPrint n'est pas installé sur le serveur

### Gabarits (templates vierges)

Avant de faire un import, l'admin doit télécharger le gabarit pour voir le format attendu :

```
GET /api/exports/templates/paroisses/   → gabarit_paroisses.xlsx
GET /api/exports/templates/oeuvres/     → gabarit_oeuvres.xlsx
GET /api/exports/templates/ouvriers/    → gabarit_ouvriers.xlsx
```

Chaque gabarit contient : une ligne d'en-tête stylisée + une ligne d'exemple + une note explicative.

### Imports via upload

```
POST /api/imports/paroisses/    → multipart/form-data, champ "file" (.xlsx)
POST /api/imports/oeuvres/
POST /api/imports/ouvriers/
```

**Comment fonctionne un import API** :

```
1. L'admin uploade un fichier .xlsx (champ "file" dans le formulaire)
2. Django lit le fichier avec openpyxl (sans le sauvegarder sur disque)
3. Pour chaque ligne :
   a. Valide les champs obligatoires
   b. Vérifie que l'admin a le droit d'agir sur cette zone (RBAC)
   c. Crée ou met à jour l'objet en base
   d. Enregistre les erreurs (ligne, message) sans s'arrêter
4. Retourne un bilan : créés, mis à jour, erreurs
5. Journal enregistre l'import
```

**Exemple de réponse** :
```json
{
  "created":      15,
  "updated":      3,
  "errors_count": 2,
  "errors": [
    {"ligne": 7,  "erreur": "District 'BAFANG II' introuvable"},
    {"ligne": 12, "erreur": "District hors de votre région"}
  ],
  "total_lignes": 20
}
```

**Validation GPS dans les imports** :
Les coordonnées GPS sont validées contre la bounding box du Cameroun :
```
Latitude  : 1.7° N  à 13.1° N
Longitude : 8.5° E  à 16.2° E
```
Toute coordonnée hors de cette zone est rejetée (protection contre les saisies erronées).

---

## Phase 7 — Visiteurs authentifiés

### Qu'est-ce qu'un visiteur authentifié ?

Jusqu'ici, la carte était **100% publique** : n'importe qui pouvait la voir sans se connecter.
On a ajouté un système d'**inscription volontaire** pour les utilisateurs ordinaires
(membres de l'EEC, visiteurs curieux) qui veulent des fonctionnalités supplémentaires.

Un visiteur authentifié est différent des admins :
- Il ne peut pas modifier les données
- Il n'a pas accès au tableau de bord admin
- Il a un espace personnel sur la carte : favoris, historique, itinéraires

Les **admins sur la carte** sont aussi traités comme des "authentifiés" — ils accèdent aux mêmes
fonctionnalités carte que les visiteurs (en plus de leurs droits admin dans le back-office).

### Les 5 modèles visiteurs

**Fichier** : `backend/apps/visitors/models.py`

---

**`ProfilVisiteur`** — préférences personnelles du visiteur
```python
class ProfilVisiteur(models.Model):
    utilisateur       = OneToOneField(User)        # lié à un seul User
    langue            = CharField(choices=["fr","en"]) # langue préférée
    paroisse_affiliee = ForeignKey(Paroisse)        # sa propre paroisse
    region_preferee   = ForeignKey(RegionSynodale)  # région favorite pour les filtres
    notifications_email = BooleanField()            # recevoir des emails ?
    created_at, updated_at                          # horodatages automatiques
```

Ce profil est **créé automatiquement** via un signal Django dès que l'utilisateur s'inscrit
(voir `visitors/signals.py`). L'utilisateur n'a rien à faire.

---

**`ParoisseVue`** — trace chaque consultation de paroisse
```python
class ParoisseVue(models.Model):
    utilisateur = ForeignKey(User)     # qui a consulté
    paroisse    = ForeignKey(Paroisse) # quelle paroisse
    vue_at      = DateTimeField()      # quand (automatique)
    # Index sur (paroisse, vue_at) pour accélérer les analytics
    # Index sur (utilisateur, vue_at) pour accélérer l'historique
```

Quand le visiteur ouvre la popup d'une paroisse sur la carte,
le frontend appelle `POST /api/visitor/paroisses/{pk}/vue/`.
Cette table sert aussi aux analytics (top paroisses, courbe d'activité).

---

**`RechercheHistorique`** — historique des recherches
```python
class RechercheHistorique(models.Model):
    utilisateur     = ForeignKey(User)
    query           = CharField()       # texte saisi ("paroisse centrale yaoundé")
    filtres         = JSONField()       # {"region": "LITTORAL", "type_oeuvre": "scolaire"}
    resultats_count = IntegerField()    # nombre de résultats trouvés
    created_at      = DateTimeField()   # automatique
```

Les filtres sont stockés en JSON — pratique car les filtres peuvent varier
(certaines recherches n'ont pas de région, d'autres non).
Cette table sert aux analytics "tendances de recherche".

---

**`ItinerairePersonnel`** — itinéraires calculés
```python
class ItinerairePersonnel(models.Model):
    utilisateur      = ForeignKey(User)
    depart_paroisse  = ForeignKey(Paroisse, null=True) # soit une paroisse...
    depart_lat       = FloatField(null=True)            # ...soit une position GPS
    depart_lng       = FloatField(null=True)
    arrivee_paroisse = ForeignKey(Paroisse)  # toujours une paroisse
    distance_km      = FloatField()          # distance calculée (Haversine)
    duree_minutes    = IntegerField()        # durée estimée (60 km/h moy.)
    created_at       = DateTimeField()       # automatique
```

Le départ peut être soit une paroisse (paroisse de départ connue),
soit une position GPS libre (géolocalisation du navigateur → "ma position actuelle").

---

**`ParoisseEnregistree`** — favoris du visiteur
```python
class ParoisseEnregistree(models.Model):
    utilisateur      = ForeignKey(User)
    paroisse         = ForeignKey(Paroisse)
    note_personnelle = TextField()          # note privée du visiteur
    enregistree_at   = DateTimeField()      # automatique
    # Contrainte : un visiteur ne peut enregistrer une paroisse qu'une seule fois
    unique_together = ("utilisateur", "paroisse")
```

---

### Le signal de création automatique

**Fichier** : `backend/apps/visitors/signals.py`

```python
@receiver(post_save, sender=User)
def create_profil_visiteur(sender, instance, created, **kwargs):
    if created and instance.role == "VISITEUR":
        ProfilVisiteur.objects.get_or_create(utilisateur=instance)
```

Ce signal s'exécute **automatiquement** après chaque création d'un User.
Si le User a le rôle VISITEUR → son ProfilVisiteur est créé instantanément.
Le signal est connecté dans `visitors/apps.py` via `ready()`.

---

### Les permissions visiteurs

**Fichier** : `backend/apps/visitors/permissions.py`

```python
class IsAuthentifiedUser(BasePermission):
    """Autorise les VISITEURS et tous les rôles admin.
    Usage : accès aux fonctionnalités carte pour les connectés."""
    def has_permission(self, request, view):
        return request.user.is_authenticated

class CanSeeAnalytics(BasePermission):
    """Réservé aux SUPER et REGION uniquement."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("SUPER", "REGION")

class IsOwnerOrAdmin(BasePermission):
    """Vérifie que l'objet appartient à l'utilisateur courant, ou que c'est un SUPER."""
    def has_object_permission(self, request, view, obj):
        return obj.utilisateur == request.user or request.user.role == "SUPER"
```

---

### Les 11 endpoints visiteurs

**Fichier** : `backend/apps/visitors/views.py`
**Préfixe** : `POST /api/visitor/`

**Inscription** :
```
POST /api/visitor/register/
Body: { "first_name", "last_name", "email", "password" }

→ Crée User(role="VISITEUR"), génère un username depuis le préfixe email,
  connecte immédiatement (login(request, user)),
  le signal crée ProfilVisiteur automatiquement.
```

**Profil** :
```
GET   /api/visitor/me/    → Profil complet (User + ProfilVisiteur)
PATCH /api/visitor/me/    → Modifier first_name, last_name, langue, paroisse_affiliee...
```

**Historique de recherche** :
```
GET    /api/visitor/history/        → 50 dernières recherches
DELETE /api/visitor/history/clear/  → Supprimer tout l'historique
```

**Paroisses consultées** :
```
POST /api/visitor/paroisses/{pk}/vue/   → Enregistrer une consultation
GET  /api/visitor/paroisses/recentes/   → 20 dernières paroisses distinctes consultées
```

**Paroisse la plus proche** :
```
GET /api/visitor/paroisses/plus-proche/?lat=3.8664&lng=11.5164
```
Utilise **PostGIS** `Distance()` pour un calcul spatial exact :
```python
point   = Point(lng, lat, srid=4326)
paroisse = Paroisse.objects.filter(position__isnull=False) \
           .annotate(distance=Distance("position", point)) \
           .order_by("distance").first()
distance_km = paroisse.distance.km  # Distance en km (PostGIS retourne en mètres)
```
Retourne : la paroisse la plus proche + la distance en km + la durée estimée.

**Favoris** :
```
GET    /api/visitor/favoris/        → Liste des paroisses enregistrées
POST   /api/visitor/favoris/        → Ajouter aux favoris
                                      Body: { "paroisse": <int>, "note_personnelle": "" }
DELETE /api/visitor/favoris/{pk}/   → Retirer des favoris (pk = id du favori)
```

**Itinéraires** :
```
GET  /api/visitor/itineraires/          → Historique des 20 derniers itinéraires
POST /api/visitor/itineraires/calculer/ → Calculer un itinéraire
     Body: {
       "arrivee_paroisse_id": 42,
       "depart_paroisse_id": 7,    ← OU depart_lat + depart_lng
       "depart_lat": 3.866,
       "depart_lng": 11.516,
     }
```

La distance est calculée par la **formule Haversine** (distance à vol d'oiseau) :
```python
def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0   # rayon de la Terre en km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
```
La durée est estimée à **60 km/h** (vitesse moyenne au Cameroun hors grandes villes).

---

## Phase 8 — Analytics visiteurs

### Pourquoi des analytics ?

Les Super Admin et Admin Régionaux ont besoin de **comprendre comment la carte est utilisée** :
- Quelles paroisses sont les plus consultées ?
- Combien de nouveaux visiteurs ce mois-ci ?
- Quelles recherches font les utilisateurs ?

**Fichier** : `backend/apps/visitors/analytics.py`
**Préfixe** : `/api/analytics/`
**Permission requise** : `CanSeeAnalytics` (SUPER ou REGION uniquement)

### Les 5 endpoints analytics

---

**Top paroisses** : `GET /api/analytics/paroisses/top/`

Query params optionnels : `?region=<id>&limit=10&periode=30`

- Compte les `ParoisseVue` groupées par paroisse sur la période (défaut : 30 jours)
- Les admins REGION voient automatiquement uniquement leur région
- Retourne : `[{paroisse_id, paroisse_nom, district, region, nb_vues}, ...]`

---

**Stats visiteurs** : `GET /api/analytics/visiteurs/stats/`

Retourne les compteurs globaux du mois courant :
```json
{
  "nb_inscrits_total":        1234,
  "nb_nouveaux_ce_mois":       45,
  "nb_actifs_ce_mois":        289,
  "nb_consultations_ce_mois": 3420,
  "nb_itineraires_ce_mois":   187,
  "nb_recherches_ce_mois":    956
}
```

"Actif ce mois" = un visiteur qui s'est connecté (`last_login`) dans les 30 derniers jours.

---

**Courbe d'activité** : `GET /api/analytics/activite/courbe/?jours=30`

Retourne une liste de points pour tracer un graphique journalier :
```json
[
  {"date": "2026-04-28", "nb_consultations": 45, "nb_recherches": 23, "nb_itineraires": 8},
  {"date": "2026-04-29", "nb_consultations": 67, "nb_recherches": 31, "nb_itineraires": 12},
  ...
]
```

Utilise `TruncDate()` de Django pour grouper les timestamps par jour.

---

**Stats itinéraires** : `GET /api/analytics/itineraires/stats/`

```json
{
  "nb_total": 450,
  "distance_moyenne_km": 23.4,
  "destinations_frequentes": [
    {"paroisse_id": 1, "paroisse_nom": "Paroisse Centrale Yaoundé",
     "region": "CENTRE", "nb_itineraires": 89},
    ...
  ]
}
```

---

**Tendances de recherche** : `GET /api/analytics/recherches/tendances/?periode=30`

```json
{
  "top_queries": [
    {"query": "paroisse centrale", "nb": 234},
    {"query": "yaoundé district", "nb": 178}
  ],
  "top_regions": [
    {"region": "CENTRE", "nb": 456},
    {"region": "LITTORAL", "nb": 312}
  ],
  "top_types": [
    {"type_oeuvre": "scolaire", "nb": 189}
  ]
}
```

Utilise des requêtes sur le champ JSON `filtres` via `values("filtres__region")`.

---

## Résultats

Après l'exécution de tous les scripts d'import, état actuel de la base de données :

| Table | Lignes | Description |
|-------|--------|-------------|
| `geo_regionsynodale` | **22** | 22 régions synodales avec polygones |
| `geo_district` | **137** | 137 districts |
| `geo_paroisse` | **553** | 553 paroisses (402 avec GPS, 151 sans) |
| `oeuvres_typeoeuvre` | **7** | 7 types d'oeuvres |
| `oeuvres_oeuvre` | **311** | 311 oeuvres (scolaires, médicales, etc.) |
| `accounts_user` | selon env | Admins + visiteurs |
| `accounts_statistiqueannuelle` | **545** | Stats 2025 : **183 470 fidèles** |
| `ouvriers_grade` | **8** | 8 grades ecclésiastiques |
| `ouvriers_ouvrier` | **685** | 685 ouvriers |
| `audit_logactivite` | croissant | Journal des actions |
| `visitors_*` | croissant | Profils, favoris, itinéraires, historique |

---

## Les APIs disponibles

### APIs publiques (sans connexion)
```
GET /api/geo/regions/
GET /api/geo/regions/{id}/
GET /api/geo/regions/liste/              ← sans géométrie (pour menus)
GET /api/geo/districts/
GET /api/geo/districts/?region={id}
GET /api/geo/paroisses/
GET /api/geo/paroisses/?avec_gps=1
GET /api/geo/paroisses/?district=5
GET /api/geo/paroisses/?search=NGUI
GET /api/geo/paroisses/{id}/
GET /api/oeuvres/types/
GET /api/oeuvres/oeuvres/
GET /api/oeuvres/oeuvres/?type=3
GET /api/statistiques/
GET /api/statistiques/totaux/?annee=2025
GET /api/ouvriers/grades/
GET /api/ouvriers/ouvriers/
GET /api/ouvriers/ouvriers/?search=TAKAM
```

### APIs d'authentification
```
GET  /api/auth/csrf/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/me/
POST /api/auth/change-password/
GET  /api/auth/dashboard-stats/
GET  /api/auth/users/
POST /api/auth/users/create/
GET/PATCH/DELETE /api/auth/users/{pk}/
POST /api/auth/users/{pk}/toggle-active/
POST /api/auth/users/{pk}/reset-password/
```

### APIs exports & imports
```
GET  /api/exports/paroisses/excel/
GET  /api/exports/oeuvres/excel/
GET  /api/exports/statistiques/excel/?annee=2025
GET  /api/exports/statistiques/pdf/?annee=2025
GET  /api/exports/templates/paroisses/
GET  /api/exports/templates/oeuvres/
GET  /api/exports/templates/ouvriers/
POST /api/imports/paroisses/             ← multipart/form-data, champ "file"
POST /api/imports/oeuvres/
POST /api/imports/ouvriers/
```

### APIs visiteurs authentifiés
```
POST /api/visitor/register/
GET  /api/visitor/me/
PATCH /api/visitor/me/
GET  /api/visitor/history/
DELETE /api/visitor/history/clear/
POST /api/visitor/paroisses/{pk}/vue/
GET  /api/visitor/paroisses/recentes/
GET  /api/visitor/paroisses/plus-proche/?lat=3.866&lng=11.516
GET  /api/visitor/favoris/
POST /api/visitor/favoris/
DELETE /api/visitor/favoris/{pk}/
GET  /api/visitor/itineraires/
POST /api/visitor/itineraires/calculer/
```

### APIs analytics (SUPER + REGION)
```
GET /api/analytics/paroisses/top/?periode=30&limit=10
GET /api/analytics/visiteurs/stats/
GET /api/analytics/activite/courbe/?jours=30
GET /api/analytics/itineraires/stats/
GET /api/analytics/recherches/tendances/?periode=30
```

### Audit & documentation
```
GET /api/audit/journal/               ← Super Admin uniquement
GET /api/schema/                      ← Schéma OpenAPI machine-readable
GET /api/schema/swagger/              ← Documentation interactive Swagger UI
GET /api/schema/redoc/                ← Documentation ReDoc
GET /admin/                           ← Interface d'administration Django
```

---

## Plan de la Partie 2

### État d'avancement général

| Phase | Description | État |
|-------|-------------|------|
| Phase 0 — Bootstrap | Docker, Django, Next.js, PostGIS | ✅ Fait |
| Phase 1 — Données | Modèles, imports Excel, 553 paroisses | ✅ Fait |
| Phase 2 — APIs géo | REST, serializers, ViewSets, GeoJSON | ✅ Fait |
| Phase 3 — Auth & RBAC | 5 rôles, session, permissions géographiques | ✅ Fait |
| Phase 4 — Audit | Journal d'activité, log_action() | ✅ Fait |
| Phase 5 — Exports/Imports | Excel, PDF, upload, gabarits | ✅ Fait |
| Phase 6 — Visiteurs | Inscription, favoris, itinéraires, historique | ✅ Fait |
| Phase 7 — Analytics | Top paroisses, courbe, tendances | ✅ Fait |
| Phase 8 — Frontend carte | Carte Leaflet publique | ✅ Fait (EECApp.tsx) |
| Phase 9 — Frontend auth | Login modal, espace visiteur, analytics page | 🔲 À faire |
| Phase 10 — GeoServer | Couches WMS, choroplèthe | 🔲 À faire |

### Ce qu'il reste à faire côté frontend

**Priorité 1 — Landing page & connexion visiteur**
- Page d'accueil avec présentation du projet et bouton "Se connecter / S'inscrire"
- Modal de connexion/inscription visible depuis la carte
- Affichage conditionnel des fonctionnalités selon l'état de connexion

**Priorité 2 — Expérience carte authentifiée**
- Bouton "Voir la paroisse la plus proche" (géolocalisation navigateur)
- Bouton "Ajouter aux favoris" dans les popups de paroisse
- Panneau latéral : onglets Favoris / Historique / Itinéraires
- Calculateur d'itinéraire intégré à la carte

**Priorité 3 — Page analytics admin**
- Tableaux de bord avec graphiques (recharts / chart.js)
- Courbe d'activité, top paroisses, stats visiteurs
- Accessible uniquement pour SUPER et REGION

**Comment Leaflet utilisera nos APIs :**
```javascript
// Exemple : charger les paroisses GPS sur la carte
const response = await fetch('/api/geo/paroisses/?avec_gps=1');
const data = await response.json();
const geojsonLayer = L.geoJSON(data.results);
geojsonLayer.addTo(map);

// Exemple : trouver la paroisse la plus proche
navigator.geolocation.getCurrentPosition(async (pos) => {
  const { latitude: lat, longitude: lng } = pos.coords;
  const res = await fetch(`/api/visitor/paroisses/plus-proche/?lat=${lat}&lng=${lng}`);
  const { paroisse, distance_km } = await res.json();
  // Afficher un marker sur la carte et ouvrir le popup
});
```

---

*Document mis à jour le 27 mai 2026 — EEC Géolocalisation v2.0*
*Backend complet : 8 apps Django, 35+ endpoints REST, authentification RBAC, visiteurs authentifiés, analytics*
