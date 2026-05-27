# SECTIONS PRÉLIMINAIRES — Rapport EEC Géolocalisation
# À copier dans le fichier LaTeX correspondant

---

## RÉSUMÉ

L'Église Évangélique du Cameroun (EEC) regroupe 693 paroisses, 311 œuvres sociales et éducatives, ainsi que 685 ouvriers ecclésiastiques répartis dans 22 Régions Synodales et 137 districts couvrant l'ensemble du territoire national, sans que l'institution ne dispose d'aucun outil numérique centralisé permettant leur visualisation géographique ni leur administration hiérarchisée. Cette lacune compromet la capacité du Bureau National à piloter ses ressources territoriales, à produire des statistiques consolidées et à assurer une mise à jour contrôlée des données. Ce travail présente la conception et le développement d'une plateforme web cartographique institutionnelle répondant à ces besoins. L'approche adoptée s'appuie sur une architecture à services découplés : Django 5 et Django REST Framework assurent le backend et les API, Next.js 14 constitue l'interface web, PostgreSQL avec l'extension PostGIS gère la persistance des données spatiales, GeoServer assure la publication des couches cartographiques selon les standards OGC, et Leaflet.js permet la visualisation interactive côté navigateur ; l'ensemble est conteneurisé avec Docker Compose. La plateforme ainsi développée offre une carte interactive avec regroupement automatique des marqueurs, des filtres hiérarchiques par région, district et type d'entité, un panneau de détail par entité, ainsi qu'un module d'administration multi-niveaux fondé sur un contrôle d'accès basé sur les rôles (RBAC) à quatre profils : national, régional, district et paroissial. Par rapport aux solutions existantes analysées, ce système se distingue par son alignement strict avec le référentiel hiérarchique synodal de l'EEC, l'utilisation de GeoServer pour la diffusion normalisée des données géographiques, et un déploiement entièrement conteneurisé garantissant la reproductibilité de l'environnement d'exécution.

**Mots-clés :** géolocalisation, système d'information géographique, EEC Cameroun, Django REST Framework, Leaflet

---

## ABSTRACT

The Evangelical Church of Cameroon (EEC) encompasses 693 parishes, 311 social and educational institutions, and 685 ordained workers spread across 22 Synodal Regions and 137 districts covering the entire national territory, yet the institution lacks any centralized digital system for their geographic visualization or hierarchical administration. This gap undermines the National Bureau's ability to monitor its territorial resources, generate consolidated statistics, and maintain controlled data updates. This work presents the design and development of an institutional cartographic web platform addressing these needs. The approach relies on a decoupled service architecture: Django 5 and Django REST Framework handle the backend and API layer, Next.js 14 provides the web interface, PostgreSQL with the PostGIS extension manages spatial data persistence, GeoServer handles OGC-compliant cartographic layer publication, and Leaflet.js enables client-side interactive mapping; the entire stack is containerized using Docker Compose. The resulting platform delivers an interactive map with automatic marker clustering, hierarchical filters by region, district, and entity type, a per-entity detail panel, and a multi-level administration module enforcing role-based access control (RBAC) across four profiles: national, regional, district, and parish. Compared to the existing solutions reviewed in this work, the system is distinguished by its strict alignment with the EEC synodal hierarchical framework, the use of GeoServer for standards-compliant geographic data publication, and a fully containerized deployment ensuring environment reproducibility.

**Keywords:** geolocation, geographic information system, EEC Cameroon, Django REST Framework, Leaflet

---

## SIGLES ET ABRÉVIATIONS

