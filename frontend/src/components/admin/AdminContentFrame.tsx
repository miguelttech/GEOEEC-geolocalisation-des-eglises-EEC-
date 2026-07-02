'use client';

/* =============================================================================
   EXIGENCE (Dashboard) : quand l'admin ouvre « Carte interactive », le panneau
   principal (Topbar + marges) se décale/disparaît avec une animation fluide,
   la carte prend le maximum d'espace, et SEULE la barre latérale d'icônes
   reste visible. On détecte la route /admin/map et on bascule le Topbar +
   le padding du contenu en conséquence, avec transition CSS.
   ============================================================================= */

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Topbar from './Topbar';

export default function AdminContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullMap = pathname === '/admin/map';

  return (
    <div className={'admin-main' + (isFullMap ? ' admin-main--fullmap' : '')}>
      <div className={'admin-topbar-wrap' + (isFullMap ? ' collapsed' : '')}>
        <Topbar />
      </div>
      <div className={'admin-content' + (isFullMap ? ' admin-content--flush' : '')}>
        {children}
      </div>
    </div>
  );
}
