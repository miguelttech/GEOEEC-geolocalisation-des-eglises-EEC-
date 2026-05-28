# PROMPT — Génération du portail Administrateur Régional
## EEC Géolocalisation — Basé sur le modèle Administrateur Général existant

> **Usage :** Copie ce prompt intégralement en début de session. Lis d'abord tous les fichiers indiqués à l'étape 1. Ne génère aucun code avant d'avoir terminé la lecture complète.

---

## 0. CE QUE TU ES

Tu es un ingénieur full-stack senior spécialisé en Next.js 14+ App Router, React 19, TypeScript, Django 5, et systèmes d'administration avec RBAC. Tu travailles sur une plateforme institutionnelle sérieuse commanditée par l'Église Évangélique du Cameroun. Chaque décision technique est justifiée, chaque composant réutilisé plutôt que recréé.

---

## 1. LECTURE OBLIGATOIRE AVANT TOUT CODE

Avant d'écrire une seule ligne, tu dois lire **tous ces fichiers dans cet ordre** et retenir leur contenu intégralement.

### Fichiers frontend Admin Général (la base que tu vas réutiliser)

```
frontend/src/app/admin/layout.tsx
frontend/src/app/admin/admin.css
frontend/src/components/admin/AdminShell.tsx
frontend/src/components/admin/Sidebar.tsx
frontend/src/components/admin/Topbar.tsx
frontend/src/components/admin/atoms.tsx
frontend/src/components/admin/icons.tsx
frontend/src/components/admin/data.ts
frontend/src/app/admin/dashboard/page.tsx
frontend/src/app/admin/paroisses/page.tsx
frontend/src/app/admin/oeuvres/page.tsx
frontend/src/app/admin/ouvriers/page.tsx
frontend/src/app/admin/regions/page.tsx
frontend/src/app/admin/districts/page.tsx
frontend/src/app/admin/stats/page.tsx
frontend/src/app/admin/io/page.tsx
frontend/src/app/admin/comptes/page.tsx
frontend/src/app/admin/journal/page.tsx
frontend/src/app/admin/parametres/page.tsx
```

### Fichiers backend (pour comprendre les permissions réelles)

```
backend/apps/accounts/models.py
backend/apps/accounts/permissions.py
backend/apps/accounts/auth_views.py
backend/apps/geo/models.py
backend/apps/geo/views.py
backend/apps/oeuvres/views.py
backend/apps/ouvriers/views.py
backend/eec_core/urls.py
```

### Documentation

```
docs/SPEC_ADMIN_COMPLET.md       — matrice de permissions RBAC complète (Section 2.2)
docs/PROMPT_DESIGN_ADMIN_REGIONAL.md   — design system et maquettes de l'admin régional
MASTER_PROMPT_Antigravity_EEC_v3.md    — source de vérité du projet
```

---

## 2. CONTEXTE — POURQUOI CE TRAVAIL EST SIMPLE

Le portail Admin Général est **entièrement codé** dans `frontend/src/app/admin/`. Il contient :

- Un **layout** complet (`layout.tsx` + `admin.css`) avec Sidebar, Topbar, AdminShell
- Des **composants atomiques** réutilisables dans `atoms.tsx` (Avatar, Dropdown, StatusPill, NiveauPill, CompleteBar, GpsCell, Widget, HorizontalBars, Donut, StackedBars, LineChart, useOutside…)
- Des **patterns standardisés** : slide-panel view/edit, toast notifications, tableaux paginés, menus contextuels row-menu
- Des **pages CRUD complètes** : paroisses, oeuvres, ouvriers, districts, stats, io, comptes
- Un **design system CSS** dans `admin.css` avec toutes les classes et variables CSS

**Tu ne réinventes rien. Tu copies, tu adaptes, tu filtres.**

---

## 3. PÉRIMÈTRE DE L'ADMINISTRATEUR RÉGIONAL

### 3.1 Identité du rôle

L'Admin Régional est le **responsable d'une région synodale** dans la hiérarchie EEC. Il est créé par l'Admin Général (SUPER). Il administre **exclusivement les données de sa région**.

Dans le modèle Django (`accounts/models.py`) :
```python
user.role == "REGION"
user.region  # FK vers RegionSynodale — c'est sa région, il ne peut pas en sortir
user.district  # null
user.paroisse  # null
```

Dans le backend, la fonction `filter_paroisses_by_scope(queryset, user)` filtre automatiquement les résultats sur `district__region_id = user.region_id` quand `user.role == "REGION"`. Le frontend doit **refléter exactement ce filtrage**.

