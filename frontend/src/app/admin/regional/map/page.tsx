'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapUser } from '@/components/eec/EECMapApp';

const EECMapApp = dynamic(() => import('@/components/eec/EECMapApp'), { ssr: false });

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

// EXIGENCE : favoris/historique/itinéraires propres à l'administrateur régional
// connecté, persistants en base — jamais un user=null anonyme.
export default function MapPage() {
  const [user, setUser] = useState<MapUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: MapUser) => setUser(d))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <div style={{ margin: '-28px -32px', height: 'calc(100vh - 60px)' }}>
      <EECMapApp embedded mode="visitor" user={user} />
    </div>
  );
}
