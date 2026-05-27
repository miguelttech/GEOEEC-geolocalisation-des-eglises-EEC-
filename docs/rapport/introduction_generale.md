# Introduction Générale — Rapport EEC Géolocalisation
# Source de vérité pour la rédaction LaTeX

---

## CONTEXTE GÉNÉRAL

La transformation numérique des institutions publiques et religieuses constitue l'un des axes stratégiques du développement durable en Afrique subsaharienne. Selon l'Union Internationale des Télécommunications, le taux de pénétration d'Internet en Afrique subsaharienne a atteint 36 % en 2023 [1], progressant de plus de dix points en cinq ans grâce au déploiement massif des réseaux mobiles. La région comptait en 2023 plus de 615 millions d'abonnés à la téléphonie mobile [2], une dynamique qui confère aux technologies web un rôle central dans la modernisation des organisations de toute nature. Au Cameroun, cette tendance est amplifiée par la Stratégie Nationale de Développement 2020–2030 (SND30), qui identifie explicitement la numérisation de l'administration publique et des institutions nationales comme l'un des leviers prioritaires du développement économique [3].

Dans ce contexte, les Systèmes d'Information Géographique (SIG) se sont imposés comme des outils incontournables pour la gestion et la visualisation des données territoriales. Un SIG est un système informatique conçu pour la collecte, le stockage, la manipulation, l'analyse et la représentation de données géoréférencées [4]. À l'échelle mondiale, ces plateformes sont déployées dans des domaines aussi variés que la santé publique, la gestion urbaine, la logistique humanitaire et la planification administrative. La standardisation des échanges de données géographiques via l'Open Geospatial Consortium (OGC) — notamment les protocoles Web Map Service (WMS) [5] et Web Feature Service (WFS) [6] — a rendu ces technologies accessibles à des organisations de toute taille et de tout secteur, y compris les institutions confessionnelles.

Les organisations religieuses occupent une place déterminante dans le tissu social de l'Afrique centrale. Elles constituent souvent le premier réseau d'établissements scolaires, de centres de santé et de structures d'encadrement rural présent dans les zones éloignées des grandes agglomérations [7]. Leur capacité à gérer efficacement des ressources géographiquement dispersées à travers de larges territoires nationaux constitue un enjeu direct pour le développement des communautés qu'elles desservent.


## CONTEXTE SPÉCIFIQUE

L'Église Évangélique du Cameroun (EEC), fondée en 1957 dans la continuité des missions protestantes bâloises et parisiennes, est l'une des plus grandes institutions protestantes d'Afrique centrale. Son organisation territoriale repose sur une hiérarchie administrative à quatre niveaux : le Bureau National, qui assure la direction centrale de l'institution ; les 22 Régions Synodales, qui couvrent l'ensemble du territoire camerounais ; les 134 districts ecclésiaux, qui coordonnent les activités locales ; et les 565 paroisses, qui constituent le maillage de base de la présence de l'EEC sur le terrain. À ces entités s'ajoutent 311 œuvres sociales et éducatives — établissements scolaires, centres médicaux, exploitations agropastorales, immeubles et terrains — et plus de 685 ouvriers ecclésiastiques (pasteurs, évangélistes, diacres permanents) répartis sur l'ensemble de ce réseau.

Malgré cette envergure nationale considérable, l'EEC ne dispose à ce jour d'aucun système numérique centralisé permettant la visualisation géographique de ses entités, leur administration hiérarchisée selon les périmètres synodaux, ni la consolidation automatique de leurs données statistiques. La localisation des paroisses, la gestion des affectations des ouvriers et le suivi des statistiques annuelles sont gérés manuellement via des fichiers tableur transmis périodiquement entre niveaux hiérarchiques. Cette situation génère plusieurs problèmes opérationnels concrets :

