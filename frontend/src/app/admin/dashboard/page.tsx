'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown, Widget, HorizontalBars, Donut, StackedBars, LineChart, NiveauPill, GpsCell, StatusPill } from '@/components/admin/atoms';
import { sampleParoisses, topRegions, oeuvresMix, fidelesEvolution, niveauxByRegion, activity, REGIONS_22 } from '@/components/admin/data';

const MiniLeafletMap = dynamic(() => import('@/components/admin/MiniLeafletMap'), { ssr: false });

// ── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  icon: (p: { size?: number }) => React.ReactElement;
  value: string;
  sub: string;
  delta: { type: 'up'|'down'|'flat'; text: string };
}
const StatCard = ({ label, icon: Ic, value, sub, delta }: StatCardProps) => (
  <div className="stat-card">
    <div className="sc-head">
      <span>{label}</span>
      <span style={{ color: 'rgba(245,197,24,0.55)' }}><Ic size={16} /></span>
    </div>
    <div className="sc-num">{value}</div>
    <div className="sc-label">{sub}</div>
    <div className="sc-delta" style={{ color: delta.type === 'up' ? '#5AC472' : delta.type === 'down' ? '#FF6B6B' : 'var(--text-3)' }}>
      {delta.type === 'up'   && <I.up size={12} />}
      {delta.type === 'flat' && <span style={{ display: 'inline-block', width: 12, height: 1, background: 'currentColor' }} />}
      {delta.text}
    </div>
  </div>
);

