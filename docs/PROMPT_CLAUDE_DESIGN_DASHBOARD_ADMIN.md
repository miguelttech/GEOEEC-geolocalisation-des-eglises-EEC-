# PROMPT CLAUDE DESIGN — Dashboard Administrateur EEC Géolocalisation
## Version complète et définitive — 26 mai 2026

---

## PRÉAMBULE — CONTEXTE DU PROJET

Tu vas concevoir l'interface complète du **module administrateur** de la plateforme **EEC Géolocalisation** — le système de géolocalisation officiel des paroisses, œuvres et ouvriers de l'**Église Évangélique du Cameroun (EEC)**.

L'EEC est une institution protestante camerounaise fondée en 1957, organisée en **22 régions synodales**, **137 districts**, **693 paroisses**, **311 œuvres** (écoles, hôpitaux, universités, terrains) et **685 ouvriers** (pasteurs, évangélistes, diacres).

Cette plateforme est une application web institutionnelle sérieuse, déployée à l'échelle nationale, utilisée quotidiennement par des administrateurs synodaux pour gérer toutes les données géographiques et statistiques de l'Église.

**Stack technique :**
- Frontend : Next.js 16 App Router, CSS custom (zero Tailwind dans l'admin)
- Backend : Django + GeoDjango + PostGIS
- Carte : Leaflet.js + MarkerCluster
- Graphiques : Recharts

**Ce qui existe déjà (ne pas modifier) :**
1. Page publique principale avec carte Leaflet (fond sombre, navbar verte, marqueurs clustérisés)
2. Page de connexion admin — split layout : image plein-fond à gauche + formulaire à droite. Fond noir-vert `#0D1B12`, typographie Space Grotesk, border or `rgba(245,197,24,0.13)`
3. Système de polices : Space Grotesk (titres), Inter (corps), Fraunces (brand serif)

**Ce que tu dois concevoir :** Tout l'espace administrateur — du layout global jusqu'à chaque composant, chaque état, chaque interaction.

---

## SECTION 1 — IDENTITÉ VISUELLE OBLIGATOIRE

### 1.1 Palette dark mode (mode par défaut)

| Rôle | Valeur | Usage |
|------|--------|-------|
| Canvas principal | `#0D1B12` | Background de toute la zone de contenu |
| Sidebar / topbar | `#08110B` | Navigation latérale et barre supérieure |
| Surface cards | `rgba(255,255,255,0.04)` | Fond des cards, panels, sections |
| Surface hover | `rgba(255,255,255,0.07)` | Lignes de tableau au survol |
| Border standard | `rgba(245,197,24,0.13)` | Bordures des cards, séparateurs |
| Border active | `rgba(245,197,24,0.30)` | Bordures des éléments focusés / actifs |
| Texte principal | `#F0F4F1` | Titres, labels importants |
| Texte secondaire | `rgba(240,244,241,0.58)` | Sous-titres, métadonnées, placeholders |
| Texte désactivé | `rgba(240,244,241,0.30)` | Éléments inactifs |
| Vert EEC primaire | `#2E9744` | Boutons principaux, badges succès, liens actifs |
| Vert EEC sombre | `#1B5E20` | Sidebar light mode, hover sur vert primaire |
| Or EEC accent | `#FFD600` | Item actif sidebar (barre gauche), highlights |
| Or EEC fond | `rgba(255,214,0,0.10)` | Background léger du badge actif sidebar |
| Rouge alerte | `#C62828` | Erreurs, suppressions, alertes critiques |
| Rouge fond | `rgba(198,40,40,0.12)` | Background messages d'erreur |
| Orange avertissement | `#E65100` | Warnings, données incomplètes |
| Bleu info | `#1565C0` | Informations, liens neutres |

### 1.2 Palette light mode

| Rôle | Valeur |
|------|--------|
| Canvas | `#F4F7F5` |
| Sidebar | `#1B5E20` (vert EEC — identique en dark) |
| Cards | `#FFFFFF`, border `rgba(0,0,0,0.08)` |
| Texte principal | `#1A2318` |
| Texte secondaire | `#5F6B63` |
| Hover table | `#F0F7F1` |
| Topbar | `#FFFFFF`, border-bottom `rgba(0,0,0,0.08)` |

### 1.3 Typographie — RÈGLE ABSOLUE

**Space Grotesk** (variable CSS : `--font-display`) :
- Utilisé sur : tous les grands chiffres de stats, tous les titres de sections H1/H2, les titres de pages, les éléments de marque fort
- Style obligatoire : `font-weight: 700`, `letter-spacing: -0.03em`
- Ces lettres sont carrées, droites, serrées, noires — elles dominent visuellement
- Tailles : chiffres stat = 36px, titres page = 24px, titres section = 18-20px

**Inter** (variable CSS : `--font-inter`) :
- Utilisé sur : tout le corps de texte, labels, descriptions, métadonnées, contenus de tableaux, placeholders, sous-titres
- Style : `font-weight: 400` (corps) / `500` (labels) / `600` (semi-bold discret)
- Jamais de letter-spacing positif avec Inter

**Fraunces** (variable CSS : `--font-fraunces`) :
- Utilisé uniquement sur : le nom de marque "EEC Cameroun" dans la sidebar (style serif élégant)
- Style : italic possible, weight 400-500

**INTERDICTIONS typographiques :**
- Ne jamais utiliser de police monospace (`JetBrains Mono`) pour les titres ou sous-titres de navigation
- Ne jamais mettre `letter-spacing` positif (espacé) sur les sous-titres de section — cela donne un effet "code" non désiré
- Les étiquettes de groupes sidebar (`PRINCIPAL`, `DONNÉES`, etc.) : Inter 11px, uppercase, `letter-spacing: 0.08em`, couleur `rgba(255,255,255,0.35)`

### 1.4 Espacement et géométrie

- Border-radius global : `6px` (cards, inputs, boutons standard)
- Border-radius modales : `8px`
- Border-radius pills / badges : `100px`
- Border-radius avatars : `50%`
- Grille principale : `gap: 20px` entre les sections
- Padding interne des cards : `20px 24px`
- Hauteur lignes de tableau : `52px`
- Hauteur topbar : `60px`
- Largeur sidebar : `240px` (fixe, non rétractable sauf mobile)

### 1.5 Micro-animations

- Transitions hover : `200ms ease` sur couleur, background, opacity
- Slide panel d'invitation : `transform translateX(100%) → translateX(0)`, `350ms cubic-bezier(0.4, 0, 0.2, 1)`
- Apparition des dropdowns : `opacity 0→1` + `translateY(-4px)→0`, `150ms ease`
- Toast notifications : `translateX(100%) → translateX(0)`, `300ms ease`
- Skeleton loader : shimmer animé `background linear-gradient` défilant
- Aucune animation de rotation ou de bounce — style institutionnel, pas ludique

### 1.6 Principe esthétique global

**Futuriste institutionnel.** Dense, professionnel, sobre. Pense à un dashboard de contrôle aérien ou gouvernemental — données qui dominent, zéro décoration superflu. Chaque élément justifie sa présence par sa fonction. Les graphiques sont des outils d'analyse, pas des décorations. Les tableaux sont denses mais lisibles. Le vert EEC et l'or sont des signaux, pas des tendances.

---

## SECTION 2 — LAYOUT GLOBAL (STRUCTURE MAÎTRESSE)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR 240px fixe, hauteur 100vh, ne scroll pas                        │
│  fond #08110B / overflow-y: auto si contenu long                         │
├──────────────────────────────────────────────────────────────────────────┤
│  TOPBAR 60px, position sticky top:0, z-index: 100                        │
│  fond #08110B, border-bottom rgba(245,197,24,0.10)                       │
├──────────────────────────────────────────────────────────────────────────┤
│  ZONE DE CONTENU PRINCIPALE                                               │
│  fond #0D1B12, padding: 28px 32px                                        │
│  scroll vertical indépendant                                              │
│  max-width: aucune contrainte — occupe tout l'espace restant             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Disposition réelle (CSS Grid) :**
```
display: grid;
grid-template-columns: 240px 1fr;
grid-template-rows: 60px 1fr;
height: 100vh;

Sidebar : row 1 / span 2, col 1
Topbar  : row 1, col 2
Contenu : row 2, col 2 — overflow-y: scroll
```

---

## SECTION 3 — SIDEBAR : ANATOMIE COMPLÈTE

### 3.1 Zone Brand (haut de sidebar)

Hauteur : 72px, padding : 0 16px, display: flex, align-items: center, gap: 12px.

Élément gauche : Logo EEC SVG (croix stylisée) blanc pur, 32×32px.

Élément droite (2 lignes) :
- Ligne 1 : "EEC Cameroun" — Fraunces, 15px, weight 500, blanc pur
- Ligne 2 : "Console Synodale" — Inter, 11px, `rgba(255,255,255,0.50)`

Séparateur bas : `border-bottom: 1px solid rgba(255,255,255,0.08)`

### 3.2 Zone Admin connecté

Padding : 16px, display: flex, gap: 12px, align-items: center.

Avatar : cercle 38px, fond `rgba(46,151,68,0.25)`, border `1px solid rgba(46,151,68,0.50)`. À l'intérieur : initiales en Space Grotesk 14px bold couleur `#2E9744`, ou photo de profil si définie.

Texte droite :
- Nom complet — Inter 13px, weight 600, `#F0F4F1`
- Badge rôle — pill arrondie, fond `rgba(255,214,0,0.15)`, border `rgba(255,214,0,0.40)`, texte `#FFD600`, Inter 10px weight 600 uppercase, ex: "SUPER ADMIN" / "RÉG. MIFI" / "DISTRICT BAHAM" / "PAROISSE"

Séparateur bas : `1px solid rgba(255,255,255,0.08)`

### 3.3 Navigation principale — Structure complète

**Groupes et items (SUPER ADMIN — vue complète) :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCIPAL
  [⊞] Tableau de bord
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTÈME
  [⚙] Paramètres
  [↪] Déconnexion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Style d'un item de navigation inactif :**
- Padding : `10px 16px`, display flex, gap 10px, align-items center
- Couleur texte : `rgba(255,255,255,0.65)`, Inter 13px weight 500
- Icône : SVG 16×16px, même couleur
- Border-radius : `6px`
- Transition : 150ms ease

**Style d'un item de navigation au survol :**
- Background : `rgba(255,255,255,0.05)`
- Texte : `rgba(255,255,255,0.90)`
- Icône : `rgba(255,255,255,0.90)`

**Style d'un item de navigation ACTIF :**
- Background : `rgba(255,255,255,0.08)` + `rgba(255,214,0,0.06)`
- Border-left : `3px solid #FFD600`
- Texte : `#FFFFFF`, weight 600
- Icône : `#FFD600`
- Padding-left réduit de 3px pour compenser la barre

**Étiquettes de groupe :**
- Inter, 10px, `letter-spacing: 0.10em`, uppercase
- Couleur : `rgba(255,255,255,0.30)`
- Padding : `20px 16px 6px 16px`
- Jamais de barre de séparation visible pour les étiquettes — l'espacement suffit

**Bouton Déconnexion :**
- Affiché en bas de sidebar, séparé par un `border-top: 1px solid rgba(255,255,255,0.08)`
- Texte rouge discret : `rgba(220,53,69,0.80)`, hover → `#DC3545`
- Icône de sortie (arrow-right-from-bracket)

### 3.4 Navigation adaptée selon le rôle

**Admin Régional — sidebar :**
```
PRINCIPAL
  Tableau de bord
  Carte de ma région

MA RÉGION : [NOM RÉGION EN MAJUSCULES]
  Paroisses
  Œuvres
  Ouvriers
  Districts

DONNÉES
  Statistiques
  Import / Export

ADMINISTRATION
  Comptes (district + paroisse)
  Journal (ma région)

Paramètres / Déconnexion
```

**Admin District — sidebar :**
```
PRINCIPAL
  Tableau de bord

MON DISTRICT : [NOM DISTRICT]
  Mes Paroisses
  Mes Œuvres
  Mes Ouvriers

DONNÉES
  Statistiques
  Documents

Paramètres / Déconnexion
```

**Admin Paroisse — sidebar :**
```
PRINCIPALE
  Ma Paroisse : [NOM]
  Mes Statistiques
  Mes Ouvriers
  Mes Œuvres
  Ma Galerie

CONSULTATION (lecture seule)
  Statistiques nationales
  Carte publique

Paramètres / Déconnexion
```

---

## SECTION 4 — TOPBAR : ANATOMIE COMPLÈTE

Hauteur : 60px fixe. Fond : `#08110B`. Border-bottom : `1px solid rgba(245,197,24,0.10)`. Padding horizontal : `24px 32px`.

**Partie gauche :**
- Titre de la page courante — Space Grotesk, 18px, weight 700, letter-spacing -0.03em, `#F0F4F1`
- En dessous (optionnel) : fil d'Ariane — Inter, 12px, `rgba(240,244,241,0.45)`. Format : "Accueil / Paroisses / Yaoundé-Centre". Chaque niveau est cliquable, séparateur ` / ` gris.

**Partie droite (flex, gap 20px, align-items center) :**

1. Date et heure en temps réel : Inter, 13px, `rgba(240,244,241,0.55)`, format "25 mai 2026 — 14:32"

2. Cloche notifications :
   - Icône bell SVG 20px, couleur `rgba(240,244,241,0.65)`
   - Badge rouge en haut-droite : cercle 16px, fond `#C62828`, Inter 10px bold, blanc. Affiché uniquement si count > 0.
   - Au clic : dropdown panel de notifications (voir Section 13)

3. Avatar + menu admin :
   - Cercle 34px (même style que sidebar)
   - Nom abrégé : Inter 13px weight 500
   - Chevron down : `rgba(240,244,241,0.50)`
   - Au clic : menu dropdown — "Mon profil", "Paramètres", séparateur, "Déconnexion"

---

## SECTION 5 — TABLEAU DE BORD SUPER ADMIN

**Route :** `/admin/dashboard`
**Titre page :** "Tableau de bord"

### 5.1 Rangée 1 — 5 Stat cards principales

Grille : `grid-template-columns: repeat(5, 1fr)`, gap 16px.

**Structure d'une stat card :**
```
┌──────────────────────────────────────────────────────┐
│  [Icône catégorie 20px]              [Icône 28px]    │
│  couleur rgba(255,255,255,0.50)      vert EEC        │
│                                                      │
│  693                                                 │
│  Space Grotesk, 36px, 700, letter-spacing -0.03em    │
│  couleur #F0F4F1                                     │
│                                                      │
│  Paroisses                                           │
│  Inter, 13px, rgba(240,244,241,0.58)                 │
│                                                      │
│  ▲ +5 ce mois                                        │
│  Inter, 12px, #2E9744 si positif / #C62828 si négatif│
│  "— données stables" si pas de variation             │
└──────────────────────────────────────────────────────┘
```

Style card : fond `rgba(255,255,255,0.04)`, border `1px solid rgba(245,197,24,0.13)`, border-radius 6px, padding 20px.

Hover card : `border-color: rgba(245,197,24,0.28)`, transition 200ms.

Les 5 cards dans l'ordre :
1. **Régions** — icône compass — valeur : 22 — "— données stables"
2. **Districts** — icône network — valeur : 137 — "+2 ce mois"
3. **Paroisses** — icône croix — valeur : 693 — "+5 ce mois"
4. **Œuvres** — icône bâtiment — valeur : 311 — "+1 ce mois"
5. **Ouvriers** — icône briefcase — valeur : 685 — "— données stables"

### 5.2 Rangée 2 — 4 Widgets secondaires

Grille 2×2 (ou 4 colonnes) :

**Widget A — Total fidèles :**
Chiffre principal : `147,832` en Space Grotesk 28px. Sous-ligne : "Communiants : 89,450" / "Non-communiants : 58,382" en Inter 12px.

**Widget B — Paroisses sans GPS :**
Chiffre : `255` en Space Grotesk 28px rouge `#C62828`. Sous-ligne : "37% du total sans coordonnées". Lien : "→ Voir la liste" en vert EEC.

**Widget C — Validations en attente :**
Chiffre : `7` en Space Grotesk 28px orange `#E65100`. Sous-ligne : "Statistiques soumises à valider". Bouton pill : "Traiter" fond orange discret.

**Widget D — Dernière mise à jour :**
Texte : "23 mai 2026, 09:15" Inter 14px. Sous-ligne : "par Jean-Marie EKANGA" gris.

### 5.3 Graphiques — Section principale

Titre de section : "Statistiques & Analyse" — Space Grotesk 20px 700.

Grille 2×2, gap 20px.

**Graphique 1 (haut-gauche) — Top 10 régions par fidèles :**
Type : barres horizontales. Titre : "Fidèles par région". Filtre année : dropdown en haut-droite de la card. Barres couleur `#2E9744`, texte régions Inter 12px blanc. Tooltip au survol : fond `#1B2E1F`, border `rgba(245,197,24,0.20)`, chiffre en Space Grotesk 14px.

**Graphique 2 (haut-droite) — Types d'œuvres :**
Type : donut. Centre : nombre total `311` en Space Grotesk 22px + label "œuvres" Inter 11px. Couleurs des segments :
- Scolaire : `#1565C0`
- Médical : `#C62828`
- Universitaire : `#6A1B9A`
- Agropastoral : `#E65100`
- Immeuble : `#455A64`
- Terrain : `#5D4037`
- Autre : `#37474F`
Légende à droite de la card avec pastilles colorées + pourcentages.

**Graphique 3 (bas-gauche) — Niveaux des paroisses :**
Type : barres groupées. Groupes : Paroisse / Station / Annexe. Axe X : top 6 régions. Permet comparaison inter-régionale.

**Graphique 4 (bas-droite) — Évolution annuelle des fidèles :**
Type : courbe. Axe X : 2020 → 2026. Deux courbes :
- Communiants : `#2E9744`, épaisseur 2px, points aux années
- Non-communiants : `rgba(240,244,241,0.45)`, épaisseur 1.5px
Fond de la card sombre. Zone sous la courbe verte : `rgba(46,151,68,0.08)`.

### 5.4 Rangée basse — Carte + Activité

Grille : `grid-template-columns: 1fr 380px`, gap 20px.

**À gauche — Mini-carte Leaflet :**
Hauteur : 320px. Vue nationale Cameroun, tous les marqueurs actifs (clustérisés). Non-interactive (scrollWheelZoom: false). Fond de carte : OpenStreetMap dark. En bas de la card : bouton "Ouvrir la carte complète →" en Inter 13px vert EEC.

**À droite — Activité récente :**
Titre card : "Activité récente" + lien "Voir tout →" aligné droite.

Chaque item d'activité :
```
┌─────────────────────────────────────────────────────────┐
│  [Avatar initiales 30px]  Nom Admin — il y a 2h         │
│                           [Icône action] Description     │
│                           Entité concernée en vert EEC   │
└─────────────────────────────────────────────────────────┘
```
Séparateur `1px solid rgba(255,255,255,0.06)` entre items. Max 6 items.

Types d'icônes d'action : crayon (modification), + (création), trash (suppression), upload (import), download (export), login (connexion).

### 5.5 Tableau — Paroisses récentes

**Barre au-dessus du tableau :**
- Champ recherche à gauche (icône loupe) — placeholder "Rechercher une paroisse..."
- Filtres inline : Région (dropdown) / District (dropdown cascade) / GPS (tous/avec/sans)
- Bouton droit : "+ Créer une paroisse" — fond `#2E9744`, texte blanc, Inter 13px, border-radius 6px

**En-têtes de colonnes (cliquables pour tri) :**
Nom | Région | District | Fidèles | GPS | Modifié le | Actions

**Style d'une ligne :**
- Hauteur : 52px
- Hover : `rgba(255,255,255,0.04)`
- Nom paroisse : Inter 14px weight 500 `#F0F4F1`
- GPS colonne : ✅ badge vert ou ❌ badge rouge
- Actions : [Voir] [Modifier] [⋮] en Inter 12px, couleur vert/blanc/gris

**Pagination :**
Barre sous le tableau : "Affichage de 1 à 10 sur 693 paroisses" à gauche. Contrôles pagination à droite : |< < [pages] > >|. Sélecteur "10 / 25 / 50 par page" à droite.

---

## SECTION 6 — TABLEAU DE BORD ADMIN RÉGIONAL

**Route :** `/admin/dashboard` (même URL — contenu adapté par le rôle)

### 6.1 Badge contextuel sous la topbar

Bandeau subtil (hauteur 36px, fond `rgba(46,151,68,0.08)`, border-bottom `rgba(46,151,68,0.20)`) :
"Région Synodale MIFI — 48 paroisses · 28 districts · 156 ouvriers · Année 2025"
Inter 13px, couleur `rgba(240,244,241,0.70)`.

### 6.2 Stat cards adaptées (4 cards, pas 5)

Uniquement : Paroisses de ma région | Œuvres de ma région | Ouvriers de ma région | Districts de ma région.
Chaque card avec le filtre automatique. Pas de card "Régions" (sans objet).

### 6.3 Graphiques spécifiques

- **Classement de mes districts par fidèles** (barres horizontales)
- **Répartition types d'œuvres dans ma région** (donut identique au national)
- **Évolution annuelle — ma région uniquement** (courbe)
- **Validations en attente dans ma région** (widget alerte)

### 6.4 Carte centrée

Mini-carte Leaflet centrée sur la bounding box de la région. Contour de la région dessiné en polygone vert. Marqueurs de ses paroisses uniquement.

---

## SECTION 7 — TABLEAU DE BORD ADMIN DISTRICT

**Route :** `/admin/dashboard`

### 7.1 En-tête contextuel

"District [NOM DISTRICT] — Région [NOM RÉGION]  ·  X paroisses · Y œuvres · Z ouvriers"

### 7.2 Contenu spécifique

3 stat cards : Paroisses / Œuvres / Ouvriers de son district.

**Widget important :** Liste de ses paroisses avec indicateur GPS — chaque ligne : nom paroisse + ✅ GPS ou ❌ GPS manquant + lien "Ajouter GPS" si manquant.

**Widget d'alerte :** "X paroisses sans statistiques 2025" avec bouton "Saisir les statistiques".

---

## SECTION 8 — TABLEAU DE BORD ADMIN PAROISSE

**Route :** `/admin/dashboard` — Vue directe sur sa paroisse.

La page s'ouvre directement sur la fiche complète de sa paroisse (pas de stat cards de l'EEC national).

