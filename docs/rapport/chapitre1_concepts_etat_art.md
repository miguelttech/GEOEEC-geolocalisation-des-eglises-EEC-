# Chapitre 1 — Concepts Généraux et État de l'Art
# Source de vérité pour la rédaction LaTeX

---

## CHAPEAU INTRODUCTIF

Ce chapitre pose les fondements théoriques et contextuels nécessaires à la compréhension du travail réalisé. La première section présente les concepts généraux mobilisés tout au long de ce mémoire — systèmes d'information géographique, standards OGC de services cartographiques, base de données spatiale, architecture REST, contrôle d'accès basé sur les rôles et conteneurisation. La deuxième section dresse un état de l'art de quatre solutions existantes répondant partiellement ou totalement aux besoins de l'EEC, analysées selon un format homogène. La troisième section synthétise cette analyse dans un tableau comparatif et positionne notre solution par rapport à l'existant.

---

## SECTION 1.1 — CONCEPTS GÉNÉRAUX

### 1.1.1 Système d'Information Géographique (SIG)

**Définition :** Un Système d'Information Géographique (SIG) est un système informatique conçu pour la collecte, le stockage, la manipulation, l'analyse et la représentation de données géoréférencées, c'est-à-dire de données auxquelles est associée une position sur la surface terrestre [Longley et al., 2015]. Un SIG intègre trois dimensions : spatiale (coordonnées, géométries), attributaire (données descriptives) et temporelle (évolution dans le temps).

**Dans le contexte EEC :** Le SIG constitue la couche centrale qui lie les 565 paroisses, 134 districts et 22 régions synodales à leurs coordonnées GPS sur le territoire camerounais. Il permet la visualisation cartographique et l'interrogation spatiale des entités (zones sous-dotées, densité pastorale, localisation des paroisses isolées).

### 1.1.2 Standards OGC et Services Cartographiques Web

L'Open Geospatial Consortium (OGC) est un organisme de normalisation international fondé en 1994, qui publie des spécifications ouvertes pour les services géographiques sur le web, garantissant l'interopérabilité entre serveurs et clients cartographiques.

**WMS (Web Map Service) 1.3.0 [OGC, 2006] :** Définit une interface permettant à un client web de requêter des représentations cartographiques sous forme d'images raster. Le client spécifie l'étendue géographique, les couches à afficher et les dimensions ; le serveur retourne une image PNG/JPEG superposable. Dans ce projet, GeoServer publie les couches EEC (régions, paroisses, œuvres) en WMS 1.3.0 pour l'interface Leaflet.

**WFS (Web Feature Service) 2.0.0 [OGC, 2010] :** Permet de récupérer des données géographiques vectorielles (points, lignes, polygones) au format GeoJSON ou GML depuis un serveur. Contrairement au WMS qui transmet des images, le WFS retourne des données brutes manipulables côté client. Utilisé ici pour récupérer les géométries des régions synodales et appliquer des filtres géographiques dynamiques.

### 1.1.3 Base de Données Spatiale PostGIS

PostGIS est une extension spatiale open source pour PostgreSQL, ajoutant : types de données géographiques conformes OGC Simple Features (PointField, MultiPolygonField), opérateurs spatiaux (intersections, distances, recouvrements), et fonctions de transformation de systèmes de coordonnées [PostGIS Dev Team, 2023]. C'est le standard de facto pour les bases de données spatiales open source.

Dans ce projet, PostGIS stocke la géométrie point de chaque paroisse et les polygones des 22 régions synodales. GeoDjango expose ces données via des modèles Python et permet l'interrogation spatiale depuis l'ORM Django.

### 1.1.4 Architecture REST et API

REST (Representational State Transfer) est un style architectural pour systèmes distribués, défini par Fielding (2000) autour de contraintes : séparation client-serveur, sans état (stateless), mise en cache, interface uniforme. Une API REST expose des ressources identifiées par URI, accessibles via GET, POST, PUT, PATCH, DELETE, retournant du JSON.

Django REST Framework (DRF) [Christie, 2024] est la bibliothèque de référence pour les API REST Django. Dans ce projet, le backend expose toutes les ressources EEC (paroisses, districts, régions, œuvres, ouvriers, statistiques, audit) consommées par le frontend Next.js 14.

### 1.1.5 Contrôle d'Accès Basé sur les Rôles (RBAC)

RBAC (Role-Based Access Control) est un modèle de sécurité dans lequel les droits d'accès aux ressources sont accordés selon le rôle de l'utilisateur, non son identité individuelle. Il réduit la complexité administrative et le risque d'escalade de privilèges. Recommandé par l'OWASP [2021] comme mécanisme d'autorisation de référence.

