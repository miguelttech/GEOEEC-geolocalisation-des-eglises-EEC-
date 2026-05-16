




CAHIER DES CHARGES




DEPLOIEMENT ET CONSULTATION EN LIGNE DE LA PLATEFORME DE GEOLOCALISATION DES PAROISSES ET ŒUVRES DE L’ÉGLISE ÉVANGELIQUE DU CAMEROUN (EEC)

 
1. CONTEXTE ET JUSTIFICATION
Dans le cadre de son projet de géolocalisation nationale des paroisses et œuvres, l’EEC a constitué une base de données spatiales via KoboToolbox.
Afin de valoriser et sécuriser ces données, l’EEC lance le Département Génie Informatique et l’EEC sollicite un stagiaire  IT chargé de concevoir, développer, sécuriser et déployer une plateforme web cartographique interactive accessible via Internet.
Afin de permettre :
•	Une visualisation cartographique dynamique,
•	Une consultation hiérarchisée des données (National – Régional – District – Paroisse -Oeuvre),
•	Une aide à la décision stratégique,
•	Une communication institutionnelle moderne,
Il est prévu le déploiement d’une plateforme web spatiale dynamique accessible via Internet.
2. OBJECTIF GÉNÉRAL
La conception, le développement, l’intégration, le déploiement et la maintenance initiale d’une plateforme web SIG (Système d’Information Géographique) dynamique permettant la consultation en ligne des paroisses et œuvres de l’EEC au Cameroun.
Mettre en place et déployer une plateforme web cartographique sécurisée permettant :
•	La consultation en ligne des paroisses et œuvres de l’EEC,
•	L’affichage dynamique des statistiques par Région Synodale,
•	La mise à jour contrôlée des données,
•	L’accès différencié selon les niveaux hiérarchiques.
3. OBJECTIFS SPÉCIFIQUES
1.	Intégrer la base de données existante (Excel + Shapefile).
2.	Publier une carte web interactive.
3.	Structurer l’affichage hiérarchique :
o	Bureau National
o	Régions Synodales
o	Districts
o	Paroisses
o	Œuvres
4.	Mettre en place un système d’administration sécurisé.
5.	Déployer la plateforme sur un serveur web accessible via nom de domaine.


4. PÉRIMÈTRE TECHNIQUE
4.1 Données à intégrer
•	Fichiers Excel (paroisses, œuvres, ouvriers, fidèles)
•	Coordonnées géographiques (latitude/longitude)
•	Fichiers SHP (limites administratives Cameroun + Régions synodales)
•	Données statistiques consolidées
4.2 Développement
•	Intégration base PostgreSQL/PostGIS
•	Intégration couches SHP (limites administratives, régions synodales)
•	Développement interface web interactive
•	Mise en place moteur cartographique (Leaflet, OpenLayers ou équivalent)
•	Intégration fond cartographique (OpenStreetMap ou imagerie satellite)
4.3 Fonctionnalités obligatoires
•	Carte dynamique interactive
•	Recherche multicritère
•	Affichage hiérarchique (National – Régional – District – Paroisse)
•	Statistiques dynamiques par région synodale
•	Gestion des œuvres par typologie (scolaire, santé, terrain, etc.)
•	Module d’administration sécurisé
•	Système d’authentification multi-niveaux
•	Export des données
4.4 Sécurité
•	Certificat SSL (HTTPS)
•	Sauvegardes automatiques
•	Protection contre intrusion
•	Journalisation des connexions
•	Cryptage des mots de passe
4.5 Déploiement
•	Installation sur serveur cloud ou dédié
•	Configuration nom de domaine
•	Tests fonctionnels et sécuritaires
•	Mise en production
4.6 Formation
•	Formation des administrateurs nationaux
•	Manuel technique
•	Manuel utilisateur

