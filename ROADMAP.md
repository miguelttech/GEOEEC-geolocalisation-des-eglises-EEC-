# FEUILLE DE ROUTE — Plateforme EEC Géolocalisation
## Roadmap technique complète — Équipe de 6 développeurs

**Date de création :** 20 mai 2026  
**Échéance locale :** 01 juin 2026 (12 jours)  
**Déploiement production :** après validation locale  
**Chef de projet :** Miguel  
**Commanditaire :** Église Évangélique du Cameroun (EEC) — Direction Nationale

---

## ÉQUIPE ET RÔLES

| Membre | Rôle | Domaine principal | Branche Git |
|--------|------|-------------------|-------------|
| **Miguel** | Chef de projet + Lead Dev | Backend core, architecture, GeoServer, intégration, revue de code | `miguel/backend-core` |
| **Fred** | Développeur Backend | API REST, serializers, permissions, exports | `fred/backend-api` |
| **Igor** | Développeur Frontend | Structure Next.js, authentification frontend, routing | `igor/frontend-auth` |
| **Torres** | Développeur Frontend Carto | Carte Leaflet, intégration WMS/WFS GeoServer | `torres/frontend-map` |
| **Kuso** | Développeur Frontend UI | Composants shadcn/ui, dashboard statistiques, recherche | `kuso/frontend-ui` |
| **Fredy** | Développeur Frontend + Rédaction | Exports frontend, responsive, rapport d'analyse et conception | `fredy/rapport-exports` |

---

## RÈGLES GIT — NON NÉGOCIABLES

```
main          ← Production uniquement. PERSONNE ne push directement ici.
develop       ← Branche d'intégration. On merge ici après validation.
miguel/...    ← Branche personnelle Miguel
fred/...      ← Branche personnelle Fred
igor/...      ← Branche personnelle Igor
torres/...    ← Branche personnelle Torres
kuso/...      ← Branche personnelle Kuso
fredy/...     ← Branche personnelle Fredy
```

**Workflow :**
1. Chaque membre travaille sur SA branche uniquement
2. Quand une fonctionnalité est terminée → Pull Request vers `develop`
3. Miguel review et approuve toutes les PR
4. JAMAIS de push direct sur `main` ou `develop`
5. Commit message en français, format : `type(scope): description`
   - `feat(geo): modèle Paroisse avec champ PostGIS`
   - `fix(api): correction permission admin régional`
   - `docs(rapport): section analyse des données`

**Commande pour créer sa branche (chaque membre, une seule fois) :**
```bash
git checkout develop
git pull origin develop
git checkout -b prenom/nom-de-la-tache
git push -u origin prenom/nom-de-la-tache
```

---

## ÉTAT ACTUEL (Phase 0 — TERMINÉE ✅)

Infrastructure opérationnelle sur machine locale :
- Django 5.0.14 → `http://localhost:8000` ✅
- Next.js 16.2.6 → `http://localhost:3000` ✅
- GeoServer 2.26.2 → `http://localhost:8080/geoserver` ✅
- PostGIS 16-3.4 → port 5432 ✅
- Redis 7 → port 6379 ✅
- Modèle User avec 4 rôles RBAC ✅
- 19 migrations Django appliquées ✅

---

## FONCTIONNALITÉS OBLIGATOIRES À LIVRER (checklist finale)

Toutes ces fonctionnalités doivent fonctionner avant de déclarer "local OK" :

