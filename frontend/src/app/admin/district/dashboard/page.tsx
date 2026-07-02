'use client';
import dynamic from 'next/dynamic';
import { I } from '@/components/admin/icons';
import { CompleteBar, HorizontalBars, Donut, LineChart } from '@/components/admin/atoms';
import {
  MOCK_DISTRICT, PAROISSES_DISTRICT, JOURNAL_DISTRICT,
  STATS_PAROISSES_DISTRICT, FIDELES_EVOLUTION_DISTRICT,
} from '@/components/admin/dataDistrict';

const MiniLeafletMap = dynamic(() => import('@/components/admin/MiniLeafletMap'), { ssr: false });

const C = '#9B72CF';

function StatCard({ icon, label, value, sub, color = C }: {
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

export default function DashboardDistrictPage() {
  const sansgps = PAROISSES_DISTRICT.filter(p => !p.gps).length;
  const enAttente = PAROISSES_DISTRICT.filter(p => p.statut === 'en_attente').length;
  const avgComplete = Math.round(PAROISSES_DISTRICT.reduce((a, p) => a + p.complete, 0) / PAROISSES_DISTRICT.length);

  const paroissesBars = STATS_PAROISSES_DISTRICT.map(p => ({
    label: p.paroisse.replace('Bafoussam-', 'BFS-'),
    value: p.total,
  }));

  const categories = [
    { count: PAROISSES_DISTRICT.filter(p => p.categorie === 'C1').length, color: '#5AC472' },
    { count: PAROISSES_DISTRICT.filter(p => p.categorie === 'C2').length,  color: C },
    { count: PAROISSES_DISTRICT.filter(p => p.categorie === 'C3').length,   color: '#E67A2E' },
  ];

  const fidEvol = FIDELES_EVOLUTION_DISTRICT.map(e => ({ year: e.year, comm: e.comm, noncomm: e.noncomm }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1 — KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard icon="church"  label="Paroisses" value={MOCK_DISTRICT.nbParoisses}  sub="unités paroissiales"       color={C} />
        <StatCard icon="users"   label="Fidèles"   value={MOCK_DISTRICT.totalFideles.toLocaleString('fr')} sub="communiants + non-comm." color="#FFD600" />
        <StatCard icon="user"    label="Ouvriers"  value={MOCK_DISTRICT.nbOuvriers}   sub="7 grades différents"      color="#5AC472" />
        <StatCard icon="hexagon" label="Œuvres"    value={MOCK_DISTRICT.nbOeuvres}    sub="dans ce district"         color="#E67A2E" />
      </div>

      {/* Row 2 — Sub-stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Communiants</div>
          <div className="sg" style={{ fontSize: 24, color: '#5AC472' }}>{MOCK_DISTRICT.communiants.toLocaleString('fr')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Non-comm. : {MOCK_DISTRICT.nonCommuniants.toLocaleString('fr')}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sans GPS</div>
          <div className="sg" style={{ fontSize: 24, color: sansgps > 3 ? '#FF8A7A' : '#FFD600' }}>{sansgps}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>sur {MOCK_DISTRICT.nbParoisses} paroisses</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>En attente</div>
          <div className="sg" style={{ fontSize: 24, color: enAttente > 0 ? '#FFD600' : '#5AC472' }}>{enAttente}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>modifications à valider</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Score moyen</div>
          <div className="sg" style={{ fontSize: 24, color: C }}>{avgComplete}%</div>
          <CompleteBar pct={avgComplete} />
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Fidèles par paroisse</div>
          <HorizontalBars data={paroissesBars} />
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niveaux</div>
          <Donut segments={categories} total={MOCK_DISTRICT.nbParoisses} label="unités" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            {[{label:'Catégorie C1', color:'#5AC472'},{label:'Catégorie C2', color:C},{label:'Catégorie C3', color:'#E67A2E'}].map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }}/>
                <span style={{ color: 'var(--text-2)' }}>{n.label}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text)' }}>{categories[i].count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4 — Carte + Évolution + Activité */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MiniLeafletMap height={240} />
          <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-3)' }}>Zone — District Bafoussam Centre</div>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Évolution des fidèles</div>
          <LineChart data={fidEvol} />
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activité récente</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {JOURNAL_DISTRICT.slice(0, 5).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color + '22', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{a.who.split(' ').map((w: string) => w[0]).join('').slice(0,2)}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.who}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.action} — {a.entity}</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, marginLeft: 'auto' }}>{a.time.split(' ')[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5 — Tableau paroisses */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sg-md" style={{ fontSize: 14 }}>Paroisses du district</div>
          <a href="/admin/district/paroisses" style={{ fontSize: 12, color: C, textDecoration: 'none' }}>Voir toutes →</a>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Paroisse</th>
              <th>Niveau</th>
              <th style={{ textAlign: 'right' }}>Fidèles</th>
              <th style={{ textAlign: 'right' }}>Ouvriers</th>
              <th>Score</th>
              <th>GPS</th>
            </tr>
          </thead>
          <tbody>
            {PAROISSES_DISTRICT.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{p.nom}</td>
                <td>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                    background: p.categorie === 'C1' ? 'rgba(90,196,114,0.12)' : p.categorie === 'C2' ? 'rgba(155,114,207,0.12)' : 'rgba(230,122,46,0.12)',
                    color: p.categorie === 'C1' ? '#5AC472' : p.categorie === 'C2' ? C : '#E67A2E',
                  }}>{p.categorie}</span>
                </td>
                <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.fideles.toLocaleString('fr')}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{p.ouvriers}</td>
                <td style={{ width: 120 }}><CompleteBar pct={p.complete} /></td>
                <td>
                  <span style={{ fontSize: 11, color: p.gps ? '#5AC472' : '#FF8A7A' }}>{p.gps ? '✓ GPS' : '✗ GPS'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistiques vitales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Baptêmes', value: MOCK_DISTRICT.baptemes, color: '#5B9BD5', icon: 'droplets' },
          { label: 'Mariages', value: MOCK_DISTRICT.mariages,  color: '#5AC472', icon: 'heart' },
          { label: 'Décès',    value: MOCK_DISTRICT.deces,     color: '#94A3B8', icon: 'minus' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: s.color + '18', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              {s.label === 'Baptêmes' ? '💧' : s.label === 'Mariages' ? '💍' : '✝'}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label} 2025</div>
              <div className="sg" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
