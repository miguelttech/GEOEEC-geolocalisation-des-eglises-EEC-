# Script Vidéo — Présentation GEOEEC
### Plateforme de Géolocalisation des Paroisses de l'Église Évangélique du Cameroun

> **Format** : 3 intervenants · ~8–10 minutes au total  
> **Ton** : Professionnel, dynamique, convaincant — pitch produit  
> **Indications** : *[en italique]* = instructions de réalisation / transitions

---

---

## PARTIE 1 — L'HISTOIRE ET LE PROBLÈME
### Intervenant 1 · Durée estimée : ~2 min 30

---

*[Plan d'ouverture : carte du Cameroun qui s'anime, des points lumineux apparaissent progressivement sur les villes]*

---

**[ACCROCHE]**

Imaginez une organisation présente dans chaque coin du Cameroun.
Des centaines de paroisses, des milliers de fidèles, des dizaines d'années d'histoire —
et pourtant… aucun outil pour les voir toutes en un seul endroit.

*[Pause 1 seconde]*

Jusqu'à aujourd'hui.

---

**[CONTEXTE]**

L'Église Évangélique du Cameroun — l'EEC — est l'une des plus grandes institutions chrétiennes du pays.
Elle compte des millions de fidèles, répartis dans des centaines de paroisses,
organisées en **districts** et en **régions synodales**, du littoral à l'Adamaoua,
de Douala à Yaoundé, de Bafoussam à Maroua.

*[Carte interactive qui zoome sur différentes régions du Cameroun]*

---

**[LE PROBLÈME]**

Mais derrière cette immensité, il y avait un défi majeur.

Les données étaient éparpillées. Des fichiers Excel stockés sur des ordinateurs isolés.
Des statistiques annuelles envoyées par courrier. Des responsables régionaux qui ne savaient pas combien de paroisses étaient actives dans leur zone.
Des informations sur les ouvriers — les pasteurs, les évangélistes, les diacres — perdues dans des registres papier.

**Résultat ?** Des décisions prises à l'aveugle. Une gestion de l'Église fragmentée.
Un patrimoine informationnel qui se perdait année après année.

