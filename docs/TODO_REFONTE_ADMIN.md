# TODO — REFONTE ADMINISTRATION (RBAC · Dashboard · Statistiques · Comptes)
**Établie le 02/07/2026 après audit complet du code existant · AUCUNE modification effectuée**
**Priorités : 🔴 Critique · 🟠 Haute · 🟡 Moyenne · ⚪ Faible**

> Chaque tâche indique : Module · Description · Impacts (BE = backend, FE = frontend, BD = base) · Dépendances · Priorité.
> Les mentions « ✅ déjà en place » viennent de l'audit : elles évitent de refaire ce qui existe.

---

## 0. DÉCISIONS À TRANCHER AVANT DE CODER (ambiguïtés détectées à l'audit)

- [ ] **D-1 · Œuvres** — Tu demandes de supprimer le menu « … » (Voir/Modifier/Supprimer) **ET** de permettre la modification (nom/téléphone/adresse). → Proposition : garder un **bouton crayon inline** (hors menu) qui ouvre le formulaire restreint ; le menu « … » disparaît. À confirmer.
- [ ] **D-2 · Comptes** — Le menu « … » des comptes doit disparaître, **mais** l'Administrateur Général garde le droit de supprimer un administrateur. → Proposition : bouton « Supprimer » visible uniquement pour le SUPER, dans la fiche profil (pas dans la liste). À confirmer.
- [ ] **D-3 · Paramètres** — Supprimer l'onglet « Sécurité » supprime le changement de mot de passe depuis les paramètres. Le changement de MDP reste disponible via la page dédiée `/admin/changer-mot-de-passe` (déjà utilisée au premier login). → Confirmer que c'est acceptable.
- [ ] **D-4 · Ouvriers** — Exigence antérieure : « seule l'affectation est modifiable » (bouton réaffectation). Supprimer « Modifier » du menu « … » : garder le bouton **réaffectation inline** ? À confirmer.
- [ ] **D-5 · Dashboard** — « PSU Géographique » = le widget **« Aperçu géographique »** (mini-carte Leaflet 320px, `dashboard/page.tsx` ligne ~286) ? C'est lui que je supprimerai. À confirmer.

---

## 1. SÉCURITÉ & AUTORISATIONS 🔴

### 1.1 Matrice complète des permissions par rôle (référence unique)

| Action | Adm. Général | Adm. Région | Adm. District | Adm. Paroisse |
|---|---|---|---|---|
| Créer admin RÉGION | ✅ | ❌ | ❌ | ❌ |
| Créer admin DISTRICT | ✅ | ✅ (sa région) | ❌ | ❌ |
| Créer admin PAROISSE | ✅ | ❌ **(retiré)** | ✅ (son district) | ❌ |
| Supprimer un admin | ✅ | ❌ | ❌ | ❌ |
| Créer une PAROISSE | ✅ | ❌ | ❌ **(retiré)** | ❌ |
| Créer œuvre NATIONALE | ✅ | ❌ | ❌ | ❌ |
| Créer œuvre (zone) | ✅ partout | sa région | son district | sa paroisse |
| Créer/réaffecter ouvrier | ✅ partout | sa région | son district | sa paroisse |
| Importer des données | ✅ | ❌ | ❌ | ❌ (✅ déjà en place) |
| Voir données hors zone | ✅ | ❌ | ❌ | ❌ |
| Journal d'activités | tout | sa zone | sa zone | sa zone |
| Statistiques | globales | sa zone | sa zone | sa zone |

### 1.2 Tâches sécurité (backend obligatoire, frontend complémentaire)

