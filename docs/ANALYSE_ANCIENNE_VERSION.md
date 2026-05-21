# ANALYSE DE L'ANCIENNE VERSION — Plateforme GeoEEC
## Recensement complet des fonctionnalités

**Analysé le :** 21 mai 2026  
**Source :** `d:/Academique/geoeec_ancienne_version/PFE/`  
**Objectif :** Recenser les fonctionnalités existantes et comparer avec la nouvelle version planifiée.  
**Règle :** Ce document n'influence PAS la conception de la nouvelle version.

---

## 1. STACK TECHNIQUE DE L'ANCIENNE VERSION

| Couche | Technologie | Notes |
|--------|-------------|-------|
| Backend | Django 5.2.1 (sans Docker) | Standalone, Python direct |
| Auth | **JWT** (djangorestframework-simplejwt) | ⚠️ Différent de la nouvelle version (sessions) |
| API docs | drf-yasg (Swagger + Redoc) | `/swagger/`, `/redoc/` |
| Carte front | **Leaflet** (react-leaflet) | Identique |
| Régions SHP | **GeoJSON statique** dans `public/` | Pas GeoServer, pas PostGIS pour les régions |
| AI/Chatbot | **Ollama phi3:mini + LangChain + FAISS** | ⚠️ Fonctionnalité majeure — voir section 6 |
| Export PDF | xhtml2pdf | Différent de WeasyPrint (nouveau) |
| Import | pandas + openpyxl | |
| Frontend | Next.js (Pages Router) | |
| UI | shadcn/ui | Identique |
| Pas de : | Docker, GeoServer, Redis, PostGIS pour régions | |

---

## 2. APPLICATIONS BACKEND (Django)

L'ancienne version a **9 applications Django** :

| App | Rôle |
|-----|------|
| `paroisses` | Modèle Paroisse simple (strings pour région/district) |
| `oeuvres` | Modèle Oeuvre avec types et niveaux |
| `ouvriers` | Modèle Ouvrier |
| `users` | Modèle User avec 4 rôles |
| `cartographie` | Vues statistiques + GeoJSON (pas GeoServer) |
| `statistiques` | Statistiques avancées + export PDF |
| `import_export` | Import Excel paroisses + ouvriers + oeuvres |
| `export` | Export PDF/Excel |
| `chatbot` | **Chatbot IA avec Ollama + LangChain + FAISS** |

---

## 3. MODÈLES DE DONNÉES (ancienne version)

### 3.1 Modèles principaux (cartographie/models.py)

**Region** (région synodale) :
- `nom` (unique), `code`, `description`, `date_creation`
- Propriétés calculées : `total_paroisses`, `total_fideles`

**District** :
- `nom`, `code`, FK `region`, `description`, `date_creation`

**Paroisse** (version riche, cartographie/models.py) :
- `nom`, `quartier`, `niveau` (paroisse/station/annexe)
- FK `region`, FK `district`
- Statistiques : `communiants`, `non_communiants`, `ouvriers`
- `localisation` (PointField), `adresse`
- `date_creation`, `actif`

**Grade** (grade des ouvriers) :
- `nom` (unique), `niveau`, `description`

**Ouvrier** :
- `nom`, `prenom`, FK `grade`, FK `paroisse`
- `date_naissance`, `date_ordination`, `statut` (actif/retraité/suspendu/décédé)
- `telephone`, `email`, `localisation`, `adresse`

**TypeOeuvre** :
- `nom` (unique), `icone`, `couleur` (hex), `description`

**Oeuvre** :
- `nom`, FK `type_oeuvre`, `niveau` (paroissial/district/régional/national)
- FK `paroisse`, `description`, `capacite`, `budget_annuel`
- `statut` (active/en_construction/suspendue/fermée)
- `localisation`, `adresse`, `date_creation`, `date_inauguration`

**StatistiqueAnnuelle** ← ⚠️ Modèle absent du plan actuel :
- FK `paroisse`, `annee`
- `communiants`, `non_communiants`
- `baptemes`, `confirmations`, `mariages`, `deces`
- `offrandes`, `dimes` (financier)
- `validee`, `date_saisie`

**ZoneInfluence** ← ⚠️ Modèle absent du plan actuel :
- FK `paroisse`, `geometrie` (PolygonField)
- `rayon_km`, `population_estimee`, `description`, `active`

