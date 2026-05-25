# Guide complet du Backend EEC Géolocalisation
## De l'import des données aux APIs REST — explication détaillée pour débutants

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
   - [geo/serializers.py](#fichier-8--geoserlializerspy)
   - [oeuvres/serializers.py](#fichier-9--oeuvresserializerspy)
   - [accounts/serializers.py](#fichier-10--accountsserializerspy)
   - [ouvriers/serializers.py](#fichier-11--ouvriersserializerspy)
   - [geo/views.py](#fichier-12--geoviewspy)
   - [oeuvres/views.py](#fichier-13--oeuvresviewspy)
   - [accounts/views.py](#fichier-14--accountsviewspy)
   - [ouvriers/views.py](#fichier-15--ouvriersviewspy)
   - [eec_core/urls.py](#fichier-16--eec_coreurlspy)
7. [Résultats : ce qui est dans la base de données](#resultats)
8. [Les APIs disponibles : liste complète](#les-apis-disponibles)
9. [Plan de la Partie 2 — Le Frontend](#plan-partie-2)

---

## Vue d'ensemble

Imagine que tu construis une maison. On vient de finir les **fondations et la plomberie** — tout ce qui est invisible mais qui fait fonctionner la maison. Voilà ce qu'on a construit côté backend :

```
EXCEL / SHAPEFILE                    POSTGRESQL / POSTGIS
(fichiers sources)                   (base de données)
       │                                     │
       │  Scripts d'import (Python)          │
       └──────────────────────────────────── │──►  553 paroisses
         import_paroisses.py                 │     137 districts
         import_oeuvres.py                   │     22 régions
         import_statistiques.py              │     311 oeuvres
         import_ouvriers.py                  │     685 ouvriers
                                             │     545 statistiques
                                             │
                                             ▼
                                    APIs REST (Django)
                                    /api/geo/paroisses/
                                    /api/oeuvres/
                                    /api/statistiques/
                                    /api/ouvriers/
                                             │
                                             ▼
                                    FRONTEND Next.js
                                    (carte Leaflet — à venir)
```

---

## Organigramme

Voici tous les fichiers créés, dans l'ordre de leur utilisation :

```
backend/
│
├── apps/
│   │
│   ├── geo/                              ← Données géographiques
│   │   ├── management/commands/
│   │   │   ├── import_paroisses.py       [ORDRE 1] Import principal des paroisses
│   │   │   └── import_paroisses_manquantes.py  [ORDRE 2] Correction des 23 manquantes
│   │   ├── serializers.py               [ORDRE 9]  Format de sortie API (GeoJSON)
│   │   └── views.py                     [ORDRE 13] Logique des endpoints géo
│   │
│   ├── oeuvres/                          ← Oeuvres (écoles, hôpitaux, etc.)
│   │   ├── management/commands/
│   │   │   ├── import_typeoeuvre.py      [ORDRE 3] Les 7 types d'oeuvres
│   │   │   └── import_oeuvres.py         [ORDRE 4] Import des 311 oeuvres
│   │   ├── serializers.py               [ORDRE 10] Format de sortie API
│   │   └── views.py                     [ORDRE 14] Logique des endpoints oeuvres
│   │
│   ├── accounts/                         ← Statistiques, utilisateurs
│   │   ├── management/commands/
│   │   │   └── import_statistiques.py    [ORDRE 5] 545 stats pour 2025
│   │   ├── serializers.py               [ORDRE 11] Format de sortie API
│   │   └── views.py                     [ORDRE 15] Logique des endpoints stats
│   │
│   └── ouvriers/                         ← Pasteurs, évangélistes, etc.
│       ├── management/commands/
│       │   ├── import_grades.py          [ORDRE 6] Les 8 grades EEC
│       │   └── import_ouvriers.py        [ORDRE 7] Import des 685 ouvriers
│       ├── serializers.py               [ORDRE 12] Format de sortie API
│       └── views.py                     [ORDRE 16] Logique des endpoints ouvriers
│
└── eec_core/
    └── urls.py                          [ORDRE 17] Point d'entrée de toutes les URLs
```

**Règle à retenir** : l'ordre d'exécution est strict.
- Les modèles (la structure) doivent exister AVANT les imports.
- Les imports doivent être faits AVANT de créer les APIs.
- Les serializers doivent être faits AVANT les views.
- Les views doivent être faites AVANT les URLs.

---

## Concepts de base

Avant d'expliquer les fichiers, voici les concepts clés à comprendre :

### Qu'est-ce qu'une commande de gestion Django (management command) ?

C'est un **script Python qu'on exécute depuis le terminal** avec la commande :
```bash
python manage.py nom_de_la_commande
```
C'est exactement comme un programme qu'on lance manuellement.
Dans notre cas, on a créé des commandes pour lire les fichiers Excel et remplir la base de données.

### Qu'est-ce qu'un Serializer ?

Imagine que la base de données stocke les données dans son propre format (binaire, complexe).
Le navigateur web, lui, parle en **JSON** (un format texte simple).
Le **serializer** est un traducteur : il prend les données de la base et les convertit en JSON
pour que le frontend puisse les lire.

Exemple de JSON que retourne notre serializer :
```json
{
  "id": 1,
  "nom": "Paroisse de Ngui",
  "district_nom": "DSCHANG II",
  "region_nom": "MENOUA",
  "position": {"type": "Point", "coordinates": [10.056, 5.444]}
}
```

### Qu'est-ce qu'une View (ViewSet) ?

Une **view** est la logique qui s'exécute quand quelqu'un accède à une URL.
Quand le frontend demande `GET /api/geo/paroisses/`, la view :
1. Reçoit la demande
2. Interroge la base de données
3. Passe les données au serializer
4. Retourne le JSON au frontend

### Qu'est-ce qu'une URL pattern ?

C'est la **carte d'adresses** de l'API.
Elle dit : "quand quelqu'un appelle `/api/geo/paroisses/`, utilise la view `ParoisseViewSet`".

### Qu'est-ce que GeoJSON ?

C'est un format JSON spécial pour les données géographiques.
Leaflet.js (la carte sur le frontend) comprend nativement ce format.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [10.056422, 5.444976]
      },
      "properties": {
        "nom": "Paroisse de Ngui",
        "district_nom": "DSCHANG II"
      }
    }
  ]
}
```
Leaflet.js lit ce JSON et place automatiquement un marker sur la carte aux coordonnées `[10.056, 5.444]`.

---

## Phase 1 — Les Modèles

**Ce qui s'est passé avant** : les modèles Django ont été créés dans les fichiers `models.py`.
Un modèle = une table dans la base de données.

Les migrations ont été générées et appliquées :
```bash
python manage.py makemigrations   # génère les fichiers de migration
python manage.py migrate          # applique les migrations = crée les tables
```

**Tables créées :**
| Table PostgreSQL | Modèle Django | Description |
|---|---|---|
| `geo_regionsynodale` | RegionSynodale | 22 régions synodales |
| `geo_district` | District | 137 districts |
| `geo_paroisse` | Paroisse | 553 paroisses |
| `oeuvres_typeoeuvre` | TypeOeuvre | 7 types d'oeuvres |
| `oeuvres_oeuvre` | Oeuvre | 311 oeuvres |
| `accounts_statistiqueannuelle` | StatistiqueAnnuelle | 545 statistiques |
| `ouvriers_grade` | Grade | 8 grades |
| `ouvriers_ouvrier` | Ouvrier | 685 ouvriers |

Après cette phase, les tables existaient mais étaient **vides**.
La Phase 2 (imports) les a remplies.

---

## Phase 2 — Les Imports

---

### Fichier 1 — import_paroisses.py

**Chemin** : `backend/apps/geo/management/commands/import_paroisses.py`
**Ordre** : 1er fichier à exécuter
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

**Piège important** : dans le fichier Excel, les colonnes sont **inversées** :
- Colonne 11 = "Coord_x" = en réalité la **LATITUDE** (pas la longitude !)
- Colonne 12 = "Coord_y" = en réalité la **LONGITUDE** (pas la latitude !)

C'est une erreur dans le fichier source. On a dû corriger en code :
```python
lat = float(row[11])  # Coord_x est en réalité la latitude
lon = float(row[12])  # Coord_y est en réalité la longitude
point = Point(lon, lat, srid=4326)  # Point(longitude, latitude)
```

**Résultat** :
- 22 régions synodales créées (avec leur géométrie shapefile)
- 134 districts créés
- 530 paroisses créées (543 - 13 doublons = 530, puis +23 manquantes via script 2)

---

### Fichier 2 — import_paroisses_manquantes.py

**Chemin** : `backend/apps/geo/management/commands/import_paroisses_manquantes.py`
**Ordre** : 2ème (après import_paroisses)
**But** : Importer les 23 paroisses que le script 1 a sautées parce que leur colonne "district" était vide dans l'Excel

**Pourquoi 23 paroisses étaient manquantes ?**
Dans le fichier Excel, certaines lignes ont la colonne "district" vide.
Le script 1 utilisait `(district + nom)` comme clé de recherche.
Sans district, impossible de placer la paroisse → elle était ignorée.

**La solution** : Un dictionnaire de corrections écrit **manuellement** après recherche :
```python
CORRECTIONS = {
    "Bakap district de Bana": {
        "region": "HAUT-NKAM",
        "district": "BANA",       # le nom de la paroisse dit "district de Bana" !
        "confiance": "CERTAINE",
    },
    "Baneghang": {
        "region": "MENOUA",
        "district": "BAMENDOU",   # la paroisse précédente dans l'Excel est dans BAMENDOU
        "confiance": "CERTAINE",
    },
    # ... 23 entrées au total
}
```

**Comment on a trouvé le bon district pour chaque paroisse ?**
- Certaines : le **nom de la paroisse elle-même** le dit ("Bakap district de Bana")
- D'autres : la **ligne précédente** dans l'Excel appartient au même district
- Quelques-unes : connaissance géographique du Cameroun (estimé)

**Résultats** :
- 3 nouveaux districts créés (NGAOUNDAL, BANA, KAELE)
- 21 paroisses créées
- 2 paroisses mises à jour
- Total : **553 paroisses** dans la base

---

### Fichier 3 — import_typeoeuvre.py

**Chemin** : `backend/apps/oeuvres/management/commands/import_typeoeuvre.py`
**Ordre** : 3ème
**But** : Créer les 7 types d'oeuvres (données fixes, pas de fichier Excel — codées en dur)

**Pourquoi coder en dur et pas depuis Excel ?**
Les types d'oeuvres sont une **classification fixe** définie par l'EEC.
Ils ne changent pas selon les paroisses. Il n'y a pas de colonne "type d'oeuvre" dans l'Excel
— les oeuvres sont dans des colonnes séparées (une colonne par type).

**Les 7 types créés** :
| Nom | Icône | Couleur (hex) | Usage sur la carte |
|-----|-------|---------------|-------------------|
| SCOLAIRE | school | #2563EB (bleu) | Écoles, lycées |
| UNIVERSITAIRE | graduation-cap | #7C3AED (violet) | Universités, instituts |
| MEDICALE | heart-pulse | #DC2626 (rouge) | Hôpitaux, dispensaires |
| AGROPASTORALE | sprout | #16A34A (vert) | Fermes, élevages |
| IMMEUBLE | building-2 | #D97706 (orange) | Bâtiments EEC |
| TERRAIN | map-pin | #78716C (gris) | Terrains EEC |
| AUTRE | circle-help | #64748B (gris clair) | Autres |

**Résultat** : 7 TypeOeuvre créés en base.

---

### Fichier 4 — import_oeuvres.py

**Chemin** : `backend/apps/oeuvres/management/commands/import_oeuvres.py`
**Ordre** : 4ème (après import_typeoeuvre)
**But** : Importer les 311 oeuvres depuis le fichier Excel `Recap_oeuvres_EEC_2025.xlsx`

**Structure du fichier Excel** :
Le fichier a **3 feuilles** (sheets) :
1. `Oeuvres_regionales` — oeuvres appartenant à une région entière (pas une seule paroisse)
2. `Oeuvres_districts` — oeuvres appartenant à un district
3. `Oeuvres_paroissialles` — oeuvres appartenant à une paroisse spécifique

**Concept clé : la logique pivot**

Dans le fichier Excel, une seule ligne peut représenter **plusieurs oeuvres**.
Par exemple, une même paroisse peut avoir une école (SCOLAIRE) ET un hôpital (MEDICALE).
La ligne a donc des groupes de colonnes :

```
| Nom | GPS | [col SCOLAIRE: nom_ecole, nb_eleves, ...] | [col MEDICALE: nom_hopital, lits, ...] | ...
```

Le script "pivote" : pour chaque ligne, il lit chaque groupe de colonnes.
Si le groupe a un nom d'oeuvre → il crée une oeuvre. Sinon → il saute.

```python
# Pour chaque ligne de l'Excel
for row in data:
    # Pour chaque type d'oeuvre (groupe de colonnes)
    for type_code, col_debut in GROUPES_COLONNES.items():
        nom_oeuvre = row[col_debut]      # nom dans le groupe
        if nom_oeuvre:                    # si il y a un nom → créer l'oeuvre
            creer_oeuvre(type_code, nom_oeuvre, ...)
```

**Difficultés rencontrées** :
1. Un nom d'oeuvre dépassait 200 caractères → erreur de base de données. Solution : tronquer à 197 + "..."
2. Les colonnes GPS sont aussi inversées (lat/lon) comme pour les paroisses
3. Les oeuvres régionales n'appartiennent à aucune paroisse → le modèle a dû être modifié pour rendre `paroisse` optionnelle

**Modification du modèle Oeuvre** :
```python
# AVANT (paroisse obligatoire)
paroisse = models.ForeignKey(Paroisse, on_delete=models.PROTECT)

# APRÈS (paroisse, district OU région — un seul des trois)
paroisse = models.ForeignKey(Paroisse, null=True, blank=True, ...)
district  = models.ForeignKey(District, null=True, blank=True, ...)
region    = models.ForeignKey(RegionSynodale, null=True, blank=True, ...)
```

**Résultats** :
- 63 oeuvres régionales (feuille 1)
- 44 oeuvres de districts (feuille 2)
- 204 oeuvres paroissiales (feuille 3)
- **Total : 311 oeuvres**

---

### Fichier 5 — import_statistiques.py

**Chemin** : `backend/apps/accounts/management/commands/import_statistiques.py`
**Ordre** : 5ème
**But** : Importer les statistiques annuelles 2025 (communiants, non-communiants) pour chaque paroisse

**Source** : Feuille "Feuil2" du fichier paroisses (`Recap_paroisses_...xlsx`)
- Colonne 6 : nombre de communiants
- Colonne 7 : nombre de non-communiants

**Qu'est-ce qu'un communiant ?**
Dans l'EEC, un **communiant** est un membre baptisé et confirmé qui participe à la communion.
Un **non-communiant** est un membre de l'église (baptisé) mais pas encore confirmé.
Total fidèles = communiants + non-communiants.

**Logique de déduplication en deux passes** :

Le problème : certaines paroisses apparaissent deux fois dans Feuil2 (doublons légers).
Si on importe ligne par ligne, on risque d'écraser les bonnes données avec des mauvaises.

La solution : **deux passes** :
```
PASSE 1 : Parcourir toutes les lignes et mémoriser les MEILLEURES valeurs
          Si une paroisse apparaît deux fois → garder celle avec le plus grand total
          Stocker dans un dictionnaire : {paroisse_id: (communiants, non_communiants)}

PASSE 2 : Insérer en base uniquement les meilleures valeurs
          Pour chaque entrée du dictionnaire → update_or_create()
```

**Résultats** :
- 545 statistiques créées pour l'année 2025
- Total communiants : **133 935**
- Total non-communiants : **49 535**
- **Total fidèles EEC 2025 : 183 470 personnes**

---

### Fichier 6 — import_grades.py

**Chemin** : `backend/apps/ouvriers/management/commands/import_grades.py`
**Ordre** : 6ème
**But** : Créer les 8 grades ecclésiastiques de l'EEC (données fixes)

**Qu'est-ce qu'un grade dans l'EEC ?**
L'EEC a une hiérarchie de personnel pastoral, du plus haut au plus bas :

| Niveau | Grade | Abréviation | Explication |
|--------|-------|-------------|-------------|
| 1 | Évêque | Év. | Responsable d'une région synodale entière |
| 2 | Pasteur | P. | Agent pastoral principal d'une paroisse |
| 3 | Pasteur Proposant | P.P. | Futur pasteur, en formation |
| 4 | P.P. avec Délégation Pastorale | P.P.D.P. | Proposant qui a déjà une responsabilité |
| 5 | Évangéliste | Ev. | Agent évangélique |
| 6 | Évangéliste avec Délégation Pastorale | Ev.D.P. | Évangéliste avec plus de responsabilités |
| 7 | Délégué Pastoral | D.P. | Délégué sans ordination |
| 8 | Aide-Évangéliste | A.Ev. | Agent auxiliaire |

**Résultat** : 8 grades créés en base.

---

### Fichier 7 — import_ouvriers.py

**Chemin** : `backend/apps/ouvriers/management/commands/import_ouvriers.py`
**Ordre** : 7ème (après import_grades)
**But** : Importer les 685 ouvriers depuis `OUVRIERS.xlsx`

**Structure du fichier Excel** :
Le fichier `OUVRIERS.xlsx` a une feuille unique (`Sheet1`) avec 708 lignes.
**Chaque ligne = un ouvrier** (pas une paroisse).
Quand une paroisse a 3 pasteurs, il y a 3 lignes avec le même nom de paroisse.

**Colonnes utilisées** :
- [1] Région synodalle
- [2] District
- [3] Nom de la paroisse
- [21] Nom de l'ouvrier (colonne individuelle)
- [22] Grade de l'ouvrier (colonne individuelle)
- [23] Contact / téléphone

**Problème rencontré : les grades sont du texte libre !**

La colonne [22] "Grade" ne contient pas un code propre comme "PASTEUR".
Elle contient du texte libre comme :
- "Pasteur"
- "Pasteure"
- "Rev" (= Révérend = Pasteur)
- "Ev" (= Évangéliste)
- "Dp" (= Délégué Pastoral)
- "Pasteur/Master en théologie" (grade + diplôme mélangés !)
- "Licence en Théologie" (pas un grade du tout !)

**La solution : la fonction `mapper_grade()`**

Cette fonction lit le texte brut et retourne l'objet Grade correspondant.
Elle utilise des règles de priorité (du plus précis au plus général) :

```
Si le texte contient "ppdp" → Grade "Pasteur Proposant avec Délégation Pastorale"
Si le texte contient "ev/dp" → Grade "Évangéliste avec Délégation Pastorale"
Si le texte commence par "ev" → Grade "Évangéliste"
Si le texte contient "pasteur" → Grade "Pasteur"
Si le texte est "pp" → Grade "Pasteur Proposant"
Si le texte est "dp" → Grade "Délégué Pastoral"
Sinon → None (grade inconnu, l'ouvrier est quand même importé)
```

**Problème rencontré : les noms commençaient par "- " ou "1- "**

Dans l'Excel, certaines cellules de noms contenaient des numéros de liste :
- `"- BATCHAYA Anie"` → nom = "-", prénom = "BATCHAYA Anie" (mauvais !)
- `"1- TCHOUATEU Christian"` → nom = "1-", prénom = "TCHOUATEU Christian" (mauvais !)

**La solution : la fonction `nettoyer_nom()`** qui supprime ces préfixes avec une expression régulière.

**Résultats** :
- 685 ouvriers importés
- 296 Pasteurs · 206 Évangélistes · 43 Délégués Pastoraux
- 129 sans grade reconnu (titres académiques dans la colonne grade)
- 6 paroisses introuvables (données Excel incohérentes)

---

## Phase 3 — Les APIs REST

Une API REST est une **interface** qui permet au frontend (la carte Next.js) de récupérer
les données de la base de données via des URLs.

**Comment ça fonctionne ?**
```
Frontend (Next.js)            Backend (Django)               Base de données
       │                              │                              │
       │  GET /api/geo/paroisses/     │                              │
       │─────────────────────────────►│                              │
       │                              │  SELECT * FROM geo_paroisse  │
       │                              │─────────────────────────────►│
       │                              │                              │
       │                              │◄─────────────────────────────│
       │                              │  (données brutes PostgreSQL)  │
       │                              │                              │
       │                              │  [Serializer convertit]      │
       │◄─────────────────────────────│                              │
       │  {JSON / GeoJSON retourné}   │                              │
```

---

### Fichier 8 — geo/serializers.py

**Chemin** : `backend/apps/geo/serializers.py`
**Ordre** : 9ème
**But** : Définir le format JSON des données géographiques (régions, districts, paroisses)

**Serializers créés** :

**`RegionSynodaleSerializer`** — retourne une région en GeoJSON avec son polygone.
Le champ `geometrie` (MultiPolygon) est automatiquement converti en GeoJSON.
Les champs calculés `nb_districts` et `nb_paroisses` comptent les enfants.

**`RegionSynodaleListSerializer`** — version allégée SANS le polygone.
Utilisé pour les menus déroulants et filtres (pas besoin de la géométrie là).

**`DistrictSerializer`** — retourne un district avec le nom de sa région parente.
`region_nom` est calculé via `source="region.nom"` (traverser la relation FK).

**`ParoisseListSerializer`** — retourne une paroisse en GeoJSON avec son point GPS.
Contient : nom, adresse, district, région, coordonnées GPS.
Le `geo_field = "position"` dit à DRF-GIS de sérialiser `position` en GeoJSON.

**`ParoisseDetailSerializer`** — version détaillée pour la fiche d'une paroisse.
Extrait latitude et longitude séparément depuis le PointField.

---

### Fichier 9 — oeuvres/serializers.py

**Chemin** : `backend/apps/oeuvres/serializers.py`
**Ordre** : 10ème
**But** : Format JSON des oeuvres pour la carte

**`OeuvreListSerializer`** — GeoJSON pour les markers de la carte.
Contient : nom, type (couleur + icône), région/district/paroisse, position GPS.
Les méthodes `get_paroisse_nom()`, `get_district_nom()`, `get_region_nom()` parcourent
les relations en sens inverse pour trouver le bon nom selon si l'oeuvre est régionale,
de district, ou paroissiale.

**`OeuvreDetailSerializer`** — fiche détaillée d'une oeuvre avec le type complet imbriqué.

---

### Fichier 10 — accounts/serializers.py

**Chemin** : `backend/apps/accounts/serializers.py`
**Ordre** : 11ème
**But** : Format JSON des statistiques annuelles

**`StatistiqueAnnuelleSerializer`** — retourne une statistique avec :
- Les chiffres (communiants, non-communiants, baptêmes…)
- Le nom de la paroisse, du district, de la région (via les relations FK)
- Un champ calculé `total_fideles` (communiants + non-communiants)

---

### Fichier 11 — ouvriers/serializers.py

**Chemin** : `backend/apps/ouvriers/serializers.py`
**Ordre** : 12ème
**But** : Format JSON des grades et ouvriers

**`GradeSerializer`** — retourne un grade avec le nombre d'ouvriers ayant ce grade.
**`OuvrierSerializer`** — retourne un ouvrier avec son grade, sa paroisse, et sa localisation.

---

### Fichier 12 — geo/views.py

**Chemin** : `backend/apps/geo/views.py`
**Ordre** : 13ème
**But** : Logique qui s'exécute quand on appelle les URLs géographiques

**Qu'est-ce qu'un ViewSet ?**
Un ViewSet est une classe Python qui gère automatiquement plusieurs URLs :
```
GET /api/geo/paroisses/      → list()    (retourne toutes les paroisses)
GET /api/geo/paroisses/5/    → retrieve() (retourne la paroisse n°5 uniquement)
```
On n'a pas besoin d'écrire deux fonctions — le ViewSet fait les deux.

**`RegionSynodaleViewSet`** :
- Retourne les 22 régions avec leurs polygones GeoJSON
- Ajoute via `.annotate()` les comptages `nb_districts` et `nb_paroisses` (SQL COUNT)
- Action supplémentaire `/liste` : retourne les régions sans géométrie (pour les filtres)

**`DistrictViewSet`** :
- Retourne les 137 districts
- Filtre `?region={id}` : retourne uniquement les districts d'une région donnée

**`ParoisseViewSet`** :
- Retourne les 553 paroisses
- Filtres : `?district=`, `?region=`, `?search=`, `?avec_gps=1`
- Sélecteur de serializer : liste → GeoJSON, détail → format simplifié

---

### Fichier 13 — oeuvres/views.py

**Chemin** : `backend/apps/oeuvres/views.py`
**Ordre** : 14ème
**But** : Logique des endpoints pour les oeuvres

**`TypeOeuvreViewSet`** : retourne les 7 types (liste fixe, pas de filtre).

**`OeuvreViewSet`** :
- Filtres : `?type=`, `?region=`, `?district=`, `?paroisse=`, `?avec_gps=1`
- Utilise `select_related()` pour charger les relations en une seule requête SQL (optimisation)

---

### Fichier 14 — accounts/views.py

**Chemin** : `backend/apps/accounts/views.py`
**Ordre** : 15ème
**But** : Logique des endpoints pour les statistiques

**`StatistiqueAnnuelleViewSet`** :
- Filtres : `?paroisse=`, `?district=`, `?region=`, `?annee=`
- Action spéciale `totaux` : retourne les **sommes** (agrégats SQL)
  - URL : `GET /api/statistiques/totaux/?annee=2025`
  - Résultat : `{"total_fideles": 183470, "nb_paroisses": 545, ...}`

---

### Fichier 15 — ouvriers/views.py

**Chemin** : `backend/apps/ouvriers/views.py`
**Ordre** : 16ème
**But** : Logique des endpoints pour les ouvriers

**`GradeViewSet`** : retourne les 8 grades avec le nombre d'ouvriers pour chaque grade.

**`OuvrierViewSet`** :
- Filtres : `?grade=`, `?paroisse=`, `?district=`, `?region=`, `?search=`
- `?search=TAKAM` → retourne tous les ouvriers dont le nom contient "TAKAM"

---

### Fichier 16 — eec_core/urls.py

**Chemin** : `backend/eec_core/urls.py`
**Ordre** : 17ème et dernier
**But** : Point d'entrée unique — carte de toutes les adresses de l'API

**Comment fonctionne le Router DRF ?**
Sans Router, il faudrait écrire manuellement chaque URL :
```python
# SANS Router (fastidieux)
path("api/geo/paroisses/",     ParoisseViewSet.as_view({"get": "list"})),
path("api/geo/paroisses/<id>/", ParoisseViewSet.as_view({"get": "retrieve"})),
```

Avec le Router, une seule ligne génère automatiquement les deux URLs :
```python
# AVEC Router (simple)
router.register(r"geo/paroisses", ParoisseViewSet, basename="paroisse")
# → génère automatiquement /api/geo/paroisses/ ET /api/geo/paroisses/{id}/
```

**URLs générées automatiquement** :
```
/api/geo/regions/              GET → liste des 22 régions (GeoJSON)
/api/geo/regions/{id}/         GET → une région précise
/api/geo/regions/liste/        GET → régions sans géométrie (pour les filtres)
/api/geo/districts/            GET → liste des 137 districts
/api/geo/districts/{id}/       GET → un district précis
/api/geo/paroisses/            GET → liste des 553 paroisses (GeoJSON points)
/api/geo/paroisses/{id}/       GET → une paroisse précise
/api/oeuvres/types/            GET → liste des 7 types
/api/oeuvres/oeuvres/          GET → liste des 311 oeuvres (GeoJSON)
/api/oeuvres/oeuvres/{id}/     GET → une oeuvre précise
/api/statistiques/             GET → liste des 545 stats
/api/statistiques/totaux/      GET → totaux agrégés EEC
/api/ouvriers/grades/          GET → liste des 8 grades
/api/ouvriers/ouvriers/        GET → liste des 685 ouvriers
/api/ouvriers/ouvriers/{id}/   GET → un ouvrier précis
/api/schema/                   GET → schéma OpenAPI (machine-readable)
/api/schema/swagger/           GET → documentation interactive Swagger UI
/api/schema/redoc/             GET → documentation ReDoc
/admin/                        → Interface d'administration Django
```

---

## Résultats

Après l'exécution de tous les scripts d'import, voici l'état de la base de données :

| Table | Lignes | Description |
|-------|--------|-------------|
| `geo_regionsynodale` | **22** | 22 régions synodales avec polygones |
| `geo_district` | **137** | 137 districts |
| `geo_paroisse` | **553** | 553 paroisses (402 avec GPS, 151 sans) |
| `oeuvres_typeoeuvre` | **7** | 7 types d'oeuvres |
| `oeuvres_oeuvre` | **311** | 311 oeuvres (scolaires, médicales, etc.) |
| `accounts_statistiqueannuelle` | **545** | Stats 2025 : **183 470 fidèles** |
| `ouvriers_grade` | **8** | 8 grades ecclésiastiques |
| `ouvriers_ouvrier` | **685** | 685 ouvriers (pasteurs, évangélistes…) |
| **TOTAL** | **2 268** | Entrées dans la base |

---

## Les APIs disponibles

Tu peux tester ces URLs directement dans ton navigateur :

```
http://localhost:8000/api/geo/paroisses/
http://localhost:8000/api/geo/paroisses/?avec_gps=1
http://localhost:8000/api/geo/paroisses/?district=5
http://localhost:8000/api/geo/paroisses/?search=NGUI
http://localhost:8000/api/geo/districts/?region=10
http://localhost:8000/api/oeuvres/oeuvres/
http://localhost:8000/api/oeuvres/oeuvres/?type=3
http://localhost:8000/api/statistiques/totaux/?annee=2025
http://localhost:8000/api/ouvriers/ouvriers/?grade=2
http://localhost:8000/api/ouvriers/ouvriers/?search=TAKAM
http://localhost:8000/api/schema/swagger/    ← documentation interactive
http://localhost:8000/admin/                 ← admin Django (admin / EecAdmin@2026!)
```

---

## Plan de la Partie 2

### Ce qu'on va faire ensuite

La Partie 2 est le **frontend** : l'interface visible par les utilisateurs finaux.
C'est la partie la plus importante visuellement — la carte, les filtres, les tableaux.

### Étape 1 — Authentification

Avant d'afficher quoi que ce soit, l'utilisateur doit se connecter.
Il faut créer :
- Un endpoint API `POST /api/auth/login/` (reçoit email + mot de passe, retourne un token)
- Un endpoint API `POST /api/auth/logout/`
- Une page de connexion sur le frontend Next.js

### Étape 2 — La carte principale (Leaflet)

C'est le cœur du projet. La carte affichera :
- Les **polygones des régions** (en couleurs différentes selon les statistiques)
- Les **markers des paroisses** (un point cliquable par paroisse)
- Les **markers des oeuvres** (avec icônes différentes selon le type)
- Des **filtres** : par région, par district, par type d'oeuvre

**Comment Leaflet utilisera nos APIs :**
```javascript
// Le frontend appelle notre API
const response = await fetch('/api/geo/paroisses/?avec_gps=1');
const data = await response.json();
// data.results est un GeoJSON FeatureCollection
const geojsonLayer = L.geoJSON(data.results);
geojsonLayer.addTo(map);  // Ajoute tous les markers automatiquement !
```

### Étape 3 — Les fiches de détail

Quand on clique sur un marker, une fiche s'ouvre avec :
- Les informations de la paroisse
- Les statistiques de l'année
- La liste des oeuvres
- La liste des ouvriers

### Étape 4 — Le tableau de bord statistiques

Une page avec des graphiques (barres, camemberts) montrant :
- Répartition des fidèles par région
- Évolution des statistiques dans le temps
- Nombre d'oeuvres par type

### Étape 5 — GeoServer (couches géographiques avancées)

GeoServer permettra d'ajouter des couches cartographiques plus riches :
- Carte choroplèthe : régions colorées selon le nombre de fidèles
- Clusters de markers (regrouper les paroisses proches)

### Est-ce que c'est en accord avec le cahier des charges ?

**OUI, si on regarde la roadmap initiale :**

| Phase | Description | État |
|-------|-------------|------|
| Phase 0 — Bootstrap | Docker, Django, Next.js | ✅ Fait |
| Phase 1 — Données | Imports, modèles | ✅ Fait |
| Phase 2 — APIs | REST, serializers, views | ✅ Fait |
| Phase 3 — Frontend | Carte, authentification, UI | 🔲 À faire |
| Phase 4 — GeoServer | Couches cartographiques | 🔲 À faire |
| Phase 5 — Exports | PDF, Excel | 🔲 À faire |

Le backend représente environ **35% du projet total**.
Le frontend (Partie 2) représente les **65% restants**.

---

*Document généré le 24 mai 2026 — EEC Géolocalisation v1.0*
