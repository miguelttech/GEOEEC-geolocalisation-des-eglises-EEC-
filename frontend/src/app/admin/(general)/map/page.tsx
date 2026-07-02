'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapUser } from '@/components/eec/EECMapApp';

const EECMapApp = dynamic(() => import('@/components/eec/EECMapApp'), { ssr: false });

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

// EXIGENCE : chaque administrateur possède désormais sa propre carte — favoris,
// historique, recherches et itinéraires doivent être personnels et persistants,
// comme pour un visiteur authentifié. On récupère donc le compte admin courant
// et on le transmet à EECMapApp en mode « visitor » (déverrouille ces fonctions).
export default function AdminMapPage() {
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
    <div style={{ height: '100%' }}>
      <EECMapApp embedded mode="visitor" user={user} />
    </div>
  );
}