### 3.2 Ce qu'il voit — scope strict

| Entité | Ce qu'il voit |
|---|---|
| Régions | **Sa région uniquement** — pas de liste de toutes les régions |
| Districts | Tous les districts **de sa région** |
| Paroisses | Toutes les paroisses **de sa région** |
| Œuvres | Toutes les œuvres **de sa région** |
| Ouvriers | Tous les ouvriers **de sa région** |
| Statistiques | Statistiques **de sa région** (districts + paroisses) |
| Comptes | Comptes Admin District et Admin Paroisse **de sa région** |
| Journal | Activités **de sa région** (si permission `peut_voir_journal_region`) |

Il ne voit **jamais** :
- Les autres régions
- Les districts d'autres régions
- Les statistiques nationales globales (il voit des stats mais scopées à sa région)
- Les comptes SUPER ou les comptes d'autres régions

### 3.3 Matrice de permissions (extraite de SPEC_ADMIN_COMPLET.md Section 2.2)

| Action | Admin Régional (REGION) |
|---|---|
| Créer une région | ❌ Interdit |
| Modifier une région | ❌ Interdit |
| Supprimer une région | ❌ Interdit |
| Créer un district dans sa région | ✅ Autorisé — **mais nécessite validation SUPER** |
| Modifier un district de sa région | ✅ Autorisé |
| Supprimer un district | ❌ Interdit |
| Créer une paroisse dans sa région | ✅ Autorisé |
| Modifier une paroisse de sa région | ✅ Autorisé |
| Supprimer une paroisse de sa région | ✅ Autorisé (avec permission `peut_supprimer_paroisse`) |
| Créer/modifier/supprimer une œuvre de sa région | ✅ Autorisé |
| Créer/modifier un ouvrier de sa région | ✅ Autorisé |
| Supprimer un ouvrier de sa région | ✅ Autorisé |
| Gérer les comptes Admin District/Paroisse de sa région | ✅ Autorisé |
| Gérer les comptes SUPER | ❌ Interdit |
| Voir le journal de sa région | ✅ Si `peut_voir_journal_region` dans `permissions_custom` |
| Import/Export de sa région | ✅ Autorisé (données filtrées) |

---

## 4. ARCHITECTURE CIBLE — ROUTES NEXT.JS

Crée un nouveau segment de route `/admin/regional/` distinct du `/admin/` existant.

```
frontend/src/app/admin/regional/
├── layout.tsx                ← Layout propre à l'Admin Régional
├── page.tsx                  ← Redirection → /admin/regional/dashboard
├── dashboard/page.tsx        ← Tableau de bord régional
├── map/page.tsx              ← Carte interactive (filtrée sur sa région)
├── paroisses/page.tsx        ← Gestion paroisses (sa région seulement)
├── oeuvres/page.tsx          ← Gestion œuvres (sa région seulement)
├── ouvriers/page.tsx         ← Gestion ouvriers (sa région seulement)
├── districts/page.tsx        ← Gestion districts (sa région seulement)
├── stats/page.tsx            ← Statistiques (sa région seulement)
├── io/page.tsx               ← Import/Export (données de sa région)
├── comptes/page.tsx          ← Comptes Admin District/Paroisse de sa région
├── journal/page.tsx          ← Journal (sa région, si permission)
└── parametres/page.tsx       ← Paramètres identiques à l'Admin Général
```

**Pourquoi un segment séparé `/admin/regional/` et non `/admin/` directement ?**
Parce que les deux portails coexistent pendant le développement. L'Admin Général reste sur `/admin/`, l'Admin Régional est sur `/admin/regional/`. En production, le middleware Next.js (`middleware.ts`) redirigera chaque utilisateur vers le bon portail selon son `role`.

---

## 5. FICHIERS À CRÉER — INSTRUCTIONS DÉTAILLÉES

### 5.1 Layout (`frontend/src/app/admin/regional/layout.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/layout.tsx`.

**Modifications :**
- Remplace `<Sidebar />` par `<SidebarRegional />` (nouveau composant, voir 5.2)
- Remplace le `metadata.title` : `'Console Régionale — EEC Cameroun'`
- Garde `<AdminShell>`, `<Topbar />`, `admin.css`, tout le reste identique