- L'absence de vue géographique d'ensemble empêche le Bureau National d'identifier les zones sous-dotées en ressources pastorales ou d'optimiser l'affectation des ouvriers ecclésiastiques ;
- La dispersion des données dans des fichiers Excel non interconnectés rend toute consolidation statistique nationale laborieuse et sujette à des erreurs de saisie ou de transmission ;
- L'absence de contrôle d'accès formalisé fait que les modifications de données peuvent être effectuées à n'importe quel niveau sans traçabilité, compromettant l'intégrité des informations institutionnelles ;
- L'absence de coordonnées GPS valides pour 127 paroisses, soit 22 % de l'effectif total identifié lors de l'audit des données, illustre l'inexistence d'un processus structuré de collecte et de validation des informations de localisation.

Cette situation est d'autant plus problématique que l'EEC est régulièrement sollicitée pour fournir des statistiques précises à ses partenaires internationaux, aux administrations publiques camerounaises et à ses donateurs institutionnels.


## APERÇU DES SOLUTIONS EXISTANTES

Plusieurs catégories de solutions pourraient théoriquement répondre aux besoins identifiés. Les plateformes SIG généralistes comme ArcGIS Online [8] ou Google Maps Platform [9] offrent des capacités cartographiques avancées mais demeurent des outils génériques, soumis à des licences commerciales onéreuses, dépourvus de toute logique hiérarchique institutionnelle et inadaptés à une gestion intégrée des données métier. Les outils open source comme QGIS [10] ou OpenLayers permettent la visualisation cartographique avancée mais ne constituent pas des plateformes web multi-utilisateurs dotées de contrôle d'accès et de gestion de données métier déployables dans un navigateur standard. Une première version d'une plateforme de géolocalisation EEC avait été développée antérieurement et offrait une cartographie de base — mais elle reposait sur des fichiers GeoJSON statiques plutôt que sur un serveur cartographique standardisé, elle ne disposait pas d'un mécanisme d'authentification sécurisé par sessions ni d'un journal d'audit des modifications, et son contrôle d'accès ne correspondait pas à la granularité de la hiérarchie synodale de l'EEC.

Aucune de ces solutions ne répond simultanément aux exigences d'une plateforme institutionnelle sécurisée, intégrée, alignée sur la structure synodalo-hiérarchique de l'EEC et déployable dans un environnement à infrastructure informatique limitée.


## PROBLÉMATIQUE

L'analyse du contexte fait apparaître une lacune précise et documentée : l'EEC dispose de données structurées sur l'ensemble de ses entités territoriales, mais ne possède pas de plateforme numérique permettant leur visualisation géographique centralisée, leur gestion hiérarchisée selon les périmètres synodaux à quatre niveaux, ni leur mise à jour contrôlée et traçable par des administrateurs aux périmètres de responsabilité différenciés.

**Question de recherche :** *Comment concevoir et implémenter une plateforme web cartographique institutionnelle répondant simultanément aux exigences de visualisation géographique interactive, d'administration hiérarchisée à quatre niveaux de l'autorité synodale et de sécurité des données de l'Église Évangélique du Cameroun ?*


## HYPOTHÈSE DE SOLUTION

Nous posons l'hypothèse qu'une architecture à services découplés — combinant un backend Django 5 avec GeoDjango et Django REST Framework pour la logique métier et les API, une base de données PostgreSQL avec l'extension PostGIS pour la persistance des données spatiales, un serveur cartographique GeoServer 2.26 pour la publication des couches géographiques selon les standards OGC (WMS et WFS), et une interface Next.js 14 pour la consultation publique et l'administration — permettrait de répondre à cette problématique. La sécurité serait assurée par un mécanisme d'authentification par sessions Django (HttpOnly, Secure, SameSite) et un contrôle d'accès basé sur les rôles (RBAC) à quatre niveaux hiérarchiques aligné sur la structure synodale. La conteneurisation de l'ensemble via Docker Compose garantirait la reproductibilité de l'environnement d'exécution et la facilité du déploiement.


## OBJECTIFS

Pour répondre à cette problématique, le présent travail poursuit les objectifs suivants :

