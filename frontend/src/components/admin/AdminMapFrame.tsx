'use client';

/* =============================================================================
   EXIGENCE : quand la carte interactive est affichée, la barre latérale et le
   bandeau supérieur (topbar/scopebar) doivent se replier pour offrir un
   maximum de surface à la carte, avec une transition fluide. On détecte la
   route .../map et on bascule les wrappers en conséquence.
   ============================================================================= */

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function AdminMapFrame({ sidebar, topbar, children }: {
  sidebar: ReactNode; topbar: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname();
  const isFullMap = pathname.endsWith('/map');

  return (
    <>
      <div className={'admin-sidebar-wrap' + (isFullMap ? ' collapsed' : '')}>
        {sidebar}
      </div>
      <div className={'admin-main' + (isFullMap ? ' admin-main--fullmap' : '')}>
        <div className={'admin-topbar-wrap' + (isFullMap ? ' collapsed' : '')}>
          {topbar}
        </div>
        <div className={'admin-content' + (isFullMap ? ' admin-content--flush' : '')}>
          {children}
        </div>
      </div>
    </>
  );
}
