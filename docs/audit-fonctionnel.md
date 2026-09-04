# Audit fonctionnel — GEOEEC

> Plateforme de géolocalisation de l'Église Évangélique du Cameroun (EEC).
> Frontend **Next.js 15 (App Router)** · Backend **GeoDjango + Django REST Framework + PostGIS**.
>
> Document généré le **31 août 2026** par lecture du code (branche `igor-develop`).

---

## Sommaire

1. [Architecture générale](#1-architecture-générale)
2. [Pages et routes du frontend](#2-pages-et-routes-du-frontend)
3. [Endpoints API du backend](#3-endpoints-api-du-backend)
4. [Modèle de données](#4-modèle-de-données)
5. [Matrice des rôles](#5-matrice-des-rôles)
6. [Système RBAC — analyse détaillée](#6-système-rbac--analyse-détaillée)
7. [Parcours utilisateurs pas à pas](#7-parcours-utilisateurs-pas-à-pas)
8. [Messages d'erreur, validations et cas limites](#8-messages-derreur-validations-et-cas-limites)
9. [Glossaire métier et technique](#9-glossaire-métier-et-technique)

---

## 1. Architecture générale

| Élément | Valeur |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Leaflet + MapLibre — [frontend/src/app/](../frontend/src/app/) |
| Backend | Django + GeoDjango + DRF — [backend/](../backend/) |
| Base | PostgreSQL / PostGIS, géométries en **EPSG:4326 (WGS84)** |
| Authentification | **Session Django** (cookie + CSRF), pas de JWT — `SessionAuthentication` |
| Pagination | `StandardPagination` : 50/page par défaut, `?page_size=` jusqu'à **3000** — [eec_core/pagination.py](../backend/eec_core/pagination.py) |
| Proxy | Next.js réécrit `/api/*` vers le backend Django (`BACKEND_INTERNAL_URL`) — [next.config.ts](../frontend/next.config.ts) |
| Doc OpenAPI | `drf-spectacular` : `/api/schema/`, `/api/schema/swagger/`, `/api/schema/redoc/` |
| Rate limiting | login 5/min · register 30/h · password_reset 5/h · export 20/min |

### Apps Django

| App | Rôle |
|---|---|
| `apps.geo` | Régions synodales, districts, paroisses, zones d'influence, itinéraires, historique GPS |
| `apps.oeuvres` | Types d'œuvres et œuvres (écoles, hôpitaux, terrains…) |
| `apps.ouvriers` | Grades et ouvriers (pasteurs, évangélistes…) |
| `apps.accounts` | Utilisateur custom (rôles/scope), statistiques annuelles, auth, dashboards |
| `apps.audit` | Journal d'activité (`LogActivite`) |
| `apps.news` | Actualités + images |
| `apps.visitors` | Profils visiteurs, favoris, historique, itinéraires personnels, analytics |
| `apps.exports` | Exports Excel/PDF, modèles de fichiers, imports Excel |

---

## 2. Pages et routes du frontend

Les segments entre parenthèses (`(general)`, `(auth)`) sont des **groupes de routes** Next.js : ils n'apparaissent pas dans l'URL.

### 2.1 Espace public

| URL | Fichier | Rôle |
|---|---|---|
| `/` | [page.tsx](../frontend/src/app/page.tsx) → `LandingPage` | Page d'accueil vitrine : hero, chiffres, carte d'aperçu, œuvres, actualités, versets, CTA |
| `/carte` | [carte/page.tsx](../frontend/src/app/carte/page.tsx) | **Carte interactive publique**. Vérifie la session : un `VISITEUR` connecté passe en mode `visitor` (favoris, historique, itinéraires débloqués) ; tout autre rôle reste en mode `public` anonyme |

### 2.2 Authentification

| URL | Fichier | Rôle |
|---|---|---|
| `/login` | [(auth)/login/page.tsx](../frontend/src/app/(auth)/login/page.tsx) | Connexion (username **ou** email). Appelle le backend en direct pour contourner le proxy Turbopack |
| `/register` | [(auth)/register/page.tsx](../frontend/src/app/(auth)/register/page.tsx) | Inscription visiteur authentifié |
| `/auth/mot-de-passe-oublie` | [auth/mot-de-passe-oublie/page.tsx](../frontend/src/app/auth/mot-de-passe-oublie/page.tsx) | Demande de réinitialisation par e-mail |
| `/auth/reset-password/[uid]/[token]` | [auth/reset-password/[uid]/[token]/page.tsx](../frontend/src/app/auth/reset-password/%5Buid%5D/%5Btoken%5D/page.tsx) | Confirmation de réinitialisation via lien signé |

### 2.3 Espace administrateur — tronc commun

Tout `/admin/**` est protégé par `AdminGuard` ([admin/layout.tsx](../frontend/src/app/admin/layout.tsx)) : seuls `SUPER`, `REGION`, `DISTRICT`, `PAROISSE` entrent. Chaque sous-espace ajoute un `RoleGuard` qui n'autorise **qu'un seul rôle**.

| URL | Fichier | Rôle |
|---|---|---|
| `/admin/changer-mot-de-passe` | [admin/changer-mot-de-passe/page.tsx](../frontend/src/app/admin/changer-mot-de-passe/page.tsx) | Changement forcé du mot de passe à la première connexion (`force_password_change`) |

### 2.4 Administrateur Général (`SUPER`) — « Bureau National »

Groupe `(general)` · guard `allow={['SUPER']}` · sidebar [Sidebar.tsx](../frontend/src/components/admin/Sidebar.tsx).

| URL | Fichier | Rôle |
|---|---|---|
| `/admin` | `(general)/page.tsx` | Redirection → `/admin/dashboard` |
| `/admin/dashboard` | [(general)/dashboard/page.tsx](../frontend/src/app/admin/(general)/dashboard/page.tsx) | Tableau de bord national : compteurs, fidèles par année, top régions, œuvres par type, activité récente |
| `/admin/map` | [(general)/map/page.tsx](../frontend/src/app/admin/(general)/map/page.tsx) | Carte interactive personnelle de l'admin (favoris/historique/itinéraires persistés sur son compte) |
| `/admin/paroisses` | [(general)/paroisses/page.tsx](../frontend/src/app/admin/(general)/paroisses/page.tsx) | CRUD paroisses (la plus grosse page, ~1330 lignes) : filtres région/district/catégorie/GPS, création, édition, suppression |
| `/admin/oeuvres` | [(general)/oeuvres/page.tsx](../frontend/src/app/admin/(general)/oeuvres/page.tsx) | CRUD œuvres |
| `/admin/ouvriers` | [(general)/ouvriers/page.tsx](../frontend/src/app/admin/(general)/ouvriers/page.tsx) | CRUD ouvriers, code couleur par niveau de grade |
| `/admin/regions` | [(general)/regions/page.tsx](../frontend/src/app/admin/(general)/regions/page.tsx) | Consultation des régions synodales (lecture seule côté API) |
| `/admin/districts` | [(general)/districts/page.tsx](../frontend/src/app/admin/(general)/districts/page.tsx) | Consultation des districts (lecture seule côté API) |
| `/admin/stats` | [(general)/stats/page.tsx](../frontend/src/app/admin/(general)/stats/page.tsx) | Statistiques 2 onglets : globales / visiteurs |
| `/admin/io` | [(general)/io/page.tsx](../frontend/src/app/admin/(general)/io/page.tsx) | Import / Export Excel (paroisses, œuvres, ouvriers, statistiques) + téléchargement des modèles |
| `/admin/actualites` | [(general)/actualites/page.tsx](../frontend/src/app/admin/(general)/actualites/page.tsx) | CRUD actualités + upload d'images (réservé `SUPER`) |
| `/admin/comptes` | [(general)/comptes/page.tsx](../frontend/src/app/admin/(general)/comptes/page.tsx) | Gestion des comptes admin : création, activation/désactivation, réinitialisation de mot de passe |
| `/admin/journal` | [(general)/journal/page.tsx](../frontend/src/app/admin/(general)/journal/page.tsx) | Journal d'activité filtrable (action, type d'objet, utilisateur, dates) |
| `/admin/parametres` | [(general)/parametres/page.tsx](../frontend/src/app/admin/(general)/parametres/page.tsx) | Profil, avatar, thème clair/sombre, mot de passe |

### 2.5 Administrateur Régional (`REGION`) — « Bureau Régional »

Guard `allow={['REGION']}` · sidebar [SidebarRegional.tsx](../frontend/src/components/admin/SidebarRegional.tsx) + `ScopeBar`.

| URL | Rôle | Implémentation |
|---|---|---|
| `/admin/regional` | Redirection → `/admin/regional/dashboard` | — |
| `/admin/regional/dashboard` | Tableau de bord de la région | page propre |
| `/admin/regional/map` | Carte régionale personnelle | page propre |
| `/admin/regional/districts` | Districts de la région | page propre |
| `/admin/regional/paroisses` | Paroisses de la région | ré-export de `(general)/paroisses` |
| `/admin/regional/oeuvres` | Œuvres de la région | ré-export |
| `/admin/regional/ouvriers` | Ouvriers de la région | ré-export |
| `/admin/regional/stats` | Statistiques régionales | ré-export |
| `/admin/regional/io` | Import / Export scopé région | ré-export |
| `/admin/regional/comptes` | Comptes district + paroisse de la région | ré-export |
| `/admin/regional/journal` | Journal scopé région | ré-export |
| `/admin/regional/parametres` | Paramètres du compte | ré-export |

> Les pages ré-exportées sont **les mêmes composants** que ceux du `SUPER` — le périmètre visible est restreint **côté backend** par les fonctions `filter_*_by_scope`, pas par le frontend.

### 2.6 Administrateur District (`DISTRICT`) — « Bureau de District »

Guard `allow={['DISTRICT']}` · sidebar [SidebarDistrict.tsx](../frontend/src/components/admin/SidebarDistrict.tsx) + `ScopeBarDistrict`.

| URL | Rôle | Implémentation |
|---|---|---|
| `/admin/district` | Redirection → `/admin/district/dashboard` | — |
| `/admin/district/dashboard` | Tableau de bord du district | page propre |
| `/admin/district/map` | Carte de la zone (favoris/historique personnels) | page propre |
| `/admin/district/paroisses` · `/oeuvres` · `/ouvriers` | Données du district | ré-exports |
| `/admin/district/stats` · `/io` · `/comptes` · `/journal` · `/parametres` | Idem, scopés district | ré-exports |

### 2.7 Administrateur Paroissial (`PAROISSE`) — « Bureau de Paroisse »

Guard `allow={['PAROISSE']}` · sidebar [SidebarParoisse.tsx](../frontend/src/components/admin/SidebarParoisse.tsx) + `ScopeBarParoisse`. **Pas de carte, pas de comptes, pas de journal.**

| URL | Rôle | Implémentation |
|---|---|---|
| `/admin/paroisse` | Redirection → `/admin/paroisse/dashboard` | — |
| `/admin/paroisse/dashboard` | Tableau de bord de la paroisse | page propre |
| `/admin/paroisse/fiche` | Fiche descriptive de la paroisse (édition de ses propres données) | page propre |
| `/admin/paroisse/oeuvres` · `/ouvriers` · `/stats` · `/io` · `/parametres` | Données de la paroisse | ré-exports |

---

## 3. Endpoints API du backend

Base : `/api/`. Sauf mention contraire, la lecture est publique (`ReadPublicWriteAdmin`) et l'écriture réservée aux administrateurs dans leur périmètre.

Réponse paginée standard : `{ "count": n, "next": url|null, "previous": url|null, "results": [...] }`.

### 3.1 Géographie — `apps.geo`

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/geo/regions/` | Régions synodales **avec géométrie** (GeoJSON `FeatureCollection`, polygones simplifiés via `ST_Simplify`, non paginé, mis en cache) | — | `id, nom, code, geometrie, nb_districts, nb_paroisses` |
| `GET` | `/api/geo/regions/{id}/` | Détail d'une région | — | idem |
| `GET` | `/api/geo/regions/liste/` | Liste **sans géométrie** pour dropdowns et tableaux admin | — | `id, nom, code, nb_districts, nb_paroisses` |
| `GET` | `/api/geo/districts/` | Districts (**lecture seule stricte** : ni création, ni modification, ni suppression). Exclut les districts techniques « NON PRÉCISÉ » | `?region={id}` | `id, nom, region_id, region_nom, nb_paroisses, nb_fideles, nb_ouvriers` |
| `GET` | `/api/geo/districts/{id}/` | Détail d'un district | — | idem |
| `GET` | `/api/geo/paroisses/` | Liste des paroisses (annotée avec ouvriers + dernière statistique) | `?district=` `?region=` `?search=` `?avec_gps=1` `?sans_gps=1` `?categorie=` `?page_size=` | `id, nom, adresse, categorie, en_prospection, district_id/nom, region_id/nom, latitude, longitude, nombre_fideles, communiants, non_communiants, nb_ouvriers, cible_offrande, telephone, email, updated_at` |
| `GET` | `/api/geo/paroisses/{id}/` | Détail d'une paroisse | — | `ParoisseDetailSerializer` |
| `POST` | `/api/geo/paroisses/` | Créer une paroisse — **réservé `SUPER`** | `nom, adresse, categorie, en_prospection, district, latitude, longitude, nombre_fideles, telephone, email` | Paroisse créée |
| `PUT` / `PATCH` | `/api/geo/paroisses/{id}/` | Modifier (RBAC par périmètre) | idem | Paroisse modifiée |
| `DELETE` | `/api/geo/paroisses/{id}/` | Supprimer (RBAC par périmètre) | — | `204` |
| `GET` | `/api/geo/paroisses/sans-gps/` | Paroisses sans coordonnées — *authentifié* | — | Liste |
| `GET` | `/api/geo/paroisses/stats-completion/` | Score de complétude des données — *authentifié* | — | Compteurs de complétion |

### 3.2 Œuvres — `apps.oeuvres`

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/oeuvres/types/` | Types d'œuvre (lecture seule, public) | — | `id, nom, icone, couleur, nb_oeuvres` |
| `GET` | `/api/oeuvres/oeuvres/` | Liste des œuvres | `?type=` `?region=` `?district=` `?paroisse=` `?search=` `?avec_gps=1` `?sans_gps=1` `?active=` | `id, nom, adresse, description, type_oeuvre_*, paroisse_*, district_*, region_*, rattachement, est_active, capacite, nb_personnels, en_prospection, annee_creation, telephone, email, latitude, longitude, created_at, updated_at` |
| `GET` | `/api/oeuvres/oeuvres/{id}/` | Détail | — | idem |
| `POST` | `/api/oeuvres/oeuvres/` | Créer une œuvre | `nom, type_oeuvre, paroisse|district|region, adresse, description, est_active, capacite, nb_personnels, en_prospection, annee_creation, telephone, email, latitude, longitude` | Œuvre créée |
| `PUT` / `PATCH` | `/api/oeuvres/oeuvres/{id}/` | Modifier | idem | Œuvre modifiée |
| `DELETE` | `/api/oeuvres/oeuvres/{id}/` | Supprimer | — | `204` |
| `GET` | `/api/oeuvres/oeuvres/sans-gps/` | Œuvres sans GPS — *authentifié* | — | Liste |
| `GET` | `/api/oeuvres/oeuvres/stats-completion/` | Taux de complétion GPS — *authentifié* | — | Compteurs |

### 3.3 Ouvriers — `apps.ouvriers`

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/ouvriers/grades/` | Grades ecclésiastiques (lecture seule, public) | — | `id, nom, abreviation, niveau, nb_ouvriers` |
| `GET` | `/api/ouvriers/ouvriers/` | Liste des ouvriers | `?grade=` `?paroisse=` `?district=` `?region=` `?statut=` `?sexe=` `?search=` | `id, nom, prenom, sexe, statut, grade_*, paroisse_*, district_*, region_*, telephone, created_at, updated_at` |
| `GET` | `/api/ouvriers/ouvriers/{id}/` | Détail | — | idem |
| `POST` | `/api/ouvriers/ouvriers/` | Créer. Le sérialiseur varie selon le rôle : `SUPER` peut saisir tous les champs (dont `email`, `date_naissance`, `date_ordination`) ; un admin de rang inférieur est limité à l'**affectation** (`paroisse, statut, telephone`) | `nom, prenom, sexe, statut, grade, paroisse, telephone` (+ champs SUPER) | Ouvrier créé |
| `PUT` / `PATCH` | `/api/ouvriers/ouvriers/{id}/` | Modifier | idem | Ouvrier modifié |
| `DELETE` | `/api/ouvriers/ouvriers/{id}/` | Supprimer | — | `204` |
| `GET` | `/api/ouvriers/ouvriers/stats/` | Répartition par grade et statut — *authentifié* | — | Agrégats |

### 3.4 Statistiques annuelles — `apps.accounts`

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/statistiques/` | Statistiques annuelles par paroisse | `?paroisse=` `?district=` `?region=` `?annee=` `?non_validee=1` | `id, annee, paroisse, paroisse_nom, district_nom, region_nom, communiants, non_communiants, total_fideles, total_declare, baptemes, confirmations, mariages, deces, offrandes, dimes, validee` |
| `GET` | `/api/statistiques/{id}/` | Détail | — | idem |
| `POST` | `/api/statistiques/` | Créer une déclaration. Resynchronise `Paroisse.nombre_fideles` | mêmes champs | Statistique créée |
| `PUT` / `PATCH` | `/api/statistiques/{id}/` | Modifier | idem | Statistique modifiée |
| `DELETE` | `/api/statistiques/{id}/` | Supprimer | — | `204` |
| `POST` | `/api/statistiques/{id}/valider/` | Valider une déclaration (`validee = true`) — *authentifié* | — | Statistique validée |
| `GET` | `/api/statistiques/totaux/` | Totaux agrégés | `?annee=` `?region=` | Totaux |
| `GET` | `/api/statistiques/par-annee/` | Totaux groupés par année — *authentifié* | — | Série annuelle |
| `GET` | `/api/statistiques/top-paroisses/` | N paroisses avec le plus de fidèles (scopé) | `?annee=` `?limit=` | Classement |
| `GET` | `/api/statistiques/performance-regions/` | Classement des régions par total de fidèles | `?annee=` | Classement |

### 3.5 Authentification et comptes — `/api/auth/`

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/auth/csrf/` | Token CSRF (public) | — | `{ csrfToken }` |
| `POST` | `/api/auth/login/` | Connexion — **5/min** | `{ username\|email, password }` | Utilisateur + session |
| `POST` | `/api/auth/logout/` | Déconnexion | — | `204` |
| `GET` | `/api/auth/me/` | Utilisateur courant + son périmètre | — | `UserSerializer` complet |
| `PATCH` | `/api/auth/me/` | **Ne modifie que le thème** — nom, rôle et périmètre ne sont jamais modifiables par l'intéressé | `{ theme }` | Utilisateur |
| `POST` | `/api/auth/me/avatar/` | Upload de photo de profil — `multipart/form-data`, champ `file`. Validation Pillow, redimensionnement max 512×512 | Fichier image | `{ avatar_url }` |
| `DELETE` | `/api/auth/me/avatar/` | Supprimer la photo de profil | — | `204` |
| `POST` | `/api/auth/change-password/` | Changer son mot de passe | `{ old_password, new_password, confirm_password }` | Confirmation |
| `POST` | `/api/auth/password-reset/` | Réinitialisation — **5/h**. Un **nouveau mot de passe est généré et envoyé par e-mail** (pas de lien) ; `force_password_change=True` | `{ email }` | Confirmation neutre |
| `POST` | `/api/auth/password-reset/confirm/` | Confirmation par token signé | `{ uid, token, new_password, confirm_password }` | Confirmation |
| `GET` | `/api/auth/dashboard-stats/` | Données agrégées du tableau de bord — *admin* | `?annee=` | `nb_paroisses, nb_paroisses_sans_gps, nb_oeuvres, nb_ouvriers, nb_regions, nb_districts, total_communiants, total_non_communiants, total_fideles, annee, annees_disponibles, scope, role, validations_attente, fideles_par_annee, top_regions, oeuvres_par_type, top_paroisses_fideles, oeuvres_par_region, categories_par_region, activite_recente` |
| `GET` | `/api/auth/users/` | Comptes gérables — *admin*. `SUPER` → tous · `REGION` → ses admins district/paroisse · `DISTRICT` → ses admins paroisse | — | Liste `UserSerializer` |
| `GET` | `/api/auth/users/summary/` | **Compteurs seuls** (jamais les comptes) pour situer l'admin dans la chaîne de rattachement — *admin* | — | Compteurs par rôle |
| `POST` | `/api/auth/users/create/` | Créer un compte admin (mot de passe généré et envoyé par e-mail) — *admin* | `username, email, first_name, last_name, telephone, role, region, district, paroisse, permissions_custom` | Compte créé |
| `GET` `PATCH` `DELETE` | `/api/auth/users/{pk}/` | Consulter / modifier / supprimer un compte — *admin* | Champs `UserSerializer` | Compte |
| `POST` | `/api/auth/users/{pk}/toggle-active/` | Activer / désactiver un compte — *admin* | — | `{ is_active }` |
| `POST` | `/api/auth/users/{pk}/reset-password/` | Réinitialiser le mot de passe d'un compte géré — *admin* | — | Confirmation |

### 3.6 Statistiques de plateforme — `/api/stats/`

| Méthode | URL | Description | Sortie |
|---|---|---|---|
| `GET` | `/api/stats/globales/` | Onglet 1 : chiffres réels, scopés au périmètre de l'admin | `scope, role, nb_regions, nb_districts, nb_paroisses, nb_oeuvres, nb_ouvriers, nb_admins, paroisses_par_region, paroisses_par_district` |
| `GET` | `/api/stats/visiteurs/` | Onglet 2 : comportement **réel** des visiteurs (aucune donnée simulée), agrégé depuis `ConsultationCarte`, `ParoisseVue`, `FavoriCarte`, `ItinerairePersonnel`, `RechercheHistorique`, `LogActivite`, `User.last_login` | `scope, role, top_regions, top_districts, top_paroisses, top_oeuvres, top_favoris, top_itineraires, connexions_total, recherches_total, visiteurs_actifs_jour, visiteurs_quotidiens, visiteurs_mensuels` |

### 3.7 Espace visiteur authentifié — `/api/visitor/`

Toutes ces routes exigent un compte authentifié (`IsAuthentifiedUser`), sauf l'inscription.

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `POST` | `/api/visitor/register/` | Inscription visiteur (public, **30/h**). Crée `User(role=VISITEUR)` + `ProfilVisiteur`, connecte immédiatement, envoie un e-mail de bienvenue | `{ first_name, last_name, email, password }` | Utilisateur + session |
| `GET` | `/api/visitor/me/` | Profil complet du visiteur | — | Profil |
| `PATCH` | `/api/visitor/me/` | Modifier langue, paroisse affiliée, région préférée, notifications, prénom/nom | Champs du profil | Profil |
| `GET` | `/api/visitor/history/` | 50 dernières recherches | — | Liste |
| `DELETE` | `/api/visitor/history/clear/` | Effacer tout l'historique de recherche | — | `204` |
| `POST` | `/api/visitor/paroisses/{pk}/vue/` | Journaliser l'ouverture d'une popup paroisse | — | Confirmation |
| `GET` | `/api/visitor/paroisses/recentes/` | 20 dernières paroisses distinctes consultées | — | Liste |
| `GET` | `/api/visitor/paroisses/plus-proche/` | Paroisse EEC la plus proche d'une position — calcul spatial exact PostGIS `Distance()` | `?lat=` `?lng=` (requis) | Paroisse + `distance_km` |
| `GET` | `/api/visitor/favoris/` | Paroisses enregistrées | — | Liste |
| `POST` | `/api/visitor/favoris/` | Ajouter une paroisse aux favoris | `{ paroisse, note_personnelle }` | Favori créé |
| `DELETE` | `/api/visitor/favoris/{pk}/` | Retirer des favoris | — | `204` |
| `GET` | `/api/visitor/itineraires/` | 20 derniers itinéraires calculés | — | Liste |
| `POST` | `/api/visitor/itineraires/calculer/` | Distance **à vol d'oiseau** (Haversine) + durée estimée (60 km/h). Enregistré dans l'historique | `{ arrivee_paroisse_id, depart_paroisse_id?, depart_lat?, depart_lng? }` | `distance_km, duree_minutes` |
| `POST` | `/api/visitor/itineraires/route/` | **Itinéraire routier réel** via Valhalla sur le réseau OpenStreetMap. Renvoie aussi les `alternatives` (distance/durée des deux autres modes) pour l'affichage côte à côte | `{ start_lat, start_lng, end_lat, end_lng, mode: "auto"\|"bicycle"\|"pedestrian" }` | `{ mode, distance_km, duration_min, geometry: [[lat,lng]…], steps: [...], alternatives }` |
| `GET` | `/api/visitor/favoris-carte/` | Favoris carte génériques (paroisse **ou** œuvre) | — | Liste |
| `POST` | `/api/visitor/favoris-carte/` | Ajouter un favori carte | `{ type_entite, entite_id }` | Favori créé |
| `DELETE` | `/api/visitor/favoris-carte/{type_entite}/{entite_id}/` | Retirer un favori carte | — | `204` |
| `GET` | `/api/visitor/consultations/` | 40 dernières entités distinctes consultées | — | Liste |
| `POST` | `/api/visitor/consultations/` | Journaliser une consultation carte | `{ type_entite, entite_id }` | Confirmation |
| `DELETE` | `/api/visitor/consultations/clear/` | Effacer tout l'historique de consultation | — | `204` |

> Ces endpoints servent aussi les **cartes admin** (`/admin/map`, `/admin/regional/map`, `/admin/district/map`) : chaque administrateur y a ses propres favoris et son propre historique persistés.

### 3.8 Analytics — `/api/analytics/` (`CanSeeAnalytics` : `SUPER` + `REGION`)

| Méthode | URL | Description | Query params |
|---|---|---|---|
| `GET` | `/api/analytics/paroisses/top/` | Paroisses les plus consultées (`ParoisseVue`). `REGION` ne voit que sa région | `?region=` `?limit=10` `?periode=30` |
| `GET` | `/api/analytics/visiteurs/stats/` | Statistiques globales sur les visiteurs authentifiés | — |
| `GET` | `/api/analytics/activite/courbe/` | Courbe journalière : consultations, recherches, itinéraires | `?jours=30` |
| `GET` | `/api/analytics/itineraires/stats/` | Statistiques des itinéraires calculés | — |
| `GET` | `/api/analytics/recherches/tendances/` | Requêtes les plus fréquentes et filtres les plus utilisés | `?periode=30` |

### 3.9 Journal d'activité — `/api/audit/`

| Méthode | URL | Description | Query params |
|---|---|---|---|
| `GET` | `/api/audit/journal/` | Journal paginé — *admin*, restreint au périmètre. Exclut les actions anonymes (`utilisateur = null`) | `?action=` `?type_objet=` `?utilisateur=` `?date_debut=YYYY-MM-DD` `?date_fin=YYYY-MM-DD` |
| `GET` | `/api/audit/journal/{id}/` | Détail d'un log | — |

Sortie : `utilisateur, utilisateur_nom, action, type_objet, objet_id, objet_nom, description, ip_address, created_at`.

### 3.10 Actualités — `/api/news/`

Lecture publique, **écriture réservée au `SUPER`** (`ReadPublicWriteSuperOnly`). Seul le `SUPER` voit les brouillons non publiés.

| Méthode | URL | Description | Entrée | Sortie |
|---|---|---|---|---|
| `GET` | `/api/news/` | Liste des actualités | — | `id, titre, contenu, est_publiee, auteur_nom, images[], created_at, updated_at` |
| `GET` | `/api/news/{id}/` | Détail | — | idem |
| `POST` | `/api/news/` | Créer | `{ titre, contenu, est_publiee }` | Actualité créée |
| `PUT` / `PATCH` | `/api/news/{id}/` | Modifier | idem | Actualité modifiée |
| `DELETE` | `/api/news/{id}/` | Supprimer (efface aussi les fichiers images) | — | `204` |
| `POST` | `/api/news/{id}/images/` | Ajouter une ou plusieurs images — champ multipart `images` répétable, redimensionné à 1600×1600 max | Fichiers | Images créées |
| `DELETE` | `/api/news/{id}/images/{image_id}/` | Supprimer une image | — | `204` |

### 3.11 Exports — `/api/exports/` (*admin*, throttle 20/min)

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/exports/paroisses/excel/` | Export Excel de la **liste actuellement affichée** (mêmes filtres que la liste : `region`, `district`, `search`, `categorie`, GPS) |
| `GET` | `/api/exports/oeuvres/excel/` | Export Excel des œuvres (mêmes filtres) |
| `GET` | `/api/exports/ouvriers/excel/` | Export Excel des ouvriers (`region`, `district`, `paroisse`, `grade`, `statut`, `sexe`, `search`) |
| `GET` | `/api/exports/statistiques/excel/` | Export Excel des statistiques — `?annee=2025` |
| `GET` | `/api/exports/statistiques/pdf/` | Export PDF des statistiques — `?annee=2025` |
| `GET` | `/api/exports/templates/paroisses/` | Modèle Excel vierge — paroisses |
| `GET` | `/api/exports/templates/oeuvres/` | Modèle Excel vierge — œuvres |
| `GET` | `/api/exports/templates/ouvriers/` | Modèle Excel vierge — ouvriers |

> Les exports neutralisent l'**injection de formule Excel** (OWASP) : toute valeur texte commençant par `=`, `+`, `-`, `@` est préfixée d'une apostrophe. Le périmètre administratif est appliqué à l'export comme à la liste.

### 3.12 Imports — `/api/imports/` (*admin*, `multipart/form-data`, champ `file`, `.xlsx`)

| Méthode | URL | Colonnes attendues (ligne 1 = en-tête ignorée) |
|---|---|---|
| `POST` | `/api/imports/paroisses/` | **A** Catégorie *(A++/A1/A2/B1/B2/C1/C2/C3/C4)* · **B** Région synodale *(obligatoire)* · **C** District · **D** Nom de la paroisse *(obligatoire)* · **E** Quartier/Adresse · **F** Communiants · **G** Non-communiants · **H** Nombre d'ouvriers *(informatif)* · **I** Longitude · **J** Latitude · **K** Altitude *(non stocké)* |
| `POST` | `/api/imports/oeuvres/` | **A** Nom *(obligatoire)* · **B** Type *(SCOLAIRE\|MEDICALE\|AGROPASTORALE\|UNIVERSITAIRE\|IMMEUBLE\|TERRAIN\|AUTRE)* · **C** Paroisse · **D** District · **E** Région · **F** Adresse · **G** Latitude · **H** Longitude · **I** Capacité |
| `POST` | `/api/imports/ouvriers/` | **A** Nom *(obligatoire)* · **B** Prénom *(obligatoire)* · **C** Sexe *(M/F)* · **D** Grade · **E** Paroisse *(obligatoire)* · **F** Statut · **G** Téléphone |

> L'import de paroisses crée/met à jour la `StatistiqueAnnuelle` de l'année courante à partir des colonnes F et G. Les coordonnées sont validées contre la **bounding box du Cameroun** avant d'être stockées.

### 3.13 Documentation et administration Django

| URL | Description |
|---|---|
| `/api/schema/` | Schéma OpenAPI brut |
| `/api/schema/swagger/` | Interface Swagger UI |
| `/api/schema/redoc/` | Interface ReDoc |
| `/django-admin/` | Administration Django native |
| `/media/**` | Fichiers média (avatars, images d'actualités) — servi par Django **en développement uniquement** |

---

## 4. Modèle de données

### 4.1 Hiérarchie territoriale

```
RegionSynodale (22)
   └── District (≈134-137)
          └── Paroisse (≈693)
                 ├── Ouvrier (n)
                 ├── Oeuvre (n)
                 ├── StatistiqueAnnuelle (1 par année)
                 └── ZoneInfluence (0..1)
```

### 4.2 `RegionSynodale` — [apps/geo/models.py](../backend/apps/geo/models.py)

Grande zone administrative de l'EEC.

| Champ | Type | Notes |
|---|---|---|
| `nom` | `CharField(100)` | **unique** |
| `code` | `CharField(10)` | unique, optionnel |
| `geometrie` | `MultiPolygonField(4326)` | Polygones de la région |
| `population_estimee` | `IntegerField` | optionnel |
| `date_creation` | `DateField` | optionnel |

*Tri par `nom`. Lecture seule via l'API.*

### 4.3 `District`

Subdivision d'une région synodale.

| Champ | Type | Notes |
|---|---|---|
| `nom` | `CharField(150)` | |
| `code` | `CharField(20)` | unique, optionnel |
| `region` | `FK → RegionSynodale` | `related_name="districts"` |
| `geometrie` | `MultiPolygonField(4326)` | |

*Tri par `region, nom`. **Non modifiable et non supprimable** via l'API — le nombre de districts est figé ; les districts techniques « NON PRÉCISÉ » sont exclus des listes et des compteurs.*

### 4.4 `Paroisse`

Lieu de culte géolocalisé — entité centrale de la plateforme.

| Champ | Type | Notes |
|---|---|---|
| `nom` | `CharField(200)` | |
| `code` | `CharField(20)` | unique, optionnel |
| `categorie` | `CharField(3)` | `A++, A1, A2, B1, B2, C1, C2, C3, C4` |
| `en_prospection` | `BooleanField` | défaut `False` |
| `district` | `FK → District` | `related_name="paroisses"` |
| `position` | `PointField(4326)` | Coordonnées GPS |
| `adresse` | `TextField` | |
| `telephone` | `CharField(30)` | |
| `email` | `EmailField` | |
| `annee_creation` | `IntegerField` | |
| `est_active` | `BooleanField` | défaut `True` |
| `nombre_fideles` | `IntegerField` | resynchronisé depuis `StatistiqueAnnuelle` |
| `cible_offrande` | `BigIntegerField` | |
| `created_at` / `updated_at` | `DateTimeField` | auto |

### 4.5 `ZoneInfluence`

Zone géographique couverte par une paroisse — relation **1-1**.

| Champ | Type |
|---|---|
| `paroisse` | `OneToOneField → Paroisse` |
| `geometrie` | `PolygonField(4326)` (obligatoire) |
| `rayon_km` | `FloatField` |
| `population_estimee` | `IntegerField` |
| `description` | `TextField` |

### 4.6 `Itineraire`

Chemin **pré-enregistré** entre deux paroisses (distinct des itinéraires calculés à la volée par les visiteurs).

| Champ | Type | Notes |
|---|---|---|
| `paroisse_depart` / `paroisse_arrivee` | `FK → Paroisse` | **`unique_together`** |
| `geometrie` | `LineStringField(4326)` | |
| `distance_km` | `FloatField` | |
| `duree_minutes` | `IntegerField` | |
| `type_transport` | `CharField` | `ROUTE, PISTE, FLUVIAL, MIXTE` |
| `difficulte` | `CharField` | `FACILE, MOYEN, DIFFICILE` |
| `description` | `TextField` | |

### 4.7 `HistoriquePosition`

Trace chaque déplacement de coordonnées GPS (relation générique par `type_objet` + `objet_id`).

| Champ | Type | Notes |
|---|---|---|
| `type_objet` | `CharField(20)` | `paroisse, ouvrier, oeuvre` |
| `objet_id` | `IntegerField` | |
| `ancienne_position` / `nouvelle_position` | `PointField(4326)` | |
| `raison_changement` | `TextField` | |
| `utilisateur` | `FK → User` | `SET_NULL` |
| `date_changement` | `DateTimeField` | auto, tri décroissant |

### 4.8 `TypeOeuvre` et `Oeuvre` — [apps/oeuvres/models.py](../backend/apps/oeuvres/models.py)

**`TypeOeuvre`** : `nom` (unique, parmi `SCOLAIRE, UNIVERSITAIRE, MEDICALE, AGROPASTORALE, IMMEUBLE, TERRAIN, AUTRE`), `icone`, `couleur` (défaut `#16A34A`).

**`Oeuvre`** — patrimoine et établissements de l'Église.

| Champ | Type | Notes |
|---|---|---|
| `nom` | `CharField(200)` | |
| `type_oeuvre` | `FK → TypeOeuvre` | |
| `paroisse` / `district` / `region` | `FK` (tous optionnels) | **Rattachement à niveau variable** : une œuvre peut dépendre directement d'une région, d'un district ou d'une paroisse |
| `position` | `PointField(4326)` | |
| `adresse`, `telephone`, `email`, `description` | | |
| `annee_creation` | `IntegerField` | |
| `capacite` | `IntegerField` | Élèves, lits… |
| `nb_personnels` | `IntegerField` | |
| `en_prospection` | `BooleanField` | |
| `est_active` | `BooleanField` | défaut `True` |
| `created_at` / `updated_at` | `DateTimeField` | auto |

### 4.9 `Grade` et `Ouvrier` — [apps/ouvriers/models.py](../backend/apps/ouvriers/models.py)

**`Grade`** : `nom` (unique), `niveau` (`IntegerField`, **ordre hiérarchique** — sert au code couleur du frontend), `abreviation`.

**`Ouvrier`** — personnel ecclésiastique.

| Champ | Type | Notes |
|---|---|---|
| `nom` / `prenom` | `CharField(100)` | |
| `sexe` | `CharField(1)` | `M` / `F`, défaut `M` |
| `grade` | `FK → Grade` | **`PROTECT`** — un grade utilisé ne peut être supprimé |
| `paroisse` | `FK → Paroisse` | `related_name="ouvriers"` |
| `telephone`, `email` | | |
| `date_naissance` | `DateField` | |
| `date_ordination` | `DateField` | entrée en service |
| `statut` | `CharField(10)` | `OCCUPE` / `INOCCUPE`, défaut `OCCUPE` |
| `created_at` / `updated_at` | `DateTimeField` | auto |

### 4.10 `User` (modèle custom) — [apps/accounts/models.py](../backend/apps/accounts/models.py)

Étend `AbstractUser`. **Le rôle + le rattachement définissent le périmètre de visibilité et d'écriture** appliqué par les fonctions `filter_*_by_scope`.

| Champ | Type | Notes |
|---|---|---|
| `role` | `CharField(10)` | `SUPER, REGION, DISTRICT, PAROISSE, VISITEUR` — défaut `PAROISSE` |
| `region` / `district` / `paroisse` | `FK` (`SET_NULL`) | Rattachement selon le rôle |
| `avatar` | `ImageField(avatars/)` | |
| `theme` | `CharField(10)` | `clair` / `sombre` |
| `permissions_custom` | `JSONField` | Permissions fines par compte |
| `telephone` | `CharField(20)` | |
| `force_password_change` | `BooleanField` | **défaut `True`** — force le passage par `/admin/changer-mot-de-passe` |

### 4.11 `StatistiqueAnnuelle`

Déclaration annuelle d'une paroisse — la seule entité soumise à un **circuit de validation**.

| Champ | Type | Notes |
|---|---|---|
| `paroisse` | `FK → Paroisse` (`CASCADE`) | |
| `annee` | `IntegerField` | **`unique_together (paroisse, annee)`** |
| `communiants` / `non_communiants` | `IntegerField` | défaut 0 — leur somme alimente `Paroisse.nombre_fideles` |
| `total_declare` | `IntegerField` | Total déclaré par la paroisse, comparable au calculé |
| `baptemes`, `confirmations`, `mariages`, `deces` | `IntegerField` | Actes de l'année |
| `offrandes`, `dimes` | `DecimalField(12,2)` | |
| `validee` | `BooleanField` | défaut `False` — passe à `True` via `POST /valider/` |

*Tri : année décroissante, puis paroisse.*

### 4.12 `LogActivite` — [apps/audit/models.py](../backend/apps/audit/models.py)

| Champ | Type | Notes |
|---|---|---|
| `utilisateur` | `FK → User` (`SET_NULL`) | |
| `action` | `CharField(10)` | `LOGIN, LOGOUT, CREATE, UPDATE, DELETE, IMPORT, EXPORT, VIEW` |
| `type_objet` | `CharField(20)` | `paroisse, district, region, oeuvre, ouvrier, user, statistique, import, systeme` |
| `objet_id` / `objet_nom` | | Référence lisible de la cible |
| `description` | `TextField` | |
| `ip_address` | `GenericIPAddressField` | |
| `created_at` | `DateTimeField` | auto, tri décroissant |

### 4.13 `News` et `NewsImage` — [apps/news/models.py](../backend/apps/news/models.py)

**`News`** : `titre` (200), `contenu`, `est_publiee` (défaut `False` → brouillon), `auteur` (`FK → User`), `created_at`/`updated_at`.
**`NewsImage`** : `image` (`news/`), `ordre` (`PositiveIntegerField`), rattachée à une actualité.

### 4.14 Entités visiteur — [apps/visitors/models.py](../backend/apps/visitors/models.py)

| Modèle | Champs clés | Rôle |
|---|---|---|
| `ProfilVisiteur` | `utilisateur` (1-1), `langue` (`fr`/`en`), `paroisse_affiliee`, `region_preferee`, `notifications_email` | Préférences du visiteur authentifié |
| `ParoisseVue` | `utilisateur`, `paroisse`, `vue_at` | Historique de consultation de paroisses (alimente les analytics « top paroisses ») |
| `RechercheHistorique` | `utilisateur`, `query` (300), `filtres` (`JSONField`), `resultats_count`, `created_at` | Historique de recherche + tendances |
| `ItinerairePersonnel` | `utilisateur`, `depart_paroisse` \| (`depart_lat`, `depart_lng`), `arrivee_paroisse`, `distance_km`, `duree_minutes`, `created_at` | Itinéraires calculés, départ possible depuis une position GPS libre |
| `ParoisseEnregistree` | `utilisateur`, `paroisse`, `note_personnelle` — **`unique_together`** | Favoris « paroisse » avec note |
| `FavoriCarte` | `utilisateur`, `type_entite` (`paroisse`/`oeuvre`), `entite_id` — **`unique_together`** | Favoris carte génériques |
| `ConsultationCarte` | `utilisateur`, `type_entite`, `entite_id`, `vue_at` | Historique carte générique |

---

## 5. Matrice des rôles

| Rôle | Espace frontend | Périmètre de données | Capacités notables |
|---|---|---|---|
| `SUPER` | `/admin/*` (Bureau National) | Tout le pays | **Seul à pouvoir créer une paroisse**, gérer les actualités, gérer tous les comptes, voir les analytics |
| `REGION` | `/admin/regional/*` | Sa région synodale | CRUD dans sa région, gestion des comptes district/paroisse, journal scopé, **accès analytics** |
| `DISTRICT` | `/admin/district/*` | Son district | CRUD dans son district, gestion des comptes paroisse, journal scopé |
| `PAROISSE` | `/admin/paroisse/*` | Sa seule paroisse | Fiche paroisse, œuvres, ouvriers (affectation uniquement), statistiques, import/export. **Ni carte, ni comptes, ni journal** |
| `VISITEUR` | `/carte` en mode `visitor` | Lecture publique | Favoris, historique, itinéraires personnels persistés |
| *(anonyme)* | `/`, `/carte` en mode `public` | Lecture publique | Consultation seule, aucune persistance |

### Règles d'intégrité structurantes

- **Régions et districts sont immuables via l'API** : lecture seule, jamais de création/modification/suppression.
- **Seul le `SUPER` crée une paroisse** ; les autres rôles ne peuvent que modifier celles de leur périmètre.
- Le périmètre est appliqué **côté backend** (`filter_paroisses_by_scope`, `filter_districts_by_scope`, `filter_oeuvres_by_scope`, `filter_ouvriers_by_scope`), y compris sur les exports — jamais uniquement dans l'interface.
- `Ouvrier.grade` est en `PROTECT` : un grade référencé ne peut pas être supprimé.
- `StatistiqueAnnuelle` est unique par couple (paroisse, année) et alimente `Paroisse.nombre_fideles`.
- Le journal d'activité exclut les actions sans compte authentifié.

---

## 6. Système RBAC — analyse détaillée

> Analyse du contrôle d'accès basé sur les rôles, backend **et** frontend.
> Sources : [apps/accounts/permissions.py](../backend/apps/accounts/permissions.py), [apps/accounts/models.py](../backend/apps/accounts/models.py), [apps/visitors/permissions.py](../backend/apps/visitors/permissions.py), les surcharges `create/update/destroy` de chaque ViewSet, et les gardes [AdminGuard.tsx](../frontend/src/components/admin/AdminGuard.tsx) / [RoleGuard.tsx](../frontend/src/components/admin/RoleGuard.tsx).

### 6.1 Principe général

Le RBAC repose sur **deux dimensions combinées**, portées par le même modèle `User` :

| Dimension | Champ | Rôle |
|---|---|---|
| **Le rôle** | `User.role` | *Quel type d'action* est permis (créer / modifier / supprimer / valider) |
| **Le périmètre** | `User.region` / `district` / `paroisse` | *Sur quelles lignes* cette action s'applique |

Ces deux dimensions sont vérifiées par **trois mécanismes distincts**, appliqués en cascade :

1. **Classes de permission DRF** (`permission_classes`) — filtre grossier : la requête entre ou non.
2. **Filtres de queryset** (`filter_*_by_scope`) — restreignent ce qui est *visible* en lecture.
3. **Surcharges `create` / `update` / `destroy` + helpers `_can_write_*`** — vérifient l'objet précis en écriture, et **restreignent la liste des champs modifiables** selon le rôle.

> Le frontend ne fait **jamais** autorité : `AdminGuard` et `RoleGuard` ne servent qu'à éviter d'afficher un espace inaccessible. Toute décision réelle est prise côté Django.

### 6.2 Les cinq rôles + l'anonyme

`User.ROLES` — [apps/accounts/models.py:6](../backend/apps/accounts/models.py#L6) :

| Rôle | Libellé | Rattachement obligatoire | `is_admin` | `get_scope_label()` |
|---|---|---|---|---|
| `SUPER` | Administrateur Général | aucun (national) | ✅ | `"National"` |
| `REGION` | Administrateur Régional | `region` | ✅ | `"Région <nom>"` |
| `DISTRICT` | Administrateur District | `district` | ✅ | `"District <nom>"` |
| `PAROISSE` | Administrateur Paroissial *(défaut)* | `paroisse` | ✅ | `"<nom paroisse>"` |
| `VISITEUR` | Visiteur Authentifié | aucun | ❌ | `"—"` |
| *(anonyme)* | — | — | ❌ | — |

La constante `ADMIN_ROLES = ("SUPER", "REGION", "DISTRICT", "PAROISSE")` exclut explicitement `VISITEUR` : **un visiteur authentifié n'est jamais un administrateur**, quel que soit le contexte.

#### Propriétés dérivées du modèle

| Propriété / méthode | Renvoie |
|---|---|
| `is_super_admin`, `is_region_admin`, `is_district_admin`, `is_paroisse_admin`, `is_visiteur` | Booléens de test de rôle |
| `is_admin` | `True` pour les 4 rôles administrateurs, `False` pour `VISITEUR` |
| `has_custom_perm(key)` | Lit `permissions_custom` (JSON) — permissions fines par compte |
| `get_scope_label()` | Libellé du périmètre affiché dans l'interface |

#### Classes de permission

| Classe | Autorise | Utilisée par |
|---|---|---|
| `IsAdminUser` | Les 4 rôles admin | Journal d'audit, gestion des comptes, dashboard, stats, exports, imports |
| `IsSuperAdmin` | `SUPER` | *(définie, non montée sur une route)* |
| `IsRegionOrAbove` | `SUPER`, `REGION` | *(définie, non montée sur une route)* |
| `IsDistrictOrAbove` | `SUPER`, `REGION`, `DISTRICT` | *(définie, non montée sur une route)* |
| `ReadPublicWriteAdmin` | Lecture : tout le monde · Écriture : les 4 rôles admin | Paroisses, œuvres, ouvriers, statistiques, districts |
| `ReadPublicWriteSuperOnly` | Lecture : tout le monde · Écriture : `SUPER` | Actualités |
| `IsAuthentifiedUser` | `VISITEUR` **+** les 4 rôles admin | Tout `/api/visitor/*` |
| `IsVisiteur` | `VISITEUR` seul | *(définie, non montée sur une route)* |
| `CanSeeAnalytics` | `SUPER`, `REGION` | Tout `/api/analytics/*` |
| `IsOwnerOrAdmin` | Propriétaire de l'objet, ou `SUPER` | *(définie, non montée sur une route)* |
| `permissions.AllowAny` | Tout le monde | Régions, types d'œuvre, grades, login, register, CSRF, reset |

### 6.3 Actions autorisées par rôle et par entité

Légende : ✅ autorisé · 🟡 autorisé sous condition · ❌ refusé (`403`).
Sauf mention contraire, toute action autorisée reste **bornée au périmètre** du compte.

#### `RegionSynodale` — `ReadOnlyModelViewSet`

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer / Modifier / Supprimer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Aucun rôle, pas même `SUPER`, ne peut écrire sur une région via l'API** — le ViewSet est en lecture seule et n'expose aucune route d'écriture. Seul le `/django-admin/` le permet.

#### `District` — `ReadOnlyModelViewSet`

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa région | 🟡 le sien | 🟡 celui de sa paroisse | ✅ tous | ✅ tous |
| Créer / Modifier / Supprimer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Même verrouillage que les régions : *« il est IMPOSSIBLE de modifier ou supprimer un district »*. Le scope de lecture n'est appliqué qu'aux comptes **authentifiés admin** — un anonyme ou un visiteur voit tous les districts.

#### `Paroisse` — le cas le plus contraint

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa région | 🟡 son district | 🟡 la sienne | ✅ tous | ✅ tous |
| **Créer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Modifier** | 🟡 champs étendus | ❌ **interdit** | 🟡 `nom`, `en_prospection` | 🟡 `nom`, `en_prospection` | ❌ | ❌ |
| **Supprimer** | 🟡 si aucun blocage | ❌ | ❌ | ❌ | ❌ | ❌ |

**Champs modifiables** — deux listes blanches strictes ; tout champ hors liste renvoie `400` avec la liste des champs autorisés :

| Rôle | Champs modifiables |
|---|---|
| `DISTRICT`, `PAROISSE` | `nom`, `en_prospection` |
| `SUPER` | les précédents **+** `categorie`, `latitude`, `longitude`, `adresse`, `telephone`, `email` |

**Verrouillés pour tous, y compris `SUPER`** : `district` et `region` (déplacer une paroisse romprait la hiérarchie sans trace) et les effectifs (`nombre_fideles`, qui ne se saisit que via les statistiques annuelles).

Deux règles complémentaires :
- `latitude` et `longitude` doivent être envoyées **ensemble** (`400` sinon) — une coordonnée isolée serait silencieusement ignorée par le sérialiseur.
- La suppression est bloquée en **`409 CONFLICT`** si la paroisse a encore des ouvriers ou des œuvres rattachés (`PROTECT`), avec le décompte exact à réaffecter. Les statistiques annuelles, elles, partent en `CASCADE` — la perte est journalisée avant suppression.

#### `Oeuvre` — périmètre à rattachement variable

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa région | 🟡 son district | 🟡 sa paroisse | ✅ tous | ✅ tous |
| **Créer** | ✅ partout, **y compris œuvre nationale** | 🟡 dans sa région | 🟡 dans son district | 🟡 sa paroisse | ❌ | ❌ |
| **Modifier** | 🟡 champs étendus | 🟡 `nom`, `telephone`, `adresse` | 🟡 idem | 🟡 idem | ❌ | ❌ |
| **Supprimer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

Une œuvre peut être rattachée à une **paroisse**, un **district**, une **région**, ou à **rien** (= œuvre *nationale*). Cela produit deux règles particulières :

- **Le scope de lecture remonte la chaîne** : un admin `REGION` voit les œuvres régionales de sa région **et** celles de ses districts **et** celles de ses paroisses (`Q(region_id=…) | Q(district__region_id=…) | Q(paroisse__district__region_id=…)`). Les œuvres nationales ne sont visibles en gestion que par le `SUPER`.
- **Validation du rattachement à la création**, *avant* l'écriture : un `DISTRICT` ne peut pas créer d'œuvre régionale ; un `PAROISSE` ne peut créer que dans sa paroisse ; créer une œuvre nationale est réservé au `SUPER`. Si un admin scopé ne fournit aucun rattachement, `perform_create` le rattache d'office à **son propre niveau**.

**Champs modifiables** :

| Rôle | Champs modifiables |
|---|---|
| `REGION`, `DISTRICT`, `PAROISSE` | `nom`, `telephone`, `adresse` |
| `SUPER` | les précédents **+** `type_oeuvre`, `latitude`, `longitude`, `email`, `description`, `capacite`, `nb_personnels`, `annee_creation`, `en_prospection`, `est_active` |

**Verrouillé pour tous, `SUPER` compris** : le rattachement (`paroisse` / `district` / `region`). Il ne décrit pas l'œuvre, il détermine qui a le droit de la voir — le modifier reviendrait à la faire changer de main sans trace. Une œuvre mal rattachée se corrige en la recréant.

#### `Ouvrier`

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa région | 🟡 son district | 🟡 sa paroisse | ✅ tous | ✅ tous |
| **Créer** | ✅ partout | 🟡 paroisse de sa région | 🟡 paroisse de son district | 🟡 sa paroisse *(forcée)* | ❌ | ❌ |
| **Modifier — identité + grade** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Modifier — affectation** | ✅ | 🟡 dans sa région | 🟡 dans son district | 🟡 sa paroisse | ❌ | ❌ |
| **Supprimer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

Le RBAC passe ici par le **choix du sérialiseur selon le rôle** :

| Rôle | Sérialiseur en modification | Champs accessibles |
|---|---|---|
| `SUPER` | `OuvrierSuperSerializer` | `nom`, `prenom`, `sexe`, `grade`, `paroisse`, `statut`, `telephone`, `email`, `date_naissance`, `date_ordination` |
| Autres | `OuvrierAffectationSerializer` | `paroisse`, `statut`, `telephone` **uniquement** |

*« L'identité d'un ouvrier reste inaltérable, seule son affectation peut changer »* — le `SUPER` fait exception parce que les données viennent d'imports Excel manuels où les fautes de saisie sont fréquentes.

La **réaffectation** est doublement contrôlée : `_can_write_ouvrier` vérifie que l'ouvrier *actuel* est dans la zone, puis un second contrôle vérifie que la paroisse *cible* y est aussi — sans quoi un admin pourrait exfiltrer un ouvrier hors de son périmètre.

#### `StatistiqueAnnuelle`

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa région | 🟡 son district | 🟡 sa paroisse | ✅ tous | ✅ tous |
| **Créer** | ✅ | ⚠️ non borné — voir §6.7 | ⚠️ non borné | 🟡 sa paroisse *(forcée)* | ❌ | ❌ |
| **Modifier** | ✅ | 🟡 sa région | 🟡 son district | 🟡 sa paroisse | ❌ | ❌ |
| **Valider** (`POST /valider/`) | ✅ | 🟡 sa région | 🟡 son district | ❌ *(voir §6.7)* | ❌ | ❌ |
| **Supprimer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

C'est la seule entité avec un **circuit de validation** : la paroisse déclare, le niveau supérieur valide (`validee = True`). Toute écriture resynchronise `Paroisse.nombre_fideles`.

#### `News` (actualités)

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter les publiées | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Consulter les brouillons** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer / Modifier / Supprimer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ajouter / supprimer des images | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

`ReadPublicWriteSuperOnly` : *« un admin régional/district/paroisse n'a pas vocation à publier au grand public »*. Le filtre sur `est_publiee` n'est levé que pour le `SUPER`.

#### `LogActivite` (journal d'audit)

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Consulter | ✅ tous | 🟡 sa zone | 🟡 sa zone | 🟡 le sien seul | ❌ | ❌ |
| Écrire | ❌ *(alimenté par le serveur)* | ❌ | ❌ | ❌ | ❌ | ❌ |

Le scope passe par `managed_user_ids(user)` : le compte lui-même **plus** ses sous-administrateurs directs (`REGION` → tous les comptes non-SUPER de sa région ; `DISTRICT` → les admins `PAROISSE` de son district ; `PAROISSE` → lui-même uniquement). Les actions sans compte authentifié (`utilisateur = null`) sont exclues de tout le journal.

#### `User` (gestion des comptes)

| Action | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR |
|---|:--:|:--:|:--:|:--:|:--:|
| Lister les comptes | ✅ tous | 🟡 sa région, hors `SUPER` | 🟡 admins `PAROISSE` de son district | ❌ | ❌ |
| Voir les compteurs (`/summary/`) | ✅ | 🟡 | 🟡 | ❌ | ❌ |
| **Créer** un compte | ✅ `REGION`, `DISTRICT`, `PAROISSE` | 🟡 `DISTRICT` seulement | 🟡 `PAROISSE` seulement | ❌ | ❌ |
| Modifier (`PATCH`) | 🟡 champs de profil | 🟡 sa région | 🟡 son district | ❌ | ❌ |
| Activer / désactiver | ✅ sauf soi-même | 🟡 sa région | 🟡 son district | ❌ | ❌ |
| Réinitialiser un mot de passe | ✅ | 🟡 sa région | 🟡 son district | ❌ | ❌ |
| **Supprimer** | 🟡 sauf un `SUPER` et sauf soi-même | ❌ | ❌ | ❌ | ❌ |

`can_manage_accounts(user)` → `role in ("SUPER", "REGION", "DISTRICT")`. **Un admin `PAROISSE` ne gère aucun compte.**

Deux protections contre l'escalade de privilèges :

- **`UserSerializer.read_only_fields`** rend `role`, `region`, `district`, `paroisse`, `permissions_custom`, `is_active` et `username` **non modifiables par `PATCH`**. Un changement de rôle ou de périmètre doit repasser par `UserCreateSerializer` et sa logique stricte — *« pas par un simple PATCH de profil, sous peine d'escalade de privilèges »*.
- **`PATCH /api/auth/me/`** ne laisse modifier **que le thème** : nom, rôle et périmètre ne sont jamais modifiables par l'intéressé lui-même.

#### Espace visiteur — `/api/visitor/*`

| Action | SUPER / REGION / DISTRICT / PAROISSE | VISITEUR | Anonyme |
|---|:--:|:--:|:--:|
| Favoris, historique, consultations, itinéraires | ✅ *(données personnelles)* | ✅ | ❌ |
| Inscription (`/register/`) | — | — | ✅ *(public, 30/h)* |

`IsAuthentifiedUser` autorise **les cinq rôles**. Chaque enregistrement est lié à `utilisateur = request.user` : chacun ne voit et ne modifie que ses propres données. C'est ce qui permet aux cartes admin (`/admin/map`, `/admin/regional/map`, `/admin/district/map`) d'avoir des favoris et un historique personnels persistants, exactement comme un visiteur.

#### Analytics, statistiques, exports, imports

| Domaine | SUPER | REGION | DISTRICT | PAROISSE | VISITEUR |
|---|:--:|:--:|:--:|:--:|:--:|
| `/api/analytics/*` | ✅ | 🟡 sa région | ❌ | ❌ | ❌ |
| `/api/stats/globales/` et `/visiteurs/` | ✅ | 🟡 | 🟡 | 🟡 | ❌ |
| `/api/auth/dashboard-stats/` | ✅ | 🟡 | 🟡 | 🟡 | ❌ |
| **Exports** Excel / PDF | ✅ | 🟡 | 🟡 | 🟡 | ❌ |
| Modèles Excel vierges | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Imports** Excel | ✅ | ❌ | ❌ | ❌ | ❌ |

Deux points notables :

- Les **exports appliquent le même scope que les listes** (`filter_paroisses_by_scope`, `filter_oeuvres_by_scope`, `filter_ouvriers_by_scope`, `_filter_statistiques_by_scope`) : *« un export ne doit jamais sortir du périmètre administratif de l'utilisateur »*. Un admin `PAROISSE` qui exporte n'obtient que sa paroisse.
- Les **trois imports sont réservés au `SUPER`** (`403` pour tout autre rôle), alors que le menu « Import / Export » est présent dans les sidebars des quatre rôles.

### 6.4 Attribution des rôles et hiérarchie

#### Les deux seules voies d'entrée

| Voie | Rôle obtenu | Mécanisme |
|---|---|---|
| **Inscription publique** — `POST /api/visitor/register/` | `VISITEUR` **exclusivement** | Auto-inscription, crée `User(role=VISITEUR)` + `ProfilVisiteur`, connexion immédiate, e-mail de bienvenue |
| **Création par un admin** — `POST /api/auth/users/create/` | `REGION`, `DISTRICT` ou `PAROISSE` | Le mot de passe est **généré côté serveur** (16 caractères, `secrets`) et envoyé par e-mail. Jamais fourni par le client, jamais stocké en clair |

`UserCreateSerializer` **refuse explicitement** de créer un compte `VISITEUR` : *« un compte visiteur ne se crée pas ici (inscription publique uniquement) »*. Un rôle inconnu est rejeté de même.

> Le rôle par défaut du modèle est `PAROISSE` (`User.role` a `default="PAROISSE"`) — il ne s'applique qu'aux créations qui ne passent pas par ces deux circuits, par exemple via `/django-admin/` ou une commande de management.

#### La chaîne hiérarchique de création — un seul niveau vers le bas

```
SUPER    ──crée──▶  REGION  ·  DISTRICT  ·  PAROISSE   (tous, partout)
REGION   ──crée──▶  DISTRICT                            (dans SA région uniquement)
DISTRICT ──crée──▶  PAROISSE                            (dans SON district uniquement)
PAROISSE ──crée──▶  (aucun compte)
VISITEUR ──crée──▶  (aucun compte)
```

Aucun rôle ne peut créer un compte `SUPER` en dehors du `SUPER` lui-même, et **personne ne peut créer un compte de son propre niveau ou au-dessus**.

#### Contraintes appliquées à la création

| Contrainte | Effet |
|---|---|
| **Périmètre imposé par le créateur** | Un `REGION` voit `data["region"]` écrasé par sa propre région ; un `DISTRICT` voit `district` **et** `region` écrasés par les siens. Le client ne peut pas choisir la zone |
| **Cohérence du rattachement cible** | Un `REGION` ne peut désigner qu'un district de sa région ; un `DISTRICT` qu'une paroisse de son district |
| **Rattachement obligatoire** | Un admin `REGION` doit avoir une `region`, un `DISTRICT` un `district`, un `PAROISSE` une `paroisse` — sinon `400` |
| **Unicité par zone** | **Un seul admin actif** par région, par district et par paroisse. Plusieurs `SUPER` sont en revanche autorisés |
| **Mot de passe** | Généré serveur, `force_password_change = True` — le titulaire doit le changer à sa première connexion |

#### Cycle de vie d'un compte

1. **Création** par le niveau supérieur → e-mail avec identifiants, `force_password_change = True`.
2. **Première connexion** → le login renvoie `force_password_change`, le frontend redirige vers `/admin/changer-mot-de-passe`.
3. **Vie du compte** → activation/désactivation (`toggle-active/`) et réinitialisation de mot de passe (min. 12 caractères, repasse `force_password_change` à `True`) par le niveau supérieur.
4. **Changement de rôle ou de zone** → **impossible par `PATCH`** (champs en lecture seule). Il faut supprimer puis recréer le compte.
5. **Suppression** → `SUPER` uniquement, **définitive et immédiate** (pas une désactivation), interdite sur un compte `SUPER` et sur soi-même. Journalisée avant l'effacement ; les logs existants du compte passent en `utilisateur = NULL` (`SET_NULL`).

Le mot de passe oublié (`POST /api/auth/password-reset/`) suit le même principe : **aucun lien de réinitialisation** — un nouveau mot de passe est généré et envoyé par e-mail, avec `force_password_change = True`.

### 6.5 Routes et pages protégées

#### Frontend — deux gardes superposées

| Garde | Portée | Comportement |
|---|---|---|
| `AdminGuard` | Tout `/admin/**` | Appelle `/api/auth/me/`. Rôle admin → laisse passer. `VISITEUR` → redirige vers `/carte`. `401`/`403` → redirige vers `/login` |
| `RoleGuard allow={[…]}` | Chaque sous-espace admin | Un rôle non autorisé est redirigé vers **son propre** tableau de bord (`HOME_BY_ROLE`), pas vers `/login` |

Les deux gardes appliquent la même règle défensive : **seul un `401`/`403` explicite éjecte l'utilisateur**. Une panne réseau ou une lenteur transitoire ne le fait jamais sortir de son espace — *« les endpoints backend restent de toute façon l'autorité réelle »*.

#### Tableau des niveaux d'accès

| Route | Accès requis | Garde |
|---|---|---|
| `/` | Public | — |
| `/carte` | Public · mode `visitor` enrichi si `role === "VISITEUR"` | Aucune (adaptation, pas restriction) |
| `/login`, `/register`, `/auth/mot-de-passe-oublie`, `/auth/reset-password/[uid]/[token]` | Public | — |
| `/admin/**` *(tout)* | Un des 4 rôles admin | `AdminGuard` |
| `/admin/changer-mot-de-passe` | Un des 4 rôles admin | `AdminGuard` seul — pas de `RoleGuard`, tous les rôles doivent y accéder |
| `/admin/dashboard`, `/map`, `/paroisses`, `/oeuvres`, `/ouvriers`, `/regions`, `/districts`, `/stats`, `/io`, `/actualites`, `/comptes`, `/journal`, `/parametres` | **`SUPER` exclusivement** | `RoleGuard allow={['SUPER']}` |
| `/admin/regional/**` | **`REGION` exclusivement** | `RoleGuard allow={['REGION']}` |
| `/admin/district/**` | **`DISTRICT` exclusivement** | `RoleGuard allow={['DISTRICT']}` |
| `/admin/paroisse/**` | **`PAROISSE` exclusivement** | `RoleGuard allow={['PAROISSE']}` |

> Les gardes sont **exclusives, pas hiérarchiques** : un `SUPER` qui ouvre `/admin/regional/dashboard` est renvoyé vers `/admin/dashboard`. Chaque rôle a un seul espace.

#### Redirection après connexion

```
VISITEUR                       → /carte
force_password_change === true → /admin/changer-mot-de-passe
sinon                          → ?next=<chemin interne> sinon /admin
```

Le paramètre `next` n'est accepté que s'il correspond à `/^\/(?!\/)/` — un chemin interne relatif, jamais une URL absolue ni protocol-relative (`//evil.com`) : protection contre l'**open redirect**.

Un admin `REGION` atterrit donc sur `/admin`, qui redirige vers `/admin/dashboard`, dont le `RoleGuard` le renvoie vers `/admin/regional/dashboard`. La chaîne fonctionne, au prix de deux redirections.

#### Adaptation de l'interface au rôle

Les pages `/admin/regional/*`, `/admin/district/*` et `/admin/paroisse/*` **ré-exportent les composants de `(general)`**. Ces composants interrogent `/api/auth/me/` et s'adaptent :

| Page | Adaptation observée |
|---|---|
| `paroisses` | `canCreate = (role === 'SUPER')` · `canEdit = (role !== 'REGION')` |
| `oeuvres` | Le niveau de rattachement « National » n'est proposé qu'au `SUPER` |
| `ouvriers` | Région/district/paroisse **verrouillés** dans le formulaire selon le rattachement du compte ; identité et grade éditables par le seul `SUPER` |
| `comptes` | Liste des rôles créables restreinte selon la hiérarchie |

Ces adaptations sont **cosmétiques** : elles évitent de proposer une action qui échouerait. La règle est appliquée côté backend dans tous les cas.

#### Endpoints backend par niveau d'accès

| Niveau | Endpoints |
|---|---|
| **Public** | `GET` régions, districts, paroisses, œuvres, types d'œuvre, ouvriers, grades, statistiques, actualités publiées · `/api/auth/csrf/`, `/login/`, `/password-reset/`, `/visitor/register/` · `/api/schema/*` |
| **Authentifié (tous rôles)** | Tout `/api/visitor/*` · `/api/auth/me/`, `/me/avatar/`, `/change-password/` |
| **Admin (4 rôles)** | `/api/audit/journal/` · `/api/auth/dashboard-stats/`, `/users/*` *(hors `PAROISSE`, bloqué par `can_manage_accounts`)* · `/api/stats/*` · `/api/exports/*` · écritures sur paroisses, œuvres, ouvriers, statistiques *(bornées)* |
| **`SUPER` + `REGION`** | `/api/analytics/*` |
| **`SUPER` seul** | Création/suppression de paroisse · suppression d'œuvre, d'ouvrier, de statistique, de compte · écriture sur les actualités · les trois `/api/imports/*` |

### 6.6 Points forts du modèle

- **Double barrière systématique** — la garde frontend est explicitement documentée comme non autoritaire ; chaque endpoint refait le contrôle.
- **Séparation rôle / périmètre** — le rôle dit quoi, le rattachement dit où. Les deux sont vérifiés indépendamment, à la lecture comme à l'écriture.
- **Listes blanches de champs** plutôt que listes noires : un champ nouvellement ajouté au modèle est refusé en modification par défaut, jamais accidentellement ouvert.
- **Immuabilité du rattachement** (district d'une paroisse, zone d'une œuvre) : ces champs déterminent qui a accès à la donnée, les modifier reviendrait à un transfert de propriété silencieux.
- **Escalade de privilèges verrouillée** : `role`, `region`, `district`, `paroisse`, `permissions_custom`, `is_active` sont en lecture seule sur le `PATCH` générique.
- **Le scope s'applique aussi aux exports**, qui sont le moyen le plus simple d'exfiltrer un jeu de données complet.
- **Mots de passe jamais choisis par le client** à la création ni à la réinitialisation, avec changement forcé à la première connexion.
- **Suppressions journalisées avant exécution**, avec le contexte nécessaire pour reconstituer ce qui a disparu.

### 6.7 Écarts constatés

Points relevés à la lecture du code. Les deux premiers sont des **failles d'autorisation exploitables**, les suivants des incohérences de documentation ou du code mort.

| # | Constat | Emplacement | Portée |
|:--:|---|---|---|
| 1 | **Création de statistique non bornée au périmètre.** `StatistiqueAnnuelleViewSet` ne surcharge pas `create()`, et `perform_create` ne force la paroisse que pour le rôle `PAROISSE`. Un admin `REGION` ou `DISTRICT` peut donc `POST` une statistique en désignant **n'importe quelle paroisse du pays** — y compris hors de sa zone. L'écriture déclenche `_sync_nombre_fideles`, qui modifie le `nombre_fideles` de cette paroisse tierce. `update()` est bien protégé par `_can_write_stat` ; c'est uniquement la création qui ne l'est pas | [apps/accounts/views.py:84](../backend/apps/accounts/views.py#L84) | **Écriture hors périmètre** |
| 2 | **Auto-validation possible par une paroisse.** L'action `POST /valider/` exige `role in ("SUPER","REGION","DISTRICT")`, mais `validee` est un champ **inscriptible** de `StatistiqueAnnuelleSerializer`. Un admin `PAROISSE` peut donc envoyer `PATCH /api/statistiques/{id}/ {"validee": true}` sur sa propre statistique : `_can_write_stat` l'autorise, et le contrôle de rôle de l'action est contourné. Le circuit de validation à deux niveaux devient facultatif | [apps/accounts/serializers.py:30](../backend/apps/accounts/serializers.py#L30) | **Contournement du circuit de validation** |
| 3 | Helpers `can_delete_paroisse()` et `can_delete_ouvrier()` définis mais **jamais appelés** — ils autorisent `REGION` (sous permission custom pour le premier), alors que les `destroy()` réels exigent `SUPER`. La permission fine `peut_supprimer_paroisse` de `permissions_custom` n'a donc aucun effet | [permissions.py](../backend/apps/accounts/permissions.py) | Code mort trompeur |
| 4 | Le docstring de `UserCreateSerializer` annonce *« REGION → DISTRICT/PAROISSE de SA région »*, mais le code lève une erreur si `target_role != "DISTRICT"`. **Un admin régional ne peut créer que des admins de district**, pas des admins de paroisse | [serializers.py:107](../backend/apps/accounts/serializers.py#L107) | Documentation contredite par le code |
| 5 | Les classes `IsSuperAdmin`, `IsRegionOrAbove`, `IsDistrictOrAbove`, `IsVisiteur` et `IsOwnerOrAdmin` sont définies mais **montées sur aucune route** — les contrôles équivalents sont réécrits à la main dans les vues | [permissions.py](../backend/apps/accounts/permissions.py), [visitors/permissions.py](../backend/apps/visitors/permissions.py) | Duplication de logique |
| 6 | Les trois vues d'import rejettent tout rôle autre que `SUPER` en début de fonction, mais contiennent ensuite des contrôles de zone par ligne pour `REGION`, `DISTRICT` et `PAROISSE` — **inatteignables** | [exports/views.py:747](../backend/apps/exports/views.py#L747), [:1041](../backend/apps/exports/views.py#L1041) | Code mort |
| 7 | Le menu « Import / Export » figure dans les sidebars des quatre rôles, alors que **seul le `SUPER` peut importer**. Les autres rôles découvrent le refus au moment de l'envoi du fichier | [SidebarRegional.tsx](../frontend/src/components/admin/SidebarRegional.tsx), [SidebarDistrict.tsx](../frontend/src/components/admin/SidebarDistrict.tsx), [SidebarParoisse.tsx](../frontend/src/components/admin/SidebarParoisse.tsx) | Ergonomie |
| 8 | Un admin `REGION` ne peut **ni créer ni modifier** une paroisse — il ne peut que la consulter. C'est un choix explicite et commenté, mais il fait du niveau régional le seul maillon sans droit d'écriture sur l'entité centrale, alors qu'il en a sur les œuvres et les ouvriers | [geo/views.py:257](../backend/apps/geo/views.py#L257) | Asymétrie à confirmer |

---

## 7. Parcours utilisateurs pas à pas

> Description de l'UI **telle qu'elle est implémentée aujourd'hui**, pas telle qu'elle devrait être.
> Chaque étape indique : où cliquer · quels champs remplir · le résultat attendu · les erreurs possibles.
>
> **Trois parcours demandés n'existent pas dans l'interface** et sont documentés comme tels : l'import Excel (§7.5), l'import Word (§7.5) et les évaluations synodales (§7.6).

### 7.1 Connexion et première utilisation

#### Étape 1 — Arriver sur la page de connexion

| | |
|---|---|
| **Où cliquer** | Depuis `/` (landing) : bouton **Connexion** de la navbar. Depuis `/carte` : bouton **Connexion** en haut à droite. Ou directement `/login` |
| **Résultat** | Écran en deux volets : visuel + verset biblique à gauche, formulaire à droite, titre « Connexion **sécurisée.** » |

#### Étape 2 — Saisir les identifiants

| | |
|---|---|
| **Champs** | **Adresse e-mail** (`type="email"`, placeholder `j.ataba@eec.cm`) · **Mot de passe** (bouton œil pour l'afficher) |
| **Où cliquer** | Bouton **Se connecter** |
| **À noter** | Le champ est étiqueté « Adresse e-mail » mais son contenu part dans `username` — le backend accepte **l'un ou l'autre**. Un administrateur peut donc saisir son nom d'utilisateur malgré le libellé |
| **Sous le capot** | La page appelle d'abord `GET /api/auth/csrf/`, puis `POST /api/auth/login/` **directement sur le backend**, en contournant le proxy Next.js (contournement d'un bug Turbopack documenté dans le code) |

**Erreurs possibles :**

| Message | Cause |
|---|---|
| « Erreur de sécurité. Rechargez la page et réessayez. » | Le token CSRF n'a pas pu être récupéré |
| « Identifiants incorrects. » *(ou le `detail` renvoyé)* | Mauvais couple identifiant/mot de passe |
| « Erreur réseau. Vérifiez votre connexion. » | Backend injoignable |
| *(silencieux)* — le formulaire **tremble** 600 ms | Feedback visuel qui accompagne **toute** erreur |
| **Après 5 tentatives en une minute** | Throttle `login` côté serveur — le message affiché est le `detail` DRF, pas un texte dédié |

#### Étape 3 — Redirection selon le profil

```
role === 'VISITEUR'            → /carte
force_password_change === true → /admin/changer-mot-de-passe
sinon                          → ?next=<chemin interne> sinon /admin
```

Le paramètre `next` n'est suivi que s'il correspond à `/^\/(?!\/)/` — un chemin interne relatif. Une URL absolue ou protocol-relative (`//evil.com`) est ignorée au profit de `/admin` : protection contre l'open redirect.

> **Chaîne de redirections pour un non-`SUPER`** : un admin régional arrive sur `/admin`, qui redirige vers `/admin/dashboard`, dont le `RoleGuard` le renvoie enfin vers `/admin/regional/dashboard`. Trois sauts avant d'atteindre son espace — fonctionnel, mais visible à l'écran.

#### Étape 4 — Première connexion : changer le mot de passe

Tout compte créé par un administrateur a `force_password_change = True` et atterrit sur `/admin/changer-mot-de-passe`.

| | |
|---|---|
| **Champs** | **Mot de passe actuel** (celui reçu par e-mail) · **Nouveau mot de passe** · **Confirmation** |
| **Où cliquer** | Bouton de validation du formulaire |
| **Résultat** | Message de succès, puis redirection automatique vers `/admin` après **2,5 secondes** |

**Erreurs possibles :**

| Message | Moment |
|---|---|
| « Le mot de passe doit contenir au moins 12 caractères. » | Validé **côté client** avant tout appel réseau |
| « Les mots de passe ne correspondent pas. » | Idem, côté client |
| « Erreur de sécurité. Rechargez la page et réessayez. » | Token CSRF indisponible |
| Le `detail` du backend | Ancien mot de passe faux, ou règle de complexité Django refusée |

> **Faille d'ergonomie** : cette page n'est protégée que par `AdminGuard`. Rien n'empêche un compte en `force_password_change` de naviguer manuellement vers `/admin/dashboard` — la contrainte n'est appliquée qu'au moment de la redirection après login, jamais revérifiée ensuite.

#### Étape 5 — Découvrir son espace

Chaque rôle a un espace distinct, avec sa propre barre latérale :

| Rôle | Espace | Entrées de menu |
|---|---|---|
| `SUPER` | `/admin/dashboard` | Tableau de bord · Carte interactive · Paroisses · Œuvres · Ouvriers · Régions synodales · Districts · Statistiques · Import/Export · Actualités · Comptes · Journal · Paramètres |
| `REGION` | `/admin/regional/dashboard` | + une **ScopeBar** rappelant la région ; pas de Régions ni Actualités |
| `DISTRICT` | `/admin/district/dashboard` | Idem, sans Districts ; ScopeBar du district |
| `PAROISSE` | `/admin/paroisse/dashboard` | Tableau de bord · Fiche paroisse · Œuvres · Ouvriers · Statistiques · Import/Export · Paramètres. **Ni carte, ni comptes, ni journal** |

---

### 7.2 Recherche et consultation d'une paroisse sur la carte

Parcours sur `/carte` (public ou visiteur connecté). L'interface se compose d'une **navbar** (compteurs nationaux, bascule Carte/Liste, thème clair/sombre, compte), d'un **rail vertical** à gauche (10 onglets) et d'un **panneau de détail** à droite.

#### Étape 1 — Ouvrir la recherche

| | |
|---|---|
| **Où cliquer** | Onglet **Recherche** (icône loupe), premier du rail |
| **Résultat** | Panneau latéral « Recherche rapide », curseur placé automatiquement dans le champ |
| **Avant toute frappe** | Une section **Suggestions** liste les **6 premières régions** avec leur nombre de paroisses |

#### Étape 2 — Taper la recherche

| | |
|---|---|
| **Champ** | « Tapez pour rechercher… » — un seul champ libre |
| **Comportement** | Recherche **locale**, sur les données déjà chargées en mémoire, avec un **debounce de 180 ms**. Aucun appel réseau |
| **Résultat** | Résultats groupés en quatre sections, **plafonnées** : Régions (4 max) · Districts (4) · Paroisses (6) · Œuvres (5) |
| **Chaque ligne** | Icône colorée par type · nom · sous-titre (`région · N fidèles` pour une paroisse) · chevron |

**Limites de la recherche :**

| Limite | Conséquence |
|---|---|
| Correspondance par `includes()` simple, sans normalisation | « Yaounde » ne trouve **pas** « Yaoundé » — les accents doivent être saisis exactement |
| Recherche sur le **nom seul** (sauf régions, qui incluent aussi la ville) | Impossible de chercher par adresse, district ou catégorie |
| Plafonds fixes sans pagination | Au-delà de 6 paroisses correspondantes, les suivantes sont invisibles ; aucun message ne le signale |
| Aucun résultat | Message « Aucun résultat pour « **\<terme\>** ». » avec icône loupe |

#### Étape 3 — Sélectionner une paroisse

| | |
|---|---|
| **Où cliquer** | La ligne de la paroisse dans les résultats |
| **Résultat** | Le panneau de recherche se ferme · la carte **vole** vers la paroisse au **zoom 13** · le panneau de détail s'ouvre à droite · l'entité est ajoutée à l'historique récent |
| **Variante** | Un clic **direct sur un marqueur** de la carte fait la même chose, mais au **zoom 16** et **sans jamais dézoomer** (`atLeast: true` — si vous êtes déjà plus près, le zoom courant est conservé) |

Pour un **visiteur connecté**, la consultation est persistée : `POST /api/visitor/consultations/` avec `{type_entite, entite_id}`. En mode public, rien n'est envoyé — l'historique reste local à la session.

#### Étape 4 — Lire la fiche de la paroisse

Le panneau affiche un en-tête (icône, nom, badge vérifié, **catégorie** `Cat. A1`, quartier, district, région), trois boutons d'action, puis des onglets :

| Onglet | Contenu |
|---|---|
| **Aperçu** | Quartier, puis trois grands compteurs : **Communiants**, **Non-communiants**, **Total fidèles**, avec l'année de référence |
| **Informations** | Adresse, rattachement, catégorie officielle *(mentionnée comme « résolution R05/CSG »)* |
| **Statistiques** | Les mêmes trois compteurs, avec l'année en titre |
| **Ouvriers** | Liste chargée **à la demande** via l'API, avec grade et statut (Occupé / Inoccupé) |

**Trois boutons d'action** : **Itinéraire** (bascule vers le panneau Parcours) · **Enregistrer** (favori) · **Partager** (modale avec lien copiable).

**Erreurs et cas limites :**

| Situation | Affichage |
|---|---|
| Paroisse sans statistique | « Aucune statistique enregistrée. » |
| Paroisse sans ouvrier | « Aucun ouvrier enregistré pour cette paroisse. » |
| Clic sur **Enregistrer** en mode public | Modale « **Fonctionnalité réservée** » → *Créer un compte* / *Se connecter* / *Continuer en tant que visiteur* |
| Changement rapide de paroisse | Un drapeau d'annulation empêche qu'une réponse lente écrase la fiche courante |

#### Étape 5 — Parcourir autrement (variantes)

| Voie | Effet |
|---|---|
| Onglets **Régions** / **Districts** / **Paroisses** / **Œuvres** du rail | Liste filtrable, **80 résultats affichés au maximum** puis « + N autres résultats. Affinez la recherche. » |
| Bascule **Liste** de la navbar | Vue tabulaire de toutes les entités filtrées, hors carte |
| Onglet **Historique** | 40 dernières entités consultées *(verrouillé en mode public)* |
| Onglet **Favoris** | Entités enregistrées *(verrouillé en mode public)* |

---

### 7.3 Filtres et couches cartographiques

> **Précision de vocabulaire** : la carte **ne comporte pas de choroplèthe**. Aucune région n'est colorée selon une valeur statistique. Deux encodages coexistent :
> - les **régions** reçoivent une couleur **catégorielle** tirée d'une palette par index (`REG_COLORS`), qui signale l'appartenance, pas une quantité ;
> - les **quantités** sont portées par des **symboles proportionnels** : la taille du marqueur d'une paroisse encode son effectif de fidèles.

#### A. Le panneau Filtres

| | |
|---|---|
| **Où cliquer** | Onglet **Filtres** (entonnoir), deuxième du rail |
| **Structure** | Trois sections — Localisation · Types d'entités · Statistiques — et deux boutons en pied de panneau |

**Section 1 — Localisation (trois listes en cascade)**

| Champ | Comportement |
|---|---|
| **Région synodale** | « Toutes les régions (N) ». Choisir une région **réinitialise district et paroisse** |
| **District** | **Désactivé** tant qu'aucune région n'est choisie — libellé « — Choisir une région d'abord », opacité réduite à 0,5 |
| **Paroisse** | **Désactivé** tant qu'aucun district n'est choisi — même traitement |

**Section 2 — Types d'entités** : une grille de cartes cliquables, une par type (paroisse, scolaire, médical, universitaire, agro, immeuble, terrain). Chaque carte affiche son icône colorée, une **coche** si active, son libellé et **son nombre d'entités**. Tous les types sont actifs par défaut.

**Section 3 — Statistiques** : un curseur **Fidèles minimum**, de **0 à 3 000 par pas de 50**. Affiche « Tous » à 0, sinon « 500+ ».

| Bouton | Effet |
|---|---|
| **Appliquer** | Applique les filtres et ferme le panneau |
| **Réinitialiser** | Revient aux valeurs par défaut : aucune restriction géographique, tous les types actifs, seuil à 0 |

> **Champs déclarés mais absents de l'interface** : le type `FilterState` prévoit `grades`, `status`, `year` et `minCommun`, mais **aucun contrôle ne les expose**. Filtrer par grade d'ouvrier, par statut ou par année est impossible depuis la carte.

#### B. Les couches — panneau Paramètres

| | |
|---|---|
| **Où cliquer** | Onglet **Paramètres** du rail *(verrouillé en mode public)*, section **Cartographie** |

| Interrupteur | Défaut | Effet |
|---|---|---|
| **Découpage synodal** | activé | Affiche les contours colorés des 22 régions |
| **Regroupement (cluster)** | activé | Regroupe les marqueurs proches |
| **Noms des points d'intérêt** | activé | Noms des POI en permanence, sinon au survol |
| **Points d'intérêt (POI)** | activé | Écoles, hôpitaux, pharmacies… **à partir du zoom 14** |

Le **Découpage synodal** est aussi accessible directement en tête du panneau **Légende**, sans passer par les Paramètres.

#### C. Comportement au zoom

| Seuil | Ce qui change |
|---|---|
| **Zoom initial 7** | Vue nationale centrée sur le Cameroun (`minZoom: 5`, `maxZoom: 19`) |
| **Zoom ≥ 9** | Les noms des **grandes paroisses** apparaissent (marqueur ≥ 38 px, soit le tiers supérieur de l'échelle) — points d'ancrage dès la vue régionale |
| **Zoom ≥ 13** | Les noms de **toutes** les paroisses et œuvres apparaissent |
| **Zoom ≥ 14 à 17** | Les POI apparaissent **progressivement**, chaque classe ayant son propre seuil : hôpitaux et collèges dès 14, pharmacies et écoles à 15, cafés et restaurants à 17 |
| **Clic sur une région** | `flyToBounds` sur ses contours, plafonné au **zoom 10**. Ni popup ni panneau — le détail d'une région se lit dans les onglets dédiés du rail |
| **Survol d'une région** | Le remplissage passe de 0,03 à **0,18** d'opacité et le trait s'épaissit |

> Le remplissage des régions est volontairement à **0,03** d'opacité : les 22 régions pavent la totalité des terres visibles, et à 0,07 les voiles se cumulaient aux frontières partagées, teintant toute la carte. Le survol reste le mode de lecture franc.

#### D. Les clusters

Configuration : `maxClusterRadius: 90`, `showCoverageOnHover: false`, `spiderfyOnMaxZoom: true`. Une pastille affiche le nombre d'éléments regroupés et passe en classe « large » **à partir de 30**. Au zoom maximal, les marqueurs superposés se déploient en étoile.

#### E. La légende

| | |
|---|---|
| **Contenu** | Interrupteur du découpage synodal · **Familles** de couleur · **Échelle des tailles** · **Regroupements** · **Points d'intérêt** · liste des **22 régions** avec leur couleur |
| **Échelle des tailles** | Trois paliers en progression géométrique (max, max÷4, max÷16), rendus par de vrais marqueurs à l'échelle |

La note de la légende précise l'encodage : *« L'aire du marqueur est proportionnelle à l'effectif. Les œuvres, qui ne portent pas d'effectif, gardent une taille fixe. »* Le rayon suit la **racine carrée** de la valeur, pour que l'œil compare des aires et non des rayons — de 22 px pour la plus petite paroisse à 46 px pour la plus grande.

**Erreurs et cas limites :**

| Situation | Comportement |
|---|---|
| Filtre laissant zéro entité | La carte se vide sans message explicite |
| Région sans géométrie en base | Repli sur un **cercle** de rayon approximatif au lieu du polygone |
| Recherche par accent | Aucune normalisation — voir §7.2 |

---

### 7.4 Ajouter ou modifier une paroisse (admin)

Page `/admin/paroisses` (et ses ré-exports régional / district).

#### Étape 1 — Trouver la paroisse

| Contrôle | Comportement |
|---|---|
| **Rechercher** | Champ libre sur le nom, envoyé au serveur en `?search=` |
| **Région** | Liste de toutes les régions |
| **District** | **Désactivé** tant qu'aucune région n'est choisie |
| **Catégorie** | `Toutes catégories`, `A++`, `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `C3`, `C4` |
| **GPS** | `GPS: tous` · `GPS: avec` · `GPS: sans` |
| **Réinitialiser** | N'apparaît que si au moins un filtre est actif |

Un bandeau bleu affiche le décompte filtré ; l'en-tête affiche le total.

#### Étape 2 — Ouvrir le formulaire

| Action | Où cliquer | Condition |
|---|---|---|
| **Créer** | Bouton vert **Créer une paroisse**, en haut à droite | **Visible uniquement si `role === 'SUPER'`** |
| **Modifier** | Ligne de la paroisse → panneau de consultation → bouton **Modifier** | Masqué si `role === 'REGION'` |

Le formulaire s'ouvre en panneau latéral, avec un fil d'Ariane « **Étape n / 6** » et six onglets numérotés portant chacun un indicateur de complétion :

| # | Onglet | Champs | Notes |
|:--:|---|---|---|
| 1 | **Général** | **Nom \*** · Catégorie · En prospection · **Région \*** · **District \*** · Quartier/Adresse | En modification, **Région, District et Adresse sont verrouillés** — les libellés portent la mention « (verrouillée) » |
| 2 | **GPS & Carte** | Coord. Y — Latitude · Coord. X — Longitude · Altitude (m) | Aperçu cartographique **en lecture seule** : le marqueur visualise la saisie, il ne se déplace pas au clic |
| 3 | **Fidèles** | Communiants · Non-communiants · Total déclaré | Deux modes exclusifs, voir ci-dessous |
| 4 | **Contact** | Téléphone · E-mail | |
| 5 | **Ouvriers** | Sélection d'ouvriers à rattacher | Enregistré par différentiel |
| 6 | **Œuvres** | Sélection d'œuvres à rattacher | Idem |

#### Étape 3 — Renseigner les effectifs (onglet 3)

Deux façons **mutuellement exclusives** de saisir l'effectif :

- **La ventilation** — Communiants + Non-communiants. C'est elle qui prime si elle est saisie, même si le champ Total porte encore une ancienne valeur. Le serveur en déduit le total et **efface tout total global antérieur**.
- **Le total seul** — pour les paroisses dont l'effectif vient d'une source qui ne ventile pas.

L'année d'imputation n'est **pas l'année civile** : le formulaire interroge `/api/auth/dashboard-stats/` et retient la **plus récente année réellement présente en base**. Le code documente le bug corrigé : écrire sur `new Date().getFullYear()` créait des statistiques pour une année jamais recensée, invisibles du tableau de bord et concurrentes de la vraie donnée.

#### Étape 4 — Enregistrer

L'enregistrement se déroule en **quatre appels successifs** :

1. `POST /api/geo/paroisses/` (création) ou `PATCH /api/geo/paroisses/{id}/` (modification)
2. `PATCH` ou `POST` sur `/api/statistiques/` pour les effectifs
3. `PATCH /api/ouvriers/ouvriers/{id}/` pour chaque ouvrier ajouté ou retiré
4. `PATCH /api/oeuvres/oeuvres/{id}/` pour chaque œuvre ajoutée ou retirée

**Le contenu envoyé dépend du rôle** — un garde-fou explicite dans le code : *« lui seul peut modifier catégorie, GPS et contact — envoyer ces champs pour un autre rôle ferait échouer TOUT l'enregistrement en 400 »*.

| Rôle | Champs envoyés en modification |
|---|---|
| `SUPER` | `nom`, `en_prospection`, `categorie`, `adresse`, `telephone`, `email`, `latitude`, `longitude` |
| `DISTRICT`, `PAROISSE` | `nom`, `en_prospection` **seulement** |

**Erreurs possibles :**

| Message | Origine |
|---|---|
| « Le nom de la paroisse est requis. » | Client, avant tout appel |
| « Veuillez sélectionner un district. » | Client |
| « Renseignez la latitude ET la longitude, ou laissez les deux vides. » | Client — anticipe le refus du serveur. Deux champs vides = effacement demandé |
| « Année de référence indisponible : impossible d'enregistrer les effectifs. » | `/api/auth/dashboard-stats/` n'a renvoyé aucune année |
| « Seul l'administrateur général peut créer une paroisse. » | Serveur, `403` |
| « Champs non modifiables pour votre rôle : […] » | Serveur, `400` — liste les champs refusés et les champs autorisés |
| « Erreur lors de la sauvegarde. » | Repli générique |

#### Étape 5 — Supprimer (optionnel)

| | |
|---|---|
| **Où cliquer** | Bouton de suppression sur la ligne → **modale de confirmation** rappelant le nom, le district et la région |
| **Résultat** | Toast vert « Paroisse supprimée » |
| **Blocage** | Si la paroisse a encore des ouvriers ou des œuvres, le serveur renvoie `409` avec le décompte exact à réaffecter |

#### Limites relevées dans ce formulaire

| # | Constat |
|:--:|---|
| 1 | **Le champ Altitude n'est jamais enregistré.** `form.altitude` est saisi, stocké dans l'état et affiché en récapitulatif, mais **absent des deux payloads**. La valeur est perdue à la fermeture du panneau, sans aucun avertissement |
| 2 | **Les erreurs de rattachement sont avalées.** Les étapes 3 et 4 utilisent `Promise.allSettled` : si le rattachement d'un ouvrier ou d'une œuvre échoue, **rien ne s'affiche** et l'enregistrement est présenté comme réussi |
| 3 | **Le client API ne remonte que `detail`.** `lib/api.ts` fait `throw new Error(err.detail || 'Erreur ' + status)`. Les erreurs DRF par champ (`{"nom": ["…"]}`) n'ont pas de `detail` et se réduisent donc à « **Erreur 400** », sans indiquer le champ fautif |
| 4 | **Le champ Adresse est désactivé en modification pour tous**, `SUPER` compris, alors que le backend l'autorise et que le payload l'envoie quand même — avec sa valeur inchangée |
| 5 | **Faute de frappe visible** : le libellé de l'onglet Général indique « Région **synodiale** » au lieu de « synodale » |

---

### 7.5 Import de données en masse — **non implémenté dans l'interface**

**Il n'existe aucune interface d'import dans le frontend.** Le constat est vérifiable simplement : le seul `<input type="file">` de toute l'application concerne les **images** — l'avatar dans `/admin/parametres` et les visuels dans `/admin/actualites`. Aucun composant n'appelle `/api/imports/*` ni `/api/exports/templates/*`.

#### Ce que l'utilisateur trouve réellement

L'entrée de menu **« Import / Export »** mène à `/admin/io`, une page à **deux onglets seulement** :

| Onglet | Contenu |
|---|---|
| **Export de données** | Cinq cartes de téléchargement — voir §7.7 |
| **Historique** | Table des exports passés, lue depuis `/api/audit/journal/?action=EXPORT` |

Il n'y a **ni zone de dépôt, ni bouton de téléversement, ni téléchargement de modèle Excel, ni écran de rapport d'import**. Un administrateur cherchant à importer un fichier depuis le menu qui porte ce nom ne trouve rien.

#### L'écart avec le backend

| Élément | Backend | Frontend |
|---|:--:|:--:|
| `POST /api/imports/paroisses/` | ✅ implémenté | ❌ aucun appel |
| `POST /api/imports/oeuvres/` | ✅ | ❌ |
| `POST /api/imports/ouvriers/` | ✅ | ❌ |
| `GET /api/exports/templates/paroisses/` | ✅ | ❌ |
| `GET /api/exports/templates/oeuvres/` | ✅ | ❌ |
| `GET /api/exports/templates/ouvriers/` | ✅ | ❌ |

Les trois imports sont fonctionnels côté serveur — colonnes attendues, validation GPS contre la bounding box du Cameroun, création des statistiques annuelles — mais **inaccessibles autrement qu'en appelant l'API directement** (cURL, Postman, `/api/schema/swagger/`). Ils sont par ailleurs réservés au `SUPER`, alors que l'entrée « Import / Export » figure dans la barre latérale des **quatre** rôles.

#### Le format Word

**Aucun import Word n'existe, ni dans le frontend ni dans le backend.** Les trois vues d'import n'acceptent que le `.xlsx`, via `openpyxl`. Le seul fichier `.docx` du dépôt est un document du cahier des charges dans `docs/`, et `generer_docs_word.py` à la racine **produit** des documents Word de documentation — il n'en lit aucun.

> Pour rendre ce parcours utilisable, il faudrait construire l'écran : téléchargement du modèle, dépôt du fichier, envoi en `multipart/form-data` sur le champ `file`, puis affichage du rapport ligne à ligne renvoyé par le serveur.

---

### 7.6 Consultation des statistiques — et le cas des « évaluations synodales »

#### A. Ce qui existe : la page Statistiques

Page `/admin/stats`, deux onglets. Les deux jeux de données sont chargés **en parallèle au montage**, quel que soit l'onglet actif.

**Onglet 1 — Statistiques globales** (`GET /api/stats/globales/`)

| Élément | Contenu |
|---|---|
| Cartes compteurs | Régions synodales *(`SUPER` uniquement)* · Districts · Paroisses · Œuvres · Ouvriers · Comptes administrateurs |
| Graphiques | **Paroisses par région synodale** *(`SUPER` uniquement)* et **Paroisses par district** |

**Onglet 2 — Statistiques visiteurs** (`GET /api/stats/visiteurs/`)

| Élément | Contenu |
|---|---|
| Cartes compteurs | Connexions totales · Visiteurs actifs aujourd'hui · Visiteurs (jour) · Visiteurs (mois) · Recherches effectuées |
| Graphiques | Six classements : régions, districts, paroisses, œuvres les plus consultés · paroisses les plus favorisées · itinéraires les plus utilisés |

Les graphiques sont des **barres horizontales** normalisées sur la valeur maximale, avec une palette de 10 couleurs cyclique. Chaque ligne affiche le nom et la valeur formatée en français.

**Comportements et erreurs :**

| Situation | Affichage |
|---|---|
| Chargement | « Chargement des statistiques… » avec icône rotative |
| Série vide | « Aucune donnée disponible. » ou « Aucune consultation enregistrée. » selon le graphique |
| **Échec de l'appel** | `.catch(() => {})` — l'erreur est **avalée**. L'écran reste bloqué sur l'état de chargement, sans message ni possibilité de réessayer |
| Adaptation au rôle | Un non-`SUPER` ne voit ni la carte « Régions synodales » ni le graphique par région ; la grille passe de deux colonnes à une |

#### B. Les statistiques par paroisse

Elles se consultent ailleurs, sans page dédiée :

| Emplacement | Contenu |
|---|---|
| Fiche paroisse sur `/carte`, onglets **Aperçu** et **Statistiques** | Communiants, Non-communiants, Total fidèles, avec l'année |
| `/admin/paroisses` → panneau de consultation | Mêmes valeurs + catégorie |
| `/admin/dashboard` | Fidèles par année, top régions, top paroisses, œuvres par type, catégories par région |
| Formulaire paroisse, onglet **Fidèles** | Saisie et modification |

#### C. Les « évaluations synodales » — **la fonctionnalité n'existe pas**

Aucune entité, aucun endpoint et aucun écran ne porte ce nom. Il n'y a **ni modèle `EvaluationSynodale`, ni page d'évaluation, ni formulaire de notation**. Le terme n'apparaît nulle part dans le code.

Deux mécanismes voisins peuvent expliquer l'attente :

**1. La catégorisation des paroisses (A++ → C4)** — c'est le **résultat** d'une évaluation, jamais l'évaluation elle-même. Le champ `Paroisse.categorie` stocke une note finale sur neuf niveaux, décrite dans le panneau de détail comme la « **catégorie officielle (résolution R05/CSG)** ». Le fichier `lib/viz-palette.ts` documente sa provenance :

> *« Source : matrice d'évaluation de "Catégorisation paroisses EEC 050826", où la catégorie découle d'une note globale de 1 à 9 (poids économique + poids démographique). L'effectif moyen suit ce rang, de 135 fidèles en C1 à 3 328 en A++. »*

Le rang ordonné est `C1 < C2 < C3 < C4 < B1 < B2 < A1 < A2 < A++`. Le code signale le piège : dans chaque lettre le chiffre **croît** avec l'importance, si bien que colorer les catégories dans l'ordre de présentation des documents EEC produirait une échelle inversée.

Dans l'interface, la catégorie est **une simple liste déroulante** dans le formulaire paroisse et **un filtre** dans la liste. Ni la matrice, ni les critères, ni le calcul de la note ne sont implémentés : la catégorie est saisie à la main, ou importée depuis Excel.

**2. Le circuit de validation des statistiques annuelles** — le champ `validee` et l'action `POST /api/statistiques/{id}/valider/` permettent à un niveau supérieur de valider une déclaration paroissiale. C'est le seul mécanisme d'approbation hiérarchique du système. **Aucun bouton de l'interface ne l'appelle** : ni la page Statistiques, ni la page Paroisses, ni les tableaux de bord n'exposent la validation. Le compteur `validations_attente` est pourtant renvoyé par `/api/auth/dashboard-stats/`.

> **En résumé** : si « évaluation synodale » désigne la catégorisation, seul son **résultat** est stocké et affiché. Si elle désigne la validation des déclarations annuelles, le backend est prêt mais **l'interface ne l'expose pas**.

---

### 7.7 Export de données et rapports

C'est le parcours le plus complet des trois derniers. Il existe **deux points d'entrée**.

#### A. La page Import/Export — export global

| | |
|---|---|
| **Où cliquer** | Menu latéral **Import / Export** → onglet **Export de données** |
| **Résultat** | Cinq cartes, chacune avec icône, titre, description et bouton **Télécharger** |

| Carte | Description affichée | Endpoint |
|---|---|---|
| **Paroisses** | « Toutes les paroisses avec GPS » | `/api/exports/paroisses/excel/` |
| **Ouvriers** | « Tous les ouvriers, tous grades » | `/api/exports/ouvriers/excel/` |
| **Œuvres** | « Toutes les œuvres sociales EEC » | `/api/exports/oeuvres/excel/` |
| **Statistiques .xlsx** | « Rapport annuel agrégé » | `/api/exports/statistiques/excel/` |
| **Statistiques .pdf** | « Rapport PDF imprimable A4 » | `/api/exports/statistiques/pdf/` |

Au clic : un `<a>` invisible est créé, cliqué, puis retiré du DOM, et un toast bleu s'affiche — « Export \<nom\> lancé · Le fichier se télécharge depuis le serveur… ». Un bandeau en pied de page rappelle : *« Les exports sont filtrés selon votre périmètre administratif (région, district ou paroisse selon votre rôle). »*

#### B. Depuis la liste des paroisses — export filtré

| | |
|---|---|
| **Où cliquer** | Bouton **Exporter Excel**, à côté de **Créer une paroisse** |
| **Comportement** | Les filtres **actuellement appliqués** sont recopiés dans l'URL : `search`, `region`, `district`, `categorie`, `avec_gps`, `sans_gps` |
| **Résultat** | Ouverture dans un **nouvel onglet** (`window.open(..., '_blank')`) |

C'est le seul export qui respecte les filtres à l'écran ; les cinq cartes de `/admin/io` exportent l'intégralité du périmètre.

#### C. L'onglet Historique

| | |
|---|---|
| **Où cliquer** | Onglet **Historique** de la page Import/Export |
| **Source** | `GET /api/audit/journal/?action=EXPORT&page_size=100`, retrié par date décroissante côté client |
| **Colonnes** | Date/Heure · Type (pastille verte « Export ») · Utilisateur · Entité · Détail |
| **Vide** | « Aucun export enregistré » avec icône |

**Erreurs et limites :**

| # | Constat |
|:--:|---|
| 1 | **Le toast ment par construction.** Il annonce « Export lancé » **avant** toute réponse du serveur. Un `403`, un `500` ou un throttle produit le même message de succès ; l'échec ne se manifeste que par l'absence de fichier |
| 2 | **Le throttle export (20/min) n'est pas géré.** Au-delà, le serveur refuse silencieusement du point de vue de l'interface |
| 3 | **L'historique échoue en silence** — `.catch(() => {})` sur le chargement du journal |
| 4 | **Aucun choix d'année pour les rapports statistiques.** Les endpoints acceptent `?annee=`, mais les deux cartes appellent l'URL nue : l'utilisateur ne peut pas exporter le rapport d'une année précise |
| 5 | **Aucun indicateur de progression** sur des exports potentiellement longs (jusqu'à 693 paroisses) |
| 6 | Un `PAROISSE` voit les cinq cartes d'export, y compris « Toutes les paroisses » — l'intitulé promet le national, le fichier ne contiendra que sa paroisse |

---

### 7.8 Récapitulatif — état des sept parcours

| # | Parcours | État | Réserve principale |
|:--:|---|---|---|
| 1 | Connexion et première utilisation | ✅ **Complet** | `force_password_change` contournable par navigation directe |
| 2 | Recherche et consultation d'une paroisse | ✅ **Complet** | Recherche sensible aux accents, plafonds fixes sans pagination |
| 3 | Filtres et couches cartographiques | 🟡 **Partiel** | Pas de choroplèthe ; `grades`, `status`, `year`, `minCommun` déclarés mais sans contrôle |
| 4 | Ajout/modification d'une paroisse | 🟡 **Partiel** | Altitude jamais enregistrée ; erreurs de rattachement avalées ; messages `400` peu exploitables |
| 5 | Import de données en masse | ❌ **Absent de l'UI** | Backend Excel prêt mais aucun écran. **Word inexistant partout** |
| 6 | Statistiques et évaluations synodales | 🟡 **Partiel** | Statistiques présentes. **Aucune évaluation synodale** ; validation non exposée |
| 7 | Export de données et rapports | ✅ **Complet** | Toast de succès affiché avant la réponse serveur ; pas de choix d'année |

---

## 8. Messages d'erreur, validations et cas limites

> Inventaire exhaustif des messages qu'un utilisateur peut rencontrer, extraits du code.
> Chaque entrée indique **où** la règle est appliquée : `client` (avant tout appel réseau), `serveur`, ou `les deux`.
>
> Les cas limites **non gérés** sont regroupés en [§8.11](#811-cas-limites-non-gérés).

### 8.1 Authentification et mots de passe

#### Connexion — `POST /api/auth/login/`

| Message | Statut | Où | Déclencheur |
|---|:--:|:--:|---|
| « Email et mot de passe requis. » | `400` | serveur | Champ vide après `.strip()` |
| « Identifiants incorrects. » | `401` | serveur | Échec sur le nom d'utilisateur **puis** sur l'e-mail — la vue tente les deux |
| « Ce compte est désactivé. Contactez l'administrateur. » | `403` | serveur | `is_active = False` — message distinct, l'utilisateur sait que son compte existe |
| « Erreur de sécurité. Rechargez la page et réessayez. » | — | client | `GET /api/auth/csrf/` n'a rien renvoyé |
| « Erreur réseau. Vérifiez votre connexion. » | — | client | `fetch` rejeté |
| *Throttle* | `429` | serveur | **5 tentatives/minute par IP** (`LoginRateThrottle`) |

Toute erreur déclenche en plus une **animation de tremblement de 600 ms** sur le formulaire.

#### Inscription visiteur — `POST /api/visitor/register/`

| Message | Statut | Où |
|---|:--:|:--:|
| « Veuillez renseigner votre prénom et votre nom. » | — | client seul |
| « Le mot de passe doit contenir au moins 8 caractères. » | `400` | **les deux** |
| « Les mots de passe ne correspondent pas. » | — | client seul *(le serveur ne reçoit pas la confirmation)* |
| « Email et mot de passe requis. » | `400` | serveur |
| « Un compte avec cet email existe déjà. » | `400` | serveur — comparaison `email__iexact` |
| *Throttle* | `429` | serveur — **30 inscriptions/heure par IP** |

**Cas limite géré** : si le préfixe de l'e-mail produit un nom d'utilisateur déjà pris, un compteur est suffixé jusqu'à trouver un nom libre (`jean`, `jean1`, `jean2`…).

**Cas limite géré** : l'e-mail de bienvenue part en `fail_silently` — une panne SMTP ne fait pas échouer l'inscription.

#### Changement de mot de passe — `POST /api/auth/change-password/`

| Message | Statut | Où |
|---|:--:|:--:|
| « Le mot de passe doit contenir au moins 12 caractères. » | `400` | **les deux** |
| « Les mots de passe ne correspondent pas. » | `400` | **les deux** |
| « Mot de passe actuel incorrect. » | `400` | serveur |
| « Mot de passe modifié avec succès. » | `200` | serveur — puis redirection client vers `/admin` après **2,5 s** |

**Cas limite géré** : `update_session_auth_hash()` est appelé après le changement — la session reste valide, l'utilisateur n'est pas déconnecté.

#### Mot de passe oublié — `POST /api/auth/password-reset/`

| Message | Statut | Où |
|---|:--:|:--:|
| « Email requis. » | `400` | serveur |
| « Si cet email est associé à un compte, un nouveau mot de passe vient de vous être envoyé. » | `200` | serveur |
| *Throttle* | `429` | serveur — **5 demandes/heure par IP** |

**Cas limite géré — énumération de comptes** : la réponse est **volontairement neutre**. Qu'un compte existe ou non, le même message est renvoyé : impossible de découvrir les adresses enregistrées.

#### Confirmation par lien — `POST /api/auth/password-reset/confirm/`

| Message | Statut |
|---|:--:|
| « Tous les champs sont requis. » | `400` |
| « Les mots de passe ne correspondent pas. » | `400` |
| « Le mot de passe doit contenir au moins 12 caractères. » | `400` |
| « Lien invalide ou expiré. » | `400` — l'`uid` ne se décode pas ou ne correspond à aucun compte |
| « Lien invalide ou expiré (plus d'1 heure). » | `400` — le token est refusé par `default_token_generator` |
| « Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter. » | `200` |

Côté client, le repli est « Lien invalide ou expiré. Recommencez la procédure. »

> ⚠️ **Les validateurs de mot de passe Django ne sont jamais appliqués.** `AUTH_PASSWORD_VALIDATORS` déclare `UserAttributeSimilarityValidator`, `MinimumLengthValidator (12)`, `CommonPasswordValidator` et `NumericPasswordValidator`, mais **`validate_password()` n'est appelé nulle part** dans les vues API. Les quatre points d'entrée (`register`, `change-password`, `password-reset/confirm`, `reset-password` admin) se contentent d'un test de longueur écrit à la main. Conséquence concrète : `123456789012` (douze chiffres) est accepté partout, et `password1234` aussi. Les validateurs ne s'appliquent qu'au `/django-admin/`.
>
> **Seuils incohérents** : 8 caractères à l'inscription visiteur, 12 pour tout le reste.

### 8.2 CSRF et session

| Situation | Comportement |
|---|---|
| Cookie CSRF régénéré pendant que l'onglet reste ouvert | `getCsrf()` relit **toujours** le cookie `eec_csrftoken` en priorité avant de retomber sur le cache mémoire |
| Token en cache rejeté | Une **seule** tentative de rafraîchissement automatique, puis l'erreur remonte à l'appelant |
| Déconnexion | `logout()` est centralisé dans `lib/api.ts`. Le code documente le bug corrigé : trois barres latérales appelaient une URL relative **sans jeton CSRF**, ce qui échouait silencieusement côté serveur — la session n'était jamais détruite — tout en redirigeant vers `/login` |
| Échec de l'appel de déconnexion | `finally` redirige vers `/login` quoi qu'il arrive |
| `401` / `403` sur `/api/auth/me/` | `AdminGuard` redirige vers `/login` ; `RoleGuard` fait de même |
| **Panne réseau** sur `/api/auth/me/` | **Aucune redirection** — choix explicite : « une panne réseau ou une lenteur transitoire ne doit jamais le faire sortir de son espace admin » |
| Retour navigateur depuis le bfcache sur `/carte` | Un écouteur `pageshow` revérifie la session — évite d'afficher un compte déconnecté ailleurs |

### 8.3 Coordonnées GPS

C'est le domaine le plus finement validé, avec **quatre niveaux** de contrôle.

#### Niveau 1 — Paire indissociable

| Message | Où | Contexte |
|---|:--:|---|
| « Renseignez la latitude ET la longitude, ou laissez les deux vides. » | client | Formulaires paroisse et œuvre |
| « Latitude et longitude doivent être envoyées ensemble. » | serveur `400` | `ParoisseViewSet.update()` |
| « Fournir latitude ET longitude ensemble. » | serveur `400` | `OeuvreWriteSerializer.validate()` |
| « Il faut fournir latitude ET longitude (ou aucune des deux). » | serveur `400` | `ParoisseWriteSerializer` |

**Pourquoi** : le sérialiseur ne construit un `Point` que si les deux coordonnées sont présentes. Une coordonnée isolée serait **silencieusement ignorée** — la validation transforme un échec invisible en message clair.

#### Niveau 2 — Absence vs. effacement explicite

`ParoisseWriteSerializer.validate()` raisonne sur les **clés reçues**, pas sur leurs valeurs :

| Requête | Effet |
|---|---|
| Aucune clé GPS | La position n'est pas touchée |
| `latitude: null` **et** `longitude: null` | Effacement **explicitement demandé** |
| Une seule des deux clés | `400` |

> Le commentaire documente le bug corrigé : la version précédente testait `lat is None`, ce qui ne distinguait pas « coordonnée absente de la requête » de « coordonnée envoyée à null ». **Renommer une paroisse effaçait donc sa position, silencieusement.**

#### Niveau 3 — Bornes géographiques

| Message | Statut | Contexte |
|---|:--:|---|
| « Coordonnées de {départ\|destination} invalides (latitude/longitude hors bornes). » | `400` | Calcul d'itinéraire — bornes mondiales `[-90, 90]` × `[-180, 180]` |
| « Escale {i} hors bornes (latitude/longitude). » | `400` | Idem, par escale |
| « Coordonnées GPS invalides. » | `400` | Autres points d'entrée |
| « Paramètres lat et lng requis (nombres décimaux). » | `400` | `GET /api/visitor/paroisses/plus-proche/` |

#### Niveau 4 — Bounding box du Cameroun (imports uniquement)

`CAM_LAT_MIN/MAX = 1.7 / 13.1` · `CAM_LON_MIN/MAX = 8.5 / 16.2`.

`_parse_gps()` accepte la virgule décimale (`3,8480`) autant que le point, et retourne un `Point` **seulement** si les coordonnées tombent dans la boîte.

> ⚠️ **Hors de la boîte, la fonction renvoie `None` sans rien signaler.** La ligne est importée **sans position**, et aucune erreur n'apparaît dans le rapport d'import. Une colonne latitude/longitude inversée passe donc totalement inaperçue : la paroisse est créée, simplement dépourvue de GPS.

#### Cas limite : géolocalisation du navigateur

| Message | Déclencheur |
|---|---|
| « La géolocalisation n'est pas disponible sur cet appareil. » | `navigator.geolocation` absent |
| « Impossible d'obtenir votre position GPS. » | Permission refusée, ou échec du capteur |

### 8.4 Permissions refusées

#### Refus liés au rôle

| Message | Statut | Endpoint |
|---|:--:|---|
| « Seul l'administrateur général peut créer une paroisse. » | `403` | `POST /api/geo/paroisses/` |
| « Seul l'administrateur général peut supprimer une paroisse. » | `403` | `DELETE /api/geo/paroisses/{id}/` |
| « Un administrateur régional ne peut pas modifier une paroisse. » | `403` | `PATCH /api/geo/paroisses/{id}/` |
| « Seul l'administrateur général peut supprimer une œuvre. » | `403` | `DELETE /api/oeuvres/oeuvres/{id}/` |
| « Seul l'administrateur général peut supprimer un ouvrier. » | `403` | `DELETE /api/ouvriers/ouvriers/{id}/` |
| « Seul l'administrateur national peut supprimer des statistiques. » | `403` | `DELETE /api/statistiques/{id}/` |
| « Seul l'administrateur national peut supprimer un compte. » | `403` | `DELETE /api/auth/users/{pk}/` |
| « Seul l'administrateur général peut importer des données. » / « Permission refusée. » | `403` | Les trois `/api/imports/*` |
| « Cette opération n'est pas autorisée. » | `403` | Suppression d'un compte `SUPER`, ou de son propre compte |
| *(corps vide)* | `403` | `_can_write_*` en échec — **aucun message** |

#### Refus liés au périmètre

| Message | Statut | Contexte |
|---|:--:|---|
| « Cette paroisse n'est pas dans votre région : vous ne pouvez créer un ouvrier que dans votre zone. » | `403` | Création d'ouvrier |
| « Cette paroisse n'est pas dans votre district : … » | `403` | Idem |
| « Réaffectation refusée : paroisse hors de votre région. » | `403` | Modification d'ouvrier |
| « Réaffectation refusée : paroisse hors de votre district. » | `403` | Idem |
| « Cette région n'est pas la vôtre. » | `403` | Création d'œuvre |
| « Ce district n'est pas dans votre région. » | `403` | Création d'œuvre / de compte |
| « Cette paroisse n'est pas dans votre région. » / « … district. » / « … la vôtre. » | `403` | Création d'œuvre |
| « Un admin de district ne peut pas créer d'œuvre régionale. » | `403` | Création d'œuvre |
| « Un admin paroissial ne peut créer que des œuvres de sa paroisse. » | `403` | Création d'œuvre |
| « Seul l'administrateur général peut créer une œuvre nationale. » | `403` | Œuvre sans rattachement |

#### Champs non modifiables

> « **Champs non modifiables pour votre rôle : ['categorie', 'latitude']. Autorisés : ['en_prospection', 'nom'].** » — `400`

Ce message **énumère les champs refusés et les champs permis**, ce qui en fait le plus actionnable de tout le système. Il s'applique aux paroisses et aux œuvres.

### 8.5 Gestion des comptes

| Message | Où |
|---|---|
| « Prénom, nom et email sont obligatoires. » | client |
| « Un compte visiteur ne se crée pas ici (inscription publique uniquement). » | serveur |
| « Rôle inconnu. » | serveur |
| « Un administrateur régional ne peut créer que des administrateurs de District. » | serveur |
| « Un admin de district ne peut créer que des admins Paroisse. » | serveur |
| « Un administrateur paroissial ne peut créer aucun compte. » | serveur |
| « Un admin régional doit être rattaché à une région. » | serveur |
| « Un admin de district doit être rattaché à un district. » | serveur |
| « Un admin paroissial doit être rattaché à une paroisse. » | serveur |
| « La région « X » a déjà son administrateur (1 seul autorisé). » | serveur |
| « Le district « X » a déjà son administrateur (1 seul autorisé). » | serveur |
| « La paroisse « X » a déjà son administrateur (1 seul autorisé). » | serveur |
| « Le mot de passe doit contenir au moins 12 caractères. » | serveur — réinitialisation par un admin |
| « Compte créé — un e-mail avec le mot de passe a été envoyé. » | toast client |

**Cas limite géré** : la contrainte « un seul admin par zone » ne compte que les comptes **actifs** (`is_active=True`) — un admin désactivé ne bloque pas la création de son remplaçant.

**Cas limite géré** : `toggle-active` refuse que l'utilisateur se désactive lui-même (`target == user`).

**Cas limite géré** : à la suppression d'un compte, les entrées de journal déjà écrites passent en `utilisateur = NULL` (`SET_NULL`) — la trace survit au compte.

### 8.6 Doublons et contraintes d'unicité

#### Contraintes réellement déclarées

| Modèle | Contrainte |
|---|---|
| `RegionSynodale` | `nom` **unique**, `code` unique |
| `District` | `code` unique — **`nom` non unique** |
| `Paroisse` | `code` unique — **`nom` non unique** |
| `Grade` | `nom` unique |
| `TypeOeuvre` | `nom` unique |
| `StatistiqueAnnuelle` | **`unique_together (paroisse, annee)`** |
| `Itineraire` | `unique_together (paroisse_depart, paroisse_arrivee)` |
| `ParoisseEnregistree` | `unique_together (utilisateur, paroisse)` |
| `FavoriCarte` | `unique_together (utilisateur, type_entite, entite_id)` |

#### Messages de doublon

| Message | Contexte |
|---|---|
| « Cette paroisse est déjà dans vos favoris. » | `POST /api/visitor/favoris/` — cas explicitement géré |
| « Un compte avec cet email existe déjà. » | Inscription visiteur |
| « La région/le district/la paroisse « X » a déjà son administrateur (1 seul autorisé). » | Création de compte admin |

> ⚠️ **Aucun contrôle de doublon sur les paroisses, les œuvres et les ouvriers.** Ni le modèle, ni le sérialiseur, ni la vue ne vérifient qu'une paroisse du même nom existe déjà dans le même district. `POST /api/geo/paroisses/` avec un nom identique crée un **second enregistrement**, sans avertissement.
>
> Seul l'**import Excel** déduplique, via `get_or_create(nom__iexact=…, district=…)` : une paroisse déjà présente est **mise à jour** au lieu d'être recréée, et seulement sur les champs encore vides (`adresse`, `position`) plus la catégorie si elle diffère. L'interface de saisie manuelle n'a pas cet égard.

> ⚠️ **Doublon de statistique** : `unique_together (paroisse, annee)` produit un `UniqueTogetherValidator` DRF, dont l'erreur arrive en `non_field_errors` — **sans clé `detail`**. Le client affiche donc « **Erreur 400** ». Le scénario est atteignable : si le `GET` des statistiques existantes échoue (il est en `.catch(() => {})`), `statId` reste `null`, le formulaire tente un `POST` au lieu d'un `PATCH`, et l'utilisateur reçoit un message incompréhensible.

### 8.7 Import de fichiers Excel

> Rappel : ces validations sont **inatteignables depuis l'interface** — aucun écran d'import n'existe (voir §7.5). Elles ne se déclenchent qu'en appelant l'API directement.

#### Refus du fichier entier

| Message | Statut |
|---|:--:|
| « Permission refusée. » / « Seul l'administrateur général peut importer des données. » | `403` |
| « Champ 'file' manquant. » | `400` |
| « Format non supporté. Utilisez .xlsx » | `400` |
| « Fichier trop volumineux (10 Mo maximum). » | `400` |
| « Impossible de lire le fichier : {détail de l'exception} » | `400` |

#### Erreurs ligne à ligne

Chaque ligne fautive est **ignorée** — l'import continue — et consignée dans un tableau `{"ligne": n, "erreur": "…"}` :

| Erreur | Import concerné |
|---|---|
| « Nom de paroisse vide (colonne D obligatoire) » | paroisses |
| « Région synodiale vide (colonne B obligatoire) » | paroisses |
| « Région 'X' introuvable en base » | paroisses |
| « Région 'X' hors de votre périmètre » | paroisses |
| « District 'X' introuvable dans la région 'Y' » | paroisses |
| « Aucun district trouvé dans la région 'X' » | paroisses |
| « District hors de votre périmètre » | paroisses |
| « Nom d'œuvre vide » | œuvres |
| « Type 'X' invalide. Valeurs acceptées : AGROPASTORALE, AUTRE, IMMEUBLE, … » | œuvres |
| « Type 'X' introuvable en base » | œuvres |
| « Renseigner Paroisse, District ou Région » | œuvres |
| « Paroisse 'X' introuvable » · « District 'X' introuvable » · « Région 'X' introuvable » | œuvres |
| « Paroisse hors de votre scope » / « … scope district » / « … scope régional » | œuvres, ouvriers |
| « Nom vide » · « Prénom vide » · « Paroisse vide » | ouvriers |
| « Sexe 'X' invalide (M ou F) » | ouvriers |

#### Rapport renvoyé

```json
{ "created": 12, "updated": 3, "errors_count": 5,
  "errors": [ … 50 premières … ],
  "total_lignes": 20, "preview": [ … 100 premières lignes … ] }
```

**Cas limites gérés** : les erreurs sont **plafonnées à 50** et l'aperçu à 100 lignes ; l'import est journalisé avec son bilan (`« Import paroisses — 12 créées, 3 mises à jour, 5 erreurs »`) ; les colonnes F et G créent ou mettent à jour la statistique annuelle de l'année courante.

> **Faute de frappe** : « Région **synodiale** » — la même que dans le formulaire paroisse du frontend.

### 8.8 Upload d'images

| Message | Statut | Contexte |
|---|:--:|---|
| « Champ 'file' manquant. » | `400` | Avatar |
| « Image trop volumineuse (5 Mo maximum). » | `400` | Avatar |
| « Fichier image invalide. » | `400` | Avatar — `Image.verify()` de Pillow |
| « Aucune image fournie (champ 'images'). » | `400` | Actualités |
| « « photo.png » dépasse 5 Mo. » | `400` | Actualités — **nomme le fichier fautif** |
| « « photo.png » n'est pas une image valide. » | `400` | Actualités |

**Cas limites gérés** : `Image.verify()` consomme le flux, la vue le rouvre explicitement ensuite ; l'ancien avatar est supprimé du disque avant écriture du nouveau ; l'avatar est redimensionné à 512×512 et converti en JPEG, les images d'actualité à 1600×1600 ; la suppression d'une actualité efface aussi ses fichiers image.

### 8.9 Itinéraires et calcul d'itinéraire

| Message | Statut | Où |
|---|:--:|:--:|
| « Choisissez d'abord un point de départ (A) : la cible utilise votre position GPS, le repère vous laisse cliquer un point sur la carte. » | — | client |
| « Choisissez une destination (B) : tapez le nom d'une paroisse ou d'une œuvre dans le champ B. » | — | client |
| « start_lat, start_lng, end_lat, end_lng sont requis (nombres). » | `400` | serveur |
| « etapes doit être une liste de points. » | `400` | serveur |
| « Escale {i} invalide (lat/lng attendus). » | `400` | serveur |
| « 8 escales au maximum. » | `400` | serveur |
| « arrivee_paroisse_id est requis. » | `400` | serveur |
| « Fournir soit depart_paroisse_id, soit depart_lat + depart_lng. » | `400` | serveur |
| « depart_lat et depart_lng doivent être des nombres. » | `400` | serveur |
| « Paroisse de départ/destination introuvable. » | `404` | serveur |
| « La paroisse de départ/destination n'a pas de coordonnées GPS. » | `400` | serveur |
| « Service de calcul momentanément indisponible — tracé à vol d'oiseau, la durée est indicative. » | — | client |
| « Calcul d'itinéraire impossible. » | — | client, repli |
| « Erreur réseau pendant le calcul. » | — | client |

**Cas limites remarquablement gérés :**

- **Le repli est annoncé.** Quand le service de routage échoue, le backend renvoie une ligne droite avec `provider: "direct"`, et le frontend **le dit** : « sinon l'utilisateur prend une distance à vol d'oiseau pour un vrai temps de trajet ».
- **Distance excessive anticipée.** Valhalla refuse au-delà de 200 km sur les profils non motorisés. Plutôt que d'attendre le refus, le code teste d'abord la distance **à vol d'oiseau** — toujours inférieure à la distance routière, donc jamais de rejet à tort — ce qui économise 2,7 s par calcul sur les longs trajets.
- **Bouton d'ajout d'étape masqué** au-delà de 8 escales, la constante frontend étant explicitement alignée sur celle du backend.
- **Escales vides ignorées** : un champ d'étape non renseigné est écarté au lieu de faire échouer tout le calcul.
- **`0` est un index valide.** Le type `PickTarget` mélange `'start' | 'end' | number` ; le code compare partout explicitement à `null`, car un test de véracité avalerait la première escale.
- **Le tracé n'est pas effacé pendant un recalcul** — au changement de mode, l'ancien reste affiché au lieu de clignoter.

### 8.10 États vides de l'interface

| Écran | Message |
|---|---|
| Carte — recherche | « Aucun résultat pour « **terme** ». » |
| Carte — liste longue | « + N autres résultats. Affinez la recherche. » *(au-delà de 80)* |
| Carte — fiche paroisse | « Aucune statistique enregistrée. » · « Aucun ouvrier enregistré pour cette paroisse. » |
| Carte — favoris | « Aucun favori pour le moment. » + « Ouvrez une église ou une œuvre, puis touchez l'étoile ⭐ pour l'enregistrer. » |
| Carte — historique | « Aucun élément consulté pour le moment. » |
| Admin — listes | « Aucune paroisse/région/district/actualité trouvé(e) » · « Aucun compte trouvé » · « Aucun ouvrier trouvé » |
| Admin — journal | « Aucune entrée trouvée » · « Aucun détail disponible. » |
| Admin — statistiques | « Aucune donnée disponible. » · « Aucune consultation enregistrée. » · « Aucun favori enregistré. » · « Aucun itinéraire enregistré. » |
| Admin — import/export | « Aucun export enregistré » |
| Admin — tableau de bord | « Aucune activité enregistrée » · « Aucune statistique pour {année} » |
| Admin — fiche paroisse | « Aucune coordonnée GPS enregistrée pour cette paroisse. » · « Aucune paroisse rattachée à ce compte » |
| Admin — actualités | « Aucune image — l'actualité s'affichera en texte seul. » |

Les toasts d'échec de chargement suivent un modèle constant : « Erreur de chargement des paroisses / œuvres / ouvriers / comptes / actualités », « Erreur lors du chargement des districts ».

### 8.11 Cas limites **non** gérés

| # | Cas | Conséquence pour l'utilisateur |
|:--:|---|---|
| 1 | **Les validateurs de mot de passe Django ne sont jamais invoqués** (§8.1) | `123456789012` est accepté sur les quatre points d'entrée |
| 2 | **Aucun contrôle de doublon** sur paroisses, œuvres et ouvriers (§8.6) | Deux paroisses homonymes dans le même district, sans avertissement |
| 3 | **Erreurs DRF par champ invisibles.** `lib/api.ts` fait `throw new Error(err.detail \|\| 'Erreur ' + status)` | Toute erreur `400` sans clé `detail` — validations de sérialiseur, `unique_together` — devient « **Erreur 400** », sans nommer le champ fautif |
| 4 | **`403` sans corps.** Les échecs de `_can_write_*` renvoient `Response(status=403)` **sans message** | L'utilisateur voit « Erreur 403 », sans savoir que c'est une question de périmètre |
| 5 | **Coordonnées hors bounding box silencieusement ignorées à l'import** (§8.3) | Colonnes latitude/longitude inversées → paroisses créées sans GPS, aucune erreur signalée |
| 6 | **Le champ Altitude n'est jamais enregistré** | Saisi, affiché en récapitulatif, absent des payloads — perdu à la fermeture |
| 7 | **Rattachements d'ouvriers et d'œuvres en `Promise.allSettled`** | Un échec est invisible, l'enregistrement s'annonce réussi |
| 8 | **Toast d'export affiché avant la réponse** | Un `403` ou un throttle produit le même « Export lancé » |
| 9 | **Chargements en `.catch(() => {})`** — page Statistiques, statistiques du formulaire paroisse, historique des exports | L'écran reste bloqué sur « Chargement… », sans message ni possibilité de réessayer |
| 10 | **Throttles `429` non traités côté client** | Au-delà de 5 connexions/min ou 20 exports/min, le message affiché est le `detail` brut de DRF, en anglais |
| 11 | **Recherche sensible aux accents et à la casse partielle** | « Yaounde » ne trouve pas « Yaoundé » — aucune normalisation |
| 12 | **`force_password_change` non revérifié après le login** | Un compte concerné peut naviguer directement vers `/admin/dashboard` et contourner l'écran obligatoire |
| 13 | **Bouton « Excel » de la page Districts** | Affiche « Export Excel — fonctionnalité à venir. » alors qu'aucun endpoint d'export de districts n'existe |
| 14 | **Aucun indicateur de progression** sur les exports (jusqu'à 693 paroisses) ni les imports | L'utilisateur ne sait pas si le traitement avance |

### 8.12 Cas limites particulièrement bien traités

Ces protections méritent d'être signalées, car elles répondent à des bugs réels documentés dans le code.

| Cas | Traitement |
|---|---|
| **Renommer une paroisse effaçait son GPS** | Le sérialiseur raisonne désormais sur les **clés reçues**, distinguant « absent » de « null » (§8.3) |
| **Statistiques imputées à une année jamais recensée** | Le formulaire lit l'année de référence auprès du serveur au lieu d'utiliser `new Date().getFullYear()` |
| **Injection de formule Excel (OWASP)** | Toute valeur texte commençant par `=`, `+`, `-`, `@` est préfixée d'une apostrophe à l'export — les champs sont éditables par des comptes de bas niveau et relus par des comptes supérieurs |
| **Open redirect sur `?next=`** | Seul un chemin interne relatif (`/^\/(?!\/)/`) est suivi ; `//evil.com` est ignoré |
| **Énumération de comptes** | Réponse neutre sur le mot de passe oublié (§8.1) |
| **Escalade de privilèges par `PATCH`** | `role`, `region`, `district`, `paroisse`, `permissions_custom`, `is_active` en lecture seule sur le sérialiseur générique |
| **Suppression bloquée par intégrité** | `409 CONFLICT` avec le décompte exact — « cette paroisse a encore 3 ouvrier(s) affecté(s) et 2 œuvre(s) rattachée(s). Réaffectez-les avant de la supprimer. » — au lieu d'une erreur de base brute |
| **Réponse lente qui écrase une plus récente** | Drapeau d'annulation dans la fiche paroisse de la carte : changer rapidement d'entité n'affiche pas les ouvriers de la précédente |
| **Ouvrier réaffecté sans être libéré** | « Impossible : cet ouvrier travaille actuellement à la paroisse « X » (district, région). Retirez-le d'abord (statut « Inoccupé ») avant de le réaffecter. » Un ouvrier inoccupé repasse automatiquement en `OCCUPE` à la réaffectation |
| **Perte silencieuse à la suppression d'une paroisse** | Les statistiques annuelles partent en `CASCADE` ; leur nombre est journalisé avant l'effacement |
| **Déconnexion qui ne déconnectait pas** | `logout()` centralisé avec jeton CSRF — trois barres latérales échouaient silencieusement |
| **Token CSRF périmé dans un onglet resté ouvert** | Relecture systématique du cookie, puis une tentative de rafraîchissement automatique |
| **Panne réseau confondue avec une déconnexion** | Seul un `401`/`403` explicite éjecte l'utilisateur de son espace |
| **PDF indisponible** | « Génération PDF indisponible sur ce serveur. » quand WeasyPrint n'est pas installé, au lieu d'une erreur 500 |

---

## 9. Glossaire métier et technique

> Termes spécifiques à GEOEEC, définis **d'après le contexte du code** — modèles, commentaires, libellés d'interface — et non d'après une connaissance externe de l'EEC. Chaque entrée renvoie à l'endroit où le terme est défini ou utilisé.

### 9.1 Hiérarchie ecclésiale et territoriale

| Terme | Définition d'après le code |
|---|---|
| **EEC** | Église Évangélique du Cameroun. L'institution dont la plateforme cartographie le patrimoine et le personnel |
| **Conseil Synodal Général** (CSG) | Instance de gouvernance de l'EEC. C'est elle qui **décide** de la catégorie de chaque paroisse — résolution n° **R05/CSG** de juillet 2024. Le code insiste : *« Ce n'est pas une statistique calculée : c'est une DÉCISION du Conseil Synodal. Une catégorie erronée est donc une erreur de gouvernance, pas une simple imprécision de données »* |
| **Région synodale** | Plus grande subdivision administrative de l'EEC — **22** au total. Porte un polygone (`MultiPolygonField`). Immuable via l'API. Attention à la faute de frappe « Région **synodiale** », présente à la fois dans le formulaire paroisse du frontend et dans les messages d'erreur d'import |
| **District** | Subdivision d'une région synodale — **≈134-137** (les deux chiffres coexistent dans le code). Porte un polygone. Immuable via l'API, *« le nombre de districts est FIXE »* |
| **Paroisse** | Lieu de culte géolocalisé — **≈693**, dont 255 sans GPS à l'origine. Entité centrale du projet, seule à porter un `PointField` obligatoire dans son usage |
| **District « NON PRÉCISÉ »** | District **technique**, pas géographique : réceptacle des paroisses dont le district réel est inconnu. Explicitement exclu des listes et de tous les compteurs (`.exclude(nom="NON PRÉCISÉ")`) |
| **Scope** / **périmètre** | Zone d'autorité d'un compte administrateur, déduite de son rôle et de son rattachement. Matérialisé par les fonctions `filter_*_by_scope` et affiché par `get_scope_label()` : « National », « Région Mifi », « District X », ou le nom de la paroisse |

### 9.2 Catégorisation des paroisses

| Terme | Définition d'après le code |
|---|---|
| **Catégorie** | Classement officiel d'une paroisse sur **neuf niveaux**, de `A++` (la plus grande) à `C1` (la plus petite). Champ `Paroisse.categorie`. Décision du Conseil Synodal, jamais un calcul de la plateforme |
| **Ordre de présentation** | `A++, A1, A2, B1, B2, C1, C2, C3, C4` — l'ordre retenu par l'EEC dans ses documents. **Ce n'est pas un ordre d'importance** |
| **`CATEGORIES_RANG`** | Le rang **réel** d'importance, de 1 à 9 : `C1 < C2 < C3 < C4 < B1 < B2 < A1 < A2 < A++`. Le code signale le piège : *« le chiffre CROÎT avec l'importance à l'intérieur de chaque lettre. C1 est la plus PETITE catégorie, pas la plus grande, et A2 passe devant A1 »* |
| **Note globale** | Entier de 1 à 9 = **poids économique** + **poids démographique**, dont découle la catégorie. Correspondance vérifiée déterministe sur 753 lignes : note 1 → C1 … note 9 → A++ |
| **Poids économique** | Contribution de la **cible d'offrande** à la note globale |
| **Poids démographique** | Contribution de l'**effectif de fidèles** à la note globale. L'effectif moyen suit exactement le rang : 135 fidèles en C1, 3 328 en A++ |
| **Cible d'offrande** | Objectif de collecte annuelle **en FCFA**, fixé par le Conseil Synodal. Champ `Paroisse.cible_offrande` (`BigIntegerField`). L'une des deux entrées du calcul de catégorie |
| **Appariement strict** | Méthode d'import des catégories : correspondance **uniquement** sur nom exact normalisé + région concordante, jamais sur ressemblance orthographique. Le code documente pourquoi : `difflib` rapprochait « Ngoulmekong I » de « NGOULMEKONG II » (0,96) et « Bamendou » de « Bamendjou » (0,94) — *« Deux localités distinctes se ressemblent plus que deux orthographes de la même »*. Les non-appariées gardent `categorie = NULL` et s'affichent « — », car *« une case vide est corrigeable, une catégorie fausse ne se voit pas »* |

### 9.3 Évaluation synodale

> **Correction d'un constat antérieur.** En §7.6 j'écrivais que le terme n'apparaît nulle part dans le code : c'était fondé sur une recherche limitée au frontend. Le terme **existe bien côté backend**, dans les commandes d'import. Ce qui reste exact : aucune entité `EvaluationSynodale`, aucun endpoint et aucun écran ne l'exposent.

| Terme | Définition d'après le code |
|---|---|
| **Évaluation synodale** | Campagne de recensement conduite par le Conseil Synodal, source du document « Catégorisation paroisses EEC 050826.docx ». Importée par la commande `import_evaluation`. Fournit **deux grandeurs** : la cible d'offrande et un effectif global de fidèles |
| **Matrice d'évaluation** | Le tableau du document source : neuf colonnes, dont le nom de la paroisse, la cible d'offrande et l'effectif. C'est de là que sortent les poids économique et démographique |
| **Enquête de terrain 2025** vs. **Évaluation synodale 2026** | **Deux campagnes distinctes, jamais deux versions d'une même mesure.** Le code est catégorique : sur 265 paroisses appariées, *« les 265 différaient — dans les deux sens, parfois du simple au triple »*. L'enquête de terrain ventile communiants / non-communiants ; l'évaluation synodale donne un effectif global sans ventilation |
| **Coexistence des séries** | Plutôt que d'écraser une source par l'autre — ce qui *« détruirait une source sans possibilité de retour »* — l'évaluation est enregistrée sur une **année différente**, ce que permet la clé unique `(paroisse, annee)`. `Paroisse.nombre_fideles` est recalculé sur l'année la plus récente disponible |
| **`total_declare`** | Effectif **global** d'une `StatistiqueAnnuelle`, sans ventilation. C'est le champ où atterrit l'évaluation synodale, précisément parce que la source ne ventile pas — et *« l'inventer serait fabriquer de la donnée »*. Prime sur la somme communiants + non-communiants dans le calcul de `total_fideles` |

### 9.4 Effectifs et statistiques

| Terme | Définition d'après le code |
|---|---|
| **Fidèle** | Membre d'une paroisse. Deux façons de le compter : par **ventilation** (communiants + non-communiants) ou par **total déclaré** |
| **Communiant** | Fidèle admis à la communion. Champ `StatistiqueAnnuelle.communiants` |
| **Non-communiant** | Fidèle non encore admis à la communion. Champ `non_communiants` |
| **Ventilation** | La répartition communiants / non-communiants. Quand elle est saisie, elle **prime** et efface tout `total_declare` antérieur — sans quoi l'ancien total continuerait de primer et la ventilation n'aurait aucun effet visible |
| **`total_fideles`** | Champ calculé du sérialiseur : `total_declare` s'il existe, sinon `communiants + non_communiants` |
| **Statistique annuelle** | Déclaration d'une paroisse pour une année. Unique par couple `(paroisse, annee)`. Porte aussi baptêmes, confirmations, mariages, décès, offrandes et dîmes |
| **Validée** | Booléen marquant qu'une déclaration paroissiale a été approuvée par le niveau supérieur. Seul mécanisme d'approbation hiérarchique du système — **non exposé dans l'interface** (voir §7.6) |
| **Année de référence** | La plus récente année **réellement présente en base**, lue via `/api/auth/dashboard-stats/`. À ne pas confondre avec l'année civile : écrire sur `new Date().getFullYear()` créait des statistiques pour une année jamais recensée |

### 9.5 Ouvriers et grades

| Terme | Définition d'après le code |
|---|---|
| **Ouvrier** | Membre du personnel ecclésiastique affecté à une paroisse. Le terme couvre tous les grades, du pasteur à l'aide-évangéliste |
| **Grade** | Rang ecclésiastique. *« Données FIXES définies par les statuts de l'EEC »*, codées en dur dans `import_grades` plutôt qu'importées d'un fichier |
| **Niveau** | Position hiérarchique du grade, **1 = le plus haut**. Sert au code couleur de la liste des ouvriers dans l'admin |
| **Occupé / Inoccupé** | Les **deux seuls** statuts d'un ouvrier. `OCCUPE` = affecté et en service ; `INOCCUPE` = retiré, disponible. Passer par `INOCCUPE` est le *« préalable obligatoire à toute réaffectation »* — un ouvrier occupé ne peut pas être déplacé directement |
| **Affectation** | Le rattachement d'un ouvrier à une paroisse. Distingué de l'**identité** : hors `SUPER`, un admin ne peut modifier que l'affectation (`OuvrierAffectationSerializer`), jamais le nom, le prénom ou le grade |
| **Délégation pastorale** | Responsabilité pastorale confiée à un agent qui n'est pas encore pasteur de plein exercice. Distingue `Pasteur Proposant` de `Pasteur Proposant avec Délégation Pastorale`, et `Évangéliste` de `Évangéliste avec Délégation Pastorale` |

**Les huit grades**, du plus haut au plus bas :

| Niveau | Grade | Abrév. | Définition d'après le commentaire du code |
|:--:|---|---|---|
| 1 | *(vacant)* | — | Portait « Évêque », **grade qui n'existe pas dans l'EEC**. Retiré de la liste et supprimé en base par la migration `0004_supprime_grade_eveque` |
| 2 | Pasteur | `P.` | Agent pastoral principal, responsable d'une paroisse |
| 3 | Pasteur Proposant | `P.P.` | Futur pasteur en cours de formation et de consécration |
| 4 | Pasteur Proposant avec Délégation Pastorale | `P.P.D.P.` | Proposant ayant déjà une responsabilité partielle |
| 5 | Évangéliste | `Ev.` | Agent évangélique, moins de formation théologique qu'un pasteur |
| 6 | Évangéliste avec Délégation Pastorale | `Ev.D.P.` | Évangéliste à responsabilité étendue |
| 7 | Délégué Pastoral | `D.P.` | Délégué **sans ordination**, représentant pastoral |
| 8 | Aide-Évangéliste | `A.Ev.` | Grade le plus bas, agent auxiliaire en formation |

### 9.6 Œuvres et patrimoine

| Terme | Définition d'après le code |
|---|---|
| **Œuvre** | Établissement ou bien appartenant à l'EEC : école, hôpital, ferme, immeuble, terrain. Le patrimoine non cultuel de l'Église |
| **Type d'œuvre** | Table de référence des **7 types officiels**. La couleur porte la *famille*, le glyphe porte le type précis |
| **Rattachement** | Le niveau auquel une œuvre appartient : paroisse, district, région — ou **aucun**. Détermine qui peut la voir et la modifier. Verrouillé en modification pour tous, `SUPER` compris : *« le déplacer reviendrait à la faire changer de main sans trace »* |
| **Œuvre nationale** | Œuvre sans aucun rattachement (les trois clés étrangères nulles). Seul le `SUPER` peut en créer et les voir en gestion |
| **En prospection** | Paroisse ou œuvre *« en cours d'implantation / d'étude »* — un projet, pas encore une réalité de terrain. Booléen `en_prospection` |
| **`est_active`** | Suppression douce (*soft delete*) : désactiver sans effacer |

**Les sept types d'œuvre**, d'après les commentaires du modèle :

| Type | Couvre |
|---|---|
| `SCOLAIRE` | Écoles primaires, collèges, lycées |
| `UNIVERSITAIRE` | Institutions d'enseignement supérieur |
| `MEDICALE` | Hôpitaux, dispensaires, centres de santé |
| `AGROPASTORALE` | Fermes, élevages, cultures |
| `IMMEUBLE` | Bâtiments à usage commercial ou résidentiel |
| `TERRAIN` | Parcelles sans construction |
| `AUTRE` | Le reste |

### 9.7 Vocabulaire cartographique

| Terme | Définition d'après le code |
|---|---|
| **Choroplèthe** | Technique consistant à colorer des zones selon une valeur statistique. Le terme apparaît en commentaire dans `viz-palette.ts`, **mais aucune choroplèthe n'est implémentée** : les régions reçoivent une couleur catégorielle par index, qui signale l'appartenance et non une quantité |
| **Symbole proportionnel** | L'encodage réellement utilisé pour les quantités : la **taille** du marqueur porte l'effectif de fidèles. Le rayon croît en **racine carrée** de la valeur, *« pour que l'aire, elle, soit proportionnelle à l'effectif »* — un rayon proportionnel exagérerait massivement les grandes paroisses. De 22 px à 46 px ; les œuvres, sans effectif, gardent une taille fixe de 26 px |
| **Palette catégorielle** | Couleurs porteuses d'identité, pas de quantité. Réduite à **trois teintes** délibérément : la carte est une forme *« toutes paires »* où n'importe quels deux marqueurs peuvent se toucher, et *« au-delà de trois teintes, une forme toutes paires ne peut plus garantir la distinction »* |
| **Famille** | Les trois regroupements de la palette : **Paroisses** (`#2E9744`, réseau paroissial) · **Services** (`#1565C0`, écoles, universités, structures médicales) · **Patrimoine** (`#AD1457`, agropastoral, immeubles, terrains) |
| **Glyphe** | Le pictogramme au centre d'un marqueur. Il porte le **type précis** là où la couleur ne porte que la famille — croix, toque, croix médicale, livre, feuille, immeuble, champs |
| **CVD** / **ΔE** | Vision déficiente des couleurs (*color vision deficiency*) et écart perceptuel entre deux couleurs. La palette est **mesurée**, pas choisie à l'œil : modèle Machado-Oliveira-Fernandes 2009, plancher ΔE ≥ 8 en deutéranopie et ≥ 15 en vision normale |
| **Cluster** | Regroupement des marqueurs proches en une pastille chiffrée (`leaflet.markercluster`). Rayon 90 px, classe « large » à partir de 30 éléments. Désactivable dans les Paramètres |
| **Spiderfy** | Déploiement en étoile des marqueurs superposés au zoom maximal, quand ils partagent la même position (`spiderfyOnMaxZoom: true`) |
| **POI** | *Point of interest* — repères **externes à l'EEC** issus d'OpenStreetMap : hôpitaux, écoles, pharmacies, banques, stations-service. Apparaissent **progressivement** selon un `minZoom` propre à chaque classe, de 14 à 17 |
| **Découpage synodal** | Nom donné dans l'interface à la couche des contours des 22 régions. Remplissage à **0,03** d'opacité seulement : à 0,07, *« les 22 régions pavent la TOTALITÉ des terres visibles »* et les voiles se cumulaient aux frontières, teintant toute la carte |
| **Marqueur majeur** | Marqueur d'au moins 38 px, soit le tiers supérieur de l'échelle des effectifs. Son étiquette apparaît dès le **zoom 9** au lieu de 13, pour servir de point d'ancrage en vue régionale — sans quoi *« la carte est entièrement muette »* à l'ouverture |
| **Fond de carte** (*basemap*) | Deux options : **vectoriel** OpenFreeMap rendu par MapLibre GL, et **satellite** Esri World Imagery, ce dernier avec une couche séparée de frontières et toponymes |
| **`ST_Simplify`** | Fonction PostGIS réduisant le nombre de sommets des polygones avant envoi, pour alléger le payload des géométries régionales |
| **EPSG:4326 / WGS84** | Système de coordonnées de toutes les géométries : latitude et longitude en degrés, la convention GPS standard |
| **Bounding box Cameroun** | Boîte englobante utilisée pour valider les coordonnées à l'import : latitude `[1.7, 13.1]`, longitude `[8.5, 16.2]` |
| **Piège Coord_x / Coord_y** | Dans les fichiers Excel sources, **les colonnes sont inversées** par rapport à la convention OGC : `Coord_x` contient la **latitude** et `Coord_y` la **longitude**. L'import corrige en construisant `Point(Coord_y, Coord_x)`. Le formulaire admin reprend cette convention à l'écran : « Coord. Y — Latitude », « Coord. X — Longitude » |

### 9.8 Itinéraires

| Terme | Définition d'après le code |
|---|---|
| **Parcours** | Nom de l'onglet du rail où se calcule un itinéraire |
| **Escale** / **étape** | Point intermédiaire entre le départ et l'arrivée. **8 au maximum**, limite alignée entre frontend et backend |
| **Vol d'oiseau** | Distance à ligne droite calculée par la formule de **Haversine**, avec une durée estimée à 60 km/h (moyenne Cameroun). C'est ce que renvoie `/itineraires/calculer/` |
| **Route réelle** | Itinéraire suivant le réseau routier OpenStreetMap via **Valhalla**, avec repli sur **OSRM**. C'est `/itineraires/route/`. Distance et durée réalistes, avec un tracé et des instructions en français |
| **Repli `direct`** | Quand aucun service de routage ne répond, le backend renvoie une ligne droite marquée `provider: "direct"`. Le frontend l'**annonce explicitement**, *« sinon l'utilisateur prend une distance à vol d'oiseau pour un vrai temps de trajet »* |
| **Alternatives** | Distance et durée des **deux autres modes** pour le même trajet, renvoyées dans le même appel — l'interface affiche voiture, moto et à pied côte à côte sans recalcul |
| **Mode** | `auto` (voiture), `moto` — profil scooter avec un facteur de durée de 0,85 — et `pedestrian` (à pied) |
| **Limite des 200 km** | Valhalla refuse les profils non motorisés au-delà. Le code teste d'abord la distance **à vol d'oiseau**, toujours inférieure à la distance routière, ce qui évite un aller-retour réseau inutile de 2,7 s |

### 9.9 Interface d'administration

| Terme | Définition d'après le code |
|---|---|
| **Rail** | La barre verticale d'onglets à gauche de la carte — 10 entrées, de Recherche à Paramètres. Devient un tiroir coulissant sous 600 px |
| **Onglet verrouillé** | Entrée du rail réservée au visiteur connecté (Favoris, Parcours, Historique, Paramètres). **Reste cliquable** en mode public, mais ouvre l'invite de connexion au lieu du panneau |
| **Mode `public` / `visitor`** | Les deux états de la carte. Seul le rôle `VISITEUR` déclenche le mode `visitor` ; un administrateur qui ouvre `/carte` reste en mode `public`, *« sinon la navbar afficherait le nom d'un compte admin sur une page censée être anonyme »* |
| **ScopeBar** | Bandeau rappelant le périmètre de l'administrateur connecté, avec ses compteurs. Décliné en `ScopeBar`, `ScopeBarDistrict`, `ScopeBarParoisse` |
| **AdminMapFrame** | Composant qui **replie** la barre latérale et le bandeau supérieur dès que l'URL se termine par `/map`, pour laisser la surface maximale à la carte |
| **AdminGuard** / **RoleGuard** | Les deux gardes du frontend. La première filtre les rôles admin, la seconde vérifie que le rôle correspond à l'espace ouvert. Aucune des deux ne fait autorité — *« les endpoints backend restent l'autorité réelle »* |
| **Bureau National / Régional / de District / de Paroisse** | Les quatre espaces d'administration, tels que nommés dans les `metadata.title` des layouts |
| **Espace ré-exporté** | Page d'un espace non-`SUPER` qui réutilise littéralement le composant de `(general)` (`export { default } from …`). Le cloisonnement des données vient du backend, pas d'un composant distinct |

### 9.10 Vocabulaire technique du projet

| Terme | Définition d'après le code |
|---|---|
| **Fusion de doublons** | Opération de nettoyage (`fusion_doublons`, `fusion_doublons_oeuvres`, `fusion_doublons_ouvriers`) réparant les lignes créées deux fois par des imports de sources différentes — « Katsela » et « Paroisse de Katsela » |
| **Survivant / absorbé** | Les deux rôles d'une fusion. Le survivant est choisi dans l'ordre : celui qui porte une **catégorie officielle** (elle vient du Conseil Synodal), puis celui qui a un **GPS**, puis le plus complet, puis le plus petit identifiant. Les champs vides du survivant sont comblés par l'absorbé, et les enfants — statistiques, ouvriers, œuvres — lui sont rattachés |
| **Idempotent** | Propriété des commandes d'import : relançables sans créer de doublons, grâce à `update_or_create` / `get_or_create` |
| **`--dry-run`** | Option de simulation des commandes d'import : aucune écriture en base |
| **Normalisation de nom** | Traitement appliqué avant appariement : accents supprimés, casse ignorée, ponctuation réduite, préfixes « Paroisse de » et « EEC » retirés, chiffres romains de fin convertis (`I` → 1, `II` → 2) |
| **`permissions_custom`** | Champ JSON pour des permissions fines par compte, lu par `has_custom_perm()`. **Sans effet réel** : sa seule clé (`peut_supprimer_paroisse`) n'est consultée que par un helper jamais appelé |
| **`force_password_change`** | Booléen imposant le changement du mot de passe à la première connexion. Vrai par défaut à toute création par un administrateur |
| **Injection de formule Excel** | Vulnérabilité OWASP visée par les exports : toute valeur texte commençant par `=`, `+`, `-` ou `@` est préfixée d'une apostrophe, car ces champs sont éditables par des comptes de bas niveau et relus par des comptes supérieurs |
| **`PublicListCacheMixin`** | Mixin de mise en cache des listes publiques, avec ses `cache_key_params` (paramètres qui font varier la clé) et ses `cache_bypass_params` (paramètres qui court-circuitent le cache — typiquement `search`) |
| **Données de démonstration** | `lib/eec-data.ts` contient des générateurs de fausses données — noms de personnes, d'écoles, suffixes de districts — vestiges de la maquette. **Seule la constante `ENTITY_TYPES` en est encore importée** ; le reste du fichier n'est plus utilisé |

### 9.11 Instances de gouvernance citées dans la vitrine

Ces termes n'apparaissent **que dans la landing page** — contenu éditorial, sans contrepartie en base de données ni dans l'API.

| Terme | Définition d'après le code |
|---|---|
| **Synode Général** | L'assemblée générale de l'EEC. Apparaît dans le pied de page (« © 2026 Église Évangélique du Cameroun — Synode Général »), dans la section Direction, et dans la mention « Élu au Synode Général de Bagangté · 29 décembre 2022 · Mandat quinquennal ». **Aucun modèle ne le représente** |
| **Président du Synode Général** | Titre du dirigeant de l'EEC, porté dans `EEC_DIRECTION` d'un fichier de données statiques de la vitrine |
| **Conseil Synodal Général** (CSG) | Distinct du Synode Général : c'est l'instance qui prend les **résolutions**, dont la R05/CSG sur la catégorisation. Contrairement au Synode Général, il laisse une trace en base — via `Paroisse.categorie` et `cible_offrande` |

> Les compteurs de la vitrine sont désynchronisés des données réelles : `Stats.tsx` et `Hero.tsx` annoncent **553 paroisses** en dur, `ENTITY_TYPES` vise **576**, et le modèle documente **≈693**.

### 9.12 Termes de l'énoncé absents du code

| Terme | Ce qui existe à la place |
|---|---|
| **Catégorie d'ouvrier** | La notion n'existe pas. Un ouvrier porte un **grade** (huit niveaux) et un **statut** (occupé / inoccupé). « Catégorie » ne s'applique qu'aux **paroisses** |
| **Import Word** *(via l'application)* | Aucun. Mais **quatre commandes de gestion lisent réellement des `.docx`** : `import_categories_docx`, `import_gps_docx`, `import_gps_oeuvres_docx` et `import_grades_docx`. Ce sont des **scripts d'administration en ligne de commande**, hors API et hors interface — les documents sources du Conseil Synodal étant fournis au format Word. Les trois endpoints d'import de l'API n'acceptent que le `.xlsx` |