**Itineraire** ← ⚠️ Modèle absent du plan actuel :
- FK `paroisse_depart`, FK `paroisse_arrivee`
- `geometrie` (LineStringField), `distance_km`, `duree_minutes`
- `type_transport` (pied/vélo/moto/voiture/transport public)
- `difficulte` (facile/moyen/difficile)

**HistoriquePosition** ← ⚠️ Modèle absent du plan actuel :
- `type_objet`, `objet_id`, `ancienne_position`, `nouvelle_position`
- `raison_changement`, `utilisateur`, `date_changement`

### 3.2 Modèle User (users/models.py)
```
Rôles : admin_general | admin_regional | utilisateur_auth | visiteur
```
⚠️ Différent de la nouvelle version (SUPER/REGION/DISTRICT/PAROISSE)

---

## 4. FONCTIONNALITÉS BACKEND RECENSÉES

### 4.1 API REST — Endpoints disponibles

**Paroisses** (`/api/paroisses/`) :
- CRUD complet (liste, détail, créer, modifier, supprimer)
- Import Excel via `/api/import-paroisses/`

**Ouvriers** (`/api/ouvriers/`) :
- CRUD complet
- Import Excel via `/api/import-ouvriers/`

**Œuvres** (`/api/oeuvres/`) :
- CRUD complet
- Import Excel via `/api/import-oeuvres/` (3 feuilles : régionales, districts, paroissiales)

**Authentification** :
- `POST /api/auth/register/` — inscription
- `POST /api/auth/login/` — JWT token pair
- `POST /api/auth/refresh/` — renouvellement token

**Cartographie** (`/api/cartographie/`) :
- `GET /statistics/` — statistiques globales (avec filtres région/district/type)
- `GET /layers/` — GeoJSON de toutes les couches (paroisses, œuvres, ouvriers)
- `GET /search/` — recherche multicritère
- `GET /regions/` — liste des régions
- `GET /districts/` — liste des districts
- `GET /oeuvre-types/` — liste des types d'œuvres

**Statistiques** (`/api/statistiques/`) :
- Statistiques détaillées : par région, district, niveau, type d'œuvre
- Analyses avancées : top 10 paroisses fidèles, top 10 paroisses œuvres
- Score de performance par région (algorithme personnalisé)
- Corrélations (fictives pour le moment)
- Export PDF des statistiques

**Import** (`/api/import-*`) :
- Import paroisses Excel — gère Coord_x/Coord_y ✅
- Import ouvriers Excel
- Import œuvres Excel — 3 feuilles pivot dépivotées ✅

**Chatbot** (`/api/chatbot/ask/`) :
- Requête POST avec `question`
- Réponse du modèle Ollama phi3:mini
- Contexte : données des paroisses, œuvres, ouvriers selon la question

**Documentation API** :
- Swagger UI : `/swagger/`
- Redoc : `/redoc/`
- JSON schema : `/swagger.json`

### 4.2 Import Excel — Logique de dépivoter des œuvres

L'ancienne version gère déjà les 3 feuilles de `Recap_oeuvres_EEC_2025.xlsx` :
- `Oeuvres_regionales` — colonnes pivotées (Point_X, Point_Y, type)
- `Oeuvres_districts` — idem
- `Oeuvres_paroissiales` — idem avec colonne `P_X` (différente!)

**Types d'œuvres normalisés dans l'ancienne version :**
- `scolaire` → SCOLAIRE
- `universitaire` → UNIVERSITAIRE ← existe dans l'ancienne, pas mentionné dans le nouveau plan
- `médicale` → MEDICALE
- `agropastorale` → AGROPASTORALE
- `immeuble` → IMMEUBLE ← à vérifier si existe dans les données
- `terrain` → TERRAIN ← à vérifier si existe dans les données
- `autre` → AUTRE

---

## 5. FONCTIONNALITÉS FRONTEND RECENSÉES

### 5.1 Pages

| Route | Contenu |
|-------|---------|
| `/` | Page d'accueil principale avec carte Leaflet et sidebar |
| `/dashboard` | Dashboard général avec statistiques |
| `/dashboard/map` | Carte cartographique complète (CartographyDashboard) |
| `/dashboard/chat` | **Interface chatbot IA** ← ⚠️ Absent du plan actuel |
| `/dashboard/import` | Interface d'import de fichiers Excel |
| `/dashboard/resources` | Page ressources |
| `/dashboard/statistics` | Dashboard statistiques avancées |
| `/dashboard/users` | Gestion des utilisateurs |