- [ ] **S1** · Comptes · REGION ne peut plus créer d'admin PAROISSE (actuellement autorisé dans `UserCreateSerializer.validate`, ligne ~90) · BE (`serializers.py`) + FE (formulaire création : masquer l'option) · — · 🔴
- [ ] **S2** · Paroisses · Création de paroisse réservée au SUPER (actuellement les admins DISTRICT créent dans leur district via `perform_create`) · BE (`ParoisseViewSet.create` → refus si non-SUPER) + FE (bouton « Créer une paroisse » visible SUPER uniquement) · — · 🔴
- [ ] **S3** · Œuvres · Validation de zone à la CRÉATION : le rattachement (paroisse/district/région) doit appartenir à la zone du créateur ; « National » = SUPER uniquement · BE (`OeuvreViewSet.perform_create` + serializer) + FE (formulaire : ne proposer que la zone de l'admin) · dépend B8 · 🔴
- [ ] **S4** · Ouvriers · Validation de zone à la CRÉATION (REGION/DISTRICT : paroisse cible dans leur périmètre — seul PAROISSE est forcé aujourd'hui) · BE (`OuvrierViewSet.perform_create`) · — · 🔴
- [ ] **S5** · Ouvriers · Modification hors zone déjà bloquée par `_can_write_ouvrier` — **vérifier + couvrir par test** · BE · — · 🟠
- [ ] **S6** · Journal · Scoper `/api/audit/journal/` : chaque admin ne voit que les actions des utilisateurs de SA zone (actuellement non scopé) · BE (filtre LogActivite par zone) · — · 🔴
- [ ] **S7** · Dashboard · Vérifier bloc par bloc que `dashboard_stats` respecte le scope pour REGION/DISTRICT/PAROISSE (certains blocs sont SUPER-only ✅, d'autres à auditer) · BE · — · 🟠
- [ ] **S8** · Comptes · Suppression d'admin SUPER-only — ✅ déjà en place ; **conserver + test** · BE · — · 🟠
- [ ] **S9** · Carte admin · Les données personnelles (favoris, historique…) sont déjà liées au User par FK ✅ — ouvrir les endpoints `visitors/` aux rôles admin (vérifier la permission `IsAuthentifiedUser` qui pourrait exclure les admins) · BE · précède F4 · 🔴
- [ ] **S10** · Global · Passage en revue de TOUS les endpoints listés (œuvres, ouvriers, paroisses, stats, comptes, journal, exports) : aucun ne doit répondre hors zone pour un rôle scopé · BE · après S1-S7 · 🔴

---

## 2. BACKEND 🟠

### 2.1 Comptes & profil
- [ ] **B1** · User · Renommer le libellé du rôle SUPER : « Super Admin National » → **« Administrateur Général »** (choices `User.ROLES` → `role_display` alimenté partout, y compris la topbar) · BE + FE (aucun texte en dur côté front, affichage dynamique ✅) · — · 🟡
- [ ] **B2** · Comptes · `list_users` : inclure les **visiteurs authentifiés** (rôle VISITEUR) dans la réponse — actuellement exclus — avec `last_login` exposé ; jamais les anonymes (ils n'ont pas de compte) · BE (`auth_views.list_users`) · précède F11/F12 · 🟠
- [ ] **B3** · Profil · **Upload photo de profil** : dépendance Pillow, endpoint `POST /api/auth/me/avatar/` (multipart), validation type/taille, remplacement de l'ancienne image · BE + BD (D1) + config média (D5) · précède F16 · 🟠
- [ ] **B4** · Préférences · Persistance du **thème** (clair/sombre) côté serveur : `PATCH /api/auth/me/` accepte `theme` · BE + BD (D2) · précède F20 · 🟡

### 2.2 Œuvres
- [ ] **B6** · Œuvres · Restriction de MODIFICATION : seuls `nom`, `telephone`, `adresse` acceptés (modèle `CHAMPS_MODIFIABLES` comme pour Paroisse) ; GPS et rattachement **refusés côté serveur** · BE (`OeuvreViewSet.update`) · — · 🔴
- [ ] **B7** · Œuvres · Suppression d'œuvre **désactivée** : `destroy` → 405 pour tous les rôles · BE · précède F6 · 🔴
- [ ] **B8** · Œuvres · Rattachement **« National »** : le modèle le permet déjà (3 FK nullable ✅) — formaliser : sérializer expose `rattachement: national|region|district|paroisse`, validation « national ⇒ aucun FK », création réservée SUPER · BE · précède S3/F8 · 🟠
- [ ] **B9** · Œuvres · Retirer `est_active` (Statut) des serializers/exports d'œuvres (colonne supprimée) · BE · précède F5 · 🟡

### 2.3 Ouvriers
- [ ] **B10** · Ouvriers · Suppression d'ouvrier **désactivée** : `destroy` → 405 (remplace `can_delete_ouvrier`) · BE · précède F9 · 🔴

### 2.4 Statistiques (refonte)
- [ ] **B12** · Stats · Nouvel endpoint **`GET /api/stats/globales/`** (scopé par rôle) : nb œuvres/paroisses/districts/régions/admins/ouvriers, répartitions par région et district, évolutions — SANS baptêmes/mariages/décès/progression · BE (nouvelle vue, agrégats ORM réels) · après S10 · 🟠
- [ ] **B13** · Stats · Nouvel endpoint **`GET /api/stats/visiteurs/`** basé sur les modèles réels déjà en base ✅ (`ConsultationCarte`, `ParoisseVue`, `FavoriCarte`, `ItinerairePersonnel`, `RechercheHistorique`, `LogActivite` LOGIN, `User.last_login`) : tops consultations (régions/districts/paroisses/œuvres), tops favoris, tops itinéraires, connexions, visiteurs actifs/quotidiens/mensuels · BE · — · 🟠
- [ ] **B14** · Dashboard · Retirer du payload `dashboard_stats` toute trace baptêmes/mariages/décès (le modèle `StatistiqueAnnuelle` garde ses colonnes, elles ne sont juste plus exposées) · BE · précède F3 · 🟡

### 2.5 Journal
- [ ] **B15** · Journal · Paramètre de filtre **`?utilisateur=<id>`** sur `/api/audit/journal/` + liste des utilisateurs filtrables limitée à la zone (cohérent avec S6) · BE · avec S6 · 🟠

---

## 3. BASE DE DONNÉES 🟠

- [ ] **D1** · User · Migration : champ **`avatar`** (ImageField, null=True, upload_to="avatars/") · BD · précède B3 · 🟠
- [ ] **D2** · User · Migration : champ **`theme`** (CharField choices clair/sombre, default clair) — ou stockage dans `permissions_custom` JSON existant (sans migration) ; trancher · BD · précède B4 · 🟡
- [ ] **D3** · Œuvre · AUCUNE migration nécessaire pour « National » (FK déjà nullables ✅) — ajouter éventuellement une **contrainte de cohérence** (au plus un FK non-null) en validation serializer plutôt qu'en BD · BD/BE · — · 🟡
- [ ] **D5** · Infra · `MEDIA_ROOT`/`MEDIA_URL` configurés + **volume Docker** pour que les photos survivent aux redémarrages (persistance) + service des médias en dev · BD/Infra · précède B3 · 🟠
- [ ] **D6** · Stats visiteurs · Index déjà présents sur `ParoisseVue(paroisse,vue_at)`, `ConsultationCarte(utilisateur,vue_at)` ✅ — vérifier qu'un index sur `ConsultationCarte(type_entite, entite_id)` est utile pour les « tops » · BD · avec B13 · ⚪
- [ ] **D7** · Persistance carte admin · RIEN à créer : `FavoriCarte`, `ConsultationCarte`, `RechercheHistorique`, `ItinerairePersonnel` sont keyés sur User ✅ — les admins les utiliseront tels quels · BD · — · ✅ constat

---

## 4. FRONTEND 🟠

### 4.1 Dashboard (Administrateur Général — puis répliquer)
- [ ] **F1** · Dashboard · Supprimer le widget **« Aperçu géographique »** (MiniLeafletMap, `dashboard/page.tsx` ~ligne 286) et réorganiser la grille pour occuper l'espace (Top 10 paroisses passe en pleine largeur ou re-répartition) · FE · décision D-5 · 🟠
- [ ] **F2** · Dashboard · **« Carte interactive » plein écran** : au clic, animation fluide (transition CSS), le contenu glisse à gauche, la carte occupe tout sauf la sidebar d'icônes · FE (`/admin/map` + layout) · — · 🟠
- [ ] **F3** · Dashboard · Purger baptêmes/mariages/décès/progression de tous les widgets · FE · B14 · 🟡

### 4.2 Carte admin personnelle
- [ ] **F4** · Carte · Brancher la carte admin sur les endpoints personnels : **favoris, historique de consultation, historique de recherches, itinéraires, préférences** — comportement identique au visiteur connecté (le composant `EECMapApp` sait déjà le faire en mode `visitor` ✅ : réutiliser ce mode pour les admins) · FE · S9 · 🟠

### 4.3 Œuvres (tous les administrateurs)
- [ ] **F5** · Œuvres · Supprimer les colonnes **Statut** et **Adresse** du tableau (`oeuvres/page.tsx` lignes ~757-759) · FE · B9 · 🟡
- [ ] **F6** · Œuvres · Supprimer entièrement le **menu « … »** (RowMenu lignes ~43-60 : Voir la fiche / Modifier / Supprimer) · FE · décision D-1, B7 · 🟠
- [ ] **F7** · Œuvres · Formulaire de MODIFICATION limité à **nom / téléphone / adresse** ; GPS et rattachement affichés verrouillés · FE · B6 · 🔴
- [ ] **F8** · Œuvres · Formulaire de CRÉATION : niveau **« National »** ajouté (visible SUPER uniquement) ; pour les autres rôles, la zone est pré-verrouillée sur leur périmètre · FE · B8, S3 · 🟠

### 4.4 Ouvriers (tous les administrateurs)
- [ ] **F9** · Ouvriers · Supprimer entièrement le **menu « … »** (RowMenu lignes ~64-81) ; trancher D-4 pour la réaffectation · FE · B10, décision D-4 · 🟠

### 4.5 Répliquer sur les espaces Région / District / Paroisse
- [ ] **F10** · Espaces scopés · Reproduire TOUTES les suppressions de menus et colonnes sur les pages des espaces `admin/regional`, `admin/district`, `admin/paroisse` (aujourd'hui en données de démonstration — à brancher sur les vraies API scopées au passage) · FE · après 4.1-4.4 · 🟠

### 4.6 Comptes utilisateurs
- [ ] **F11** · Comptes · Afficher **admins + visiteurs authentifiés** (onglet ou filtre « Visiteurs ») — jamais d'anonymes · FE · B2 · 🟠
- [ ] **F12** · Comptes · Colonnes : supprimer **Statut** et **MDP** ; ajouter **« Dernière connexion »** (`last_login`) · FE · B2 · 🟡
- [ ] **F13** · Comptes · Supprimer le **menu « … »** (Voir/Modifier/Réinitialiser/Désactiver) ; l'action de suppression SUPER passe dans la fiche (décision D-2) · FE · S8, décision D-2 · 🟠

### 4.7 Statistiques (nouvelle page)
- [ ] **F14** · Stats · Page à **2 onglets** : « Statistiques globales » (B12) et « Statistiques visiteurs » (B13) — histogrammes, camemberts, cartes de chiffres, pictogrammes, couleurs, légendes ; composants graphiques existants réutilisables (`HorizontalBars`, `Donut`, `StackedBars`, `LineChart` ✅) · FE · B12, B13 · 🟠

### 4.8 Journal
- [ ] **F15** · Journal · Ajouter le filtre **« Par utilisateur »** (dropdown) aux filtres existants (Action/Entité/Dates ✅) · FE · B15 · 🟡

### 4.9 Paramètres
- [ ] **F16** · Paramètres · **Photo de profil fonctionnelle** : input file natif (fenêtre système), envoi au serveur, affichage immédiat, persistance — le bouton actuel est factice (constaté à l'audit) · FE · B3, D1, D5 · 🟠
- [ ] **F17** · Paramètres · Champ **nom** en lecture seule explicite (affiché, jamais éditable) · FE · — · ⚪
- [ ] **F18** · Paramètres · Supprimer les onglets **Sécurité, 2FA, Sessions actives** (audit : 2FA et Sessions sont entièrement factices — QR/codes/sessions en dur ; aucune API backend n'existe → suppression = frontend seul) · FE · décision D-3 · 🟡

### 4.10 Navbar (topbar admin)
- [ ] **F19** · Topbar · Supprimer la cloche **Notifications** (badge « 3 » factice, items en dur — constaté) · FE (`Topbar.tsx` ~lignes 162-167) · — · 🟡
- [ ] **F20** · Topbar · **Toggle thème Clair/Sombre** à sa place, appliqué à TOUT l'espace admin (variables CSS existantes `data-theme` ✅), persisté (B4/D2) et restauré à la connexion · FE · B4 · 🟠
- [ ] **F21** · Topbar · Libellé **« Administrateur Général »** (via B1 — l'affichage est déjà dynamique par `role_display`, aucun texte en dur ✅) · FE · B1 · 🟡

### 4.11 Responsive
- [ ] **F22** · Global · Vérifier les nouvelles vues (stats 2 onglets, carte plein écran, tableaux allégés) sur mobile · FE · après le reste · 🟡

---

## 5. TESTS ✅

- [ ] **T1** · Permissions · Matrice §1.1 jouée rôle par rôle : chaque création interdite → 403 avec message clair (REGION crée PAROISSE → 403 ; DISTRICT crée paroisse-entité → 403 ; REGION crée œuvre hors sa région → 400/403…) · 🔴
- [ ] **T2** · Suppressions désactivées · DELETE œuvre → 405 ; DELETE ouvrier → 405 ; DELETE paroisse → 405 (✅ déjà) ; DELETE admin par non-SUPER → 403 · 🔴
- [ ] **T3** · Isolation · Connecté en REGION A : la liste œuvres/ouvriers/paroisses/journal/stats ne contient AUCUNE donnée de la région B ; idem DISTRICT et PAROISSE · 🔴
- [ ] **T4** · Persistance carte admin · Ajouter un favori en tant qu'admin → déconnexion → reconnexion → le favori est restauré ; idem historique, recherche, itinéraire, thème · 🟠
- [ ] **T5** · Statistiques · Les chiffres de `/api/stats/globales/` correspondent aux comptages BD ; `/api/stats/visiteurs/` reflète des consultations réellement insérées (créer des `ConsultationCarte` de test et vérifier les tops) · 🟠
- [ ] **T6** · Comptes · La liste contient les visiteurs authentifiés, pas d'anonymes ; « Dernière connexion » = `last_login` réel · 🟠
- [ ] **T7** · Upload photo · Fichier image valide accepté et affiché ; fichier non-image ou > taille max refusé proprement ; la photo survit à un redémarrage des conteneurs (volume D5) · 🟠
- [ ] **T8** · Carte plein écran · Animation, retour arrière, sidebar fonctionnelle ; pas de « carte blanche » après le redimensionnement (invalidateSize déjà géré ✅ — vérifier dans le nouveau layout) · 🟡
- [ ] **T9** · Journal · Filtre par utilisateur + scope zone : un admin DISTRICT ne voit pas les actions d'un autre district · 🟠
- [ ] **T10** · Modification œuvre · PATCH avec `position` ou `paroisse` → 400 refusé ; PATCH `nom/telephone/adresse` → 200 · 🔴

---

## ORDRE DE RÉALISATION CONSEILLÉ (dépendances)

1. **Phase 1 — Sécurité (🔴)** : S1 → S10, B6, B7, B10 + T1-T3, T10. *Rien d'autre ne doit partir avant.*
2. **Phase 2 — Données & endpoints** : B2, B3+D1+D5, B4+D2, B8, B12, B13, B15.
3. **Phase 3 — Frontend** : F1-F22 (dans l'ordre des sections ; F4 et F14 sont les plus gros morceaux).
4. **Phase 4 — Tests restants** : T4-T9 + passe responsive F22.

**Volumétrie estimée** : ~10 tâches critiques, ~20 hautes, ~12 moyennes, ~3 faibles — plus 5 décisions à trancher (§0) avant de démarrer.