**Sections de la fiche (sa paroisse) :**

Bloc titre : Nom de la paroisse en Space Grotesk 28px + badge niveau (Paroisse/Station/Annexe) + région + district.

Section stats actuelles : Communiants / Non-communiants / Total fidèles / Ouvriers — en 4 petites cards horizontales.

Bouton "Modifier les informations" si il a les droits — sinon "Proposer une modification (→ soumis au district)".

Section Mes statistiques : formulaire de saisie annuelle simplifié.
Section Mes ouvriers : liste + bouton "Signaler un ouvrier".
Section Mes œuvres : liste en lecture seule.
Section Mes photos : galerie + upload.

**Widget "Position dans l'EEC" :**
```
STATISTIQUES NATIONALES — 2025

Total fidèles national : 147,832
Votre région (MIFI) : 12,450 fidèles — Rang 3ème national
Votre district (BAHAM) : 3,200 fidèles — Rang 2ème de la région
Votre paroisse : 511 fidèles
```
En lecture seule, fond légèrement différent pour marquer le contexte.

---

## SECTION 9 — PAGE LISTE DES PAROISSES

**Route :** `/admin/paroisses`
**Titre :** "Paroisses"
**Fil d'ariane :** "Accueil / Paroisses"

### 9.1 Barre d'outils