```tsx
import type { ReactNode } from 'react';
import '../admin.css';                    // même CSS que l'admin général
import SidebarRegional from '@/components/admin/SidebarRegional';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Console Régionale — EEC Cameroun' };

export default function AdminRegionalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <SidebarRegional />
      <div className="admin-main">
        <Topbar />
        <ScopeBanner />          {/* NOUVEAU — bandeau de scope persistant */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </AdminShell>
  );
}
```

Le `ScopeBanner` est un composant persistant présent sur **toutes les pages** de l'Admin Régional. Il rappelle visuellement le scope limité de l'utilisateur.

### 5.2 ScopeBar — composant persistant (`frontend/src/components/admin/ScopeBar.tsx`)

Ce composant est la différence visuelle principale avec l'Admin Général.

```tsx
'use client';
export default function ScopeBar({ regionNom, paroisses, districts }: {
  regionNom: string; paroisses: number; districts: number;
}) {
  return (
    <div style={{
      height: 36, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 32px',
      background: 'rgba(21,101,192,0.06)',
      borderBottom: '1px solid rgba(91,155,213,0.18)',
      fontSize: 12, color: 'rgba(91,155,213,0.80)', fontStyle: 'italic',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CompassIcon size={14} color="#5B9BD5" />
        <strong style={{ fontStyle: 'normal', color: '#5B9BD5' }}>
          Région Synodale {regionNom}
        </strong>
      </span>
      <span>·</span>
      <span>{paroisses} paroisses</span>
      <span>·</span>
      <span>{districts} districts</span>
      <span>·</span>
      <span>Scope limité à votre région</span>
    </div>
  );
}
```

**Données du ScopeBar :** Pour l'instant, utilise des données mock (ex: région "MIFI", 48 paroisses, 12 districts). Prévoie une prop `region` typée pour le branchement backend futur.

### 5.3 Sidebar Régionale (`frontend/src/components/admin/SidebarRegional.tsx`)

**Base :** Copie exacte de `frontend/src/components/admin/Sidebar.tsx`.

**Modifications — uniquement la navigation NAV et le badge de l'utilisateur connecté :**

```tsx
// Remplace la constante NAV par ceci :
const NAV = [
  { group: 'Principal', items: [
    { key: 'dashboard', label: 'Tableau de bord',   icon: 'dashboard' },
    { key: 'map',       label: 'Carte interactive', icon: 'map' },
  ]},
  { group: 'Ma région', items: [       // ← "Ma région" au lieu de "Gestion des données"
    { key: 'paroisses', label: 'Paroisses',          icon: 'church' },
    { key: 'oeuvres',   label: 'Œuvres',             icon: 'hexagon' },
    { key: 'ouvriers',  label: 'Ouvriers',           icon: 'user' },
    { key: 'districts', label: 'Districts',          icon: 'network' },
    // ← PAS d'item "Régions synodales" — il ne gère pas les régions
  ]},
  { group: 'Rapports & données', items: [
    { key: 'stats', label: 'Statistiques',    icon: 'chart' },
    { key: 'io',    label: 'Import / Export', icon: 'swap' },
  ]},
  { group: 'Administration', items: [
    { key: 'comptes', label: 'Comptes (ma région)',  icon: 'users' },
    { key: 'journal', label: "Journal (ma région)",  icon: 'list' },
    // ← "Journal" conditionnel selon permission peut_voir_journal_region
    // Pour l'instant affiché — le backend le filtrera
  ]},
];
```

**Toutes les href doivent pointer vers `/admin/regional/<key>`** (pas `/admin/<key>`).

**Badge de l'utilisateur connecté :**
- Couleur Avatar : fond `rgba(91,155,213,0.20)`, border `rgba(91,155,213,0.45)`, initiales `#5B9BD5`
- Badge rôle : fond `rgba(91,155,213,0.15)`, texte `#5B9BD5`, libellé → `"ADMIN RÉGIONAL"`
- Sous le badge : `"Région MIFI"` (Inter 11px rgba(240,244,241,0.40))

Garde tout le reste de la Sidebar identique (logo EEC, structure, styles).

### 5.4 Dashboard Régional (`frontend/src/app/admin/regional/dashboard/page.tsx`)

**Base :** Copie de `frontend/src/app/admin/dashboard/page.tsx`.

**Modifications — 4 groupes de changements seulement :**

#### A) Stat cards (rangée 1) — remplacer les chiffres nationaux par des chiffres régionaux

```tsx
// Au lieu de : 553 paroisses · 22 régions · 685 ouvriers · stats nationales
// Mettre :
const REGION_STATS = {
  districts: 12,       // districts de la région MIFI
  paroisses: 48,       // paroisses de la région
  ouvriers: 156,       // ouvriers de la région
  fideles: 12450,      // fidèles 2025 de la région
  sansGps: 8,          // paroisses sans GPS dans la région
};
```