5. ARCHITECTURE TECHNIQUE RECOMMANDÉE
5.1 Backend (Serveur)
•	Serveur Linux (Ubuntu recommandé)
•	Base de données PostgreSQL + PostGIS
•	Serveur cartographique (GeoServer ou MapServer)
•	API REST pour consultation des données
5.2 Frontend (Interface web)
•	HTML5 / CSS3 / JavaScript
•	Bibliothèque cartographique : Leaflet ou OpenLayers
•	Fond cartographique :
o	OpenStreetMap
o	Imagerie satellite (selon disponibilité)
6. FONCTIONNALITÉS ATTENDUES
6.1 Consultation publique
•	Carte interactive plein écran
•	Zoom/Dézoom
•	Recherche par :
o	Région Synodale
o	District
o	Paroisse
o	Type d’œuvre
•	Popup d’information au clic
•	Affichage hiérarchique différencié par taille et couleur d’icônes
•	Légende dynamique
•	Statistiques automatiques par polygone (clic sur Région Synodale)
6.2 Hiérarchisation visuelle
Niveau	Représentation
Bureau National	Icône grande taille
Région Synodale	Icône moyenne
District	Icône intermédiaire
Paroisse	Icône standard
Œuvres	Icônes colorées par type
7. MODULE D’ADMINISTRATION
7.1 Accès sécurisé
•	Authentification (login/mot de passe)
•	Rôles hiérarchisés :
o	Super Administrateur (National)
o	Administrateur Régional
o	Administrateur District
o	Administrateur Paroissial
7.2 Fonctions administratives
•	Ajouter une nouvelle paroisse
•	Modifier les coordonnées
•	Ajouter une œuvre
•	Modifier statistiques
•	Importer nouveaux fichiers Excel
•	Exporter données

8. SÉCURITÉ DES DONNÉES
Compte tenu du caractère sensible et confidentiel des données :
•	Hébergement sécurisé (HTTPS)
•	Certificat SSL
•	Sauvegarde automatique quotidienne
•	Restriction IP pour administration
•	Journalisation des connexions
•	Cryptage des mots de passe
9. DÉPLOIEMENT
9.1 Infrastructure
•	Hébergement cloud ou serveur dédié
•	Nom de domaine dédié (ex: geo.eec-cameroun.org)
•	Installation serveur web (Apache ou Nginx)
9.2 Étapes
1.	Préparation base de données
2.	Intégration des couches spatiales
3.	Développement interface
4.	Tests internes
5.	Validation par Bureau National
6.	Mise en production
7.	Formation des administrateurs
10. STRUCTURE VISUELLE DE LA PAGE D’ACCUEIL
•	En-tête : Logo officiel EEC
•	Présentation institutionnelle
•	Photos des membres du Bureau National
•	Carte dynamique au centre
•	Légende interactive à droite
•	Pied de page : mentions légales
11. CONSULTATION VIA INTERNET
La plateforme devra être :
•	Accessible via ordinateur
•	Compatible mobile (responsive design)
•	Compatible navigateurs modernes (Chrome, Edge, Firefox)
12. PERFORMANCE
•	Temps de chargement < 5 secondes
•	Optimisation des couches spatiales
•	Mise en cache des tuiles cartographiques
13. LIVRABLES ATTENDUS
1.	Plateforme fonctionnelle en ligne
2.	Base de données structurée
3.	Manuel utilisateur
4.	Manuel administrateur
5.	Plan de maintenance
6.	Code source documenté
7.	Plateforme web opérationnelle
8.	Rapport final de déploiement