Hauteur 56px, fond légèrement plus clair que le canvas, border-bottom.

À gauche : compteur "693 paroisses" en Space Grotesk 16px.

À droite (flex gap 10px) :
1. Bouton "⬆ Importer Excel" — outline, Inter 13px, icône upload
2. Bouton "⬇ Exporter tout" — outline, Inter 13px, icône download
3. Bouton "+ Créer une paroisse" — fond `#2E9744`, blanc, Inter 13px 600, icône +

### 9.2 Barre de filtres

Ligne de filtres horizontaux (fond `rgba(255,255,255,0.03)`, border, border-radius 6px, padding 12px 16px) :

- Recherche texte (icône loupe, placeholder "Nom, localité, district...")
- Région (dropdown — 22 régions + "Toutes")
- District (dropdown cascade selon région sélectionnée)
- Niveau (dropdown — Paroisse / Station / Annexe / Tous)
- GPS (dropdown — Tous / Avec GPS / Sans GPS)
- Statut (toggle — Actif / Inactif)
- Année stats (dropdown — 2020 → 2026)
- Bouton "Réinitialiser les filtres" (apparaît si filtre actif)

Sous les filtres si résultats filtrés : bandeau bleu discret "X paroisses trouvées sur 693".

### 9.3 Tableau des paroisses

**En-têtes (triables) :**

| # | Nom | Région | District | Niveau | Fidèles | Ouvriers | GPS | Complétude | Statut | Modifié | Actions |

**Colonne "Complétude" :**
Barre de progression horizontale (64px×8px, border-radius 4px). Fond `rgba(255,255,255,0.10)`. Remplissage :
- <50% : `#C62828` (rouge)
- 50-79% : `#E65100` (orange)
- ≥80% : `#2E9744` (vert)

Tooltip au survol détaillant les critères manquants.

**Colonne "GPS" :**
- ✅ : badge pill vert tiny "GPS OK"
- ❌ : badge pill rouge tiny "Manquant"

**Colonne "Statut" :**
- Actif : pill vert EEC
- Inactif : pill gris

**Colonne "Actions" :**
Trois boutons icon-only :
- Œil (voir) — gris
- Crayon (modifier) — vert EEC
- Trois points (⋮) — menu contextuel : Exporter PDF, Historique, Désactiver, Supprimer

**Sélection multiple :**
Checkbox en colonne 1. Si ≥1 sélectionné : barre d'actions flottante en bas de page (style "action bar") : "X paroisses sélectionnées — [Exporter Excel] [Exporter PDF] [Désactiver] [Annuler]".

