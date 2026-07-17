'use client';
import React from 'react';
import { I } from './icons';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

interface DashboardStats {
  nb_paroisses: number;
  nb_districts: number;
}

export default function ScopeBar() {
  const [regionNom, setRegionNom] = React.useState('—');
  const [nbParoisses, setNbParoisses] = React.useState<number | null>(null);
  const [nbDistricts, setNbDistricts] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { region_nom?: string | null }) => setRegionNom(d.region_nom || '—'))
      .catch(() => {});
    fetch(`${BACKEND}/api/auth/dashboard-stats/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: DashboardStats) => { setNbParoisses(d.nb_paroisses); setNbDistricts(d.nb_districts); })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      background: 'rgba(91,155,213,0.07)',
      borderBottom: '1px solid rgba(91,155,213,0.20)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(91,155,213,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5B9BD5',
        }}>
          <I.compass size={15} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, lineHeight: 1 }}>Région Synodale</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#5B9BD5', lineHeight: 1.3 }}>{regionNom}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(91,155,213,0.20)' }} />

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.church size={13} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{nbParoisses ?? '—'}</span> paroisses
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.network size={13} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{nbDistricts ?? '—'}</span> districts
          </span>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(91,155,213,0.70)' }}>
        <I.shield size={12} />
        <span>Scope limité à votre région</span>
      </div>
    </div>
  );
}