Dans ce projet, quatre rôles hiérarchiques alignés sur la structure synodale :
- **SUPER** (Bureau National) : accès complet à toutes les régions
- **REGION** (Administrateur régional) : accès limité à sa région synodale
- **DISTRICT** (Administrateur de district) : accès limité à son district
- **PAROISSE** (Administrateur paroissial) : lecture étendue, modifications limitées à sa paroisse

### 1.1.6 Conteneurisation — Docker et Docker Compose

La conteneurisation isole une application et ses dépendances dans un conteneur standardisé, plus léger qu'une machine virtuelle car partageant le noyau hôte. Docker est la plateforme de conteneurisation la plus répandue [Docker Inc., 2024]. Docker Compose orchestre des applications multi-conteneurs via un fichier `docker-compose.yml` déclaratif.

Ce projet déploie cinq services : backend Django 5 + GeoDjango/DRF, PostgreSQL 16 + PostGIS 3.4, GeoServer 2.26, Redis 7, et frontend Next.js 14. Cette configuration garantit la reproductibilité et simplifie le déploiement en production.

---

## SECTION 1.2 — ÉTAT DE L'ART

Format homogène pour chaque solution : (1) Description, (2) Figure, (3) Fonctionnalités, (4) Forces, (5) Faiblesses.

### 1.2.1 Plateforme GeoEEC v1.0 (Version Antérieure)

Développée en 2025 dans un projet académique antérieur. Repose sur Django 5 (sans Docker), authentification JWT, frontend Next.js (Pages Router), cartographie Leaflet, et un chatbot Ollama phi3:mini + LangChain + FAISS. Les régions synodales sont des fichiers GeoJSON statiques dans le répertoire `public/` du frontend. Pas de GeoServer ni de PostGIS pour les couches régions.

**Fonctionnalités :** Carte Leaflet (paroisses, œuvres, ouvriers), import Excel avec conversion Coord_x/Coord_y, API REST CRUD, statistiques + export PDF, chatbot IA, 4 rôles (admin_general, admin_regional, utilisateur_auth, visiteur).

**Forces :** Première implémentation fonctionnelle EEC, import Excel opérationnel, chatbot IA innovant.

**Faiblesses :**
- GeoJSON statique : tout changement de couche géographique impose un redéploiement
- JWT client-side : plus vulnérable aux attaques XSS qu'une session HttpOnly
- Absence de journal d'audit
- Pas de conteneurisation Docker
- RBAC non aligné (pas de niveaux district/paroisse)
- Aucun standard OGC (WMS/WFS)

### 1.2.2 ArcGIS Online (Esri)

Plateforme SIG cloud d'Esri, leader mondial du logiciel géographique. Permet la création, publication et analyse de cartes depuis un navigateur, sans installation [Esri, 2024].

**Fonctionnalités :** Carte interactive avec nombreux fonds de carte, outils d'analyse spatiale avancés, tableaux de bord configurables, contrôle des permissions, applications mobiles terrain, APIs REST compatibles OGC.

**Forces :** Plateforme mature, très riche en fonctionnalités SIG, interface intuitive, infrastructure scalable, support professionnel.

**Faiblesses :**
- Licence commerciale onéreuse (prohibitive pour une institution confessionnelle)
- Aucune hiérarchie institutionnelle synodalo-ecclésiale configurable
- Données hébergées chez Esri (USA) — souveraineté des données compromise
- Aucune gestion des données métier EEC (ouvriers, œuvres, statistiques annuelles)

### 1.2.3 Google Maps Platform

Ensemble des APIs cartographiques de Google, solution la plus utilisée mondialement pour la cartographie web [Google LLC, 2024]. Fond de carte Google haute résolution, couverture camerounaise détaillée.

**Fonctionnalités :** Cartographie interactive, géocodage, calcul d'itinéraires, marqueurs personnalisés, SDK mobile Android/iOS, APIs REST bien documentées.

**Forces :** Couverture mondiale très détaillée (y compris Cameroun), API simple à intégrer, géocodage performant pour adresses camerounaises.

**Faiblesses :**
- Facturation à l'usage : coûts significatifs au-delà du quota gratuit
- Pas de serveur OGC (WMS/WFS) — impossible de publier des couches propres
- Aucune gestion d'entités institutionnelles ni de hiérarchie synodalo-ecclésiale
- Données propriétaires hébergées chez Google — dépendance totale
- Pas de gestion de rôles, d'audit ni d'import institutionnel
- Souveraineté des données problématique pour institution camerounaise

### 1.2.4 QGIS et OpenLayers

QGIS : SIG libre et open source, parmi les plus utilisés dans les secteurs académique et institutionnel [QGIS Dev Team, 2024]. OpenLayers : bibliothèque JavaScript open source pour cartes interactives dans le navigateur, avec support natif WMS/WFS.

