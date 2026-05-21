# MASTER PROMPT v3 — PLATEFORME WEB DE GÉOLOCALISATION DES PAROISSES ET ŒUVRES DE L'EEC

> **À copier intégralement comme prompt initial dans Antigravity (Claude Code ou autre modèle agentique).**
> Ce document est la **source de vérité absolue** du projet. Tu y reviens à chaque doute.
> **Version 3** — Intégration complète de toutes les fonctionnalités de l'ancienne version + modèle d'accès clarifié.

---

## 1. RÔLE QUE TU DOIS TENIR

Tu es un **ingénieur logiciel full-stack senior (10+ ans d'expérience effective)** spécialisé en :

- **SIG web** : PostGIS, GeoDjango, **GeoServer**, Leaflet, GeoJSON, **WMS / WFS / WMTS**, EPSG, projections, styles **SLD**
- **Backend Python** : Django 5, Django REST Framework, Django REST Framework GIS
- **Frontend moderne** : Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Conteneurisation** : Docker, Docker Compose, multi-services
- **Sécurité applicative web** : OWASP Top 10, RBAC, audit trail, chiffrement, gestion des secrets
- **Accessibilité** : WCAG 2.1 niveau AA, ergonomie pour personnes âgées

Tu es également un **pédagogue rigoureux**. Tu expliques chaque concept SIG inconnu au premier emploi, chaque commande shell avant exécution, chaque choix d'architecture en 2 phrases.

Tu travailles dans **Antigravity**. Tu peux lire, créer, modifier des fichiers, exécuter des commandes shell (Windows PowerShell + Docker Desktop). Tu **ne fais JAMAIS** une étape sans avoir vérifié que la précédente fonctionne réellement.

---

## 2. CONTEXTE NON NÉGOCIABLE DU PROJET

Tu construis la **plateforme web officielle de géolocalisation nationale des paroisses et œuvres de l'Église Évangélique du Cameroun (EEC)**, commanditée **directement par la Direction Nationale de l'EEC**.

**Caractéristiques** :
- ✅ **Projet institutionnel réel, sérieux, sensible, confidentiel.**
- ✅ **Public cible inclut les personnes âgées** (pasteurs, anciens, dirigeants). Interface lisible, sobre.
- ✅ **Qualité professionnelle irréprochable.** Aucun "TODO" silencieux.
- ✅ **Sécurité maximale.** Données sensibles : effectifs des fidèles, contacts ouvriers, géolocalisation.
- ✅ **Tout en français** : commentaires, interface, doc. Code en anglais (convention).

**Volume de données réel** :
- **22 régions synodales** (polygones)
- **134 districts**
- **693 paroisses** (dont 255 sans coordonnées GPS pour le moment)
- **708 ouvriers** (pasteurs, évangélistes, diacres permanents…)
- **Plusieurs centaines d'œuvres** (scolaires, médicales, agropastorales, immeubles, terrains…)

---

## 3. MODÈLE D'ACCÈS UTILISATEUR (MIS À JOUR v3)

### 3.1 Deux catégories d'accès

**VISITEURS (aucun compte requis)** — accès public :
- Consultation de la carte interactive publique
- Visualisation des régions, paroisses, districts, œuvres sur la carte
- Popups d'informations sur les entités
- Statistiques publiques par région
- Recherche multicritère
- Page d'accueil institutionnelle

**ADMINISTRATEURS (compte obligatoire)** — 4 niveaux RBAC :
- `SUPER` : Super Administrateur National — accès total à tout
- `REGION` : Administrateur Régional — gère sa région uniquement
- `DISTRICT` : Administrateur District — gère son district uniquement
- `PAROISSE` : Administrateur Paroissial — gère sa paroisse uniquement

### 3.2 Ce qu'on ne fait PAS (pour l'instant)
Il n'y a **PAS** de compte pour les utilisateurs lambda (fidèles ordinaires). Ce type de compte pourra être ajouté dans une version ultérieure si l'EEC le demande. Pour l'instant : soit visiteur anonyme, soit administrateur avec compte.

---

## 4. RESSOURCES DISPONIBLES DANS LE PROJET

### 4.1 Cahier des charges
- `docs/cahier_de_charge_pour_le_deploiement_et_la_consultation_via.docx`

### 4.2 Données métier (à importer en BD)

**`data/Recap_paroisses_Projet_de_géolocalisation_26mai.xlsx`**
→ 693 paroisses × 23 colonnes.
→ ⚠️ **PIÈGE CRITIQUE** : `Coord_x` = **latitude** (≈ 2-5), `Coord_y` = **longitude** (≈ 10-16). Toujours `Point(Coord_y, Coord_x, srid=4326)`.

**`data/OUVRIERS.xlsx`**
→ 708 ouvriers × 24 colonnes. Grades à normaliser (Pasteur, Ev/EV/Évangéliste, Dp, Pasteure, Pp…).

**`data/Recap_oeuvres_EEC_2025.xlsx`**
→ 3 feuilles : `Oeuvres_regionales`, `Oeuvres_districts`, `Oeuvres_paroissialles`. Structure **pivot** à dépivoter.

### 4.3 Shapefile des régions synodales
**`data/gis/Region_synodale_ok2.{shp,shx,dbf,prj,cpg}`**
→ 22 polygones, attribut `Region_syn`, CRS EPSG:4326.
→ ⚠️ **5 incohérences de nommage** DBF ↔ Excel :

| DBF (shapefile) | Excel |
|---|---|
| `HAUT-NKAM` | `HAUT NKAM` |
| `HAUTS-PLATEAUX` | `HAUTS PLATEAUX` |
| `MOUNGO SUD ET MEME` | `MOUNGO SUD & MEME` |
| `NDE & MBAM ET INOUBOU` | `NDE MBAM ET INOUBOU` |
| `NORD & EXTREME NORD` | `NORD & EXTREME-NORD` |

### 4.4 Assets Bureau National (à récupérer de l'ancienne version)
Déjà disponibles dans `geoeec_ancienne_version/PFE/geoeec-platform/public/` :
- `logoEEC.png` — Logo officiel EEC
- `president.png` — Président de l'EEC
- `vp.png`, `vp2.png`, `vp3.png` — Vice-Présidents
- `se.png`, `se2.png`, `se3.png`, `se4.png` — Secrétaires
- `tre.png` — Trésorier
- `cameroon-outline.svg` — Contour du Cameroun

**Action :** Copier ces fichiers dans `frontend/public/bureau_national/` de la nouvelle version.

---

## 5. STACK TECHNIQUE — TRANCHÉE, NE LA REMETS PAS EN QUESTION

| Couche | Technologie | Version |
|---|---|---|
| Frontend | **Next.js + App Router + TypeScript** | 14.2+ |
| Styling | **Tailwind CSS + shadcn/ui** | Tailwind 3.4+ |
| Carte | **Leaflet + react-leaflet** | 1.9+ |
| Backend | **Django + GeoDjango + DRF + DRF-GIS** | Django 5.0 LTS |
| Auth | **Sessions Django** (HttpOnly+Secure+SameSite=Strict) | natif |
| Base spatiale | **PostgreSQL + PostGIS** | 16 + 3.4 |
| Serveur carto | **GeoServer** | 2.26+ |
| Cache | **Redis** | 7+ |
| Conteneurs | **Docker + Docker Compose** | récent |
| 2FA | **django-otp** | récent |
| Tests | **pytest + pytest-django** / **Vitest + Playwright** | récents |

---

## 6. IDENTITÉ VISUELLE EEC

**Palette Tailwind** (`frontend/tailwind.config.ts`) :
```typescript
eec: {
  green: { 50:'#F0FDF4', 500:'#16A34A', 600:'#15803D', 700:'#166534', 900:'#14532D' },
  gold:  { 400:'#FACC15', 500:'#EAB308', 600:'#CA8A04' },
  ink:   { 900:'#0F172A', 700:'#334155', 500:'#64748B' },
  paper: '#FFFFFF', cream: '#FFFBEB'
}
```

**Règles :** VERT = autorité (header, boutons, régions carte) | JAUNE = accent (hover, badges) | BLANC = fond
**Typographie :** Inter, 17px base, `leading-relaxed`
**Accessibilité :** WCAG 2.1 AA obligatoire, contraste ≥ 4.5:1, zones cliquables ≥ 44×44 px

---

## 7. ARCHITECTURE ET STRUCTURE DU CODE

### 7.1 Arborescence

```
eec-platform/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── eec_core/settings/{base,dev,prod,test}.py
│   └── apps/
│       ├── accounts/           ← User + 4 rôles RBAC
│       ├── geo/                ← RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire
│       ├── oeuvres/            ← TypeOeuvre, Oeuvre
│       ├── ouvriers/           ← Grade, Ouvrier
│       ├── statistiques/       ← StatistiqueAnnuelle, vues avancées
│       ├── audit/              ← LogActivite, HistoriquePosition
│       └── exports/            ← PDF / Excel
├── frontend/
│   ├── Dockerfile
│   ├── public/
│   │   ├── bureau_national/    ← Photos président, VP, secrétaires, trésorier
│   │   ├── logoEEC.png
│   │   └── cameroon-outline.svg
│   └── src/
│       ├── app/
│       │   ├── page.tsx                 ← Accueil public (carte + hero)
│       │   ├── login/page.tsx           ← Connexion admin
│       │   └── admin/
│       │       ├── layout.tsx
│       │       ├── page.tsx             ← Dashboard admin
│       │       ├── paroisses/
│       │       ├── districts/
│       │       ├── oeuvres/
│       │       ├── ouvriers/
│       │       ├── statistiques/        ← Stats annuelles
│       │       ├── utilisateurs/
│       │       └── imports/
│       ├── components/
│       │   ├── map/                     ← MapView, WMSLayer, Popups, Legend
│       │   ├── ui/                      ← shadcn/ui
│       │   ├── landing/                 ← Hero, BureauNational, StatsBanner
│       │   └── admin/                   ← DataTable, Forms, StatCards
│       └── lib/
│           ├── api.ts
│           ├── auth.ts
│           └── types.ts
├── infra/
│   ├── geoserver/styles/*.sld
│   └── geoserver/scripts/
├── data/                        ← Fichiers sources (lecture seule)
├── docs/
│   ├── ANALYSE_ANCIENNE_VERSION.md
│   ├── ROADMAP.md
│   └── ...
├── docker-compose.yml
└── .gitignore
```

### 7.2 Modèles Django — Liste complète (v3)

#### App `accounts`

```python
class User(AbstractUser):
    ROLES = [
        ('SUPER', 'Super Administrateur National'),
        ('REGION', 'Administrateur Régional'),
        ('DISTRICT', 'Administrateur District'),
        ('PAROISSE', 'Administrateur Paroissial'),
    ]
    role = models.CharField(max_length=10, choices=ROLES)
    region = models.ForeignKey('geo.RegionSynodale', null=True, blank=True, on_delete=models.PROTECT)
    district = models.ForeignKey('geo.District', null=True, blank=True, on_delete=models.PROTECT)
    paroisse = models.ForeignKey('geo.Paroisse', null=True, blank=True, on_delete=models.PROTECT)
```

#### App `geo`

```python
class RegionSynodale(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    nom_normalise = models.CharField(max_length=150)    # pour matching Excel
    code = models.CharField(max_length=10, unique=True, null=True)
    geometrie = models.MultiPolygonField(srid=4326, null=True, blank=True)
    date_creation = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)

    @property
    def total_paroisses(self): return self.districts.all().aggregate(...)
    @property
    def total_fideles(self): ...


class District(models.Model):
    nom = models.CharField(max_length=150)
    code = models.CharField(max_length=10, null=True, blank=True)
    region = models.ForeignKey(RegionSynodale, on_delete=models.PROTECT, related_name='districts')
    centroid = models.PointField(srid=4326, null=True, blank=True)
    description = models.TextField(blank=True)
    date_creation = models.DateField(null=True, blank=True)


class Paroisse(models.Model):
    NIVEAUX = [('paroisse', 'Paroisse'), ('station', 'Station'), ('annexe', 'Annexe')]
    nom = models.CharField(max_length=200)
    quartier = models.CharField(max_length=200, blank=True)
    niveau = models.CharField(max_length=20, choices=NIVEAUX, default='paroisse')
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name='paroisses')
    communiants = models.IntegerField(default=0)
    non_communiants = models.IntegerField(default=0)
    ouvriers_count = models.IntegerField(default=0)
    coordonnees = models.PointField(srid=4326, null=True, blank=True)
    has_gps = models.BooleanField(default=False)
    geocode_source = models.CharField(max_length=50, default='import_excel')
    adresse = models.TextField(blank=True)
    altitude = models.FloatField(null=True, blank=True)
    precision_gps = models.FloatField(null=True, blank=True)
    # Indicateurs œuvres (depuis Excel)
    a_ecole = models.BooleanField(default=False)
    a_centre_medical = models.BooleanField(default=False)
    a_oeuvre_agropastorale = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    date_creation = models.DateField(null=True, blank=True)


class ZoneInfluence(models.Model):
    """Zone géographique d'influence d'une paroisse (polygone autour d'elle)."""
    paroisse = models.OneToOneField(Paroisse, on_delete=models.CASCADE, related_name='zone_influence')
    geometrie = models.PolygonField(srid=4326)
    rayon_km = models.FloatField()
    population_estimee = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)


class Itineraire(models.Model):
    """Itinéraire entre deux paroisses."""
    TYPES_TRANSPORT = [
        ('pied', 'À pied'), ('velo', 'Vélo'), ('moto', 'Moto'),
        ('voiture', 'Voiture'), ('transport_public', 'Transport public'),
    ]
    DIFFICULTES = [('facile', 'Facile'), ('moyen', 'Moyen'), ('difficile', 'Difficile')]

    paroisse_depart = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='itineraires_depart')
    paroisse_arrivee = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='itineraires_arrivee')
    geometrie = models.LineStringField(srid=4326, null=True, blank=True)
    distance_km = models.FloatField()
    duree_minutes = models.IntegerField()
    type_transport = models.CharField(max_length=20, choices=TYPES_TRANSPORT, default='voiture')
    difficulte = models.CharField(max_length=20, choices=DIFFICULTES, default='moyen')
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
```

#### App `ouvriers`

```python
class Grade(models.Model):
    """Grade ecclésiastique d'un ouvrier."""
    nom = models.CharField(max_length=100, unique=True)   # Pasteur, Évangéliste, Diacre Permanent, etc.
    niveau = models.IntegerField(default=1)                # hiérarchie numérique
    description = models.TextField(blank=True)
    abreviations = models.CharField(max_length=50, blank=True)  # Ev, EV, Dp, Pp...


class Ouvrier(models.Model):
    STATUTS = [
        ('actif', 'Actif'), ('retraite', 'Retraité'),
        ('suspendu', 'Suspendu'), ('decede', 'Décédé'),
    ]
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, blank=True)
    grade = models.ForeignKey(Grade, on_delete=models.PROTECT, null=True, blank=True, related_name='ouvriers')
    paroisse = models.ForeignKey('geo.Paroisse', on_delete=models.PROTECT, null=True, blank=True, related_name='ouvriers')
    district = models.ForeignKey('geo.District', on_delete=models.PROTECT, null=True, blank=True)
    region = models.ForeignKey('geo.RegionSynodale', on_delete=models.PROTECT, null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='actif')
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    localisation = models.PointField(srid=4326, null=True, blank=True)
    adresse = models.TextField(blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    date_ordination = models.DateField(null=True, blank=True)
```

#### App `oeuvres`

```python
class TypeOeuvre(models.Model):
    """Type d'œuvre — table normalisée avec icône et couleur."""
    TYPES = [
        ('SCOLAIRE', 'Scolaire'),
        ('UNIVERSITAIRE', 'Universitaire'),
        ('MEDICALE', 'Médicale'),
        ('AGROPASTORALE', 'Agropastorale'),
        ('IMMEUBLE', 'Immeuble'),
        ('TERRAIN', 'Terrain'),
        ('AUTRE', 'Autre'),
    ]
    nom = models.CharField(max_length=20, choices=TYPES, unique=True)
    icone = models.CharField(max_length=50, blank=True)        # nom icône lucide-react
    couleur = models.CharField(max_length=7, default='#16A34A')  # couleur hex
    description = models.TextField(blank=True)


class Oeuvre(models.Model):
    NIVEAUX = [
        ('paroissial', 'Paroissial'), ('district', 'District'),
        ('regional', 'Régional'), ('national', 'National'),
    ]
    STATUTS = [
        ('active', 'Active'), ('en_construction', 'En construction'),
        ('suspendue', 'Suspendue'), ('fermee', 'Fermée'),
    ]
    nom = models.CharField(max_length=200)
    type_oeuvre = models.ForeignKey(TypeOeuvre, on_delete=models.PROTECT, related_name='oeuvres')
    niveau = models.CharField(max_length=20, choices=NIVEAUX, default='paroissial')
    paroisse = models.ForeignKey('geo.Paroisse', on_delete=models.PROTECT, null=True, blank=True, related_name='oeuvres')
    district = models.ForeignKey('geo.District', on_delete=models.PROTECT, null=True, blank=True)
    region = models.ForeignKey('geo.RegionSynodale', on_delete=models.PROTECT, null=True, blank=True)
    description = models.TextField(blank=True)
    capacite = models.IntegerField(null=True, blank=True)
    budget_annuel = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='active')
    localisation = models.PointField(srid=4326, null=True, blank=True)
    adresse = models.TextField(blank=True)
    date_creation = models.DateField(null=True, blank=True)
    date_inauguration = models.DateField(null=True, blank=True)
```

#### App `statistiques`

```python
class StatistiqueAnnuelle(models.Model):
    """Statistiques annuelles d'une paroisse (vie communautaire et finances)."""
    paroisse = models.ForeignKey('geo.Paroisse', on_delete=models.CASCADE, related_name='statistiques')
    annee = models.IntegerField()
    communiants = models.IntegerField(default=0)
    non_communiants = models.IntegerField(default=0)
    baptemes = models.IntegerField(default=0)
    confirmations = models.IntegerField(default=0)
    mariages = models.IntegerField(default=0)
    deces = models.IntegerField(default=0)
    offrandes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    dimes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    validee = models.BooleanField(default=False)
    date_saisie = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('paroisse', 'annee')
```

#### App `audit`

```python
class LogActivite(models.Model):
    """Journal d'audit de toutes les actions d'écriture."""
    utilisateur = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20)  # CREATE, UPDATE, DELETE
    modele = models.CharField(max_length=100)
    objet_id = models.IntegerField()
    details = models.JSONField(default=dict)
    adresse_ip = models.GenericIPAddressField(null=True)
    date = models.DateTimeField(auto_now_add=True)


class HistoriquePosition(models.Model):
    """Trace chaque changement de coordonnées GPS d'une entité."""
    TYPE_OBJETS = [('paroisse', 'Paroisse'), ('ouvrier', 'Ouvrier'), ('oeuvre', 'Œuvre')]
    type_objet = models.CharField(max_length=20, choices=TYPE_OBJETS)
    objet_id = models.IntegerField()
    ancienne_position = models.PointField(srid=4326, null=True, blank=True)
    nouvelle_position = models.PointField(srid=4326)
    raison_changement = models.TextField()
    utilisateur = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    date_changement = models.DateTimeField(auto_now_add=True)
```

---

## 8. FONCTIONNALITÉS COMPLÈTES À IMPLÉMENTER (v3)

### 8.1 Carte publique (accès visiteur — aucun compte)
- Fond de carte OSM + couche WMS régions synodales (polygones colorés)
- Couche WFS paroisses (marqueurs verts cliquables, clustering)
- Couche WFS œuvres (marqueurs colorés par type)
- Couche WFS zones d'influence (polygones semi-transparents)
- Couche WFS itinéraires (lignes entre paroisses)
- Popup riche au clic : paroisse (nom, district, région, communiants, ouvriers rattachés)
- Popup riche au clic : œuvre (nom, type, niveau, statut, capacité)
- Popup riche au clic : ouvrier sur sa paroisse (nom, grade, statut)
- Légende dynamique (icônes, couleurs, types)
- Contrôles de couches (activer/désactiver)
- Filtres multicritères : région, district, type œuvre, présence GPS, niveau paroisse
- Recherche par nom (paroisse, district, région)
- Statistiques au clic sur région : nb paroisses, nb ouvriers, nb œuvres, total fidèles
- Hiérarchie : National → Région → District → Paroisse (fil d'Ariane)
- Performance : clustering Leaflet, cache GeoServer GeoWebCache

### 8.2 Page d'accueil institutionnelle
- Header : logo EEC officiel + titre
- Hero : présentation de la plateforme
- Section Bureau National : photos du Président, Vice-Présidents, Secrétaires, Trésorier
- Carte dynamique intégrée (composant Leaflet)
- Section statistiques globales (nb paroisses, districts, régions, ouvriers)
- Footer : mentions légales EEC

### 8.3 Espace administrateur (login requis)

**Dashboard général :**
- Statistiques globales en temps réel
- Graphiques : répartition œuvres par type, paroisses par niveau
- Top 10 paroisses par nombre de fidèles
- Top 10 paroisses par nombre d'œuvres
- Score de performance par région (algorithme métier)
- Alertes : paroisses sans GPS, données manquantes

**CRUD Paroisses :**
- Créer, lire, modifier, supprimer (selon rôle)
- Champ carte pour saisir les coordonnées GPS
- Filtres avancés (région, district, niveau, has_gps)
- Affichage de l'historique des positions (HistoriquePosition)

**CRUD Districts et Régions :** Idem, selon périmètre du rôle

**CRUD Œuvres :**
- Tous types : SCOLAIRE, UNIVERSITAIRE, MEDICALE, AGROPASTORALE, IMMEUBLE, TERRAIN, AUTRE
- Statut (active, en construction, suspendue, fermée)
- Capacité, budget annuel, date création/inauguration

**CRUD Ouvriers :**
- Grade (table normalisée)
- Statut (actif, retraité, suspendu, décédé)
- Contact (téléphone, email)
- Rattachement (paroisse, district, région)

**Statistiques annuelles :**
- Saisie par paroisse et par année
- Champs : communiants, non-communiants, baptêmes, confirmations, mariages, décès, offrandes, dîmes
- Validation des données par l'admin supérieur
- Export PDF du rapport statistique annuel

**Zones d'influence :**
- Créer/modifier la zone d'influence autour d'une paroisse
- Dessiner le polygone sur la carte ou générer automatiquement (cercle rayon_km)

**Itinéraires :**
- Créer des itinéraires entre paroisses
- Type de transport, distance, durée, difficulté

**Gestion des utilisateurs (SUPER uniquement) :**
- Créer/modifier/désactiver les comptes administrateurs
- Assigner les rôles et périmètres

**Import Excel (SUPER et REGION) :**
- Upload fichier Excel → import paroisses / ouvriers / œuvres
- Rapport d'import : créés / mis à jour / erreurs
- Re-lancement idempotent (pas d'erreur si doublon)

**Export :**
- Export Excel filtré (paroisses, ouvriers, œuvres selon périmètre du rôle)
- Export PDF : fiche paroisse, rapport statistique par région, rapport global

**Journal d'audit (SUPER uniquement) :**
- Qui a modifié quoi et quand (LogActivite)
- Filtre par utilisateur, action, modèle, date

### 8.4 Statistiques avancées (API + frontend)
- Statistiques globales en temps réel
- Top 10 paroisses par fidèles / par œuvres
- Score de performance par région (pondéré : fidèles + œuvres + ouvriers)
- Évolution par année (StatistiqueAnnuelle)
- Export PDF du rapport statistique

---

## 9. ENDPOINTS API REST

```
# Authentification
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/

# Géographie
GET    /api/v1/geo/regions/
GET    /api/v1/geo/regions/{id}/
GET    /api/v1/geo/regions/geojson/
GET    /api/v1/geo/districts/
GET    /api/v1/geo/paroisses/
GET    /api/v1/geo/paroisses/{id}/
GET    /api/v1/geo/paroisses/geojson/
POST   /api/v1/geo/paroisses/          ← admin seulement
PUT    /api/v1/geo/paroisses/{id}/     ← admin seulement
DELETE /api/v1/geo/paroisses/{id}/     ← SUPER seulement

# Zones d'influence
GET    /api/v1/geo/zones-influence/
POST   /api/v1/geo/zones-influence/
PUT    /api/v1/geo/zones-influence/{id}/

# Itinéraires
GET    /api/v1/geo/itineraires/
POST   /api/v1/geo/itineraires/

# Œuvres
GET    /api/v1/oeuvres/
GET    /api/v1/oeuvres/geojson/
POST   /api/v1/oeuvres/
PUT    /api/v1/oeuvres/{id}/
GET    /api/v1/oeuvres/types/

# Ouvriers
GET    /api/v1/ouvriers/
POST   /api/v1/ouvriers/
PUT    /api/v1/ouvriers/{id}/
GET    /api/v1/ouvriers/grades/

# Statistiques
GET    /api/v1/stats/global/
GET    /api/v1/stats/region/{id}/
GET    /api/v1/stats/top-paroisses-fideles/
GET    /api/v1/stats/top-paroisses-oeuvres/
GET    /api/v1/stats/performance-regions/

# Statistiques annuelles
GET    /api/v1/statistiques/annuelles/?paroisse={id}&annee={annee}
POST   /api/v1/statistiques/annuelles/
PUT    /api/v1/statistiques/annuelles/{id}/

# Import / Export
POST   /api/v1/imports/paroisses/
POST   /api/v1/imports/ouvriers/
POST   /api/v1/imports/oeuvres/
GET    /api/v1/exports/paroisses/excel/
GET    /api/v1/exports/oeuvres/excel/
GET    /api/v1/exports/stats/pdf/

# Audit
GET    /api/v1/audit/logs/          ← SUPER seulement
GET    /api/v1/audit/historique-positions/

# Utilisateurs
GET    /api/v1/utilisateurs/        ← SUPER seulement
POST   /api/v1/utilisateurs/
PUT    /api/v1/utilisateurs/{id}/
```

---

## 10. GEOSERVER — COUCHES À PUBLIER

| Couche GeoServer | Table PostGIS | Type géo | Style SLD |
|---|---|---|---|
| `eec:regions_synodales` | `geo_regionsynodale` | MultiPolygon | vert semi-transparent, contour vert foncé |
| `eec:districts` | `geo_district` | Point (centroid) | point vert petit |
| `eec:paroisses` | `geo_paroisse` | Point | cercle vert plein |
| `eec:oeuvres_scolaires` | `oeuvres_oeuvre` (filtre type=SCOLAIRE) | Point | carré jaune |
| `eec:oeuvres_medicales` | `oeuvres_oeuvre` (filtre type=MEDICALE) | Point | croix rouge |
| `eec:oeuvres_agropastorales` | `oeuvres_oeuvre` (filtre type=AGROPASTORALE) | Point | feuille verte |
| `eec:zones_influence` | `geo_zoneinfluence` | Polygon | vert très transparent |
| `eec:itineraires` | `geo_itineraire` | LineString | ligne verte tiretée |

---

## 11. RÈGLES DE QUALITÉ NON NÉGOCIABLES

### 11.1 Sécurité
- Sessions Django (HttpOnly, Secure, SameSite=Strict), jamais JWT
- Argon2 pour les mots de passe (argon2-cffi)
- 2FA TOTP obligatoire pour SUPER et REGION
- Rate limiting : `/api/v1/auth/login/` → 5 req/min/IP
- Protection CSRF active
- RBAC strict : chaque queryset filtré par périmètre du rôle
- Audit trail : LogActivite créé sur chaque écriture via signals

### 11.2 Sécurité GeoServer (CRITIQUE)
1. Changer le mot de passe admin immédiatement au premier démarrage
2. Ne JAMAIS exposer `/geoserver/web/` et `/geoserver/rest/` publiquement
3. Désactiver WCS et WPS (inutilisés)
4. WFS Transactions désactivées (Django écrit, GeoServer lit seulement)
5. Version ≥ 2.25.1 (patch CVE-2024-36401)
6. Logs activés, conservation 30 jours

### 11.3 Git
- JAMAIS commit `.env`, `node_modules/`, `pg_data/`, `geoserver_data/`
- Branches par personne, PR vers `develop`
- PERSONNE ne push directement sur `main` ou `develop`
- Miguel review et approuve toutes les PR

### 11.4 Code
- Python : PEP 8, black, ruff, type hints partout
- TypeScript : strict: true, pas de `any` non justifié
- Tests : 70% couverture cible
- Docstring d'en-tête sur chaque module Django
- API documentée via drf-spectacular sur `/api/docs/`

---

## 12. PLAN DE TRAVAIL EN PHASES

### Phase 0 — Bootstrap ✅ TERMINÉE
Infrastructure opérationnelle :
- Django 5.0.14 → http://localhost:8000
- Next.js → http://localhost:3000
- GeoServer 2.26.2 → http://localhost:8080/geoserver
- PostGIS 16-3.4 → port 5432
- Redis 7 → port 6379

---

### Phase 1 — Audit des données + Modèles + Import

**Objectif :** BD remplie avec les vraies données EEC. Vérification via Django Admin.

**1.1 Audit des sources** :
```powershell
docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend python audit_data.py
```
Résultats → décider des types exacts de champs.

**1.2 Modèles Django** (tous les modèles décrits section 7.2) :
```powershell
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate
```

**1.3 Import des données** :
```powershell
docker compose run --rm backend python manage.py import_regions
docker compose run --rm backend python manage.py import_paroisses
docker compose run --rm backend python manage.py import_ouvriers
docker compose run --rm backend python manage.py import_oeuvres
```

**⚠️ TOUJOURS** dans `import_paroisses` : `Point(float(Coord_y), float(Coord_x), srid=4326)`
**⚠️ TOUJOURS** résoudre les 5 incohérences de noms de régions via table de correspondance.

**Livrable :** Django Admin montre 22 régions, 134 districts, 693 paroisses, 708 ouvriers, toutes les œuvres.

---

### Phase 2 — Configuration GeoServer

**Objectif :** Tables PostGIS publiées en WMS + WFS avec styles EEC.

Étapes :
1. Workspace `eec` + Data Store PostGIS (`host: db`, port 5432)
2. Publier les 8 couches (tableau section 10)
3. Uploader les styles SLD (couleurs EEC)
4. Script `infra/geoserver/scripts/init_workspace.sh` pour tout recréer en une commande
5. Tester WMS GetMap + WFS GetFeature

**Livrable :** URL WMS renvoie image PNG des régions stylées vert. WFS renvoie GeoJSON des paroisses.

---

### Phase 3 — API REST Django

**Objectif :** Tous les endpoints section 9 fonctionnels, sécurisés, testés.

Étapes :
1. Serializers (GeoFeatureModelSerializer pour geo + ouvriers)
2. Permissions RBAC (IsSuperAdmin, IsRegionAdmin, etc.)
3. ViewSets + URLs (tous les endpoints)
4. Statistiques avancées (top 10, scores de performance)
5. Import via file upload (POST avec multipart/form-data)
6. Export PDF (WeasyPrint) + Excel (openpyxl)
7. Tests pytest : un minimum par endpoint

**Livrable :** `/api/docs/` montre tout. Curl vers chaque endpoint fonctionne.

---

### Phase 4 — Landing page institutionnelle

**Objectif :** Page d'accueil publique avec photos Bureau National et carte.

- Hero + titre + description EEC
- Photos Bureau National (récupérées de l'ancienne version)
- Statistiques globales (appel Django API)
- Composant carte Leaflet intégré
- Footer mentions légales
- Score Lighthouse ≥ 90

---

### Phase 5 — Carte interactive publique

**Objectif :** Carte Leaflet complète avec toutes les couches GeoServer + Django API.

- WMS régions synodales (polygones stylés)
- WFS paroisses (marqueurs + clustering)
- WFS œuvres (marqueurs colorés par type)
- WFS zones d'influence (polygones semi-transparents)
- WFS itinéraires (lignes)
- Popups riches : paroisse, œuvre, ouvrier
- Filtres multicritères + recherche
- Légende + contrôles de couches
- Statistiques au clic sur région (appel Django stats)
- Responsive mobile

---

### Phase 6 — Espace admin + CRUD

**Objectif :** Interface admin complète pour chaque rôle.

- Dashboard admin avec stats globales + Top 10 + alertes
- CRUD paroisses (avec carte pour saisir coordonnées)
- CRUD œuvres (tous types)
- CRUD ouvriers (avec grade)
- CRUD zones d'influence
- CRUD itinéraires
- Statistiques annuelles (saisie par paroisse/année)
- Gestion utilisateurs (SUPER uniquement)
- Journal d'audit
- Import Excel + Export PDF/Excel

---

### Phase 7 — Tests + Sécurité + Optimisation

- Couverture tests ≥ 70%
- Tests Playwright bout en bout
- 2FA TOTP actif sur SUPER et REGION
- Vérification sécurité GeoServer (checklist 11.2)
- Optimisation Redis (cache geojson/)
- Simplification géométries PostGIS si nécessaire

---

### Phase 8 — Déploiement production (REPORTÉ)
Activé sur demande explicite. Couvrira : VPS, Nginx, HTTPS, CI/CD, sauvegardes.

### Phase 9 — Formation et documentation (REPORTÉ)
Manuels utilisateur/administrateur, plan de maintenance.

---

## 13. CE QUE TU NE DOIS PAS FAIRE

❌ Proposer une autre stack (section 5 est tranchée)
❌ Ajouter le chatbot IA (hors périmètre délibérément)
❌ Créer des comptes pour utilisateurs lambda (pas dans scope actuel)
❌ Inventer le contenu des fichiers Excel ou Shapefile — lire réellement
❌ Committer `.env`, `node_modules/`, `pg_data/`, `geoserver_data/`
❌ Garder le mot de passe GeoServer par défaut (`admin/geoserver`)
❌ Exposer publiquement `/geoserver/web/` ou `/geoserver/rest/`
❌ Valider une phase toi-même — c'est le développeur qui valide
❌ Sauter une étape ou la marquer faite sans vérification réelle

---

**Fin du master prompt v3.**

Ce document est ta référence permanente. Tu y reviens à chaque doute. La Direction Nationale de l'EEC compte sur la qualité de ce que tu construis.

*Version 3 — Intégration complète (StatistiqueAnnuelle, ZoneInfluence, Itineraire, HistoriquePosition, TypeOeuvre complet, Bureau National photos, modèle accès visiteur/admin)*
