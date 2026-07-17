# GEOEEC — Rapport des grandes fonctionnalités du projet

## Présentation générale

GEOEEC est une plateforme web de géolocalisation institutionnelle développée pour l'Église
Évangélique du Cameroun (EEC). Elle centralise, sur une carte interactive et un back-office
d'administration, l'ensemble des entités territoriales de l'Église — régions synodales,
districts, paroisses — ainsi que les œuvres sociales/éducatives et les ouvriers ecclésiastiques
qui y sont rattachés. Le projet répond à un besoin concret de la Direction Nationale : remplacer
une gestion manuelle par tableurs (dispersée, non traçable, sans vue géographique d'ensemble)
par un système numérique unique, hiérarchisé et sécurisé.

**Stack technique** : backend Django 5 + GeoDjango + Django REST Framework (API + PostGIS),
GeoServer pour la diffusion cartographique (WMS/WFS), frontend Next.js 14 / TypeScript /
Tailwind / Leaflet, cache Redis, le tout orchestré via Docker Compose.

## Grandes fonctionnalités

### 1. Vitrine publique et carte interactive
Une landing page présente l'Église (mission, direction, statistiques clés, œuvres) et
redirige vers une **carte publique** (`/carte`) permettant à tout visiteur de localiser une
paroisse, un district ou une région, de consulter ses informations de base et de naviguer
dans la hiérarchie territoriale sans authentification.

### 2. Administration hiérarchisée à 4 niveaux (RBAC)
Le cœur du système est un contrôle d'accès basé sur les rôles, calqué sur l'organisation
synodale de l'EEC :
- **Administrateur Général** — accès national complet ;
- **Administrateur Régional** — périmètre limité à sa région synodale ;
- **Administrateur District** — périmètre limité à son district ;
- **Administrateur Paroissial** — gestion de sa seule paroisse.

Chaque rôle dispose de son propre espace d'administration (tableau de bord, listes filtrées
à son périmètre géographique) avec authentification, inscription et récupération de mot de
passe.

### 3. Gestion des données métier (CRUD)
Interfaces d'administration pour créer, consulter, modifier et supprimer :
- les entités géographiques (régions, districts, paroisses) avec leurs coordonnées ;
- les **œuvres** de l'Église (écoles, centres de santé, exploitations agropastorales,
  immeubles, terrains, etc.) ;
- les **ouvriers ecclésiastiques** (pasteurs, évangélistes, diacres…) et leurs affectations ;
- les **statistiques annuelles** par paroisse (communiants, baptêmes, offrandes…).

### 4. Cartographie SIG
Les couches géographiques (polygones des régions/districts, points des paroisses) sont
servies par **GeoServer** en WMS/WFS et affichées via **Leaflet**, avec des styles
cartographiques dédiés (SLD) par niveau hiérarchique et par type d'entité.

### 5. Import / Export de données
Des modules dédiés permettent l'import en masse de paroisses, œuvres et ouvriers depuis des
fichiers Excel, ainsi que l'export des données (Excel) et des statistiques (PDF), pour
fluidifier la migration depuis les anciens fichiers tableur et faciliter le reporting.

### 6. Journal d'audit et traçabilité
Chaque action de création, modification ou suppression effectuée dans le back-office est
consignée dans un journal d'activité consultable par les administrateurs, répondant à
l'exigence de traçabilité absente du système manuel précédent.

### 7. Suivi des visiteurs et analytics
Un module dédié trace les consultations de paroisses et l'historique de recherche des
visiteurs authentifiés (préférences de langue, paroisse/région affiliée), alimentant des
statistiques d'usage (paroisses les plus consultées, tendances de recherche).

## En résumé

GEOEEC combine une vitrine cartographique publique et un back-office multi-rôles pour
donner à l'EEC, pour la première fois, une vue géographique unifiée et une administration
hiérarchisée, traçable et sécurisée de ses régions, districts, paroisses, œuvres et
ouvriers.
