'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { CompleteBar, Dropdown } from '@/components/admin/atoms';
import { STATS_DISTRICTS_MIFI, MOCK_REGION_MIFI, FIDELESEVOLUTION_MIFI } from '@/components/admin/dataRegional';

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

function DistrictStatsPanel({ district, onClose }: { district: any; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{district.district}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Statistiques 2025 · {district.paroisses} paroisses</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Communiants', value: district.communiants.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Non-communiants', value: district.noncomm.toLocaleString('fr'), color: 'var(--text-2)' },
              { label: 'Total fidèles', value: district.total.toLocaleString('fr'), color: '#5B9BD5' },
              { label: 'Ouvriers', value: district.ouvriers, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Score de performance</div>
            <CompleteBar pct={district.score}/>
          </div>
          <button className="btn btn-outline" style={{ justifyContent: 'center', gap: 10 }}><I.download size={14}/>Exporter fiche district PDF</button>
        </div>
      </div>
    </div>
  );
}

export default function StatsMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [view, setView] = React.useState('districts');
  const [year, setYear] = React.useState('2025');
  const [viewPanel, setViewPanel] = React.useState<any>(null);

  const totalComm = STATS_DISTRICTS_MIFI.reduce((a, d) => a + d.communiants, 0);
  const totalNonComm = STATS_DISTRICTS_MIFI.reduce((a, d) => a + d.noncomm, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="seg">
          <button className={view === 'districts' ? 'on' : ''} onClick={() => setView('districts')}><I.network size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Par district</button>
          <button className={view === 'evolution' ? 'on' : ''} onClick={() => setView('evolution')}><I.chart size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Évolution</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dropdown value={`Année ${year}`} options={['Année 2025','Année 2024','Année 2023']} onChange={v => setYear(v.split(' ')[1])} width={130} />
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export PDF en cours...', body:'Statistiques MIFI 2025' })}><I.download size={13}/>PDF</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export Excel en cours...', body:'Statistiques MIFI 2025 → .xlsx' })}><I.download size={13}/>Excel</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Communiants', value: totalComm.toLocaleString('fr'), color: '#5AC472' },
          { label: 'Non-communiants', value: totalNonComm.toLocaleString('fr'), color: 'var(--text-2)' },
          { label: 'Total fidèles', value: (totalComm + totalNonComm).toLocaleString('fr'), color: '#5B9BD5' },
          { label: 'Score moyen', value: Math.round(STATS_DISTRICTS_MIFI.reduce((a, d) => a + d.score, 0) / STATS_DISTRICTS_MIFI.length) + '%', color: '#FFD600' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
            <div className="sg" style={{ fontSize: 26, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {view === 'districts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th className="sortable">District</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Communiants</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Non-comm.</th>
                  <th className="sortable" style={{ textAlign: 'right' }}>Total fidèles</th>
                  <th style={{ textAlign: 'right' }}>Paroisses</th>
                  <th style={{ textAlign: 'right' }}>Ouvriers</th>
                  <th className="sortable">Score perf.</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {STATS_DISTRICTS_MIFI.map((d, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{d.district}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.paroisses} paroisses</div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.communiants.toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{d.noncomm.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14, color: '#5B9BD5' }}>{d.total.toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{d.paroisses}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{d.ouvriers}</td>
                    <td><CompleteBar pct={d.score}/></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" onClick={() => setViewPanel(d)}><I.eye size={15}/></button>
                        <button className="icon-btn" onClick={() => addToast({ type:'info', title:`Export ${d.district}...` })}><I.download size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(91,155,213,0.06)', borderTop: '2px solid rgba(91,155,213,0.30)' }}>
                  <td colSpan={2} style={{ padding: 14, fontWeight: 700, color: 'var(--text)' }} className="sg-md">Totaux Région MIFI</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totalComm.toLocaleString('fr')}</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totalNonComm.toLocaleString('fr')}</td>
                  <td className="mono sg" style={{ textAlign: 'right', padding: 14, color: '#5B9BD5', fontSize: 15 }}>{(totalComm + totalNonComm).toLocaleString('fr')}</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{MOCK_REGION_MIFI.nbParoisses}</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{MOCK_REGION_MIFI.nbOuvriers}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {view === 'evolution' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Évolution annuelle des fidèles — Région MIFI</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Année</th>
                  <th style={{ textAlign: 'right' }}>Communiants</th>
                  <th style={{ textAlign: 'right' }}>Non-communiants</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Évolution</th>
                </tr>
              </thead>
              <tbody>
                {FIDELESEVOLUTION_MIFI.map((e, i) => {
                  const prev = i > 0 ? FIDELESEVOLUTION_MIFI[i-1] : null;
                  const total = e.comm + e.noncomm;
                  const prevTotal = prev ? prev.comm + prev.noncomm : null;
                  const evol = prevTotal ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : null;
                  return (
                    <tr key={e.year}>
                      <td className="mono" style={{ fontWeight: 600 }}>{e.year}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5AC472' }}>{e.comm.toLocaleString('fr')}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{e.noncomm.toLocaleString('fr')}</td>
                      <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5B9BD5', fontSize: 14 }}>{total.toLocaleString('fr')}</td>
                      <td>
                        {evol && (
                          <span style={{ fontSize: 12, color: Number(evol) > 0 ? '#5AC472' : '#FF8A7A', fontWeight: 600 }}>
                            {Number(evol) > 0 ? '+' : ''}{evol}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewPanel && <DistrictStatsPanel district={viewPanel} onClose={() => setViewPanel(null)}/>}
      <ToastStack toasts={toasts} />
    </div>
  );
}
