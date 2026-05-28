'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { CompleteBar, Dropdown } from '@/components/admin/atoms';
import { statsByRegion } from '@/components/admin/data';

interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast, 'id'>) => { const id = Date.now(); setToasts(p => [...p, { ...t, id }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
          {t.body && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.body}</div>}
        </div>
      ))}
    </div>
  );
}

function RegionStatsPanel({ region, onClose }: { region: any; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{region.region}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Statistiques {region.annee || '2025'} · {region.paroisses} paroisses</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Communiants', value: region.communiants.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Non-communiants', value: region.noncomm.toLocaleString('fr'), color: 'var(--text-2)' },
              { label: 'Total fidèles', value: region.total.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: region.ouvriers, color: 'var(--text)' },
              { label: 'Baptêmes', value: region.baptemes, color: 'var(--text)' },
              { label: 'Mariages', value: region.mariages, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Score de performance</div>
            <CompleteBar pct={region.score}/>
          </div>
          <button className="btn btn-outline" style={{ justifyContent: 'center', gap: 10 }}><I.download size={14}/>Exporter fiche région PDF</button>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { toasts, add: addToast } = useToast();
  const [view, setView] = React.useState('tableau');
  const [year, setYear] = React.useState('2025');
  const [viewPanel, setViewPanel] = React.useState<any>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="seg">
          <button className={view === 'tableau' ? 'on' : ''} onClick={() => setView('tableau')}><I.list size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Vue tableau</button>
          <button className={view === 'carte' ? 'on' : ''} onClick={() => setView('carte')}><I.map size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Vue carte</button>
          <button className={view === 'region' ? 'on' : ''} onClick={() => setView('region')}><I.compass size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Par région</button>
          <button className={view === 'visiteurs' ? 'on' : ''} onClick={() => setView('visiteurs')}><I.users size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Visiteurs</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dropdown value={`Année ${year}`} options={['Année 2025','Année 2024','Année 2023']} onChange={v => setYear(v.split(' ')[1])} width={130} />
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export PDF en cours...', body:'Statistiques nationales 2025' })}><I.download size={13}/>PDF</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export Excel en cours...', body:'Statistiques nationales 2025 → .xlsx' })}><I.download size={13}/>Excel</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export CSV en cours...', body:'Statistiques nationales 2025 → .csv' })}><I.download size={13}/>CSV</button>
        </div>
      </div>

      {view === 'tableau' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th className="sortable">Région synodale</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Communiants</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Non-comm.</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Total fidèles</th>
                  <th style={{ textAlign: 'right' }}>Baptêmes</th>
                  <th style={{ textAlign: 'right' }}>Mariages</th>
                  <th style={{ textAlign: 'right' }}>Décès</th>
                  <th style={{ textAlign: 'right' }}>Ouvriers</th>
                  <th className="sortable">Score perf.</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {statsByRegion.map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{r.region}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.paroisses} paroisses</div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.communiants.toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{r.noncomm.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{r.total.toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.baptemes}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.mariages}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.deces}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.ouvriers}</td>
                    <td><CompleteBar pct={r.score} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" onClick={() => setViewPanel(r)}><I.eye size={15}/></button>
                        <button className="icon-btn" onClick={() => addToast({ type:'info', title:`Export ${r.region}...`, body:'Fiche région → PDF' })}><I.download size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(46,151,68,0.06)', borderTop: '2px solid rgba(46,151,68,0.30)' }}>
                  <td colSpan={2} style={{ padding: 14, fontWeight: 700, color: 'var(--text)' }} className="sg-md">Totaux nationaux</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>89 450</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>58 382</td>
                  <td className="mono sg" style={{ textAlign: 'right', padding: 14, color: '#5AC472', fontSize: 15 }}>147 832</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>2 684</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>1 073</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>716</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>685</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {view === 'carte' && <ChoroplethStats />}
      {view === 'region' && <RegionTree />}
      {view === 'visiteurs' && <VisiteursStats />}

      {viewPanel && <RegionStatsPanel region={viewPanel} onClose={() => setViewPanel(null)}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}

