# Rapport d'Audit des Données Sources — EEC Géolocalisation

> **Date :** 23 mai 2026 | **Auteur :** Audit automatique via Docker  
> **Objectif :** Analyser les fichiers sources avant l'import en base de données PostGIS  
> **Version :** 2 — chiffres corrigés après comptage précis ligne par ligne

---

## Résumé Exécutif (Chiffres Réels)

| Fichier | Lignes brutes | Lignes vides / séparateurs | **Vraies entités** | Prêtes à importer |
|---|---|---|---|---|
| Paroisses — Feuil2 (nettoyée) | 656 | 86 vides + 5 séparateurs | **565 paroisses** | 433 avec GPS · 127 sans GPS · 5 GPS erronés |
| Paroisses — Feuille 1 (brute) | 693 | 120 réponses non-paroisses | **573 paroisses** | Formulaire brut — non utilisé |
| Ouvriers | 708 | 4 séparateurs | **704 entrées** | Une entrée = une paroisse (pas un ouvrier) |
| Œuvres | 59 | 0 | **59 lignes** | 14 régions sur 22 seulement |
| Régions (Shapefile) | — | — | **22 régions** | 22 polygones valides |

> **Feuille utilisée pour l'import paroisses : Feuil2 (565 paroisses)** — c'est la version nettoyée et réorganisée du fichier.

---

## 1. Fichier Paroisses

### 1.1 Découverte Importante — Deux Feuilles dans le même fichier

Le fichier Excel paroisses contient **deux feuilles** :

| Feuille | Nom | Lignes | Vraies paroisses | Description |
|---|---|---|---|---|
| Feuille 1 | `Projet de géolocalisation de...` | 693 | 573 | Formulaire brut de collecte (23 colonnes, avec Date et Nom collecteur) |
| Feuille 2 | `Feuil2` | 656 | **565** ✅ | Version nettoyée et réorganisée (14 colonnes) |

> **On utilisera Feuil2** pour l'import — c'est la version propre et structurée.  
> Les 120 lignes "non-paroisses" de la feuille 1 sont des réponses de "Bureau Paroissial", "Bureau National", "Bureau de district" — des formulaires remplis par des bureaux administratifs, pas des paroisses.

### 1.2 Structure des colonnes (Feuil2 — 14 colonnes)

| # | Nom de colonne dans l'Excel | Champ dans notre base | Action |
|---|---|---|---|
| 1 | *(vide — numéro de rotation)* | — | Ignoré |
| 2 | `Niveau` | → aide à identifier District | Utilisé pour hiérarchie |
| 3 | `Region_synodale` | → `Paroisse.district.region` | Import avec correction noms |
| 4 | `districts` | → `Paroisse.district` | Import direct |
| 5 | `Nom de la paroisse` | → `Paroisse.nom` | **Colonne clé** |
| 6 | `Quartier` | → `Paroisse.adresse` | Import direct |
| 7 | `communiants` | → `StatistiqueAnnuelle.communiants` | Import dans table stats |
| 8 | `non-communiants` | → `StatistiqueAnnuelle.non_communiants` | Import dans table stats |
| 9 | `ouvriers` | — | Ignoré (redondant avec fichier Ouvriers) |
| 10 | `Nom de la paroisse` *(doublon)* | — | Ignoré |
| 11 | `Quartier` *(doublon)* | — | Ignoré |
| 12 | `Coord_x` | → **LATITUDE** ⚠️ | Inversé — voir 1.3 |
| 13 | `Coord_y` | → **LONGITUDE** ⚠️ | Inversé — voir 1.3 |
| 14 | `Altitude` | — | Ignoré |

### 1.3 Comptage Précis des Paroisses (Feuil2)

| Catégorie | Nombre | Explication |
|---|---|---|
| Total lignes brutes (après en-tête) | 656 | Ce que le script comptait avant la correction |
| Lignes complètement vides | 86 | Cellules effacées mais gardées par Excel |
| Lignes séparateurs (sans nom) | 5 | Sous-titres, GPS orphelins |
| **VRAIES PAROISSES** | **565** ✅ | Lignes avec un nom de paroisse réel |