Les 4 stat cards deviennent :
1. **Districts** · valeur `12` · sous-label `"dans la Région MIFI"`
2. **Paroisses** · valeur `48` · sous-label en orange `"dont 8 sans GPS (17%)"`
3. **Ouvriers** · valeur `156` · sous-label vert `"▲ +3 ce mois"`
4. **Fidèles 2025** · valeur `12 450` · sous-label gris `"dont 7 890 communiants"`

#### B) Bandeau d'alerte (avant les stat cards) — spécifique à l'admin régional

Ajoute **avant** la première rangée de stat cards un bandeau d'alerte conditionnel :

```tsx
{REGION_STATS.sansGps > 0 && (
  <div style={{
    background: 'rgba(230,81,0,0.08)',
    border: '1px solid rgba(230,81,0,0.25)',
    borderRadius: 6, padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
  }}>
    <I.alert size={18} style={{ color: '#E65100', flexShrink: 0 }} />
    <span style={{ fontSize: 13, color: 'rgba(230,81,0,0.90)', flex: 1 }}>
      <strong>{REGION_STATS.sansGps} paroisses</strong> de votre région n&apos;ont pas encore soumis leurs statistiques 2025.
    </span>
    <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 14px', borderColor: 'rgba(230,81,0,0.35)', color: '#E65100' }}>
      Voir la liste
    </button>
    <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 14px', borderColor: 'rgba(230,81,0,0.35)', color: '#E65100' }}>
      Envoyer une relance
    </button>
  </div>
)}
```

#### C) Tableau des paroisses — retirer la colonne "Région" et le filtre "Toutes régions"

Dans la `ParoissesTable` (composant local) :
- Retire la colonne `<th>Région</th>` du tableau (l'admin régional sait qu'il est dans sa région)
- Retire le `<Dropdown value="Toutes régions" ... />` des filtres
- Garde tous les autres filtres (districts, GPS, statut)

#### D) Widgets du dashboard — remplacer les widgets nationaux par des widgets régionaux

Retire les widgets nationaux et remplace par :

**Widget A — Paroisses sans GPS (ma région)**
```tsx
<Widget
  label="Paroisses sans GPS"
  value="8"
  color="#E65100"
  sub="17% des paroisses de la région"
  note="0 GPS erroné dans MIFI"
  noteColor="#5AC472"
  action="→ Voir et corriger"
/>
```

**Widget B — Validations en attente**
```tsx
// Chiffre "2" orange — Statistiques soumises par les districts, en attente de validation
// Liste discrète dessous : "District BAHAM — soumis il y a 3h"
// Bouton "Traiter maintenant"
```

**Widget C — Score de performance régional**
```tsx
<Widget
  label="Score de performance"
  value="78%"
  color="#2E9744"
  sub="Au-dessus de la moyenne nationale (74%)"
  action="→ Détail par district"
/>
```

**Widget D — Activité récente (ma région)**
```tsx
// Liste des 5 dernières actions dans la région
// Identique au widget activité de l'Admin Général mais filtrée sur la région
```

### 5.5 Page Paroisses (`frontend/src/app/admin/regional/paroisses/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/paroisses/page.tsx`.

**Modifications :**

1. **Supprimer la colonne "Région"** dans le tableau — l'admin régional n'a qu'une seule région
2. **Supprimer le filtre "Toutes régions"** dans les filtres du tableau
3. **Garder le filtre "Tous districts"** — il peut filtrer par district dans sa région
4. **Garder les boutons** : créer, eye (vue), pencil (édition), three-dots (menu)
5. **Dans le `ParoisseFormPanel`** (onglet "Général") :
   - Le dropdown "Région" est **pré-rempli et désactivé** (fixé à sa région, pas modifiable)
   - Le dropdown "District" reste actif (limité aux districts de sa région)

```tsx
// Dans ParoisseFormPanel, onglet Général :
<div>
  <label>Région</label>
  <div className="input" style={{ opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
    <I.compass size={13} />
    Région MIFI  {/* valeur fixe — non modifiable */}
    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>Fixé</span>
  </div>
</div>
```

6. **Dans le `RowMenu`** (menu trois points) : **supprimer l'option "Supprimer"** sauf si le mock simule la permission `peut_supprimer_paroisse`. Ajouter une note visuelle : si cette option existe, elle doit être rouge et afficher une confirmation.

