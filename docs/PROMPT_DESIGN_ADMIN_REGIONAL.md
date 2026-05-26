# PROMPT CLAUDE DESIGN — Vue Administrateur Régional
## EEC Géolocalisation — Plateforme Synodale Cameroun

---

## CONTEXTE RAPIDE

Tu vas designer l'espace complet de l'**Administrateur Régional** de la plateforme **EEC Géolocalisation** — système officiel de géolocalisation des paroisses de l'**Église Évangélique du Cameroun**.

L'Administrateur Régional est le **responsable d'une région synodale**. Il voit, saisit et valide toutes les données de ses paroisses, districts, ouvriers et œuvres — **exclusivement dans sa région**. Il ne voit jamais les autres régions. Il est le maillon de coordination entre le Super Admin national et les admins district/paroisse sous sa responsabilité.

C'est un tableau de bord de **coordination territoriale** : mi-opérationnel (saisie de données), mi-managérial (validation, suivi, alerte des retards). Toujours sombre, dense, fonctionnel. Aucun décoration inutile.

Dans tous les exemples ci-dessous, l'admin connecté est titulaire de la **Région Synodale MIFI**.

---

## IDENTITÉ VISUELLE — IDENTIQUE À LA VUE SUPER ADMIN

### Couleurs (dark mode — mode par défaut)

| Rôle | Valeur |
|------|--------|
| Canvas principal (fond page) | `#0D1B12` |
| Sidebar et topbar | `#08110B` |
| Surface des cards | `rgba(255,255,255,0.04)` |
| Hover surface | `rgba(255,255,255,0.07)` |
| Bordures standard | `rgba(245,197,24,0.13)` |
| Bordures focus/active | `rgba(245,197,24,0.30)` |
| Texte principal | `#F0F4F1` |
| Texte secondaire | `rgba(240,244,241,0.58)` |
| Texte désactivé | `rgba(240,244,241,0.30)` |
| Vert EEC (boutons, succès) | `#2E9744` |
| Or EEC (item actif sidebar) | `#FFD600` |
| Bleu Régional (badge rôle) | `#5B9BD5` |
| Rouge alerte | `#C62828` |
| Orange avertissement | `#E65100` |

### Typographie — RÈGLE STRICTE

- **Space Grotesk 700, letter-spacing -0.03em** → TOUS les grands titres, chiffres de stats, titres de pages
- **Inter 400/500/600** → corps de texte, labels, tableaux, placeholders
- **Fraunces** → uniquement le nom de marque "EEC Cameroun" dans la sidebar

### Animations

- Hover : 200ms ease sur couleur/background
- Slide panel : translateX(100%)→0, 350ms cubic-bezier(0.4,0,0.2,1)
- Dropdowns : opacity 0→1 + translateY(-4px)→0, 150ms
- Toasts : translateX(100%)→0, 300ms

---

## LAYOUT MAÎTRE

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR 240px fixe │  TOPBAR 60px sticky                       │
│  fond #08110B       ├─────────────────────────────────────────── │
│  hauteur 100vh      │  BANDEAU SCOPE 36px (persistant, collé     │
│                     │  sous la topbar)                           │
│                     ├─────────────────────────────────────────── │
│                     │  ZONE DE CONTENU (scroll vertical)         │
│                     │  fond #0D1B12  ·  padding 28px 32px        │
└─────────────────────┴─────────────────────────────────────────── ┘
```

**Différence clé avec le Super Admin :** un **bandeau de scope persistant** est présent entre la topbar et le contenu sur chaque écran.

---

## BANDEAU DE SCOPE (composant persistant)

Fond `rgba(21,101,192,0.06)`, border-bottom `1px solid rgba(91,155,213,0.18)`, hauteur 36px, padding `0 32px`.

```
  [◈ icône région bleu]  Région Synodal MIFI    ·    48 paroisses  ·  12 districts  ·  Scope limité à votre région
```

Texte : Inter 12px `rgba(91,155,213,0.80)`. Icône région `#5B9BD5` 14px. Tout en italic discret.

Ce bandeau rappelle visuellement en permanence que l'admin ne voit qu'une partie de la plateforme — et que cette limitation est normale et voulue.

---

## SIDEBAR ADMIN RÉGIONAL — Détail complet

**Fond :** `#08110B` · border-right `1px solid rgba(245,197,24,0.08)`

**Zone Brand (haut, 72px) :**
- Logo EEC SVG (croix stylisée blanche, 32px) + "EEC Cameroun" Fraunces 15px blanc + "Console Synodale" Inter 11px rgba(255,255,255,0.50)
- Séparateur bas `rgba(255,255,255,0.08)`

