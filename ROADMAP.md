# FEUILLE DE ROUTE — Plateforme EEC Géolocalisation
## Roadmap technique complète — Équipe de 6 développeurs

**Date de création :** 21 mai 2026 (v2 — intégration fonctionnalités complètes)
**Échéance locale :** 01 juin 2026 (12 jours ouvrables)
**Déploiement production :** phase distincte après validation locale
**Chef de projet et Lead Dev :** Miguel
**Commanditaire :** Église Évangélique du Cameroun (EEC) — Direction Nationale

> **Objectif de cette feuille de route :** Que chaque membre de l'équipe sache exactement ce qu'il doit faire, quand, comment, et pourquoi. Miguel pilote tout, intervient partout, et prend en charge toutes les tâches critiques et délicates. Aucune fonctionnalité ne doit manquer à la fin des 12 jours.

---

## 1. ÉQUIPE ET RÔLES

| Membre | Rôle dans le projet | Branche Git personnelle |
|--------|---------------------|------------------------|
| **Miguel** | Chef de projet, Lead Dev backend, architecture, GeoServer, sécurité, intégration, revue de code de TOUT le monde | `miguel/backend-core` |
| **Fred** | Développeur backend — API REST, serializers, exports, tests API | `fred/backend-api` |
| **Igor** | Développeur frontend — structure Next.js, authentification, routing, pages admin CRUD | `igor/frontend-auth` |
| **Torres** | Développeur frontend carte — Leaflet, WMS/WFS GeoServer, popups, légende | `torres/frontend-map` |
| **Kuso** | Développeur frontend UI — shadcn/ui, dashboard statistiques, recherche, landing page | `kuso/frontend-ui` |
| **Fredy** | Développeur frontend + rédaction — exports UI, responsive, rapport d'analyse et conception | `fredy/rapport-exports` |

---

## 2. RÈGLES GIT — NON NÉGOCIABLES

```
main       ← JAMAIS de push direct. Production uniquement (fin de projet).
develop    ← Branche d'intégration. On merge ici seulement après PR validée par Miguel.
miguel/backend-core    ← Branche exclusive de Miguel
fred/backend-api       ← Branche exclusive de Fred
igor/frontend-auth     ← Branche exclusive d'Igor
torres/frontend-map    ← Branche exclusive de Torres
kuso/frontend-ui       ← Branche exclusive de Kuso
fredy/rapport-exports  ← Branche exclusive de Fredy
```

**Workflow pour chaque membre :**
```bash
# 1. Se positionner sur sa branche (UNE SEULE FOIS au démarrage)
git checkout develop && git pull origin develop
git checkout -b prenom/sa-branche
git push -u origin prenom/sa-branche

# 2. Travailler → commiter régulièrement
git add fichier_modifie.py
git commit -m "feat(geo): modèle Paroisse avec champ PostGIS"
git push origin prenom/sa-branche

# 3. Quand une fonctionnalité est terminée → Pull Request vers develop (via GitHub)
# Miguel review + approuve + merge
```

**Format des commits :**
```
feat(geo): modèle RegionSynodale avec MultiPolygonField
fix(import): correction inversion Coord_x/Coord_y paroisses
feat(api): endpoint statistiques avancées top-10 paroisses
fix(map): WMS GeoServer ne chargeait pas sans ssr:false
docs(rapport): section 3 analyse des données sources
```

---

## 3. ÉTAT ACTUEL — PHASE 0 TERMINÉE ✅

Infrastructure opérationnelle :
- **Django 5.0.14** → `http://localhost:8000` ✅
- **Next.js 16.2.6** → `http://localhost:3000` ✅
- **GeoServer 2.26.2** → `http://localhost:8080/geoserver` ✅
- **PostGIS 16-3.4** → port 5432 ✅
- **Redis 7** → port 6379 ✅
- Modèle User avec 4 rôles RBAC créé ✅
- 19 migrations Django appliquées ✅
- Super admin Django créé ✅

**Commande de démarrage :**
```powershell
cd "d:\Academique\GEOEEC"
docker compose up -d
docker compose ps   # 5 services doivent être healthy
```

---

## 4. FONCTIONNALITÉS COMPLÈTES À LIVRER

Toutes ces fonctionnalités doivent fonctionner localement à J12 :

### 4.1 Carte publique (visiteur sans compte)
- [ ] Fond de carte OSM
- [ ] Couche WMS : 22 régions synodales (polygones vert EEC)
- [ ] Couche WFS : 693 paroisses (marqueurs verts, clustering)
- [ ] Couche WFS : œuvres (marqueurs colorés par type : scolaire, médical, agropastoral, universitaire, immeuble, terrain, autre)
- [ ] Couche WFS : zones d'influence (polygones semi-transparents)
- [ ] Couche WFS : itinéraires (lignes entre paroisses)
- [ ] Popup paroisse : nom, district, région, communiants, non-communiants, ouvriers rattachés
- [ ] Popup œuvre : nom, type, niveau, statut, capacité, date inauguration
- [ ] Popup ouvrier : nom, grade, statut, paroisse
- [ ] Légende dynamique (types et couleurs)
- [ ] Contrôle de couches (activer/désactiver chaque couche)
- [ ] Filtres multicritères (région, district, type œuvre, niveau paroisse)
- [ ] Recherche par nom (paroisse, district, région)
- [ ] Statistiques au clic sur région
- [ ] Fil d'Ariane : National > Région > District > Paroisse
- [ ] Responsive mobile et tablette

### 4.2 Page d'accueil institutionnelle
- [ ] Logo EEC officiel
- [ ] Hero avec présentation
- [ ] Section Bureau National (photos Président, VP, Secrétaires, Trésorier)
- [ ] Statistiques globales (nb régions, districts, paroisses, ouvriers)
- [ ] Carte dynamique intégrée
- [ ] Footer mentions légales

### 4.3 Espace administrateur
- [ ] Page de connexion admin
- [ ] Middleware de protection des routes
- [ ] Dashboard : stats globales, Top 10 paroisses, alertes (sans GPS)
- [ ] CRUD Paroisses (avec carte pour saisie GPS)
- [ ] CRUD Districts
- [ ] CRUD Œuvres (tous les 7 types)
- [ ] CRUD Ouvriers (avec grades)
- [ ] Zones d'influence (créer, modifier, visualiser)
- [ ] Itinéraires entre paroisses
- [ ] Statistiques annuelles par paroisse (baptêmes, mariages, décès, offrandes…)
- [ ] Top 10 + Scores de performance régions
- [ ] Import Excel : paroisses, ouvriers, œuvres
- [ ] Export Excel filtré : paroisses, ouvriers, œuvres
- [ ] Export PDF : fiche paroisse, rapport statistique région
- [ ] Gestion utilisateurs admins (SUPER uniquement)
- [ ] Journal d'audit (SUPER uniquement)
- [ ] Django Admin opérationnel

### 4.4 Backend
- [ ] 14 modèles Django créés et migrés
- [ ] Imports de toutes les données sources
- [ ] Tous les endpoints API documentés sur `/api/docs/`
- [ ] Permissions RBAC fonctionnelles (filtrage par périmètre)
- [ ] Audit trail automatique (LogActivite + HistoriquePosition)
- [ ] GeoServer : 8 couches publiées avec styles SLD EEC
- [ ] Couverture tests ≥ 70%
- [ ] 2FA TOTP actif pour SUPER et REGION

### 4.5 Rapport d'analyse et conception
- [ ] Toutes les sections complétées par Fredy
- [ ] Relu et validé par Miguel
- [ ] Prêt pour remise à l'EEC

---

## 5. ROADMAP DÉTAILLÉE — 12 JOURS

---

### JOUR 1 — 21 mai 2026 : Audit + Setup Git équipe

**Objectif du jour :** Comprendre exactement la structure des données sources avant de toucher au code. Mettre l'équipe sur les rails.

---

#### J1-M1 — Audit complet des fichiers sources (Miguel)
**Durée :** 3-4 heures | **Branche :** `miguel/backend-core`

C'est la tâche la plus critique du jour. Avant de créer un seul modèle Django, Miguel doit savoir exactement ce que contiennent les fichiers Excel et le Shapefile. Le script `backend/audit_data.py` est déjà créé.

**Commande :**
```powershell
docker compose run --rm `
  -v "d:/Academique/GEOEEC/data:/data" `
  backend python audit_data.py 2>&1 | Tee-Object -FilePath "audit_resultat.txt"
```

**Ce qu'on cherche dans les résultats :**
- Noms exacts des colonnes Excel (paroisses, ouvriers, œuvres)
- Types de données de chaque colonne
- Taux de remplissage (combien de lignes ont une valeur)
- Les 22 noms de régions dans le Shapefile (avec leurs attributs exacts)
- Les valeurs possibles pour les grades d'ouvriers
- Les types d'œuvres réellement présents dans les données
- Confirmation de l'inversion Coord_x (latitude) / Coord_y (longitude)
- Identification des 255 paroisses sans GPS

**Livrable :** `audit_resultat.txt` à la racine + `docs/colonnes_excel.md` (tableau des colonnes confirmées)

---

#### J1-M2 — Création branches Git pour toute l'équipe (Miguel)
**Durée :** 1 heure | **Branche :** `develop`

```powershell
cd "d:\Academique\GEOEEC"
git checkout develop && git pull origin develop

# Créer et pousser chaque branche
git checkout -b miguel/backend-core
git push -u origin miguel/backend-core
git checkout develop

git checkout -b fred/backend-api
git push -u origin fred/backend-api
git checkout develop

git checkout -b igor/frontend-auth
git push -u origin igor/frontend-auth
git checkout develop

git checkout -b torres/frontend-map
git push -u origin torres/frontend-map
git checkout develop

git checkout -b kuso/frontend-ui
git push -u origin kuso/frontend-ui
git checkout develop

git checkout -b fredy/rapport-exports
git push -u origin fredy/rapport-exports
git checkout miguel/backend-core
```

**Ensuite :** Envoyer à chaque membre son URL de branche + la commande pour cloner :
```bash
git clone <url_repo>
git checkout prenom/sa-branche
docker compose up -d
docker compose ps   # vérifier 5 services
```

---

#### J1-M3 — Copie des assets Bureau National (Miguel)
**Durée :** 30 minutes | **Branche :** `miguel/backend-core`

