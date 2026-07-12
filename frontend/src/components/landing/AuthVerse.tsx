'use client';

import { useBibleVerse } from '@/lib/bible-verses';

/**
 * Bloc de verset biblique utilisé sur les pages d'authentification
 * (connexion, inscription, mot de passe oublié, changement de mot de passe).
 * Le verset change automatiquement, avec une transition douce, et l'utilisateur
 * ne voit pas systématiquement le même verset à chaque visite.
 */
export default function AuthVerse({ intervalMs = 7500 }: { intervalMs?: number }) {
  const { verse, visible } = useBibleVerse(intervalMs);
  const lines = verse.pre.split('\n');

  return (
    <div className={`ls-quote verse-fade ${visible ? 'verse-in' : 'verse-out'}`}>
      {lines.map((line, i) => {
        const isFirst = i === 0;
        const isLast  = i === lines.length - 1;
        const text = isFirst ? `“ ${line}` : line;
        return isLast ? (
          <q key={i}>{text} <em>{verse.emphasis} ”</em></q>
        ) : (
          <q key={i}>{text}</q>
        );
      })}
      <p className="ls-ref">— {verse.ref}</p>
    </div>
  );
}