### 5.6 Page Districts (`frontend/src/app/admin/regional/districts/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/districts/page.tsx`.

**Modifications :**

1. **Retirer la colonne "Région"** du tableau (tous les districts sont dans sa région)
2. **Retirer le filtre "Toutes régions"**
3. **Bouton "Créer un district"** : garde-le fonctionnel, mais ajoute un **badge "En attente de validation"** dans le `DistrictFormPanel` — la création d'un district nécessite validation SUPER

Dans le `DistrictFormPanel` header :

```tsx
<div style={{
  background: 'rgba(230,81,0,0.08)',
  border: '1px solid rgba(230,81,0,0.25)',
  borderRadius: 6, padding: '10px 14px', fontSize: 12,
  color: 'rgba(230,81,0,0.90)', display: 'flex', gap: 8, alignItems: 'center',
}}>
  <I.alert size={13} />
  La création d&apos;un district doit être validée par l&apos;Administrateur National avant d&apos;être active.
</div>
```

4. **Dans le `RowMenu`** des districts :
   - **Supprimer** : option absente (l'admin régional ne peut pas supprimer un district)
   - Garder : Modifier, Exporter, Assigner un Admin District

### 5.7 Page Œuvres (`frontend/src/app/admin/regional/oeuvres/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/oeuvres/page.tsx`.

**Modifications :**

1. Supprimer colonne et filtre "Région"
2. Dans `OeuvreFormPanel` : dropdown "Région" pré-rempli et désactivé
3. Garder toutes les autres fonctionnalités identiques (CRUD complet autorisé pour REGION)

### 5.8 Page Ouvriers (`frontend/src/app/admin/regional/ouvriers/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/ouvriers/page.tsx`.

**Modifications :**

1. Supprimer colonne et filtre "Région"
2. Dans `OuvrierFormPanel` : dropdown "Région" pré-rempli et désactivé
3. Garder toutes les autres fonctionnalités identiques

### 5.9 Page Statistiques (`frontend/src/app/admin/regional/stats/page.tsx`)

**Base :** Copie de `frontend/src/app/admin/stats/page.tsx`.

**Modifications importantes :**

1. **Titre de la page** : `"Statistiques — Région MIFI"` au lieu de `"Statistiques Nationales"`
2. **Retirer l'onglet "Vue nationale"** si présent — uniquement la vue régionale
3. **Tableau des statistiques** : affiche les districts de sa région avec leurs paroisses, pas les régions
4. **Colonnes du tableau** : District | Paroisses | Communiants | Non-comm | Total | Ouvriers | Complétude
5. **Panel de détail (eye)** : ouvre `DistrictStatsPanel` (460px) avec les stats du district, identique au pattern `RegionStatsPanel` mais pour un district
6. **Exports** : boutons PDF/Excel/CSV restent fonctionnels (toasts) — les données exportées seront filtrées sur la région côté backend

```tsx
// Structure du tableau regional stats :
// Remplace statsByRegion (données nationales) par statsByDistrict (données régionales mock)
const statsByDistrict = [
  { district: 'BAHAM',     paroisses: 8,  communiants: 1250, noncomm: 890, ... },
  { district: 'BAMILEKE',  paroisses: 12, communiants: 2100, noncomm: 1540, ... },
  { district: 'NKAM',      paroisses: 6,  communiants: 890, noncomm: 620, ... },
  // ... autres districts de MIFI
];
```

### 5.10 Page Import/Export (`frontend/src/app/admin/regional/io/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/io/page.tsx`.

**Modifications :**

1. **Retirer l'onglet "Import Shapefile"** — l'admin régional n'importe pas de shapefiles (permission SUPER)
2. **Dans la section Export** : les entités disponibles sont `paroisses`, `ouvriers`, `oeuvres`, `statistiques`, `districts` (pas "Régions" — il n'exporte pas les données régionales globales)
3. Ajouter une note dans chaque card d'export :
```tsx
<div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
  Filtrées sur la Région MIFI
</div>
```

### 5.11 Page Comptes (`frontend/src/app/admin/regional/comptes/page.tsx`)

**Base :** Copie de `frontend/src/app/admin/comptes/page.tsx`.

**Modifications importantes :**

1. **Filtrage des comptes** : n'afficher que les comptes avec `role = DISTRICT` ou `role = PAROISSE` et dont la portée géographique est dans sa région. Jamais les comptes `SUPER` ni les comptes d'autres régions.
2. **Bouton "Inviter un compte"** (`InvitePanel`) : dans le formulaire, le champ "Rôle" doit être limité à `Admin District` et `Admin Paroisse` uniquement. Pas d'option `SUPER` ni `Admin Régional`.
3. **Dans `AccountViewPanel`** : retirer les boutons "Réinitialiser MDP" et "Révoquer sessions" si ce ne sont pas des actions autorisées pour l'admin régional (ils peuvent les voir mais pas les modifier)
4. **Dans `AccountEditPanel`** : champ "Rôle" limité à District/Paroisse

```tsx
// Options de rôle dans le formulaire d'invitation (admin régional) :
const ROLES_DISPONIBLES = [
  { value: 'DISTRICT', label: 'Admin District' },
  { value: 'PAROISSE', label: 'Admin Paroisse' },
  // Pas de SUPER ni de REGION — l'admin régional ne peut pas créer ces comptes
];
```

### 5.12 Page Journal (`frontend/src/app/admin/regional/journal/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/journal/page.tsx` (si elle existe), sinon créer une page simple.

**Modifications :**
1. Filtrer les logs affichés pour ne montrer que les actions effectuées dans sa région
2. Ajouter une note dans le header : `"Journal d'activité — Région MIFI"`
3. Retirer les filtres globaux (ex: filtre "Toutes régions")

### 5.13 Page Carte (`frontend/src/app/admin/regional/map/page.tsx`)

**Base :** Copie de `frontend/src/app/admin/map/page.tsx`.

**Modifications :**
1. La carte doit être **centrée et zoomée sur sa région** au chargement
2. Ajouter un zoom initial sur les coordonnées approx. de la région MIFI (Ouest Cameroun)
3. Les marqueurs affichés doivent être filtrés sur sa région

### 5.14 Page Paramètres (`frontend/src/app/admin/regional/parametres/page.tsx`)

**Base :** Copie exacte de `frontend/src/app/admin/parametres/page.tsx`.

**Aucune modification nécessaire.** Les paramètres (thème, profil, préférences) sont identiques pour tous les niveaux d'admin.

---

## 6. RÈGLES ABSOLUES D'IMPLÉMENTATION

### 6.1 Ce que tu ne dois jamais faire

- **Ne pas modifier** les fichiers de l'Admin Général (`/admin/` — pas `/admin/regional/`)
- **Ne pas modifier** `EECApp.tsx` (page publique) ni la page de login
- **Ne pas réinventer** des composants qui existent dans `atoms.tsx`
- **Ne pas changer** le design system CSS dans `admin.css`
- **Ne pas recréer** `useToast`, `ToastStack`, les patterns slide-panel — ils sont identiques à l'Admin Général, copie-les directement dans chaque page

### 6.2 Ce que tu dois toujours faire

- **Réutiliser** `admin.css` (import `'../admin.css'` dans le nouveau layout)
- **Réutiliser** `AdminShell`, `Topbar`, `atoms.tsx`, `icons.tsx` — imports identiques
- **Maintenir** le pattern `useToast` + `ToastStack` dans chaque page (copie locale)
- **Maintenir** le pattern slide-panel : `.overlay` + `.slide-panel` + `onClick={e => e.stopPropagation()}`
- **Préfixer avec `_`** les props TypeScript inutilisées dans les destructurations (ex: `paroisse: _p`)
- **Annoter visuellement** les restrictions : champs désactivés avec opacité 0.6, labels "Fixé" ou "Scope limité"

### 6.3 Données mock — convention

Pour chaque page, les données mock doivent refléter le scope régional. Utilise ce pattern :

```tsx
// En haut de chaque page régionale :
const MOCK_REGION = {
  id: 7,
  nom: 'MIFI',
  adminNom: 'Marie-Claire BIYA',
  adminInitials: 'MB',
};

// Les données filtrées sont nommées avec suffixe "Region" pour les distinguer des données globales :
// sampleParoissesRegion (pas sampleParoisses)
// statsByDistrictRegion (pas statsByRegion)
```

---

## 7. GESTION DES ÉTATS DE VALIDATION (DISTRICTS)

La création d'un district par un Admin Régional nécessite une validation SUPER. Le frontend doit préparer cette logique maintenant, avant l'intégration backend.

### 7.1 États possibles d'un district créé par l'Admin Régional

```tsx
type DistrictStatus =
  | 'ACTIF'                  // district confirmé, opérationnel
  | 'EN_ATTENTE_VALIDATION'  // créé par Admin Régional, en attente de validation SUPER
  | 'REFUSE'                 // refusé par le SUPER avec commentaire
  | 'INACTIF';               // désactivé
```

### 7.2 Affichage dans le tableau districts

Ajouter une colonne "Statut" avec des pills colorées :

```tsx
{district.status === 'EN_ATTENTE_VALIDATION' && (
  <span className="pill pill-orange">
    <I.alert size={9}/> En attente validation
  </span>
)}
{district.status === 'REFUSE' && (
  <span className="pill" style={{ background: 'rgba(198,40,40,0.15)', color: '#E55B5B', border: '1px solid rgba(198,40,40,0.30)' }}>
    <I.x size={9}/> Refusé
  </span>
)}
{district.status === 'ACTIF' && (
  <StatusPill statut="actif" />
)}
```

### 7.3 Dans le `DistrictViewPanel`

Si `district.status === 'EN_ATTENTE_VALIDATION'`, afficher une bannière :

```tsx
<div className="card" style={{ padding: '12px 14px', background: 'rgba(230,81,0,0.08)', border: '1px solid rgba(230,81,0,0.25)' }}>
  <div style={{ fontSize: 12, color: 'rgba(230,81,0,0.90)' }}>
    <strong>En attente de validation</strong> — Ce district a été soumis à l&apos;Administrateur National pour approbation.
    Il ne sera pas visible publiquement tant qu&apos;il n&apos;est pas validé.
  </div>
</div>
```

---

## 8. DONNÉES MOCK — STRUCTURE COMPLÈTE

Crée un fichier `frontend/src/components/admin/dataRegional.ts` distinct de `data.ts` existant.

Ce fichier contient des données fictives pour la **Région MIFI** (exemple utilisé dans tout le portail).

```typescript
// dataRegional.ts

export const MOCK_REGION_MIFI = {
  id: 7,
  nom: 'MIFI',
  adminNom: 'Marie-Claire BIYA',
  adminInitials: 'MB',
  adminBg: 'rgba(91,155,213,0.22)',
  adminColor: '#5B9BD5',
  stats: {
    districts: 12,
    paroisses: 48,
    ouvriers: 156,
    fideles: 12450,
    communiants: 7890,
    nonComm: 4560,
    sansGps: 8,
    oeuvres: 24,
    scorePerf: 78,
  }
};

export const DISTRICTS_MIFI = [
  { id: 1, nom: 'BAHAM',     paroisses: 8,  fideles: 2100, ouvriers: 24, status: 'ACTIF' as const },
  { id: 2, nom: 'BAMILEKE',  paroisses: 12, fideles: 3400, ouvriers: 38, status: 'ACTIF' as const },
  { id: 3, nom: 'NKAM',      paroisses: 6,  fideles: 1890, ouvriers: 18, status: 'ACTIF' as const },
  { id: 4, nom: 'HAUT-NKAM', paroisses: 9,  fideles: 2340, ouvriers: 28, status: 'ACTIF' as const },
  { id: 5, nom: 'KOUNG-KHI', paroisses: 7,  fideles: 1560, ouvriers: 20, status: 'EN_ATTENTE_VALIDATION' as const },
  { id: 6, nom: 'MENOUA',    paroisses: 6,  fideles: 1160, ouvriers: 28, status: 'ACTIF' as const },
];

export const PAROISSES_MIFI = [
  // Utilise le même format que sampleParoisses dans data.ts
  // mais toutes avec region: 'MIFI'
  // Assure-toi d'avoir au moins 15 entrées pour un tableau réaliste
];

export const STATS_DISTRICTS_MIFI = [
  { district: 'BAHAM',     paroisses: 8,  communiants: 1250, noncomm: 890,  total: 2140,  ouvriers: 24, baptemes: 34, mariages: 12, completude: 88 },
  { district: 'BAMILEKE',  paroisses: 12, communiants: 2100, noncomm: 1300, total: 3400,  ouvriers: 38, baptemes: 56, mariages: 22, completude: 75 },
  { district: 'NKAM',      paroisses: 6,  communiants: 890,  noncomm: 1000, total: 1890,  ouvriers: 18, baptemes: 28, mariages: 9,  completude: 92 },
  { district: 'HAUT-NKAM', paroisses: 9,  communiants: 1400, noncomm: 940,  total: 2340,  ouvriers: 28, baptemes: 41, mariages: 15, completude: 64 },
  { district: 'KOUNG-KHI', paroisses: 7,  communiants: 870,  noncomm: 690,  total: 1560,  ouvriers: 20, baptemes: 23, mariages: 8,  completude: 55 },
  { district: 'MENOUA',    paroisses: 6,  communiants: 1380, noncomm: 660,  total: 2040,  ouvriers: 29, baptemes: 38, mariages: 11, completude: 90 },
];

export const COMPTES_REGION_MIFI = [
  // Même format que accounts dans data.ts
  // Uniquement les comptes DISTRICT et PAROISSE de la Région MIFI
  // Pas de comptes SUPER
];
```

---

## 9. ORDRE DE GÉNÉRATION RECOMMANDÉ

Génère les fichiers dans cet ordre pour valider progressivement :

1. `frontend/src/components/admin/SidebarRegional.tsx`
2. `frontend/src/components/admin/ScopeBar.tsx` (composant bandeau scope)
3. `frontend/src/components/admin/dataRegional.ts` (données mock régionales)
4. `frontend/src/app/admin/regional/layout.tsx`
5. `frontend/src/app/admin/regional/page.tsx` (redirection simple)
6. `frontend/src/app/admin/regional/dashboard/page.tsx` ← commencer ici pour valider le look
7. `frontend/src/app/admin/regional/paroisses/page.tsx`
8. `frontend/src/app/admin/regional/districts/page.tsx`
9. `frontend/src/app/admin/regional/oeuvres/page.tsx`
10. `frontend/src/app/admin/regional/ouvriers/page.tsx`
11. `frontend/src/app/admin/regional/stats/page.tsx`
12. `frontend/src/app/admin/regional/comptes/page.tsx`
13. `frontend/src/app/admin/regional/io/page.tsx`
14. `frontend/src/app/admin/regional/journal/page.tsx`
15. `frontend/src/app/admin/regional/map/page.tsx`
16. `frontend/src/app/admin/regional/parametres/page.tsx`

---

## 10. CHECKLIST DE VALIDATION AVANT LIVRAISON

Avant de déclarer le portail Admin Régional terminé, vérifie chaque point :

### Visuel
- [ ] Le ScopeBar est visible sur **toutes** les pages (layout)
- [ ] Le badge de rôle dans la Sidebar est **bleu** (`#5B9BD5`), pas doré
- [ ] Le sous-badge affiche le nom de la région (ex: "Région MIFI")
- [ ] La navigation a le groupe "Ma région" (pas "Gestion des données")
- [ ] L'item "Régions synodales" est **absent** de la navigation

### Permissions
- [ ] Aucun tableau n'affiche de données d'autres régions
- [ ] La colonne "Région" est absente de tous les tableaux
- [ ] Le filtre "Toutes régions" est absent de tous les filtres
- [ ] Dans les formulaires, le champ "Région" est pré-rempli et **désactivé**
- [ ] La création d'un district affiche le bandeau "En attente de validation"
- [ ] La suppression d'un district est absente du menu trois points
- [ ] Les comptes SUPER et d'autres régions n'apparaissent pas dans /comptes
- [ ] Le formulaire d'invitation de compte propose uniquement District et Paroisse

### Fonctionnel
- [ ] Tous les slide-panels (view/edit) fonctionnent sur toutes les pages
- [ ] Les toasts s'affichent correctement sur toutes les pages
- [ ] Les menus row-menu fonctionnent
- [ ] Le bouton "Créer" ouvre le FormPanel
- [ ] Les thèmes dark/light fonctionnent (AdminShell partagé)
- [ ] La navigation entre onglets fonctionne sans erreur TypeScript

### TypeScript
- [ ] Pas d'erreur de compilation (`npm run build` passe)
- [ ] Les props inutilisées sont préfixées `_`
- [ ] Pas de `any` là où un type précis est possible

---

## 11. CONTRAINTE FINALE ABSOLUE

**Ne touche jamais :**
- `frontend/src/components/eec/EECApp.tsx` — page publique intouchable
- `frontend/src/app/admin/**` — le portail Admin Général est terminé, ne le modifie pas
- La page de login

**Le portail Admin Régional vit entièrement dans `frontend/src/app/admin/regional/`.**
Tout nouveau fichier doit être dans ce dossier ou dans `frontend/src/components/admin/` (avec un nom explicitement lié au portail régional : `SidebarRegional.tsx`, `ScopeBar.tsx`, `dataRegional.ts`).

---

*Ce prompt est la source de vérité pour la génération du portail Admin Régional. Suis-le à la lettre, dans l'ordre donné, sans déviation architecturale.*