### 9.4 États vides et chargement

**Skeleton loader (chargement) :**
8 lignes de tableau avec shimmer — rectangles gris animés à la place des données.

**État vide (aucun résultat de filtre) :**
```
[Icône croix EEC grisée, 64px]
Aucune paroisse trouvée
Essayez de modifier vos critères de recherche ou de créer une nouvelle paroisse.
[Réinitialiser les filtres]   [+ Créer une paroisse]
```
Centré verticalement dans la zone tableau.

---

## SECTION 10 — FORMULAIRE PAROISSE (6 ONGLETS)

**Route :** `/admin/paroisses/creer` et `/admin/paroisses/{id}/modifier`

### 10.1 Header de formulaire

Fond légèrement différent du canvas principal (border-bottom `rgba(245,197,24,0.10)`).

À gauche : Titre "Nouvelle paroisse" ou "Modifier — Yaoundé-Centre" en Space Grotesk 22px.
À droite (flex gap 12px) :
- Bouton "Annuler" — outline gris
- Bouton "Enregistrer brouillon" — outline vert EEC
- Bouton "Publier" (SUPER) ou "Soumettre pour validation" (autres rôles) — fond `#2E9744`

### 10.2 Barre des onglets

6 onglets horizontaux en haut du formulaire. Style pill-tab :

```
[1. Général] [2. Localisation GPS] [3. Statistiques] [4. Photos] [5. Ouvriers] [6. Œuvres]
```

Onglet actif : fond `rgba(46,151,68,0.15)`, border-bottom `2px solid #2E9744`, texte `#F0F4F1` weight 600.
Onglet inactif : texte `rgba(240,244,241,0.55)`, hover → `rgba(240,244,241,0.75)`.

Les onglets validés (sans erreur) affichent un ✓ vert en miniature à côté du numéro. Les onglets avec erreur : indicateur rouge.

### 10.3 Onglet 1 — Informations générales

**Grille 2 colonnes, gap 20px :**

Colonne gauche :
- Nom de la paroisse* : input texte, placeholder "ex: Paroisse Yaoundé-Centre"
- Région synodale* : dropdown (22 régions EEC listées)
- Quartier / Localité : input texte

Colonne droite :
- Niveau* : segment buttons (3 options inline) — [Paroisse] [Station] [Annexe]. Le sélectionné : fond `#2E9744`, blanc. Les autres : fond transparent, border, gris.
- District* : dropdown cascade (se remplit selon la région choisie)
- Statut : toggle switch — Actif (vert) / Inactif (gris)

Pleine largeur :
- Date de création (si connue) : date picker
- Description / Notes : textarea, 4 lignes, placeholder "Historique, informations complémentaires..."
- Adresse complète : textarea, 2 lignes

**Style des champs :**
- Label : Inter 12px weight 500, `rgba(240,244,241,0.70)`, margin-bottom 6px
- Input : fond `rgba(255,255,255,0.05)`, border `1px solid rgba(245,197,24,0.15)`, border-radius 6px, padding 10px 14px, Inter 14px `#F0F4F1`, outline au focus : border-color `rgba(46,151,68,0.60)`
- Champs requis : astérisque rouge `*` après le label
- Erreur inline : texte rouge `#C62828` Inter 11px sous le champ + border-color rouge sur l'input

### 10.4 Onglet 2 — Localisation GPS

**2 champs numériques côte à côte :**

Latitude* : input numérique, placeholder "ex: 3.8480", min -90, max 90.
Longitude* : input numérique, placeholder "ex: 11.5021", min -180, max 180.

À droite des deux champs : bouton "Obtenir ma position" (icône GPS) — appelle `navigator.geolocation`.

**Badge de validation dynamique :**
Apparaît dès que lat+lng sont renseignés :
- Si dans la bounding box Cameroun (lat [1.6, 13.1], lng [8.3, 16.2]) : badge vert "✅ Position dans la zone Cameroun"
- Sinon : badge orange "⚠ Ces coordonnées semblent être hors du Cameroun"

**Mini-carte Leaflet (400px hauteur) :**
S'affiche dès que latitude et longitude sont renseignées. Un marqueur vert EEC centré sur les coordonnées. Le marqueur se déplace en temps réel quand les valeurs des champs changent (debounce 300ms). Bouton +/- pour zoomer. Non-interactive autrement.

**Convertisseur DMS :**
Section pliable (accordion) "Convertir depuis format DMS (degrés minutes secondes)". Input texte format "3°50'52.8\"N 11°30'7.56\"E" + bouton "Convertir" → remplit automatiquement les champs Latitude/Longitude.

### 10.5 Onglet 3 — Statistiques

**En haut :** Sélecteur d'année dropdown proéminent (fond card, border) — années 2020 → 2026.

**Section principale — Fidèles :**

Grille 3 colonnes :
- Communiants : input numérique
- Non-communiants : input numérique
- Total fidèles : champ auto-calculé (com + non-com), affiché en lecture seule avec fond légèrement différent + label "(calculé automatiquement)". Toggle "Saisir manuellement" si le total est connu indépendamment.

**Section "Statistiques vitales" (accordion pliable, déplié par défaut) :**

Grille 4 colonnes : Baptêmes | Confirmations | Mariages | Décès.
Tous optionnels. Labels clairs.

**Section "Données financières" (accordion pliable, FERMÉ par défaut) :**
Label de section avec icône cadenas et mention "(confidentiel — visible par vous et le niveau supérieur seulement)".
- Offrandes (FCFA) : input numérique
- Dîmes (FCFA) : input numérique

### 10.6 Onglet 4 — Galerie Photos

**Zone de dépôt principale (drag & drop) :**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│        [Icône upload 48px, vert EEC]                                    │
│        Déposez vos photos ici, ou cliquez pour parcourir               │
│                                                                          │
│        Formats acceptés : JPG, PNG, WebP — Max 5 Mo par photo          │
│        Maximum 20 photos par entité                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

Fond `rgba(255,255,255,0.03)`, border `2px dashed rgba(245,197,24,0.25)`, border-radius 8px.
Au survol (drag over) : border-color `rgba(46,151,68,0.60)`, fond `rgba(46,151,68,0.05)`.

**Barre de progression lors de l'upload :**
Sous la zone, barre de progression par fichier : "[Nom du fichier.jpg] [████████░░] 80% — 2.1 Mo / 2.6 Mo". Bouton ✕ pour annuler.

**Grille des photos existantes :**
Grille 4 colonnes, gap 12px. Chaque miniature :
- Image carrée (ratio 1:1), object-fit cover, border-radius 6px
- Au survol : overlay sombre semi-transparent avec deux icônes : [Définir principale] [Supprimer ✕]
- La photo "principale" affiche un badge jaune "★ Principale" en haut-gauche permanent
- Possibilité de réordonner par drag & drop (handle = curseur grab)

Note sous la grille : Inter 12px gris — "La première photo est utilisée sur la fiche publique de la paroisse."

### 10.7 Onglet 5 — Ouvriers assignés

**Liste des ouvriers actuels :**

Chaque item :
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Avatar initiales 36px]  Pasteur Jean-Marie EKANGA           [Actif] │
│                          Grade · Paroisse actuelle            [Voir] [Retirer] │
└──────────────────────────────────────────────────────────────────────┘
```
Fond `rgba(255,255,255,0.03)`, border, border-radius 6px, padding 12px.

**Si aucun ouvrier :** Empty state "Aucun ouvrier assigné à cette paroisse."

**Sous la liste :**

Bouton "+ Assigner un ouvrier existant" → ouvre un input autocomplete (type-ahead) cherchant dans la liste nationale des ouvriers. Résultats affichés : "Pasteur Jean DUPONT — Actuellement : Paroisse X (District Y)". Cliquer → l'assigne à cette paroisse.

Bouton "+ Créer un nouvel ouvrier" → lien vers `/admin/ouvriers/creer?paroisse={id}` (pré-remplit la paroisse).

### 10.8 Onglet 6 — Œuvres liées

Même principe que l'onglet Ouvriers :
- Liste des œuvres actuellement rattachées (nom + type + statut + [Voir] [Délier])
- Bouton "+ Lier une œuvre existante" (autocomplete)
- Bouton "+ Créer une nouvelle œuvre"

### 10.9 Barre de boutons sticky (bas de page)

Position : sticky bottom 0, fond `#08110B`, border-top `rgba(245,197,24,0.10)`, padding 16px 32px.

```
[Annuler]   [Enregistrer brouillon]          [Publier / Soumettre pour validation →]
```

Espacement justify-between. Bouton principal toujours à droite, fond `#2E9744`, blanc.

---

## SECTION 11 — GESTION DES COMPTES ADMINISTRATEURS

**Route :** `/admin/comptes`
**Titre :** "Comptes utilisateurs"

