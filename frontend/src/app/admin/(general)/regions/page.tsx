'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { I } from '@/components/admin/icons';
import { Avatar, CompleteBar, Dropdown, TopCount } from '@/components/admin/atoms';
import { REGIONS_FULL } from '@/components/admin/data';

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

// ── View panel ────────────────────────────────────────────────────────────────
function RegionViewPanel({ region, onClose }: { region: any; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,214,0,0.12)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.compass size={18}/></div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{region.name}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Région Synodale EEC</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Districts', value: region.districts, color: 'var(--text)' },
              { label: 'Paroisses', value: region.paroisses, color: '#5AC472' },
              { label: 'Fidèles', value: region.fideles.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: region.ouvriers, color: 'var(--text)' },
              { label: 'Œuvres', value: region.oeuvres || 0, color: 'var(--text)' },
              { label: 'Score perf.', value: region.score + '%', color: region.score >= 80 ? '#5AC472' : region.score >= 50 ? '#FF8A3D' : '#E55B5B' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Performance */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Score de performance</div>
            <CompleteBar pct={region.score}/>
          </div>

          {/* Admin */}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Administration</div>
            {region.adminInitials && region.adminInitials !== '—' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={region.adminInitials} size={36} bg="rgba(91,155,213,0.22)" color="#5B9BD5"/>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{region.admin}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Admin Régional</div>
                </div>
              </div>
            ) : (
              <span className="pill pill-orange"><I.alert size={9}/> Poste non assigné</span>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
            Les régions synodales sont définies par le Shapefile officiel EEC et ne peuvent pas être modifiées depuis cette interface.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegionsPage() {
  const router = useRouter();
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [viewPanel, setViewPanel] = React.useState<any>(null);

  const data = search
    ? REGIONS_FULL.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : REGIONS_FULL;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <TopCount label="Régions synodales"    value="22"  />
        <TopCount label="Districts"            value="137" />
        <TopCount label="Paroisses"            value="553" color="#5AC472"/>
        <TopCount label="Score moyen national" value="74%" color="#5AC472"/>
        <TopCount label="Régions sous 50%"     value="3"   color="#FF6B6B"/>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>22 régions synodales officielles</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>source : Shapefile EEC</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-outline-green" onClick={() => router.push('/admin/map')}><I.map size={14}/>Voir sur la carte</button>
        </div>
      </div>

      {/* Search + sort */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <I.search size={14} style={{ position: 'absolute', top: 12, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Rechercher une région..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dropdown value="Score perf. (décroissant)" options={['Nom (A→Z)','Nom (Z→A)','Fidèles (décroissant)','Score perf. (décroissant)','Score perf. (croissant)']} onChange={() => {}} width={240}/>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th className="sortable">Région synodale</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Districts</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Paroisses</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                <th style={{ textAlign: 'right' }}>Ouvriers</th>
                <th style={{ textAlign: 'right' }}>Œuvres</th>
                <th className="sortable">Score perf.</th>
                <th>Admin Régional</th>
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id}>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(r.id).padStart(2,'0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,214,0,0.10)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.compass size={16}/></div>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.districts}</td>
                  <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5AC472', fontWeight: 600 }}>{r.paroisses}</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{r.fideles.toLocaleString('fr')}</td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.ouvriers}</td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.oeuvres > 0 ? r.oeuvres : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td><CompleteBar pct={r.score}/></td>
                  <td>
                    {r.adminInitials && r.adminInitials !== '—' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar initials={r.adminInitials} size={28} bg="rgba(91,155,213,0.22)" color="#5B9BD5"/>
                        <span style={{ fontSize: 12.5 }}>{r.admin}</span>
                      </div>
                    ) : (
                      <span className="pill pill-orange" style={{ padding: '2px 8px' }}><I.alert size={9}/> Non assigné</span>
                    )}
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => setViewPanel(r)}><I.eye size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(46,151,68,0.06)', borderTop: '2px solid rgba(46,151,68,0.30)' }}>
                <td colSpan={2} style={{ padding: 14, fontWeight: 700 }} className="sg-md">Totaux nationaux</td>
                <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>137</td>
                <td className="mono sg-md" style={{ textAlign: 'right', padding: 14, color: '#5AC472' }}>553</td>
                <td className="mono sg" style={{ textAlign: 'right', padding: 14, color: '#5AC472', fontSize: 15 }}>147 832</td>
                <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>685</td>
                <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>311</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {viewPanel && <RegionViewPanel region={viewPanel} onClose={() => setViewPanel(null)}/>}
      <ToastStack toasts={toasts} />
    </div>
  );
}