- [ ] Carte interactive Leaflet plein écran
- [ ] Affichage des 22 régions synodales (polygones colorés)
- [ ] Affichage des 134 districts
- [ ] Affichage des 693 paroisses (marqueurs cliquables)
- [ ] Affichage des œuvres (icônes par type : scolaire, médical, agropastoral)
- [ ] Popup au clic : informations complètes de chaque entité
- [ ] Légende dynamique (types d'icônes, couleurs)
- [ ] Zoom/dézoom, navigation carte
- [ ] Hiérarchie visuelle (taille d'icônes par niveau)
- [ ] Recherche multicritère (région, district, paroisse, type d'œuvre)
- [ ] Statistiques automatiques par région synodale (clic sur polygone)
- [ ] Authentification (login/logout) avec 4 niveaux de rôles
- [ ] Module admin : CRUD Paroisses, Districts, Œuvres, Ouvriers
- [ ] Import fichiers Excel (paroisses, ouvriers, œuvres)
- [ ] Export données (PDF et Excel)
- [ ] Journal d'audit (qui a modifié quoi, quand)
- [ ] Page d'accueil institutionnelle (logo EEC, présentation, carte)
- [ ] Interface responsive (mobile + desktop)
- [ ] Django Admin opérationnel pour super admin

---

## ROADMAP DÉTAILLÉE — 12 JOURS

---

### JOUR 1 — Audit des données + Configuration Git équipe
**Date :** 20 mai 2026  
**Objectif :** Comprendre exactement la structure des données sources avant de coder quoi que ce soit.

#### Tâche 1.1 — Audit des fichiers sources
**Responsable :** Miguel  
**Durée :** 3-4 heures  
**Fichiers concernés :** `backend/audit_data.py` (déjà créé)

**Commande à exécuter :**
```powershell
docker compose -f "d:/Academique/GEOEEC/docker-compose.yml" run --rm -v "d:/Academique/GEOEEC/data:/data" backend python audit_data.py > audit_resultat.txt 2>&1
```

**Ce qu'on cherche :**
- Colonnes exactes de chaque fichier Excel (noms, types, taux de remplissage)
- Les 22 noms de régions synodales dans le Shapefile
- Les valeurs possibles pour "type d'œuvre"
- Confirmation de l'inversion Coord_x (latitude) / Coord_y (longitude)
- Les 255 paroisses sans GPS identifiées

**Livrable :** Fichier `audit_resultat.txt` + Tableau de correspondance des noms de régions créé dans `docs/correspondance_regions.md`

#### Tâche 1.2 — Configuration Git pour tous les membres
**Responsable :** Miguel + chaque membre  
**Durée :** 1 heure  

**Miguel crée les branches et envoie les instructions à chaque membre :**
```bash
git checkout develop
git pull origin develop
# Créer toutes les branches
git checkout -b miguel/backend-core && git push -u origin miguel/backend-core
git checkout develop && git checkout -b fred/backend-api && git push -u origin fred/backend-api
git checkout develop && git checkout -b igor/frontend-auth && git push -u origin igor/frontend-auth
git checkout develop && git checkout -b torres/frontend-map && git push -u origin torres/frontend-map
git checkout develop && git checkout -b kuso/frontend-ui && git push -u origin kuso/frontend-ui
git checkout develop && git checkout -b fredy/rapport-exports && git push -u origin fredy/rapport-exports
```

**Chaque membre :**
1. Clone le repo : `git clone <url_repo>`
2. Se positionne sur sa branche : `git checkout prenom/sa-branche`
3. Lance Docker : `docker compose up -d`
4. Vérifie que les 5 services tournent : `docker compose ps`

#### Tâche 1.3 — Début rapport d'analyse et conception
**Responsable :** Fredy (+ Miguel pour les sections techniques)  
**Durée :** commence Jour 1, se termine en continu jusqu'au Jour 10  
**Note :** Miguel enverra la structure du rapport dès réception.

**En attendant la structure officielle, commencer avec :**
- Section "Contexte et présentation du projet"
- Section "Architecture technique choisie et justification"
- Section "Analyse des données sources" (basée sur l'audit Tâche 1.1)

---

### JOUR 2 — Conception des modèles Django
**Date :** 21 mai 2026  
**Objectif :** Concevoir la structure exacte de la base de données PostGIS à partir des résultats de l'audit.

#### Tâche 2.1 — Design des modèles (Miguel)
**Responsable :** Miguel  
**Durée :** 4-5 heures  
**Fichier à créer/modifier :** `backend/apps/geo/models.py`, `backend/apps/oeuvres/models.py`, `backend/apps/ouvriers/models.py`

**Modèles à créer :**

**`apps/geo/models.py` :**
```python
# RegionSynodale — les 22 régions
class RegionSynodale(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    nom_normalise = models.CharField(max_length=150)  # pour correspondance Excel
    geometrie = models.MultiPolygonField(srid=4326, null=True, blank=True)
    
# District — les 134 districts
class District(models.Model):
    nom = models.CharField(max_length=150)
    region = models.ForeignKey(RegionSynodale, on_delete=models.PROTECT, related_name='districts')
    
# Paroisse — les 693 paroisses
class Paroisse(models.Model):
    nom = models.CharField(max_length=200)
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name='paroisses')
    coordonnees = models.PointField(srid=4326, null=True, blank=True)
    has_gps = models.BooleanField(default=False)
    # ... autres champs selon l'audit
```

**`apps/oeuvres/models.py` :**
```python
class TypeOeuvre(models.TextChoices):
    SCOLAIRE = 'SCOLAIRE', 'Scolaire'
    MEDICAL = 'MEDICAL', 'Médical'
    AGROPASTORAL = 'AGROPASTORAL', 'Agropastoral'
    AUTRE = 'AUTRE', 'Autre'
    
class Oeuvre(models.Model):
    nom = models.CharField(max_length=200)
    type_oeuvre = models.CharField(max_length=20, choices=TypeOeuvre.choices)
    paroisse = models.ForeignKey('geo.Paroisse', on_delete=models.PROTECT)
    coordonnees = models.PointField(srid=4326, null=True, blank=True)
```

**ATTENTION CRITIQUE :** Les champs GPS seront définis APRÈS l'audit (Tâche 1.1). Ne pas deviner les noms de colonnes.

#### Tâche 2.2 — Migrations et vérification
**Responsable :** Miguel  
**Durée :** 1 heure  

```powershell
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py check
```

**Vérification dans Django Admin :** `http://localhost:8000/admin` → les nouvelles sections apparaissent.

#### Tâche 2.3 — Enregistrement dans Django Admin
**Responsable :** Fred  
**Durée :** 2 heures  
**Fichiers :** `backend/apps/geo/admin.py`, `backend/apps/oeuvres/admin.py`, `backend/apps/ouvriers/admin.py`

Enregistrer tous les modèles avec filtres et champs de recherche utiles.

---

### JOUR 3 — Import des données (Shapefile + Excel)
**Date :** 22 mai 2026  
**Objectif :** Toutes les données sources sont dans PostGIS. La base est remplie.

#### Tâche 3.1 — Import du Shapefile régions synodales
**Responsable :** Miguel  
**Durée :** 3-4 heures  
**Fichier à créer :** `backend/apps/geo/management/commands/import_regions.py`

```python
# Commande Django personnalisée
# Lance avec : docker compose run --rm backend python manage.py import_regions
```

**Étapes dans la commande :**
1. Lire le SHP avec `django.contrib.gis.gdal.DataSource`
2. Pour chaque polygone : créer/mettre à jour RegionSynodale
3. Utiliser la table de correspondance (docs/correspondance_regions.md)

**Test :** `python manage.py import_regions` → 22 régions créées en base.

#### Tâche 3.2 — Import Excel paroisses
**Responsable :** Miguel + Fred  
**Durée :** 4-5 heures  
**Fichier à créer :** `backend/apps/geo/management/commands/import_paroisses.py`

**Points critiques à gérer :**
- ⚠️ `Coord_x` = **latitude**, `Coord_y` = **longitude** → construire `Point(Coord_y, Coord_x, srid=4326)`
- 255 paroisses sans GPS → `coordonnees=None`, `has_gps=False`
- Correspondance région via table de correspondance
- Gestion des doublons (upsert, pas d'erreur si re-lancé)

**Test :** `python manage.py import_paroisses` → 693 paroisses créées, 438 avec GPS.

#### Tâche 3.3 — Import Excel ouvriers et œuvres
**Responsable :** Fred  
**Durée :** 3 heures  
**Fichiers :** `backend/apps/ouvriers/management/commands/import_ouvriers.py`, `backend/apps/oeuvres/management/commands/import_oeuvres.py`

**Test :** `python manage.py import_ouvriers` + `python manage.py import_oeuvres`

**Vérification finale Jour 3 :**
- Django Admin montre les 693 paroisses, 22 régions, 134 districts
- Filtrer par région → résultats corrects
- Vérifier quelques coordonnées GPS sur une carte mentale (Yaoundé ≈ 3.86°N, 11.52°E)

---

### JOUR 4 — Configuration GeoServer + Publication des couches
**Date :** 23 mai 2026  
**Objectif :** Les données PostGIS sont publiées comme couches WMS/WFS dans GeoServer. La carte peut s'afficher.

#### Tâche 4.1 — Création workspace et connexion PostGIS
**Responsable :** Miguel  
**Durée :** 2 heures  
**Interface :** `http://localhost:8080/geoserver/web` (admin / EecGeoSrv@2026!XmP9nK3rQwL7vB)

**Étapes dans GeoServer :**
1. Données → Espaces de travail → Ajouter un nouvel espace de travail
   - Nom : `eec`
   - URI : `http://eec-cameroun.org/geoserver/eec`
2. Données → Entrepôts → Ajouter un nouvel entrepôt → PostGIS
   - dbtype: postgis
   - host: db
   - port: 5432
   - database: eec_db
   - user: eec_user
   - passwd: (valeur du .env)
   - schema: public

#### Tâche 4.2 — Publication des couches
**Responsable :** Miguel  
**Durée :** 3 heures

**Couches à publier dans l'ordre :**
1. `eec:regions_synodales` ← table `geo_regionsynodale`
2. `eec:districts` ← table `geo_district`
3. `eec:paroisses` ← table `geo_paroisse` (avec filtre `has_gps=true` pour les marqueurs)
4. `eec:oeuvres_scolaires` ← filtre sur `type_oeuvre='SCOLAIRE'`
5. `eec:oeuvres_medicales` ← filtre sur `type_oeuvre='MEDICAL'`
6. `eec:oeuvres_agropastorales` ← filtre sur `type_oeuvre='AGROPASTORAL'`

**Pour chaque couche :** Configurer le SRS natif (EPSG:4326), calculer l'emprise.

#### Tâche 4.3 — Application des styles SLD
**Responsable :** Miguel  
**Durée :** 2 heures  
**Fichiers existants :** `infra/geoserver/styles/*.sld`

Uploader les fichiers SLD dans GeoServer (Données → Styles → Ajouter un style) et les associer aux couches.

**Couleurs EEC :** Vert `#16A34A`, Or `#EAB308`, Blanc `#FFFFFF`

**Test de validation :** URL WMS dans le navigateur doit retourner une image PNG :
```
http://localhost:8080/geoserver/eec/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=eec:paroisses&BBOX=8.5,1.6,16.2,13.1&WIDTH=800&HEIGHT=600&SRS=EPSG:4326&FORMAT=image/png
```

---

### JOURS 5-6 — API REST Backend
**Dates :** 24-25 mai 2026  
**Objectif :** API complète et testée. Tous les endpoints nécessaires au frontend sont disponibles.

#### Tâche 5.1 — Sérialiseurs DRF (Miguel + Fred)
**Responsable :** Miguel (géo + auth), Fred (oeuvres + ouvriers + exports)  
**Durée :** 4 heures chacun  
**Fichiers :** `backend/apps/*/serializers.py`

**Sérialiseurs à créer :**
```python
# GeoJSON pour Leaflet (utilise drf-gis)
class ParoisseGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Paroisse
        geo_field = 'coordonnees'
        fields = ['id', 'nom', 'district', 'has_gps', ...]

class RegionSynodaleSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = RegionSynodale
        geo_field = 'geometrie'
        fields = ['id', 'nom', 'nb_paroisses', 'nb_districts', ...]
```

#### Tâche 5.2 — Vues et URLs (Miguel + Fred)
**Responsable :** Miguel (architecture URL, viewsets complexes), Fred (CRUD standard)  
**Durée :** 5-6 heures  
**Fichiers :** `backend/apps/*/views.py`, `backend/eec_core/urls.py`

**Endpoints obligatoires :**
```
GET  /api/v1/geo/regions/                  → Liste 22 régions + géométries
GET  /api/v1/geo/regions/{id}/             → Détail région + statistiques
GET  /api/v1/geo/districts/                → Liste 134 districts
GET  /api/v1/geo/paroisses/                → Liste paroisses (filtrables)
GET  /api/v1/geo/paroisses/{id}/           → Détail paroisse
GET  /api/v1/geo/paroisses/geojson/        → GeoJSON pour Leaflet
GET  /api/v1/geo/regions/geojson/          → GeoJSON polygones
GET  /api/v1/oeuvres/                      → Liste œuvres (filtrables par type)
GET  /api/v1/oeuvres/geojson/              → GeoJSON œuvres
GET  /api/v1/ouvriers/                     → Liste ouvriers
GET  /api/v1/stats/region/{id}/            → Statistiques région synodale
GET  /api/v1/stats/global/                 → Statistiques globales
POST /api/v1/auth/login/                   → Authentification
POST /api/v1/auth/logout/                  → Déconnexion
GET  /api/v1/auth/me/                      → Profil utilisateur connecté
```

#### Tâche 5.3 — Permissions et RBAC (Miguel)
**Responsable :** Miguel  
**Durée :** 3 heures  
**Fichier :** `backend/apps/accounts/permissions.py`

```python
# Logique des permissions par rôle
class EstSuperAdmin(BasePermission): ...
class EstAdminRegional(BasePermission): ...
class EstAdminDistrict(BasePermission): ...
class EstAdminParoissial(BasePermission): ...
# Un admin régional ne voit que les données de sa région
# Un admin district ne voit que les données de son district
```

#### Tâche 5.4 — Tests API (Fred)
**Responsable :** Fred  
**Durée :** 3 heures  
**Outil :** Postman ou curl

Tester chaque endpoint :
- Sans authentification → 401 ou 403
- Avec chaque rôle → résultats corrects
- Filtres → résultats filtrés

---

### JOURS 5-7 — Frontend : Structure + Authentification (Parallèle)
**Dates :** 24-26 mai 2026 (en parallèle du backend)  
**Objectif :** Structure Next.js en place, authentification fonctionnelle.

#### Tâche F1 — Structure et routing Next.js (Igor)
**Responsable :** Igor  
**Durée :** 3-4 jours  
**Branche :** `igor/frontend-auth`

**Arborescence à créer dans `frontend/src/app/` :**
```
src/app/
├── page.tsx                  ← Page d'accueil (carte publique)
├── login/page.tsx            ← Page de connexion
├── admin/
│   ├── layout.tsx            ← Layout admin (menu latéral)
│   ├── page.tsx              ← Dashboard admin
│   ├── paroisses/page.tsx    ← Gestion paroisses
│   ├── oeuvres/page.tsx      ← Gestion œuvres
│   ├── ouvriers/page.tsx     ← Gestion ouvriers
│   ├── utilisateurs/page.tsx ← Gestion utilisateurs (SUPER uniquement)
│   └── imports/page.tsx      ← Import Excel
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
└── lib/
    ├── api.ts                ← Client API (fetch vers Django)
    └── auth.ts               ← Gestion session/cookies
```

**Page de connexion :** formulaire login → POST `/api/v1/auth/login/` → cookie session → redirection dashboard.

**Protection des routes :** middleware Next.js vérifie le cookie de session.

#### Tâche F2 — Carte Leaflet principale (Torres)
**Responsable :** Torres  
**Durée :** 4-5 jours  
**Branche :** `torres/frontend-map`  
**Librairies :** `react-leaflet`, `leaflet`

```bash
cd frontend && npm install react-leaflet leaflet @types/leaflet
```

**Ce que Torres doit implémenter :**

1. **Fond de carte OSM** (OpenStreetMap — gratuit, pas d'API key)
2. **Couche Régions Synodales** (WMS GeoServer — polygones)
3. **Couche Paroisses** (WFS GeoServer ou API Django — marqueurs verts)
4. **Couche Œuvres** (marqueurs colorés par type)
5. **Popup au clic** sur paroisse : nom, district, région, statistiques
6. **Popup au clic** sur région : nom, nb paroisses, nb districts, nb ouvriers
7. **Légende interactive** (types d'entités, couleurs)
8. **Contrôles de couches** (activer/désactiver chaque couche)

**Configuration Leaflet dans Next.js (attention côté serveur) :**
```tsx
// Toujours utiliser dynamic import pour Leaflet dans Next.js
const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false })
```

#### Tâche F3 — Composants UI et Dashboard (Kuso)
**Responsable :** Kuso  
**Durée :** 4-5 jours  
**Branche :** `kuso/frontend-ui`

**Installer shadcn/ui :**
```bash
cd frontend && npx shadcn@latest init
```

**Composants à créer :**
1. `StatCard` — carte statistique (nb paroisses, nb ouvriers, etc.)
2. `SearchBar` — barre de recherche multicritère (région, district, paroisse, type)
3. `RegionPanel` — panneau latéral avec stats de la région sélectionnée
4. `ParoisseList` — liste des paroisses avec filtres
5. `HierarchyBreadcrumb` — fil d'Ariane National > Région > District > Paroisse
6. Dashboard admin avec cartes statistiques globales

---

### JOUR 7 — Intégration Frontend ↔ Backend
**Date :** 26 mai 2026  
**Objectif :** Le frontend consomme l'API. La carte affiche les données réelles.

#### Tâche 7.1 — Client API (Igor + Torres + Kuso)
**Responsable :** Igor (coordination), Torres (appels carte), Kuso (appels stats)  
**Fichier :** `frontend/src/lib/api.ts`

```typescript
// Toutes les fonctions d'appel à l'API Django
export async function getRegions(): Promise<RegionGeoJSON> { ... }
export async function getParoisses(filters?: ParoisseFilters): Promise<ParoisseGeoJSON> { ... }
export async function getStatsRegion(regionId: number): Promise<RegionStats> { ... }
```

#### Tâche 7.2 — Connexion carte ↔ API (Torres)
Torres remplace les données mockées par les vrais appels API :
- Polygones régions ← `GET /api/v1/geo/regions/geojson/`
- Marqueurs paroisses ← `GET /api/v1/geo/paroisses/geojson/`
- Marqueurs œuvres ← `GET /api/v1/oeuvres/geojson/`

#### Tâche 7.3 — Recherche multicritère (Kuso)
- Barre de recherche filtre les paroisses en temps réel
- Filtres : région synodale, district, type d'œuvre, présence GPS
- Résultats mis en évidence sur la carte (zoom + highlight)

**Miguel** : Résoudre les problèmes CORS, d'authentification, et de format GeoJSON si nécessaires.

---

### JOURS 8-9 — Fonctionnalités admin + Imports/Exports
**Dates :** 27-28 mai 2026

#### Tâche 8.1 — Interface import Excel (Igor + Fred)
**Responsable :** Igor (frontend upload), Fred (backend endpoint)  
**Durée :** 3 heures chacun

**Backend (Fred) :**
```python
# endpoint POST /api/v1/imports/paroisses/ 
# Accepte un fichier .xlsx, lance l'import, retourne un rapport
```

**Frontend (Igor) :**
- Page `admin/imports/page.tsx`
- Formulaire upload fichier Excel
- Barre de progression
- Rapport d'import (X lignes importées, Y erreurs)

#### Tâche 8.2 — Export PDF et Excel (Fred + Fredy)
**Responsable :** Fred (backend), Fredy (frontend bouton export)  
**Durée :** 4 heures  
**Librairies :** `weasyprint` (PDF), `openpyxl` (Excel) — déjà installées

**Endpoints :**
```
GET /api/v1/exports/paroisses/excel/?region=5   → fichier .xlsx
GET /api/v1/exports/stats/pdf/?region=5         → fichier .pdf
```

#### Tâche 8.3 — Page d'accueil institutionnelle (Kuso + Igor)
**Responsable :** Kuso  
**Durée :** 3-4 heures

Selon le cahier des charges :
- En-tête : Logo EEC officiel
- Section présentation institutionnelle
- Photos membres Bureau National (à fournir par l'EEC)
- Carte dynamique au centre (composant Torres)
- Légende à droite
- Pied de page : mentions légales

#### Tâche 8.4 — Journal d'audit visible (Fred)
**Responsable :** Fred  
**Durée :** 2 heures

Interface dans admin pour voir : qui a modifié quoi et quand.  
`simple_history` est déjà installé — brancher aux modèles et créer la vue admin.

---

### JOUR 10 — Responsive Design + Finitions UI
**Date :** 29 mai 2026

#### Tâche 10.1 — Responsive mobile (Fredy + Kuso)
**Responsable :** Fredy (coordination), Kuso (composants)  
**Durée :** Full day

**Tester sur :**
- Desktop 1920×1080
- Tablette 768×1024
- Mobile 375×812 (iPhone SE)

**Points critiques :**
- La carte doit occuper tout l'écran mobile
- Les panneaux de stats passent en dessous en mobile
- La barre de recherche est accessible en mobile
- Le menu admin devient un menu hamburger

Tailwind CSS rend ça facile avec les classes `md:`, `lg:`, `sm:`.

#### Tâche 10.2 — Optimisation performance (Miguel)
**Responsable :** Miguel  
**Durée :** 3 heures

- Mise en cache Redis pour les endpoints `geojson/` (données rarement modifiées)
- Pagination sur les listes (déjà configurée à 50 résultats/page)
- GDAL simplification des géométries pour les polygones (moins de points = plus rapide)

---

### JOURS 11-12 — Tests complets + Corrections
**Dates :** 30-31 mai 2026  
**Objectif :** Tout fonctionne. Aucune fonctionnalité manquante.

#### Tâche 11.1 — Tests fonctionnels complets (TOUS)

**Scénario 1 — Visiteur anonyme :**
- Ouvre `http://localhost:3000` → page d'accueil s'affiche
- Carte chargée avec les régions synodales
- Clic sur région → popup avec statistiques
- Clic sur paroisse → popup avec détails
- Recherche "Bafoussam" → résultats pertinents
- Interface correcte sur mobile

**Scénario 2 — Super Admin :**
- Login → dashboard complet
- Voir toutes les paroisses, tous les districts
- Ajouter une paroisse → apparaît sur la carte
- Modifier les coordonnées → mis à jour sur la carte
- Importer un fichier Excel → rapport d'import OK
- Exporter PDF/Excel → fichiers téléchargés
- Voir les logs d'audit

**Scénario 3 — Admin Régional :**
- Login → voit uniquement sa région
- Ne peut pas accéder aux données des autres régions (403 Forbidden)

**Scénario 4 — Statistiques :**
- Clic sur Région Bamiléké → nb paroisses, nb ouvriers, nb œuvres affichés

#### Tâche 11.2 — Tests de sécurité (Miguel)
**Durée :** 3 heures

- Tenter d'accéder à `/api/v1/geo/paroisses/` sans login → 403
- Tenter un SQL injection dans la barre de recherche → bloqué (Django ORM protège)
- Tenter XSS dans les champs de formulaire → bloqué (Django échappe automatiquement)
- Vérifier que les cookies sont HttpOnly + SameSite=Strict

#### Tâche 11.3 — Corrections et PR finale (Miguel)
**Durée :** Full day

- Review toutes les PR en attente
- Merge `develop` après validation
- Fix des bugs bloquants trouvés en test

#### Tâche 11.4 — Finalisation rapport (Fredy)
**Durée :** Jour 11-12

Compléter toutes les sections manquantes du rapport d'analyse et conception.

---

### APRÈS JOUR 12 — Phase Déploiement (à planifier séparément)

Cette phase démarre une fois que **tout fonctionne localement et est validé** :

1. **Choix hébergement** — Serveur cloud (ex: VPS OVH, DigitalOcean, AWS EC2)
2. **Nom de domaine** — `geo.eec-cameroun.org` (ou équivalent choisi par l'EEC)
3. **Configuration Nginx** — reverse proxy devant Django + Next.js + GeoServer
4. **Certificat SSL** — Let's Encrypt (HTTPS obligatoire selon cahier des charges)
5. **Variables d'environnement production** — settings/prod.py, .env.prod
6. **docker compose** production adapté
7. **Migration des données** sur le serveur
8. **Tests de production** — performance, sécurité
9. **Formation des administrateurs** EEC (selon cahier des charges)
10. **Remise de la documentation**

---

## RÉCAPITULATIF — QUI FAIT QUOI

| Jour | Miguel | Fred | Igor | Torres | Kuso | Fredy |
|------|--------|------|------|--------|------|-------|
| J1 | Audit données + Git setup | Git setup | Git setup + doc | Git setup + doc | Git setup + doc | Git setup + début rapport |
| J2 | Modèles Django + migrations | Admin Django | Structure Next.js | Installation Leaflet | Installation shadcn/ui | Rapport §1-2 |
| J3 | Import SHP + Import Excel paroisses | Import ouvriers/œuvres | Pages routing | Fond de carte OSM | Composants StatCard | Rapport §3 |
| J4 | GeoServer workspace + couches + SLD | Test import + fix | Page login + auth | WMS couche régions | Composant SearchBar | Rapport §4 |
| J5 | Serializers GeoJSON + API Auth | Serializers CRUD | Middleware auth | WFS paroisses markers | Composant RegionPanel | Rapport §5 |
| J6 | Permissions RBAC + API Stats | API exports + imports | Protection routes | Couche œuvres + icônes | Dashboard stats | Rapport §6 |
| J7 | Intégration + CORS + fix bugs | Tests API Postman | Client API lib | Connexion carte↔API | Recherche multicritère | Rapport §7 |
| J8 | Code review + merge | Import Excel frontend+back | Interface admin CRUD | Popup détails enrichis | Page accueil instit. | Export frontend + rapport |
| J9 | Fix bugs intégration | Export PDF/Excel | Gestion utilisateurs | Légende dynamique | Fil d'Ariane hiérarchie | Rapport §8 |
| J10 | Optimisation cache Redis | Journal audit vue | Responsive mobile | Responsive carte | Responsive composants | Responsive + rapport §9 |
| J11 | Tests sécurité + code review | Fix bugs backend | Tests scénario 1-2 | Tests carte mobile | Tests UI | Rapport finalisation |
| J12 | Fix blockers + merge final | Fix bugs exports | Fix auth bugs | Fix carte bugs | Fix UI bugs | Rapport remise |

---

## CHECKLIST DE VALIDATION FINALE (Jour 12)

Avant de déclarer "local OK", cocher TOUS ces points :

### Backend
- [ ] `docker compose ps` → 5 services en `healthy`
- [ ] `http://localhost:8000/admin` → Django Admin fonctionnel
- [ ] `http://localhost:8000/api/v1/geo/regions/` → JSON avec 22 régions
- [ ] `http://localhost:8000/api/v1/geo/paroisses/` → JSON avec 693 paroisses
- [ ] `http://localhost:8000/api/v1/geo/paroisses/geojson/` → GeoJSON valide
- [ ] Import Excel → fonctionne sans erreur
- [ ] Export PDF → fichier téléchargeable
- [ ] Export Excel → fichier téléchargeable
- [ ] Permissions : admin régional ne voit pas les autres régions
- [ ] Logs d'audit présents

### GeoServer
- [ ] `http://localhost:8080/geoserver/web` → GeoServer accessible
- [ ] Workspace `eec` créé
- [ ] 6 couches publiées et actives
- [ ] URL WMS retourne une image PNG valide
- [ ] Styles SLD appliqués (couleurs EEC)

### Frontend
- [ ] `http://localhost:3000` → Page d'accueil chargée < 5 secondes
- [ ] Carte affichée avec fond OSM
- [ ] Polygones des régions synodales visibles
- [ ] Paroisses marquées sur la carte
- [ ] Œuvres marquées (couleurs par type)
- [ ] Clic région → popup avec statistiques
- [ ] Clic paroisse → popup avec détails
- [ ] Recherche fonctionnelle
- [ ] Login → dashboard admin
- [ ] Logout → retour page publique
- [ ] Responsive mobile OK
- [ ] Compatible Chrome, Firefox, Edge

### Rapport
- [ ] Rapport d'analyse et conception complet selon structure fournie
- [ ] Toutes les sections remplies
- [ ] Relu et validé par Miguel

---

## RISQUES IDENTIFIÉS ET MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Données Excel avec colonnes inattendues | Haute | Haut | Audit Jour 1 obligatoire avant tout code |
| GeoServer instable (problème volume Docker) | Moyenne | Haut | Recréer le volume si problème (procédure documentée) |
| Coordonnées inversées (Coord_x/Coord_y) | Certaine | Critique | Construire `Point(Coord_y, Coord_x)` — ne jamais oublier |
| 5 noms de régions incohérents SHP vs Excel | Certaine | Haut | Table de correspondance à créer Jour 1 |
| Conflit de merge entre branches | Moyenne | Moyen | Miguel review toutes les PR, jamais de merge sans review |
| Performance carte avec 693 points | Moyenne | Moyen | Clustering Leaflet + cache Redis GeoJSON |
| Next.js/Leaflet incompatibilité SSR | Haute | Moyen | Dynamic import avec `ssr: false` (obligatoire) |

---

## RESSOURCES TECHNIQUES DE RÉFÉRENCE

| Technologie | Documentation | Usage dans le projet |
|-------------|---------------|---------------------|
| Django 5 | docs.djangoproject.com | Backend core |
| GeoDjango | docs.djangoproject.com/en/5.0/ref/contrib/gis/ | Modèles spatiaux |
| DRF | django-rest-framework.org | API REST |
| drf-gis | github.com/openwisp/django-rest-framework-gis | Sérialisation GeoJSON |
| GeoServer | docs.geoserver.org | Publication couches |
| react-leaflet | react-leaflet.js.org | Carte interactive |
| shadcn/ui | ui.shadcn.com | Composants UI |
| Next.js 14 | nextjs.org/docs | Framework frontend |
| PostGIS | postgis.net/documentation/ | Base spatiale |

---

*Document confidentiel — Projet EEC Géolocalisation — Propriété exclusive de l'Église Évangélique du Cameroun*  
*Rédigé le 20 mai 2026 — Version 1.0*