1. **Modéliser** la structure de données hiérarchique de l'EEC (régions synodales, districts, paroisses, œuvres sociales, ouvriers ecclésiastiques) dans un schéma de base de données relationnelle-spatiale PostGIS intégrant les contraintes d'intégrité référentielle et les informations de géolocalisation des entités ;

2. **Développer** un backend API REST sécurisé avec Django 5 et Django REST Framework, implémentant un contrôle d'accès basé sur les rôles à quatre niveaux — national, régional, district et paroissial — et un journal d'audit automatique de toutes les opérations d'écriture ;

3. **Configurer** un serveur cartographique GeoServer 2.26 publiant les couches géographiques de l'EEC (régions synodales, paroisses, œuvres, zones d'influence, itinéraires) selon les standards OGC WMS 1.3.0 et WFS 2.0.0, avec des styles SLD aux couleurs institutionnelles de l'EEC ;

4. **Implémenter** une interface cartographique interactive basée sur Leaflet.js avec regroupement automatique des marqueurs (clustering), filtres hiérarchiques multicritères par région, district et type d'entité, popups de détail par entité et contrôle dynamique des couches ;

5. **Réaliser** un module d'administration multi-niveaux en Next.js 14 permettant le CRUD complet des entités selon le périmètre du rôle, l'import des données depuis les fichiers Excel sources, l'export PDF et Excel des données et statistiques, et la visualisation des statistiques avancées par région et par année ;

6. **Conteneuriser** l'ensemble de la plateforme avec Docker Compose en cinq services (backend Django, base PostGIS, serveur GeoServer, cache Redis, frontend Next.js) pour garantir la reproductibilité de l'environnement d'exécution et simplifier le déploiement.


## APPROCHE MÉTHODOLOGIQUE

La démarche adoptée s'organise en phases séquentielles et itératives. Une première phase d'audit des données sources (fichiers Excel paroisses, ouvriers et œuvres ; Shapefile des régions synodales) permet de valider la structure réelle des données avant toute modélisation, notamment d'identifier les problèmes de qualité des données — inversion des coordonnées GPS, incohérences de nommage des régions, paroisses sans géolocalisation. Une deuxième phase de conception définit le schéma de base de données, l'architecture des services et les modèles UML. L'implémentation procède ensuite couche par couche : modèles de données et imports, API REST avec sécurisation, publication GeoServer des couches cartographiques, développement du frontend public et de l'interface d'administration. Une phase finale de validation fonctionnelle couvre les scénarios d'utilisation des quatre profils d'accès (visiteur anonyme, super administrateur national, administrateur régional, administrateur paroissial) et les tests de sécurité conformément aux recommandations OWASP.


## ORGANISATION DU RAPPORT

La suite de ce mémoire est structurée comme suit. Le Chapitre 1 présente les concepts généraux fondamentaux — SIG, standards OGC, architecture REST, contrôle d'accès basé sur les rôles — et expose l'état de l'art des solutions de gestion cartographique institutionnelle existantes ; il conclut par un tableau comparatif et un positionnement de notre solution par rapport à l'existant. Le Chapitre 2 expose l'analyse des besoins à travers un tableau d'exigences fonctionnelles et non-fonctionnelles ainsi que les diagrammes UML nécessaires à la compréhension du système, puis présente la conception de l'architecture technique retenue. Le Chapitre 3 détaille l'environnement d'implémentation et les choix technologiques, présente les résultats à travers les interfaces fonctionnelles de la plateforme, et propose une discussion critique des forces et des limites de la solution réalisée. Une Conclusion Générale clôt ce document en synthétisant les apports du travail, ses limites et les perspectives d'amélioration et de déploiement à venir.

---

## NOTES DE RÉDACTION (ne pas inclure dans le LaTeX)

- Nombre de paroisses : 565 (source AUDIT v2, Feuil2 nettoyée — corriger le résumé qui dit 553)
- Nombre ouvriers : 685 (source sections_préliminaires, à vérifier)
- Nombres à citer dans le texte avec tilde pour espaces insécables en LaTeX : 565~paroisses
- Références bibliographiques à valider avant soumission finale