14. CALENDRIER INDICATIF
Phase	Durée estimée
Conception technique	2 semaines
Développement	4 semaines
Tests et validation	2 semaines
Déploiement	1 semaine
Durée totale estimée : 9 semaines
15. MAINTENANCE ET ÉVOLUTIVITÉ
•	Maintenance corrective annuelle
•	Mise à jour des données trimestrielle
•	Possibilité future :
o	Application mobile dédiée
o	Tableau de bord décisionnel avancé
o	Module statistique automatisé
16. CONTRAINTES
•	Confidentialité stricte des données
•	Validation hiérarchique obligatoire avant publication
•	Mise à jour centralisée sous contrôle du Bureau National
17. CONCLUSION
Le présent cahier des charges définit les spécifications techniques, fonctionnelles et sécuritaires nécessaires au déploiement et à la consultation via Internet de la plateforme de géolocalisation des paroisses et œuvres de l’EEC.
Ce dispositif constitue :
•	Un outil stratégique d’aide à la décision,
•	Un instrument moderne de gouvernance ecclésiale,
•	Un levier de communication institutionnelle nationale.

 
ANNEXE : TERMES DE RÉFÉRENCE (TDR) COMPLETS
Recrutement d’un stagiaire IT pour la conception, le développement et le déploiement de la plateforme web SIG de géolocalisation des paroisses et œuvres de l’Église Évangélique du Cameroun (EEC)
1. CONTEXTE
Dans le cadre de son projet national de géolocalisation des paroisses et œuvres, l’EEC a mis en place un dispositif de collecte numérique des données via KoboToolbox.
Les données collectées comprennent :
•	Localisation GPS des structures
•	Données hiérarchiques (National, Régional, District, Paroisse)
•	Données statistiques (ouvriers, fidèles, œuvres)
•	Limites administratives et synodales (format SHP)
Afin de valoriser ces données et de renforcer la gouvernance territoriale, l’EEC souhaite développer une plateforme web cartographique dynamique accessible via Internet.
2. OBJECTIF DE LA MISSION
2.1 Objectif général
Développer et déployer une plateforme web SIG sécurisée permettant :
•	La visualisation cartographique interactive des paroisses et œuvres
•	L’exploitation statistique par région synodale
•	La mise à jour hiérarchisée des données
•	L’aide à la décision institutionnelle
2.2 Objectifs spécifiques
•	Intégrer la base de données existante
•	Développer une interface web ergonomique
•	Assurer la sécurité des données
•	Mettre en place un système d’administration multi-niveaux
•	Former les administrateurs
3. DESCRIPTION DÉTAILLÉE DE LA MISSION
Le prestataire devra réaliser les tâches suivantes :
3.1 Phase 1 : Conception
•	Analyse des besoins fonctionnels
•	Analyse des données existantes (Excel, SHP)
•	Conception du modèle conceptuel de données
•	Proposition d’architecture technique
•	Validation par le Bureau National
Livrable :
Rapport de conception validé
3.2 Phase 2 : Mise en place de l’infrastructure
•	Installation serveur (cloud ou dédié)
•	Configuration environnement Linux
•	Installation PostgreSQL/PostGIS
•	Installation serveur cartographique (GeoServer recommandé)
•	Configuration HTTPS (certificat SSL)
Livrable :
Infrastructure opérationnelle
3.3 Phase 3 : Développement de la plateforme
3.3.1 Base de données
•	Structuration des tables
•	Importation des données Kobo
•	Intégration des shapefiles
•	Mise en place relations hiérarchiques
3.3.2 Interface cartographique
•	Carte interactive (Leaflet ou OpenLayers)
•	Intégration fond cartographique :
o	OpenStreetMap
•	Zoom/Dézoom
•	Recherche multicritère
•	Popup d’information au clic
•	Légende dynamique
3.3.3 Module statistique
•	Calcul automatique :
o	Nombre de paroisses
o	Nombre d’œuvres
o	Nombre d’ouvriers
o	Nombre de fidèles
•	Affichage par région synodale
•	Export PDF/Excel
3.3.4 Module d’administration
•	Authentification sécurisée
•	Gestion des rôles :
o	Super Administrateur (National)
o	Administrateur Régional
o	Administrateur District
o	Administrateur Paroissial
•	Ajout / modification / suppression de données
•	Importation de fichiers Excel
Livrable :
Plateforme fonctionnelle en environnement de test
3.4 Phase 4 : Tests et validation
•	Tests techniques
•	Tests de sécurité
•	Tests de charge
•	Recette fonctionnelle avec l’EEC
Livrable :
Procès-verbal de validation
3.5 Phase 5 : Déploiement et formation
•	Mise en production
•	Formation des administrateurs nationaux
•	Remise documentation complète
Livrables :
•	Plateforme en ligne
•	Manuel utilisateur
•	Manuel administrateur
•	Documentation technique
4. SPÉCIFICATIONS TECHNIQUES MINIMALES
4.1 Technologies recommandées
•	Backend : PostgreSQL + PostGIS
•	Serveur cartographique : GeoServer
•	Frontend : HTML5 / CSS3 / JavaScript
•	Framework cartographique : Leaflet ou OpenLayers
•	API REST sécurisée
5. EXIGENCES EN MATIÈRE DE SÉCURITÉ
•	Protocole HTTPS obligatoire
•	Cryptage des mots de passe
•	Sauvegardes automatiques quotidiennes
•	Journalisation des accès
•	Restriction des accès administratifs
•	Protection contrattaques XSS / SQL Injection
6. LIVRABLES FINAUX
1.	Plateforme web opérationnelle
2.	Code source complet
3.	Base de données structurée
4.	Documentation technique
5.	Manuel utilisateur
6.	Plan de maintenance
7.	Rapport final
11. PROPRIÉTÉ INTELLECTUELLE
•	Le code source et la base de données seront la propriété exclusive de l’EEC.
•	Aucun droit de reproduction sans autorisation écrite.
12. CONFIDENTIALITÉ
Les données traitées sont sensibles et confidentielles.
Un engagement de confidentialité devra être signé.
13. RÉSULTATS ATTENDUS
À l’issue de la mission, l’EEC devra disposer :
•	D’un outil stratégique national
•	D’un système de gestion territoriale moderne
•	D’un dispositif sécurisé et évolutif