Récupérer les photos de l'ancienne version :
```powershell
# Créer le dossier destination
New-Item -ItemType Directory -Force "d:\Academique\GEOEEC\frontend\public\bureau_national"

# Copier les photos depuis l'ancienne version
$source = "d:\Academique\geoeec_ancienne_version\PFE\geoeec-platform\public"
$dest = "d:\Academique\GEOEEC\frontend\public"

Copy-Item "$source\logoEEC.png" "$dest\"
Copy-Item "$source\cameroon-outline.svg" "$dest\"
Copy-Item "$source\president.png" "$dest\bureau_national\"
Copy-Item "$source\vp.png" "$dest\bureau_national\"
Copy-Item "$source\vp2.png" "$dest\bureau_national\"
Copy-Item "$source\vp3.png" "$dest\bureau_national\"
Copy-Item "$source\se.png" "$dest\bureau_national\"
Copy-Item "$source\se2.png" "$dest\bureau_national\"
Copy-Item "$source\se3.png" "$dest\bureau_national\"
Copy-Item "$source\se4.png" "$dest\bureau_national\"
Copy-Item "$source\tre.png" "$dest\bureau_national\"
```

---

#### J1-F1 — Lecture du projet + Setup Django Admin (Fred)
**Durée :** 2-3 heures | **Branche :** `fred/backend-api`

Fred doit commencer par lire :
1. Ce fichier ROADMAP jusqu'au bout
2. `MASTER_PROMPT_Antigravity_EEC_v3.md` (contexte complet)
3. `docs/ANALYSE_ANCIENNE_VERSION.md` (fonctionnalités à reproduire)
4. Les fichiers existants : `backend/apps/accounts/models.py`, `backend/eec_core/settings/base.py`

Ensuite, enregistrer le modèle User dans l'admin :
```python
# backend/apps/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Rôle EEC', {'fields': ('role', 'region', 'district', 'paroisse')}),
    )
```

---

#### J1-FREDY — Début rapport d'analyse et conception (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

Fredy commence la rédaction du rapport. Miguel enverra la structure officielle dès qu'elle est disponible.

**En attendant, commencer ces sections :**
1. **Page de garde** : Titre, auteurs, date, établissement, commanditaire (EEC)
2. **Résumé exécutif** : 1 page sur le projet, ses objectifs, son importance
3. **Contexte et présentation** : Qui est l'EEC ? Pourquoi cette plateforme ? Qui l'utilisera ?
4. **Problématique** : Quelle est la situation actuelle sans cette plateforme ?
5. **Objectifs** : Quels problèmes on résout

**Ressources à consulter :** Le Master Prompt v3 (section 2), le cahier des charges dans `docs/`

---

#### J1-IGOR, TORRES, KUSO — Setup environnement + Lecture (Igor, Torres, Kuso)
**Durée :** Full day | **Chacun sur sa branche**

Chacun doit faire EXACTEMENT ceci :
1. Cloner le repo et basculer sur sa branche
2. Lancer `docker compose up -d` et vérifier les 5 services
3. Lire entièrement ce ROADMAP
4. Lire le Master Prompt v3
5. Lire `docs/ANALYSE_ANCIENNE_VERSION.md`

**Igor :** Commencer à réfléchir à la structure des pages Next.js (admin layout)
**Torres :** Installer les librairies Leaflet et tester un exemple basique de carte
**Kuso :** Installer shadcn/ui dans le frontend

```bash
# Torres — installation Leaflet
cd frontend
npm install react-leaflet leaflet @types/leaflet leaflet.markercluster @types/leaflet.markercluster

# Kuso — installation shadcn/ui
cd frontend
npx shadcn@latest init
# Répondre : TypeScript, style Default, base color Slate, CSS variables Yes
```

---

### JOUR 2 — 22 mai 2026 : Modèles Django + Migrations

**Objectif du jour :** Tous les modèles Django créés et migrés. La structure de base de données est définitive.

---

#### J2-M1 — Création de tous les modèles Django (Miguel)
**Durée :** 5-6 heures | **Branche :** `miguel/backend-core`

Miguel crée les modèles en se basant sur l'audit du Jour 1 et le Master Prompt v3 (section 7.2).

**Fichiers à créer/modifier :**

`backend/apps/geo/models.py` → RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire

`backend/apps/ouvriers/models.py` → Grade, Ouvrier

`backend/apps/oeuvres/models.py` → TypeOeuvre, Oeuvre

`backend/apps/statistiques/models.py` → StatistiqueAnnuelle

`backend/apps/audit/models.py` → LogActivite, HistoriquePosition

> **⚠️ IMPORTANT :** Les champs GPS de Paroisse et Ouvrier sont confirmés APRÈS l'audit J1. Ne jamais inventer les noms des colonnes Excel.

**Après création de chaque fichier :**
```powershell
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py check
```

**Créer aussi l'app `statistiques` qui n'existe pas encore :**
```powershell
docker compose run --rm backend python manage.py startapp statistiques apps/statistiques
```

---

#### J2-M2 — Signals d'audit automatique (Miguel)
**Durée :** 2 heures | **Branche :** `miguel/backend-core`

Brancher les signals Django pour créer automatiquement un `LogActivite` à chaque écriture :

```python
# backend/apps/audit/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import LogActivite

def log_action(sender, instance, created, **kwargs):
    LogActivite.objects.create(
        action='CREATE' if created else 'UPDATE',
        modele=sender.__name__,
        objet_id=instance.pk,
    )
```

Signal `HistoriquePosition` : déclenché quand les coordonnées d'une Paroisse changent.

---

#### J2-F1 — Enregistrement admin Django pour tous les modèles (Fred)
**Durée :** 4 heures | **Branche :** `fred/backend-api`

Après que Miguel a créé les modèles, Fred les enregistre tous dans Django Admin avec des options utiles :

```python
# backend/apps/geo/admin.py
from django.contrib.gis.admin import GISModelAdmin
from .models import RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire

@admin.register(Paroisse)
class ParoisseAdmin(GISModelAdmin):
    list_display = ['nom', 'district', 'niveau', 'has_gps', 'communiants']
    list_filter = ['district__region', 'district', 'niveau', 'has_gps']
    search_fields = ['nom', 'quartier']
    gis_widget_kwargs = {'attrs': {'default_zoom': 6, 'default_lat': 4.0, 'default_lon': 12.0}}
```

Faire pareil pour : RegionSynodale, District, ZoneInfluence, Itineraire, Grade, Ouvrier, TypeOeuvre, Oeuvre, StatistiqueAnnuelle, LogActivite, HistoriquePosition.

---

#### J2-IGOR — Structure Next.js + Layout admin (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

Créer l'arborescence complète des pages :

```
frontend/src/app/
├── layout.tsx              ← Layout racine (Inter font, lang="fr")
├── page.tsx                ← Page d'accueil publique (accueil)
├── login/
│   └── page.tsx            ← Page de connexion
└── admin/
    ├── layout.tsx          ← Layout admin (sidebar + topbar)
    ├── page.tsx            ← Dashboard admin
    ├── paroisses/
    │   ├── page.tsx        ← Liste paroisses
    │   └── [id]/page.tsx   ← Détail/édition paroisse
    ├── districts/page.tsx
    ├── oeuvres/page.tsx
    ├── ouvriers/page.tsx
    ├── statistiques/page.tsx
    ├── utilisateurs/page.tsx
    └── imports/page.tsx
```

Créer un layout admin avec sidebar de navigation :
```tsx
// frontend/src/app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-eec-paper">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
```

---

#### J2-TORRES — Composant carte de base (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Créer le composant carte Leaflet compatible Next.js :

```tsx
// frontend/src/components/map/LeafletMap.tsx
'use client'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function LeafletMap() {
  return (
    <MapContainer
      center={[4.5, 12.0]}   // Centre du Cameroun
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <ZoomControl position="bottomright" />
    </MapContainer>
  )
}
```

**Import dynamique (OBLIGATOIRE dans Next.js) :**
```tsx
// Sur n'importe quelle page
import dynamic from 'next/dynamic'
const Map = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false })
```

---

#### J2-KUSO — Composants UI de base (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Avec shadcn/ui installé (J1), créer les composants de base :

```bash
# Installer les composants shadcn nécessaires
npx shadcn@latest add button card badge input select table dialog alert
```

Créer les composants personnalisés :

```tsx
// frontend/src/components/admin/StatCard.tsx
// Carte de statistique avec icône, valeur, libellé, couleur EEC
interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color?: 'green' | 'gold' | 'neutral'
}

// frontend/src/components/admin/SearchBar.tsx
// Barre de recherche avec filtres déroulants (région, district, type)
```

Configurer la palette EEC dans Tailwind :
```typescript
// frontend/tailwind.config.ts
theme: { extend: { colors: { eec: { green: {...}, gold: {...}, ink: {...} } } } }
```

---

#### J2-FREDY — Rapport § Architecture (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger aujourd'hui :**
- **Architecture technique** : Décrire la stack (Django, Next.js, PostGIS, GeoServer, Redis, Docker)
- **Justification des choix** : Pourquoi GeoServer ? Pourquoi PostGIS ? Pourquoi sessions et pas JWT ?
- **Schéma d'architecture** : Dessiner (même en ASCII) les 5 services Docker et leurs interactions

> **Note Fredy :** Pour la justification technique, s'appuyer sur les sections 4 et 5 du Master Prompt v3.

---

### JOUR 3 — 23 mai 2026 : Import des données réelles

**Objectif du jour :** Toutes les données EEC sont dans PostGIS. La base de données est remplie.

---

#### J3-M1 — Commande import régions synodales (Miguel)
**Durée :** 3 heures | **Branche :** `miguel/backend-core`

Créer `backend/apps/geo/management/commands/import_regions.py` :

