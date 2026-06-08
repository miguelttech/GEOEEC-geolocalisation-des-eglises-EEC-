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
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: MapUser) => {
        setUser(d);
        // Seul le rôle VISITEUR voit la carte débloquée
        // Les admins restent en mode public sur la carte publique (leur outil = l'admin dashboard)
        setState(d.role === 'VISITEUR' ? 'visitor' : 'public');
      })
      .catch(() => setState('public'));
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