### 11.1 Stats en haut

4 mini-cards horizontales :
- Total comptes actifs : X
- Super Admins : X
- Admins Régionaux : X
- Admins District + Paroisse : X

### 11.2 Tableau des comptes

**Barre outils :**
- Recherche nom/email
- Filtre Rôle (dropdown)
- Filtre Région/District (cascade)
- Filtre Statut (Actif / Inactif / Bloqué)
- Filtre 2FA (Tous / Activée / Non activée)
- Bouton "+ Inviter un administrateur" — fond `#2E9744`, blanc — déclencheur du SLIDE PANEL (voir section 12)

**Colonnes du tableau :**

| Avatar + Nom complet | Email | Rôle (badge coloré) | Portée | 2FA | Dernière connexion | Statut | Actions |

**Badges de rôle :**
- SUPER ADMIN : fond `rgba(255,214,0,0.15)`, texte `#FFD600`, border `rgba(255,214,0,0.30)`
- Admin Régional : fond `rgba(21,101,192,0.15)`, texte `#5B9BD5`, border `rgba(21,101,192,0.30)`
- Admin District : fond `rgba(230,81,0,0.15)`, texte `#E67A2E`, border `rgba(230,81,0,0.30)`
- Admin Paroisse : fond `rgba(46,151,68,0.15)`, texte `#2E9744`, border `rgba(46,151,68,0.30)`

**Badge 2FA :**
- Activée : ✓ vert petit
- Non activée : — gris (avec tooltip "L'admin n'a pas encore activé la 2FA")

**Colonne Statut :**
- Actif : pill vert
- Inactif : pill gris
- Bloqué : pill rouge (5 tentatives échouées)

**Actions :**
- [Voir] (icône œil)
- [Modifier] (icône crayon)
- [⋮] → menu : Réinitialiser mot de passe / Révoquer sessions / Désactiver / Supprimer

---

## SECTION 12 — SLIDE PANEL INVITATION ADMIN (3 ÉTAPES)

*Fonctionnalité phare — inspirée de l'ancienne version GeoEEC*

### 12.1 Comportement général

Au clic sur "+ Inviter un administrateur" :
- Un overlay semi-transparent `rgba(0,0,0,0.55)` couvre toute la page
- Un panel latéral droit s'ouvre en slide depuis la droite vers la gauche
- Largeur : 480px (desktop), 100% (mobile)
- Hauteur : 100vh
- Fond : `#0D1B12` + border-left `1px solid rgba(245,197,24,0.20)`
- Animation : `transform: translateX(100%) → translateX(0)`, duration 350ms, `cubic-bezier(0.4, 0, 0.2, 1)`
- Fermeture : clic sur l'overlay OU bouton ✕ en haut du panel OU touche Escape

### 12.2 En-tête du panel (sticky)

Fond `#08110B`, padding 20px 24px, border-bottom `rgba(245,197,24,0.10)`.

```
✕ (bouton fermeture, gauche)     Inviter un administrateur      Étape 2/3
                                 Inter 15px weight 600
```

**Indicateur de progression par étapes :**
3 cercles numérotés connectés par une ligne :
```
●────────○────────○
 1          2          3
```
Étape courante : cercle fond `#2E9744`, blanc. Étapes futures : cercle fond transparent, border gris. Étapes passées : cercle fond `rgba(46,151,68,0.40)` + checkmark ✓.

### 12.3 Étape 1 — Informations personnelles

**Titre :** "Informations de l'administrateur" — Space Grotesk 18px.

**Champs :**
- Nom de famille* : input
- Prénom* : input
- Adresse e-mail* : input type email — sera le login. Validation en temps réel (vérification format + disponibilité via API debounced). Indicateur à droite du champ : spinner pendant la vérification, ✓ vert si disponible, ✕ rouge si déjà utilisé.
- Téléphone (optionnel) : input avec préfixe "+237" affiché

**Bouton suivant :**
[Étape suivante : Rôle et portée →] — fond `#2E9744`, pleine largeur, désactivé si champs requis vides ou email invalide.

### 12.4 Étape 2 — Rôle et portée

**Titre :** "Rôle et périmètre d'accès" — Space Grotesk 18px.

**Sélection du rôle — 4 cards cliquables (radio visuel) :**

```
┌──────────────────────────────────────────────────────────┐
│ ◎  Admin Régional                                        │
│    Gère une région synodale complète                    │
│    (paroisses, districts, œuvres, ouvriers)             │
└──────────────────────────────────────────────────────────┘
```

Card sélectionnée : border `2px solid #2E9744`, fond `rgba(46,151,68,0.08)`, icône radio remplie verte.
Cards non sélectionnées : border `1px solid rgba(245,197,24,0.13)`, fond transparent.

Les 3 rôles disponibles (pas SUPER — un seul super admin) :
- **Admin Régional** — icône bouclier — "Gère une région synodale complète"
- **Admin District** — icône réseau — "Gère un district dans une région"
- **Admin Paroisse** — icône croix — "Gère une paroisse spécifique"

**Sélection de la portée (apparaît selon le rôle choisi) :**

*Si Régional sélectionné :*
Dropdown "Région synodale*" — 22 régions EEC listées alphabétiquement.

*Si District sélectionné :*
Dropdown "Région*" → puis Dropdown "District*" (cascade, se charge selon la région).

*Si Paroisse sélectionné :*
Dropdown "Région*" → Dropdown "District*" → Dropdown "Paroisse*" (cascade 3 niveaux).

Transitions visuelles : les champs cascade apparaissent avec `opacity 0→1 + translateY(-4px)→0`, 200ms.

**Boutons navigation :**
[← Retour] (outline)    [Étape suivante : Permissions →] (fond vert, désactivé si portée non choisie)

### 12.5 Étape 3 — Permissions personnalisées

**Titre :** "Permissions et accès" — Space Grotesk 18px.

**Récapitulatif de l'étape 2 :**
Bandeau vert discret : "Administrateur Régional — Région MIFI"

**Permissions en checkboxes (liste verticale, selon le rôle) :**

*Pour Admin Régional :*
```
Gestion des données
  [✓] Peut créer des paroisses dans sa région
  [✓] Peut modifier les paroisses de sa région
  [ ] Peut supprimer des paroisses de sa région
  [✓] Peut créer des œuvres dans sa région
  [✓] Peut modifier les œuvres de sa région
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

Style checkbox : case 16×16px, border `1px solid rgba(245,197,24,0.30)`, border-radius 3px. Cochée : fond `#2E9744`, checkmark blanc. Label Inter 13px `#F0F4F1`.

**Section Sécurité :**
Box séparée (fond légèrement différent, border) :
- Label : "Mot de passe temporaire"
- Champ disabled affichant le mot de passe généré aléatoirement : `EEc@2026!xK9m#`
- Inter 14px monospace (uniquement pour ce champ de mot de passe)
- Bouton [Copier] à droite — copie dans le presse-papier + toast "Copié !"
- Bouton [Régénérer] à droite — génère un nouveau mot de passe
- Note : "⚠ Ce mot de passe sera affiché une seule fois. L'administrateur sera invité à le changer à sa première connexion."

**Boutons finaux :**
[← Retour] (outline)    [Créer le compte →] (fond `#2E9744`, blanc, pleine largeur)

Le bouton "Créer le compte" affiche un spinner pendant la création puis :
- Succès : le panel se ferme avec animation, toast vert "Compte créé avec succès. Un email a été envoyé à {email}."
- Erreur : message d'erreur inline dans le panel, le panel reste ouvert.

---

## SECTION 13 — FORMULAIRE OUVRIER (4 ONGLETS)

**Route :** `/admin/ouvriers/creer` et `/admin/ouvriers/{id}/modifier`

**4 onglets :** [1. Identité] [2. Affectation] [3. Contact] [4. Photo de profil]

### Onglet 1 — Identité

Grille 2 colonnes :
- Nom* : input
- Prénom* : input
- Grade* : dropdown (Évêque / Pasteur / Prédicateur / Évangéliste / Catéchiste / Diacre / Aide-Pasteur / Aide-Évangéliste)
- Statut* : segment buttons [Actif] [Retraité] [Suspendu] [Décédé]
- Sexe : segment buttons [M] [F]
- Date de naissance : date picker
- Date d'ordination : date picker

### Onglet 2 — Affectation

- Paroisse* : dropdown searchable (cherche par nom, affiche région+district en sous-texte)
- Région : champ auto-rempli depuis la paroisse, lecture seule, fond différent
- District : champ auto-rempli depuis la paroisse, lecture seule, fond différent
- Rôle dans la paroisse : dropdown (Pasteur principal / Co-pasteur / Évangéliste affecté / Diacre / Catéchiste)

### Onglet 3 — Contact

- Téléphone : input avec préfixe +237
- Email (optionnel) : input type email
- Adresse complète : textarea 3 lignes