```python
"""Import les 22 régions synodales depuis le Shapefile."""
from django.core.management.base import BaseCommand
from django.contrib.gis.gdal import DataSource
from apps.geo.models import RegionSynodale

# Table de correspondance des 5 noms incohérents
CORRESPONDANCES = {
    'HAUT-NKAM': 'HAUT NKAM',
    'HAUTS-PLATEAUX': 'HAUTS PLATEAUX',
    'MOUNGO SUD ET MEME': 'MOUNGO SUD & MEME',
    'NDE & MBAM ET INOUBOU': 'NDE MBAM ET INOUBOU',
    'NORD & EXTREME NORD': 'NORD & EXTREME-NORD',
}

class Command(BaseCommand):
    help = 'Importe les régions synodales depuis le Shapefile'
    
    def handle(self, *args, **options):
        ds = DataSource('/data/gis/Region_synodale_ok2.shp')
        layer = ds[0]
        created = 0
        
        for feature in layer:
            nom_shp = feature.get('Region_syn')
            nom_excel = CORRESPONDANCES.get(nom_shp, nom_shp)  # normaliser
            
            RegionSynodale.objects.update_or_create(
                nom_normalise=nom_excel,
                defaults={'nom': nom_shp, 'geometrie': feature.geom.wkt}
            )
            created += 1
        
        self.stdout.write(f"✅ {created} régions importées.")
```

**Lancer l'import :**
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend python manage.py import_regions
```

**Vérifier :** `http://localhost:8000/admin/geo/regionsynodale/` → 22 régions affichées.

---

#### J3-M2 — Commande import paroisses (Miguel)
**Durée :** 4 heures | **Branche :** `miguel/backend-core`

Créer `backend/apps/geo/management/commands/import_paroisses.py` :

```python
"""Import des 693 paroisses depuis l'Excel."""
# ⚠️ CRITIQUE : Coord_x = LATITUDE, Coord_y = LONGITUDE → Point(Coord_y, Coord_x)
import openpyxl
from django.contrib.gis.geos import Point

def construire_point(coord_x, coord_y):
    """coord_x est la latitude, coord_y est la longitude — inversion intentionnelle."""
    try:
        lat = float(coord_x)   # Coord_x = latitude
        lon = float(coord_y)   # Coord_y = longitude
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return Point(lon, lat, srid=4326)  # Point(longitude, latitude)
    except (TypeError, ValueError):
        pass
    return None
```

**Points critiques à gérer :**
- Correspondance région via `CORRESPONDANCES` (même table que import_regions)
- 255 paroisses sans GPS → `coordonnees=None`, `has_gps=False`
- Créer les Districts à la volée s'ils n'existent pas
- Upsert (si re-lancé, pas d'erreur)

**Test de vérification :**
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend python manage.py import_paroisses
# → 693 paroisses créées, 438 avec GPS, 255 sans GPS
```

---

#### J3-F1 — Import ouvriers et œuvres (Fred)
**Durée :** 5 heures | **Branche :** `fred/backend-api`

**Import ouvriers (`import_ouvriers.py`) :**
- Normaliser les grades : `Ev`, `EV`, `Évangéliste` → créer `Grade(nom='Évangéliste')`
- Rattacher à la paroisse par nom (chercher en base)
- Coordonnées : `_latitude` et `_longitude` dans ce fichier (correctement nommées ici, pas d'inversion)

**Import œuvres (`import_oeuvres.py`) :**

C'est le fichier le plus complexe (3 feuilles à dépivoter) :
- Feuille `Oeuvres_regionales` → niveau='regional', FK region
- Feuille `Oeuvres_districts` → niveau='district', FK district
- Feuille `Oeuvres_paroissialles` → niveau='paroissial', FK paroisse

Créer les types d'œuvres : SCOLAIRE, UNIVERSITAIRE, MEDICALE, AGROPASTORALE, IMMEUBLE, TERRAIN, AUTRE

**Référence :** S'inspirer de la logique dans `geoeec_ancienne_version/PFE/geoeec-backend/import_export/views.py`

---

#### J3-IGOR — Page de connexion + Auth (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

```tsx
// frontend/src/app/login/page.tsx
// Formulaire : username + password
// POST vers /api/v1/auth/login/
// Si succès → cookie session → redirect /admin
// Si erreur → message d'erreur visible
```

Créer `frontend/src/lib/auth.ts` :
```typescript
export async function login(username: string, password: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
    method: 'POST',
    credentials: 'include',   // IMPORTANT : envoyer le cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) throw new Error('Identifiants invalides')
  return response.json()
}
```

---

#### J3-TORRES — WMS Régions sur la carte (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Ajouter la couche WMS GeoServer des régions synodales :

```tsx
// frontend/src/components/map/WMSRegionsLayer.tsx
import { WMSTileLayer } from 'react-leaflet'

export default function WMSRegionsLayer() {
  return (
    <WMSTileLayer
      url={`${process.env.NEXT_PUBLIC_GEOSERVER_URL}/eec/wms`}
      layers="eec:regions_synodales"
      format="image/png"
      transparent={true}
      version="1.1.1"
      attribution="© EEC Cameroun"
    />
  )
}
```

**Variable d'environnement :** `NEXT_PUBLIC_GEOSERVER_URL=http://localhost:8080/geoserver`

---

#### J3-KUSO — Composants StatCard + SearchBar (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Finaliser les composants `StatCard` et `SearchBar` commencés J2.

Créer aussi `HierarchyBreadcrumb` :
```tsx
// National > Région Bamiléké > District Bafoussam > Paroisse X
interface HierarchyBreadcrumbProps {
  region?: string
  district?: string
  paroisse?: string
}
```

---

#### J3-FREDY — Rapport § Données sources (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **Analyse des données sources** : Décrire les 3 fichiers Excel et le Shapefile
- **Structure des données** : Tableaux avec les colonnes importantes
- **Problèmes identifiés** : Inversion Coord_x/Coord_y, noms de régions incohérents, 255 paroisses sans GPS
- **Modèle de données** : Diagramme entité-association (ou description textuelle si pas d'outil)

---

### JOUR 4 — 24 mai 2026 : GeoServer + Structure API

**Objectif du jour :** GeoServer configuré avec toutes les couches. L'API Django commence à prendre forme.

---

#### J4-M1 — Configuration GeoServer complète (Miguel)
**Durée :** Full day | **Branche :** `miguel/backend-core`

**Interface GeoServer :** `http://localhost:8080/geoserver/web`
**Login :** `admin` / (mot de passe dans `.env`)

**Étapes dans l'ordre :**

**1. Créer le workspace :**
- Données → Espaces de travail → Nouvel espace de travail
- Nom : `eec` | URI : `http://eec-cameroun.org/geoserver/eec` | Espace de travail par défaut : Oui

**2. Créer le datastore PostGIS :**
- Données → Entrepôts → Nouvel entrepôt → PostGIS
- Nom : `postgis_eec`
- host : `db` (NOM DU SERVICE DOCKER, PAS localhost)
- port : `5432` | database : `eec_db` | user : `eec_user` | password : (depuis .env)
- schema : `public`

**3. Publier les 8 couches :**
| Couche à publier | Table PostGIS | SRS |
|---|---|---|
| `regions_synodales` | `geo_regionsynodale` | EPSG:4326 |
| `districts` | `geo_district` | EPSG:4326 |
| `paroisses` | `geo_paroisse` | EPSG:4326 |
| `oeuvres_scolaires` | `oeuvres_oeuvre` + filtre SQL | EPSG:4326 |
| `oeuvres_medicales` | `oeuvres_oeuvre` + filtre SQL | EPSG:4326 |
| `oeuvres_agropastorales` | `oeuvres_oeuvre` + filtre SQL | EPSG:4326 |
| `zones_influence` | `geo_zoneinfluence` | EPSG:4326 |
| `itineraires` | `geo_itineraire` | EPSG:4326 |

Pour chaque couche : calculer l'emprise native + Lat/Long depuis les données.

**4. Uploader les styles SLD :**
Les fichiers SLD sont dans `infra/geoserver/styles/`. Les uploader via :
- Données → Styles → Ajouter un nouveau style → uploader le fichier SLD
- Associer chaque style à sa couche comme style par défaut

**5. Désactiver les services inutiles :**
- Services → WCS → décocher "Activer WCS"
- Services → WPS → décocher "Activer WPS"
- Services → WFS → DÉCOCHER "Activer les WFS Transactions" (CRITIQUE SÉCURITÉ)

**6. Test de validation :**
```
http://localhost:8080/geoserver/eec/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=eec:regions_synodales&BBOX=8,2,16,13&WIDTH=600&HEIGHT=400&SRS=EPSG:4326&FORMAT=image/png
```
→ doit retourner une image PNG des régions en vert.

---

#### J4-F1 — Serializers DRF de base (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

Créer les serializers pour tous les modèles :

```python
# backend/apps/geo/serializers.py
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import RegionSynodale, District, Paroisse

class ParoisseGeoSerializer(GeoFeatureModelSerializer):
    """Sérialiseur GeoJSON pour Leaflet — utilisé par la carte."""
    region_nom = serializers.CharField(source='district.region.nom', read_only=True)
    district_nom = serializers.CharField(source='district.nom', read_only=True)
    
    class Meta:
        model = Paroisse
        geo_field = 'coordonnees'
        fields = ['id', 'nom', 'district_nom', 'region_nom', 'niveau',
                  'communiants', 'non_communiants', 'has_gps']

class RegionSynodaleSerializer(GeoFeatureModelSerializer):
    """Sérialiseur avec géométrie polygone pour Leaflet."""
    nb_paroisses = serializers.SerializerMethodField()
    
    class Meta:
        model = RegionSynodale
        geo_field = 'geometrie'
        fields = ['id', 'nom', 'nb_paroisses']
    
    def get_nb_paroisses(self, obj):
        return Paroisse.objects.filter(district__region=obj).count()
```

---

#### J4-IGOR — Middleware de protection des routes (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('sessionid')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (isAdminRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

#### J4-TORRES — WFS Paroisses (marqueurs) (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Charger les paroisses depuis GeoServer WFS et afficher des marqueurs cliquables :

```tsx
// frontend/src/components/map/WFSParoissesLayer.tsx
import { useEffect, useState } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'

export default function WFSParoissesLayer() {
  const [geojson, setGeojson] = useState(null)
  
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_GEOSERVER_URL}/eec/wfs?` +
      `service=WFS&version=2.0.0&request=GetFeature` +
      `&typeNames=eec:paroisses&outputFormat=application/json&srsName=EPSG:4326`
    
    fetch(url)
      .then(r => r.json())
      .then(setGeojson)
  }, [])
  
  return geojson ? <GeoJSON data={geojson} /> : null
}
```

---

#### J4-KUSO — Layout admin + Dashboard skeleton (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Créer le layout admin avec sidebar de navigation :
```tsx
// frontend/src/components/admin/Sidebar.tsx
// Navigation : Dashboard | Paroisses | Œuvres | Ouvriers | Statistiques | Import | Journal
// Couleurs EEC : fond vert foncé (#166534), texte blanc, hover vert clair
```

Dashboard page skeleton :
```tsx
// frontend/src/app/admin/page.tsx
// Grille de 4 StatCards : nb paroisses, nb ouvriers, nb œuvres, nb régions
// Placeholder graphiques
```

---

#### J4-FREDY — Rapport § Modèle de données (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **Modèles de données détaillés** : Décrire chaque modèle (RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire, Grade, Ouvrier, TypeOeuvre, Oeuvre, StatistiqueAnnuelle)
- **Diagramme de classes** ou tableau entités/attributs
- **Hiérarchie géographique** : National → Région → District → Paroisse
- **Modèle d'accès** : Visiteur vs Administrateurs (4 rôles)

---

### JOUR 5 — 25 mai 2026 : API REST + Frontend map avancée

**Objectif du jour :** L'API core est en place. La carte commence à être riche.

---

#### J5-M1 — RBAC Permissions + API Auth + ViewSets GEO (Miguel)
**Durée :** Full day | **Branche :** `miguel/backend-core`

**Permissions RBAC :**
```python
# backend/apps/accounts/permissions.py
from rest_framework.permissions import BasePermission

class EstSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER'

class EstAdminRegional(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Admin régional ne voit que les objets de SA région
        if request.user.role == 'REGION':
            return self._appartient_a_region(obj, request.user.region)
        return True  # SUPER voit tout
```

**Endpoints auth :**
```python
# backend/apps/accounts/views.py
class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]  # 5 req/min/IP
    def post(self, request):
        user = authenticate(username=..., password=...)
        if user:
            login(request, user)
            return Response({'role': user.role})
        return Response({'error': 'Identifiants invalides'}, status=401)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=200)

class MeView(RetrieveAPIView):
    def get(self, request):
        return Response({'username': request.user.username, 'role': request.user.role})
```

**ViewSets GEO (régions + paroisses) :**
```python
# backend/apps/geo/views.py
class RegionSynodaleViewSet(ModelViewSet):
    queryset = RegionSynodale.objects.all()
    
    @action(detail=False, methods=['get'])
    def geojson(self, request):
        qs = self.get_queryset()
        serializer = RegionSynodaleSerializer(qs, many=True)
        return Response(serializer.data)
```

---

#### J5-F1 — ViewSets Ouvriers + Œuvres (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

```python
# backend/apps/ouvriers/views.py + backend/apps/oeuvres/views.py
# CRUD complet (list, create, retrieve, update, destroy)
# Filtres : pour OuvrierViewSet → filtrer par région/district/paroisse/grade/statut
# Filtres : pour OeuvreViewSet → filtrer par type/niveau/statut
# Action geojson() pour chaque
```

**URL routing :**
```python
# backend/eec_core/urls.py
router.register('geo/regions', RegionSynodaleViewSet)
router.register('geo/districts', DistrictViewSet)
router.register('geo/paroisses', ParoisseViewSet)
router.register('geo/zones-influence', ZoneInfluenceViewSet)
router.register('geo/itineraires', ItineraireViewSet)
router.register('oeuvres', OeuvreViewSet)
router.register('ouvriers', OuvrierViewSet)
```

---

#### J5-TORRES — Popups riches + Légende (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Créer les composants popup pour chaque type d'entité :

```tsx
// frontend/src/components/map/ParoissePopup.tsx
// Affiche : Nom, Niveau (paroisse/station/annexe), District, Région
// Communiants : X | Non-communiants : Y
// Ouvriers rattachés : liste
// Bouton "Voir les œuvres" si has_gps

// frontend/src/components/map/OeuvrePopup.tsx
// Affiche : Nom, Type (icône colorée), Niveau, Statut, Capacité

// frontend/src/components/map/OuvrierPopup.tsx
// Affiche : Nom complet, Grade, Statut, Paroisse

// frontend/src/components/map/MapLegend.tsx
// Liste des couches avec icônes et couleurs
// Checkboxes pour activer/désactiver chaque couche
```

---

#### J5-KUSO — Dashboard statistiques (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Connecter le dashboard aux données réelles :

```tsx
// frontend/src/app/admin/page.tsx
// Appel GET /api/v1/stats/global/ → afficher dans les StatCards
// Appel GET /api/v1/stats/top-paroisses-fideles/ → tableau Top 10
// Appel GET /api/v1/stats/performance-regions/ → tableau scores
```

Créer aussi `RegionPanel` — panneau latéral affiché quand on clique sur une région :
```tsx
// frontend/src/components/map/RegionPanel.tsx
// Nom de la région, nb paroisses, nb ouvriers, nb œuvres
// Graphique simple (barres ou camembert) des types d'œuvres
```

---

#### J5-IGOR — Pages CRUD admin (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

Commencer les pages CRUD pour les admins :

```tsx
// frontend/src/app/admin/paroisses/page.tsx
// Tableau paginé des paroisses
// Colonnes : Nom | District | Région | GPS | Communiants | Actions (éditer, supprimer)
// Filtres : région, district, has_gps
// Bouton "Ajouter une paroisse"

// frontend/src/app/admin/paroisses/[id]/page.tsx
// Formulaire d'édition avec tous les champs
// Champ carte pour saisir/modifier les coordonnées GPS
```

---

#### J5-FREDY — Rapport § API et sécurité (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **API REST** : Description des endpoints, format JSON
- **Authentification** : Sessions Django (et pourquoi pas JWT)
- **RBAC** : Les 4 rôles et leurs droits
- **Sécurité** : Checklist OWASP Top 10, GeoServer hardening

---

### JOUR 6 — 26 mai 2026 : Statistiques avancées + Zones + Itinéraires

**Objectif du jour :** Toutes les fonctionnalités avancées de l'ancienne version reproduites et améliorées.

---

#### J6-M1 — Endpoints statistiques avancées (Miguel)
**Durée :** Full day | **Branche :** `miguel/backend-core`

```python
# backend/apps/statistiques/views.py

class GlobalStatsView(APIView):
    """Statistiques globales : totaux nationaux."""
    def get(self, request):
        return Response({
            'total_regions': RegionSynodale.objects.count(),
            'total_districts': District.objects.count(),
            'total_paroisses': Paroisse.objects.filter(actif=True).count(),
            'total_paroisses_avec_gps': Paroisse.objects.filter(has_gps=True).count(),
            'total_ouvriers': Ouvrier.objects.filter(statut='actif').count(),
            'total_oeuvres': Oeuvre.objects.filter(statut='active').count(),
            'total_communiants': Paroisse.objects.aggregate(Sum('communiants'))['communiants__sum'],
        })

class TopParoissesFidelesView(APIView):
    """Top 10 paroisses par nombre de fidèles (communiants + non-communiants)."""
    def get(self, request):
        paroisses = Paroisse.objects.annotate(
            total_fideles=F('communiants') + F('non_communiants')
        ).order_by('-total_fideles')[:10]
        ...

class PerformanceRegionsView(APIView):
    """Score de performance par région (pondéré)."""
    def get(self, request):
        # Score = 0.4*fidèles_normalisés + 0.3*nb_oeuvres + 0.3*nb_ouvriers
        ...
```

---

#### J6-F1 — Endpoints Export PDF + Excel (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

```python
# backend/apps/exports/views.py
from weasyprint import HTML
import openpyxl

class ExportParoissesExcelView(APIView):
    """Export des paroisses filtrées en Excel."""
    def get(self, request):
        region_id = request.query_params.get('region')
        qs = Paroisse.objects.all()
        if region_id:
            qs = qs.filter(district__region_id=region_id)
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['Nom', 'District', 'Région', 'Niveau', 'Communiants', 'GPS'])
        for p in qs:
            ws.append([p.nom, p.district.nom, p.district.region.nom, p.niveau, p.communiants, p.has_gps])
        
        # retourner le fichier
        response = HttpResponse(content_type='application/vnd.openxmlformats...')
        wb.save(response)
        return response

class ExportStatsPDFView(APIView):
    """Export PDF du rapport statistique d'une région."""
    def get(self, request):
        region_id = request.query_params.get('region')
        # Générer HTML → WeasyPrint → PDF
```

---

#### J6-TORRES — Couches Zones + Itinéraires sur la carte (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Ajouter les couches WFS pour zones d'influence et itinéraires :

```tsx
// frontend/src/components/map/ZonesInfluenceLayer.tsx
// Polygones WFS semi-transparents verts autour des paroisses
// Style : fill: '#16A34A', fillOpacity: 0.1, color: '#15803D', weight: 1

// frontend/src/components/map/ItinerairesLayer.tsx
// Lignes WFS entre paroisses
// Style : color: '#EAB308', weight: 2, dashArray: '5, 10'
// Popup au clic : distance_km, duree_minutes, type_transport, difficulte
```

---

#### J6-IGOR — Interface CRUD Œuvres + Ouvriers (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

```tsx
// frontend/src/app/admin/oeuvres/page.tsx
// Tableau : Nom | Type (icône) | Niveau | Paroisse | Statut | Capacité

// frontend/src/app/admin/ouvriers/page.tsx
// Tableau : Nom | Grade | Statut | Paroisse | Contact
// Filtres : grade, statut, région