| Sigle / Abréviation | Signification complète |
|---|---|
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| DRF | Django REST Framework |
| EEC | Église Évangélique du Cameroun |
| ENSPY | École Nationale Supérieure Polytechnique de Yaoundé |
| GIS | Geographic Information System |
| GPS | Global Positioning System (Système de Positionnement Global) |
| HTML | HyperText Markup Language |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HyperText Transfer Protocol Secure |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| OGC | Open Geospatial Consortium |
| ORM | Object-Relational Mapping |
| PDF | Portable Document Format |
| RBAC | Role-Based Access Control (Contrôle d'accès basé sur les rôles) |
| REST | Representational State Transfer |
| SIG | Système d'Information Géographique |
| SLD | Styled Layer Descriptor |
| SQL | Structured Query Language |
| SRS | Spatial Reference System |
| SSL | Secure Sockets Layer |
| SSR | Server-Side Rendering |
| TOTP | Time-based One-Time Password |
| UI | User Interface (Interface utilisateur) |
| URL | Uniform Resource Locator |
| UX | User Experience (Expérience utilisateur) |
| WFS | Web Feature Service |
| WGS84 | World Geodetic System 1984 |
| WMS | Web Map Service |
| WSL | Windows Subsystem for Linux |

---

## GLOSSAIRE

**Cluster de marqueurs :** Technique de regroupement visuel sur une carte qui agrège les marqueurs géographiquement proches en un seul indicateur numérique. Lorsque l'utilisateur zoome, le cluster éclate pour révéler les marqueurs individuels. Cette technique améliore la lisibilité d'une carte comportant un grand nombre de points.

**Conteneurisation :** Approche de déploiement logiciel qui isole une application et toutes ses dépendances dans une unité standardisée appelée conteneur. Dans ce projet, Docker et Docker Compose sont utilisés pour orchestrer l'ensemble des services (backend, base de données, serveur cartographique, cache, frontend) de manière reproductible et indépendante de l'environnement hôte.

**GeoServer :** Serveur cartographique open source conforme aux standards de l'Open Geospatial Consortium (OGC). Il permet de publier, gérer et diffuser des données géographiques sous forme de services WMS et WFS, accessibles depuis n'importe quel client cartographique compatible.

**Géolocalisation :** Processus de détermination et d'enregistrement de la position géographique d'une entité à l'aide de coordonnées GPS (latitude, longitude). Dans ce projet, la géolocalisation désigne l'association de chaque paroisse et œuvre de l'EEC à des coordonnées précises sur le territoire camerounais.

**PostGIS :** Extension spatiale pour le système de gestion de base de données relationnelle PostgreSQL. PostGIS ajoute la prise en charge des types de données géographiques (points, lignes, polygones) et des fonctions de calcul spatial (distances, intersections, projections). Il est le standard de facto pour les bases de données spatiales open source.

**RBAC (contrôle d'accès basé sur les rôles) :** Modèle de sécurité informatique dans lequel les droits d'accès aux ressources d'un système sont déterminés par le rôle attribué à chaque utilisateur, et non par son identité propre. Dans ce projet, quatre rôles sont définis : national, régional, district et paroissial, chacun disposant d'un périmètre d'action délimité.

**Région synodale :** Entité administrative de l'Église Évangélique du Cameroun regroupant un ensemble de districts et de paroisses dans une zone géographique définie. L'EEC compte 22 régions synodales couvrant l'ensemble du territoire camerounais. La région synodale est le premier niveau hiérarchique sous le Bureau National.

**Shapefile :** Format de fichier géospatial vectoriel développé par ESRI, largement utilisé pour la représentation de données géographiques. Un shapefile est constitué de plusieurs fichiers complémentaires (.shp, .dbf, .prj, .shx) qui encodent la géométrie, les attributs et le système de coordonnées des entités géographiques.

**SLD (Styled Layer Descriptor) :** Standard OGC permettant de décrire la symbolisation et l'apparence d'une couche géographique publiée via WMS. Les fichiers SLD définissent les couleurs, tailles et règles d'affichage des entités géographiques sur la carte.

**Tuile cartographique :** Image raster de dimensions fixes (généralement 256 × 256 pixels) représentant une portion de carte à un niveau de zoom donné. Les bibliothèques cartographiques comme Leaflet assemblent dynamiquement ces tuiles pour former la carte visible par l'utilisateur.

**WFS (Web Feature Service) :** Standard OGC permettant de requêter et de récupérer des données géographiques vectorielles (points, lignes, polygones) depuis un serveur cartographique, généralement au format GeoJSON ou GML. Contrairement au WMS qui retourne des images, le WFS retourne des données brutes manipulables côté client.

**WMS (Web Map Service) :** Standard OGC permettant de requêter des cartes sous forme d'images raster depuis un serveur cartographique. Le client envoie une requête HTTP spécifiant l'étendue géographique et les couches souhaitées ; le serveur retourne une image PNG ou JPEG correspondante.
