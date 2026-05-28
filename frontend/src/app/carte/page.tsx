'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { MapUser } from '@/components/eec/EECMapApp';

const EECMapApp = dynamic(() => import('@/components/eec/EECMapApp'), { ssr: false });

type AuthState = 'loading' | 'visitor' | 'public';

export default function CartePage() {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<MapUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me/', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: MapUser) => {
        setUser(d);
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