### 5.2 Composants principaux

| Composant | Rôle |
|-----------|------|
| `InteractiveMap.tsx` | Carte Leaflet principale avec toutes les couches |
| `MapControls.tsx` | Panneaux de filtres (région, district, type) |
| `MapLegend.tsx` | Légende des types d'entités |
| `leaflet-map.tsx` | Wrapper Leaflet compatible Next.js SSR |
| `paroisse-modal.tsx` | Popup détail d'une paroisse |
| `oeuvre-modal.tsx` | Popup détail d'une œuvre |
| `ouvrier-modal.tsx` | Popup détail d'un ouvrier |
| `login-modal.tsx` | Modal de connexion |
| `sidebar.tsx` | Navigation latérale |
| `performance-monitor.tsx` | **Moniteur de performance temps réel** |
| `relation-visualizer.tsx` | **Visualiseur de relations entre entités** |
| `terms-modal.tsx` | Modal mentions légales |
| `api-status-banner.tsx` | Bannière état de l'API |

### 5.3 Hooks personnalisés

| Hook | Rôle |
|------|------|
| `useApi.ts` | Client API générique |
| `useCartographyApi.ts` | Appels API cartographie |
| `useCartographyData.ts` | Gestion données cartographiques |
| `useMapPerformance.ts` | Métriques de performance de la carte |
| `use-statistics.ts` | Statistiques |

### 5.4 Assets présents (photos Bureau National)

Déjà présents dans l'ancienne version :
- `public/logoEEC.png` — Logo officiel EEC ✅
- `public/president.png` — Photo du Président
- `public/vp.png`, `vp2.png`, `vp3.png` — Photos Vice-Présidents
- `public/se.png`, `se2.png`, `se3.png`, `se4.png` — Secrétaires
- `public/tre.png` — Trésorier
- `public/cameroon-outline.svg` — Contour du Cameroun

Ces assets **existent déjà** et devront être récupérés pour la nouvelle version.

### 5.5 GeoJSON des régions synodales (données statiques)

L'ancienne version stocke les polygones des régions comme **fichier GeoJSON statique** dans le frontend :
`public/geojson_file/Region_synodale_ok.geojson`

La nouvelle version publiera ces mêmes polygones via **GeoServer (WMS)** depuis PostGIS — approche correcte et standardisée.

---

## 6. FONCTIONNALITÉ CHATBOT IA — ANALYSE DÉTAILLÉE

C'est la fonctionnalité la plus originale de l'ancienne version, **absente du plan actuel**.

**Technologie utilisée :**
- `Ollama` (serveur LLM local) avec modèle `phi3:mini`
- `LangChain` pour l'orchestration
- `FAISS` pour les index vectoriels (recherche sémantique)
- Vectorstores pré-construits pour paroisses, œuvres, ouvriers

**Fonctionnement :**
1. L'utilisateur pose une question en français
2. Le backend détecte si c'est sur les paroisses, œuvres ou ouvriers
3. Il charge les données pertinentes depuis la BD
4. Il construit un contexte et interroge phi3:mini via Ollama
5. Il retourne la réponse en français

**Exemple de capacités :**
- "Combien de paroisses dans la région Bamiléké ?"
- "Quel est l'ouvrier rattaché à la paroisse X ?"
- "Liste les œuvres scolaires du district Y"

**⚠️ Note :** Le cahier des charges ne mentionne pas de chatbot. Cette fonctionnalité était probablement expérimentale. Elle n'est pas dans le plan actuel et c'est une décision correcte pour respecter les 12 jours.

---

## 7. VERDICT — COMPARAISON ANCIENNE VERSION vs NOUVELLE VERSION

### 7.1 Ce qui est parfaitement aligné ✅

| Fonctionnalité | Ancienne | Nouvelle |
|----------------|----------|---------|
| Carte Leaflet interactive | ✅ | ✅ |
| Affichage paroisses sur carte | ✅ | ✅ |
| Affichage œuvres (types différenciés) | ✅ | ✅ |
| Affichage ouvriers | ✅ | ✅ |
| Popup détail au clic | ✅ | ✅ |
| Filtres région/district/type | ✅ | ✅ |
| Recherche multicritère | ✅ | ✅ |
| Statistiques par région | ✅ | ✅ |
| Import Excel paroisses | ✅ | ✅ |
| Import Excel ouvriers | ✅ | ✅ |
| Import Excel œuvres (3 feuilles) | ✅ | ✅ |
| Export PDF | ✅ | ✅ |
| Django Admin | ✅ | ✅ |
| 4 rôles utilisateurs | ✅ | ✅ |
| CRUD paroisses/œuvres/ouvriers | ✅ | ✅ |
| Légende dynamique | ✅ | ✅ |
| shadcn/ui | ✅ | ✅ |
| Logo et photos Bureau National | ✅ | ✅ (à récupérer) |
| Hiérarchie National→Région→District→Paroisse | ✅ | ✅ |

