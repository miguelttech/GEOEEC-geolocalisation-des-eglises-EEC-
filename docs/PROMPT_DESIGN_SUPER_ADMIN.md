# PROMPT CLAUDE DESIGN — Vue Administrateur Général (Super Admin)
## EEC Géolocalisation — Plateforme Synodale Cameroun

---

## CONTEXTE RAPIDE

Tu vas designer l'espace complet de l'**Administrateur Général** (Super Admin national) de la plateforme **EEC Géolocalisation** — système officiel de géolocalisation des paroisses de l'**Église Évangélique du Cameroun**.

C'est une plateforme institutionnelle sérieuse. Pas une startup SaaS. Pense à un dashboard gouvernemental ou de contrôle aérien : dense, sobre, chaque pixel justifié par sa fonction. Les données dominent. Zéro décoration inutile.

---

## IDENTITÉ VISUELLE — À RESPECTER ABSOLUMENT

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
| Rouge alerte | `#C62828` |
| Orange avertissement | `#E65100` |

### Typographie — RÈGLE STRICTE

- **Space Grotesk 700, letter-spacing -0.03em** → TOUS les grands titres, chiffres de stats, titres de pages. Carrés, serrés, droits, noirs. C'est la police signature.
- **Inter 400/500/600** → tout le reste : corps de texte, labels, tableaux, placeholders. Jamais de letter-spacing positif avec Inter.
- **Fraunces** → uniquement le nom de marque "EEC Cameroun" dans la sidebar (serif élégant).

### Animations

- Hover : 200ms ease sur couleur/background
- Slide panel : translateX(100%)→0, 350ms cubic-bezier(0.4,0,0.2,1)
- Dropdowns : opacity 0→1 + translateY(-4px)→0, 150ms
- Toasts : translateX(100%)→0, 300ms

---

## LAYOUT MAÎTRE (hérite par tous les écrans)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR 240px fixe │  TOPBAR 60px sticky                       │
│  fond #08110B       ├─────────────────────────────────────────── │
│  hauteur 100vh      │  ZONE DE CONTENU (scroll vertical)         │
│                     │  fond #0D1B12  ·  padding 28px 32px        │
└─────────────────────┴─────────────────────────────────────────── ┘
```

---

## SIDEBAR — Détail complet

**Fond :** `#08110B` · border-right `1px solid rgba(245,197,24,0.08)`

**Zone Brand (haut, 72px) :**
- Logo EEC SVG (croix stylisée blanche, 32px) + "EEC Cameroun" en Fraunces 15px blanc + "Console Synodale" Inter 11px rgba(255,255,255,0.50)
- Séparateur bas `rgba(255,255,255,0.08)`

**Zone Admin connecté (padding 16px) :**
- Avatar cercle 38px : fond `rgba(46,151,68,0.25)`, border `rgba(46,151,68,0.50)`, initiales Space Grotesk 14px bold `#2E9744`
- Nom : Inter 13px 600 `#F0F4F1`
- Badge rôle pill : fond `rgba(255,214,0,0.15)`, border `rgba(255,214,0,0.40)`, texte `#FFD600`, Inter 10px 600 uppercase → "SUPER ADMIN"
- Séparateur bas `rgba(255,255,255,0.08)`

**Navigation (groupes + items) :**

```
  PRINCIPAL
    [⊞] Tableau de bord         ← item ACTIF
    [◈] Carte interactive

  GESTION DES DONNÉES
    [✝] Paroisses
    [⬡] Œuvres
    [👤] Ouvriers
    [◎] Régions synodales
    [⬡] Districts

  RAPPORTS & DONNÉES
    [▣] Statistiques
    [⇅] Import / Export

  ADMINISTRATION
    [☰] Comptes utilisateurs
    [≡] Journal d'activité

  ──────────────────────────
  SYSTÈME
    [⚙] Paramètres
    [↪] Déconnexion
```

**Style items navigation :**
- Étiquettes groupes : Inter 10px uppercase letter-spacing 0.10em, `rgba(255,255,255,0.30)`, padding `20px 16px 6px`
- Item inactif : padding `10px 16px`, Inter 13px 500, `rgba(255,255,255,0.65)`, hover → fond `rgba(255,255,255,0.05)` texte `rgba(255,255,255,0.90)`
- Item ACTIF : fond `rgba(255,255,255,0.08)` + `rgba(255,214,0,0.06)`, **border-left 3px solid `#FFD600`**, texte blanc 600, icône `#FFD600`
- Déconnexion : texte `rgba(220,53,69,0.80)`, hover rouge `#DC3545`, border-top `rgba(255,255,255,0.08)`

---

## TOPBAR — Détail complet

**Fond :** `#08110B` · Hauteur 60px · border-bottom `1px solid rgba(245,197,24,0.10)` · padding `0 32px`

