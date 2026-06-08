'use client';
import React from 'react';
import { api, StatistiqueAnnuelle, PagedResult } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { CompleteBar } from '@/components/admin/atoms';

/* ─── Toast ─────────────────────────────────────────────────────────── */
interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id = Date.now(); setToasts(p => [...p, { ...t, id }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
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

/* ─── Aggregated region row ──────────────────────────────────────────── */
interface RegionRow {
  region: string;
  paroisses: number;
  communiants: number;
  non_communiants: number;
  total_fideles: number;
  baptemes: number;
  confirmations: number;
  mariages: number;
  deces: number;
  non_validee: number;
}

function aggregateByRegion(stats: StatistiqueAnnuelle[]): RegionRow[] {
  const map = new Map<string, RegionRow>();
  for (const s of stats) {
    const nom = s.region_nom || 'Inconnue';
    const row = map.get(nom) ?? { region: nom, paroisses: 0, communiants: 0, non_communiants: 0, total_fideles: 0, baptemes: 0, confirmations: 0, mariages: 0, deces: 0, non_validee: 0 };
    row.paroisses      += 1;
    row.communiants    += s.communiants    || 0;
    row.non_communiants+= s.non_communiants|| 0;
    row.total_fideles  += s.total_fideles  || 0;
    row.baptemes       += s.baptemes       || 0;
    row.confirmations  += s.confirmations  || 0;
    row.mariages       += s.mariages       || 0;
    row.deces          += s.deces          || 0;
    if (!s.validee) row.non_validee += 1;
    map.set(nom, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total_fideles - a.total_fideles);
}

/* ─── Detail panel ──────────────────────────────────────────────────── */
function RegionDetailPanel({ row, stats, onClose }: { row: RegionRow; stats: StatistiqueAnnuelle[]; onClose: () => void }) {
  const paroisseStats = stats.filter(s => s.region_nom === row.region);
  const maxFideles = Math.max(...paroisseStats.map(s => s.total_fideles || 0), 1);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{row.region}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{row.paroisses} paroisses · {row.non_validee > 0 ? `${row.non_validee} non validées` : 'Toutes validées'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Communiants',     value: row.communiants.toLocaleString('fr'),     color: '#5AC472' },
              { label: 'Non-communiants', value: row.non_communiants.toLocaleString('fr'), color: 'var(--text-2)' },
              { label: 'Total fidèles',   value: row.total_fideles.toLocaleString('fr'),   color: '#5AC472' },
              { label: 'Baptêmes',        value: row.baptemes.toString(),                  color: 'var(--text)' },
              { label: 'Confirmations',   value: row.confirmations.toString(),              color: 'var(--text)' },
              { label: 'Mariages',        value: row.mariages.toString(),                  color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Top paroisses par fidèles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paroisseStats
                .sort((a, b) => (b.total_fideles||0) - (a.total_fideles||0))
                .slice(0, 6)
                .map(s => (
                  <div key={s.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.paroisse_nom}</span>
                      <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{(s.total_fideles||0).toLocaleString('fr')}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(((s.total_fideles||0)/maxFideles)*100)}%`, height: '100%', background: '#5AC472', borderRadius: 2 }}/>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Paroisse table view ───────────────────────────────────────────── */
function ParoisseTable({ stats, loading }: { stats: StatistiqueAnnuelle[]; loading: boolean }) {
  const [search, setSearch] = React.useState('');
  const filtered = search
    ? stats.filter(s => s.paroisse_nom.toLowerCase().includes(search.toLowerCase()) || s.region_nom?.toLowerCase().includes(search.toLowerCase()))
    : stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <I.search size={14} style={{ position: 'absolute', top: 10, left: 11, color: 'var(--text-3)' }}/>
        <input className="input" placeholder="Rechercher une paroisse…" style={{ paddingLeft: 34, fontSize: 13 }}
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>
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
                  <th>#</th>
                  <th>Paroisse</th>
                  <th>District / Région</th>
                  <th style={{ textAlign: 'right' }}>Communiants</th>
                  <th style={{ textAlign: 'right' }}>Non-comm.</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Baptêmes</th>
                  <th style={{ textAlign: 'right' }}>Mariages</th>
                  <th style={{ textAlign: 'right' }}>Décès</th>
                  <th>Validée</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ height: 180, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    Aucune donnée
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(3,'0')}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{s.paroisse_nom}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                      <div>{s.district_nom}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{s.region_nom}</div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>{(s.communiants||0).toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{(s.non_communiants||0).toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', fontSize: 13 }}>{(s.total_fideles||0).toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.baptemes||0}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.mariages||0}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.deces||0}</td>
                    <td>
                      {s.validee
                        ? <span className="pill pill-green" style={{ fontSize: 11 }}>Validée</span>
                        : <span className="pill pill-yellow" style={{ fontSize: 11 }}>En attente</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR-1, CURRENT_YEAR-2, CURRENT_YEAR-3];

export default function StatsPage() {
  const { toasts, add: addToast } = useToast();
  const [view, setView]           = React.useState<'regions'|'paroisses'>('regions');
  const [year, setYear]           = React.useState(CURRENT_YEAR);
  const [stats, setStats]         = React.useState<StatistiqueAnnuelle[]>([]);
  const [loading, setLoading]     = React.useState(true);
  const [viewPanel, setViewPanel] = React.useState<RegionRow|null>(null);

  React.useEffect(() => {
    setLoading(true);
    // Fetch all stats for the year (up to 1000 paroisses)
    api.get<PagedResult<StatistiqueAnnuelle>>(`/api/statistiques/?annee=${year}&page_size=1000`)
      .then(d => setStats(d.results))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [year]);

  const rows = aggregateByRegion(stats);

  const totals = stats.reduce((acc, s) => ({
    communiants:     acc.communiants     + (s.communiants     || 0),
    non_communiants: acc.non_communiants + (s.non_communiants || 0),
    total_fideles:   acc.total_fideles   + (s.total_fideles   || 0),
    baptemes:        acc.baptemes        + (s.baptemes        || 0),
    confirmations:   acc.confirmations   + (s.confirmations   || 0),
    mariages:        acc.mariages        + (s.mariages        || 0),
    deces:           acc.deces           + (s.deces           || 0),
  }), { communiants: 0, non_communiants: 0, total_fideles: 0, baptemes: 0, confirmations: 0, mariages: 0, deces: 0 });

  const maxTotal = Math.max(...rows.map(r => r.total_fideles), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="seg">
            <button className={view === 'regions'   ? 'on' : ''} onClick={() => setView('regions')}>
              <I.compass size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Par région
            </button>
            <button className={view === 'paroisses' ? 'on' : ''} onClick={() => setView('paroisses')}>
              <I.list size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Par paroisse
            </button>
          </div>
          <select className="input mono" value={year} style={{ width: 110, fontSize: 13 }}
            onChange={e => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>Année {y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"
            onClick={() => { window.open('/api/exports/statistiques/pdf/', '_blank'); addToast({ type:'info', title:'Export PDF lancé' }); }}>
            <I.download size={13}/>PDF
          </button>
          <button className="btn btn-outline"
            onClick={() => { window.open('/api/exports/statistiques/excel/', '_blank'); addToast({ type:'info', title:'Export Excel lancé' }); }}>
            <I.download size={13}/>Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total fidèles',       value: totals.total_fideles.toLocaleString('fr'),   color: '#5AC472' },
            { label: 'Communiants',         value: totals.communiants.toLocaleString('fr'),      color: 'var(--text)' },
            { label: 'Non-communiants',     value: totals.non_communiants.toLocaleString('fr'),  color: 'var(--text-2)' },
            { label: 'Baptêmes',            value: totals.baptemes.toLocaleString('fr'),         color: 'var(--text)' },
            { label: 'Confirmations',       value: totals.confirmations.toLocaleString('fr'),    color: 'var(--text)' },
            { label: 'Mariages',            value: totals.mariages.toLocaleString('fr'),         color: 'var(--text)' },
            { label: 'Décès',               value: totals.deces.toLocaleString('fr'),            color: 'var(--text-3)' },
            { label: 'Paroisses avec stats',value: stats.length.toLocaleString('fr'),            color: 'var(--text-2)' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div className="sg" style={{ fontSize: 22, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Vue par région ───────────────────────────────────────── */}
      {view === 'regions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
              <I.refresh size={16} style={{ opacity: 0.5 }}/>Chargement des statistiques…
            </div>
          ) : rows.length === 0 ? (
            <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <I.list size={40} style={{ opacity: 0.18 }}/>
              <div className="sg-md" style={{ fontSize: 15 }}>Aucune statistique pour {year}</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Région synodale</th>
                    <th style={{ textAlign: 'right' }}>Communiants</th>
                    <th style={{ textAlign: 'right' }}>Non-comm.</th>
                    <th style={{ textAlign: 'right' }}>Total fidèles</th>
                    <th style={{ textAlign: 'right' }}>Baptêmes</th>
                    <th style={{ textAlign: 'right' }}>Mariages</th>
                    <th style={{ textAlign: 'right' }}>Décès</th>
                    <th style={{ width: 120 }}>Progression</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.region}>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                      <td>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{r.region}</span>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.paroisses} paroisse{r.paroisses !== 1 ? 's' : ''}{r.non_validee > 0 ? ` · ${r.non_validee} non val.` : ''}</div>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.communiants.toLocaleString('fr')}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{r.non_communiants.toLocaleString('fr')}</td>
                      <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{r.total_fideles.toLocaleString('fr')}</td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.baptemes}</td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.mariages}</td>
                      <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.deces}</td>
                      <td>
                        <CompleteBar pct={Math.round((r.total_fideles / maxTotal) * 100)}/>
                      </td>
                      <td>
                        <button className="icon-btn" onClick={() => setViewPanel(r)}><I.eye size={15}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(46,151,68,0.06)', borderTop: '2px solid rgba(46,151,68,0.30)' }}>
                    <td colSpan={2} style={{ padding: 14, fontWeight: 700 }} className="sg-md">Totaux</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totals.communiants.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totals.non_communiants.toLocaleString('fr')}</td>
                    <td className="mono sg" style={{ textAlign: 'right', padding: 14, color: '#5AC472', fontSize: 15 }}>{totals.total_fideles.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totals.baptemes.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totals.mariages.toLocaleString('fr')}</td>
                    <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>{totals.deces.toLocaleString('fr')}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Vue par paroisse ─────────────────────────────────────── */}
      {view === 'paroisses' && (
        <ParoisseTable stats={stats} loading={loading}/>
      )}

      {viewPanel && (
        <RegionDetailPanel row={viewPanel} stats={stats} onClose={() => setViewPanel(null)}/>
      )}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
