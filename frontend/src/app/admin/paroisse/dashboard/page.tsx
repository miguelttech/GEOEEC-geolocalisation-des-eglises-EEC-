'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { GpsCell } from '@/components/admin/atoms';
import { api, type DashboardStats, type Paroisse, type Ouvrier, type Oeuvre } from '@/lib/api';

/* ── Types ────────────────────────────────────────────────────────────────── */
type ParoisseStats = DashboardStats;

const C = '#E67A2E';

function Skeleton({ h = 24 }: { h?: number }) {
  return <div style={{ height: h, width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: 6, animation: 'pulse 1.4s ease infinite' }} />;
}

function StatCard({ label, value, sub, color = C }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div className="sg" style={{ fontSize: 32, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardParoissePage() {
  const [stats, setStats]       = React.useState<ParoisseStats | null>(null);
  const [paroisse, setParoisse] = React.useState<Paroisse | null>(null);
  const [ouvriers, setOuvriers] = React.useState<Ouvrier[]>([]);
  const [oeuvres, setOeuvres]   = React.useState<Oeuvre[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState('');
  const annee = 2025;

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<ParoisseStats>(`/api/auth/dashboard-stats/?annee=${annee}`),
      api.get<{ count: number; results: Paroisse[] }>(`/api/geo/paroisses/?page_size=1`),
      api.get<{ count: number; results: Ouvrier[] }>(`/api/ouvriers/ouvriers/?page_size=200`),
      api.get<{ count: number; results: Oeuvre[] }>(`/api/oeuvres/oeuvres/?page_size=200`),
    ])
      .then(([s, p, o, oe]) => {
        setStats(s);
        setParoisse(p.results[0] ?? null);
        setOuvriers(o.results);
        setOeuvres(oe.results);
      })
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1 — 4 KPI */}
      <div className="g g-4" style={{ gap: 12 }}>
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ padding: 16 }}><Skeleton h={70} /></div>) : (<>
          <StatCard label="Fidèles"     value={(s?.total_fideles ?? 0).toLocaleString('fr')} sub="total communiants + non-comm." color={C} />
          <StatCard label="Communiants" value={(s?.total_communiants ?? 0).toLocaleString('fr')} sub={`Non-comm. : ${(s?.total_non_communiants ?? 0).toLocaleString('fr')}`} color="#5AC472" />
          <StatCard label="Ouvriers"    value={ouvriers.length} sub="dans cette paroisse" color="#9B72CF" />
          <StatCard label="Œuvres"      value={oeuvres.length}  sub="liées à la paroisse"  color="#5B9BD5" />
        </>)}
      </div>

      {/* Row 2 — Informations générales */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations générales</div>
        {loading ? <Skeleton h={140} /> : paroisse ? (<>
          {[
            { label: 'Catégorie', value: paroisse.categorie ?? '—' },
            { label: 'District',  value: paroisse.district_nom },
            { label: 'Région',    value: paroisse.region_nom },
            { label: 'Adresse',   value: paroisse.adresse || '—' },
            { label: 'Contact',   value: paroisse.telephone || paroisse.email || '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-3)' }}>GPS :</span>
            <GpsCell ok={paroisse.latitude != null} />
            {paroisse.latitude != null && paroisse.longitude != null && (
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{paroisse.latitude.toFixed(4)}, {paroisse.longitude.toFixed(4)}</span>
            )}
          </div>
        </>) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune paroisse rattachée à ce compte</div>}
      </div>

      {/* Row 4 — Ouvriers */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sg-md" style={{ fontSize: 14 }}>Ouvriers de la paroisse</div>
          <a href="/admin/paroisse/ouvriers" style={{ fontSize: 12, color: C, textDecoration: 'none' }}>Voir tous →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table className="data">
          <thead>
            <tr><th>Ouvrier</th><th>Grade</th><th>Téléphone</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={4}><Skeleton h={28} /></td></tr>)
            ) : ouvriers.length ? ouvriers.map(o => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: C + '22', color: C, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {(o.prenom[0] ?? '') + (o.nom[0] ?? '')}
                    </div>
                    <span style={{ fontWeight: 500 }}>{o.prenom} {o.nom}</span>
                  </div>
                </td>
                <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: C + '18', color: C }}>{o.grade_abreviation || o.grade_nom || '—'}</span></td>
                <td className="mono" style={{ fontSize: 11 }}>{o.telephone || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{o.statut === 'OCCUPE' ? 'En poste' : 'Inoccupé'}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Aucun ouvrier enregistré</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
}