function ChoroplethStats() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current || (ref.current as any)._init) return;
    (ref.current as any)._init = true;
    import('leaflet').then(({ default: L }) => {
      if (!ref.current) return;
      const map = L.map(ref.current, { attributionControl: true }).setView([6.4, 12.3], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);
      const items = [
        { lat: 3.866, lng: 11.516, val: 18200, name: 'CENTRE SUD 1' },
        { lat: 4.061, lng: 9.787,  val: 16450, name: 'WOURI CENTRE' },
        { lat: 5.475, lng: 10.418, val: 12450, name: 'MIFI' },
        { lat: 5.448, lng: 10.057, val: 9820,  name: 'MENOUA' },
        { lat: 7.323, lng: 13.583, val: 5800,  name: 'ADAMAOUA' },
        { lat: 4.578, lng: 13.685, val: 6420,  name: 'EST' },
        { lat: 10.595,lng: 14.323, val: 5400,  name: 'NORD & EXT. NORD' },
        { lat: 2.928, lng: 11.158, val: 11200, name: 'CENTRE SUD 2' },
        { lat: 5.140, lng: 10.273, val: 7200,  name: 'HAUT-NKAM' },
        { lat: 5.466, lng: 10.892, val: 7800,  name: 'NOUN NORD' },
        { lat: 4.453, lng: 9.985,  val: 7920,  name: 'MOUNGO CENTRE' },
        { lat: 4.020, lng: 9.700,  val: 9100,  name: 'WOURI SUD' },
      ];
      const max = Math.max(...items.map(i => i.val));
      items.forEach(item => {
        const intensity = item.val / max;
        const color = `rgba(46,151,68,${0.25 + intensity * 0.65})`;
        L.circle([item.lat, item.lng], { radius: 40000 + intensity * 80000, color: '#2E9744', fillColor: color, fillOpacity: 0.8, weight: 1.5 })
          .bindTooltip(`<b>${item.name}</b><br>${item.val.toLocaleString('fr')} fidèles`, { direction: 'top', offset: [0, -8] })
          .addTo(map);
      });
    });
  }, []);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div ref={ref} style={{ height: 580, width: '100%' }} />
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(8,17,11,0.92)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, fontSize: 11, color: 'var(--text-2)', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Fidèles par région</div>
        <div style={{ width: 180, height: 12, background: 'linear-gradient(90deg, rgba(46,151,68,0.25), rgba(46,151,68,0.90))', borderRadius: 2 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}><span>0</span><span>18 200</span></div>
      </div>
    </div>
  );
}

