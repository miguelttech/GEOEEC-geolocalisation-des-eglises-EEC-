/**
 * =============================================================================
 * PALETTE DE VISUALISATION GÉOEEC
 * =============================================================================
 *
 * Source unique des couleurs porteuses de DONNÉE (marqueurs, choroplèthe,
 * échelles). Ne concerne pas l'habillage de l'interface, qui reste piloté par
 * les variables CSS de globals.css.
 *
 * Toutes les valeurs ci-dessous ont été MESURÉES, pas choisies à l'œil :
 * séparation en vision déficiente (protanopie/deutéranopie, modèle
 * Machado-Oliveira-Fernandes 2009), bande de clarté OKLCH, plancher de chroma
 * et contraste sur les deux surfaces du projet. Les résultats sont reportés
 * en commentaire à chaque bloc. Toute modification doit être revalidée.
 *
 * SURFACES DE RÉFÉRENCE (globals.css) :
 *   clair  #F8F9FA      sombre  #0D1B12
 *
 * =============================================================================
 */

/** Surfaces sur lesquelles les contrastes ci-dessous ont été mesurés. */
export const VIZ_SURFACES = { light: '#F8F9FA', dark: '#0D1B12' } as const;

/**
 * ---------------------------------------------------------------------------
 * 1. PALETTE CATÉGORIELLE — identité des entités sur la carte
 * ---------------------------------------------------------------------------
 *
 * POURQUOI 3 TEINTES ET NON 7 :
 *   La carte est une forme « toutes paires » — n'importe quels deux marqueurs
 *   peuvent se retrouver côte à côte, contrairement à un histogramme où seules
 *   les barres voisines se touchent. Le contrôle est donc bien plus exigeant.
 *
 *   Les 7 couleurs d'origine (une par type d'entité) échouent durement dans
 *   les deux modes :
 *     - #455A64 et #5D4037 sous le plancher de chroma → lus comme du gris
 *     - #5D4037 ↔ #B71C1C : ΔE 4.7 en protanopie (marron vs rouge sombre)
 *     - #5D4037 ↔ #455A64 : ΔE 9.0 en vision NORMALE, sous le plancher de 15
 *     - mode sombre : 4 des 7 sous 3:1 de contraste
 *
 *   Aucun réagencement ne corrige cela : au-delà de trois teintes, une forme
 *   « toutes paires » ne peut plus garantir la distinction. La réponse n'est
 *   pas une autre palette mais MOINS de teintes.
 *
 *   Les 7 types restent parfaitement distincts : chacun porte un GLYPHE propre
 *   (croix, toque, croix médicale, livre, feuille, immeuble, champs — voir
 *   TYPE_ICON dans components/eec/icons.tsx). La couleur porte la FAMILLE,
 *   le glyphe porte le type précis.
 *
 * VALIDATION (--pairs all, les deux modes) :
 *   bande de clarté  PASS · chroma PASS · contraste PASS (clair)
 *   CVD              ΔE 11.1 (#AD1457 ↔ #2E9744, deutéranopie) — cible ≥ 8
 *   vision normale   ΔE 26.9 — plancher ≥ 15
 *
 *   En mode sombre, #AD1457 mesure 2.55:1 contre la surface, sous le seuil
 *   de 3:1. Le relief est structurel : chaque marqueur porte un contour blanc
 *   de 1.6 px et un glyphe blanc (markerSvg), soit le halo cartographique
 *   classique — le marqueur ne repose jamais sur le seul contraste de sa
 *   couleur de remplissage. S'y ajoutent les étiquettes au zoom ≥ 13 et la
 *   vue liste. L'alternative #C2185B passait le contraste mais retombait à
 *   ΔE 6.7 en CVD : séparation privilégiée, le halo réglant la lisibilité.
 */
export const VIZ_CATEGORICAL = {
  /** Paroisses — vert de marque EEC. */
  paroisses: '#2E9744',
  /** Œuvres de service aux personnes : scolaire, universitaire, médical. */
  services: '#1565C0',
  /** Patrimoine : agropastoral, immeubles, terrains. */
  patrimoine: '#AD1457',
} as const;

/** Rattachement de chaque type d'entité à sa famille de couleur. */
export const FAMILLE_PAR_TYPE: Record<string, keyof typeof VIZ_CATEGORICAL> = {
  paroisse: 'paroisses',
  scolaire: 'services',
  univ:     'services',
  medical:  'services',
  agro:     'patrimoine',
  immeuble: 'patrimoine',
  terrain:  'patrimoine',
};

/** Couleur d'un type d'entité, via sa famille. */
export const couleurPourType = (type: string): string =>
  VIZ_CATEGORICAL[FAMILLE_PAR_TYPE[type] ?? 'paroisses'];

/**
 * ---------------------------------------------------------------------------
 * 2. RAMPE SÉQUENTIELLE — magnitude (effectifs de fidèles)
 * ---------------------------------------------------------------------------
 *
 * Teinte unique dérivée du vert EEC #2E9744 (OKLCH h = 147°). La progression
 * de CLARTÉ reprend exactement celle de la rampe séquentielle de référence des
 * conventions, déjà validée ; seule la teinte change. La chroma de chaque
 * marche est plafonnée par le gamut sRGB à cette clarté.
 *
 * Clarté strictement décroissante, écart minimal entre marches ΔL = 0.046 —
 * identique à la rampe de référence, dont les marches fines sont prévues pour
 * l'encodage continu.
 */
