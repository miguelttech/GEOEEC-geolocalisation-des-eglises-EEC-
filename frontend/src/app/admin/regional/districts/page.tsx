'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { api, District, PagedResult } from '@/lib/api';

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

function DistrictViewPanel({ district, onClose }: { district: District; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{district.nom}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{district.region_nom} · {district.nb_paroisses} paroisse{district.nb_paroisses !== 1 ? 's' : ''}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Paroisses', value: district.nb_paroisses, color: '#5B9BD5' },
              { label: 'Fidèles',   value: (district.nb_fideles ?? 0).toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers',  value: district.nb_ouvriers ?? 0, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistrictsRegionPage() {
  const { toasts } = useToast();
  const [search, setSearch] = React.useState('');
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewPanel, setViewPanel] = React.useState<District | null>(null);

  React.useEffect(() => {
    api.get<PagedResult<District>>('/api/geo/districts/?page_size=200')
      .then(r => setDistricts(r.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = search
    ? districts.filter(d => d.nom.toLowerCase().includes(search.toLowerCase()))
    : districts;

  const totalFideles  = districts.reduce((a, d) => a + (d.nb_fideles ?? 0), 0);
  const totalParoisses = districts.reduce((a, d) => a + d.nb_paroisses, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Districts',     value: loading ? '—' : districts.length,               color: '#5B9BD5', icon: 'network' as const },
          { label: 'Paroisses',     value: loading ? '—' : totalParoisses,                  color: '#2E9744', icon: 'church' as const },
          { label: 'Total fidèles', value: loading ? '—' : totalFideles.toLocaleString('fr'), color: '#5AC472', icon: 'users' as const },
        ].map(s => {
          const Ic = I[s.icon];
          return (
            <div key={s.label} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic size={15} style={{ color: s.color }}/>
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div className="sg" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>Districts de ma région</h2>
        <div style={{ position: 'relative' }}>
          <I.search size={14} style={{ position: 'absolute', top: 10, left: 10, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Rechercher..." style={{ paddingLeft: 32, width: 220, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
            <I.refresh size={16} style={{ opacity: 0.5 }}/>Chargement…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>District</th>
                <th style={{ textAlign: 'right' }}>Paroisses</th>
                <th style={{ textAlign: 'right' }}>Fidèles</th>
                <th style={{ textAlign: 'right' }}>Ouvriers</th>
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} style={{ height: 180, textAlign: 'center', color: 'var(--text-3)' }}>Aucun district trouvé</td></tr>
              ) : data.map((d, i) => (
                <tr key={d.id}>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(91,155,213,0.12)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <I.network size={14}/>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.nom}</div>
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{d.nb_paroisses}</td>
                  <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(d.nb_fideles ?? 0).toLocaleString('fr')}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{d.nb_ouvriers ?? 0}</td>
                  <td>
                    <button className="icon-btn" title="Voir les détails" onClick={() => setViewPanel(d)}><I.eye size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {viewPanel && <DistrictViewPanel district={viewPanel} onClose={() => setViewPanel(null)}/>}
      <ToastStack toasts={toasts} />
    </div>
  );
}