*[Animation : fichiers éparpillés, flèches désorganisées, point d'interrogation]*

Et au-delà des responsables — un simple fidèle qui arrive dans une nouvelle ville,
comment trouvait-il la paroisse EEC la plus proche de chez lui ?
Difficilement. Très difficilement.

---

**[LA SOLUTION]**

Nous avons décidé de changer ça.

Nous présentons aujourd'hui **GEOEEC** —
la première plateforme numérique de géolocalisation et de gestion des paroisses de l'EEC Cameroun.

*[Logo GEOEEC apparaît à l'écran, suivi d'un plan large du dashboard et de la carte]*

Une plateforme qui répond à une question simple :
**"Qui fait quoi, où, et combien ?" — en temps réel, pour toute l'Église.**

---

**[LA VISION]**

Notre vision, c'est de donner à chaque personne qui interagit avec l'EEC —
qu'elle soit simple fidèle ou responsable au plus haut niveau —
les outils pour **trouver**, **voir**, **analyser** et **agir**.

Parce qu'une Église qui se connaît, c'est une Église qui peut avancer.

*[Transition douce vers Intervenant 2]*

---

---

## PARTIE 2 — LA TECHNOLOGIE AU SERVICE DE L'ÉGLISE
### Intervenant 2 · Durée estimée : ~3 min

---

*[Plan : écran de code, puis transition vers l'architecture du système représentée visuellement]*

---

**[INTRO TECHNIQUE]**

Laissez-moi vous expliquer comment fonctionne GEOEEC sous le capot —
parce que ce projet, c'est aussi une démonstration de ce que l'ingénierie moderne peut apporter
à une institution comme l'EEC.

---

**[ARCHITECTURE GÉNÉRALE]**

GEOEEC est une application web complète.
Ça veut dire qu'on y accède depuis n'importe quel navigateur — Chrome, Firefox, Edge —
depuis un PC, une tablette ou un smartphone. Aucune installation requise.

Côté architecture, nous avons opté pour une séparation claire entre le **frontend** et le **backend**.

*[Schéma d'architecture : Frontend ↔ API REST ↔ Base de données]*

---

**[FRONTEND]**

Le **frontend** — ce que vous voyez à l'écran —
est développé avec **Next.js 16** et **React 19**, les technologies les plus modernes du développement web.
Le code est entièrement en **TypeScript**, ce qui garantit robustesse et maintenabilité.

Pour les cartes interactives, nous utilisons **Leaflet** couplé à **GeoServer** —
une combinaison de référence dans les systèmes d'information géographique professionnels,
les fameux **SIG**.

GeoServer, c'est le moteur qui sert les couches géographiques :
frontières des régions, tracés des districts, positions GPS des paroisses.
C'est la même technologie utilisée par des organismes cartographiques dans le monde entier.

---

**[BACKEND]**

Le **backend** — le cerveau du système —
est construit sur **Django** et **Django REST Framework**, développés en Python.
C'est un choix solide, éprouvé, utilisé par Instagram, Spotify, des gouvernements entiers.

La base de données est **PostgreSQL** avec l'extension **PostGIS**.
PostGIS, c'est la référence mondiale pour le stockage de données géographiques.
Elle nous permet de stocker non seulement des informations textuelles,
mais aussi des **coordonnées GPS**, de calculer des distances, de faire des requêtes spatiales.

Exemple concret : "Quelle paroisse est la plus proche de tel district ?"
PostGIS peut répondre à cette question en millisecondes.

Pour les performances, nous utilisons **Redis** — un système de cache en mémoire —
qui accélère les requêtes fréquentes et gère les sessions utilisateur de façon sécurisée.

---

**[DOCKER & DÉPLOIEMENT]**

L'ensemble de l'application est **conteneurisé avec Docker**.
Ce terme technique signifie que chaque composant — le frontend, le backend, la base de données, GeoServer, Redis —
fonctionne dans son propre environnement isolé, parfaitement configuré.

*[Animation : 5 containers Docker qui s'allument]*

**5 conteneurs. Une seule commande pour tout démarrer.**

```
docker compose up
```

Et l'application est opérationnelle. Reproductible. Fiable.
Qu'on soit sur un laptop de développeur ou sur un serveur en production.

---

**[SÉCURITÉ]**

La sécurité, c'est non négociable quand on parle de données d'une institution aussi importante que l'EEC.

Nous avons mis en place :
- Un système d'**authentification par sessions sécurisées** avec des cookies dédiés
- Une protection **CSRF** — Cross-Site Request Forgery — qui empêche les attaques web classiques
- Un **contrôle d'accès basé sur les rôles**, le RBAC — chaque utilisateur voit uniquement ce que son niveau autorise
- Un **journal d'audit complet** : chaque action est enregistrée — qui a modifié quoi, quand, depuis quelle adresse IP

*[Transition vers Intervenant 3]*

---

---

## PARTIE 3 — LES FONCTIONNALITÉS ET L'IMPACT
### Intervenant 3 · Durée estimée : ~3 min 30

---

*[Plan : carte interactive en mouvement, puis dashboard avec chiffres qui s'animent]*

---

**[LES DEUX TYPES D'UTILISATEURS]**

Avant de vous montrer les fonctionnalités, comprenons qui utilise GEOEEC.
La plateforme s'adresse à **deux grandes catégories d'utilisateurs**.

*[Schéma : deux camps bien distincts]*

**Premier camp — le grand public.**
Tout le monde peut accéder à la carte de l'EEC, sans créer de compte.
Un simple citoyen, un touriste, un nouveau fidèle —
il ouvre le site, tape sa ville, et localise immédiatement la paroisse EEC la plus proche.
S'il veut aller plus loin, il peut **créer un compte visiteur** en quelques secondes
et accéder à des informations enrichies sur les paroisses, leurs contacts, leurs activités.

**Deuxième camp — les administrateurs authentifiés.**
Ce sont les responsables de l'EEC à tous les niveaux de la hiérarchie.
Ils se connectent à un espace de gestion complet et sécurisé,
avec des droits strictement définis selon leur rôle.

---

**[LA CARTE INTERACTIVE — POUR TOUS]**

Le cœur visible de la plateforme, c'est la **carte interactive**.

*[Démonstration : carte du Cameroun avec clusters de points]*

Chaque paroisse, chaque station, chaque annexe de l'EEC est représentée par un marqueur géolocalisé.
Quand les points sont rapprochés, ils se regroupent automatiquement en **clusters** —
pour garder la carte lisible même avec des centaines de points.

En cliquant sur une paroisse, on accède immédiatement à ses informations complètes :
nom, adresse, district, région, niveau, coordonnées GPS, contacts.

C'est ouvert. C'est public. C'est accessible à n'importe qui, depuis n'importe où.

---

**[LE SYSTÈME DE RÔLES — POUR LES ADMINISTRATEURS]**

Pour les administrateurs, la plateforme fonctionne sur **4 niveaux de rôles**.

*[Schéma pyramidal : SUPER → RÉGION → DISTRICT → PAROISSE]*

**Le Super-Administrateur** — le Secrétariat Général —
voit et gère toute l'Église. Toutes les régions, tous les districts, toutes les paroisses.

**L'Administrateur Régional** gère uniquement sa région synodale —
ses districts, ses paroisses, ses statistiques.

**L'Administrateur de District** est focalisé sur son district.

**L'Administrateur de Paroisse** gère uniquement sa paroisse.

Chacun voit exactement ce qui le concerne — ni plus, ni moins.
Le backend filtre automatiquement toutes les données.
C'est ce qu'on appelle un **scope automatique** : zéro surcharge, zéro risque d'accès non autorisé.

---

**[LE DASHBOARD]**

Le tableau de bord donne en un coup d'œil une vue complète.

*[Plan sur le dashboard avec les widgets animés]*

On y trouve :
le nombre total de paroisses, d'ouvriers, d'œuvres,
les fidèles communiants et non-communiants pour l'année en cours,
un graphique d'évolution sur les 6 dernières années,
les régions avec le plus de fidèles,
et l'activité récente — qui a fait quoi dans le système.

---

**[OUVRIERS, ŒUVRES, STATISTIQUES]**

La plateforme permet de gérer les **ouvriers** de l'EEC —
pasteurs, évangélistes, diacres — avec leur grade, leur paroisse d'affectation, leur statut.

Les **œuvres** de l'EEC sont également gérées :
écoles, hôpitaux, universités, exploitations agropastorales, immeubles, terrains —
toutes géolocalisées sur la carte.

Chaque année, les administrateurs saisissent les statistiques de leur paroisse :
baptêmes, confirmations, mariages, décès, communiants, offrandes, dîmes.
Ces données alimentent les graphiques et peuvent être **exportées en Excel ou en PDF**.

---

**[IMPORT / EXPORT & AUDIT]**

Pour faciliter la migration depuis les anciens fichiers Excel,
la plateforme propose un **import en masse** :
on télécharge un template, on le remplit, on le réimporte.
Des centaines de paroisses ou d'ouvriers importés en quelques secondes.

Et chaque action — connexion, création, modification, suppression —
est enregistrée dans un **journal d'audit** consultable, avec date, heure et utilisateur.

Transparence totale. Traçabilité complète.

---

**[CONCLUSION & CALL TO ACTION]**

*[Les trois intervenants apparaissent ensemble ou fondu enchaîné vers le plan final]*

---

GEOEEC, c'est bien plus qu'un outil technique.
C'est une réponse concrète à un besoin réel de l'EEC Cameroun.

C'est la modernisation d'une gestion qui reposait encore trop souvent sur le papier.

*[Plan sur la carte interactive avec tous les points allumés]*

Avec GEOEEC :
✅ N'importe qui peut localiser une paroisse EEC — immédiatement, sans compte  
✅ Les visiteurs enregistrés accèdent à plus d'informations  
✅ Les administrateurs gèrent leur territoire depuis un espace sécurisé  
✅ Chaque ouvrier a un profil numérique  
✅ Chaque statistique est accessible, analysable, exportable  
✅ Chaque action est tracée et sécurisée  

**Une Église. Une plateforme. Une vision.**

*[Logo GEOEEC + tagline finale]*

> *"Connaître notre Église pour mieux la servir."*

---

*[Générique de fin : noms de l'équipe, technologies utilisées]*

---

---

## ANNEXE — LEXIQUE TECHNIQUE

| Terme | Explication simple |
|---|---|
| **SIG** | Système d'Information Géographique — outil pour gérer des données liées à des lieux |
| **Next.js / React** | Frameworks JavaScript modernes pour créer des interfaces web rapides |
| **Django** | Framework Python pour créer des APIs et des applications web robustes |
| **PostGIS** | Extension de PostgreSQL pour stocker et requêter des données géographiques (GPS) |
| **GeoServer** | Serveur open-source qui diffuse des couches cartographiques sur le web |
| **Docker** | Outil qui emballe une application avec toutes ses dépendances dans des conteneurs isolés |
| **API REST** | Interface de communication standard entre le frontend et le backend |
| **RBAC** | Role-Based Access Control — chaque utilisateur voit uniquement ce que son rôle autorise |
| **CSRF** | Cross-Site Request Forgery — type d'attaque web que la plateforme prévient |
| **Redis** | Base de données en mémoire ultra-rapide pour le cache et les sessions |
| **Cluster** | Regroupement visuel de plusieurs marqueurs proches sur une carte |
| **Dashboard** | Tableau de bord avec indicateurs clés en temps réel |
| **Audit Trail** | Journal chronologique de toutes les actions dans le système |
| **TypeScript** | JavaScript avec une couche de sécurité typée — code plus robuste |
| **Scope automatique** | Filtrage automatique des données selon le rôle de l'utilisateur connecté |

---

*Script rédigé pour la présentation officielle du projet GEOEEC — EEC Cameroun*
