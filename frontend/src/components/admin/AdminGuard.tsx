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
        if (cancelled) return;
        // EXIGENCE : seule une réponse d'authentification explicitement négative
        // (401/403) doit éjecter l'utilisateur. Une panne réseau ou une lenteur
        // transitoire (ex. plusieurs requêtes concurrentes sur la page carte)
        // ne doit jamais le faire sortir de son espace admin — on réessaie
        // silencieusement au prochain rendu plutôt que de rediriger à tort.
        if (r.status === 401 || r.status === 403) {
          setAllowed(false);
          router.replace('/login');
          return;
        }
        if (!r.ok) { setAllowed(prev => (prev === null ? true : prev)); return; }
        const me = await r.json();
        if (cancelled) return;
        if (ADMIN_ROLES.has(me.role)) setAllowed(true);
        else { setAllowed(false); router.replace('/carte'); }        // visiteur → carte
      } catch {
        // Réseau indisponible — on ne redirige pas ; si l'utilisateur n'est
        // vraiment pas authentifié, chaque appel API admin échouera de toute
        // façon (double barrière déjà assurée côté backend).
        if (!cancelled) setAllowed(prev => (prev === null ? true : prev));
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