### Onglet 4 — Photo de profil

Zone de dépôt centrée (plus petite que la galerie — ratio 1:1 recommandé).
Prévisualisation ronde (avatar-style) de la photo uploadée.

---

## SECTION 14 — FORMULAIRE ŒUVRE (4 ONGLETS)

**Route :** `/admin/oeuvres/creer`

**4 onglets :** [1. Informations] [2. Localisation GPS] [3. Galerie] [4. Contact]

### Onglet 1 — Informations

- Nom de l'œuvre* : input
- Type d'œuvre* : dropdown (scolaire / médical / universitaire / agropastoral / immeuble / terrain / autre)
- Niveau* : segment buttons [Paroissial] [District] [Régional] [National]
- Statut* : dropdown (active / en construction / suspendue / fermée)
- Paroisse parent : dropdown searchable (optionnel)
- District : cascade dropdown
- Région : auto-rempli ou dropdown
- Date d'inauguration : date picker
- Capacité : input numérique + unité texte libre ("ex: 350 élèves", "48 lits")
- Budget annuel (FCFA) : input numérique
- Description : textarea

### Onglet 2 — Localisation GPS

Identique à l'onglet GPS du formulaire Paroisse.

### Onglet 3 — Galerie

Identique à l'onglet Photos du formulaire Paroisse.

### Onglet 4 — Contact

- Responsable de l'œuvre : input texte
- Téléphone : input
- Email : input type email
- Site web : input type url

---

## SECTION 15 — STATISTIQUES

**Route :** `/admin/statistiques`

### 15.1 Barre de navigation des vues

3 onglets horizontaux en haut : [Vue tableau] [Vue carte choroplèthe] [Vue par région]

**Sélecteur d'année** proéminent à droite : dropdown, fond card, "Année 2025 ▾".

### 15.2 Vue tableau (par défaut)

Tableau récapitulatif par région (22 lignes) :

| Région | Communiants | Non-communiants | Total fidèles | Baptêmes | Mariages | Décès | Ouvriers | Actions |

Tri par colonne. Total en ligne de bas de tableau (footer gras).

Boutons : [Export PDF] [Export Excel] [Export CSV] en haut-droite.

### 15.3 Vue carte choroplèthe

Carte Leaflet interactive pleine hauteur. Régions colorées selon densité de fidèles (dégradé vert clair → vert très foncé = plus de fidèles). Tooltip au survol de chaque région : nom + chiffres clés. Légende de couleurs en bas-droite.

### 15.4 Vue par région

Arbre dépliable :
```
▼ Région MIFI — 12,450 fidèles — 48 paroisses
   ▼ District BAHAM — 3,200 fidèles — 12 paroisses
      → Paroisse Baham-Centre — 320 fidèles
      → Paroisse Baham-Nord — 185 fidèles
   ▶ District NKAM — 2,800 fidèles — 9 paroisses
▶ Région CENTRE — 18,200 fidèles — 95 paroisses
```

### 15.5 Validation des statistiques

Route : `/admin/statistiques/validation` (accessible depuis un bouton en haut de la page stats).

Liste des statistiques soumises en attente :

| Paroisse | District | Région | Soumis par | Date soumission | Année | Fidèles | Actions |

Actions par ligne : [✅ Valider] (fond vert) [❌ Rejeter] (fond rouge outline). Au rejet : textarea pour commentaire obligatoire.

---

## SECTION 16 — IMPORT / EXPORT

**Route :** `/admin/import-export`

**4 onglets :** [Import Paroisses] [Import Ouvriers] [Import Œuvres] [Import Shapefile (SUPER)] + section Export séparée.

### 16.1 Workflow d'import (4 étapes visuelles)

Stepper horizontal :
```
[1. Modèle] → [2. Chargement] → [3. Prévisualisation] → [4. Import]
```

**Étape 1 — Télécharger le modèle :**
Bouton "⬇ Télécharger le modèle Excel (.xlsx)" + lien "Voir la documentation des colonnes".

**Étape 2 — Charger le fichier :**
Zone drag & drop fichier Excel. Formats acceptés : .xlsx, .xls. Limite 10 Mo.

**Étape 3 — Prévisualisation :**
Tableau des 5 premières lignes du fichier. Colonnes avec les données parsées. Si des colonnes requises manquent : alertes en haut. Résumé : "X paroisses à importer, Y à mettre à jour, Z lignes avec erreurs". Bouton [Télécharger le rapport de validation] avant l'import.

