# PROMPT CLAUDE DESIGN — Page Principale
# Plateforme de Géolocalisation EEC Cameroun

---

## CONTEXTE DU PROJET (à lire entièrement avant de commencer)

Je travaille sur une plateforme web institutionnelle officielle pour l'**Église Évangélique du Cameroun (EEC)**.
Cette organisation possède **576 paroisses, 311 œuvres (écoles, hôpitaux, universités, terrains, immeubles), 685 ouvriers ecclésiastiques** répartis dans **22 Régions Synodales** et **137 Districts** couvrant l'ensemble du territoire camerounais.

L'objectif de cette plateforme est de permettre à n'importe quel citoyen, responsable d'église ou décideur institutionnel de :
- Visualiser sur une carte interactive toutes les paroisses et œuvres de l'EEC au Cameroun
- Rechercher et filtrer par région, district, paroisse, type d'œuvre, grade d'ouvrier, statistiques de fidèles
- Cliquer sur un élément de la carte pour obtenir ses informations détaillées
- Consulter des statistiques dynamiques par région synodale

C'est une plateforme **publique, institutionnelle, d'importance nationale**. Elle sera utilisée par des évêques, des responsables régionaux, des administrateurs de districts, des secrétaires d'église, et le grand public. Elle ne doit pas ressembler à une application commerciale ou à une startup.

---

## IDENTITÉ VISUELLE — RÈGLES ABSOLUES

### Couleurs officielles EEC — extraites directement du logo officiel

Le logo EEC est composé de trois éléments :
1. Une **flamme/forme géographique en jaune vif** (fond du logo)
2. Les **lettres "EEC" en vert vif** inscrites dans la flamme
3. Une **croix blanche avec contour noir** à droite

**Palette exacte du logo :**
- **Jaune EEC** : `#FFD600` — jaune vif pur, chaud, sans orange. C'est la couleur dominante du logo.
- **Vert EEC** : `#2E9744` — vert moyen vif, lumineux, pas sombre. Couleur des lettres EEC.
- **Blanc** : `#FFFFFF` — couleur de la croix dans le logo
- **Noir** : `#1A1A1A` — contours du logo uniquement, pas dans l'UI

**Palette de l'interface :**
- **Couleur primaire** : `#2E9744` (vert EEC — boutons principaux, titres de section, accents)
- **Couleur accent** : `#FFD600` (jaune EEC — highlights, icône active, sélection)
- **Fond principal** : `#FDFDFD` (blanc cassé très léger, pas trop blanc)
- **Fond sidebar** : `#F7F7F7` (gris très clair, séparé subtilement du fond carte)
- **Texte principal** : `#1A1A1A` (presque noir, lisible et propre)
- **Texte secondaire** : `#5F6368` (gris neutre pour labels et métadonnées)
- **Bordures** : `#E3E3E3` (lignes de séparation, très discrètes)

**Règle d'usage des couleurs :**
- Le vert `#2E9744` est utilisé pour les éléments actifs, les boutons, les titres de section
- Le jaune `#FFD600` est réservé aux accents ponctuels (sélection active, badge, highlight)
- Le blanc et le gris clair dominent (70% de la surface) — le vert et le jaune sont des touches, pas des fonds
- Aucun autre couleur ne doit apparaître dans l'interface sauf les icônes des types d'œuvres (chacune avec sa propre couleur sémantique)

### Ce que cette interface DOIT être
- **Propre et aéré** : espacement généreux, pas d'encombrement visuel
- **Institutionnel** : sobre, digne, professionnel — comme un portail gouvernemental de qualité
- **Lisible** : typographie claire, hiérarchie visuelle forte, contrastes suffisants
- **Fonctionnel d'abord** : chaque élément a une raison d'être, rien de décoratif inutile
- **Subtil** : les animations sont discrètes (200-300ms), avec de flashs, avec d'effets spectaculaires et des tres bonne animations les section doivent etre bien separer les une des autres avec des petit ombrage et bien ajancer