// frontend/src/app/admin/statistiques/page.tsx
// Tableau par paroisse + année
// Colonnes : Paroisse | Année | Communiants | Baptêmes | Mariages | Décès | Offrandes
```

---

#### J6-KUSO — Statistiques avancées UI (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Créer le tableau de bord des statistiques avancées :
```tsx
// frontend/src/app/admin/page.tsx — enrichir le dashboard
// Tableau Top 10 paroisses par fidèles
// Tableau Top 10 paroisses par œuvres
// Tableau Performance par région (score + bar visuelle)
// Alertes : nb paroisses sans GPS, nb ouvriers sans contact
```

---

#### J6-FREDY — Rapport § Fonctionnalités (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **Fonctionnalités de la carte** : WMS, WFS, popups, filtres
- **Espace administrateur** : CRUD, imports, exports
- **Statistiques avancées** : Top 10, scores, évolution annuelle
- **Zones d'influence et itinéraires** : Objectif, fonctionnement
- **Comparaison ancienne version** : Ce qui a changé et pourquoi

---

### JOUR 7 — 27 mai 2026 : Intégration complète Frontend ↔ Backend

**Objectif du jour :** Le frontend consomme réellement l'API Django. Tout est connecté.

---

#### J7-M1 — Intégration + Résolution CORS + Bugs critiques (Miguel)
**Durée :** Full day | **Branche :** `miguel/backend-core`

Miguel prend en charge tous les problèmes d'intégration qui apparaissent :

**Configuration CORS :**
```python
# backend/eec_core/settings/dev.py
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True  # CRUCIAL pour les cookies de session
SESSION_COOKIE_SAMESITE = 'Lax'  # Lax en dev (pas Strict qui bloque le cross-origin)
```

**CSRF pour le frontend :**
```python
CSRF_COOKIE_HTTPONLY = False   # Le JS doit pouvoir lire le cookie CSRF
CSRF_COOKIE_SAMESITE = 'Lax'
```

**Client API frontend :**
```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL

async function apiCall(path: string, options: RequestInit = {}) {
  // Récupérer le token CSRF depuis le cookie
  const csrfToken = document.cookie.split('; ')
    .find(row => row.startsWith('csrftoken='))?.split('=')[1]
  
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || '',
      ...options.headers,
    },
  })
}

export const api = {
  getRegions: () => apiCall('/geo/regions/'),
  getParoisses: (params?) => apiCall(`/geo/paroisses/?${new URLSearchParams(params)}`),
  getParoissesGeoJSON: () => apiCall('/geo/paroisses/geojson/'),
  getStatsGlobal: () => apiCall('/stats/global/'),
  getStatsRegion: (id: number) => apiCall(`/stats/region/${id}/`),
  // ... tous les endpoints
}
```

---

#### J7-F1 — Endpoints Import Excel via API (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

```python
# backend/apps/imports/views.py
from rest_framework.parsers import MultiPartParser, FormParser

class ImportParoissesView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, EstSuperAdmin | EstAdminRegional]
    
    def post(self, request):
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'error': 'Fichier requis'}, status=400)
        
        # Sauvegarder temporairement et lancer l'import
        rapport = importer_paroisses(fichier)
        return Response({
            'crees': rapport['crees'],
            'mis_a_jour': rapport['mis_a_jour'],
            'erreurs': rapport['erreurs'],
        })
```

---

#### J7-TORRES — Carte connectée à l'API Django (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Remplacer les appels GeoServer directs par des appels Django API là où c'est approprié :
- Paroisses : GeoServer WFS pour les positions map + Django API pour les détails popup
- Au clic sur paroisse → `GET /api/v1/geo/paroisses/{id}/` → popup enrichi avec ouvriers

```tsx
// frontend/src/components/map/ParoissePopup.tsx
// Quand on clique, charger les détails depuis Django API
useEffect(() => {
  if (paroisseId) {
    api.getParoisse(paroisseId).then(data => setDetails(data))
  }
}, [paroisseId])
```

---

#### J7-KUSO — Recherche multicritère connectée (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

La SearchBar filtre les paroisses en temps réel via l'API :
```tsx
// SearchBar → onChange → appel API avec paramètre `search=`
// GET /api/v1/geo/paroisses/?search=Bafoussam&region=5&has_gps=true
// Résultats affichés en liste + surlignés sur la carte (via event)
```

---

#### J7-IGOR — Interface import Excel frontend (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

```tsx
// frontend/src/app/admin/imports/page.tsx
// Section "Importer des paroisses" : bouton upload .xlsx
// Barre de progression
// Rapport d'import : X créées, Y mises à jour, Z erreurs
// Même chose pour ouvriers et œuvres

// Appel API :
// POST /api/v1/imports/paroisses/ (multipart/form-data)
```

---

#### J7-FREDY — Rapport § GeoServer et déploiement (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **GeoServer** : Rôle, workspace, couches publiées, styles SLD
- **Flux de données** : Comment le navigateur consomme WMS et WFS
- **Performances** : Clustering, cache Redis, GeoWebCache
- **Plan de déploiement** : (bases — VPS, Nginx, HTTPS, procédure)

---

### JOUR 8 — 28 mai 2026 : Landing page + Admin avancé

**Objectif du jour :** La page d'accueil institutionnelle est terminée. Les fonctions admin avancées sont en place.

---

#### J8-M1 — 2FA + Journal d'audit + Code review (Miguel)
**Durée :** Full day | **Branche :** `miguel/backend-core`

**2FA TOTP pour SUPER et REGION :**
```python
# backend/requirements.txt → django-otp, qrcode

# backend/apps/accounts/views.py
class Setup2FAView(APIView):
    """Génère un QR code TOTP pour l'admin."""
    
class Verify2FAView(APIView):
    """Vérifie le code TOTP saisi."""
```

**Journal d'audit vue API :**
```python
# backend/apps/audit/views.py
class LogActiviteViewSet(ReadOnlyModelViewSet):
    permission_classes = [EstSuperAdmin]
    filterset_fields = ['action', 'modele', 'utilisateur']
    ordering = ['-date']
```

**Code review des PR en attente :** Miguel revoit et merge les travaux de Fred, Igor, Torres, Kuso, Fredy.

---

#### J8-F1 — Tests API complets (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

```python
# backend/apps/geo/tests.py
import pytest
from django.test import TestCase
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestParoisseAPI:
    def test_liste_paroisses_anonyme(self, client):
        response = client.get('/api/v1/geo/paroisses/')
        assert response.status_code == 200  # public
    
    def test_create_paroisse_sans_auth(self, client):
        response = client.post('/api/v1/geo/paroisses/', {})
        assert response.status_code == 403  # refusé
    
    def test_create_paroisse_super_admin(self, authenticated_client):
        response = authenticated_client.post('/api/v1/geo/paroisses/', {...})
        assert response.status_code == 201
    
    def test_admin_regional_voit_seulement_sa_region(self, region_admin_client):
        response = region_admin_client.get('/api/v1/geo/paroisses/')
        # Vérifier que toutes les paroisses retournées sont dans la région de l'admin
        ...
```

---

#### J8-KUSO — Landing page institutionnelle (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

```tsx
// frontend/src/app/page.tsx — Page d'accueil publique

// Section 1 : Header (logo EEC + nom de la plateforme)
// Section 2 : Hero (titre, description, bouton "Explorer la carte")
// Section 3 : Stats globales (appel /api/v1/stats/global/)
// Section 4 : Bureau National (photos du président et du bureau)
// Section 5 : La carte intégrée (composant Torres)
// Section 6 : Footer (mentions légales EEC)
```

**Composant Bureau National :**
```tsx
// frontend/src/components/landing/BureauNational.tsx
const membres = [
  { nom: 'Président', photo: '/bureau_national/president.png' },
  { nom: 'Vice-Président', photo: '/bureau_national/vp.png' },
  // ...
]
```

---

#### J8-TORRES — Popups enrichis + Contrôle couches (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

Finaliser tous les popups avec données réelles depuis Django API.
Créer le panneau de contrôle des couches :
```tsx
// frontend/src/components/map/LayersControl.tsx
// Checkboxes : Régions | Paroisses | Œuvres | Zones d'influence | Itinéraires
// Activer/désactiver chaque couche indépendamment
```

---

#### J8-IGOR — Page gestion utilisateurs + Statistiques annuelles (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

```tsx
// frontend/src/app/admin/utilisateurs/page.tsx (SUPER seulement)
// Tableau des comptes admin : Username | Rôle | Région/District/Paroisse | Actif
// Créer/modifier/désactiver un compte

// frontend/src/app/admin/statistiques/page.tsx
// Sélecteur paroisse + année
// Formulaire de saisie : communiants, baptêmes, mariages, décès, offrandes, dîmes
```

---

#### J8-FREDY — Rapport § Tests et validation (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Sections à rédiger :**
- **Stratégie de tests** : Tests unitaires, tests API, tests E2E
- **Scénarios de validation** : Visiteur, Super Admin, Admin Régional
- **Résultats des tests** : (à compléter J11-J12)
- **Problèmes résolus** : Documenter les bugs trouvés et corrigés

---

### JOUR 9 — 29 mai 2026 : Statistiques annuelles + Exports finaux

**Objectif du jour :** Toutes les fonctionnalités de statistiques et d'export sont opérationnelles.

---

#### J9-M1 — Optimisation Redis + Performances (Miguel)
**Durée :** 4 heures | **Branche :** `miguel/backend-core`

```python
# backend/apps/geo/views.py
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class ParoisseGeoJSONView(APIView):
    """Cache Redis 5 minutes pour les données GeoJSON rarement modifiées."""
    
    def get(self, request):
        cache_key = 'paroisses_geojson'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)
        
        data = self.build_geojson()
        cache.set(cache_key, data, timeout=300)  # 5 minutes
        return Response(data)
```

Simplification des géométries PostGIS pour accélérer GeoServer :
```sql
-- Vue simplifiée pour les polygones de régions (moins de points)
CREATE OR REPLACE VIEW geo_regionsynodale_simplified AS
SELECT id, nom, ST_SimplifyPreserveTopology(geometrie, 0.001) AS geometrie
FROM geo_regionsynodale;
```

---

#### J9-F1 — StatistiqueAnnuelle API + Export PDF (Fred)
**Durée :** Full day | **Branche :** `fred/backend-api`

```python
# backend/apps/statistiques/views.py
class StatistiqueAnnuelleViewSet(ModelViewSet):
    """CRUD statistiques annuelles par paroisse."""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = StatistiqueAnnuelle.objects.all()
        if self.request.user.role == 'PAROISSE':
            qs = qs.filter(paroisse=self.request.user.paroisse)
        elif self.request.user.role == 'DISTRICT':
            qs = qs.filter(paroisse__district=self.request.user.district)
        elif self.request.user.role == 'REGION':
            qs = qs.filter(paroisse__district__region=self.request.user.region)
        return qs

