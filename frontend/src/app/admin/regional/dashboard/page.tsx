'use client';
import dynamic from 'next/dynamic';
import { I } from '@/components/admin/icons';
import { CompleteBar, HorizontalBars, Donut, LineChart } from '@/components/admin/atoms';
import {
  MOCK_REGION_MIFI,
  DISTRICTS_MIFI,
  PAROISSES_MIFI,
  FIDELESEVOLUTION_MIFI,
  JOURNAL_MIFI,
  STATS_DISTRICTS_MIFI,
} from '@/components/admin/dataRegional';
import { OEUVRE_TYPES } from '@/components/admin/data';

const MiniLeafletMap = dynamic(() => import('@/components/admin/MiniLeafletMap'), { ssr: false });

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
  const sansgps = PAROISSES_MIFI.filter(p => !p.gps).length;
  const enAttente = PAROISSES_MIFI.filter(p => p.statut === 'en_attente').length;
  const avgComplete = Math.round(PAROISSES_MIFI.reduce((a, p) => a + p.complete, 0) / PAROISSES_MIFI.length);

  const oeuvresByType = OEUVRE_TYPES.map(t => ({
    label: t.key,
    value: [4, 2, 0, 1, 1, 0, 0][OEUVRE_TYPES.indexOf(t)] || 0,
  }));

  const districtBars = STATS_DISTRICTS_MIFI.map(d => ({
    label: d.district.replace('BAFOUSSAM ', 'BFS '),
    value: d.total,
  }));

  const niveaux = [
    { count: PAROISSES_MIFI.filter(p => p.niveau === 'PAROISSE').length, color: '#5AC472' },
    { count: PAROISSES_MIFI.filter(p => p.niveau === 'STATION').length,  color: '#5B9BD5' },
    { count: PAROISSES_MIFI.filter(p => p.niveau === 'ANNEXE').length,   color: '#E67A2E' },
  ];

  const fidEvol = FIDELESEVOLUTION_MIFI.map(e => ({
    year: Number(e.year),
    comm: e.comm,
    noncomm: e.noncomm,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1 — KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard icon="network"  label="Districts"    value={MOCK_REGION_MIFI.nbDistricts}  sub="dans la région MIFI"         color="#5B9BD5" />
        <StatCard icon="church"   label="Paroisses"    value={MOCK_REGION_MIFI.nbParoisses}  sub="dont stations & annexes"     color="#5AC472" />
        <StatCard icon="hexagon"  label="Œuvres"       value={MOCK_REGION_MIFI.nbOeuvres}    sub="8 types d'œuvres"            color="#E67A2E" />
        <StatCard icon="user"     label="Ouvriers"     value={MOCK_REGION_MIFI.nbOuvriers}   sub="8 grades hiérarchiques"      color="#B377D9" />
        <StatCard icon="users"    label="Fidèles"      value={MOCK_REGION_MIFI.totalFideles.toLocaleString('fr')} sub="communiants + non-comm." color="#FFD600" />
      </div>

      {/* Row 2 — Sub-stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Communiants</div>
          <div className="sg" style={{ fontSize: 24, color: '#5AC472' }}>{MOCK_REGION_MIFI.communiants.toLocaleString('fr')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Non-comm. : {MOCK_REGION_MIFI.nonCommuiants.toLocaleString('fr')}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Sans GPS</div>
          <div className="sg" style={{ fontSize: 24, color: sansgps > 5 ? '#FF8A7A' : '#FFD600' }}>{sansgps}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>sur {MOCK_REGION_MIFI.nbParoisses} paroisses</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>En attente validation</div>
          <div className="sg" style={{ fontSize: 24, color: enAttente > 0 ? '#FFD600' : '#5AC472' }}>{enAttente}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>modifications à valider</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Score moyen</div>
          <div className="sg" style={{ fontSize: 24, color: '#5B9BD5' }}>{avgComplete}%</div>
          <CompleteBar pct={avgComplete} />
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Fidèles par district</div>
          <HorizontalBars data={districtBars} />
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niveaux (paroisses)</div>
          <Donut segments={niveaux} total={MOCK_REGION_MIFI.nbParoisses} label="paroisses" />
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Types d'œuvres</div>
          <HorizontalBars data={oeuvresByType.filter(o => o.value > 0)} />
        </div>
      </div>

      {/* Row 4 — Map + Evolution + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MiniLeafletMap height={260} />
          <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-3)' }}>Carte centrée sur la Région MIFI</div>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Évolution des fidèles</div>
          <LineChart data={fidEvol} />
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activité récente</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {JOURNAL_MIFI.slice(0, 5).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color + '22', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{a.who.split(' ').map((w: string) => w[0]).join('').slice(0,2)}</span>
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

      {/* Row 5 — Districts table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sg-md" style={{ fontSize: 14 }}>Districts de la région MIFI</div>
          <a href="/admin/regional/districts" style={{ fontSize: 12, color: '#5B9BD5', textDecoration: 'none' }}>Voir tous →</a>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>District</th>
              <th style={{ textAlign: 'right' }}>Paroisses</th>
              <th style={{ textAlign: 'right' }}>Fidèles</th>
              <th style={{ textAlign: 'right' }}>Ouvriers</th>
              <th>Admin</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {STATS_DISTRICTS_MIFI.map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{d.district}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.paroisses}</td>
                <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.total.toLocaleString('fr')}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.ouvriers}</td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{DISTRICTS_MIFI[i]?.admin || '—'}</td>
                <td style={{ width: 120 }}><CompleteBar pct={d.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
