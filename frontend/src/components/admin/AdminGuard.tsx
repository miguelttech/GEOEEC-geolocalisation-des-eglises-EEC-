'use client';

/* =============================================================================
   GARDE D'ACCÈS ADMINISTRATEUR — exigence de sécurité obligatoire.
   Le dashboard est verrouillé aux seuls administrateurs agréés :
   SUPER, REGION, DISTRICT, PAROISSE. Un compte VISITEUR (ou un anonyme)
   est redirigé immédiatement — il ne voit JAMAIS l'interface admin.
   (Le backend refuse de son côté les API admin aux non-admins : double barrière.)
   ============================================================================= */

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_ROLES = new Set(['SUPER', 'REGION', 'DISTRICT', 'PAROISSE']);
const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);   // null = vérification

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' });
        if (!r.ok) throw new Error('non authentifié');
        const me = await r.json();
        if (cancelled) return;
        if (ADMIN_ROLES.has(me.role)) setAllowed(true);
        else { setAllowed(false); router.replace('/carte'); }        // visiteur → carte
      } catch {
        if (!cancelled) { setAllowed(false); router.replace('/login'); } // anonyme → connexion
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (allowed !== true) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: '#0D1B12', color: '#7BE0A0',
                    fontFamily: 'system-ui', fontSize: 14, letterSpacing: '0.05em' }}>
        Vérification des autorisations…
      </div>
    );
  }
  return <>{children}</>;
}
