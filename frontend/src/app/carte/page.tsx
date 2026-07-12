'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { MapUser } from '@/components/eec/EECMapApp';

const EECMapApp = dynamic(() => import('@/components/eec/EECMapApp'), { ssr: false });

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

type AuthState = 'loading' | 'visitor' | 'public';

export default function CartePage() {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<MapUser | null>(null);

  useEffect(() => {
    const checkSession = () => {
      fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include', cache: 'no-store' })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((d: MapUser) => {
          // Seul le rôle VISITEUR voit la carte débloquée avec son identité affichée.
          // Les admins restent en mode public sur la carte publique (leur outil = l'admin
          // dashboard) : on ne conserve donc PAS leur identité ici, sinon la navbar
          // afficherait le nom d'un compte admin sur une page censée être anonyme.
          if (d.role === 'VISITEUR') {
            setUser(d);
            setState('visitor');
          } else {
            setUser(null);
            setState('public');
          }
        })
        .catch(() => { setUser(null); setState('public'); });
    };

    checkSession();

    // Le bouton "Précédent" du navigateur peut restaurer cette page depuis le
    // bfcache (état figé, sans réexécuter ce useEffect) après une déconnexion
    // ailleurs dans l'app : on force une revérification de session à chaque
    // restauration pour éviter d'afficher un compte qui n'est plus connecté.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSession();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (state === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0D1A0F', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(93,191,122,0.2)',
          borderTopColor: '#5DBF7A', borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
        <span style={{ color: 'rgba(240,244,241,0.45)', fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }}>
          Vérification de la session…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <EECMapApp
      mode={state === 'visitor' ? 'visitor' : 'public'}
      user={user}
    />
  );
}