**Gauche :**
- Titre page courant : Space Grotesk 18px 700 letter-spacing -0.03em `#F0F4F1`
- Fil d'ariane sous le titre : Inter 12px `rgba(240,244,241,0.45)` — "Accueil / Tableau de bord"

**Droite (flex, gap 20px) :**
- Date heure temps réel : Inter 13px `rgba(240,244,241,0.55)` — "25 mai 2026 — 14:32"
- Cloche notifications : icône bell 20px gris + badge rouge `#C62828` 16px cercle avec "3"
- Avatar 34px + nom abrégé + chevron ▾

---

## ÉCRAN 1 — TABLEAU DE BORD SUPER ADMIN

**Titre topbar :** "Tableau de bord"  
**Fil d'ariane :** "Accueil / Tableau de bord"

### Rangée 1 — 5 Stat cards (grid 5 colonnes)

Structure d'une card :
```
┌────────────────────────────────────────────┐
│ [label catégorie Inter 11px gris]  [icône] │
│                                            │
│ 553                                        │
│ Space Grotesk 36px 700 #F0F4F1             │
│                                            │
│ Paroisses                                  │
│ Inter 13px rgba(240,244,241,0.58)          │
│                                            │
│ ▲ +5 ce mois  [Inter 12px #2E9744]         │
└────────────────────────────────────────────┘
```

Style : fond `rgba(255,255,255,0.04)`, border `1px solid rgba(245,197,24,0.13)`, border-radius 6px, padding 20px. Hover : border-color `rgba(245,197,24,0.28)`.

Les 5 cards :
1. **Régions** · icône compass · **22** · "— données stables" gris
2. **Districts** · icône réseau · **137** · "▲ +2 ce mois" vert
3. **Paroisses** · icône croix · **553** · "▲ +5 ce mois" vert
4. **Œuvres** · icône bâtiment · **311** · "▲ +1 ce mois" vert
5. **Ouvriers** · icône briefcase · **685** · "— données stables" gris

### Rangée 2 — 4 Widgets secondaires (grid 2×2)

**Widget A — Total fidèles (545 statistiques 2025) :**
Chiffre `147,832` Space Grotesk 28px. Sous : "Communiants : 89,450" / "Non-communiants : 58,382" Inter 12px gris. Mention discrète "Données 2025 — 545 paroisses renseignées" Inter 11px gris.

**Widget B — Paroisses sans GPS :**
Chiffre `127` Space Grotesk 28px rouge `#C62828`. "22% du total sans coordonnées" gris. Note secondaire : "5 GPS erronés (hors Cameroun)" en orange très discret. Lien "→ Voir la liste" vert EEC.

**Widget C — Validations en attente :**
Chiffre `7` Space Grotesk 28px orange `#E65100`. "Statistiques soumises à valider". Bouton pill "Traiter" fond `rgba(230,81,0,0.15)`.