### Ce que cette interface NE DOIT PAS être — INTERDIT
- **PAS de dégradés** de couleurs (gradient) sur les fonds ou les boutons principaux
- **PAS de border-radius excessif** — pas de "pill buttons", pas de cartes ultra-arrondies. Max 4-6px de rayon
- **PAS de glassmorphism** — pas de transparences floues façon iOS
- **PAS de neumorphism** — pas d'ombres internes et externes en même temps
- **PAS de neon ou d'effets lumineux** — pas de "glow", pas d'ombres colorées
- **PAS de cartes flottantes avec ombres portées excessives** — box-shadow très discret si utilisé
- **PAS de sections colorées en blocs** qui se succèdent façon landing page
- **PAS de fond sombre** sur la page principale — fond blanc mais pas trop blanc
- **PAS d'emojis** dans l'interface
- **PAS d'icônes illustratives** façon Freepik/Flaticon génériques
- Ce que je dois voir et ressentir : **c'est un humain qui a conçu cela, pas une IA**

### Typographie
- Police : **Inter** (ou Geist, ou DM Sans) — sans-serif, propre, neutre
- Taille texte corps : 14px
- Taille labels filtres : 12px (uppercase, letter-spacing: 0.05em)
- Taille titres sidebar : 13px uppercase, couleur vert principal, très espacé
- Aucune police décorative, serif ou fantaisiste

---

## STRUCTURE GLOBALE DE LA PAGE — LAYOUT

La page est une **application cartographique plein écran** qui occupe 100% de la fenêtre du navigateur (100vh / 100vw). Pas de scroll vertical sur la page principale. C'est une SPA (Single Page Application).

```
┌─────────────────────────────────────────────────────────────────┐
│                     BARRE DE NAVIGATION                         │
│  [Logo EEC] [Titre]    [22 Rég · 576 Par · 685 Ouv]   [🔐 Admin]│
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│  PANNEAU       │                                                │
│  RECHERCHE     │            CARTE LEAFLET                       │
│  & FILTRES     │       (occupe tout l'espace restant)           │
│  (gauche)      │                                                │
│  320px fixe    │                              [Panneau détail]  │
│                │                              (caché par défaut,│
│                │                               slide depuis la  │
│                │                               droite au clic)  │
├────────────────┴────────────────────────────────────────────────┤
│                      BARRE LÉGENDE                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ZONE 1 — BARRE DE NAVIGATION (hauteur : 52px)

### Gauche
- Logo EEC (SVG ou PNG fourni séparément) — hauteur 36px
- Séparateur vertical `|` discret
- Texte : **"Géolocalisation EEC"** — font-weight 600, couleur #1B5E20

### Centre
- Compteurs statistiques en ligne, séparés par des points :
  - `22 Régions Synodales · 576 Paroisses · 311 Œuvres · 685 Ouvriers`
  - Police 13px, couleur gris secondaire #616161
  - Ces chiffres seront dynamiques en production

### Droite
- Toggle **"Vue carte"** / **"Vue liste"** — deux petits boutons discrets
- Bouton discret **"Accès administrateur"** — texte simple, pas de bouton coloré, juste un lien avec icône cadenas

### Style barre navigation
- Fond : blanc `#FFFFFF`
- Bordure inférieure : `1px solid #E0E0E0`
- Aucune ombre portée — la séparation se fait par la bordure uniquement

---

## ZONE 2 — PANNEAU GAUCHE : RECHERCHE & FILTRES (largeur : 320px)

Ce panneau est **fixe à gauche**, fond `#FAFAFA`, bordure droite `1px solid #E8E8E8`.
Il a un **scroll vertical interne** si le contenu dépasse la hauteur disponible.

### Section 0 — Bouton "Réduire/Agrandir le panneau"
- Flèche discrète `‹` en haut à droite du panneau
- Au clic : le panneau se replie (largeur passe à 0px) et la carte prend tout l'écran
- La flèche reste visible en position fixe sur le bord gauche de la carte pour rouvrir

---

### Section 1 — RECHERCHE UNIVERSELLE (toujours en haut, toujours visible)

```
┌────────────────────────────────┐
│ 🔍 Rechercher une paroisse,    │
│    une œuvre, un ouvrier...    │
└────────────────────────────────┘
```

- Champ de recherche texte avec icône loupe à gauche
- Placeholder : *"Rechercher une paroisse, une œuvre, un district..."*
- **Autocomplétion** : au fur et à mesure de la frappe, une dropdown apparaît avec les résultats groupés :
  ```
  PAROISSES (3)
    › Paroisse de Yaoundé-Centre
    › Paroisse de...
  ŒUVRES (1)
    › École Primaire EEC de...
  DISTRICTS (2)
    › District de...
  ```