function RegionTree() {
  const [expanded, setExpanded] = React.useState(new Set(['MIFI']));
  const tree = [
    { region: 'CENTRE SUD 1', fideles: 18200, paroisses: 95, districts: [
      { name: 'YAOUNDE CENTRE', fideles: 8400, paroisses: 35, parois: [{n:'Yaoundé-Centre',f:1247},{n:'Yaoundé-Bastos',f:982},{n:'Yaoundé-Tsinga',f:778}] },
      { name: 'YAOUNDE NORD',   fideles: 4800, paroisses: 28, parois: [] },
      { name: 'YAOUNDE SUD',    fideles: 5000, paroisses: 32, parois: [] },
    ]},
    { region: 'MIFI', fideles: 12450, paroisses: 48, districts: [
      { name: 'BAHAM',           fideles: 3200, paroisses: 12, parois: [{n:'Baham-Centre',f:320},{n:'Baham-Nord',f:185},{n:'Baham-Est',f:142}] },
      { name: 'BAFOUSSAM NORD',  fideles: 4100, paroisses: 14, parois: [{n:'Bafoussam-Nord',f:892},{n:'Bafoussam-Plateau',f:421}] },
      { name: 'NKAM',            fideles: 2800, paroisses: 9,  parois: [] },
    ]},
    { region: 'WOURI CENTRE', fideles: 16450, paroisses: 72, districts: [] },
    { region: 'MENOUA',       fideles: 9820,  paroisses: 41, districts: [] },
  ];

  const toggle = (k: string) => {
    const s = new Set(expanded);
    s.has(k) ? s.delete(k) : s.add(k);
    setExpanded(s);
  };

  return (
    <div className="card" style={{ padding: 8 }}>
      {tree.map((r, ri) => {
        const open = expanded.has(r.region);
        return (
          <div key={ri}>
            <div onClick={() => toggle(r.region)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderRadius: 5, background: open ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              {open ? <I.chevD size={14} /> : <I.chevR size={14} />}
              <I.compass size={15} style={{ color: 'var(--gold)' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.region}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{r.fideles.toLocaleString('fr')} fidèles · {r.paroisses} paroisses</span>
            </div>
            {open && r.districts.map((d, di) => {
              const dkey = r.region + '/' + d.name;
              const dopen = expanded.has(dkey);
              return (
                <div key={di} style={{ marginLeft: 28 }}>
                  <div onClick={() => toggle(dkey)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderRadius: 5, background: dopen ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    {dopen ? <I.chevD size={13} /> : <I.chevR size={13} />}
                    <I.network size={14} style={{ color: '#5B9BD5' }}/>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{d.fideles.toLocaleString('fr')} fidèles · {d.paroisses} paroisses</span>
                  </div>
                  {dopen && d.parois.map((p, pi) => (
                    <div key={pi} style={{ marginLeft: 28, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 5 }} className="row-hover">
                      <I.church size={12} style={{ color: '#5AC472', opacity: 0.7 }}/>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.n}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }} className="mono">{p.f} fidèles</span>
                      <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }}>Stats</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Statistiques Visiteurs
   ───────────────────────────────────────────── */
interface VisiteurStat {
  total: number; actifs7j: number; nouveauxMois: number; actifsMois: number;
}
interface TopParoisse { name: string; vues: number; }
interface ActivitePoint { date: string; count: number; }

function VisiteursStats() {
  const [stats, setStats] = React.useState<VisiteurStat | null>(null);
  const [top, setTop] = React.useState<TopParoisse[]>([]);
  const [courbe, setCourbe] = React.useState<ActivitePoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/analytics/visiteurs/stats/', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/analytics/paroisses/top/', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch('/api/analytics/activite/courbe/', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    ]).then(([s, t, c]) => {
      setStats(s);
      setTop(Array.isArray(t) ? t : []);
      setCourbe(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(93,191,122,0.2)', borderTopColor: '#5AC472', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const kpis = stats ? [
    { label: 'Visiteurs inscrits',     value: stats.total.toLocaleString('fr'),          icon: <I.users size={18} />,  color: '#5AC472' },
    { label: 'Actifs (7 derniers j.)', value: stats.actifs7j.toLocaleString('fr'),       icon: <I.bolt size={18} />,   color: '#5B9BD5' },
    { label: 'Nouveaux ce mois',       value: stats.nouveauxMois.toLocaleString('fr'),   icon: <I.plus size={18} />,   color: '#F5C518' },
    { label: 'Actifs ce mois',         value: stats.actifsMois.toLocaleString('fr'),     icon: <I.globe size={18} />,  color: '#A78BFA' },
  ] : [];

  const maxVues   = top.length    ? Math.max(...top.map(p => p.vues), 1)    : 1;
  const maxCourbe = courbe.length ? Math.max(...courbe.map(p => p.count), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, flexShrink: 0 }}>
                {k.icon}
              </div>
              <div>
                <div className="mono sg-md" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 20, color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
          Données non disponibles — API analytics non connectée.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Activité — 30 derniers jours
          </div>
          {courbe.length ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {courbe.map((pt, i) => (
                <div key={i} title={`${pt.date}: ${pt.count} connexions`} style={{
                  flex: 1, borderRadius: '2px 2px 0 0',
                  height: `${Math.max(4, Math.round((pt.count / maxCourbe) * 80))}px`,
                  background: `rgba(90,196,114,${0.3 + (pt.count / maxCourbe) * 0.7})`,
                  cursor: 'default',
                }} />
              ))}
            </div>
          ) : (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Aucune donnée
            </div>
          )}
          {courbe.length >= 2 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              <span>{courbe[0].date}</span>
              <span>{courbe[courbe.length - 1].date}</span>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Top paroisses vues
          </div>
          {top.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top.slice(0, 8).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-3)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((p.vues / maxVues) * 100)}%`, height: '100%', background: '#5AC472', borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', width: 32, textAlign: 'right' }}>{p.vues}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Aucune donnée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
