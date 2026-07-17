'use client';

import { useEffect, useState } from 'react';

/**
 * Un verset biblique, découpé en deux parties pour l'affichage :
 *  - `pre`       : le début de la citation (peut contenir des sauts de ligne "\n")
 *  - `emphasis`  : la clause finale, mise en évidence (couleur d'accent)
 *  - `ref`       : la référence biblique
 *
 * Le texte ne contient volontairement AUCUN guillemet littéral : c'est à
 * chaque composant d'affichage (landing vs pages d'authentification) de
 * décider d'en ajouter ou non, pour un rendu cohérent quel que soit le
 * verset tiré au sort.
 */
export interface BibleVerse {
  pre: string;
  emphasis: string;
  ref: string;
}

export const BIBLE_VERSES: BibleVerse[] = [
  {
    pre: 'Ta parole est une lampe à mes pieds,',
    emphasis: 'et une lumière sur mon sentier.',
    ref: 'Psaume 119 : 105',
  },
  {
    pre: 'Allez, faites de toutes les nations des disciples,\nles baptisant au nom du Père, du Fils',
    emphasis: 'et du Saint-Esprit.',
    ref: 'Matthieu 28 : 19',
  },
  {
    pre: 'Vous n’êtes plus des étrangers ni des gens de passage,\nmais vous êtes concitoyens des saints,',
    emphasis: 'membres de la famille de Dieu.',
    ref: 'Éphésiens 2 : 19',
  },
  {
    pre: 'Invoque-moi, et je te répondrai ;',
    emphasis: 'je t’annoncerai de grandes choses.',
    ref: 'Jérémie 33 : 3',
  },
  {
    pre: 'Sois fort et courageux.',
    emphasis: 'Car l’Éternel, ton Dieu, est avec toi.',
    ref: 'Josué 1 : 9',
  },
  {
    pre: 'Je puis tout',
    emphasis: 'par celui qui me fortifie.',
    ref: 'Philippiens 4 : 13',
  },
  {
    pre: 'Confie-toi en l’Éternel de tout ton cœur,',
    emphasis: 'et il aplanira tes sentiers.',
    ref: 'Proverbes 3 : 5-6',
  },
  {
    pre: 'Ne crains rien, car je suis avec toi ;',
    emphasis: 'je te fortifierai, je viens à ton secours.',
    ref: 'Ésaïe 41 : 10',
  },
  {
    pre: 'Toutes choses concourent au bien de ceux qui aiment Dieu,',
    emphasis: 'de ceux qui sont appelés selon son dessein.',
    ref: 'Romains 8 : 28',
  },
  {
    pre: 'Car Dieu a tant aimé le monde\nqu’il a donné son Fils unique,',
    emphasis: 'afin que quiconque croit en lui ait la vie éternelle.',
    ref: 'Jean 3 : 16',
  },
];

const TRANSITION_MS = 550;

/**
 * Fait défiler les versets bibliques de manière aléatoire et continue.
 * - Un verset de départ aléatoire est tiré à chaque montage du composant
 *   (l'utilisateur ne voit donc pas systématiquement le même verset).
 * - Le verset change automatiquement toutes les `intervalMs` millisecondes,
 *   avec une transition douce (fondu + léger glissement) laissant le temps
 *   de lire avant de passer au suivant.
 */
export function useBibleVerse(intervalMs = 8000) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BIBLE_VERSES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex(i => (i + 1) % BIBLE_VERSES.length);
        setVisible(true);
      }, TRANSITION_MS);
      return () => clearTimeout(swap);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return { verse: BIBLE_VERSES[index], visible };
}