// ── ParoissesTable ────────────────────────────────────────────────────────────
function ParoissesTable({ onEdit, onCreate }: { onEdit: (p: any) => void; onCreate: () => void }) {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const data = sampleParoisses;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <h3 className="sg-md" style={{ margin: 0, fontSize: 14, color: 'var(--text)', marginRight: 'auto' }}>Paroisses récemment modifiées</h3>
        <div style={{ position: 'relative', width: 240 }}>
          <I.search size={14} style={{ position: 'absolute', top: 11, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Rechercher une paroisse..." style={{ paddingLeft: 34, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dropdown value="Toutes régions" options={['Toutes régions', ...REGIONS_22]} onChange={() => {}} width={180} />
        <Dropdown value="Tous districts" options={['Tous districts','BAFOUSSAM NORD','YAOUNDE CENTRE','DSCHANG']} onChange={() => {}} width={170} />
        <Dropdown value="GPS: tous" options={['GPS: tous','GPS: avec','GPS: sans']} onChange={() => {}} width={140} />
        <button className="btn btn-primary" onClick={onCreate}><I.plus size={14}/>Créer une paroisse</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" className="checkbox" /></th>
              <th className="sortable">Nom <I.chevD size={11} style={{ opacity: 0.4 }} /></th>
              <th className="sortable">Région</th>
              <th>District</th>
              <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
              <th>GPS</th>
              <th>Statut</th>
              <th>Modifié le</th>
              <th style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(p => (
              <tr key={p.id}>
                <td><input type="checkbox" className="checkbox" /></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{p.nom}</span>
                    <NiveauPill niveau={p.niveau} />
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.region}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.district}</td>
                <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{p.fideles.toLocaleString('fr')}</td>
                <td><GpsCell ok={p.gps} /></td>
                <td><StatusPill statut={p.statut} /></td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                  <div>{p.modifie}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>par {p.modPar}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="icon-btn" data-tip="Voir"><I.eye size={15} /></button>
                    <button className="icon-btn green" data-tip="Modifier" onClick={() => onEdit(p)}><I.pencil size={15} /></button>
                    <button className="icon-btn" data-tip="Plus d'actions"><I.more size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
        <span>Affichage <span style={{ color: 'var(--text)' }}>1 à 8</span> sur <span style={{ color: 'var(--text)' }}>553</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn"><I.chevL size={14}/></button>
          {[1,2,3,4].map(n => (
            <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: page === n ? 'var(--green)' : 'transparent', color: page === n ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{n}</button>
          ))}
          <span style={{ color: 'var(--text-3)' }}>…</span>
          <button style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>70</button>
          <button className="icon-btn"><I.chevR size={14}/></button>
          <span style={{ marginLeft: 12, color: 'var(--text-3)' }}>·</span>
          <Dropdown value="10 / page" options={['10 / page','25 / page','50 / page']} onChange={() => {}} width={120} />
        </div>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const nav = (key: string) => router.push(`/admin/${key}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Row 1 — 5 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <StatCard label="Régions"   icon={I.compass}   value="22"  sub="Régions synodales"      delta={{ type:'flat', text:'Données stables' }} />
        <StatCard label="Districts" icon={I.network}   value="137" sub="Districts"               delta={{ type:'up',   text:'+2 ce mois' }} />
        <StatCard label="Paroisses" icon={I.church}    value="553" sub="Paroisses"               delta={{ type:'up',   text:'+5 ce mois' }} />
        <StatCard label="Œuvres"    icon={I.hexagon}   value="311" sub="Œuvres déclarées"        delta={{ type:'up',   text:'+1 ce mois' }} />
        <StatCard label="Ouvriers"  icon={I.briefcase} value="685" sub="Ouvriers enregistrés"   delta={{ type:'flat', text:'Données stables' }} />
      </div>

      {/* Row 2 — 4 widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <Widget title="Total fidèles 2025">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="sg" style={{ fontSize: 28, lineHeight: 1 }}>147 832</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#2E9744', borderRadius: 2 }} />Communiants <span style={{ marginLeft: 'auto', color: 'var(--text)' }}>89 450</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'rgba(240,244,241,0.45)', borderRadius: 2 }} />Non-communiants <span style={{ marginLeft: 'auto', color: 'var(--text)' }}>58 382</span></div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>545 paroisses sur 553 renseignées</div>
          </div>
        </Widget>
        <Widget title="Paroisses sans GPS" action={<button className="btn-ghost btn" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => nav('paroisses')}>Voir →</button>}>
          <div className="sg" style={{ fontSize: 28, color: '#FF6B6B', lineHeight: 1 }}>127</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>22% du total sans coordonnées</div>
          <div style={{ fontSize: 11, color: '#FFB877', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><I.alert size={12} /> 5 GPS erronés (hors Cameroun)</div>
        </Widget>
        <Widget title="Validations en attente">
          <div className="sg" style={{ fontSize: 28, color: '#FF8A3D', lineHeight: 1 }}>7</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Statistiques soumises à valider</div>
          <button className="btn" style={{ background: 'rgba(230,81,0,0.15)', color: '#FF8A3D', border: '1px solid rgba(230,81,0,0.30)', padding: '6px 12px', fontSize: 12, marginTop: 8, alignSelf: 'flex-start' }}>Traiter →</button>
        </Widget>
        <Widget title="Score de performance moyen" action={<button className="btn-ghost btn" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => nav('stats')}>Détail →</button>}>
          <div className="sg" style={{ fontSize: 28, color: '#5AC472', lineHeight: 1 }}>74%</div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: '74%', height: '100%', background: 'linear-gradient(90deg,#C62828 0%,#E65100 50%,#2E9744 100%)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>3 régions sous 50%</div>
        </Widget>
      </div>

      {/* Row 3 — 4 charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget title="Top 10 régions par fidèles" action={<Dropdown value="2025" options={['2025','2024','2023','2022']} onChange={() => {}} width={88} />}>
          <HorizontalBars data={topRegions.map(r => ({ label: r.name, value: r.fideles }))} />
        </Widget>
        <Widget title="Répartition des œuvres">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '8px 0' }}>
            <Donut segments={oeuvresMix.map(o => ({ count: o.count, color: o.color }))} total={311} label="œuvres" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
              {oeuvresMix.map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, background: o.color, borderRadius: 2 }} />
                  <span style={{ color: 'var(--text-2)' }}>{o.type}</span>
                  <span className="mono" style={{ marginLeft: 'auto', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{o.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Widget>
        <Widget title="Niveaux de paroisses par région">
          <StackedBars data={niveauxByRegion as any} keys={[
            { key:'paroisse', color:'#2E9744' },
            { key:'station',  color:'#E65100' },
            { key:'annexe',   color:'#1565C0' },
          ]}/>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginTop: 6, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#2E9744', borderRadius: 2 }}/>Paroisse</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#E65100', borderRadius: 2 }}/>Station</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#1565C0', borderRadius: 2 }}/>Annexe</span>
          </div>
        </Widget>
        <Widget title="Évolution des fidèles 2020 → 2026">
          <LineChart data={fidelesEvolution} height={210} />
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginTop: -4, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 2, background: '#2E9744' }}/>Communiants</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 2, background: 'rgba(240,244,241,0.45)' }}/>Non-communiants</span>
          </div>
        </Widget>
      </div>

      {/* Row 4 — Mini-map + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <Widget title="Aperçu géographique" action={<button className="btn-ghost btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => nav('map')}>Ouvrir la carte →</button>}>
          <MiniLeafletMap height={320} />
        </Widget>
        <Widget title="Activité récente" action={<a style={{ color: '#5AC472', textDecoration: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => nav('journal')}>Voir tout →</a>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.map((a, i) => {
              const Ic = I[a.icon];
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < activity.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <Avatar initials={a.initials} size={30} bg={a.bg} color={a.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{a.who}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 11 }}>{a.when}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{a.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: a.color, display: 'inline-flex' }}>{Ic && <Ic size={12} />}</span>
                      <span><span style={{ color: 'var(--text)' }}>{a.action}</span> {a.entity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>

      {/* Row 5 — Table */}
      <ParoissesTable onEdit={() => {}} onCreate={() => nav('paroisses')} />
    </div>
  );
}