**Zone Admin connecté (padding 16px) :**
- Avatar cercle 38px : fond `rgba(91,155,213,0.20)`, border `rgba(91,155,213,0.45)`, initiales Space Grotesk 14px bold `#5B9BD5`
- Nom : Inter 13px 600 `#F0F4F1` — ex: "Marie-Claire BIYA"
- Badge rôle pill : fond `rgba(91,155,213,0.15)`, border `rgba(91,155,213,0.35)`, texte `#5B9BD5`, Inter 10px 600 uppercase → "ADMIN RÉGIONAL"
- Sous le badge : Inter 11px `rgba(240,244,241,0.40)` → "Région MIFI"
- Séparateur bas `rgba(255,255,255,0.08)`

*(Note design : le badge bleu `#5B9BD5` distingue visuellement le rôle Régional du Super Admin jaune `#FFD600`)*

**Navigation :**

```
  PRINCIPAL
    [⊞] Tableau de bord         ← item ACTIF
    [◈] Carte interactive

  MA RÉGION
    [✝] Paroisses
    [⬡] Œuvres
    [👤] Ouvriers
    [⬡] Districts              ← Créer/modifier ses districts

  RAPPORTS & DONNÉES
    [▣] Statistiques
    [⇅] Import / Export

  ADMINISTRATION
    [☰] Comptes (ma région)
    [≡] Journal (ma région)    ← affiché seulement si permission accordée

  ──────────────────────────
  SYSTÈME
    [⚙] Paramètres
    [↪] Déconnexion
```

**Différences vs Super Admin :**
- Section "GESTION DES DONNÉES" → renommée "MA RÉGION" — ancrage territorial explicite
- Pas d'item "Régions synodales" (il ne peut pas gérer les régions)
- "Comptes" libellé "Comptes (ma région)" — rappel du scope limité
- "Journal" affiché seulement si la permission `peut_voir_journal_region` est cochée dans les permissions customisées de son compte. Si absent : l'item est masqué, pas simplement grisé.

**Style items navigation :** identique au Super Admin.

---

## TOPBAR — Détail complet

**Fond :** `#08110B` · Hauteur 60px · border-bottom `1px solid rgba(245,197,24,0.10)` · padding `0 32px`

**Gauche :**
- Titre page courant : Space Grotesk 18px 700 `#F0F4F1`
- Fil d'ariane : Inter 12px `rgba(240,244,241,0.45)` — "Tableau de bord / Région MIFI"

**Droite (flex, gap 20px) :**
- Date heure temps réel : Inter 13px `rgba(240,244,241,0.55)` — "25 mai 2026 — 14:32"
- Cloche notifications : icône bell 20px gris + badge rouge "2" (validations en attente)
- Avatar 34px + nom abrégé + chevron ▾

---

## ÉCRAN 1 — TABLEAU DE BORD RÉGIONAL

**Titre topbar :** "Tableau de bord"
**Fil d'ariane :** "Tableau de bord / Région MIFI"

### Rangée 0 — Alerte de non-soumission (si applicable, avant les stats)

Bandeau pleine largeur, fond `rgba(230,81,0,0.08)`, border `1px solid rgba(230,81,0,0.25)`, border-radius 6px, padding 12px 16px.

```
[⚠ icône orange]   8 paroisses de votre région n'ont pas encore soumis leurs statistiques 2025.
                   [Voir la liste] ──── [Envoyer une relance par e-mail aux admins concernés →]
```

Inter 13px `rgba(230,81,0,0.90)`. Bouton "Envoyer une relance" : fond `rgba(230,81,0,0.15)`, border `rgba(230,81,0,0.35)`, texte orange, border-radius 6px, 12px 16px.

*(Note design : cette alerte proactive est propre à la vue régionale — l'admin régional est responsable de s'assurer que tous ses districts remontent les données. Elle disparaît automatiquement si toutes les paroisses ont soumis.)*

### Rangée 1 — 4 Stat cards (grid 4 colonnes, scopées à la région MIFI)

Structure d'une card identique au Super Admin. Les 4 cards :

1. **Districts** · icône réseau · **12** · "dans la Région MIFI" gris · "— stables" gris
2. **Paroisses** · icône croix · **48** · "— dont 8 sans GPS (17%)" orange petit sous le chiffre
3. **Ouvriers** · icône briefcase · **156** · "▲ +3 ce mois" vert
4. **Fidèles 2025** · icône utilisateurs · **12,450** · "dont 7,890 communiants" gris Inter 12px

Style identique au Super Admin : fond `rgba(255,255,255,0.04)`, border or discret, border-radius 6px, padding 20px.

### Rangée 2 — 4 Widgets (grid 2×2)

**Widget A — Paroisses sans GPS (ma région) :**
Chiffre `8` Space Grotesk 28px orange `#E65100`. "17% des paroisses de la région" gris. Note : "0 GPS erroné dans MIFI" — vert discret. Lien "→ Voir et corriger" vert.