### 1.4 Statistiques GPS (sur les 565 vraies paroisses)

| Catégorie | Nombre | Pourcentage |
|---|---|---|
| ✅ GPS valides (dans le Cameroun) | **433** | 77 % |
| ❌ GPS manquants (vide) | **127** | 22 % |
| ⚠️ GPS hors Cameroun (erreurs) | **5** | 1 % |
| **TOTAL** | **565** | 100 % |

> Zone Cameroun : Latitude 1,7°N → 13,1°N | Longitude 8,5°E → 16,2°E

### 1.5 ⚠️ Piège Critique — Coordonnées Inversées

**Dans ce fichier, `Coord_x` = LATITUDE et `Coord_y` = LONGITUDE.** C'est l'inverse du standard GIS.

```python
# ❌ MAUVAIS :
point = Point(coord_x, coord_y)   # paroisse en mer

# ✅ CORRECT :
lat = float(coord_x)              # Coord_x = latitude
lon = float(coord_y)              # Coord_y = longitude
point = Point(lon, lat, srid=4326)
```

### 1.6 🚨 5 Paroisses avec GPS Erronés (hors Cameroun)

| Ligne | Nom de la paroisse | Coord_x (lat) | Coord_y (lon) | Où ça pointe |
|---|---|---|---|---|
| 75 | **Biyem-Assi** | 1.2 | 1.2 | Océan Atlantique (Bénin) ❌ |
| 345 | **Bassamba** | 10.0 | 18.0 | **Tchad** ❌ |
| 441 | **NJINKA** | 45.459271 | -73.568391 | **Montréal, Canada** 🇨🇦 ❌ |
| 450 | **Paroisse de Malantouen** | 40.0 | 60.0 | **Kazakhstan** 🇰🇿 ❌ |
| 475 | **Nchoutnoun** | -19.979237 | -4.571013 | Océan Atlantique Sud ❌ |

> **Action :** Ces 5 paroisses seront importées sans GPS (position = null). À corriger manuellement dans l'admin Django.

### 1.7 Régions et Districts

- **22 régions synodales** dans l'Excel
- **134 districts** dans l'Excel

---

## 2. Fichier Ouvriers

### 2.1 Comptage Précis

| Catégorie | Nombre | Explication |
|---|---|---|
| Total lignes brutes (après en-tête) | 708 | Chiffre brut |
| Lignes séparateurs (sans nom paroisse) | 4 | Réponses "Bureau Paroissial" en fin de fichier |
| **VRAIES ENTRÉES** | **704** ✅ | Lignes avec un nom de paroisse |

> **Important :** Chaque ligne correspond à **une paroisse**, pas à un ouvrier individuel.  
> Le fichier contient les informations de la paroisse + les ouvriers qui y sont affectés (dans un champ texte libre).

### 2.2 Structure des colonnes (24 colonnes)

| # | Nom de colonne | Utilisation |
|---|---|---|
| 1 | `Niveau` | Hiérarchie |
| 2 | `Region_synodale` | → RegionSynodale |
| 3 | `districts` | → District |
| 4 | `Nom de la paroisse` | → Paroisse (**colonne clé**) |
| 5 | `Quartier` | Adresse |
| 6 | `Effectif des fidèles (communiants)` | → StatistiqueAnnuelle |
| 7 | `Effectif des fidèles (non-communiants)` | → StatistiqueAnnuelle |
| 8 | `Effectif des ouvriers` | Comptage |
| 9 | `Noms, grades et contacts des ouvriers...` | ⚠️ Texte libre (voir 2.3) |
| 10 | `_Localisation de la paroisse _latitude` | GPS latitude ✅ (ordre correct ici) |
| 11 | `_Localisation de la paroisse _longitude` | GPS longitude ✅ |
| 12 | `_Localisation de la paroisse _altitude` | Altitude |
| 13 | `_Localisation de la paroisse _precision` | Précision en mètres |
| 14→20 | `Oeuvre scolaire`, `médicale`, `Immeuble`... | Oeuvres par type |
| 21 | `Nom` | Nom de l'ouvrier principal |
| 22 | `Grade` | ⚠️ Texte libre (voir 2.3) |
| 23 | `Contact` | Téléphone |