class ExportStatsPDFView(APIView):
    """Export PDF rapport statistiques d'une région."""
    def get(self, request):
        region_id = request.query_params.get('region')
        region = RegionSynodale.objects.get(pk=region_id)
        stats = self.calculer_stats(region)
        
        html = render_to_string('exports/rapport_region.html', {'region': region, 'stats': stats})
        pdf = HTML(string=html).write_pdf()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_{region.nom}.pdf"'
        return response
```

---

#### J9-TORRES — Responsive carte mobile (Torres)
**Durée :** Full day | **Branche :** `torres/frontend-map`

La carte doit fonctionner parfaitement sur mobile (375px) et tablette (768px) :

```tsx
// Comportement mobile :
// - Carte occupe 100% de l'écran (height: 100dvh)
// - Les popups s'affichent en bas (bottom-sheet)
// - Les filtres passent dans un tiroir drawer
// - La légende est réduite à une icône flottante

// Tailwind responsive :
<div className="h-screen md:h-[600px]">
  <MapContainer ...>
```

---

#### J9-IGOR — Export buttons frontend (Igor)
**Durée :** Full day | **Branche :** `igor/frontend-auth`

Intégrer les boutons d'export dans les pages admin :

```tsx
// frontend/src/components/admin/ExportButtons.tsx
<Button onClick={() => downloadExcel('/exports/paroisses/excel/')}>
  Export Excel
</Button>
<Button onClick={() => downloadPDF('/exports/stats/pdf/?region=5')}>
  Export PDF
</Button>
```

---

#### J9-KUSO — Composants recherche + Breadcrumb finaux (Kuso)
**Durée :** Full day | **Branche :** `kuso/frontend-ui`

Finaliser :
- `SearchBar` avec debounce (attendre 300ms avant l'appel API)
- `HierarchyBreadcrumb` dynamique (mis à jour selon le zoom de la carte)
- `RegionPanel` (s'ouvre et se ferme correctement)
- Toast notifications pour les actions admin (succès / erreur)

---

#### J9-FREDY — Responsive design + Rapport § (Fredy)
**Durée :** Full day | **Branche :** `fredy/rapport-exports`

**Tâche technique :** Tester et corriger le responsive sur toutes les pages admin :
- Desktop 1920×1080
- Tablette 768×1024
- Mobile 375×812

**Rapport :** Compléter les sections manquantes.

---

### JOUR 10 — 30 mai 2026 : Tests fonctionnels complets

**Objectif du jour :** Chaque fonctionnalité est testée de bout en bout. Les bugs bloquants sont identifiés.

---

#### J10-M1 — Tests de sécurité + Code review final (Miguel)
**Durée :** Full day

**Checklist sécurité à valider :**
- [ ] `curl -v http://localhost:8000/api/v1/geo/paroisses/` sans cookie → 200 (public)
- [ ] `curl -v -X POST http://localhost:8000/api/v1/geo/paroisses/` sans auth → 403
- [ ] Cookie de session : `HttpOnly; SameSite=Lax; Secure=False (dev)` ✓
- [ ] GeoServer password changé ✓
- [ ] WFS Transactions désactivées ✓
- [ ] Admin régional ne voit PAS les paroisses des autres régions
- [ ] Tenter SQL injection dans SearchBar → résultat : ORM Django bloque
- [ ] Tenter XSS dans formulaire → Django échappe automatiquement

**Code review :** Review toutes les PR ouvertes de l'équipe. Identifier les non-conformités.

---

#### J10-F1 — Lancer tous les tests pytest (Fred)
**Durée :** Full day

```powershell
docker compose run --rm backend pytest --cov=apps --cov-report=html -v
# Objectif : couverture ≥ 70%
```

Corriger les tests qui échouent. S'assurer que les tests de permissions fonctionnent tous.

---

#### J10-IGOR — Tests scénarios utilisateur (Igor)
**Durée :** Full day

**Scénario 1 — Visiteur anonyme :**
1. Ouvrir `http://localhost:3000` → page d'accueil s'affiche en < 5s
2. Photos Bureau National visibles
3. Clic "Explorer la carte" → carte chargée avec régions
4. Clic sur région → popup statistiques
5. Clic sur paroisse → popup détails
6. Recherche "Bafoussam" → résultats pertinents
7. Interface mobile (DevTools 375px) → tout utilisable

**Scénario 2 — Super Admin :**
1. Login → dashboard complet
2. Créer une paroisse → apparaît dans la liste
3. Modifier les coordonnées → HistoriquePosition créé
4. Import Excel → rapport OK
5. Export PDF → fichier téléchargé
6. Voir le journal d'audit

---

#### J10-TORRES — Tests carte (Torres)
**Durée :** Full day

Tests manuels de la carte :
- Zoom niveaux 4 à 16 → tout s'affiche
- Clustering à zoom faible → OK
- Basculer les couches ON/OFF → elles s'affichent/disparaissent
- CQL_FILTER par région → ne montre que les paroisses de cette région
- Mobile : popups accessibles
- Vérifier WMS GetCapabilities URL

---

#### J10-KUSO + FREDY — Tests UI + Rapport (Kuso + Fredy)
**Durée :** Full day

**Kuso :** Tests de tous les composants UI. Vérifier contraste WCAG (axe DevTools Chrome).

**Fredy :** Finaliser toutes les sections manquantes du rapport. Relecture complète.

---

### JOUR 11 — 31 mai 2026 : Corrections + Merge final

**Objectif du jour :** Tous les bugs identifiés J10 sont corrigés. Le code est prêt pour le merge.

---

#### J11-M1 — Fix bugs critiques + Merge PR (Miguel)
**Durée :** Full day

Miguel prend en charge TOUS les bugs critiques trouvés en test J10.
Il merge ensuite toutes les branches dans `develop` après validation.