**Widget D — Score de performance moyen :**
Chiffre `74%` Space Grotesk 28px vert `#2E9744` (score moyen de complétude des paroisses). Barre de progression colorée dessous. "3 régions sous 50%" en rouge discret. Lien "→ Détail par région".
(Note design : ce score agrège GPS renseigné + stats 2025 + ouvriers + photos — algorithme de performance repris de l'ancienne version GeoEEC)

### Rangée 3 — 4 Graphiques (grid 2×2)

**Graphique 1 (haut-gauche) :**
Type barres horizontales — "Top 10 régions par fidèles". Filtre année dropdown en coin. Barres `#2E9744`. Fond card sombre. Tooltip : fond `#1B2E1F`, border `rgba(245,197,24,0.20)`, chiffre Space Grotesk 14px.

**Graphique 2 (haut-droite) :**
Type donut — "Répartition des œuvres". Centre : `311` Space Grotesk 22px + "œuvres" Inter 11px. Couleurs segments : scolaire=`#1565C0`, médical=`#C62828`, universitaire=`#6A1B9A`, agropastoral=`#E65100`, immeuble=`#455A64`. Légende à droite.

**Graphique 3 (bas-gauche) :**
Type barres groupées — "Niveaux de paroisses (Paroisse / Station / Annexe)" par région.

**Graphique 4 (bas-droite) :**
Type courbe — "Évolution fidèles 2020→2026". Courbe communiants `#2E9744` 2px, courbe non-communiants `rgba(240,244,241,0.45)` 1.5px. Zone sous courbe verte : `rgba(46,151,68,0.08)`.

### Rangée 4 — Mini-carte + Activité récente (grid 60/40)

**Mini-carte (gauche) :**
Leaflet dark theme, vue nationale Cameroun, marqueurs clustérisés verts, hauteur 320px, non-interactive. Bouton en bas card "Ouvrir la carte complète →" Inter 13px vert.

**Activité récente (droite) :**
Titre card "Activité récente" + lien "Voir tout →" droite.
Items (max 6) :
```
[Avatar 30px]  Paul ATEBA — Admin District MIFI     il y a 2h
               [crayon] Modifié Paroisse Bafoussam-Nord
               ─────────────────────────────────────────
[Avatar 30px]  Marie-Claire BIYA                    il y a 5h
               [upload] Importé 12 ouvriers (Excel)
               ─────────────────────────────────────────
[Avatar 30px]  Connexion admin@eec-cameroun.org     il y a 6h
               [shield] IP 197.X.X.X — Yaoundé
```
Séparateur `rgba(255,255,255,0.06)` entre items.

### Rangée 5 — Tableau "Paroisses récemment modifiées"

**Barre au-dessus :**
- Champ recherche gauche (placeholder "Rechercher une paroisse...")
- Filtres : Région (dropdown) / District (dropdown) / GPS (tous/avec/sans)
- Bouton droit : "+ Créer une paroisse" fond `#2E9744` blanc

**Colonnes :** Nom | Région | District | Fidèles | GPS (✅/❌) | Modifié le | Actions (Voir · Modifier · ⋮)

**Style lignes :** hauteur 52px, hover `rgba(255,255,255,0.04)`, nom Inter 14px 500 `#F0F4F1`.

**GPS :** ✅ = pill vert tiny "GPS OK" / ❌ = pill rouge tiny "Manquant"

**Pagination :** "Affichage 1 à 10 sur 693 · [<] [1][2][3] [>] · 10/25/50 par page"

---

## ÉCRAN 2 — LISTE DES PAROISSES

**Titre :** "Paroisses" · **Fil d'ariane :** "Accueil / Paroisses"

### Barre d'outils (56px)

Gauche : "693 paroisses" Space Grotesk 16px.
Droite : [⬆ Importer Excel] (outline) + [⬇ Exporter tout] (outline) + [+ Créer une paroisse] (fond `#2E9744`)

### Barre de filtres

Card padding 12px 16px fond `rgba(255,255,255,0.03)` border border-radius 6px.
Filtres inline : Recherche texte | Région (dropdown) | District (cascade) | Niveau | GPS | Statut | Année stats.
Bouton "Réinitialiser" apparaît si filtre actif.
Si filtré : bandeau "X paroisses trouvées sur 693" fond `rgba(21,101,192,0.08)` border bleu.

### Tableau

**En-têtes (triables — clic sur header) :**
☐ | # | Nom | Région | District | Niveau | Fidèles | Ouvriers | GPS | Complétude | Statut | Modifié | Actions

**Colonne "Complétude" :**
Barre 64×8px, border-radius 4px, fond `rgba(255,255,255,0.10)`.
- <50% : rouge `#C62828`
- 50-79% : orange `#E65100`
- ≥80% : vert `#2E9744`
Tooltip survol : "✅ GPS · ✅ Stats 2025 · ❌ Photos (0/1 min.) · ✅ Ouvriers"

**Colonne "Niveau" :** pill — "PAROISSE" vert / "STATION" orange / "ANNEXE" bleu.

**Colonne "Statut" — 3 états possibles :**
- pill vert "Actif"
- pill gris "Inactif"
- pill orange animée "⏳ En attente" — si une modification a été soumise par un admin district/paroisse et attend validation. Au survol : tooltip "Modification soumise par [Nom] le [date] — cliquez pour valider".

**Colonne "Actions" :** [👁] gris + [✎] vert + [⋮] gris (menu : Exporter PDF · Historique · Désactiver · Supprimer)

Si la paroisse est "En attente de validation", les actions [✅ Valider] [❌ Rejeter] apparaissent directement dans la colonne, en remplacement de [✎].

**Sélection multiple :** Checkbox col 1. Si sélectionné : barre flottante bas "X paroisses — [Exporter Excel] [Exporter PDF] [Désactiver] [Annuler]"

**État vide :**
```
[Icône croix EEC grisée 56px]
Aucune paroisse trouvée
Modifiez vos filtres ou créez une nouvelle paroisse.
[Réinitialiser les filtres]   [+ Créer une paroisse]
```

---

## ÉCRAN 3 — FORMULAIRE PAROISSE (6 ONGLETS)

**Titre :** "Nouvelle paroisse" ou "Modifier — Yaoundé-Centre"

### Header formulaire (sticky)

Fond `#08110B`, border-bottom `rgba(245,197,24,0.10)`, padding 16px 32px.
Gauche : titre Space Grotesk 22px.
Droite : [Annuler] (outline gris) + [Enregistrer brouillon] (outline vert) + [Publier] (fond `#2E9744`)

### Barre des 6 onglets

```
[1. Général ✓] [2. Localisation GPS ✓] [3. Statistiques] [4. Photos] [5. Ouvriers] [6. Œuvres]
```
Onglet actif : fond `rgba(46,151,68,0.15)`, border-bottom `2px solid #2E9744`, texte blanc 600.
Onglet validé : ✓ vert miniature.
Onglet en erreur : indicateur rouge.

### Onglet 1 — Informations générales

**Grille 2 colonnes, gap 20px :**

Col gauche :
- **Nom de la paroisse*** : input
- **Région synodale*** : dropdown (22 régions officielles EEC — liste exacte ci-dessous)
- **Quartier / Localité** : input

**Liste des 22 régions synodales officielles (source : Shapefile EEC + AUDIT données) :**
ADAMAOUA · BAMBOUTOS ET NORD OUEST · CENTRE SUD 1 · CENTRE SUD 2 · EST · HAUT-NKAM · HAUTS-PLATEAUX · KOUNG KHI · MENOUA · MIFI · MOUNGO CENTRE · MOUNGO NORD · MOUNGO SUD ET MEME · NDE & MBAM ET INOUBOU · NKAM · NORD & EXTREME NORD · NOUN NORD · NOUN SUD · SANAGA MARITIME ET OCEAN · WOURI CENTRE · WOURI NORD & SUD-OUEST · WOURI SUD
(Ces noms exacts doivent apparaître dans tous les dropdowns "Région" de l'interface)

Col droite :
- **Niveau*** : segment buttons inline [Paroisse] [Station] [Annexe] — actif : fond `#2E9744` blanc / inactif : transparent border gris
- **District*** : dropdown cascade (se charge selon région)
- **Statut** : toggle switch — Actif (vert) / Inactif (gris)

Pleine largeur :
- **Date de création** : date picker
- **Description / Notes** : textarea 4 lignes
- **Adresse complète** : textarea 2 lignes

**Style des champs :**
- Label : Inter 12px 500 `rgba(240,244,241,0.70)`, margin-bottom 6px
- Input : fond `rgba(255,255,255,0.05)`, border `1px solid rgba(245,197,24,0.15)`, border-radius 6px, padding `10px 14px`, Inter 14px `#F0F4F1`
- Focus : border-color `rgba(46,151,68,0.60)`, box-shadow `0 0 0 3px rgba(46,151,68,0.10)`
- Champs requis : astérisque rouge `*` après label
- Erreur inline : texte `#C62828` Inter 11px + border rouge

### Onglet 2 — Localisation GPS

**2 champs côte à côte :** Latitude* | Longitude* + bouton [📍 Obtenir ma position]

**Badge de validation dynamique (dès que lat+lng renseignés) :**
Zone Cameroun réelle (source : audit des données sources) : lat [1.7°N → 13.1°N], lng [8.5°E → 16.2°E].
- ✅ "Position dans la zone Cameroun" — fond `rgba(46,151,68,0.12)`, border vert, texte vert
- ⚠ "Position hors du Cameroun" — fond `rgba(230,81,0,0.12)`, border orange, texte orange
(Note : 5 paroisses dans la base ont des GPS erronés — Montréal, Kazakhstan, Tchad — ce badge existe pour éviter d'en ajouter de nouveaux)

**Mini-carte Leaflet (400px hauteur) :**
Marqueur vert EEC se déplace en temps réel (debounce 300ms). Zoom +/- disponible.

**Section pliable "Convertir DMS" :**
Input DMS "3°50'52.8\"N 11°30'7.56\"E" + bouton [Convertir] → remplit les champs.

### Onglet 3 — Statistiques

**Sélecteur année proéminent** (dropdown card en haut).

Grille 3 colonnes :
- Communiants : input numérique
- Non-communiants : input numérique
- Total fidèles : champ grisé auto-calculé (comm+non-comm) + toggle "Saisir manuellement"

**Accordion "Statistiques vitales" (déplié par défaut) :**
Grille 4 : Baptêmes | Confirmations | Mariages | Décès

**Accordion "Données financières" (fermé par défaut, icône cadenas) :**
Mention "(confidentiel)" + Offrandes (FCFA) | Dîmes (FCFA)

### Onglet 4 — Galerie Photos

**Zone drag & drop :**
```
┌──────────────────────────────────────────────────────────────┐
│                [Icône upload 48px vert EEC]                  │
│         Déposez vos photos ici ou cliquez pour parcourir     │
│         JPG · PNG · WebP — 5 Mo max — 20 photos max         │
└──────────────────────────────────────────────────────────────┘
```
Fond `rgba(255,255,255,0.03)`, border `2px dashed rgba(245,197,24,0.25)`, border-radius 8px.
Drag over → border-color `rgba(46,151,68,0.60)`, fond `rgba(46,151,68,0.05)`.

**Grille photos 4 colonnes :**
Chaque miniature carrée, border-radius 6px, object-fit cover. Overlay survol : [★ Définir principale] [✕ Supprimer]. Badge "★ Principale" jaune sur la 1ère.

Note bas : "La première photo apparaît sur la fiche publique."

### Onglet 5 — Ouvriers assignés

**Liste items :**
```
┌──────────────────────────────────────────────────────────────┐
│ [Avatar 36px]  Pasteur Jean-Marie EKANGA      [Actif]        │
│                Pasteur principal · Paroisse Y  [Voir] [Retirer] │
└──────────────────────────────────────────────────────────────┘
```
Fond `rgba(255,255,255,0.03)`, border, border-radius 6px, padding 12px.

Boutons sous la liste :
- [+ Assigner un ouvrier existant] → input autocomplete searchable
- [+ Créer un nouvel ouvrier] → lien vers formulaire ouvrier

### Onglet 6 — Œuvres liées

Même structure que l'onglet Ouvriers (liste + [+ Lier] + [+ Créer]).

### Barre sticky bas de formulaire

Fond `#08110B`, border-top `rgba(245,197,24,0.10)`, padding 16px 32px.
Justify-between : [Annuler] à gauche · [Enregistrer brouillon] + [Publier] à droite.

---

## ÉCRAN 4 — GESTION DES COMPTES

**Titre :** "Comptes utilisateurs"

### 4 Mini-stats en haut (grid 4)

Cards compactes (40px hauteur) : Total actifs | Super Admins | Admin Régionaux | Admin District+Paroisse.

### Barre d'outils

Filtres : Recherche | Rôle (dropdown) | Région/District (cascade) | Statut | 2FA.
Bouton droit : [+ Inviter un administrateur] fond `#2E9744` → DÉCLENCHE LE SLIDE PANEL.

### Tableau des comptes

**Colonnes :** Avatar+Nom | Email | Rôle (badge) | Portée | 2FA | Dernière connexion | Statut | Actions

**Badges de rôle :**
- SUPER ADMIN : fond `rgba(255,214,0,0.15)`, texte `#FFD600`, border `rgba(255,214,0,0.30)`
- Admin Régional : fond `rgba(21,101,192,0.15)`, texte `#5B9BD5`, border `rgba(21,101,192,0.30)`
- Admin District : fond `rgba(230,81,0,0.15)`, texte `#E67A2E`, border `rgba(230,81,0,0.30)`
- Admin Paroisse : fond `rgba(46,151,68,0.15)`, texte `#2E9744`, border `rgba(46,151,68,0.30)`

**2FA :** ✓ vert si activée · — gris si non activée (tooltip "2FA non activée")

**Actions :** [👁] [✎] [⋮] → menu : Réinitialiser MDP · Révoquer sessions · Désactiver · Supprimer

---

## ÉCRAN 4B — SLIDE PANEL INVITATION ADMIN (3 ÉTAPES)

*Fonctionnalité signature — inspirée de l'ancienne version GeoEEC*

### Comportement

Overlay `rgba(0,0,0,0.55)` sur la page.
Panel droit : largeur 480px, hauteur 100vh, fond `#0D1B12`, border-left `1px solid rgba(245,197,24,0.20)`.
Animation : `translateX(100%) → translateX(0)`, 350ms `cubic-bezier(0.4,0,0.2,1)`.
Fermeture : ✕ en haut du panel OU clic overlay OU touche Escape.

### En-tête panel (sticky)

Fond `#08110B`, padding 20px 24px, border-bottom `rgba(245,197,24,0.10)`.
Gauche : bouton ✕. Centre : "Inviter un administrateur" Inter 15px 600. Droite : "Étape 2/3" Inter 12px gris.

**Indicateur de progression :**
```
 ●━━━━━━━━━━○━━━━━━━━━━○
 1               2               3
```
Étape courante : cercle fond `#2E9744` blanc. Étapes futures : cercle transparent border gris. Étapes passées : `rgba(46,151,68,0.40)` + ✓.

### Étape 1 — Informations personnelles

Titre : "Informations de l'administrateur" Space Grotesk 18px.

Champs :
- **Nom de famille*** : input
- **Prénom*** : input
- **Adresse e-mail*** : input type email — validation temps réel : spinner pendant vérif → ✓ vert "Email disponible" / ✕ rouge "Déjà utilisé"
- **Téléphone** (optionnel) : input prefixe "+237" gris fixe

Bouton pleine largeur (bas panel) : [Étape suivante : Rôle et portée →] fond `#2E9744`, désactivé si champs vides/invalides.

### Étape 2 — Rôle et portée

Titre : "Rôle et périmètre d'accès" Space Grotesk 18px.

**Sélection rôle — 3 cards radio cliquables :**

```
┌──────────────────────────────────────────────────────────────┐
│  ◎  Admin Régional                                           │
│     Gère une région synodale complète                       │
│     (paroisses, districts, œuvres, ouvriers de sa région)  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  ○  Admin District                                           │
│     Gère un district dans une région                        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  ○  Admin Paroisse                                           │
│     Gère une paroisse spécifique                            │
└──────────────────────────────────────────────────────────────┘
```

Card sélectionnée : border `2px solid #2E9744`, fond `rgba(46,151,68,0.08)`.
Cards non sélectionnées : border `1px solid rgba(245,197,24,0.13)`.

**Sélection portée (apparaît selon rôle, animation opacity+translateY) :**

- Si Régional : Dropdown "Région synodale*" (22 régions)
- Si District : Dropdown "Région*" → Dropdown "District*" (cascade)
- Si Paroisse : Dropdown "Région*" → Dropdown "District*" → Dropdown "Paroisse*" (cascade 3 niveaux)

Boutons : [← Retour] (outline) · [Étape suivante : Permissions →] (fond vert)

### Étape 3 — Permissions personnalisées

Titre : "Permissions et accès" Space Grotesk 18px.

**Récapitulatif étape 2 :**
Bandeau : fond `rgba(46,151,68,0.08)`, border `rgba(46,151,68,0.20)`, border-radius 6px, padding 10px 14px.
"Administrateur Régional · Région Synodale MIFI" Inter 13px vert EEC.

**Permissions — checkboxes groupées :**

```
Gestion des données
  [✓] Peut créer des paroisses dans sa région
  [✓] Peut modifier les paroisses de sa région
  [ ] Peut supprimer des paroisses de sa région
  [✓] Peut créer des œuvres dans sa région
  [ ] Peut supprimer des œuvres

Comptes et accès
  [✓] Peut créer des comptes Admin District
  [✓] Peut créer des comptes Admin Paroisse
  [ ] Peut désactiver des comptes

Données & rapports
  [✓] Peut importer des fichiers Excel
  [✓] Peut exporter les données de sa région
  [ ] Peut valider les statistiques soumises
  [ ] Peut voir le journal d'activité de sa région
```

Style checkbox : case 16px border `rgba(245,197,24,0.30)`, border-radius 3px. Cochée : fond `#2E9744` checkmark blanc. Label Inter 13px `#F0F4F1`.

**Box mot de passe temporaire (fond légèrement différent, border, border-radius 8px) :**
```
Mot de passe temporaire
┌──────────────────────────────────────┐
│  EEc@2026!xK9m#rTp               │[Copier] [↻]│
└──────────────────────────────────────┘
⚠ Affiché une seule fois. L'admin devra le changer à sa 1ère connexion.
```
Fond du champ MDP : `rgba(255,255,255,0.03)`, Inter 14px (uniquement ici, pour le MDP généré).

**Boutons finaux :**
[← Retour] (outline) · [Créer le compte →] (fond `#2E9744`, pleine largeur)

Après création : panel ferme → toast vert "Compte créé. Email envoyé à {email}."

---

## ÉCRAN 5 — STATISTIQUES

**Titre :** "Statistiques"

### Navigation des vues

3 onglets horizontaux : [Vue tableau] [Vue carte] [Vue par région] + dropdown "Année 2025 ▾" à droite.

### Vue tableau

Tableau 22 lignes (une par région) :
Région | Communiants | Non-communiants | Total fidèles | Baptêmes | Mariages | Décès | Ouvriers | Score perf. | Actions

**Colonne "Score de performance" (ajout personnel — algorithme repris de l'ancienne version GeoEEC) :**
Score agrégé sur 100 points par région : GPS renseignés (30pts) + Stats 2025 complètes (30pts) + Ouvriers renseignés (20pts) + Photos présentes (20pts).
Affiché : barre de progression + chiffre "82%" — couleur selon seuil (rouge/orange/vert). Au survol : détail des 4 composantes du score.
Cette colonne est triable — permet d'identifier rapidement les régions qui ont le plus besoin d'attention.

Footer : totaux nationaux en gras.
Boutons export en haut-droite : [PDF] [Excel] [CSV].

### Vue carte choroplèthe

Leaflet dark. Régions colorées : dégradé vert clair → très foncé (plus de fidèles = plus foncé). Tooltip au survol : nom région + chiffres clés. Légende bas-droite.

### Vue par région (arbre dépliable)

```
▼ Région MIFI — 12,450 fidèles — 48 paroisses
   ▼ District BAHAM — 3,200 fidèles — 12 paroisses
      → Paroisse Baham-Centre — 320 fidèles  [Voir] [Stats]
      → Paroisse Baham-Nord — 185 fidèles    [Voir] [Stats]
   ▶ District NKAM — 2,800 fidèles — 9 paroisses
▶ Région CENTRE — 18,200 fidèles — 95 paroisses
```

### Page de validation des statistiques

Route `/admin/statistiques/validation`.
Tableau : Paroisse | District | Région | Soumis par | Date | Année | Fidèles | [✅ Valider] [❌ Rejeter].
Rejet → textarea commentaire obligatoire s'ouvre sous la ligne.

---

## ÉCRAN 6 — IMPORT / EXPORT

**Titre :** "Import / Export"

### 4 onglets import + section export

Onglets : [Import Paroisses] [Import Ouvriers] [Import Œuvres] [Import Shapefile] + card Export séparée à droite.

### Workflow import (stepper 4 étapes)

```
[1. Modèle] ─────► [2. Chargement] ─────► [3. Prévisualisation] ─────► [4. Import]
```

**Étape 1 :** Bouton "⬇ Télécharger le modèle Excel" + lien documentation colonnes.

**Étape 2 :** Zone drag & drop Excel (fond `rgba(255,255,255,0.03)`, border dashed). Limite 10 Mo.

**Étape 3 :**
- Tableau 5 premières lignes avec données parsées
- Alertes si colonnes manquantes (fond rouge discret)
- Résumé : "X paroisses à importer · Y à mettre à jour · Z erreurs"
- Bouton [Télécharger rapport de validation] + [Lancer l'import →]

**Étape 4 — Import en cours :**
```
Import en cours — "paroisses_2026.xlsx"
[██████████████████░░░░░░░] 68%
Ligne 682 / 1003 — Erreurs : 2
[Voir rapport partiel]           [Annuler l'import]
```
Barre : fond `rgba(255,255,255,0.10)`, remplissage `#2E9744`, border-radius 100px.

### Section Export

Checkboxes : [✓] Paroisses / [ ] Œuvres / [ ] Ouvriers / [ ] Statistiques / [ ] Tout.
Filtres : Région | District | Année.
Format radio : [Excel (.xlsx)] [CSV] [PDF — Rapport officiel] [GeoJSON].
Bouton [Générer l'export] fond `#2E9744`.

### Onglet Historique des imports

Tableau : Date | Fichier | Type | Importé par | Lignes OK | Erreurs | [Rapport]

---

## ÉCRAN 7 — JOURNAL D'ACTIVITÉ

**Titre :** "Journal d'activité"

### Filtres

Segment buttons "Période" : [Aujourd'hui] [7 jours] [30 jours] [Personnalisé].
Dropdowns : Type d'action | Utilisateur | Entité.

### Tableau

Colonnes : Date/Heure | Utilisateur | Action (icône colorée) | Entité | Résumé | IP

**Icônes d'action colorées :**
- Connexion : icône login bleu
- Création : icône + vert
- Modification : icône crayon orange
- Suppression : icône trash rouge
- Import : icône upload violet
- Export : icône download gris

**Ligne cliquable → accordion détail :**
```
Action : Modification de paroisse
Utilisateur : Paul ATEBA (Admin District MIFI) · IP : 197.145.XX.XX
Entité : Paroisse Bafoussam-Nord (ID: 247)

Champs modifiés :
  Latitude  : (avant) N/A  →  (après) 5.4740    ← vert
  Longitude : (avant) N/A  →  (après) 10.4180   ← vert
```

---

## ÉCRAN 8 — PARAMÈTRES

**Titre :** "Paramètres"

**5 onglets :** [Profil] [Sécurité] [2FA] [Sessions actives] [Préférences]

### Onglet Profil

Photo de profil (upload carré + prévisualisation ronde). Champs : Nom complet | Email | Téléphone. Bouton [Sauvegarder].

### Onglet Sécurité

**Changement de mot de passe :**
Mot de passe actuel → Nouveau MDP → Confirmer.

Indicateur force du nouveau MDP :
- Barre sous le champ : rouge (faible) → orange (moyen) → vert (fort) → vert foncé (très fort)
- Règles listées :
  - ✓/✗ 12 caractères minimum
  - ✓/✗ Majuscule
  - ✓/✗ Chiffre
  - ✓/✗ Caractère spécial

### Onglet 2FA

**Si non activée :** card informative + bouton [Activer la 2FA].
Après clic → QR Code centré (192×192px) + code secret textuel + input code TOTP 6 chiffres + bouton [Confirmer l'activation] + zones codes de secours (fond `rgba(255,214,0,0.08)` border or discret).

**Si activée :** badge "✅ 2FA activée" + bouton [Désactiver] rouge outline + confirmation modale.

### Onglet Sessions actives

Tableau : Appareil | Navigateur | IP | Localisation | Dernière activité | [Déconnecter].
Bouton bas : [Se déconnecter de toutes les autres sessions] — rouge outline.

### Onglet Préférences

- **Thème :** 3 cards radio [Clair] [Sombre ✓ actif] [Automatique] avec miniature visuelle
- **Format date :** radio [JJ/MM/AAAA ✓] [AAAA-MM-JJ]
- **Fuseau horaire :** dropdown "Afrique/Douala (UTC+1)"
- **Notifications email :** checkboxes : [✓] Validations · [✓] Imports · [ ] Rapport hebdo · [ ] Résumé mensuel

---

## COMPOSANTS PARTAGÉS

### Toasts (haut-droite, empilables max 3)

4 types, largeur 320px, border-left 3px, padding 12px 16px, border-radius 6px :
- Succès : fond `rgba(46,151,68,0.12)`, border `#2E9744`, icône ✓ vert
- Erreur : fond `rgba(198,40,40,0.12)`, border `#C62828`, icône ✕ rouge
- Avertissement : fond `rgba(230,81,0,0.12)`, border `#E65100`, icône ⚠ orange
- Info : fond `rgba(21,101,192,0.12)`, border `#1565C0`, icône ℹ bleu

Animation : translateX(100%)→0, 300ms. Disparition : 5s (erreur : 8s).

### Modale de confirmation suppression

Overlay `rgba(0,0,0,0.60)`. Panel centré 440px, fond `#0D1B12`, border `rgba(245,197,24,0.20)`, border-radius 8px.
```
[Icône trash rouge 40px]

Supprimer la paroisse  (Space Grotesk 20px)

Vous êtes sur le point de supprimer "Yaoundé-Centre".
Cette action est irréversible. Toutes les statistiques
associées seront supprimées.

Pour confirmer, tapez le nom de la paroisse :
[________________________________]

[Annuler]           [Supprimer définitivement]
 outline gris          fond rouge #C62828
```

### Skeleton loaders

Lignes table : rectangles `rgba(255,255,255,0.08)`, shimmer animé.
Cards stat : bloc rectangulaire gris même taille que la card réelle.
Animation : `background linear-gradient` défilant, 1.5s infinite.

### Panneau notifications (cloche topbar)

Dropdown 360px, fond `#08110B`, border `rgba(245,197,24,0.20)`, border-radius 8px, shadow `0 16px 48px rgba(0,0,0,0.6)`.
En-tête : "Notifications (3 non lues)" + [Tout marquer comme lu].
Items (max 5) — non lu : fond `rgba(255,214,0,0.05)` + pastille `●` — lu : fond transparent.
Bas : lien "Voir toutes les notifications →".

---

## POINTS CRITIQUES — NE PAS RATER

1. **Sidebar TOUJOURS fond sombre** (`#08110B`) même en light mode — signature visuelle EEC
2. **Chiffres stat = Space Grotesk 700** — jamais Inter pour les grands chiffres
3. **Slide panel = depuis la droite** (pas modale centrée) — ferme sur clic overlay
4. **Cascade Region→District→Paroisse** anime à l'apparition (opacity + translateY)
5. **Barre or `#FFD553** sur l'item actif sidebar — seul endroit où l'or est vraiment visible
6. **Inputs = fond légèrement distinct** du canvas (`rgba(255,255,255,0.05)`) — pas blanc pur
7. **Graphiques = fond sombre** — jamais fond blanc dans le dark mode
8. **Carte Leaflet = dark theme** (CartoDB Dark Matter ou OpenStreetMap dark)
9. **Complétude des paroisses** = barre de progression colorée (rouge/orange/vert)
10. **Mot de passe temporaire** dans le slide panel = affiché en clair avec [Copier] + [Régénérer]
11. **553 paroisses** (pas 693) — chiffre réellement importé en base de données
12. **127 paroisses sans GPS** (22%) — pas 255 — chiffre issu de l'audit des données sources
13. **"En attente"** = état visible dans le tableau (pill orange) quand une paroisse a une modification soumise par un admin inférieur
14. **Score de performance par région** = colonne supplémentaire dans les stats (4 critères : GPS, stats 2025, ouvriers, photos)
15. **22 régions officielles** = noms exacts dans tous les dropdowns (voir liste section Onglet 1 formulaire paroisse)

---

## DONNÉES RÉELLES EN BASE (pour wireframes réalistes)

Ces chiffres proviennent du GUIDE_BACKEND_COMPLET.md — ce que les APIs retourneront réellement :

| Entité | Nombre en base | Source |
|--------|---------------|--------|
| Régions synodales | 22 | Shapefile EEC importé |
| Districts | 137 | Excel paroisses importé |
| Paroisses | **553** | Feuil2 nettoyée, après filtrage GPS erronés |
| Types d'œuvres | 7 | scolaire/médical/universitaire/agropastoral/immeuble/terrain/autre |
| Œuvres | 311 | Fichier oeuvres pivoté (14 régions sur 22 ont des œuvres) |
| Grades ouvriers | 8 | Évêque/Pasteur/Prédicateur/Évangéliste/Catéchiste/Diacre/Aide-Pasteur/Aide-Évangéliste |
| Ouvriers | 685 | Fichier ouvriers importé |
| Statistiques | 545 | Année 2025 — 545 paroisses sur 553 ont des stats |
| Paroisses sans GPS | 127 | 22% du total |
| Paroisses GPS erronés | 5 | Hors Cameroun (Montréal, Kazakhstan, Tchad, etc.) |

---

*Prompt v2 — corrigé et validé contre tous les fichiers de documentation du projet*  
*Projet EEC Géolocalisation — Église Évangélique du Cameroun — Confidentiel*