> **Note GPS :** Ce fichier utilise `_latitude` / `_longitude` (ordre correct, pas d'inversion contrairement au fichier paroisses).

### 2.3 ⚠️ Problème — Colonne "Grade" en Texte Libre

La colonne `Grade` contient du texte descriptif complet, pas un grade structuré :

```
"Pasteur BEKIMA MBOULE Joseph (Responsable de Paroisse), Pasteur MISSE (Pasteur 2)"
"1) Dr KUATE DJILO Clément Hervé 2) Rev Bekima Paul Armel 3) EvDp Njimla Clovis"
```

> **Solution :** À l'import, ce texte sera stocké dans un champ `notes`. Le champ `grade` sera laissé vide et complété manuellement dans l'admin Django.

---

## 3. Fichier Œuvres

### 3.1 Comptage Précis

| Catégorie | Nombre | Explication |
|---|---|---|
| Total lignes (après en-tête) | 59 | Aucune ligne vide ni séparateur |
| **VRAIES ENTRÉES** | **59** ✅ | 59 lignes = 59 entrées régionales |
| Régions couvertes | **14 sur 22** | 8 régions n'ont aucune œuvre enregistrée |

### 3.2 ⚠️ Structure Atypique — Une ligne = une région (pas une œuvre)

Le fichier n'est **pas** organisé une ligne = une œuvre. Il est organisé **une ligne = une région** avec les types d'œuvres en colonnes :

| Region Synodale | Oeuvre régionale | Œuvres scolaires | GPS scolaire | Œuvres médicales | GPS médicale | Immeubles | GPS | Terrains | GPS | Agropastorale | GPS | Autre |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADAMAOUA | ... | École X | X,Y | Hôpital Y | X,Y | ... | | | | | | |

> **Conséquence :** Le script d'import devra "pivoter" ce tableau pour créer une ligne par œuvre en base de données.

### 3.3 Régions couvertes (14 sur 22)

| Région avec œuvres | Région sans œuvres (données manquantes) |
|---|---|
| ADAMAOUA | BAMBOUTOS ET NORD OUEST |
| CENTRE SUD 1 | CENTRE SUD 2 |
| EST | KOUNG KHI |
| HAUT NKAM | MENOUA |
| HAUTS PLATEAUX | MOUNGO CENTRE *(partiellement)* |
| MIFI | NKAM |
| MOUNGO NORD | SANAGA MARITIME ET OCEAN |
| MOUNGO SUD & MEME | WOURI CENTRE |
| NDE MBAM ET INOUBOU | |
| NOUN NORD | |
| NOUN SUD | |
| WOURI NORD & SUD-OUEST | |
| WOURI SUD | |

---

## 4. Shapefile — Régions Synodales

### 4.1 Informations Techniques

| Paramètre | Valeur |
|---|---|
| Nombre de régions | **22** |
| Type de géométrie | MultiPolygon |
| Système de coordonnées | WGS84 — EPSG:4326 (GPS standard) ✅ |
| Champs disponibles | `Region_syn` (nom), `no` (numéro) |
| Fichiers associés | `.shp`, `.dbf`, `.prj`, `.shx`, `.sbn`, `.sbx`, `.cpg` |

> Il n'existe qu'**un seul shapefile** dans les données sources — celui des régions synodales.  
> Il n'existe pas de shapefile pour les districts ni pour les paroisses.

### 4.2 Liste des 22 Régions

| # | Nom dans le Shapefile |
|---|---|
| 1 | ADAMAOUA |
| 2 | BAMBOUTOS ET NORD OUEST |
| 3 | CENTRE SUD 1 |
| 4 | CENTRE SUD 2 |
| 5 | EST |
| 6 | HAUT-NKAM |
| 7 | HAUTS-PLATEAUX |
| 8 | KOUNG KHI |
| 9 | MENOUA |
| 10 | MIFI |
| 11 | MOUNGO CENTRE |
| 12 | MOUNGO NORD |
| 13 | MOUNGO SUD ET MEME |
| 14 | NDE & MBAM ET INOUBOU |
| 15 | NKAM |
| 16 | NORD & EXTREME NORD |
| 17 | NOUN NORD |
| 18 | NOUN SUD |
| 19 | SANAGA MARITIME ET OCEAN |
| 20 | WOURI CENTRE |
| 21 | WOURI NORD & SUD-OUEST |
| 22 | WOURI SUD |

---

## 5. ⚠️ 5 Discordances de Noms entre Excel et Shapefile

| Nom dans l'Excel | Nom dans le Shapefile | Différence |
|---|---|---|
| `HAUT NKAM` | `HAUT-NKAM` | Tiret manquant dans l'Excel |
| `HAUTS PLATEAUX` | `HAUTS-PLATEAUX` | Tiret manquant dans l'Excel |
| `MOUNGO SUD & MEME` | `MOUNGO SUD ET MEME` | `&` → `ET` |
| `NDE MBAM ET INOUBOU` | `NDE & MBAM ET INOUBOU` | `&` manquant dans l'Excel |
| `NORD & EXTREME-NORD` | `NORD & EXTREME NORD` | Tiret dans l'Excel, espace dans le shapefile |

```python
# Table de correspondance utilisée dans les commandes d'import
CORRESPONDANCE_REGIONS = {
    "HAUT NKAM":           "HAUT-NKAM",
    "HAUTS PLATEAUX":      "HAUTS-PLATEAUX",
    "MOUNGO SUD & MEME":   "MOUNGO SUD ET MEME",
    "NDE MBAM ET INOUBOU": "NDE & MBAM ET INOUBOU",
    "NORD & EXTREME-NORD": "NORD & EXTREME NORD",
}
```

---

## 6. Plan d'Action — Import en Base

### Ordre obligatoire (dépendances entre tables)

```
Étape 1 : RegionSynodale (22)    ← depuis le Shapefile
     ↓
Étape 2 : District (134)         ← depuis Feuil2 du fichier paroisses
     ↓
Étape 3 : Paroisse (565)         ← depuis Feuil2, avec correction GPS
     ↓
Étape 4 : TypeOeuvre (7 types)   ← données fixes, pas de fichier
     ↓
Étape 5 : Oeuvre (59 lignes)     ← depuis fichier oeuvres, après pivot
     ↓
Étape 6 : Grade                  ← données fixes EEC
     ↓
Étape 7 : Ouvrier (704 entrées)  ← depuis fichier ouvriers
     ↓
Étape 8 : StatistiqueAnnuelle    ← depuis colonnes communiants/non-communiants
```

### Corrections à appliquer à l'import

| Priorité | Correction | Fichier concerné |
|---|---|---|
| 🔴 1 | Inverser Coord_x/Coord_y (lat↔lon) | Paroisses — Feuil2 |
| 🔴 2 | Table de correspondance 5 noms de régions | Paroisses + Ouvriers |
| 🔴 3 | Utiliser Feuil2 (pas Feuille 1) | Paroisses |
| 🟡 4 | Filtrer les 5 GPS hors Cameroun → position=null | Paroisses |
| 🟡 5 | Filtrer lignes vides (86) et séparateurs (5) | Paroisses |
| 🟡 6 | Filtrer séparateurs (4 lignes "Bureau...") | Ouvriers |
| 🟡 7 | Pivoter les colonnes d'oeuvres en lignes | Oeuvres |
| 🟢 8 | Stocker grade en texte libre → champ notes | Ouvriers |

---

*Rapport v2 — corrigé après comptage précis ligne par ligne — Mai 2026*