**Ordre de merge recommandé :**
1. `miguel/backend-core` (base)
2. `fred/backend-api` (dépend du core)
3. `igor/frontend-auth` (dépend de l'API)
4. `torres/frontend-map` (dépend de l'API)
5. `kuso/frontend-ui` (dépend de l'API)
6. `fredy/rapport-exports` (indépendant)

---

#### J11-F1, J11-IGOR, J11-TORRES, J11-KUSO — Fix bugs individuels

Chacun corrige les bugs de sa branche identifiés en J10.
Rebaser sur `develop` avant de soumettre la PR finale :
```bash
git checkout ma-branche
git rebase origin/develop
# Résoudre conflits si nécessaire
git push --force-with-lease origin ma-branche
```

---

#### J11-FREDY — Rapport final (Fredy)
**Durée :** Full day

Livrer le rapport complet à Miguel pour relecture finale.
Format : document bien mis en page (Word ou PDF).
Contenu : toutes les sections précédentes + résultats des tests.

---

### JOUR 12 — 01 juin 2026 : Validation finale ✅

**Objectif du jour :** Cocher TOUT. Rien ne manque. Local OK.

---

#### J12-M1 — Validation finale + Documentation (Miguel)
**Durée :** Full day

Parcourir la checklist complète section 6. Chaque case doit être cochée.
Relire le rapport de Fredy et valider.
Préparer le résumé pour la Direction EEC.

---

## 6. CHECKLIST DE VALIDATION FINALE (Jour 12)

### Infrastructure
- [ ] `docker compose ps` → 5 services en état `healthy`
- [ ] `http://localhost:8000/admin` → Django Admin fonctionnel
- [ ] `http://localhost:8000/api/docs/` → OpenAPI documentation affichée
- [ ] `http://localhost:8080/geoserver/web` → GeoServer accessible (mot de passe changé)

### Backend
- [ ] 22 régions synodales en base
- [ ] 134 districts en base
- [ ] 693 paroisses en base (438 avec GPS, 255 sans GPS)
- [ ] 708 ouvriers en base
- [ ] Toutes les œuvres importées (3 feuilles Excel)
- [ ] Types d'œuvres : SCOLAIRE, UNIVERSITAIRE, MEDICALE, AGROPASTORALE, IMMEUBLE, TERRAIN, AUTRE
- [ ] Permissions RBAC : admin régional ne voit PAS les autres régions
- [ ] Import Excel → fonctionne via API (POST multipart)
- [ ] Export Excel → fichier .xlsx téléchargeable
- [ ] Export PDF → fichier .pdf téléchargeable
- [ ] Journal d'audit → visible dans admin (SUPER uniquement)
- [ ] HistoriquePosition → créé quand les coords changent
- [ ] StatistiqueAnnuelle → CRUD fonctionnel
- [ ] ZoneInfluence → CRUD fonctionnel
- [ ] Itineraire → CRUD fonctionnel
- [ ] Tests pytest : couverture ≥ 70%
- [ ] GeoServer : WFS Transactions désactivées

### GeoServer
- [ ] Workspace `eec` créé
- [ ] DataStore PostGIS connecté (host: db)
- [ ] 8 couches publiées (regions, districts, paroisses, 3 types oeuvres, zones, itineraires)
- [ ] Styles SLD appliqués (couleurs EEC vert/jaune)
- [ ] WMS GetMap → image PNG valide
- [ ] WFS GetFeature → GeoJSON valide
- [ ] Services WCS et WPS désactivés

### Frontend
- [ ] `http://localhost:3000` → page d'accueil < 5s
- [ ] Logo EEC affiché
- [ ] Photos Bureau National (président, VP, secrétaires, trésorier)
- [ ] Carte chargée : fond OSM + régions WMS + paroisses WFS
- [ ] Couches œuvres affichées (icônes colorées par type)
- [ ] Zones d'influence visibles
- [ ] Itinéraires affichés
- [ ] Popup paroisse : informations complètes
- [ ] Popup œuvre : type, statut, capacité
- [ ] Popup ouvrier : grade, statut
- [ ] Légende complète
- [ ] Contrôle de couches fonctionnel
- [ ] Recherche multicritère fonctionnelle
- [ ] Statistiques régions au clic
- [ ] Fil d'Ariane hiérarchique
- [ ] Login admin → dashboard
- [ ] CRUD paroisses fonctionnel
- [ ] CRUD œuvres fonctionnel
- [ ] CRUD ouvriers fonctionnel
- [ ] Import Excel dans l'interface admin
- [ ] Export depuis l'interface admin
- [ ] Statistiques annuelles saisie et affichage
- [ ] Responsive mobile OK
- [ ] Compatible Chrome, Firefox, Edge

### Rapport
- [ ] Toutes les sections rédigées
- [ ] Relecture Miguel OK
- [ ] Prêt pour remise à l'EEC

---

## 7. APRÈS JOUR 12 — Phase déploiement (planifiée séparément)

1. Choix hébergement (VPS OVH, DigitalOcean, ou autre)
2. Nom de domaine EEC (`geo.eec-cameroun.org` ou équivalent)
3. Configuration Nginx (reverse proxy + HTTPS Let's Encrypt)
4. Variables d'environnement production
5. `docker-compose.prod.yml`
6. Migration des données sur le serveur
7. Restriction IP sur `/geoserver/web/` et `/geoserver/rest/`
8. Tests de charge
9. Formation des administrateurs EEC
10. Remise de la documentation

---

## 8. RISQUES ET MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Colonnes Excel différentes de ce qu'on attend | Haute | Critique | Audit J1 OBLIGATOIRE avant tout code de modèle |
| Inversion Coord_x/Coord_y oubliée | Certaine si on y fait pas attention | Critique | Commentaire dans le code + test de validation |
| 5 noms de régions incohérents | Certaine | Haut | Table de correspondance dans la commande import |
| Merge conflict entre branches | Moyenne | Moyen | Miguel review toutes les PR, rebaser avant merge |
| GeoServer volume corrompu | Faible (déjà résolu) | Haut | Procédure documentée : `docker compose down -v geoserver && docker compose up -d geoserver` |
| Performance carte 693 points | Moyenne | Moyen | Clustering Leaflet + cache Redis GeoJSON |
| Next.js SSR incompatible Leaflet | Certaine | Moyen | `dynamic(() => import(...), { ssr: false })` — OBLIGATOIRE |
| Retard dans la rédaction du rapport | Moyenne | Haut | Fredy commence J1, Miguel envoie la structure dès que possible |

---

## 9. TABLEAU RÉCAPITULATIF — QUI FAIT EXACTEMENT QUOI

---

### MIGUEL — Chef de projet + Lead Dev Backend

**Rôle :** Miguel est sur TOUTES les tâches critiques. Il pilote le projet, valide le travail des autres, et intervient pour débloquer quand quelqu'un est bloqué.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Audit des données sources | J1 | Lancer `audit_data.py`, analyser les résultats, créer `docs/colonnes_excel.md` |
| 2 | Création branches Git équipe | J1 | Créer et pousser les 6 branches, envoyer instructions à l'équipe |
| 3 | Copie assets Bureau National | J1 | Copier les photos depuis l'ancienne version vers `frontend/public/bureau_national/` |
| 4 | Tous les modèles Django | J2 | RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire, Grade, Ouvrier, TypeOeuvre, Oeuvre, StatistiqueAnnuelle, LogActivite, HistoriquePosition |
| 5 | Signals audit automatique | J2 | Brancher post_save/post_delete → LogActivite, signal HistoriquePosition |
| 6 | Import régions synodales | J3 | Commande `import_regions.py` avec table correspondance 5 noms |
| 7 | Import paroisses Excel | J3 | Commande `import_paroisses.py` avec inversion Coord_x/Coord_y critique |
| 8 | Configuration GeoServer complète | J4 | Workspace, DataStore PostGIS, 8 couches publiées, styles SLD, désactiver WCS/WPS/WFS-Transactions |
| 9 | RBAC Permissions | J5 | `EstSuperAdmin`, `EstAdminRegional`, `EstAdminDistrict`, `EstAdminParoissial` |
| 10 | API Auth (login/logout/me) | J5 | Sessions Django + rate limiting 5 req/min |
| 11 | ViewSets GEO (régions, paroisses) | J5 | Avec filtrage par périmètre rôle |
| 12 | Statistiques avancées API | J6 | Global stats, Top 10, scores performance régions |
| 13 | Configuration CORS + CSRF | J7 | Débloquer l'intégration frontend ↔ backend |
| 14 | Client API frontend (api.ts) | J7 | Toutes les fonctions d'appel API |
| 15 | 2FA TOTP SUPER + REGION | J8 | Setup django-otp, QR code, vérification |
| 16 | API journal d'audit | J8 | Vue LogActivite (SUPER seulement) |
| 17 | Code review toutes les PR | J8 continu | Review et merge de toutes les PR de l'équipe |
| 18 | Optimisation Redis cache | J9 | Cache GeoJSON 5 min, vue PostGIS simplifiée |
| 19 | Tests de sécurité | J10 | Checklist OWASP : injections, CSRF, cookies, permissions |
| 20 | Fix bugs critiques | J11 | Prendre en charge tous les bugs bloquants |
| 21 | Merge branches → develop | J11 | Merge toutes les branches dans l'ordre |
| 22 | Validation finale + rapport | J12 | Cocher la checklist, valider rapport Fredy |

---

### FRED — Développeur Backend

**Rôle :** Fred est sur le backend avec Miguel. Il prend en charge le Django Admin, les serializers CRUD, les imports ouvriers/œuvres, les exports, et les tests.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Lecture projet + Setup | J1 | Lire ROADMAP, Master Prompt, analyse ancienne version. Configurer Django Admin pour accounts. |
| 2 | Enregistrement admin Django tous modèles | J2 | `GISModelAdmin` pour Paroisse, admin standard pour les autres. `list_display`, `list_filter`, `search_fields` pour chaque modèle. |
| 3 | Import ouvriers Excel | J3 | `import_ouvriers.py` : normaliser grades (Ev/EV/Évangéliste → table Grade), rattacher à paroisse |
| 4 | Import œuvres Excel | J3 | `import_oeuvres.py` : dépivoter 3 feuilles (régionales, districts, paroissiales), tous les 7 types d'œuvres |
| 5 | Serializers DRF de base | J4 | `GeoFeatureModelSerializer` pour geo, serializers CRUD pour ouvriers, œuvres |
| 6 | ViewSets Ouvriers + Œuvres | J5 | CRUD complet avec filtres, action `geojson()` |
| 7 | URL routing complet | J5 | Enregistrer tous les ViewSets dans `urls.py` |
| 8 | Endpoint Export Excel | J6 | Export paroisses + ouvriers + œuvres filtrés en `.xlsx` (openpyxl) |
| 9 | Endpoint Export PDF | J6 | Rapport statistiques région en `.pdf` (WeasyPrint) |
| 10 | Endpoints Import via API | J7 | POST multipart/form-data → lancer la commande d'import → rapport JSON |
| 11 | Tests API complets | J8 | pytest : liste, détail, create, update, delete pour chaque app. Tester les permissions. |
| 12 | Vue journal d'audit | J8 | LogActivite : liste avec filtres date/utilisateur/action |
| 13 | StatistiqueAnnuelle API | J9 | ViewSet CRUD + filtrage par paroisse/année/rôle |
| 14 | Template PDF export stats | J9 | Template HTML Django (`templates/exports/rapport_region.html`) → WeasyPrint |
| 15 | Fix bugs API | J10-J11 | Corriger les bugs identifiés lors des tests |
| 16 | Couverture tests ≥ 70% | J10 | `pytest --cov=apps` → atteindre 70% |

---

### IGOR — Développeur Frontend (Auth + Structure + Admin CRUD)

**Rôle :** Igor construit le squelette du frontend : les routes, la page de connexion, le middleware d'auth, les pages admin CRUD, et l'interface d'import.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Lecture projet + Setup | J1 | Lire les 3 documents. Réfléchir à l'arborescence des pages. |
| 2 | Arborescence complète des pages | J2 | Créer tous les fichiers `page.tsx` et `layout.tsx` comme indiqué section 5 |
| 3 | Layout admin (sidebar + topbar) | J2 | Sidebar avec navigation, couleurs EEC, responsive hamburger mobile |
| 4 | Page de connexion | J3 | Formulaire login → POST API → cookie → redirect `/admin`. Gestion erreurs. |
| 5 | Fonction auth.ts | J3 | `login()`, `logout()`, `getMe()`, stockage de l'info rôle côté client |
| 6 | Middleware protection routes | J4 | `middleware.ts` : si `/admin` sans cookie session → redirect `/login` |
| 7 | Pages CRUD Paroisses | J5 | Liste paginée avec filtres + formulaire création/édition avec carte GPS |
| 8 | Pages CRUD Œuvres | J6 | Liste filtrée par type + formulaire avec tous les champs |
| 9 | Pages CRUD Ouvriers | J6 | Liste filtrée + formulaire avec sélecteur grade |
| 10 | Page statistiques annuelles | J6 | Sélecteur paroisse + année → formulaire saisie |
| 11 | Interface import Excel | J7 | Upload .xlsx → barre de progression → rapport d'import (créés/erreurs) |
| 12 | Connexion pages à l'API | J7 | `lib/api.ts` → appels vers tous les endpoints necessaires |
| 13 | Page gestion utilisateurs | J8 | (SUPER seulement) : liste admins, créer/modifier/désactiver |
| 14 | Boutons export | J9 | Boutons dans les pages paroisses/œuvres → télécharger Excel + PDF |
| 15 | Tests scénarios | J10 | Tester visiteur anonyme + Super Admin + Admin Régional |
| 16 | Fix bugs auth + routing | J11 | Corriger les bugs d'auth et de navigation |

---

### TORRES — Développeur Frontend Carte

**Rôle :** Torres est responsable de tout ce qui est carte Leaflet : WMS, WFS, marqueurs, clustering, popups, légende, zones d'influence, itinéraires.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Installation Leaflet | J1 | `npm install react-leaflet leaflet @types/leaflet leaflet.markercluster` |
| 2 | Composant `LeafletMap.tsx` de base | J2 | MapContainer centré sur Cameroun (4.5°N, 12°E), zoom 6, fond OSM |
| 3 | Import dynamique Next.js | J2 | `dynamic(() => import(...), { ssr: false })` — OBLIGATOIRE pour éviter l'erreur window |
| 4 | WMS couche régions synodales | J3 | `WMSTileLayer` → GeoServer `eec:regions_synodales`, couleurs EEC |
| 5 | WFS marqueurs paroisses | J4 | Fetch GeoServer WFS → `GeoJSON` Leaflet → cercles verts cliquables |
| 6 | Clustering des paroisses | J4 | `leaflet.markercluster` → grouper les marqueurs proches |
| 7 | WFS marqueurs œuvres | J5 | Icônes colorées par type (SCOLAIRE=jaune, MEDICALE=rouge, etc.) |
| 8 | `ParoissePopup.tsx` | J5 | Nom, district, région, communiants, non-communiants. Au clic → appel Django API. |
| 9 | `OeuvrePopup.tsx` | J5 | Nom, type (icône), niveau, statut, capacité |
| 10 | `OuvrierPopup.tsx` | J5 | Nom, grade, statut, paroisse |
| 11 | `ZonesInfluenceLayer.tsx` | J6 | Polygones WFS semi-transparents verts |
| 12 | `ItinerairesLayer.tsx` | J6 | Lignes WFS jaune tiretées entre paroisses |
| 13 | `MapLegend.tsx` | J6 | Légende complète (toutes les icônes et couleurs) |
| 14 | Connexion carte ↔ API | J7 | Au clic sur entité → récupérer détails Django API → popup enrichi |
| 15 | `LayersControl.tsx` | J8 | Checkboxes activer/désactiver chaque couche indépendamment |
| 16 | CQL_FILTER GeoServer | J8 | Passer les filtres de SearchBar vers GeoServer via paramètre URL |
| 17 | Responsive mobile carte | J9 | `height: 100dvh` mobile, popups en bottom-sheet, filtres en drawer |
| 18 | Tests carte | J10 | Zoom niveaux 4-16, clustering, basculer couches, CQL filter, mobile |
| 19 | Fix bugs carte | J11 | Corriger les bugs identifiés |

---

### KUSO — Développeur Frontend UI + Dashboard

**Rôle :** Kuso crée tous les composants UI, le dashboard statistiques, la landing page institutionnelle, et la barre de recherche.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Installation shadcn/ui | J1 | `npx shadcn@latest init` — style Default, TypeScript, CSS variables |
| 2 | Palette EEC Tailwind | J1 | Configurer les couleurs EEC dans `tailwind.config.ts` |
| 3 | Composants shadcn | J2 | `npx shadcn add button card badge input select table dialog alert` |
| 4 | `StatCard.tsx` | J2 | Carte de statistique : icône + valeur + libellé + couleur EEC |
| 5 | `SearchBar.tsx` | J3 | Barre de recherche avec filtres déroulants (région, district, type) |
| 6 | `HierarchyBreadcrumb.tsx` | J3 | Fil d'Ariane : National → Région → District → Paroisse |
| 7 | Dashboard layout + StatCards connectés | J4 | Grille de 4 StatCards branchées sur `GET /api/v1/stats/global/` |
| 8 | `RegionPanel.tsx` | J5 | Panneau latéral : nom région, nb paroisses, nb ouvriers, nb œuvres |
| 9 | Dashboard stats avancées | J6 | Top 10 paroisses fidèles + Top 10 oeuvres + Scores performance |
| 10 | Toast notifications | J7 | Retour d'action pour l'admin (succès/erreur sur CRUD, import, export) |
| 11 | Recherche connectée à l'API | J7 | Debounce 300ms → appel `GET /api/v1/geo/paroisses/?search=X` |
| 12 | Landing page complète | J8 | Header + Hero + Stats globales + Bureau National + Carte + Footer |
| 13 | `BureauNational.tsx` | J8 | Grid photos : Président, VP (×3), Secrétaires (×4), Trésorier |
| 14 | Pages admin finales | J9 | Breadcrumb dynamique, statistiques avancées affichées |
| 15 | Tests UI + WCAG | J10 | Vérifier contraste ≥ 4.5:1 avec axe DevTools. Zones ≥ 44px. |
| 16 | Fix bugs UI | J11 | Corriger les incohérences visuelles |

---

### FREDY — Développeur Frontend (Exports UI + Responsive) + Rédacteur Rapport

**Rôle :** Fredy gère le responsive design sur toutes les pages, les boutons d'export dans l'interface, et rédige le rapport d'analyse et conception tout au long du projet.

| # | Tâche | Jour | Description |
|---|-------|------|-------------|
| 1 | Début rapport — Contexte + Résumé | J1 | Page de garde, résumé exécutif, contexte EEC, problématique |
| 2 | Rapport § Architecture | J2 | Stack technique, justification des choix, schéma des services |
| 3 | Rapport § Données sources | J3 | Analyse Excel + Shapefile, problèmes identifiés, solutions |
| 4 | Rapport § Modèles de données | J4 | Diagramme entité-association, description de chaque modèle |
| 5 | Rapport § API et sécurité | J5 | Endpoints, auth sessions, RBAC, OWASP |
| 6 | Rapport § Fonctionnalités | J6 | Carte, admin, statistiques, zones, itinéraires |
| 7 | Rapport § GeoServer | J7 | WMS/WFS, styles SLD, couches publiées |
| 8 | Rapport § Tests | J8 | Stratégie de tests, scénarios, résultats |
| 9 | Responsive toutes les pages | J9 | Tester et corriger sur 375px (mobile) et 768px (tablette) |
| 10 | Boutons export dans admin | J9 | Intégrer les boutons "Export Excel" et "Export PDF" dans les pages admin (avec Fred) |
| 11 | Tests responsive | J10 | Tester TOUTES les pages sur mobile, tablette, desktop |
| 12 | Rapport § Plan de déploiement | J10 | Serveur, Nginx, HTTPS, procédure de migration |
| 13 | Rapport finalisation | J11 | Compléter les sections manquantes, mise en page finale |
| 14 | Rapport remise à Miguel | J12 | Livrer rapport complet pour relecture et validation |

---

## 10. TABLEAU RÉCAPITULATIF FINAL — TÂCHES PAR PERSONNE

Ce tableau est le résumé rapide que chaque membre peut consulter pour savoir ce qu'il fait.

### MIGUEL
```
J1  : Audit données + Branches Git + Copie photos Bureau National
J2  : Tous les modèles Django (14 modèles) + Signals audit
J3  : Import régions shapefile + Import paroisses Excel
J4  : Configuration GeoServer complète (workspace, couches, styles, sécurité)
J5  : RBAC permissions + API auth + ViewSets GEO
J6  : Endpoints statistiques avancées (top 10, scores, global)
J7  : CORS/CSRF + Client API frontend (api.ts)
J8  : 2FA TOTP + API journal audit + CODE REVIEW toutes les branches
J9  : Optimisation Redis cache + Vue PostGIS simplifiée
J10 : Tests sécurité (OWASP checklist)
J11 : Fix bugs critiques + Merge toutes les branches dans develop
J12 : Validation finale (checklist) + Validation rapport
```

### FRED
```
J1  : Setup + Admin Django accounts
J2  : Enregistrement admin Django pour TOUS les modèles
J3  : Import ouvriers Excel + Import œuvres Excel (3 feuilles)
J4  : Serializers DRF base (GeoJSON + CRUD)
J5  : ViewSets Ouvriers + Œuvres + URL routing
J6  : Export Excel (openpyxl) + Export PDF (WeasyPrint)
J7  : Endpoints import Excel via API (POST multipart)
J8  : Tests pytest complets (permissions, CRUD, GeoJSON)
J9  : StatistiqueAnnuelle ViewSet + Template PDF exports
J10 : Couverture tests ≥ 70%
J11 : Fix bugs API et exports
```

### IGOR
```
J1  : Setup + Lecture docs
J2  : Arborescence pages Next.js + Layout admin (sidebar)
J3  : Page login + auth.ts
J4  : Middleware protection routes admin
J5  : Pages CRUD Paroisses (liste + formulaire)
J6  : Pages CRUD Œuvres + Ouvriers + Statistiques annuelles
J7  : Interface import Excel frontend
J8  : Page gestion utilisateurs (SUPER)
J9  : Boutons export dans pages admin
J10 : Tests scénarios utilisateur (visiteur, super admin, admin régional)
J11 : Fix bugs auth + routing
```

### TORRES
```
J1  : Installation Leaflet + exploration
J2  : Composant LeafletMap.tsx (fond OSM, import dynamique)
J3  : WMS couche régions synodales (GeoServer)
J4  : WFS marqueurs paroisses + clustering
J5  : WFS œuvres + Popups (paroisse, œuvre, ouvrier)
J6  : Zones d'influence + Itinéraires sur la carte + Légende
J7  : Connexion carte ↔ Django API (détails popup au clic)
J8  : LayersControl (activer/désactiver couches) + CQL_FILTER
J9  : Responsive carte mobile (bottom-sheet, drawer)
J10 : Tests carte (zoom, clustering, filtres, mobile)
J11 : Fix bugs carte
```

### KUSO
```
J1  : Installation shadcn/ui + palette EEC Tailwind
J2  : StatCard.tsx + composants shadcn
J3  : SearchBar.tsx + HierarchyBreadcrumb.tsx
J4  : Dashboard layout + StatCards connectés API
J5  : RegionPanel.tsx
J6  : Dashboard statistiques avancées (Top 10, scores)
J7  : Recherche connectée API (debounce) + Toast notifications
J8  : Landing page complète + BureauNational.tsx
J9  : Pages admin finales + breadcrumb dynamique
J10 : Tests UI + WCAG (contraste, zones 44px)
J11 : Fix bugs UI
```

### FREDY
```
J1  : Rapport — Page de garde, résumé exécutif, contexte
J2  : Rapport — Architecture technique
J3  : Rapport — Analyse données sources
J4  : Rapport — Modèles de données
J5  : Rapport — API et sécurité
J6  : Rapport — Fonctionnalités complètes
J7  : Rapport — GeoServer
J8  : Rapport — Tests et validation
J9  : Responsive toutes pages + Boutons export admin
J10 : Tests responsive (mobile/tablette) + Rapport déploiement
J11 : Rapport finalisation + mise en page
J12 : Livraison rapport validé à Miguel
```

---

*Document confidentiel — Projet EEC Géolocalisation — Propriété exclusive de l'Église Évangélique du Cameroun*
*Version 2 — 21 mai 2026 — Intégration complète de toutes les fonctionnalités (StatistiqueAnnuelle, ZoneInfluence, Itineraire, HistoriquePosition, TypeOeuvre complet, Bureau National, modèle d'accès visiteur/admin)*
