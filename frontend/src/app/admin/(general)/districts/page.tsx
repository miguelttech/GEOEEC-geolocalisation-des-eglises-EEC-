'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { api, District, RegionSynodale, PagedResult } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { Dropdown, TopCount, useOutside } from '@/components/admin/atoms';

// ─── Toast ────────────────────────────────────────────────────────────────────
type Toast = { type: string; title: string; body?: string };
function useToast() {
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([]);
  const add = useCallback((t: Toast) => setToasts(ts => [...ts, { ...t, id: Math.random().toString(36) }]), []);
  const remove = useCallback((id: string) => setToasts(ts => ts.filter(x => x.id !== id)), []);
  return { toasts, add, remove };
}
function ToastStack({ toasts, remove }: { toasts: (Toast & { id: string })[]; remove: (id: string) => void }) {
  return (
    <div className="toast-stack">
      {toasts.slice(-3).map(t => (
        <div key={t.id} className={'toast ' + t.type}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.body}</div>}
          </div>
          <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => remove(t.id)}><I.x size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── View Panel ───────────────────────────────────────────────────────────────
function DistrictViewPanel({ district: d, onClose }: { district: District; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(91,155,213,0.15)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.network size={18} />
            </div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{d.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{d.region_nom}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Même modèle que les régions : toutes les statistiques disponibles */}
          <div className="g g-2" style={{ gap: 10 }}>
            {[
              { label: 'Paroisses', value: String(d.nb_paroisses), color: '#5AC472', big: true },
              { label: 'Fidèles',   value: (d.nb_fideles ?? 0).toLocaleString('fr'), color: '#FFD600', big: true },
              { label: 'Ouvriers',  value: String(d.nb_ouvriers ?? 0), color: '#5B9BD5', big: true },
              { label: 'Région',    value: d.region_nom, color: 'var(--text)', big: false },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: s.big ? 24 : 13, marginTop: 4, color: s.color, lineHeight: 1.3 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Nom du district', value: d.nom },
              { label: 'Région synodale', value: d.region_nom },
              { label: 'Paroisses rattachées', value: String(d.nb_paroisses) },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,214,0,0.06)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FFD600', display: 'flex', gap: 8 }}>
            <I.alert size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>L'assignation de l'admin de district se fait depuis la page Comptes utilisateurs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function DistrictsPage() {
  const { toasts, add: addToast, remove } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterRegionId, setFilterRegionId] = useState(0);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [districts, setDistricts] = useState<District[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<RegionSynodale[]>([]);

  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [viewPanel, setViewPanel] = useState<District | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load regions once
  useEffect(() => {
    api.get<RegionSynodale[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {});
  }, []);

  // Fetch districts
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (filterRegionId) params.set('region', String(filterRegionId));

    api.get<PagedResult<District>>(`/api/geo/districts/?${params}`)
      .then(data => {
        if (!cancelled) { setDistricts(data.results); setCount(data.count); }
      })
      .catch(() => {
        if (!cancelled) addToast({ type: 'error', title: 'Erreur lors du chargement des districts.' });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, search, filterRegionId, refresh, addToast]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const doRefresh = useCallback(() => { setPage(1); setRefresh(r => r + 1); }, []);

  const hasFilter = !!(search || filterRegionId);
  const resetFilters = () => { setSearchInput(''); setSearch(''); setFilterRegionId(0); setPage(1); };

  const toggle = (id: number) => { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); };
  const toggleAll = () => {
    if (selection.size === districts.length) setSelection(new Set());
    else setSelection(new Set(districts.map(d => d.id)));
  };

  const pageBtns = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  const regionFilterLabel = regions.find(r => r.id === filterRegionId)?.nom || 'Toutes régions';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary */}
      <div className="g g-3" style={{ gap: 14 }}>
        <TopCount label="Total districts" value={loading ? '…' : count.toLocaleString('fr')} />
        <TopCount label="Régions synodales" value={String(regions.length || '—')} />
        <TopCount label="Filtré" value={hasFilter ? districts.length.toLocaleString('fr') : '—'} color={hasFilter ? '#5AC472' : 'var(--text)'} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>
            {loading ? '—' : count.toLocaleString('fr')} district{count !== 1 ? 's' : ''}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>répartis sur {regions.length} régions</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Nom de district..." style={{ paddingLeft: 34, fontSize: 13 }} value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="label">Région synodale</div>
          <select className="input" style={{ fontSize: 13 }} value={filterRegionId || ''} onChange={e => { setFilterRegionId(parseInt(e.target.value) || 0); setPage(1); }}>
            <option value="">Toutes régions</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </div>
        {hasFilter && <button className="btn btn-ghost" onClick={resetFilters} style={{ marginBottom: 1 }}><I.refresh size={13} />Réinitialiser</button>}
      </div>

      {hasFilter && !loading && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13} />
          <span><b style={{ color: '#A4CFF0' }}>{count.toLocaleString('fr')}</b> district{count !== 1 ? 's' : ''} trouvé{count !== 1 ? 's' : ''}
            {filterRegionId ? ` — région : ${regionFilterLabel}` : ''}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: 13 }}>Chargement des districts…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={districts.length > 0 && selection.size === districts.length} onChange={toggleAll} /></th>
                    <th style={{ width: 40 }}>#</th>
                    <th>Nom du district</th>
                    <th>Région synodale</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Paroisses</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Ouvriers</th>
                    <th style={{ width: 70 }}>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.length === 0 && (
                    <tr><td colSpan={8} style={{ height: 280, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <I.network size={48} style={{ opacity: 0.25 }} />
                        <div className="sg-md" style={{ fontSize: 16 }}>Aucun district trouvé</div>
                        {hasFilter && <button className="btn btn-outline" onClick={resetFilters}>Réinitialiser les filtres</button>}
                      </div>
                    </td></tr>
                  )}
                  {districts.map((d, idx) => (
                    <tr key={d.id} style={{ background: selection.has(d.id) ? 'rgba(46,151,68,0.06)' : 'transparent' }}>
                      <td><input type="checkbox" className="checkbox" checked={selection.has(d.id)} onChange={() => toggle(d.id)} /></td>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String((page - 1) * PAGE_SIZE + idx + 1).padStart(3, '0')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(91,155,213,0.15)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <I.network size={14} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{d.nom}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{d.region_nom}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5AC472', fontWeight: 600 }}>{d.nb_paroisses}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#FFD600' }}>{(d.nb_fideles ?? 0).toLocaleString('fr')}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5B9BD5' }}>{d.nb_ouvriers ?? 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="icon-btn" title="Vue détaillée" onClick={() => setViewPanel(d)}><I.eye size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
                <span>
                  Page <span style={{ color: 'var(--text)' }}>{page}</span> sur <span style={{ color: 'var(--text)' }}>{totalPages}</span>
                  {' · '}<span style={{ color: 'var(--text)' }}>{count.toLocaleString('fr')}</span> résultats
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><I.chevL size={14} /></button>
                  {pageBtns.map(pn => (
                    <button key={pn} onClick={() => setPage(pn)} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: pn === page ? 'var(--green)' : 'transparent', color: pn === page ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{pn}</button>
                  ))}
                  <button className="icon-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><I.chevR size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Float bar */}
      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selection.size} district{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}
          </span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }} />
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => addToast({ type: 'info', title: 'Export Excel — fonctionnalité à venir.' })}><I.download size={13} />Excel</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {/* Panneau de détail (lecture seule) */}
      {viewPanel && (
        <DistrictViewPanel
          district={viewPanel}
          onClose={() => setViewPanel(null)}
        />
      )}

      <ToastStack toasts={toasts} remove={remove} />
    </div>
  );
}