export const VIZ_SEQUENTIAL_GREEN = {
  100: '#cfe8d0', 150: '#b8dbbb', 200: '#a0d0a4', 250: '#88c38e',
  300: '#6fb877', 350: '#55ac62', 400: '#30a047', 450: '#179138',
  500: '#128131', 550: '#027127', 600: '#016220', 650: '#00531a',
  700: '#004414',
} as const;

/**
 * Classes du choroplèthe régional, du plus faible au plus fort effectif.
 *
 * ANCRAGE INVERSÉ EN MODE SOMBRE : en clair, « proche de zéro » se fond dans
 * la surface claire ; en sombre, c'est l'inverse — la classe basse se fond
 * dans la surface sombre et les valeurs fortes s'éclaircissent. Ce n'est pas
 * une inversion automatique de la rampe claire mais une sélection propre au
 * mode, validée contre sa propre surface.
 *
 * VALIDATION (contrôle de rampe) :
 *   clair   monotone PASS · écarts PASS · teinte unique PASS (dispersion 1°)
 *           extrémité claire 1.24:1 — VOULU : un choroplèthe est un encodage
 *           SÉQUENTIEL, où la marche la plus claire signifie « proche de zéro »
 *           et peut se fondre dans la surface. Les contours de régions (trait
 *           de 1.8 px) garantissent la lisibilité des limites. Ce seuil de 2:1
 *           ne s'applique qu'aux rampes ORDINALES (marches discrètes isolées).
 *   sombre  les quatre contrôles PASS, extrémité 2.34:1 contre #0D1B12
 */
export const VIZ_CHOROPLETH = {
  light: ['#cfe8d0', '#88c38e', '#30a047', '#027127', '#004414'],
  dark:  ['#016220', '#128131', '#55ac62', '#a0d0a4', '#cfe8d0'],
} as const;

/**
 * Rang d'importance des catégories officielles, du plus petit (1) au plus
 * grand (9) — indispensable pour toute échelle ORDONNÉE fondée sur elles.
 *
 * PIÈGE : le chiffre croît avec l'importance dans chaque lettre. C1 est la
 * plus PETITE catégorie et A2 passe devant A1. Colorer les catégories dans
 * l'ordre de présentation des documents EEC (A++, A1, A2, B1…) produirait
 * donc une échelle inversée dans les trois bandes.
 *
 * Source : matrice d'évaluation de « Catégorisation paroisses EEC 050826 »,
 * où la catégorie découle d'une note globale de 1 à 9 (poids économique +
 * poids démographique). L'effectif moyen suit ce rang, de 135 fidèles en C1
 * à 3 328 en A++.
 */
export const RANG_CATEGORIE: Record<string, number> = {
  C1: 1, C2: 2, C3: 3, C4: 4,
  B1: 5, B2: 6,
  A1: 7, A2: 8, 'A++': 9,
};

/**
 * ---------------------------------------------------------------------------
 * 3. SYMBOLES PROPORTIONNELS — magnitude par la TAILLE
 * ---------------------------------------------------------------------------
 *
 * L'effectif de fidèles est encodé par la taille du marqueur, jamais par sa
 * couleur : la couleur porte déjà l'identité de l'entité, et un canal ne peut
 * pas encoder deux variables.
 *
 * RACINE CARRÉE, PAS PROPORTION DIRECTE : l'œil compare des AIRES. Un rayon
 * proportionnel à la valeur donnerait une aire proportionnelle à son carré et
 * exagérerait massivement les grandes paroisses. On fait donc croître le rayon
 * comme la racine carrée de la valeur, pour que l'aire, elle, soit
 * proportionnelle à l'effectif.
 *
 * Bornes : de 53 à 4 606 fidèles en base, moyenne 340.
 */
export const TAILLE_MARQUEUR = {
  /** Paroisse au plus faible effectif. */
  min: 22,
  /** Paroisse au plus fort effectif. */
  max: 46,
  /**
   * Taille FIXE des œuvres. Elles ne portent pas d'effectif de fidèles : leur
   * donner une taille variable laisserait croire qu'elle mesure quelque chose.
   * Valeur au-dessous du milieu de l'échelle des paroisses, pour que les
   * œuvres ne se lisent pas comme de « grandes » paroisses.
   */
  oeuvre: 26,
} as const;

/**
 * Taille d'un marqueur pour un effectif donné.
 * `valeurMax` doit être le maximum du jeu affiché, pour que l'échelle reste
 * stable quand un filtre réduit l'ensemble.
 */
export function tailleParEffectif(valeur: number | null, valeurMax: number): number {
  const { min, max } = TAILLE_MARQUEUR;
  if (!valeur || valeur <= 0 || valeurMax <= 0) return min;
  const ratio = Math.sqrt(Math.min(valeur, valeurMax)) / Math.sqrt(valeurMax);
  return Math.round(min + (max - min) * ratio);
}
