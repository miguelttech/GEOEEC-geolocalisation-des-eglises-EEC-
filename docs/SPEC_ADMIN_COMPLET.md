# SPÉCIFICATION COMPLÈTE — MODULE ADMINISTRATEUR EEC
## Plateforme de Géolocalisation des Paroisses et Œuvres de l'EEC Cameroun

**Version :** 1.0  
**Date :** 25 mai 2026  
**Statut :** Référence de développement — à implémenter avant le backend admin  
**Auteurs :** Équipe technique EEC Géolocalisation  

---

## TABLE DES MATIÈRES

1. [Validation de cohérence](#1-validation-de-cohérence)
2. [Architecture RBAC — Rôles et permissions](#2-architecture-rbac)
3. [Page de connexion (Page 4)](#3-page-de-connexion)
4. [Dashboard Admin National (Page 5)](#4-dashboard-admin-national)
5. [Dashboard Admin Régional (Page 6)](#5-dashboard-admin-régional)
6. [Dashboard Admin District (Page 7)](#6-dashboard-admin-district)
7. [Dashboard Admin Paroisse (Page 8)](#7-dashboard-admin-paroisse)
8. [Gestion des comptes (Page 9)](#8-gestion-des-comptes)
9. [Fiche détail publique d'une paroisse (Page 3)](#9-fiche-détail-publique)
10. [Pages annexes communes à tous les admins](#10-pages-annexes-communes)
11. [Composants UI partagés](#11-composants-ui-partagés)
12. [Fonctionnalités ajoutées — Apports de cette spec](#12-fonctionnalités-ajoutées)
13. [Architecture des routes Next.js](#13-architecture-des-routes)
14. [Checklist d'implémentation](#14-checklist-dimplémentation)

---

## 1. VALIDATION DE COHÉRENCE

### 1.1 Ce que tu as proposé vs nos références

| Ta proposition | Cohérent avec le cahier des charges ? | Cohérent avec le master prompt ? | Verdict |
|---|---|---|---|
| Admin national : tout faire | ✅ "Super Administrateur National" | ✅ rôle SUPER | ✅ Conforme |
| Admin régional : sa région uniquement | ✅ "Administrateur Régional" | ✅ rôle REGION | ✅ Conforme |
| Admin district : son district uniquement | ✅ "Administrateur District" | ✅ rôle DISTRICT | ✅ Conforme |
| Admin paroisse : sa paroisse uniquement | ✅ "Administrateur Paroissial" | ✅ rôle PAROISSE | ✅ Conforme |
| Formulaires de création d'entités | ✅ "Ajout/modification/suppression" | ✅ CRUD | ✅ Conforme |
| Galerie photos par entité | ✅ implicite dans le cahier | ✅ nouveau besoin | ✅ Ajouté et nécessaire |
| Permissions granulaires (cochées lors de la création) | ❌ Non explicite dans le cahier | ✅ Excellent ajout | ✅ Ajouté et recommandé |
| Double authentification | ✅ "sécurité renforcée" cahier | ✅ 2FA TOTP prévu | ✅ Conforme |
| Import Excel | ✅ explicitement demandé | ✅ commandes existantes | ✅ Conforme |
| Export PDF/Excel | ✅ explicitement demandé | ✅ WeasyPrint prévu | ✅ Conforme |
| Statistiques globales visibles par tous les niveaux | Partiellement implicite | Nouveau | ✅ Recommandé |
| Paramètres (mot de passe, thème) | ✅ bonne pratique | ✅ Ajouté | ✅ Nécessaire |

### 1.2 Fonctionnalités de l'ancienne version à intégrer

L'ancienne version (analysée dans ANALYSE_ANCIENNE_VERSION.md) avait des éléments supplémentaires précieux :
- **StatistiqueAnnuelle** : baptêmes, mariages, décès, offrandes, dîmes → **À intégrer dans les formulaires**
- **ZoneInfluence** : polygone autour d'une paroisse → **Fonctionnalité avancée, Phase 2**
- **Itineraire** : routes entre paroisses → **Non prioritaire pour l'instant**
- **Performance Monitor** → **Remplacé par le tableau de bord**
- **Swagger / Redoc** → **À conserver côté backend**
- **Score de performance par région** → **Intégré dans les statistiques régionales**
- **Photos du Bureau National** → **À récupérer et intégrer**

### 1.3 Fonctionnalités que j'ajoute (non mentionnées dans tes documents)

| Fonctionnalité | Justification |
|---|---|
| **Journal d'activité (Audit Trail)** | Requis par le cahier des charges ("journalisation des connexions"). Essentiel pour une institution. |
| **Workflow de validation** | Avant publication, les modifications passent par validation hiérarchique (confirmé par le cahier). |
| **Centre de notifications** | Alerter les admins des événements importants (nouvelles entrées, validations en attente). |
| **Tableau de bord décisionnel avancé** | Mentionné en "évolution future" dans le cahier — on le fait dès maintenant. |
| **Gestion des photos par entité** | Indispensable pour une plateforme institutionnelle moderne. |
| **Réinitialisation mot de passe par email** | Standard de sécurité. |
| **Session active / révocation** | Permet à un admin de voir et fermer ses sessions actives. |
| **Mode maintenance** | L'admin national peut désactiver temporairement la partie publique. |
| **Historique des imports** | Traçabilité de tous les imports Excel effectués. |
| **Vérification GPS automatique** | Au formulaire de création, vérifier que les coordonnées tombent bien au Cameroun. |
| **Carte de prévisualisation** | Dans le formulaire de création d'une paroisse, afficher un mini-carte pour confirmer la position. |

---

## 2. ARCHITECTURE RBAC

### 2.1 Les 4 rôles (modèle Django existant)

```
SUPER (admin national)
  └── REGION (admin régional)
        └── DISTRICT (admin district)
              └── PAROISSE (admin paroisse)
```

### 2.2 Matrice de permissions détaillée

| Action | SUPER | REGION | DISTRICT | PAROISSE |
|--------|-------|--------|----------|---------|
| **RÉGIONS** |
| Voir toutes les régions | ✅ | ✅ (sa région) | ✅ (sa région) | ✅ (sa région) |
| Créer une région | ✅ | ❌ | ❌ | ❌ |
| Modifier une région | ✅ | ❌ | ❌ | ❌ |
| Supprimer une région | ✅ | ❌ | ❌ | ❌ |
| **DISTRICTS** |
| Voir tous les districts | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (son district) |
| Créer un district | ✅ | ✅ | ❌ | ❌ |
| Modifier un district | ✅ | ✅ | ❌ | ❌ |
| Supprimer un district | ✅ | ❌ | ❌ | ❌ |
| **PAROISSES** |
| Voir toutes les paroisses | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Créer une paroisse | ✅ | ✅ | ✅ | ❌ |
| Modifier une paroisse | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse seulement) |
| Supprimer une paroisse | ✅ | ✅ (sa région) | ❌ | ❌ |
| Valider modifications paroisse | ✅ | ✅ (remonte vers régional) | Propose → régional valide | Propose → district valide |
| **ŒUVRES** |
| Voir toutes les œuvres | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Créer une œuvre | ✅ | ✅ | ✅ | ✅ |
| Modifier une œuvre | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Supprimer une œuvre | ✅ | ✅ (sa région) | ❌ | ❌ |
| **OUVRIERS** |
| Voir tous les ouvriers | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Créer un ouvrier | ✅ | ✅ | ✅ | ✅ |
| Modifier un ouvrier | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Supprimer un ouvrier | ✅ | ✅ (sa région) | ❌ | ❌ |
| **STATISTIQUES** |
| Voir statistiques globales | ✅ | ✅ (lecture seule) | ✅ (lecture seule) | ✅ (lecture seule) |
| Saisir/modifier statistiques | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Valider statistiques | ✅ | ✅ (sa région) | ❌ | ❌ |
| Exporter statistiques | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| **IMPORTS** |
| Importer Excel paroisses | ✅ | ✅ (sa région) | ❌ | ❌ |
| Importer Excel ouvriers | ✅ | ✅ (sa région) | ✅ (son district) | ❌ |
| Importer Excel œuvres | ✅ | ✅ (sa région) | ✅ (son district) | ❌ |
| Importer Shapefile | ✅ | ❌ | ❌ | ❌ |
| **COMPTES** |
| Créer un compte | ✅ (tous rôles) | ✅ (district/paroisse seulement) | ✅ (paroisse seulement) | ❌ |
| Modifier un compte | ✅ | ✅ (ses sous-admins) | ✅ (ses sous-admins) | ❌ |
| Désactiver un compte | ✅ | ✅ (ses sous-admins) | ❌ | ❌ |
| Supprimer un compte | ✅ | ❌ | ❌ | ❌ |
| **PHOTOS** |
| Ajouter des photos | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| Supprimer des photos | ✅ | ✅ (sa région) | ✅ (son district) | ✅ (sa paroisse) |
| **PARAMÈTRES SYSTÈME** |
| Mode maintenance | ✅ | ❌ | ❌ | ❌ |
| Configuration GeoServer | ✅ | ❌ | ❌ | ❌ |
| Journal d'activité global | ✅ | ❌ | ❌ | ❌ |
| **PARAMÈTRES PERSONNELS** |
| Modifier son mot de passe | ✅ | ✅ | ✅ | ✅ |
| Activer la 2FA | ✅ | ✅ | ✅ | ✅ |
| Modifier ses préférences | ✅ | ✅ | ✅ | ✅ |

### 2.3 Permissions personnalisées (checkbox à la création du compte)

Quand l'admin national crée un compte, il peut **cocher ou décocher** ces permissions spécifiques :

```
Permissions disponibles pour un Administrateur Régional :
[ ] Peut créer des paroisses
[ ] Peut supprimer des paroisses
[ ] Peut créer des comptes district
[ ] Peut importer des fichiers Excel
[ ] Peut exporter les données
[ ] Peut valider les statistiques
[ ] Peut voir le journal d'activité de sa région
```

Ces permissions sont stockées en BDD et vérifiées à chaque action.

---

## 3. PAGE DE CONNEXION

**Route :** `/admin/login`  
**Accessibilité :** Publique (non authentifiée)  

### 3.1 Layout général

- Fond : `#0F1F14` (vert très sombre, proche du noir) avec un motif géométrique subtil (croix EEC répétées, opacité 4%)
- Aucun scroll — tout tient en plein écran

### 3.2 Bloc central (card de connexion)

```
Largeur : 400px (desktop) / 100% avec padding (mobile)
Fond : rgba(255,255,255,0.96)
Border-radius : 4px
Border : 1px solid rgba(255,255,255,0.15)
Box-shadow : 0 20px 60px rgba(0,0,0,0.4)

┌──────────────────────────────────────────┐
│                                          │
│         [Logo EEC — 64px hauteur]        │
│                                          │
│      Espace Administrateur               │
│  (font-size: 22px, font-weight: 700)     │
│                                          │
│  Accès réservé aux agents autorisés      │
│  (font-size: 13px, couleur: #5F6368)     │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  Adresse email                           │
│  ┌──────────────────────────────────┐    │
│  │ ✉ exemple@eec-cameroun.org       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Mot de passe                            │
│  ┌──────────────────────────────────┐    │
│  │ 🔒 ••••••••••••         [👁]    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [■ Se souvenir de moi]                  │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │       SE CONNECTER               │    │
│  └──────────────────────────────────┘    │
│  (fond vert #2E9744, texte blanc)        │
│                                          │
│  Mot de passe oublié ?                   │
│  (lien simple, couleur #2E9744)          │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  ← Retour à la carte publique            │
│                                          │
└──────────────────────────────────────────┘
```

### 3.3 Flux de connexion

1. L'utilisateur saisit email + mot de passe
2. Si les champs sont vides : message d'erreur inline sous chaque champ
3. Si l'authentification échoue : *"Email ou mot de passe incorrect"* — message rouge sous le bouton
4. **Si 2FA activée** : après validation, redirection vers une deuxième étape :
   - Champ de saisie du code TOTP à 6 chiffres (input centré, grosses cases)
   - Texte : *"Entrez le code de votre application d'authentification"*
   - Lien : *"Je n'ai pas accès à mon application"*
5. Après authentification réussie : redirection vers le dashboard selon le rôle

### 3.4 Réinitialisation du mot de passe

**Route :** `/admin/reset-password`

Étape 1 — Demande :
- Champ email
- Bouton *"Envoyer le lien de réinitialisation"*
- Message de confirmation : *"Un email a été envoyé à {email} si ce compte existe"*

Étape 2 — Nouveau mot de passe (via lien email) :
- Champ nouveau mot de passe + confirmation
- Indicateur de force du mot de passe (barre colorée)
- Règles : min 12 caractères, majuscule, chiffre, caractère spécial
- Bouton *"Définir le nouveau mot de passe"*

### 3.5 Sécurité de la page de connexion

- Après **5 tentatives échouées** : blocage 30 minutes du compte (message affiché)
- Rate limiting : max 10 requêtes/minute par IP sur l'endpoint login
- CSRF token obligatoire sur le formulaire
- Audit log de chaque tentative (réussie ou échouée)

---

## 4. DASHBOARD ADMIN NATIONAL

**Route :** `/admin/dashboard`  
**Rôle requis :** SUPER  

### 4.1 Layout général

```
┌──────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (260px fixe)    │  ZONE PRINCIPALE (flexible)               │
│                          │                                           │
│  [Logo EEC]              │  En-tête de page                         │
│  Admin Général           │  ┌─────────────────────────────────────┐  │
│  ─────────────────────   │  │  Titre + fil d'Ariane + date + 🔔  │  │
│  [Avatar]                │  └─────────────────────────────────────┘  │
│  Jean-Marie EKANGA       │                                           │
│  Super Administrateur    │  Contenu variable selon la section        │
│  ─────────────────────   │                                           │
│  NAVIGATION              │                                           │
│  > Tableau de bord       │                                           │
│  > Carte                 │                                           │
│  > Entités               │                                           │
│    - Paroisses           │                                           │
│    - Œuvres              │                                           │
│    - Ouvriers            │                                           │
│    - Régions             │                                           │
│    - Districts           │                                           │
│  > Statistiques          │                                           │
│  > Import / Export       │                                           │
│  > Comptes               │                                           │
│  > Journal d'activité    │                                           │
│  > Paramètres            │                                           │
│  ─────────────────────   │                                           │
│  🚪 Déconnexion          │                                           │
└──────────────────────────┴───────────────────────────────────────────┘
```

### 4.2 Sidebar navigation

**Style sidebar :**
- Fond : `#1B5E20` (vert EEC foncé)
- Texte : blanc
- Item actif : fond `rgba(255,255,255,0.15)` + barre gauche jaune `#FFD600` 3px
- Items inactifs : `rgba(255,255,255,0.75)` au repos, `#FFFFFF` au survol
- Logo EEC : blanc (version inversée ou mix-blend-mode)
- Séparateurs : `rgba(255,255,255,0.12)`

**Icônes :** SVG custom EEC (pas d'emojis, pas d'icônes génériques) — professionnelles et neutres.

**Sections de navigation :**
```
PRINCIPAL
  Tableau de bord          [icône dashboard]
  Carte interactive        [icône carte]

GESTION DES DONNÉES
  Paroisses               [icône croix]
  Œuvres                  [icône bâtiment]
  Ouvriers                [icône briefcase]
  Régions synodales       [icône compass]
  Districts               [icône network]

DONNÉES & RAPPORTS
  Statistiques            [icône graphique]
  Import / Export         [icône upload/download]
  Galerie photos          [icône image]

ADMINISTRATION
  Comptes utilisateurs    [icône users]
  Journal d'activité      [icône log]

SYSTÈME
  Paramètres              [icône engrenage]
  Déconnexion             [icône exit]
```

### 4.3 En-tête de page (zone principale)

Présente sur toutes les sous-pages du dashboard :

```
┌──────────────────────────────────────────────────────────────────────┐
│  Tableau de bord                        25 mai 2026 — 14:32   [🔔 3] │
│  Accueil / Tableau de bord              [Avatar]  Jean-Marie ▼        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Titre** : Nom de la page courante
- **Fil d'Ariane** : chemin de navigation cliquable
- **Date et heure** : mise à jour en temps réel
- **Cloche notifications** : badge avec nombre de notifications non lues
- **Avatar + nom** : menu déroulant (Mon profil / Paramètres / Déconnexion)

### 4.4 Section Tableau de bord — Vue d'ensemble

#### Widgets statistiques (rangée 1 — 5 cards)

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Régions        │ │ Districts       │ │ Paroisses       │ │ Œuvres          │ │ Ouvriers        │
│                │ │                │ │                │ │                │ │                │
│      22        │ │     137        │ │     693        │ │     311        │ │     685        │
│                │ │                │ │                │ │                │ │                │
│ — données fix  │ │ +2 ce mois     │ │ +5 ce mois     │ │ +1 ce mois     │ │ — données fix  │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

Style des cards :
- Fond blanc, border `1px solid #E8E8E8`, border-radius `4px`
- Nombre : `font-size: 32px, font-weight: 700, color: #1A1A1A`
- Tendance : vert si positif, rouge si négatif
- Icône de la catégorie en haut à droite, couleur EEC appropriée

#### Widgets statistiques (rangée 2 — données fidèles)

```
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Total Fidèles (toutes années)│ │ Paroisses sans GPS            │
│          147,832             │ │            255               │
│ Communiants : 89,450         │ │  37% du total               │
│ Non-commun. : 58,382         │ │  [Voir la liste]            │
└──────────────────────────────┘ └──────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Validations en attente       │ │ Dernière mise à jour données  │
│             7                │ │  23 mai 2026, 09:15           │
│  [Voir les demandes]         │ │  par Jean-Marie EKANGA        │
└──────────────────────────────┘ └──────────────────────────────┘
```

#### Graphiques (section principale)

**Graphique 1 — Top 10 régions par nombre de fidèles (barres horizontales)**
- Bibliothèque : Recharts (déjà dans l'ancienne version)
- Fond blanc, axe Y = noms des régions, axe X = nombre de fidèles
- Barres couleur vert EEC `#2E9744` avec hover tooltip
- Légende : *"Données {année sélectionnée}"*
- Filtre année en haut à droite du graphique (dropdown)

**Graphique 2 — Répartition des types d'œuvres (camembert/donut)**
- Centre du donut : nombre total
- Couleurs par type : scolaire=bleu, médical=rouge, universitaire=violet, agropastoral=orange, immeuble=gris ardoise, terrain=marron
- Légende à droite avec pourcentages

**Graphique 3 — Répartition des niveaux de paroisses (barres)**
- Niveaux : Paroisse / Station / Annexe
- Comparaison possible entre régions

**Graphique 4 — Évolution annuelle des fidèles (courbe)**
- Axe X : années (2020 → 2026)
- Axe Y : nombre de fidèles
- Deux courbes : communiants (vert) / non-communiants (gris)
- Tooltip au survol avec les valeurs exactes

#### Carte miniature

Une carte Leaflet de taille moyenne affichant une vue nationale avec tous les marqueurs actifs.
- Non interactive (readOnly: true), juste visuelle
- Bouton *"Ouvrir la carte complète"* en bas

#### Activité récente

```
┌─────────────────────────────────────────────────────────────────────┐
│ Activité récente                                         Voir tout > │
│ ─────────────────────────────────────────────────────────────────── │
│ [A] Paul ATEBA (Admin District MIFI) a modifié Paroisse Bafoussam   │
│     Centre — il y a 2 heures                                        │
│ [A] Marie-Claire BIYA a importé 12 ouvriers (Excel) — il y a 5h    │
│ [S] Connexion admin@eec-cameroun.org depuis 197.X.X.X — il y a 6h  │
│ [M] 3 statistiques soumises en attente de validation               │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tableau — Paroisses récemment modifiées

| Nom | Région | District | Fidèles | GPS | Modifié le | Actions |
|-----|--------|---------|---------|-----|------------|---------|
| Paroisse Yaoundé-Centre | Centre | Mfoundi | 511 | ✅ | 23 mai 2026 | Voir · Modifier · Supprimer |
| Paroisse Bafoussam-Nord | Ouest | MIFI | 287 | ❌ | 21 mai 2026 | Voir · Modifier · Supprimer |

- Pagination : 10/25/50 lignes par page
- Recherche dans le tableau (champ texte)
- Tri par colonne (clic sur l'en-tête)
- Filtre rapide : Région / District / Statut GPS
- Bouton *"+ Ajouter une paroisse"* en haut à droite

### 4.5 Section Paroisses

**Route :** `/admin/paroisses`

#### Vue liste

Tableau complet de toutes les 693 paroisses avec :

**Colonnes :**
- Nom de la paroisse
- Région synodale
- District
- Niveau (Paroisse / Station / Annexe)
- Communiants
- Total fidèles
- Ouvriers assignés
- GPS (✅ ou ❌ si manquant)
- Photos (nombre)
- Statut (Actif / Inactif)
- Dernière modification
- Actions

**Filtres disponibles (en haut du tableau) :**
- Région (dropdown)
- District (dropdown cascade)
- Niveau (dropdown)
- Statut GPS (tous / avec GPS / sans GPS)
- Statut (actif / inactif)
- Année des statistiques

**Actions en masse :**
- Sélection multiple (checkboxes)
- *"Exporter la sélection (Excel)"*
- *"Exporter la sélection (PDF)"*
- *"Marquer comme actif/inactif"* (SUPER seulement)

**Boutons en haut :**
- `+ Créer une paroisse`
- `⬆ Importer depuis Excel`
- `⬇ Exporter tout`

#### Formulaire de création/modification de paroisse

**Route :** `/admin/paroisses/creer` et `/admin/paroisses/{id}/modifier`

Formulaire en sections (tabs ou scroll vertical) :

**Onglet 1 — Informations générales**
```
Nom de la paroisse *             [champ texte]
Niveau *                         [Paroisse | Station | Annexe]
Région synodale *                [dropdown — 22 régions]
District *                       [dropdown — cascade selon région]
Quartier / Localité              [champ texte]
Adresse complète                 [textarea]
Statut                           [Actif | Inactif]
Date de création (si connue)     [date picker]
Description / Notes              [textarea]
```

**Onglet 2 — Localisation GPS**
```
Latitude *      [champ numérique — ex: 3.8480]
Longitude *     [champ numérique — ex: 11.5021]

[Mini-carte Leaflet — prévisualisation de la position]
 → Le marqueur se déplace en temps réel quand on change les coords
 → Bouton "Obtenir ma position actuelle" (géolocalisation navigateur)
 → Indicateur : "Position dans la zone Cameroun ✅" ou "❌ Position hors du Cameroun"

Copier les coordonnées depuis     [champ texte — entrer coordonnées au format DMS et convertir]
```

**Onglet 3 — Statistiques**
```
Année *                          [dropdown — 2020 à 2026]
Communiants                      [champ numérique]
Non-communiants                  [champ numérique]
Total fidèles                    [calculé automatiquement = comm + non-comm]
                                  [Ou saisir manuellement si total connu]
Ouvriers rattachés               [nombre]

--- Statistiques vitales (optionnel) ---
Baptêmes                         [champ numérique]
Confirmations                    [champ numérique]
Mariages                         [champ numérique]
Décès                            [champ numérique]

--- Données financières (optionnel, confidentiel) ---
Offrandes (FCFA)                 [champ numérique]
Dîmes (FCFA)                     [champ numérique]
```

**Onglet 4 — Galerie photos**
```
Zone de dépôt (drag & drop)
┌─────────────────────────────────────────────────────────────────┐
│  Déposez vos photos ici ou cliquez pour parcourir              │
│  Formats acceptés : JPG, PNG, WebP — Max 5 Mo par photo        │
│  Maximum 20 photos par entité                                  │
└─────────────────────────────────────────────────────────────────┘

Photos existantes (grille 4 colonnes) :
[Photo 1] [Photo 2] [Photo 3] [Photo 4]
  ✕         ✕         ✕         ✕
[Définir comme principale]

Note : La première photo est utilisée dans la fiche détail publique.
```

**Onglet 5 — Ouvriers assignés**
```
Ouvriers actuellement assignés à cette paroisse :

┌────────────────────────────────────────────────────────────────────┐
│ Pasteur Jean-Marie EKANGA (Actif)               [Voir] [Retirer]   │
│ Évangéliste Paul ATEBA (Actif)                  [Voir] [Retirer]   │
└────────────────────────────────────────────────────────────────────┘

[+ Assigner un ouvrier existant]
 → Recherche autocomplete dans la liste des ouvriers
 → Affiche : nom, grade, paroisse actuelle

[+ Créer un nouvel ouvrier]
 → Ouvre le formulaire de création d'ouvrier pré-rempli avec cette paroisse
```

**Onglet 6 — Œuvres liées**
```
Œuvres rattachées à cette paroisse :

[Nom œuvre — Type — Statut] [Voir] [Délier]

[+ Lier une œuvre existante]
[+ Créer une nouvelle œuvre]
```

**Boutons du formulaire :**
```
[Enregistrer comme brouillon]    [Soumettre pour validation]    [Annuler]
                                 (si admin non-SUPER)

ou :

[Annuler]                        [Enregistrer et publier]
                                 (si admin SUPER)
```

#### Vue détail d'une paroisse (admin)

**Route :** `/admin/paroisses/{id}`

Reprend toutes les informations + 2 sections supplémentaires :
- **Historique des modifications** (audit trail de cette paroisse)
- **Demandes de validation en attente** (le cas échéant)

### 4.6 Section Œuvres

**Route :** `/admin/oeuvres`

Même structure que Paroisses avec :

**Colonnes spécifiques :**
- Type d'œuvre (scolaire, médical, universitaire, agropastoral, immeuble, terrain, autre)
- Niveau (paroissial, district, régional, national)
- Capacité (élèves / lits / etc.)
- Statut (active, en construction, suspendue, fermée)
- Paroisse parent
- Budget annuel (FCFA)

**Formulaire de création d'une œuvre :**

```
Onglet 1 — Informations générales
  Nom de l'œuvre *                [champ texte]
  Type d'œuvre *                  [dropdown — tous les types]
  Niveau *                        [paroissial | district | régional | national]
  Paroisse parent                 [dropdown searchable — optionnel]
  District                        [dropdown cascade]
  Région                          [auto-rempli]
  Statut *                        [active | en_construction | suspendue | fermée]
  Date d'inauguration             [date picker]
  Description                     [textarea]
  Capacité                        [champ numérique + unité ex: "350 élèves"]
  Budget annuel (FCFA)            [champ numérique]

Onglet 2 — Localisation GPS
  [Même structure que Paroisse]

Onglet 3 — Galerie photos
  [Même structure que Paroisse]

Onglet 4 — Informations contact
  Responsable de l'œuvre          [champ texte]
  Téléphone                       [champ texte]
  Email                           [champ email]
  Site web                        [champ url — optionnel]
```

### 4.7 Section Ouvriers

**Route :** `/admin/ouvriers`

**Colonnes :**
- Nom complet (prénom + nom)
- Grade (Évêque, Pasteur, Prédicateur, Évangéliste, Catéchiste, Diacre, Aide-Pasteur, Aide-Évangéliste)
- Statut (Actif, Retraité, Suspendu, Décédé)
- Paroisse affectée
- District, Région
- Téléphone
- Date d'ordination
- Actions

**Formulaire de création d'un ouvrier :**

```
Onglet 1 — Identité
  Nom *                    [champ texte]
  Prénom *                 [champ texte]
  Grade *                  [dropdown]
  Statut *                 [Actif | Retraité | Suspendu | Décédé]
  Sexe                     [M | F]
  Date de naissance        [date picker]
  Date d'ordination        [date picker]

Onglet 2 — Affectation
  Paroisse *               [dropdown searchable]
  (Région et District auto-remplis depuis la paroisse)
  Rôle dans la paroisse    [Pasteur principal | Co-pasteur | Évangéliste | etc.]

Onglet 3 — Contact
  Téléphone                [champ texte]
  Email                    [champ email — optionnel]
  Adresse                  [textarea]

Onglet 4 — Photo de profil
  Upload une photo         [drag & drop — 1 seule photo — format carré recommandé]
```

### 4.8 Section Régions

**Route :** `/admin/regions`

- Liste des 22 régions synodales avec : nom, code, nb districts, nb paroisses, total fidèles
- Bouton *"Modifier"* (SUPER uniquement) : nom, code, description
- **Pas de suppression** — les régions sont des entités stables de l'EEC
- Vue cartographique : polygone de chaque région sur une mini-carte Leaflet

### 4.9 Section Districts

**Route :** `/admin/districts`

- Liste avec : nom, code, région parent, nb paroisses, nb œuvres, nb ouvriers
- CRUD complet pour SUPER
- Création limitée à REGION pour sa propre région

### 4.10 Section Statistiques

**Route :** `/admin/statistiques`

**Vue globale :**
- Sélecteur d'année en haut (dropdown)
- Tableau récapitulatif par région : colonnes = région, communiants, non-communiants, total, baptêmes, mariages, décès
- Tri par colonne
- Export PDF / Excel de la vue courante

**Vue par région :**
- Sélectionner une région → détail par district puis par paroisse
- Arbre dépliable : Région > Districts > Paroisses
- Chiffres à chaque niveau

**Vue carte statistique :**
- Choroplèthe (régions colorées selon densité de fidèles — plus foncé = plus de fidèles)
- Tooltip au survol de chaque région

**Saisie des statistiques :**
- Route : `/admin/statistiques/saisir/{paroisse_id}`
- Formulaire simple pour une paroisse + une année
- Les statistiques soumises par des admins non-SUPER sont marquées *"En attente de validation"*

**Validation des statistiques :**
- Route : `/admin/statistiques/validation`
- Liste de toutes les statistiques en attente (soumises par des niveaux inférieurs)
- Pour chaque entrée : Valider ✅ ou Rejeter ❌ avec commentaire

### 4.11 Section Import / Export

**Route :** `/admin/import-export`

**Onglet Import — Paroisses**
```
1. Télécharger le modèle Excel       [Télécharger le modèle]
2. Vérification des colonnes requises  [documentation inline]
3. Zone de dépôt du fichier           [drag & drop Excel]
4. Prévisualisation des données        [tableau 5 premières lignes]
5. Résumé avant import                 "X paroisses à importer, Y à mettre à jour, Z erreurs"
6. Bouton [Lancer l'import]
7. Rapport d'import                    [succès, erreurs, avertissements]
```

**Onglet Import — Ouvriers** (même structure)

**Onglet Import — Œuvres** (même structure, mention des 3 feuilles)

**Onglet Import — Shapefile** (SUPER uniquement)
```
Upload du fichier .zip contenant .shp, .dbf, .prj, .shx
Type de couche : Régions synodales | Limites administratives
Aperçu GeoJSON avant import
Bouton [Publier vers GeoServer]
```

**Onglet Export**
```
Que voulez-vous exporter ?
( ) Toutes les paroisses
( ) Toutes les œuvres
( ) Tous les ouvriers
( ) Toutes les statistiques
( ) Export complet (tout)

Filtres optionnels :
  Région : [dropdown]
  District : [dropdown]
  Année : [dropdown]

Format :
( ) Excel (.xlsx)
( ) CSV
( ) PDF — Rapport formel (avec logo EEC, en-têtes officiels)
( ) GeoJSON (données géographiques)

[Générer l'export]
```

**Onglet Historique des imports**
```
Tableau : Date | Fichier | Type | Importé par | Résultat | Rapport
[Télécharger le rapport] sur chaque ligne
```

### 4.12 Section Journal d'activité

**Route :** `/admin/journal`  
**Accès :** SUPER uniquement pour le journal global

```
Filtres :
  Période : [Aujourd'hui | 7 jours | 30 jours | Plage personnalisée]
  Type d'action : [Connexion | Création | Modification | Suppression | Import | Export]
  Utilisateur : [dropdown tous les comptes]
  Entité : [Paroisse | Œuvre | Ouvrier | Compte | Système]

Tableau :
  Date/Heure | Utilisateur | Action | Entité | Détails | IP
```

Chaque ligne est cliquable et affiche le détail complet de l'action (avant/après pour les modifications).

---

## 5. DASHBOARD ADMIN RÉGIONAL

**Route :** `/admin/dashboard` (même URL — le contenu s'adapte selon le rôle)  
**Rôle requis :** REGION  

### 5.1 Différences par rapport à l'admin national

**Sidebar — menu limité :**
```
PRINCIPAL
  Tableau de bord
  Carte de ma région

MA RÉGION : [Nom de la région]
  Paroisses
  Œuvres
  Ouvriers
  Districts

DONNÉES
  Statistiques
  Import / Export

ADMINISTRATION
  Comptes (mes admins district et paroisse)
  Journal (ma région)

Paramètres
Déconnexion
```

**En-tête avec badge région :**
```
Région Synodale MIFI — 48 paroisses · 28 districts · 156 ouvriers
```

### 5.2 Tableau de bord — Vue régionale

Widgets identiques mais filtrés sur sa région uniquement.

**Widgets spécifiques ajoutés :**
- Carte miniature centrée sur sa région (polygone visible)
- Classement de ses districts par nombre de fidèles
- Validation en attente (statistiques de ses paroisses)

**Graphiques :**
- Top districts de sa région par fidèles
- Répartition des types d'œuvres dans sa région
- Évolution annuelle pour sa région

### 5.3 Accès aux données

L'admin régional voit **uniquement** les données de sa région dans tous les tableaux.
Les dropdowns "Région" dans les filtres sont pré-remplis et non modifiables.

Les boutons *"Supprimer"* sont présents pour ses paroisses.
Les boutons *"Exporter"* s'exportent avec en-tête *"Région Synodale {nom} — EEC"*.

### 5.4 Journal d'activité — Vue régionale

Montre uniquement les actions sur les entités de sa région.

---

## 6. DASHBOARD ADMIN DISTRICT

**Route :** `/admin/dashboard`  
**Rôle requis :** DISTRICT  

### 6.1 Différences

**Sidebar — menu encore plus limité :**
```
PRINCIPAL
  Tableau de bord

MON DISTRICT : [Nom du district]
  Mes Paroisses
  Mes Œuvres
  Mes Ouvriers

DONNÉES
  Statistiques
  Import documents

Paramètres
Déconnexion
```

**En-tête :**
```
District [NOM DISTRICT] — Région [NOM RÉGION]
X paroisses · Y œuvres · Z ouvriers
```

### 6.2 Tableau de bord — Vue district

Widgets filtrés sur son district.

**Ajouts spécifiques :**
- Liste de toutes ses paroisses avec indicateur GPS ✅/❌
- Liste des paroisses sans statistiques pour l'année en cours → incitation à les saisir

### 6.3 Restrictions spécifiques

- Peut modifier les paroisses de son district mais **pas les supprimer**
- Peut ajouter des photos à n'importe quelle paroisse de son district
- Peut importer des ouvriers et des œuvres pour son district
- Ne peut pas créer de comptes admin (sauf compte paroisse selon permissions accordées)

---

## 7. DASHBOARD ADMIN PAROISSE

**Route :** `/admin/dashboard`  
**Rôle requis :** PAROISSE  

### 7.1 Sidebar ultra-simplifiée

```
PRINCIPALE
  Ma paroisse : [Nom]
  Mes statistiques
  Mes ouvriers
  Mes œuvres
  Ma galerie photos

GLOBAL (lecture seule)
  Statistiques nationales
  Carte publique

Paramètres
Déconnexion
```

### 7.2 Vue de sa paroisse

Affiche directement la fiche complète de sa paroisse avec les sections éditables :

**Section modifiable : Informations générales**
- Champs modifiables : quartier, adresse, description, contact
- Champs en lecture seule : nom, région, district, niveau (seulement SUPER ou DISTRICT peut changer)
- Bouton *"Proposer une modification"* → soumet au district pour validation

**Section modifiable : Coordonnées GPS**
- Peut modifier ses propres coordonnées
- Mini-carte de prévisualisation
- Modification soumise au district pour validation

**Section modifiable : Statistiques**
- Formulaire de saisie des statistiques annuelles
- Statut : *"En attente de validation"* après soumission

**Section modifiable : Galerie photos**
- Upload, réorganisation, suppression de ses propres photos
- Max 20 photos

**Section modifiable : Ouvriers**
- Peut voir la liste de ses ouvriers
- Peut ajouter un ouvrier (soumis au district pour validation)
- Ne peut pas supprimer un ouvrier

**Section lecture seule : Œuvres liées**
- Voir les œuvres associées à sa paroisse
- Peut ajouter une œuvre (soumise au district)

### 7.3 Statistiques nationales (lecture seule)

Une section dédiée visible par tous les admins :

```
STATISTIQUES NATIONALES — Année 2025

  Total fidèles : 147,832
  Paroisses : 693
  Ouvriers : 685
  Œuvres : 311

  Votre région (MIFI) :
    Total fidèles : 12,450
    Nb paroisses : 48
    Rang national : 3ème région

  Votre district (BAHAM) :
    Total fidèles : 3,200
    Nb paroisses : 12
    Rang régional : 2ème district
```

---

## 8. GESTION DES COMPTES

**Route :** `/admin/comptes`  
**Accès :** SUPER (tous comptes) | REGION (comptes district/paroisse de sa région) | DISTRICT (comptes paroisse de son district)

### 8.1 Tableau des comptes

**Colonnes :**
| Nom complet | Email | Rôle | Portée | Statut | 2FA | Dernière connexion | Actions |
|---|---|---|---|---|---|---|---|
| Jean-Marie EKANGA | admin@eec.org | Super Admin | National | Actif | ✅ | 25 mai 2026 | Voir · Modifier · Désactiver |
| Paul ATEBA | p.ateba@eec.org | Admin Régional | Région MIFI | Actif | ❌ | 20 mai 2026 | Voir · Modifier · Désactiver |

**Filtres :**
- Rôle (dropdown)
- Région / District (cascade)
- Statut (Actif / Inactif / Bloqué)
- 2FA activée (Oui / Non)

**Actions en masse :**
- Envoyer email de réinitialisation de mot de passe
- Activer/désactiver plusieurs comptes

### 8.2 Formulaire de création d'un compte

**Modal ou page dédiée :**

```
Informations personnelles
  Nom *                    [champ texte]
  Prénom *                 [champ texte]
  Email *                  [champ email — sera le login]
  Téléphone                [champ texte — optionnel]

Rôle et portée
  Rôle *                   [dropdown — selon ses propres permissions]
    → Admin Régional
    → Admin District
    → Admin Paroisse

  Région *                 [dropdown — si rôle = Régional]
  District *               [dropdown cascade — si rôle = District]
  Paroisse *               [dropdown cascade — si rôle = Paroisse]

Sécurité
  Mot de passe temporaire  [généré automatiquement — affiché une seule fois]
  [Copier]   [Régénérer]
  ⚠ Ce mot de passe sera affiché une seule fois. L'admin devra le changer à sa première connexion.

Permissions personnalisées (si Admin Régional)
  [✓] Peut créer des paroisses
  [✓] Peut modifier les paroisses de sa région
  [ ] Peut supprimer des paroisses
  [✓] Peut importer des fichiers Excel
  [✓] Peut exporter les données
  [✓] Peut créer des comptes district
  [ ] Peut créer des comptes paroisse

[Annuler]                         [Créer le compte]
```

Après création : email automatique envoyé à l'admin avec ses identifiants et un lien de connexion.

### 8.3 Vue détail d'un compte

**Route :** `/admin/comptes/{id}`

Sections :
- Informations personnelles (modifiables)
- Rôle et portée (modifiables par SUPER)
- Sécurité :
  - *"Réinitialiser le mot de passe"*
  - *"Révoquer toutes les sessions actives"*
  - Statut 2FA + bouton *"Désactiver la 2FA"* (urgence)
- Historique de connexion (10 dernières connexions avec IP et heure)
- Journal des actions de ce compte (50 dernières actions)
- Permissions actives (liste)

---

## 9. FICHE DÉTAIL PUBLIQUE

**Route :** `/paroisses/{id}` (accessible sans authentification)

### 9.1 En-tête hero (pleine largeur)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Photo principale de l'église — hauteur 340px]                      │
│  [Overlay gradient sombre en bas pour lisibilité]                    │
│                                                                       │
│  ← Retour à la carte                              🔗 Partager        │
│                                                                       │
│                                                                       │
│  PAROISSE                                                             │
│  Yaoundé-Centre                               [Badge: PAROISSE]      │
│  District de Mfoundi · Région du Centre                              │
└──────────────────────────────────────────────────────────────────────┘
```

Si aucune photo : image générique (silhouette d'église EEC, fond vert très clair, croix EEC centrée).

### 9.2 Corps (2 colonnes sur desktop, 1 colonne sur mobile)

**Colonne gauche (60%) :**

Carte Leaflet centrée sur la paroisse :
- Zoom 14, non interactive (scrollWheelZoom: false, dragging: false)
- Marqueur centré avec un popup discret
- Bouton *"Ouvrir dans Google Maps"* sous la carte
- Coordonnées GPS affichées : `3.8480° N, 11.5021° E`
- Bouton *"Copier"* les coordonnées

Si pas de GPS : carte grisée avec message *"Coordonnées GPS non disponibles pour cette paroisse"*

**Colonne droite (40%) :**

**Bloc Statistiques — Année {la plus récente} :**
```
┌─────────────────────────────────────┐
│ STATISTIQUES 2025                   │
│ ─────────────────────────────────── │
│ Communiants              324        │
│ Non-communiants          187        │
│ ─────────────────────────────────── │
│ Total fidèles            511        │
│ ─────────────────────────────────── │
│ Baptêmes                  23        │
│ Mariages                   8        │
│ Décès                      4        │
└─────────────────────────────────────┘
```
Sélecteur d'année pour voir les données d'autres années.

**Bloc Ouvriers :**
```
OUVRIERS (3)
  Pasteur Jean-Marie EKANGA (Actif)         ☎ +237 6XX XXX XXX
  Évangéliste Paul ATEBA (Actif)            ☎ Non renseigné
  Diacre Marie-Claire BIYA (Active)         ☎ +237 6XX XXX XXX
```

**Bloc Œuvres liées :**
```
ŒUVRES (2)
  [🏫] École Primaire EEC Yaoundé-Centre    Niveau : Paroissial
  [🏥] Dispensaire EEC                      Niveau : District
```
Chaque œuvre est cliquable → fiche détail de l'œuvre.

### 9.3 Galerie photos

Grille responsive (3 colonnes desktop, 2 tablette, 1 mobile) :
- Au clic sur une photo : **lightbox** — grande vue, navigation flèches gauche/droite, touche Échap pour fermer
- Si aucune photo : section masquée (pas de grille vide)

### 9.4 Informations complémentaires

**Section Localisation hiérarchique :**
```
Bureau National EEC > Région CENTRE > District MFOUNDI > Paroisse Yaoundé-Centre
```
Chaque niveau est cliquable (filtre la carte sur ce niveau).

**Section Partager :**
- Boutons : Copier le lien · WhatsApp · Télécharger en PDF (fiche de la paroisse)

---

## 10. PAGES ANNEXES COMMUNES À TOUS LES ADMINS

### 10.1 Paramètres personnels

**Route :** `/admin/parametres`

**Onglet Profil**
```
Photo de profil             [Upload — format carré]
Nom complet                 [modifiable]
Email                       [modifiable — entraîne re-vérification]
Téléphone                   [modifiable]
```

**Onglet Sécurité**
```
Changer le mot de passe
  Mot de passe actuel *      [champ masqué]
  Nouveau mot de passe *     [champ masqué + indicateur force]
  Confirmer *                [champ masqué]
  [Changer le mot de passe]

Double authentification (2FA)
  Statut : [Non activée]
  [Activer la 2FA]
  → Affiche un QR code à scanner avec Google Authenticator / Authy
  → Demande de saisir un code TOTP pour confirmer l'activation
  → Affiche 8 codes de secours à noter

Sessions actives
  Liste : appareil, IP, heure, localisation approximative
  [Se déconnecter de toutes les sessions]
  [Se déconnecter de {session spécifique}]
```

**Onglet Préférences**
```
Thème de l'interface
  ( ) Clair          ( ) Sombre          ( ) Automatique (OS)

Langue
  ( ) Français

Notifications email
  [✓] Nouveaux messages de validation
  [✓] Imports terminés
  [ ] Rapport hebdomadaire de ma région
  [ ] Résumé mensuel des statistiques

Format des dates
  ( ) JJ/MM/AAAA     ( ) AAAA-MM-JJ

Fuseau horaire
  [Afrique/Douala (UTC+1)]
```

**Onglet Notifications** (dans l'interface, pas email)
```
Liste de toutes les notifications :
  [Lue/Non lue] — Icône — Message — Date

Actions :
  [Marquer tout comme lu]
  [Supprimer les notifications lues]
```

### 10.2 Centre de notifications (cloche dans l'en-tête)

Panneau dropdown (300px largeur) :

```
Notifications (3 non lues)                         [Marquer tout lu]
──────────────────────────────────────────────────────────────────
● Paul ATEBA a soumis des statistiques pour validation
  District MIFI — il y a 2 heures                    [Voir]

● Import Excel "ouvriers_2026.xlsx" terminé
  153 enregistrements importés avec succès — il y a 4h [Voir]

● Nouvelle connexion depuis un appareil inconnu
  IP: 197.X.X.X — Yaoundé — 25 mai 2026 08:15         [Voir]
──────────────────────────────────────────────────────────────────
[Voir toutes les notifications]
```

Types de notifications :
- Validation demandée / approuvée / rejetée
- Import terminé (succès ou erreurs)
- Connexion inhabituelle (nouveau IP ou nouveau pays)
- Compte créé / désactivé
- Statistiques soumises pour validation

### 10.3 Carte interactive admin

**Route :** `/admin/carte`

Reprend la carte publique (EECApp.tsx) mais avec des fonctionnalités supplémentaires :

- **Bouton d'édition rapide** sur chaque popup : *"Modifier cette paroisse"*
- **Couche de chaleur** (heatmap) : densité de fidèles par zone géographique (optionnel, toggle)
- **Afficher les paroisses sans GPS** : marqueur spécial rouge clignotant → liste en panel droit
- **Dessin de zone** : tracer un polygone sur la carte pour sélectionner les paroisses dans cette zone et les exporter
- **Mode plein écran** identique à la vue publique

---

## 11. COMPOSANTS UI PARTAGÉS

### 11.1 Toast notifications

```
Types :
  Succès : fond #E8F5E9, bordure gauche #2E9744, texte #1B5E20
  Erreur : fond #FFEBEE, bordure gauche #C62828, texte #B71C1C
  Avertissement : fond #FFF8E1, bordure gauche #F9A825, texte #E65100
  Info : fond #E3F2FD, bordure gauche #1565C0, texte #0D47A1

Position : haut droite
Animation : slide-in depuis la droite, 300ms
Durée : 5 secondes (erreur : 8 secondes, manuelle)
Empilables : jusqu'à 3 simultanément
```

### 11.2 Modales de confirmation

Avant toute action destructive (suppression, désactivation) :

```
┌──────────────────────────────────────────────────┐
│  Confirmer la suppression                         │
│  ─────────────────────────────────────────────── │
│  Vous êtes sur le point de supprimer la paroisse  │
│  "Yaoundé-Centre".                               │
│                                                    │
│  Cette action est irréversible.                    │
│  Toutes les statistiques associées seront          │
│  également supprimées.                             │
│                                                    │
│  Tapez le nom de la paroisse pour confirmer :      │
│  [__________________________]                      │
│                                                    │
│  [Annuler]           [Supprimer définitivement]    │
└──────────────────────────────────────────────────┘
```

### 11.3 Skeleton loaders

- Tableau en chargement : lignes grises animées (shimmer)
- Card en chargement : bloc rectangulaire gris animé
- Graphique en chargement : placeholder gris de la même taille
- Carte en chargement : fond gris clair avec spinner vert centré

### 11.4 États vides (empty states)

Quand un tableau est vide (filtre trop restrictif ou données manquantes) :

```
[Icône pertinente — 64px, gris clair]
Aucune paroisse trouvée
Essayez de modifier vos filtres ou de créer une nouvelle paroisse.
[Réinitialiser les filtres]   [+ Créer une paroisse]
```

### 11.5 Barre de progression des imports

Pendant un import Excel :

```
Import en cours...
[████████████░░░░░░░░░] 65%
Traitement des lignes 652 / 1003 — Erreurs : 2
[Voir le rapport partiel]   [Annuler l'import]
```

---

## 12. FONCTIONNALITÉS AJOUTÉES

### 12.1 Mode maintenance (SUPER uniquement)

**Route :** `/admin/parametres/maintenance`

```
Mode maintenance
  Statut actuel : [DÉSACTIVÉ]

  [Activer le mode maintenance]

  En mode maintenance :
  → La partie publique affiche une page de maintenance
  → Les admins peuvent toujours se connecter
  → Un message personnalisable est affiché aux visiteurs

  Message de maintenance :
  [Textarea — ex: "La plateforme est en maintenance. Retour prévu le ..."]
```

### 12.2 Workflow de validation

Quand un admin non-SUPER soumet une modification :

1. La modification est enregistrée avec statut **"En attente"**
2. L'entité affiche visuellement le badge *"Modification en attente de validation"*
3. L'admin supérieur reçoit une notification
4. Il peut **valider** (la modification est appliquée) ou **rejeter** (avec commentaire)
5. L'auteur de la modification reçoit une notification du résultat

### 12.3 Vérification GPS automatique

À la saisie de coordonnées GPS dans un formulaire :
- Bounding box du Cameroun : lat ∈ [1.6, 13.1], lng ∈ [8.3, 16.2]
- Si hors de cette zone : `⚠ Ces coordonnées semblent être hors du Cameroun`
- Si la valeur ressemble à DMS (degrés minutes secondes) : proposer la conversion automatique

### 12.4 Export PDF officiel

Chaque fiche de paroisse / œuvre / rapport peut être exporté en PDF :
- Format A4 portrait
- En-tête officielle EEC (logo + titre + date de génération)
- Pied de page : numéro de page + mention *"Document confidentiel — EEC Cameroun"*
- Contenu structuré (pas de mise en page artistique)

### 12.5 Historique des modifications par entité

Sur chaque fiche de paroisse / œuvre / ouvrier, un onglet **"Historique"** :

```
Historique des modifications
──────────────────────────────────────────────────────────────
25 mai 2026 14:32 — Jean-Marie EKANGA (Super Admin)
  Modifié : nombre de communiants (ancien: 320, nouveau: 324)

20 mai 2026 09:15 — Paul ATEBA (Admin District MIFI)
  Modifié : coordonnées GPS (ancien: N/A, nouveau: 3.8480°N, 11.5021°E)
  Statut : Validé par Jean-Marie EKANGA le 21 mai 2026

14 mai 2026 16:00 — Marie-Claire BIYA (Admin Paroisse)
  Ajouté : 3 photos
```

### 12.6 Score de complétude par paroisse

Indicateur visuel sur chaque ligne du tableau des paroisses :

```
Complétude : [████████░░] 80%
  ✅ Coordonnées GPS
  ✅ Statistiques 2025
  ✅ Ouvriers renseignés (2)
  ❌ Photos (0/1 minimum)
  ✅ District et Région
```

Cet indicateur aide les admins à identifier les paroisses incomplètes.

### 12.7 Chatbot IA (Phase 2 — post-déploiement)

L'ancienne version avait un chatbot Ollama + LangChain + FAISS. Cette fonctionnalité sera intégrée dans une phase 2 :
- Questions en français sur les données de la plateforme
- *"Combien de paroisses dans la région Bamiléké ?"*
- *"Liste les ouvriers actifs du district MIFI"*
- Pas dans le scope actuel — à planifier après le déploiement initial.

---

## 13. ARCHITECTURE DES ROUTES NEXT.JS

```
/                              → Page publique + Carte (EECApp.tsx)
/paroisses/{id}                → Fiche détail publique (Page 3)
/admin/login                   → Page connexion (Page 4)
/admin/reset-password          → Réinitialisation mot de passe

/admin/dashboard               → Tableau de bord (adapté selon rôle)
/admin/carte                   → Carte interactive admin

/admin/paroisses               → Liste des paroisses
/admin/paroisses/creer         → Formulaire création
/admin/paroisses/{id}          → Fiche détail admin
/admin/paroisses/{id}/modifier → Formulaire modification

/admin/oeuvres                 → Liste des œuvres
/admin/oeuvres/creer           → Formulaire création
/admin/oeuvres/{id}            → Fiche détail admin
/admin/oeuvres/{id}/modifier   → Formulaire modification

/admin/ouvriers                → Liste des ouvriers
/admin/ouvriers/creer          → Formulaire création
/admin/ouvriers/{id}           → Fiche détail admin
/admin/ouvriers/{id}/modifier  → Formulaire modification

/admin/regions                 → Liste et gestion des régions
/admin/districts               → Liste et gestion des districts

/admin/statistiques            → Vue globale statistiques
/admin/statistiques/saisir/{paroisse_id} → Formulaire saisie
/admin/statistiques/validation → Validation des statistiques soumises

/admin/import-export           → Centre d'import/export

/admin/comptes                 → Gestion des comptes
/admin/comptes/creer           → Formulaire création compte
/admin/comptes/{id}            → Vue détail compte

/admin/journal                 → Journal d'activité

/admin/parametres              → Paramètres personnels
/admin/parametres/maintenance  → Mode maintenance (SUPER)
/admin/notifications           → Toutes les notifications
```

### Middleware de protection

Toutes les routes `/admin/*` (sauf `/admin/login` et `/admin/reset-password`) sont protégées par un middleware Next.js qui :
1. Vérifie la présence d'une session valide (cookie HttpOnly)
2. Vérifie que le rôle de l'utilisateur a accès à la route demandée
3. Redirige vers `/admin/login` sinon

---

## 14. CHECKLIST D'IMPLÉMENTATION

### Phase A — Authentification et navigation (à faire en premier)

- [ ] Page de connexion `/admin/login` (statique, puis connectée au backend)
- [ ] Middleware Next.js de protection des routes
- [ ] Layout admin partagé (sidebar + en-tête + zone principale)
- [ ] Sidebar responsive avec menu selon le rôle
- [ ] Page paramètres : changement de mot de passe
- [ ] Page paramètres : activation 2FA

### Phase B — Pages principales (SUPER)

- [ ] Tableau de bord — widgets statistiques
- [ ] Tableau de bord — graphiques (Recharts)
- [ ] Tableau de bord — activité récente
- [ ] Liste des paroisses + filtres + pagination
- [ ] Formulaire création/modification paroisse (6 onglets)
- [ ] Liste des ouvriers + formulaire
- [ ] Liste des œuvres + formulaire
- [ ] Gestion des comptes + formulaire de création

### Phase C — Statistiques et import/export

- [ ] Vue statistiques globales (tableau + graphiques)
- [ ] Formulaire de saisie des statistiques
- [ ] Workflow de validation des statistiques
- [ ] Centre d'import (upload + prévisualisation + rapport)
- [ ] Export Excel / CSV / PDF

### Phase D — Vues des autres rôles

- [ ] Adaptation du dashboard pour REGION (filtres automatiques)
- [ ] Adaptation du dashboard pour DISTRICT
- [ ] Adaptation du dashboard pour PAROISSE
- [ ] Gestion des permissions granulaires

### Phase E — Pages publiques

- [ ] Fiche détail publique d'une paroisse (Page 3)
- [ ] Galerie photos avec lightbox
- [ ] Export PDF de la fiche

### Phase F — Fonctionnalités avancées

- [ ] Journal d'activité
- [ ] Historique des modifications par entité
- [ ] Score de complétude par paroisse
- [ ] Workflow de validation (modifications proposées par niveaux inférieurs)
- [ ] Centre de notifications
- [ ] Mode maintenance

---

*Document confidentiel — Projet EEC Géolocalisation — Propriété exclusive de l'Église Évangélique du Cameroun*  
*Version 1.0 — 25 mai 2026*