- Au clic sur un résultat : **la carte zoome automatiquement** sur l'élément sélectionné, un marker s'anime, et le panneau détail s'ouvre

---

### Section 2 — LOCALISATION HIÉRARCHIQUE

Label section : `LOCALISATION` (12px, uppercase, vert #1B5E20, letter-spacing)

**Région Synodale** — Dropdown select
- Placeholder : "Toutes les régions"
- Liste des 22 régions synodales de l'EEC Cameroun
- Au choix d'une région : la carte **zoome sur la région** + le filtre District se peuple

**District** — Dropdown select (activé seulement si une région est choisie)
- Placeholder : "Tous les districts"
- Se charge dynamiquement selon la région sélectionnée (5 à 15 districts selon la région)
- Au choix d'un district : la carte zoome sur le district + le filtre Paroisse se peuple

**Paroisse** — Dropdown select (activé seulement si un district est choisi)
- Placeholder : "Toutes les paroisses"
- Se charge selon le district sélectionné

---

### Section 3 — TYPES D'ENTITÉS À AFFICHER

Label section : `AFFICHER SUR LA CARTE` (12px, uppercase, vert)

Cases à cocher — style sobre, pas de toggle flashy :
```
[✓]  Paroisses           (576)
[✓]  Œuvres scolaires    (48)
[✓]  Structures médicales (31)
[✓]  Universités/Inst. supér. (12)
[✓]  Domaines agropastoraux (28)
[✓]  Immeubles EEC       (89)
[✓]  Terrains EEC        (103)
```
- Chaque case a l'icône correspondante à gauche (petite, 14px)
- Le nombre entre parenthèses est dynamique (résultat filtré)

---

### Section 4 — FILTRES OUVRIERS

Label section : `OUVRIERS` (12px, uppercase, vert)

**Grade ecclésiastique** — Dropdown multi-select
Options : Évêque · Pasteur · Prédicateur · Évangéliste · Catéchiste · Diacre · Aide-Pasteur · Aide-Évangéliste

**Statut** — Groupe de boutons (radio discrets)
```
( ) Tous   (•) Actifs   ( ) Retraités   ( ) Suspendus
```

---

### Section 5 — FILTRES STATISTIQUES

Label section : `STATISTIQUES` (12px, uppercase, vert)

**Année** — Dropdown : 2024 · 2025 · 2026

**Fidèles minimum** — Champ numérique discret
- Placeholder : "Min. fidèles (ex: 100)"

**Communiants minimum** — Champ numérique
- Placeholder : "Min. communiants"

---

### Section 6 — ACTIONS

```
[        Appliquer les filtres        ]   ← Bouton principal, fond vert #1B5E20, texte blanc
[           Réinitialiser             ]   ← Bouton secondaire, texte seul, couleur gris
```

- Le bouton principal n'est PAS arrondi en "pill". Border-radius : 4px max
- Aucune ombre portée sur les boutons

---

## ZONE 3 — LA CARTE (zone centrale, occupe tout l'espace restant)

La carte est le cœur de l'interface. Elle doit respirer, être propre.

### Fond cartographique
- OpenStreetMap style "Carto Light" (CartoDB Positron) — fond gris très clair, routes blanches, texte discret
- Option satellite (bouton toggle en haut à droite de la carte)

### Éléments sur la carte

**Régions Synodales**
- Polygones des 22 régions synodales
- Remplissage : vert très transparent `rgba(27, 94, 32, 0.06)`
- Bordure : `#1B5E20` 2px, légèrement opaque
- Au survol : remplissage légèrement plus soutenu `rgba(27, 94, 32, 0.12)`

**Clusters de marqueurs** (quand beaucoup de points sont proches)
- Cercles avec un chiffre à l'intérieur indiquant le nombre d'éléments
- Fond vert clair, texte blanc, bordure blanc
- Au clic : dézoom/éclatement du cluster

**Marqueurs individuels**
- Paroisse : marqueur blanc avec croix verte (icône simple, propre)
- Œuvre scolaire : icône graduation cap (couleur bleue #1565C0)
- Structure médicale : icône croix médicale (couleur rouge #B71C1C)
- Université : icône livre ouvert (couleur violet #4A148C)
- Domaine agropastoral : icône feuille (couleur orange foncé #E65100)
- Immeuble : icône bâtiment (couleur gris ardoise #455A64)
- Terrain : icône topographie (couleur marron #4E342E)

### Contrôles de la carte (en haut à droite, dans la carte)
- Zoom + / Zoom −
- Bouton plein écran (masque la sidebar + la légende)
- Toggle OpenStreetMap / Satellite
- Bouton "Recentrer sur le Cameroun"

Ces contrôles sont en **blanc avec bordure grise fine**, fond blanc, discrets. PAS de couleurs.

### Comportement au clic sur un marqueur
Au clic sur n'importe quel marqueur :
1. Le marqueur s'anime légèrement (petit rebond, 200ms)
2. Le **panneau détail** slide depuis la droite (voir Zone 4)
3. La carte se décale légèrement vers la gauche pour laisser place au panneau

---

## ZONE 4 — PANNEAU DÉTAIL (slide depuis la droite)

**Déclenchement** : clic sur un marqueur sur la carte
**Largeur** : 380px
**Comportement** : glisse depuis la droite, avec une légère animation (ease-out, 250ms). Ce n'est pas un modal/popup — c'est un panneau latéral intégré qui pousse la carte.

### Contenu du panneau détail — exemple pour une Paroisse

```
[×]  Paroisse de Yaoundé-Centre          ← Bouton fermer (×) en haut à droite

─────────────────────────────────────────

[   Photo de la paroisse si disponible   ]
[ ou silhouette sobre si pas de photo   ]

─────────────────────────────────────────

PAROISSE                                  ← type en vert, 11px uppercase
Yaoundé-Centre                            ← nom, 20px, font-weight 600

📍 District de Mfoundi · Région du Centre ← localisation, 13px gris

─────────────────────────────────────────

STATISTIQUES 2025
  Communiants         324
  Non-communiants     187
  Total fidèles       511
  Baptêmes             23
  Mariages              8
  Décès                 4

─────────────────────────────────────────

OUVRIERS (3)
  › Pasteur Jean-Marie Ekanga (Actif)
  › Évangéliste Paul Ateba (Actif)
  › Diacre Marie-Claire Biya (Active)

─────────────────────────────────────────

ŒUVRES LIÉES (2)
  🏫 École primaire EEC Yaoundé-Centre
  🏥 Dispensaire EEC

─────────────────────────────────────────

GPS : 3.8480° N, 11.5021° E
[ Copier les coordonnées ]  [ Voir dans Google Maps ]
```

### Style du panneau détail
- Fond blanc, bordure gauche `1px solid #E0E0E0`
- Légère ombre portée gauche `box-shadow: -4px 0 12px rgba(0,0,0,0.08)`
- Sections séparées par des lignes `1px solid #F0F0F0`
- Les labels de section (STATISTIQUES, OUVRIERS) : 11px uppercase vert, letter-spacing

---

## ZONE 5 — BARRE LÉGENDE (en bas, hauteur : 44px)

Barre horizontale fine en bas de la page.
- Fond blanc
- Bordure supérieure `1px solid #E0E0E0`
- Contenu centré horizontalement

```
Légende :  [🟢 Région Synodale]  [⊕ Paroisse]  [🎓 Scolaire]  [✚ Médical]  [📖 Université]  [🌿 Agropastoral]  [🏢 Immeuble]  [◻ Terrain]
```

Chaque item : icône (14px) + label texte (12px, couleur gris) — séparés par des espaces généreux.
Les icônes ont la couleur correspondante à celle des marqueurs sur la carte.

---

## INTERACTIONS ET COMPORTEMENTS ATTENDUS

### Recherche intelligente
- Frappe → résultats apparaissent instantanément (debounce 300ms)
- Résultats groupés par catégorie (Paroisses / Œuvres / Districts / Régions)
- Sélection → zoom automatique sur la carte + ouverture du panneau détail
- Touche Échap → vide la recherche

### Filtres en temps réel
- Chaque changement de filtre met à jour la carte immédiatement (pas besoin de cliquer "Appliquer" pour les filtres de type)
- Le bouton "Appliquer" sert pour les filtres numériques (fidèles min, etc.)
- Le compteur d'éléments dans chaque case à cocher se met à jour

### Navigation hiérarchique sur la carte
- Clic sur un polygone de région → zoom sur la région + popup léger avec : nom, nb districts, nb paroisses
- Clic sur un cluster → dézoom progressif
- Scroll molette → zoom habituel
- Double-clic → zoom centré sur le point cliqué

### Mode plein écran
- Bouton plein écran : cache sidebar gauche + barre légende + barre navigation
- Seule la carte reste visible avec ses contrôles
- Un bouton "Quitter plein écran" apparaît discrètement en haut à gauche
- ESC quitte aussi le plein écran

### Responsive (mobile)
- Sur mobile (<768px) : la sidebar gauche devient un panneau qui s'ouvre via un bouton filtre en bas
- La carte prend 100% de l'écran
- La barre de navigation se simplifie (logo + bouton menu burger)

---

## CE QUE JE VEUX VOIR DANS LA MAQUETTE CLAUDE DESIGN

Merci de me montrer :

1. **La page principale complète** : navbar + sidebar gauche + carte + légende en bas
2. **Le panneau détail ouvert** : quand on clique sur une paroisse, panneau slidé depuis la droite
3. **L'état mobile** : comment la sidebar et la carte s'organisent sur téléphone
4. **La dropdown de recherche** : autocomplétion avec résultats groupés

---

## RÉFÉRENCES VISUELLES À ÉTUDIER

Voici les interfaces dont je m'inspire — montre-moi quelque chose dans cet esprit :

1. **Google Maps** (maps.google.com) — pour la structure générale : sidebar gauche + carte plein écran + panneau détail qui slide
2. **CartoDB / CARTO** (carto.com/platform) — pour la qualité professionnelle cartographique
3. **uMap** (umap.openstreetmap.fr) — pour la légèreté et la clarté de l'interface cartographique institutionnelle
4. **UNHCR Data Portal** (data.unhcr.org) — pour l'aspect institutionnel sobre avec des données géographiques

Ces références donnent le ton : **sobre, cartographique, professionnel, lisible**. Pas de "landing page", pas de marketing.

---

## RÉPONSES AUX QUESTIONS QUE CLAUDE DESIGN POURRAIT POSER

**Q : Quel est votre public cible ?**
R : Large : des responsables d'église de 50 ans peu à l'aise avec le numérique, jusqu'à des ingénieurs et décideurs. L'interface doit être compréhensible par tous, sans formation préalable.

**Q : Quelle est la palette de couleurs souhaitée ?**
R : Vert #1B5E20 (principal) + Jaune/Or #F9A825 (accent) + Blanc #FFFFFF (fond). Pas d'autres couleurs sauf pour les icônes de types d'œuvres.

**Q : Quel style visuel souhaitez-vous ?**
R : Institutionnel, sobre, clean. Inspiré des portails gouvernementaux et SIG professionnels. Pas de "design moderne startup". Pas de dégradés. Pas d'arrondis excessifs.

**Q : Sur quels appareils ?**
R : Desktop en priorité (90% des usages des admins). Compatible mobile (responsive) pour le grand public.

**Q : Avez-vous un logo ?**
R : Oui — logo EEC, vert et jaune. À placer en haut à gauche de la navbar.

**Q : Quel est l'élément le plus important de la page ?**
R : La carte interactive. Tout le reste lui est subordonné.

**Q : Souhaitez-vous des animations ?**
R : Oui mais discrètes : slide du panneau détail (250ms ease-out), zoom progressif de la carte. Rien de spectaculaire.

---

## NOTE FINALE POUR CLAUDE DESIGN

Cette plateforme sera déployée officiellement à l'échelle nationale au Cameroun.
Elle représente l'image institutionnelle de l'Église Évangélique du Cameroun.
La qualité du design reflète le sérieux de l'institution.

**Le design ne doit jamais donner l'impression d'avoir été généré automatiquement.**
Il doit sembler avoir été pensé par des designers professionnels pour une institution respectée.

Merci de ne pas utiliser de templates génériques. Pense à ce que verrait un évêque de 60 ans qui ouvre cette page pour la première fois : clarté, dignité, facilité d'usage.