**Étape 4 — Import en cours :**
Barre de progression animée. "Traitement des lignes 652 / 1003 — Erreurs : 2". Bouton [Annuler l'import]. Rapport final : succès (vert) / erreurs (rouge) avec détail de chaque ligne en erreur + export du rapport.

### 16.2 Section Export

Card dédiée à droite ou sous les imports.

Checkboxes : "Paroisses" / "Œuvres" / "Ouvriers" / "Statistiques" / "Tout exporter".

Filtres optionnels : Région / District / Année.

Format : radio buttons [Excel (.xlsx)] [CSV] [PDF — Rapport officiel] [GeoJSON].

Bouton [Générer l'export] — fond vert. Après génération : lien de téléchargement avec icône de fichier.

### 16.3 Historique des imports

Tableau : Date | Nom fichier | Type | Importé par | Lignes importées | Erreurs | [Rapport]

---

## SECTION 17 — JOURNAL D'ACTIVITÉ

**Route :** `/admin/journal`
**Accès :** SUPER uniquement pour le journal global.

### 17.1 Filtres

Barre de filtres horizontale :
- Période : [Aujourd'hui] [7 jours] [30 jours] [Plage personnalisée] — segment buttons
- Type d'action : dropdown (Connexion / Création / Modification / Suppression / Import / Export / Tous)
- Utilisateur : dropdown (tous les comptes admin)
- Entité : dropdown (Paroisse / Œuvre / Ouvrier / Compte / Système)

### 17.2 Tableau du journal

Colonnes : Date/Heure | Utilisateur | Action | Entité | Résumé | IP

**Colonne Action — icônes colorées :**
- Connexion : icône login, bleu
- Création : icône +, vert
- Modification : icône crayon, orange
- Suppression : icône trash, rouge
- Import : icône upload, violet
- Export : icône download, gris

**Ligne cliquable → détail de l'action :**
Panel latéral ou accordion qui s'ouvre :
```
Action : Modification de paroisse
Utilisateur : Paul ATEBA (Admin District MIFI)
Date : 20 mai 2026, 09:15:32
IP : 197.145.XX.XX
Entité : Paroisse Bafoussam-Nord (ID: 247)

Champs modifiés :
  Latitude : (avant) N/A  →  (après) 5.4740
  Longitude : (avant) N/A  →  (après) 10.4180
  Modifié le : (avant) 2025-08-12  →  (après) 2026-05-20
```

---

## SECTION 18 — PARAMÈTRES ADMIN

**Route :** `/admin/parametres`

**5 onglets :** [Profil] [Sécurité] [2FA] [Sessions] [Préférences]

### Onglet Profil

- Photo de profil : zone d'upload carré + prévisualisation ronde
- Nom complet, Email (entraîne re-vérification si modifié), Téléphone
- Bouton [Sauvegarder]

### Onglet Sécurité — Changement de mot de passe

- Mot de passe actuel (masqué)
- Nouveau mot de passe (masqué) + indicateur force :
  - Barre de force : rouge (faible) → orange (moyen) → vert (fort → très fort)
  - Règles listées : ✓ 12 caractères minimum / ✓ Majuscule / ✓ Chiffre / ✓ Caractère spécial
- Confirmer le nouveau mot de passe
- Bouton [Changer le mot de passe]

### Onglet 2FA

**Si non activée :**
Card informative : "Sécurisez votre compte avec la double authentification (TOTP)".
Bouton [Activer la 2FA] → affiche :
1. QR Code à scanner (Google Authenticator, Authy, etc.)
2. Code secret textuel (pour saisie manuelle)
3. Champ de validation du code TOTP à 6 chiffres
4. Bouton [Confirmer l'activation]
5. Affichage des 8 codes de secours à noter (fond jaune d'avertissement)

**Si déjà activée :**
Badge "✅ 2FA activée". Bouton [Désactiver la 2FA] (rouge, avec confirmation modale).

### Onglet Sessions actives

Liste des sessions actives :

| Appareil | Navigateur | IP | Localisation approx. | Dernière activité | Action |

Action : [Se déconnecter de cette session] par ligne. Bouton en bas : [Se déconnecter de toutes les autres sessions].

### Onglet Préférences

- **Thème :** 3 cards radio : [Clair] [Sombre] [Automatique (OS)] avec prévisualisation miniature de chaque thème
- **Langue :** Radio [Français] (seule option disponible pour l'instant)
- **Format de date :** Radio [JJ/MM/AAAA] [AAAA-MM-JJ]
- **Fuseau horaire :** Dropdown, par défaut "Afrique/Douala (UTC+1)"
- **Notifications email :** Checkboxes :
  - [✓] Nouvelles demandes de validation
  - [✓] Imports terminés
  - [ ] Rapport hebdomadaire de ma région
  - [ ] Résumé mensuel des statistiques

---

## SECTION 19 — PANNEAU DE NOTIFICATIONS

### 19.1 Dropdown cloche (dans la topbar)

Au clic sur la cloche : dropdown panel (largeur 360px, position absolute top 60px right 0).

Fond `#08110B`, border `rgba(245,197,24,0.20)`, border-radius 8px, box-shadow `0 16px 48px rgba(0,0,0,0.6)`.

**En-tête :** "Notifications (3 non lues)" à gauche + lien "Tout marquer comme lu" à droite.

**Liste des notifications (max 5 dans le dropdown) :**

```
● [Icône type] Paul ATEBA a soumis des statistiques pour validation
              District MIFI · il y a 2h                    [Voir →]
─────────────────────────────────────────────────────────────────
  [Icône type] Import Excel "ouvriers_2026.xlsx" terminé
              153 enregistrements — 2 erreurs · il y a 4h  [Voir →]
─────────────────────────────────────────────────────────────────
● [Icône type] Connexion depuis un appareil inconnu
              IP 197.X.X.X · Yaoundé · 25 mai 08:15       [Voir →]
```

Notifications non lues : fond `rgba(255,214,0,0.05)`, pastille bleue `●` devant.
Notifications lues : fond transparent.

**Bas du dropdown :** Lien "Voir toutes les notifications →" qui mène à `/admin/notifications`.

### 19.2 Types de notifications et icônes

- Validation demandée : icône horloge orange
- Validation approuvée : icône checkmark vert
- Validation rejetée : icône X rouge
- Import terminé (succès) : icône upload vert
- Import terminé (erreurs) : icône upload orange
- Connexion inhabituelle : icône shield rouge
- Compte créé : icône user+ vert
- Compte désactivé : icône user- gris

---

## SECTION 20 — COMPOSANTS UI PARTAGÉS

### 20.1 Toast notifications

Position : haut-droite, offset 20px du bord, offset 20px du top. Empilables (max 3).

**Structure d'un toast :**
Largeur 320px, border-radius 6px, padding 12px 16px. Border gauche 3px + icône + texte.

Types :
- **Succès :** fond `rgba(46,151,68,0.12)`, border `#2E9744`, icône checkmark vert, texte `#F0F4F1`
- **Erreur :** fond `rgba(198,40,40,0.12)`, border `#C62828`, icône X rouge, texte `#F0F4F1`
- **Avertissement :** fond `rgba(230,81,0,0.12)`, border `#E65100`, icône ⚠ orange, texte `#F0F4F1`
- **Info :** fond `rgba(21,101,192,0.12)`, border `#1565C0`, icône ℹ bleu, texte `#F0F4F1`

Animation : `translateX(100%) → translateX(0)`, 300ms. Disparition auto : 5s (erreur : 8s, ou clic ✕).

### 20.2 Modales de confirmation (actions destructives)

Overlay : `rgba(0,0,0,0.60)`. Panel centré, largeur 440px, fond `#0D1B12`, border `rgba(245,197,24,0.20)`, border-radius 8px.

**Modale suppression (exemple) :**
```
┌────────────────────────────────────────────────────────┐
│  [Icône trash rouge 40px]                              │
│                                                        │
│  Supprimer la paroisse                                 │
│  Space Grotesk 20px                                    │
│                                                        │
│  Vous êtes sur le point de supprimer la paroisse       │
│  "Yaoundé-Centre". Cette action est irréversible.     │
│  Toutes les statistiques associées seront supprimées. │
│                                                        │
│  Pour confirmer, tapez le nom de la paroisse :         │
│  [______________________________________]              │
│                                                        │
│  [Annuler]          [Supprimer définitivement]         │
│   outline gris       fond rouge #C62828                │
└────────────────────────────────────────────────────────┘
```

### 20.3 Skeleton loaders

- **Lignes de tableau :** Rectangles gris `rgba(255,255,255,0.08)` de hauteur 20px, border-radius 4px, largeurs variables (60%, 40%, 30%, 20%), animés avec shimmer.
- **Cards stat :** Bloc rectangulaire, structure identique à la card réelle mais tout gris.
- **Graphiques :** Placeholder de la même taille que le graphique, fond gris, spinner vert EEC centré.
- **Avatar :** Cercle gris animé.

**Animation shimmer :**
```css
background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

### 20.4 États vides (empty states)

```
[Icône pertinente SVG — 56px, couleur rgba(255,255,255,0.20)]

Aucune paroisse trouvée
Inter 15px weight 500, rgba(240,244,241,0.70)

Essayez de modifier vos filtres ou créez une nouvelle paroisse.
Inter 13px, rgba(240,244,241,0.45)

[Réinitialiser les filtres]      [+ Créer une paroisse]
  outline gris                    fond #2E9744
```

Centré verticalement. Pas d'illustration complexe — icône SVG simple suffit.

### 20.5 Barre de progression des imports

```
Import en cours — "ouvriers_2026.xlsx"
[██████████████████░░░░] 68%   Ligne 682 / 1003 — Erreurs : 2
[Voir rapport partiel]                        [Annuler l'import]
```

Fond card, barre de progression : fond `rgba(255,255,255,0.10)`, remplissage `#2E9744`, border-radius 100px.

### 20.6 Badges et pills

```css
/* Badge statut Actif */
.badge-actif {
  background: rgba(46,151,68,0.15);
  border: 1px solid rgba(46,151,68,0.35);
  color: #2E9744;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  font-family: Inter;
}

/* Badge statut Inactif */
.badge-inactif {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(240,244,241,0.45);
  /* mêmes autres propriétés */
}
```

### 20.7 Inputs et dropdowns

Tous les champs de formulaire :
- Fond : `rgba(255,255,255,0.05)`
- Border : `1px solid rgba(245,197,24,0.15)`
- Border-radius : 6px
- Padding : `10px 14px`
- Font : Inter 14px `#F0F4F1`
- Placeholder : `rgba(240,244,241,0.35)`
- Focus : `border-color: rgba(46,151,68,0.60)`, `box-shadow: 0 0 0 3px rgba(46,151,68,0.10)`, outline: none
- Erreur : `border-color: #C62828`, focus garde la couleur rouge

Dropdowns : même style que les inputs. La liste déroulante : fond `#0D1B12`, border `rgba(245,197,24,0.20)`, border-radius 6px, box-shadow `0 8px 24px rgba(0,0,0,0.5)`. Chaque option : padding `10px 14px`, hover fond `rgba(255,255,255,0.06)`. Option sélectionnée : texte `#2E9744`, checkmark à droite.

---

## SECTION 21 — FICHE DÉTAIL PUBLIQUE D'UNE PAROISSE

**Route :** `/paroisses/{id}` — Publique, sans authentification.

### 21.1 Hero pleine largeur

Hauteur : 340px. Image de fond = première photo de la galerie. Si aucune photo : fond uni `rgba(13,27,18,0.95)` avec croix EEC SVG centrée en filigrane.

Overlay gradient : `linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 100%)`.

**Contenu overlay (position: absolute, bottom 28px left 32px) :**
- Badge niveau : pill "PAROISSE" ou "STATION" ou "ANNEXE" — fond `rgba(46,151,68,0.25)`, border `rgba(46,151,68,0.50)`, vert EEC
- Nom de la paroisse : Space Grotesk 36px 700 blanc
- Sous-titre : "District de Mfoundi · Région du Centre" — Inter 15px rgba blanc 75%

**En-tête overlay (position: absolute, top 20px, pleine largeur, padding horizontal 32px) :**
- Gauche : "← Retour à la carte" lien blanc
- Droite : bouton "Partager 🔗" blanc outline

### 21.2 Corps de page (2 colonnes, gap 32px)

Colonne gauche (60%) :

**Carte Leaflet centrée sur la paroisse :**
Hauteur 300px, zoom 14. Marqueur vert EEC centré + popup discret. Non-interactive (scrollWheel false, dragging false). Bouton "Ouvrir dans Google Maps →" sous la carte. Coordonnées affichées : "3.8480° N, 11.5021° E" + bouton [Copier].

Si pas de GPS : fond gris `rgba(255,255,255,0.04)`, texte centré "Coordonnées GPS non disponibles pour cette paroisse."

**Galerie photos (sous la carte) :**
Grille 3 colonnes (desktop) / 2 (tablet) / 1 (mobile). Chaque photo carrée, border-radius 6px, objectFit cover. Au clic : lightbox. Dans la lightbox : image grande, boutons flèche gauche/droite (ou swipe sur mobile), touche Échap pour fermer, fond `rgba(0,0,0,0.90)`.

Colonne droite (40%) :

**Card Statistiques :**
```
STATISTIQUES 2025
──────────────────────────────────
Communiants               324
Non-communiants           187
──────────────────────────────────
Total fidèles             511
──────────────────────────────────
Baptêmes                   23
Mariages                    8
Décès                       4
```
Sélecteur d'année en haut de la card (voir d'autres années).

**Card Ouvriers :**
```
OUVRIERS (3)
  [Avatar] Pasteur Jean-Marie EKANGA (Actif)
           ☎ +237 6XX XXX XXX
  [Avatar] Évangéliste Paul ATEBA (Actif)
           ☎ Non renseigné
```

**Card Œuvres liées :**
```
ŒUVRES (2)
  [🏫] École Primaire EEC Yaoundé-Centre  · Paroissial
  [🏥] Dispensaire EEC                    · District
```
Chaque œuvre cliquable → fiche détail de l'œuvre.

**Section Localisation hiérarchique :**
"Bureau National EEC → Région CENTRE → District MFOUNDI → Paroisse Yaoundé-Centre"
Chaque niveau est un lien cliquable (filtre la carte).

**Section Partager :**
Boutons : [Copier le lien] [WhatsApp] [Télécharger la fiche PDF]

---

## SECTION 22 — RESPONSIVE ET MOBILE

### Mobile (< 768px)

- Sidebar : disparaît, remplacée par un bouton hamburger en topbar → overlay sidebar qui s'ouvre en slide depuis la gauche
- Grilles de cards stat : 1 colonne (stat cards superposées)
- Tableau : mode card (chaque ligne devient une card) ou scroll horizontal avec colonnes prioritaires
- Slide panel admin : pleine largeur (100%)
- Formulaires : 1 colonne systématiquement
- Topbar : date/heure masquée, seuls avatar + cloche visibles

### Tablette (768px – 1024px)

- Sidebar : peut être rétractée (icônes uniquement, 60px) avec tooltip au survol
- Grilles 5 cards stat → 3 + 2 sur 2 rangées
- Graphiques 2×2 → 1×4 empilés verticalement
- Formulaire paroisse : grille 2 colonnes maintenue

---

## SECTION 23 — MODE MAINTENANCE (SUPER ADMIN)

**Route :** `/admin/parametres/maintenance`

Card dédiée dans les paramètres système :

**Si désactivé :**
```
Mode maintenance — Statut : [DÉSACTIVÉ]

[Activer le mode maintenance]

En mode maintenance :
→ La partie publique affiche une page de maintenance
→ Les administrateurs peuvent toujours se connecter
→ Un message personnalisable est affiché aux visiteurs
```

**Message de maintenance :**
Textarea — "La plateforme est temporairement en maintenance. Retour prévu dans 2 heures."

**Si activé :**
Bandeau rouge en haut du dashboard admin de tous les admins connectés :
"⚠ MODE MAINTENANCE ACTIF — La partie publique est actuellement inaccessible aux visiteurs. [Désactiver]"

---

## SECTION 24 — WORKFLOW DE VALIDATION

### 24.1 Badge de statut sur les entités en attente

Sur chaque fiche d'entité (paroisse, statistique) soumise par un admin non-SUPER :

```
┌───────────────────────────────────────────────────────────────┐
│  ⏳ Modification en attente de validation                      │
│     Soumise par Paul ATEBA (District MIFI) — il y a 3h        │
│     [Voir les changements proposés]  [Valider] [Rejeter]      │
└───────────────────────────────────────────────────────────────┘
```

Fond `rgba(230,81,0,0.08)`, border `rgba(230,81,0,0.30)`, border-radius 6px.

### 24.2 Vue "diff" des modifications proposées

Au clic "Voir les changements" : tableau avant/après :

| Champ | Valeur actuelle | Valeur proposée |
|-------|----------------|-----------------|
| Latitude | N/A | 3.8480 |
| Longitude | N/A | 11.5021 |

Modification proposée en vert, valeur actuelle en gris.

[Valider tout] [Rejeter avec commentaire] en bas.

---

## SECTION 25 — PAGE D'ERREUR ET ACCÈS REFUSÉ

**403 — Accès interdit :**
Fond canvas standard. Centre de page :
```
[Icône bouclier barré, 64px, rgba(255,255,255,0.20)]

Accès interdit
Space Grotesk 24px

Vous n'avez pas les permissions nécessaires pour accéder à cette page.
Inter 14px gris

[← Retour au tableau de bord]    [Contacter l'administrateur]
```

**404 :**
Idem avec icône recherche vide et message "Cette page n'existe pas".

---

## SECTION 26 — RÉCAPITULATIF DES ROUTES À CONCEVOIR

```
/admin/login                            → Connexion (déjà existant — ne pas modifier)
/admin/dashboard                        → Tableau de bord (adapté selon rôle)
/admin/carte                            → Carte interactive admin
/admin/paroisses                        → Liste
/admin/paroisses/creer                  → Formulaire création (6 onglets)
/admin/paroisses/{id}                   → Fiche détail admin
/admin/paroisses/{id}/modifier          → Formulaire modification (6 onglets)
/admin/oeuvres                          → Liste
/admin/oeuvres/creer                    → Formulaire (4 onglets)
/admin/oeuvres/{id}/modifier            → Formulaire modification
/admin/ouvriers                         → Liste
/admin/ouvriers/creer                   → Formulaire (4 onglets)
/admin/ouvriers/{id}/modifier           → Formulaire modification
/admin/regions                          → Liste des 22 régions
/admin/districts                        → Liste des districts
/admin/statistiques                     → Vue stats (tableau + carte + arbre)
/admin/statistiques/validation          → Validation des statistiques soumises
/admin/import-export                    → Centre import/export
/admin/comptes                          → Liste des comptes + slide panel invitation
/admin/comptes/{id}                     → Fiche détail d'un compte
/admin/journal                          → Journal d'activité
/admin/notifications                    → Toutes les notifications
/admin/parametres                       → Paramètres (5 onglets)
/admin/parametres/maintenance           → Mode maintenance (SUPER)
/paroisses/{id}                         → Fiche publique (sans auth)
```

---

## SECTION 27 — CHECKLIST POUR CLAUDE DESIGN

Voici exactement ce que je veux voir dans ta production :

### Écrans obligatoires à concevoir (au minimum) :

1. **Layout général** — sidebar + topbar + zone contenu (dark mode)
2. **Layout général** — même chose en light mode
3. **Dashboard SUPER ADMIN** — vue complète avec toutes les sections
4. **Dashboard ADMIN RÉGIONAL** — différences de contenu visibles
5. **Liste des paroisses** — tableau complet avec filtres, pagination, barre d'outils
6. **Formulaire paroisse — Onglet 1** (Informations générales)
7. **Formulaire paroisse — Onglet 2** (GPS + mini-carte)
8. **Formulaire paroisse — Onglet 4** (Galerie photos)
9. **Gestion des comptes** — tableau + bouton invitation
10. **Slide panel Invitation — Étape 1** (Informations personnelles)
11. **Slide panel Invitation — Étape 2** (Rôle + portée + cascade dropdown)
12. **Slide panel Invitation — Étape 3** (Permissions checkboxes + mot de passe temporaire)
13. **Journal d'activité** — vue tableau filtrable
14. **Paramètres — Onglet Sécurité** (changement mot de passe + 2FA)
15. **Fiche publique d'une paroisse** — hero + 2 colonnes + galerie
16. **État vide** — exemple pour la liste des paroisses
17. **Toast notifications** — les 4 types empilés
18. **Modale de confirmation suppression**
19. **Centre de notifications** — dropdown de la cloche

### Points critiques à ne pas rater :

- La sidebar DOIT toujours rester verte (`#1B5E20` ou `#08110B`) même en light mode — c'est la signature visuelle de l'EEC
- Les chiffres de statistiques DOIVENT être en Space Grotesk bold — jamais en Inter
- Le slide panel d'invitation DOIT s'ouvrir depuis la droite (pas une modale centrée)
- La cascade dropdown Région → District → Paroisse DOIT s'animer à l'apparition
- La barre d'item actif sidebar DOIT être or `#FFD600` — c'est le seul endroit où l'or est vraiment visible
- Les inputs DOIVENT avoir un fond très légèrement différent du canvas (pas blanc pur)
- Les graphiques DOIVENT être sur fond sombre (pas fond blanc dans le dark mode)
- La carte Leaflet DOIT utiliser un fond de carte sombre (dark theme OpenStreetMap ou CartoDB dark)

---

*Document confidentiel — Projet EEC Géolocalisation — Propriété exclusive de l'Église Évangélique du Cameroun*  
*Version 1.0 définitive — 26 mai 2026*