**Widget B — Validations en attente :**
Chiffre `2` Space Grotesk 28px orange `#E65100`. "Statistiques soumises par vos districts". Items listés discrètement :
```
  ● District BAHAM — soumis par Paul ATEBA — il y a 3h
  ● District NKAM — soumis par Lucie FOUDA — il y a 1j
```
Bouton pill "Traiter maintenant" fond `rgba(230,81,0,0.15)`.

**Widget C — Score de performance moyen (ma région) :**
Chiffre `78%` Space Grotesk 28px vert `#2E9744`. Barre de progression dessous. "Au-dessus de la moyenne nationale (74%)" vert Inter 11px. Lien "→ Détail par district".

*(Note : score agrégé sur 4 critères par paroisse : GPS renseigné + stats 2025 soumises + ouvriers renseignés + photo principale. Algorithme repris de l'ancienne version GeoEEC, étendu au scope district.)*

**Widget D — Comptes actifs (ma région) :**
Space Grotesk 28px. Disposition interne :
```
  3    Admins District
  12   Admins Paroisse
  ───────────────────
  15   comptes actifs dans MIFI
```
Bouton bas [+ Inviter un admin →] fond `#2E9744` pleine largeur card.

*(Note design : ce widget n'existe pas dans le Super Admin — c'est un ajout spécifique à la vue régionale, car l'admin régional est directement responsable de ses sous-comptes.)*

### Rangée 3 — 3 Graphiques (grid asymétrique 50/25/25)

**Graphique 1 (gauche, 50%) — État de complétude par district :**
Type barres horizontales — 12 barres (une par district MIFI). Chaque barre : fond `rgba(255,255,255,0.08)`, remplissage couleur selon score. Labels : nom district + "X%" à droite de la barre. Filtre "Critère" : [Tout] [GPS] [Stats] [Ouvriers] [Photos]. Titre "Complétude par district · Région MIFI".

**Graphique 2 (centre, 25%) — Répartition des œuvres :**
Donut — 28 œuvres au total. Centre : `28` Space Grotesk 22px + "œuvres" Inter 11px. Couleurs segments : scolaire=`#1565C0`, médical=`#C62828`, universitaire=`#6A1B9A`, agropastoral=`#E65100`, immeuble=`#455A64`. Légende sous le donut.

**Graphique 3 (droite, 25%) — Évolution fidèles :**
Courbe simplifiée 2021→2025. 1 seule courbe `#2E9744`, zone sous-courbe `rgba(46,151,68,0.08)`. Points de données cliquables (tooltip chiffre).

### Rangée 4 — Carte + Activité (grid 55/45)

**Carte centrée sur la région MIFI (gauche) :**
Leaflet dark theme. Zoom automatique sur les bounds de la région MIFI. Marqueurs verts clustérisés. Les paroisses sans GPS apparaissent dans une liste flottante bas-gauche de la carte : "8 paroisses non localisées — [Voir liste]". Hauteur 300px. Bouton bas "Ouvrir la carte interactive complète →".

**Activité récente de ma région (droite) :**
Titre "Activité dans la Région MIFI" + lien "Voir tout →".
Items (max 5) :
```
[Avatar 30px]  Paul ATEBA — Admin District BAHAM       il y a 2h
               [upload] Statistiques 2025 soumises
               ─────────────────────────────────────────
[Avatar 30px]  Jean-Pierre NANA — Admin Paroisse        il y a 5h
               [crayon] Modifié paroisse Bafoussam-Nord
               ─────────────────────────────────────────
[Avatar 30px]  Moi (Marie-Claire BIYA)                  il y a 1j
               [✓] Validé statistiques District NKAM
```
Séparateur `rgba(255,255,255,0.06)`.

### Rangée 5 — Tableau des dernières paroisses modifiées

Identique au Super Admin mais **sans** le filtre "Région" (implicitement MIFI).
Colonnes : Nom | District | Niveau | Fidèles | GPS | Complétude | Statut | Modifié | Actions

---

## ÉCRAN 2 — LISTE DES PAROISSES (région MIFI)

**Titre :** "Paroisses — Région MIFI"
**Fil d'ariane :** "Paroisses / Région MIFI"

### Barre d'outils (56px)

Gauche : "48 paroisses · Région MIFI" Space Grotesk 16px.
Droite : [⬆ Importer Excel] (outline) + [⬇ Exporter ma région] (outline) + [+ Créer une paroisse] (fond `#2E9744`)

### Barre de filtres

Filtres inline : Recherche texte | **District** (dropdown — pas de filtre Région car scopé) | Niveau | GPS | Statut | Complétude (dropdown : Tous / < 50% / 50–79% / ≥ 80%).
Si filtré : bandeau "X paroisses trouvées sur 48 dans MIFI".

### Tableau

**En-têtes :**
☐ | # | Nom | District | Niveau | Fidèles | Ouvriers | GPS | Complétude | Statut | Modifié | Actions

**Différences clés vs Super Admin :**
- **Pas de colonne "Région"** — elle est implicitement MIFI, inutile de l'afficher
- **Colonne "District"** prend la première place après le Nom
- La barre de complétude et les statuts sont identiques au Super Admin

**Colonne "Statut" — 3 états :**
- Pill vert "Actif"
- Pill gris "Inactif"
- Pill orange animée "⏳ En attente" — si une modification a été soumise par un admin district/paroisse. Tooltip : "Modification soumise par [Nom] le [date] — cliquez pour valider/rejeter."

Si "En attente" : les boutons [✅ Valider] [❌ Rejeter] remplacent [✎] dans la colonne Actions.

**Sélection multiple :** identique au Super Admin — barre flottante bas avec [Exporter Excel] [Exporter PDF] [Désactiver] [Annuler].

**État vide (si tous les filtres actifs ne retournent rien) :**
```
[Icône croix EEC grisée 56px]
Aucune paroisse trouvée dans MIFI
Modifiez vos filtres ou créez une nouvelle paroisse.
[Réinitialiser les filtres]   [+ Créer une paroisse]
```

---

## ÉCRAN 2B — LISTE DES DISTRICTS (ma région)

Route dédiée — item "Districts" dans la sidebar.

**Titre :** "Districts — Région MIFI"

### Barre d'outils

Gauche : "12 districts · Région MIFI" Space Grotesk 16px.
Droite : [+ Créer un district] (fond `#2E9744`)

### Tableau

Colonnes : Nom | Nb paroisses | Nb ouvriers | Fidèles | Score complétude | Admin assigné | Actions

**Colonne "Admin assigné" :**
- Si admin District existe : avatar 24px + nom Inter 13px `#F0F4F1`
- Si aucun admin : "— Aucun admin" gris + lien "Assigner →" vert

**Colonne "Score complétude" :** barre + pourcentage identique à la colonne des paroisses.

**Actions par ligne :** [👁 Voir les paroisses] [✎ Modifier] [⋮ Plus]

### Formulaire de création / modification d'un district

Panel slide depuis la droite (400px) — pas une page complète, c'est une opération légère.
Champs : Nom du district* | Région (pré-remplie MIFI, grisée non-éditable).
Boutons : [Annuler] · [Créer le district] fond `#2E9744`.

*(Note design : l'admin régional peut créer et modifier des districts dans sa région — mais ne peut pas supprimer un district. La suppression est réservée au Super Admin.)*

---

## ÉCRAN 3 — FORMULAIRE PAROISSE (6 ONGLETS)

**Titre :** "Nouvelle paroisse" ou "Modifier — Bafoussam-Nord"

### Header formulaire (sticky) — identique Super Admin

Fond `#08110B`, border-bottom `rgba(245,197,24,0.10)`, padding 16px 32px.

### Différence majeure dans l'onglet 1 — Informations générales

**Champ "Région synodale" :** pré-rempli "MIFI", **grisé et non-éditable** (fond `rgba(255,255,255,0.03)` — plus sombre, curseur interdit). Une infobulle au survol explique : "Votre scope est limité à la Région MIFI."

**Champ "District" :** dropdown chargé directement avec les 12 districts MIFI (pas besoin de sélectionner la région d'abord — elle est implicite).

Tous les autres champs (Nom, Niveau, Statut, Localité, Description, Date, Adresse) sont identiques au formulaire Super Admin.

### Onglet 2 — Localisation GPS — Identique Super Admin

Badge de validation Cameroun : lat [1.7°N → 13.1°N], lng [8.5°E → 16.2°E].
Mini-carte Leaflet. Convertisseur DMS. Bouton [📍 Obtenir ma position].

### Onglet 3 — Statistiques — Identique Super Admin

Sélecteur année, Communiants / Non-communiants / Total auto-calculé. Accordion "Statistiques vitales" (Baptêmes, Confirmations, Mariages, Décès). Accordion "Données financières" (Offrandes, Dîmes — confidentiel, cadenas).

**Bouton spécifique Admin Régional :**
En bas de l'onglet : bouton [✅ Valider les statistiques soumises] visible uniquement si le statut est "En attente". Fond `rgba(46,151,68,0.15)`, border vert, texte vert. Clic → modale de confirmation → changement de statut + entrée journal.

### Onglet 4 — Galerie Photos — Identique Super Admin

Zone drag & drop, grille 4 colonnes, overlay au survol, badge "★ Principale".

### Onglet 5 — Ouvriers assignés — Identique Super Admin

Liste items + [+ Assigner ouvrier existant] + [+ Créer nouvel ouvrier].

### Onglet 6 — Œuvres liées — Identique Super Admin

### Barre sticky bas de formulaire — Identique Super Admin

[Annuler] · [Enregistrer brouillon] · [Publier]

---

## ÉCRAN 4 — GESTION DES COMPTES (ma région)

**Titre :** "Comptes utilisateurs — Région MIFI"

### 3 Mini-stats en haut (grid 3, pas 4 — pas de Super Admin card)

Cards compactes (40px) : "Admins District (3)" | "Admins Paroisse (12)" | "Total actifs (15)"

*(Le Super Admin a 4 mini-stats car il voit les Super Admins aussi. L'Admin Régional n'a aucun Super Admin sous lui, donc 3 cards.)*

### Barre d'outils

Filtres : Recherche | Rôle (dropdown — seulement Admin District / Admin Paroisse, pas Super Admin) | District | Statut.
Bouton droit : [+ Inviter un administrateur] fond `#2E9744` → DÉCLENCHE LE SLIDE PANEL.

### Tableau des comptes

**Colonnes :** Avatar+Nom | Email | Rôle (badge) | District / Paroisse | Dernière connexion | Statut | Actions

**Badges de rôle (uniquement 2 possibles ici) :**
- Admin District : fond `rgba(230,81,0,0.15)`, texte `#E67A2E`, border `rgba(230,81,0,0.30)`
- Admin Paroisse : fond `rgba(46,151,68,0.15)`, texte `#2E9744`, border `rgba(46,151,68,0.30)`

**Actions :** [👁] [✎] [⋮] → menu : Réinitialiser MDP · Révoquer sessions · Désactiver

*(Note : l'Admin Régional ne peut pas **supprimer** un compte — uniquement désactiver. La suppression est réservée au Super Admin.)*

---

## ÉCRAN 4B — SLIDE PANEL INVITATION ADMIN (3 ÉTAPES — VERSION RÉGIONALE)

### Différences par rapport au Super Admin

**Étape 1 — Informations personnelles :** identique (Nom, Prénom, Email, Téléphone).

**Étape 2 — Rôle et portée :**

Seulement **2 cards radio** (pas 3 — l'Admin Régional ne peut pas créer d'autres Admin Régionaux) :

```
┌──────────────────────────────────────────────────────────────┐
│  ◎  Admin District                                           │
│     Gère un district dans la Région MIFI                    │
│     (paroisses, ouvriers, œuvres de son district)          │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  ○  Admin Paroisse                                           │
│     Gère une paroisse spécifique dans MIFI                  │
└──────────────────────────────────────────────────────────────┘
```

**Sélection portée (cascade simplifiée) :**

- Si Admin District : Dropdown "District*" (12 districts MIFI — pas de dropdown Région car MIFI est implicite)
- Si Admin Paroisse : Dropdown "District*" → Dropdown "Paroisse*" (cascade 2 niveaux, MIFI déjà connu)

**Étape 3 — Permissions personnalisées :**

Récapitulatif : "Administrateur District · District BAHAM · Région MIFI"

**Permissions pour un Admin District (pré-cochées intelligentes) :**

```
Gestion des données
  [✓] Peut créer des paroisses dans son district
  [✓] Peut modifier les paroisses de son district
  [ ] Peut supprimer des paroisses de son district
  [✓] Peut créer des œuvres dans son district
  [ ] Peut supprimer des œuvres

Comptes et accès
  [✓] Peut créer des comptes Admin Paroisse
  [ ] Peut désactiver des comptes Paroisse

Données & rapports
  [✓] Peut importer Excel ouvriers (son district)
  [✓] Peut importer Excel œuvres (son district)
  [✓] Peut exporter les données de son district
  [ ] Peut voir le journal d'activité de son district
```

**Permissions pour un Admin Paroisse (pré-cochées intelligentes) :**

```
Gestion des données
  [✓] Peut modifier sa paroisse
  [✓] Peut saisir les statistiques de sa paroisse
  [✓] Peut créer des ouvriers dans sa paroisse
  [✓] Peut créer des œuvres dans sa paroisse
  [✓] Peut gérer les photos de sa paroisse
```

Box mot de passe temporaire : identique Super Admin — généré aléatoirement, bouton [Copier] [↻ Régénérer], mention "Affiché une seule fois."

Après création : toast vert "Compte créé. Email envoyé à {email}." Panel ferme.

---

## ÉCRAN 5 — STATISTIQUES RÉGIONALES

**Titre :** "Statistiques — Région MIFI"

### Navigation des vues

3 onglets : [Vue par district] [Vue carte] [Validation en attente] + dropdown "Année 2025 ▾" à droite.

*(Différence vs Super Admin : pas de "Vue tableau national". La vue principale est "par district" — les 12 districts de MIFI.)*

### Vue par district

**Tableau 12 lignes (une par district) :**
District | Paroisses | Communiants | Non-communiants | Total fidèles | Baptêmes | Mariages | Décès | Soumissions | Score perf. | Actions

**Colonne "Soumissions" :**
"12/12" en vert si toutes les paroisses du district ont soumis.
"9/12" en orange si certaines paroisses manquent.
"0/12" en rouge si aucune soumission.
Au survol : liste des paroisses manquantes.

**Colonne "Score de performance" (algorithme GeoEEC) :**
GPS (30pts) + Stats 2025 (30pts) + Ouvriers (20pts) + Photos (20pts). Barre + "78%". Triable.

**Footer :** totaux agrégés de la région MIFI. Boutons export [PDF] [Excel] [CSV].

**Ligne cliquable → expansion accordion :**
Le clic sur un district ouvre en dessous les statistiques de ses paroisses (sous-tableau dans un fond légèrement plus clair `rgba(255,255,255,0.02)`), avec les mêmes colonnes mais pour les paroisses.

### Vue carte choroplèthe (ma région)

Leaflet dark. Zoom centré sur la région MIFI. Les districts sont colorés en dégradé selon le nombre de fidèles ou le score de performance (toggle "Afficher par" : Fidèles | Score).
Tooltip au survol d'un district : nom district + top 3 stats.
Les paroisses sans GPS apparaissent en liste fixe bas-droite de la carte.

### Vue "Validation en attente" (propre à l'Admin Régional)

Tableau des statistiques soumises par les admins District/Paroisse qui attendent sa validation :

Colonnes : Paroisse | District | Soumis par | Date soumission | Année | Fidèles | [✅ Valider] [❌ Rejeter]

**[✅ Valider] :** clic → toast "Statistiques de {paroisse} validées." + statut change → "Validé".
**[❌ Rejeter] :** clic → textarea "Motif du rejet (obligatoire)" s'ouvre sous la ligne + bouton [Confirmer le rejet] rouge. Un email de notification est envoyé automatiquement à l'admin qui a soumis.

---

## ÉCRAN 6 — IMPORT / EXPORT (scopé à la région MIFI)

**Titre :** "Import / Export — Région MIFI"

### 3 onglets Import + section Export (pas d'onglet Shapefile)

Onglets : [Import Paroisses] [Import Ouvriers] [Import Œuvres] + card Export séparée à droite.

*(L'Admin Régional n'a pas accès à l'import Shapefile — réservé Super Admin.)*

### Workflow import (stepper 4 étapes) — identique Super Admin

```
[1. Modèle] ──► [2. Chargement] ──► [3. Prévisualisation] ──► [4. Import]
```

**Différence étape 3 :**
Une colonne "Région" est vérifiée dans le fichier Excel. Si des lignes pointent vers une région autre que MIFI, elles apparaissent en rouge avec l'erreur : "Hors de votre scope — Région ADAMAOUA ignorée". Le résumé indique : "X paroisses à importer dans MIFI · Y lignes hors scope ignorées · Z erreurs."

**Étape 4 — Import en cours :** identique Super Admin (barre de progression, bouton Annuler).

### Section Export

**Filtre automatique :** les données exportées sont **automatiquement filtrées à la région MIFI**. L'utilisateur ne voit pas de dropdown "Région" (c'est fixé).

Checkboxes : [✓] Paroisses / [ ] Œuvres / [ ] Ouvriers / [ ] Statistiques.
Filtres supplémentaires : **District** (dropdown ses 12 districts) | Année.
Format radio : [Excel (.xlsx)] [CSV] [PDF — Rapport régional] [GeoJSON].

**Footer export :** mention Inter 11px gris "L'export sera limité aux données de la Région MIFI uniquement."

### Onglet Historique des imports

Tableau : Date | Fichier | Type | Lignes OK | Erreurs | [Rapport]
Uniquement les imports réalisés par l'admin connecté ou par les admins de sa région.

---

## ÉCRAN 7 — JOURNAL D'ACTIVITÉ (ma région)

**Titre :** "Journal d'activité — Région MIFI"

*(Cet écran est visible uniquement si la permission `peut_voir_journal_region` est cochée sur le compte de cet admin.)*

### Filtres

Segment buttons "Période" : [Aujourd'hui] [7 jours] [30 jours] [Personnalisé].
Dropdowns : Type d'action | Utilisateur (liste déroulante limitée aux 15 comptes de la région MIFI) | Entité (Paroisse / District / Ouvrier / Œuvre).

### Tableau

Identique au Super Admin : Date/Heure | Utilisateur | Action (icône colorée) | Entité | Résumé | IP

**Filtrage implicite :** seules les actions réalisées sur les entités de la Région MIFI apparaissent. Aucune action d'autres régions, aucune action Super Admin.

**Note discrète bas de tableau :**
Inter 11px gris — "Ce journal couvre uniquement les actions réalisées dans la Région MIFI. Pour l'historique global, contacter l'Administrateur National."

**Icônes d'action colorées :** identiques Super Admin (connexion bleu, création vert, modification orange, suppression rouge, import violet, export gris).

**Ligne cliquable → accordion détail :** identique Super Admin.

---

## ÉCRAN 8 — PARAMÈTRES

**Titre :** "Paramètres"

Identique au Super Admin — 5 onglets : [Profil] [Sécurité] [2FA] [Sessions actives] [Préférences]

### Onglet Profil — Identique Super Admin

Photo de profil + champs Nom complet | Email | Téléphone.

**Différence : section "Mon scope" (lecture seule, non-éditable) :**
```
Rôle           : Administrateur Régional
Région         : MIFI
Compte créé le : 12 mars 2025
Créé par       : Admin National — admin@eec-cameroun.org
```
Fond `rgba(255,255,255,0.03)`, border `rgba(245,197,24,0.10)`, border-radius 6px, padding 12px 16px.
Mention grise : "Pour modifier votre scope, contactez l'Administrateur National."

### Onglet Sécurité — Identique Super Admin

Changement de mot de passe + indicateur de force + règles listées.

### Onglet 2FA — Identique Super Admin

QR Code, code secret, input TOTP, codes de secours.

### Onglet Sessions actives — Identique Super Admin

Tableau des sessions + bouton "Se déconnecter de toutes les autres sessions".

### Onglet Préférences — Identique Super Admin

Thème (3 cards radio) | Format date | Fuseau horaire | Notifications email.

---

## COMPOSANTS PARTAGÉS (identiques Super Admin)

### Toasts (haut-droite, empilables max 3)

4 types, 320px, border-left 3px :
- Succès : fond `rgba(46,151,68,0.12)`, border `#2E9744`, icône ✓ vert
- Erreur : fond `rgba(198,40,40,0.12)`, border `#C62828`, icône ✕ rouge
- Avertissement : fond `rgba(230,81,0,0.12)`, border `#E65100`, icône ⚠ orange
- Info : fond `rgba(21,101,192,0.12)`, border `#1565C0`, icône ℹ bleu

Animation : translateX(100%)→0, 300ms. Disparition : 5s (erreur : 8s).

### Modale de confirmation suppression

Identique Super Admin — 440px centré, fond `#0D1B12`, champ de confirmation par saisie du nom.

### Skeleton loaders

Identique Super Admin — lignes et cards shimmer animé.

### Panneau notifications (cloche topbar)

Dropdown 360px, fond `#08110B`, border `rgba(245,197,24,0.20)`.
Contenu spécifique Admin Régional :
```
● Statistiques soumises — District BAHAM               il y a 3h
  Paul ATEBA a soumis les stats 2025 du District BAHAM
  [Valider maintenant]

● 8 paroisses n'ont pas soumis leurs statistiques 2025  il y a 1j
  Pensez à relancer les admins concernés.

● Nouveau compte créé — Admin Paroisse Nkoabang-Est     il y a 2j
```
Notifications strictement limitées à la Région MIFI.

---

## POINTS CRITIQUES — NE PAS RATER

1. **Bandeau de scope PERSISTANT** — bleu discret sous la topbar sur chaque écran — rappel territorial permanent
2. **Badge rôle BLEU** `#5B9BD5` — distingue immédiatement l'Admin Régional du Super Admin jaune
3. **Filtre "Région" ABSENT** dans tous les tableaux et dropdowns — implicitement MIFI
4. **Cascade District → Paroisse** (2 niveaux max, pas 3 car Région déjà connue)
5. **Champ Région GRISÉ** dans le formulaire paroisse — pré-rempli MIFI, non-éditable, infobulle d'explication
6. **Slide panel — seulement 2 rôles** (District + Paroisse) — jamais "Admin Régional" ni "Super Admin"
7. **Vue Validation statistiques** — onglet dédié dans les statistiques (unique à ce rôle)
8. **Alerte non-soumission** — bandeau en haut du dashboard si paroisses n'ont pas encore soumis stats 2025
9. **Journal conditionnel** — l'item "Journal" dans la sidebar est masqué (pas grisé) si permission absente
10. **Widget "Comptes actifs"** — visible uniquement en vue régionale — quick link "+Inviter"
11. **Export automatiquement filtré** à MIFI — pas de dropdown Région dans la section export
12. **Import vérifie le scope** — lignes hors MIFI dans l'Excel sont ignorées et signalées en rouge
13. **Scroll accordion** dans les stats — clic sur un district → expansion inline des paroisses du district
14. **Section "Mon scope"** dans Paramètres / Profil — lecture seule, avec créateur du compte et date
15. **Score de performance par district** — barre + chiffre, algorithme identique version nationale (4 critères : GPS, stats 2025, ouvriers, photos) — triable

---

## TABLEAU COMPARATIF — SUPER ADMIN vs ADMIN RÉGIONAL

| Fonctionnalité | Super Admin | Admin Régional |
|---|---|---|
| Scope des données | National (tout) | Sa région uniquement |
| Badge couleur sidebar | Or `#FFD600` | Bleu `#5B9BD5` |
| Filtre "Région" dans les tableaux | Oui | Non (implicite) |
| Stat cards dashboard | 5 cards (Régions/Districts/Paroisses/Œuvres/Ouvriers) | 4 cards (Districts/Paroisses/Ouvriers/Fidèles) |
| Bandeau de scope sous la topbar | Non | Oui (permanent) |
| Alerte non-soumission stats | Non (vue globale) | Oui (bandeau en haut) |
| Widget "Comptes actifs" | Non | Oui |
| Import Shapefile | Oui | Non |
| Import Paroisses | Oui (national) | Oui (sa région, scope vérifié) |
| Gestion des Régions | Oui | Non (lecture seule de sa région) |
| Création de Districts | Oui | Oui (dans sa région) |
| Slide panel — roles disponibles | 3 (Régional, District, Paroisse) | 2 (District, Paroisse) |
| Cascade portée dans slide panel | 3 niveaux (Région → District → Paroisse) | 2 niveaux (District → Paroisse) |
| Validation des statistiques | Oui (nationale) | Oui (sa région — onglet dédié) |
| Journal d'activité | Global, toujours visible | Sa région, conditionnel (permission) |
| Mode maintenance | Oui | Non |
| Section "Mon scope" dans Paramètres | Non | Oui (lecture seule) |
| Carte — vue par défaut | Nationale (Cameroun entier) | Centrée sur sa région |
| Graphique complétude | Par région (22 barres) | Par district (12 barres) |

---

## DONNÉES RÉELLES EN BASE — EXEMPLE RÉGION MIFI

*(Ces chiffres sont utilisés dans les wireframes pour rendre les maquettes réalistes.)*

| Entité | Valeur MIFI (exemple) | Source |
|--------|----------------------|--------|
| Districts | 12 | Données importées |
| Paroisses | 48 | Données importées |
| Paroisses sans GPS | 8 (17%) | Sous la moyenne nationale 22% |
| Ouvriers | 156 | Données importées |
| Œuvres | 28 | Données importées |
| Fidèles 2025 | 12,450 (7,890 communiants + 4,560 non-comm.) | Statistiques importées |
| Score de performance moyen | 78% | Au-dessus moyenne nationale (74%) |
| Validations en attente | 2 | (Districts BAHAM + NKAM) |
| Admins District actifs | 3 | Comptes en base |
| Admins Paroisse actifs | 12 | Comptes en base |

**Données nationales rappel (base totale, pour contexte) :**

| Entité | Nombre en base |
|--------|---------------|
| Régions synodales | 22 |
| Districts | 137 |
| Paroisses | **553** |
| Ouvriers | 685 |
| Statistiques 2025 | 545 paroisses renseignées |
| Paroisses sans GPS | 127 (22%) |

---

## 22 RÉGIONS SYNODALES OFFICIELLES (noms exacts pour tous les dropdowns)

ADAMAOUA · BAMBOUTOS ET NORD OUEST · CENTRE SUD 1 · CENTRE SUD 2 · EST · HAUT-NKAM · HAUTS-PLATEAUX · KOUNG KHI · MENOUA · MIFI · MOUNGO CENTRE · MOUNGO NORD · MOUNGO SUD ET MEME · NDE & MBAM ET INOUBOU · NKAM · NORD & EXTREME NORD · NOUN NORD · NOUN SUD · SANAGA MARITIME ET OCEAN · WOURI CENTRE · WOURI NORD & SUD-OUEST · WOURI SUD

*(Dans la vue Admin Régional, le dropdown Région n'est jamais affiché — la région est implicite. Ces noms ne servent que comme référence si un composant de contexte en a besoin.)*

---

*Prompt v1 — Conforme aux fichiers de documentation : SPEC_ADMIN_COMPLET.md, GUIDE_BACKEND_COMPLET.md, AUDIT_DONNEES_EEC.md, cahier de charge.md, ANALYSE_ANCIENNE_VERSION.md*
*Projet EEC Géolocalisation — Église Évangélique du Cameroun — Confidentiel*
