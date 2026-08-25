'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { HorizontalBars, Donut } from '@/components/admin/atoms';
import { api, type DashboardStats, type District } from '@/lib/api';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface RegionStats extends DashboardStats {
  oeuvres_par_type: { type: string; count: number; color: string }[];
  top_paroisses_fideles: { name: string; fideles: number }[];
  validations_attente: number;
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function Skeleton({ h = 24 }: { h?: number }) {
  return <div style={{ height: h, width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: 6, animation: 'pulse 1.4s ease infinite' }} />;
}

function StatCard({ icon, label, value, sub, color = 'var(--green)' }: {
  icon: keyof typeof I; label: string; value: string | number; sub?: string; color?: string;
}) {
  const Ic = I[icon];
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '20', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {Ic && <Ic size={17} />}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div className="sg" style={{ fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardRegionalPage() {
  const [stats, setStats]     = React.useState<RegionStats | null>(null);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');
  const annee = 2025;

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<RegionStats>(`/api/auth/dashboard-stats/?annee=${annee}`),
      api.get<{ count: number; results: District[] }>(`/api/geo/districts/?page_size=200`),
    ])
      .then(([s, d]) => { setStats(s); setDistricts(d.results); })
      .catch(e => setError(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div style={{ padding: 32, color: '#FF6B6B' }}>
      <I.alert size={18} /> {error}
      <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={() => setError('')}>Réessayer</button>
    </div>
  );

  const s = stats;
  const districtBars = districts
    .filter(d => (d.nb_fideles ?? 0) > 0)
    .sort((a, b) => (b.nb_fideles ?? 0) - (a.nb_fideles ?? 0))
    .slice(0, 12)
    .map(d => ({ label: d.nom, value: d.nb_fideles ?? 0 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1 — KPI stats */}
      <div className="g g-5" style={{ gap: 12 }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="card" style={{ padding: 16 }}><Skeleton h={70} /></div>) : (<>
          <StatCard icon="network"  label="Districts"    value={s?.nb_districts ?? 0}  sub="dans la région"              color="#5B9BD5" />
          <StatCard icon="church"   label="Paroisses"    value={s?.nb_paroisses ?? 0}  sub={`${s?.nb_paroisses_sans_gps ?? 0} sans GPS`} color="#5AC472" />
          <StatCard icon="hexagon"  label="Œuvres"       value={s?.nb_oeuvres ?? 0}    sub="toutes catégories"           color="#E67A2E" />
          <StatCard icon="briefcase" label="Ouvriers"    value={s?.nb_ouvriers ?? 0}   sub="tous statuts"                color="#B377D9" />
          <StatCard icon="users"    label="Fidèles"      value={(s?.total_fideles ?? 0).toLocaleString('fr')} sub="communiants + non-comm." color="#FFD600" />
        </>)}
      </div>

      {/* Row 2 — Sub-stats */}
      <div className="g g-3" style={{ gap: 12 }}>
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="card" style={{ padding: 16 }}><Skeleton h={56} /></div>) : (<>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Communiants</div>
            <div className="sg" style={{ fontSize: 24, color: '#5AC472' }}>{(s?.total_communiants ?? 0).toLocaleString('fr')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Non-comm. : {(s?.total_non_communiants ?? 0).toLocaleString('fr')}</div>
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sans GPS</div>
            <div className="sg" style={{ fontSize: 24, color: (s?.nb_paroisses_sans_gps ?? 0) > 5 ? '#FF8A7A' : '#FFD600' }}>{s?.nb_paroisses_sans_gps ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>sur {s?.nb_paroisses ?? 0} paroisses</div>
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>En attente validation</div>
            <div className="sg" style={{ fontSize: 24, color: (s?.validations_attente ?? 0) > 0 ? '#FFD600' : '#5AC472' }}>{s?.validations_attente ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>statistiques à valider</div>
          </div>
        </>)}
      </div>

      {/* Row 3 — Charts */}
      <div className="g g-2-1" style={{ gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Fidèles par district</div>
          {loading ? <Skeleton h={180} /> : districtBars.length ? <HorizontalBars data={districtBars} /> :
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune donnée de fidèles</div>}
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Répartition des œuvres</div>
          {loading ? <Skeleton h={180} /> : s?.oeuvres_par_type?.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Donut segments={s.oeuvres_par_type.map(o => ({ count: o.count, color: o.color }))} total={s.nb_oeuvres} label="œuvres" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                {s.oeuvres_par_type.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-2)' }}>{o.type}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text)' }}>{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune œuvre enregistrée</div>}
        </div>
      </div>

      {/* Row 4 — Top paroisses */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Top paroisses par fidèles</div>
        {loading ? <Skeleton h={180} /> : s?.top_paroisses_fideles?.length ? (
          <HorizontalBars data={s.top_paroisses_fideles.map(p => ({ label: p.name, value: p.fideles }))} />
        ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune donnée de fidèles</div>}
      </div>

      {/* Row 5 — Districts table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sg-md" style={{ fontSize: 14 }}>Districts de la région</div>
          <a href="/admin/regional/districts" style={{ fontSize: 12, color: '#5B9BD5', textDecoration: 'none' }}>Voir tous →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table className="data">
          <thead>
            <tr>
              <th>District</th>
              <th style={{ textAlign: 'right' }}>Paroisses</th>
              <th style={{ textAlign: 'right' }}>Fidèles</th>
              <th style={{ textAlign: 'right' }}>Ouvriers</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={4}><Skeleton h={28} /></td></tr>)
            ) : districts.length ? districts.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 500 }}>{d.nom}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.nb_paroisses}</td>
                <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(d.nb_fideles ?? 0).toLocaleString('fr')}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.nb_ouvriers ?? 0}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Aucun district trouvé</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
}