**Fonctionnalités :** Édition et analyse cartographique complète (QGIS), symbologie avancée, traitements géospatiaux, affichage WMS/WFS (OpenLayers), support SHP, GeoJSON, PostGIS.

**Forces :** Open source sans licence, fonctionnalités SIG professionnelles complètes, interopérabilité OGC, large communauté.

**Faiblesses :**
- QGIS est une application bureau, non une plateforme web multi-utilisateurs
- Pas de contrôle d'accès multi-utilisateurs par périmètre institutionnel
- OpenLayers seul : pas de backend, de gestion de rôles, d'import ni de statistiques
- Nécessite des compétences SIG : inadapté aux administrateurs régionaux non-techniciens de l'EEC
- Déploiement complexe en contexte à infrastructure limitée

---

## SECTION 1.3 — BILAN ET POSITIONNEMENT

### 1.3.1 Tableau Comparatif

| Critère | GeoEEC v1.0 | ArcGIS Online | Google Maps | QGIS/OL | Notre solution |
|---|---|---|---|---|---|
| Plateforme web multi-utilisateurs | ✓ | ✓ | ~ | ✗ | ✓ |
| Hiérarchie institutionnelle configurable | ~ | ✗ | ✗ | ✗ | ✓ |
| Authentification sécurisée (sessions) | ✗ (JWT) | ✓ | ✓ | ✗ | ✓ |
| RBAC à 4 niveaux synodaux | ~ | ✗ | ✗ | ✗ | ✓ |
| Serveur cartographique OGC (WMS/WFS) | ✗ | ✓ | ✗ | ✓ | ✓ |
| Base de données spatiale (PostGIS) | ~ | ✓ | ✓ | ✓ | ✓ |
| Journal d'audit des modifications | ✗ | ~ | ✗ | ✗ | ✓ |
| Import données Excel institutionnel | ✓ | ✗ | ✗ | ✗ | ✓ |
| Déploiement conteneurisé (Docker) | ✗ | N/A | N/A | ✗ | ✓ |
| Logiciel libre / sans licence commerciale | ✓ | ✗ | ✗ | ✓ | ✓ |
| Adapté au contexte EEC Cameroun | ~ | ✗ | ✗ | ✗ | ✓ |

### 1.3.2 Positionnement de notre solution

Notre solution est la seule à réunir simultanément l'ensemble des caractéristiques requises.

- **Vs plateformes commerciales (ArcGIS, Google Maps) :** Inadaptées économiquement et architecturalement. Aucune n'intègre la hiérarchie synodalo-ecclésiale, la gestion des données métier EEC spécifiques ni de contrôle d'accès par périmètre synodal. Dépendance à des infrastructures étrangères non souveraine.

- **Vs QGIS/OpenLayers :** Techniquement solides et libres, mais non multi-utilisateurs web. QGIS est un outil bureautique inadapté aux administrateurs non-techniciens, OpenLayers est uniquement une bibliothèque de rendu sans backend.

- **Vs GeoEEC v1.0 :** Le précédent le plus proche, mais lacunes critiques en sécurité (JWT vs sessions HttpOnly), traçabilité (absence d'audit), interopérabilité (GeoJSON statique vs GeoServer OGC), RBAC (4 rôles génériques vs 4 niveaux hiérarchiques synodaux) et portabilité (pas de Docker).

Notre valeur ajoutée : première solution à combiner architecture découplée et conteneurisée, GeoServer OGC natif (WMS + WFS), PostGIS, sessions Django sécurisées, RBAC synodal à 4 niveaux, et journal d'audit automatique.

---

## BILAN DU CHAPITRE 1

Ce chapitre a établi les six fondements théoriques du travail et démontré par analyse comparative que notre solution est la seule à couvrir l'intégralité des exigences institutionnelles de l'EEC. Le Chapitre 2 procédera à l'analyse détaillée des besoins (exigences fonctionnelles/non-fonctionnelles, diagrammes UML) et à la conception de l'architecture technique retenue.

---

## NOTES DE RÉDACTION

- Références bib à utiliser : longley2015, ogcwms2006, ogcwfs2010, postgis2023, fielding2000 (à ajouter), drf2024, owasp2021, docker2024, arcgisonline2024, googlemaps2024, qgis2024
- Figures à intégrer après soutenance : screenshots ArcGIS Online, Google Maps, QGIS, et capture GeoEEC v1.0
- Table des comparaisons : critères en lignes, solutions en colonnes (choix de lisibilité vs guide qui indique l'inverse — justifié par le ratio 11 critères / 4 solutions)