### 7.2 Ce que la nouvelle version apporte EN PLUS 🚀

| Fonctionnalité | Ancienne | Nouvelle |
|----------------|----------|---------|
| GeoServer (WMS/WFS standardisé) | ❌ | ✅ |
| Redis (cache + sessions) | ❌ | ✅ |
| Docker Compose (5 services) | ❌ | ✅ |
| Sessions sécurisées (vs JWT) | ❌ | ✅ |
| 2FA TOTP pour admins | ❌ | ✅ |
| Audit trail (simple_history) | ❌ | ✅ |
| PostGIS pour régions (vs GeoJSON statique) | ❌ | ✅ |
| Tailwind v4 + identité visuelle EEC complète | partiel | ✅ |
| WCAG 2.1 AA accessibilité | ❌ | ✅ |
| Rate limiting API | ❌ | ✅ |
| Styles SLD (couleurs EEC sur carte) | ❌ | ✅ |

### 7.3 Ce que l'ancienne version avait mais qui N'EST PAS dans le plan actuel ⚠️

| Fonctionnalité | Décision recommandée |
|----------------|---------------------|
| **Chatbot IA (phi3:mini + FAISS)** | ❌ Hors périmètre 12 jours. Feature avancée, non demandée dans le cahier des charges. |
| **StatistiqueAnnuelle** (baptêmes, mariages, décès, offrandes) | À évaluer selon les données réelles. Peut être ajouté après le déploiement. |
| **ZoneInfluence** (polygone autour d'une paroisse) | Non demandé dans le cahier des charges. Feature bonus possible. |
| **Itineraire** (routes entre paroisses) | Non demandé. Feature bonus possible. |
| **HistoriquePosition** | Partiellement couvert par simple_history. |
| **RelationVisualizer** component | Non demandé. |
| **PerformanceMonitor** component | Non demandé. |
| **TypeOeuvre Universitaire, Immeuble, Terrain** | À valider lors de l'audit des données réelles. |

### 7.4 Points importants à récupérer de l'ancienne version

1. **Les photos du Bureau National** (president.png, vp.png, se.png, tre.png, etc.)
   → À copier dans `frontend/public/` de la nouvelle version.

2. **La logique d'import des œuvres** (dépivoter les 3 feuilles)
   → L'ancienne version a déjà résolu ce problème. S'en inspirer pour la commande `import_oeuvres.py`.

3. **La logique d'import des paroisses** (Coord_x=lat, Coord_y=lon)
   → Déjà correctement gérée dans l'ancienne version avec `Point(float(longitude), float(latitude))`.

4. **Le GeoJSON des régions** (`public/geojson_file/Region_synodale_ok.geojson`)
   → Ce fichier contient les polygones déjà prêts. Peut servir de référence pour vérifier que l'import du Shapefile donne les mêmes résultats.

---

## 8. CONCLUSION

**La nouvelle version est en parfait accord avec l'ancienne version** sur toutes les fonctionnalités essentielles demandées par le cahier des charges. Rien d'important n'a été oublié.

La nouvelle version est **supérieure** techniquement sur tous les points : GeoServer pour la publication cartographique standardisée, Docker pour l'isolation, Redis pour les performances, sessions sécurisées vs JWT, audit trail, accessibilité.

**L'unique fonctionnalité notable présente dans l'ancienne version et absente du plan actuel est le chatbot IA.** C'est une décision correcte dans le cadre des 12 jours — cette feature peut être envisagée dans une version ultérieure si l'EEC le demande.

**Action immédiate recommandée :** Récupérer les photos du Bureau National (`president.png`, `vp.png`, `se.png`, `tre.png`, etc.) depuis l'ancienne version vers `frontend/public/` de la nouvelle version — ces assets sont déjà prêts.

---

*Document confidentiel — Projet EEC Géolocalisation — Propriété exclusive de l'Église Évangélique du Cameroun*
