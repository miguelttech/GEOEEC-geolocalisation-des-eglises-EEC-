/* =============================================================================
   EEC Géolocalisation — UI Components (panels, navbar, rail, detail, legend)
   ============================================================================= */

const { useState, useEffect, useRef, useMemo, useCallback } = React;
const D = window.EEC_DATA;

/* ============================== HELPERS ============================== */
function useDebounced(value, ms = 180) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

const fmt = (n) => (n || 0).toLocaleString('fr');

/* ============================== NAVBAR ============================== */
const Navbar = ({ view, setView, stats, theme, setTheme }) => {
  const NAV_STATS = [
    { id: 'regions',   icon: 'flag',      value: stats.regions,   label: 'Régions Synodales', bg: '#FFF6C8', fg: '#E8B600' },
    { id: 'districts', icon: 'shield',    value: stats.districts, label: 'Districts',         bg: 'rgba(46,151,68,0.12)', fg: '#1F7331' },
    { id: 'parishes',  icon: 'church',    value: stats.parishes,  label: 'Paroisses',         bg: 'rgba(46,151,68,0.16)', fg: '#1F7331' },
    { id: 'oeuvres',   icon: 'buildings', value: stats.oeuvres,   label: 'Œuvres',            bg: 'rgba(103,58,183,0.12)', fg: '#673AB7' },
    { id: 'workers',   icon: 'users',     value: stats.workers,   label: 'Ouvriers',          bg: 'rgba(217,48,37,0.10)', fg: '#D93025' },
  ];
  return (
    <header className="navbar" data-screen-label="Navbar">
      <div className="brand">
        <img className="brand-logo" src="assets/logo-eec.png" alt="EEC" />
        <div className="brand-text">
          GÉOLOCALISATION
          <span className="b-sub">Église Évangélique du Cameroun · EEC</span>
        </div>
      </div>
      <div className="nav-divider" />

      <div className="nav-stats">
        {NAV_STATS.map(s => (
          <div key={s.id} className="nav-stat" title={s.label}>
            <span className="ns-glyph" style={{ background: s.bg, color: s.fg }}>
              <Icon name={s.icon} size={11} stroke={2} />
            </span>
            <b>{fmt(s.value)}</b>
            <span className="ns-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="nav-actions">
        <div className="view-toggle" style={{display:'inline-flex', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'999px', padding:'3px'}}>
          <button onClick={() => setView('map')}
            style={{ border:0, background: view==='map' ? 'var(--eec-green)' : 'transparent', color: view==='map' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <Icon name="map" size={13} stroke={1.9} /> Carte
          </button>
          <button onClick={() => setView('list')}
            style={{ border:0, background: view==='list' ? 'var(--eec-green)' : 'transparent', color: view==='list' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <Icon name="list" size={13} stroke={1.9} /> Liste
          </button>
        </div>

        <div className="theme-toggle">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="Mode clair">
            <Icon name="sun" size={14} stroke={1.9} />
          </button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="Mode sombre">
            <Icon name="moon" size={14} stroke={1.9} />
          </button>
        </div>

        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={15} stroke={1.9} />
          <span className="ib-badge">3</span>
        </button>

        <button className="admin-pill" title="Espace administrateur">
          <span className="ap-avatar">A</span>
          <span className="ap-label">Administrateur</span>
        </button>
      </div>
    </header>
  );
};

/* ============================== RAIL ============================== */
const RAIL_TABS = [
  { id: 'search',    label: 'Recherche',    icon: 'search' },
  { id: 'filters',   label: 'Filtres',      icon: 'filterFunnel' },
  { id: 'parcours',  label: 'Parcours',     icon: 'trail' },
  { id: 'stats',     label: 'Statistiques', icon: 'stat' },
  { id: 'paroisses', label: 'Paroisses',    icon: 'church' },
  { id: 'oeuvres',   label: 'Œuvres',       icon: 'buildings' },
  { id: 'ouvriers',  label: 'Ouvriers',     icon: 'users' },
  { id: 'history',   label: 'Historique',   icon: 'history' },
  { id: 'settings',  label: 'Paramètres',   icon: 'settings' },
];

const Rail = ({ active, setActive, onCollapse, badges }) => (
  <nav className="rail" data-screen-label="Rail">
    {RAIL_TABS.map(t => (
      <button key={t.id}
        className={'rail-tab' + (active === t.id ? ' active' : '')}
        onClick={() => setActive(active === t.id ? null : t.id)}>
        <Icon name={t.icon} size={20} stroke={1.7} />
        <span className="lbl">{t.label}</span>
        {badges[t.id] != null && <span className="badge">{badges[t.id]}</span>}
      </button>
    ))}
    <span className="rail-spacer" />
    <button className="rail-collapse" onClick={onCollapse} title="Réduire la barre">
      <Icon name="chevronD" size={18} stroke={2} />
    </button>
  </nav>
);

/* ============================== SEARCH PANEL ============================== */
const SearchPanel = ({ onPick, onClose, recents }) => {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!dq.trim()) return null;
    const n = dq.toLowerCase();
    return {
      par: D.PARISHES.filter(p => p.name.toLowerCase().includes(n)).slice(0, 6),
      oeu: D.OEUVRES.filter(o => o.name.toLowerCase().includes(n)).slice(0, 5),
      dis: D.DISTRICTS.filter(d => d.name.toLowerCase().includes(n)).slice(0, 4),
      reg: D.REGIONS.filter(r => r.name.toLowerCase().includes(n) || r.city.toLowerCase().includes(n)).slice(0, 4),
    };
  }, [dq]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <>
      <div className="panel-head">
        <h2>Recherche rapide</h2>
        <button className="ib" onClick={onClose} title="Fermer le panneau"><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        <div className="panel-section" style={{paddingTop: 14}}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input ref={inputRef} value={q} placeholder="Tapez pour rechercher…"
                   onChange={(e) => setQ(e.target.value)} />
            <button className="mic" title="Recherche vocale"><Icon name="mic" size={14} stroke={1.9} /></button>
          </div>
        </div>

        {!dq.trim() && (
          <>
            <div className="panel-section">
              <h3 className="section-label">Suggestions <span className="num">{D.REGIONS.length} régions</span></h3>
              {D.REGIONS.slice(0, 6).map(r => {
                const cnt = D.PARISHES.filter(p => p.regionId === r.id).length;
                return (
                  <button key={r.id} className="list-row" onClick={() => onPick('region', r)} style={{padding:'8px 0', borderBottom:'1px solid var(--border-soft)'}}>
                    <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}>
                      <Icon name="region" size={15} stroke={1.9} />
                    </span>
                    <span className="lr-body">
                      <span className="lr-title">{r.city}</span>
                      <span className="lr-sub">{r.admin} · {cnt} paroisses</span>
                    </span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                );
              })}
            </div>
            <div className="panel-section">
              <h3 className="section-label">Récemment consultés <span className="num">{recents.length}</span></h3>
              {recents.length === 0 ? (
                <div className="search-empty" style={{padding:'12px 0'}}>
                  <div className="em-glyph"><Icon name="history" size={22} stroke={1.6} /></div>
                  Vos consultations récentes apparaîtront ici.
                </div>
              ) : recents.slice(0, 5).map(it => {
                const t = D.ENTITY_TYPES.find(x => x.id === it.type);
                const r = D.REGIONS.find(x => x.id === it.regionId);
                return (
                  <button key={it.id + it._at} className="list-row" onClick={() => onPick('item', it)} style={{padding:'8px 0', borderBottom:'1px solid var(--border-soft)'}}>
                    <span className="lr-ico" style={{background: t.color+'15'}}>
                      <Icon name={TYPE_ICON[it.type]} size={15} color={t.color} stroke={1.9} />
                    </span>
                    <span className="lr-body">
                      <span className="lr-title">{it.name}</span>
                      <span className="lr-sub">{t.singular} · {r.city}</span>
                    </span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {dq.trim() && results && (
          <>
            {results.par.length === 0 && results.oeu.length === 0 && results.dis.length === 0 && results.reg.length === 0 && (
              <div className="search-empty" style={{paddingTop:40}}>
                <div className="em-glyph"><Icon name="search" size={24} stroke={1.6} /></div>
                Aucun résultat pour « <b>{dq}</b> ».
              </div>
            )}
            {results.par.length > 0 && <>
              <div className="panel-section" style={{paddingBottom:0}}>
                <h3 className="section-label">Paroisses <span className="num">{results.par.length}</span></h3>
              </div>
              {results.par.map(p => {
                const r = D.REGIONS.find(x => x.id === p.regionId);
                return (
                  <button key={p.id} className="list-row" onClick={() => onPick('item', p)}>
                    <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}><Icon name="church" size={15} stroke={1.9} /></span>
                    <span className="lr-body">
                      <span className="lr-title">{p.name}</span>
                      <span className="lr-sub">{r.city} · {p.stats.fideles} fidèles</span>
                    </span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                );
              })}
            </>}
            {results.oeu.length > 0 && <>
              <div className="panel-section" style={{paddingBottom:0}}>
                <h3 className="section-label">Œuvres <span className="num">{results.oeu.length}</span></h3>
              </div>
              {results.oeu.map(o => {
                const t = D.ENTITY_TYPES.find(x => x.id === o.type);
                return (
                  <button key={o.id} className="list-row" onClick={() => onPick('item', o)}>
                    <span className="lr-ico" style={{background: t.color+'15', color: t.color}}><Icon name={TYPE_ICON[o.type]} size={15} stroke={1.9} /></span>
                    <span className="lr-body">
                      <span className="lr-title">{o.name}</span>
                      <span className="lr-sub">{t.singular}</span>
                    </span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                );
              })}
            </>}
            {results.reg.length > 0 && <>
              <div className="panel-section" style={{paddingBottom:0}}>
                <h3 className="section-label">Régions <span className="num">{results.reg.length}</span></h3>
              </div>
              {results.reg.map(r => (
                <button key={r.id} className="list-row" onClick={() => onPick('region', r)}>
                  <span className="lr-ico" style={{background:'var(--eec-yellow-tint)', color:'var(--eec-yellow-d)'}}><Icon name="region" size={15} stroke={1.9} /></span>
                  <span className="lr-body">
                    <span className="lr-title">{r.city}</span>
                    <span className="lr-sub">{r.admin}</span>
                  </span>
                  <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                </button>
              ))}
            </>}
          </>
        )}
      </div>
    </>
  );
};

/* ============================== FILTERS PANEL (matching maquette) ============================== */
const FiltersPanel = ({ filters, setFilters, layerCounts, onClose, onReset, onApply }) => {
  const districts = filters.region ? D.DISTRICTS.filter(d => d.regionId === filters.region) : [];
  const parishes  = filters.district ? D.PARISHES.filter(p => p.districtId === filters.district) : [];

  const toggleLayer = (id) => setFilters(f => ({ ...f, layers: { ...f.layers, [id]: !f.layers[id] }}));
  const toggleGrade = (id) => setFilters(f => {
    const next = new Set(f.grades);
    next.has(id) ? next.delete(id) : next.add(id);
    return { ...f, grades: next };
  });

  return (
    <>
      <div className="panel-head">
        <h2>Recherche &amp; Filtres</h2>
        <button className="ib" onClick={onClose} title="Fermer le panneau"><Icon name="close" size={16} stroke={2} /></button>
      </div>

      <div className="panel-body">
        <div className="panel-section" style={{paddingTop: 14}}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input placeholder="Tapez pour rechercher…" />
            <button className="mic"><Icon name="mic" size={14} stroke={1.9} /></button>
          </div>
        </div>

        {/* Localisation */}
        <div className="panel-section">
          <h3 className="section-label">Localisation</h3>

          <div className="loc-row">
            <span className="loc-glyph"><Icon name="region" size={15} stroke={1.9} /></span>
            <div className="loc-body">
              <span className="loc-label">Région synodale</span>
              <div className="loc-select">
                <select value={filters.region || ''} onChange={(e) => setFilters(f => ({ ...f, region: e.target.value || null, district: null, parish: null }))}>
                  <option value="">Toutes les régions ({D.REGIONS.length})</option>
                  {D.REGIONS.map(r => <option key={r.id} value={r.id}>{r.city}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="loc-row" style={{opacity: filters.region ? 1 : 0.55}}>
            <span className="loc-glyph" style={{color: 'var(--c-scolaire)'}}><Icon name="layers" size={15} stroke={1.9} /></span>
            <div className="loc-body">
              <span className="loc-label">District</span>
              <div className="loc-select">
                <select disabled={!filters.region} value={filters.district || ''} onChange={(e) => setFilters(f => ({ ...f, district: e.target.value || null, parish: null }))}>
                  <option value="">{filters.region ? `Tous les districts (${districts.length})` : '— Sélectionnez une région'}</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name.replace('District de ', '')}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="loc-row" style={{opacity: filters.district ? 1 : 0.55, marginBottom: 0}}>
            <span className="loc-glyph" style={{color: 'var(--c-agro)'}}><Icon name="church" size={15} stroke={1.9} /></span>
            <div className="loc-body">
              <span className="loc-label">Paroisse</span>
              <div className="loc-select">
                <select disabled={!filters.district} value={filters.parish || ''} onChange={(e) => setFilters(f => ({ ...f, parish: e.target.value || null }))}>
                  <option value="">{filters.district ? `Toutes les paroisses (${parishes.length})` : '— Sélectionnez un district'}</option>
                  {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Types d'entités */}
        <div className="panel-section">
          <h3 className="section-label">Types d'entités</h3>
          <div className="types-grid">
            {D.ENTITY_TYPES.map(t => (
              <div key={t.id} className={'type-card' + (filters.layers[t.id] ? ' on' : '')} onClick={() => toggleLayer(t.id)}>
                <span className="tc-check">
                  {filters.layers[t.id] && <Icon name="check" size={9} color="currentColor" stroke={3} />}
                </span>
                <span className="tc-ico" style={{background: t.color + '20', color: t.color}}>
                  <Icon name={TYPE_ICON[t.id]} size={16} stroke={1.9} />
                </span>
                <span className="tc-lbl">{t.singular}</span>
                <span className="tc-count">{layerCounts[t.id]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ouvriers */}
        <div className="panel-section">
          <h3 className="section-label">Ouvriers</h3>
          <div style={{marginBottom: 10}}>
            <div style={{fontSize:11, fontWeight:600, color:'var(--t-2)', marginBottom:6}}>Grade ecclésiastique</div>
            <div className="grade-multi">
              {[...filters.grades].map(g => {
                const grade = D.GRADES.find(x => x.id === g);
                return (
                  <span key={g} className="grade-chip">
                    {grade.short}
                    <button onClick={() => toggleGrade(g)}><Icon name="close" size={9} stroke={2.5} /></button>
                  </span>
                );
              })}
              <select onChange={(e) => { if (e.target.value) toggleGrade(e.target.value); e.target.value=''; }} defaultValue="">
                <option value="">{filters.grades.size > 0 ? '+ Ajouter un grade' : 'Tous les grades'}</option>
                {D.GRADES.filter(g => !filters.grades.has(g.id)).map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div style={{fontSize:11, fontWeight:600, color:'var(--t-2)', marginBottom:6}}>Statut</div>
            <div className="status-row">
              {[
                { id: 'tous', lbl: 'Tous' },
                { id: 'actif', lbl: 'Actifs' },
                { id: 'retraite', lbl: 'Retraités' },
                { id: 'suspendu', lbl: 'Suspendus' },
              ].map(s => (
                <button key={s.id} data-s={s.id}
                  className={'status-chip' + (filters.status === s.id ? ' on' : '')}
                  onClick={() => setFilters(f => ({ ...f, status: s.id }))}>
                  <span className="sc-dot" />
                  {s.lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="panel-section">
          <h3 className="section-label">Statistiques</h3>
          <div style={{marginBottom: 12}}>
            <div className="loc-row" style={{marginBottom: 0}}>
              <span className="loc-glyph"><Icon name="clock" size={14} stroke={1.9} /></span>
              <div className="loc-body">
                <span className="loc-label">Année</span>
                <div className="loc-select">
                  <select value={filters.year} onChange={(e) => setFilters(f => ({ ...f, year: +e.target.value }))}>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <SliderRow label="Fidèles minimum" value={filters.minFideles} max={3000}
                     onChange={(v) => setFilters(f => ({ ...f, minFideles: v }))}
                     formatValue={(v) => v === 0 ? 'Tous' : v + '+'} />
          <SliderRow label="Communiants minimum" value={filters.minCommun} max={1500}
                     onChange={(v) => setFilters(f => ({ ...f, minCommun: v }))}
                     formatValue={(v) => v === 0 ? 'Tous' : v + '+'} />
        </div>
      </div>

      <div className="panel-actions">
        <button className="btn-apply" onClick={onApply}>
          <Icon name="filterFunnel" size={14} stroke={2} /> Appliquer les filtres
        </button>
        <button className="btn-reset" onClick={onReset}>
          <Icon name="refresh" size={12} stroke={2} /> Réinitialiser
        </button>
      </div>
    </>
  );
};

const SliderRow = ({ label, value, max, step = 50, onChange, formatValue }) => {
  const p = Math.min(100, (value / max) * 100);
  return (
    <div className="slider-row">
      <div className="sr-head">
        <span className="sr-lbl">{label}</span>
        <span className="sr-value">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input type="range" min={0} max={max} step={step} value={value}
             style={{ '--p': p + '%' }}
             onChange={(e) => onChange(+e.target.value)} />
      <div className="sr-marks"><span>0</span><span>{max/2}</span><span>{max}</span></div>
    </div>
  );
};

/* ============================== STATS PANEL ============================== */
const StatsPanel = ({ filters, layerCounts, onClose, onFocusRegion }) => {
  const totalFideles = useMemo(() => D.PARISHES.reduce((s, p) => s + p.stats.fideles, 0), []);
  const totalCommun = useMemo(() => D.PARISHES.reduce((s, p) => s + p.stats.communiants, 0), []);
  const totalBapt = useMemo(() => D.PARISHES.reduce((s, p) => s + p.stats.baptemes, 0), []);
  const totalMar = useMemo(() => D.PARISHES.reduce((s, p) => s + p.stats.mariages, 0), []);
  const regionStats = useMemo(() => {
    const max = Math.max(...D.REGIONS.map(r => D.PARISHES.filter(p => p.regionId === r.id).length));
    return D.REGIONS.map(r => {
      const count = D.PARISHES.filter(p => p.regionId === r.id).length;
      return { ...r, count, pct: (count / max) * 100 };
    }).sort((a, b) => b.count - a.count);
  }, []);

  return (
    <>
      <div className="panel-head">
        <h2>Statistiques nationales</h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        <div className="panel-section">
          <h3 className="section-label">Fidèles · Année {filters.year}</h3>
          <div className="stats-row">
            <div className="stat-card featured">
              <div className="sc-label">Total fidèles</div>
              <div className="sc-value">{fmt(totalFideles)}</div>
              <div className="sc-delta">+ 3,2 % vs 2024</div>
            </div>
            <div className="stat-card yellow">
              <div className="sc-label">Communiants</div>
              <div className="sc-value">{fmt(totalCommun)}</div>
              <div className="sc-delta">{Math.round(totalCommun / totalFideles * 100)} % du total</div>
            </div>
            <div className="stat-card"><div className="sc-label">Baptêmes</div><div className="sc-value">{fmt(totalBapt)}</div></div>
            <div className="stat-card"><div className="sc-label">Mariages</div><div className="sc-value">{fmt(totalMar)}</div></div>
          </div>
        </div>

        <div className="panel-section">
          <h3 className="section-label">Top régions synodales</h3>
          <div className="region-bar-list">
            {regionStats.slice(0, 12).map(r => (
              <div key={r.id} className="region-bar" onClick={() => onFocusRegion(r)}>
                <span className="rb-name">{r.city}</span>
                <span className="rb-val">{r.count}</span>
                <span className="rb-track"><span className="rb-fill" style={{ width: r.pct + '%' }} /></span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h3 className="section-label">Œuvres par type</h3>
          <div className="stats-row">
            {D.ENTITY_TYPES.filter(t => t.id !== 'paroisse').map(t => (
              <div key={t.id} className="stat-card" style={{ borderLeft: `3px solid ${t.color}` }}>
                <div className="sc-label" style={{ color: t.color }}>{t.singular}</div>
                <div className="sc-value">{layerCounts[t.id]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

/* ============================== ENTITIES LIST PANELS (Paroisses / Œuvres / Ouvriers) ============================== */
const EntityListPanel = ({ title, items, kind, onPick, onClose, totalLabel }) => {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const filtered = useMemo(() =>
    dq.trim() ? items.filter(it => it.name.toLowerCase().includes(dq.toLowerCase())) : items, [items, dq]);

  return (
    <>
      <div className="panel-head">
        <h2>{title}<div style={{fontSize:11, fontWeight:500, color:'var(--t-2)', marginTop:2}}>{totalLabel}</div></h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        <div className="panel-section" style={{paddingTop:14}}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input placeholder={`Filtrer ${title.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
        {filtered.slice(0, 80).map(it => {
          const r = D.REGIONS.find(x => x.id === it.regionId);
          if (kind === 'worker') {
            const initials = it.name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
            return (
              <button key={it.id} className="list-row">
                <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)', fontWeight:700, fontSize:13}}>{initials}</span>
                <span className="lr-body">
                  <span className="lr-title">{it.name}</span>
                  <span className="lr-sub">{it.gradeLabel} · {r.city}</span>
                </span>
                <span className="dp-worker w-status" style={{padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderRadius: 999, background: it.status === 'actif' ? 'var(--eec-green)' : 'var(--surface-3)', color: it.status === 'actif' ? '#fff' : 'var(--t-2)'}}>
                  {it.status === 'actif' ? 'Actif' : it.status === 'retraite' ? 'Retraité' : 'Susp.'}
                </span>
              </button>
            );
          }
          const t = D.ENTITY_TYPES.find(x => x.id === it.type);
          return (
            <button key={it.id} className="list-row" onClick={() => onPick && onPick(it)}>
              <span className="lr-ico" style={{background: t.color + '15', color: t.color}}>
                <Icon name={TYPE_ICON[it.type]} size={15} stroke={1.9} />
              </span>
              <span className="lr-body">
                <span className="lr-title">{it.name}</span>
                <span className="lr-sub">{t.singular} · {r.city}</span>
              </span>
              {it.stats && <span className="lr-meta"><b style={{color:'var(--t-1)'}}>{it.stats.fideles}</b> fidèles</span>}
              <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
          );
        })}
        {filtered.length > 80 && (
          <div className="search-empty" style={{padding:'16px 0'}}>+ {filtered.length - 80} autres résultats. Affinez la recherche.</div>
        )}
      </div>
    </>
  );
};

/* ============================== PARCOURS PANEL ============================== */
const ParcoursPanel = ({ onClose }) => (
  <>
    <div className="panel-head">
      <h2>Parcours &amp; Itinéraires</h2>
      <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
    </div>
    <div className="panel-body">
      <div className="panel-section">
        <h3 className="section-label">Calculer un itinéraire</h3>
        <div className="loc-row" style={{marginBottom:8}}>
          <span className="loc-glyph" style={{background:'var(--eec-green)', color:'#fff'}}>
            <Icon name="pinFilled" size={13} fill="#fff" stroke={0} />
          </span>
          <div className="loc-body">
            <span className="loc-label">Point de départ</span>
            <div style={{fontSize:12, color:'var(--t-2)', marginTop:2}}>Position actuelle</div>
          </div>
        </div>
        <div className="loc-row">
          <span className="loc-glyph" style={{background:'var(--eec-yellow)', color:'#1A1A1A'}}>
            <Icon name="flag" size={13} fill="#1A1A1A" stroke={0} />
          </span>
          <div className="loc-body">
            <span className="loc-label">Destination</span>
            <div style={{fontSize:12, color:'var(--t-3)', marginTop:2}}>Sélectionnez une paroisse ou une œuvre</div>
          </div>
        </div>
        <button className="btn-apply" style={{marginTop:10, width:'100%'}}>
          <Icon name="route" size={14} stroke={2} /> Calculer l'itinéraire
        </button>
      </div>

      <div className="panel-section">
        <h3 className="section-label">Parcours pastoraux suggérés</h3>
        {[
          { name: 'Tournée évangélique Littoral', d: 'Douala → Nkongsamba → Édéa', km: '218 km · 5 paroisses' },
          { name: 'Visite épiscopale Ouest', d: 'Bafoussam → Dschang → Bangangté', km: '154 km · 8 paroisses' },
          { name: 'Mission Grand Nord', d: 'Ngaoundéré → Garoua → Maroua', km: '498 km · 3 régions' },
        ].map((p, i) => (
          <button key={i} className="list-row" style={{padding:'10px 0', borderBottom:'1px solid var(--border-soft)'}}>
            <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}><Icon name="trail" size={15} stroke={1.9} /></span>
            <span className="lr-body">
              <span className="lr-title">{p.name}</span>
              <span className="lr-sub">{p.d}</span>
              <span className="lr-sub" style={{color:'var(--green-deep-text)', fontWeight:600}}>{p.km}</span>
            </span>
            <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
          </button>
        ))}
      </div>
    </div>
  </>
);

/* ============================== HISTORY PANEL ============================== */
const HistoryPanel = ({ recents, onPick, onClose, onClear }) => (
  <>
    <div className="panel-head">
      <h2>Historique de navigation</h2>
      <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
    </div>
    <div className="panel-body">
      {recents.length === 0 ? (
        <div className="search-empty" style={{paddingTop: 60}}>
          <div className="em-glyph"><Icon name="history" size={26} stroke={1.6} /></div>
          Aucun élément consulté pour le moment.
        </div>
      ) : (
        <>
          <div className="panel-section" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <h3 className="section-label" style={{margin:0}}>Récemment vus <span className="num">{recents.length}</span></h3>
            <button onClick={onClear} className="btn-reset" style={{padding:'4px 8px', fontSize:11}}>Tout effacer</button>
          </div>
          {recents.map(it => {
            const t = D.ENTITY_TYPES.find(x => x.id === it.type);
            const r = D.REGIONS.find(x => x.id === it.regionId);
            return (
              <button key={it.id + '-' + it._at} className="list-row" onClick={() => onPick(it)}>
                <span className="lr-ico" style={{background: t.color + '15', color: t.color}}>
                  <Icon name={TYPE_ICON[it.type]} size={15} stroke={1.9} />
                </span>
                <span className="lr-body">
                  <span className="lr-title">{it.name}</span>
                  <span className="lr-sub">{t.singular} · {r.city}</span>
                </span>
                <span className="lr-meta">{it._timeAgo}</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  </>
);

/* ============================== SETTINGS PANEL ============================== */
const SettingsPanel = ({ theme, setTheme, onClose, onDownload }) => (
  <>
    <div className="panel-head">
      <h2>Paramètres</h2>
      <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
    </div>
    <div className="panel-body">
      <div className="panel-section">
        <h3 className="section-label">Apparence</h3>
        <div className="setting-row">
          <span className="lr-ico" style={{background:'var(--eec-yellow-tint)', color:'var(--eec-yellow-d)', width:32, height:32}}><Icon name={theme==='dark' ? 'moon' : 'sun'} size={15} stroke={1.9} /></span>
          <div className="sr-body">
            <div className="sr-name">Mode sombre</div>
            <div className="sr-desc">Activez l'interface en vert profond futuriste.</div>
          </div>
          <button className={'toggle-switch' + (theme === 'dark' ? ' on' : '')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
        <div className="setting-row">
          <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)', width:32, height:32}}><Icon name="globe" size={15} stroke={1.9} /></span>
          <div className="sr-body">
            <div className="sr-name">Langue</div>
            <div className="sr-desc">Français (Cameroun)</div>
          </div>
          <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-label">Données &amp; export</h3>
        <div className="download-card">
          <h4><Icon name="download" size={13} stroke={2} /> Télécharger le projet</h4>
          <p>Récupérez l'ensemble du code source (HTML, JSX, CSS, données) pour intégrer la plateforme dans votre infrastructure.</p>
          <button className="btn-apply" style={{height:36, width:'100%'}} onClick={onDownload}>
            <Icon name="download" size={13} stroke={2} /> Télécharger le package
          </button>
          <p style={{marginTop:8, marginBottom:0, fontSize:11}}>Ou demandez à Claude : <code className="dc-cmd">« Télécharge tout le projet »</code></p>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-label">Cartographie</h3>
        <div className="setting-row">
          <span className="lr-ico" style={{background:'var(--surface-3)', color:'var(--t-2)', width:32, height:32}}><Icon name="layers" size={15} stroke={1.9} /></span>
          <div className="sr-body">
            <div className="sr-name">Afficher les régions synodales</div>
            <div className="sr-desc">Cercles verts indiquant les 22 régions.</div>
          </div>
          <button className="toggle-switch on" />
        </div>
        <div className="setting-row">
          <span className="lr-ico" style={{background:'var(--surface-3)', color:'var(--t-2)', width:32, height:32}}><Icon name="users" size={15} stroke={1.9} /></span>
          <div className="sr-body">
            <div className="sr-name">Regroupement automatique (cluster)</div>
            <div className="sr-desc">Regroupe les marqueurs proches.</div>
          </div>
          <button className="toggle-switch on" />
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-label">À propos</h3>
        <div style={{fontSize:12, color:'var(--t-2)', lineHeight:1.6}}>
          Plateforme officielle de géolocalisation de l'<b style={{color:'var(--t-1)'}}>Église Évangélique du Cameroun</b>.<br />
          Version 0.4 · {new Date().getFullYear()}<br />
          <span style={{color:'var(--t-3)'}}>informatique@eec-cameroun.org</span>
        </div>
      </div>
    </div>
  </>
);

/* ============================== DETAIL PANEL ============================== */
const DetailPanel = ({ item, onClose, saved, onToggleSave }) => {
  const [tab, setTab] = useState('apercu');
  useEffect(() => { setTab('apercu'); }, [item?.id]);

  if (!item) return <div className="detail-panel" />;
  const region = D.REGIONS.find(r => r.id === item.regionId);
  const district = item.districtId ? D.DISTRICTS.find(d => d.id === item.districtId) : null;
  const isParish = item.type === 'paroisse';
  const typeMeta = D.ENTITY_TYPES.find(t => t.id === item.type);
  const workers = isParish ? D.WORKERS.filter(w => w.parishId === item.id).slice(0, 6) : [];
  const linkedWorks = isParish ? D.OEUVRES.filter(o => o.regionId === item.regionId).slice(0, 4) : [];
  const isSaved = saved.some(s => s.id === item.id);
  const rating = (4.0 + ((item.id.charCodeAt(2) % 10) / 10)).toFixed(1);
  const reviewCount = 8 + (item.id.charCodeAt(2) % 80);
  const cleanId = item.id.replace(/[^A-Z0-9]/gi, '');

  return (
    <div className="detail-panel open" data-screen-label="Detail panel">
      <div className="dp-hero">
        <image-slot id={`hero-${cleanId}`} placeholder={`Photo de ${item.name}`}
          style={{width:'100%', height:'100%', display:'block'}}></image-slot>
        <div className="hero-fallback" style={{pointerEvents:'none', zIndex: 0}}>
          <div className="dp-hero-grid" />
          <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', color: typeMeta.color}}>
            <Icon name={TYPE_ICON[item.type]} size={56} stroke={1.4} />
          </div>
        </div>
        <div className="dp-hero-badge">
          <Icon name={TYPE_ICON[item.type]} size={11} color={typeMeta.color} stroke={2} />
          {typeMeta.singular}
        </div>
        <div className="dp-hero-actions">
          <button className={isSaved ? 'starred' : ''} onClick={() => onToggleSave(item)} title="Favori">
            <Icon name={isSaved ? 'starFilled' : 'star'} size={15} color={isSaved ? '#1A1A1A' : 'currentColor'} fill={isSaved ? '#FFD600' : 'none'} stroke={isSaved ? 0 : 1.9} />
          </button>
          <button title="Partager"><Icon name="share" size={14} stroke={1.9} /></button>
          <button onClick={onClose} title="Fermer"><Icon name="close" size={14} stroke={2} /></button>
        </div>
      </div>

      <div className="dp-head">
        <div className="dp-type" style={{ color: typeMeta.color }}>{typeMeta.singular} EEC</div>
        <div className="dp-title-row">
          <h3 className="dp-title">{item.name}</h3>
          <span className="dp-verified"><Icon name="check" size={11} color="#fff" stroke={3} /></span>
        </div>
        <div className="dp-meta-line">
          <span className="stars">
            <span className="s-y"><Icon name="starFilled" size={13} color="#E8B600" fill="#FFD600" stroke={0} /></span>
            {rating}
            <span style={{color:'var(--t-3)', fontWeight:400}}>({reviewCount} avis)</span>
          </span>
          <span className="ml-sep">·</span>
          <span>{district ? district.name.replace('District de ', 'District de ') : region.city}</span>
          <span className="ml-sep">·</span>
          <span>{region.admin}</span>
        </div>
      </div>

      <div className="dp-actions">
        <button className="dp-action-btn primary"><Icon name="route" size={14} stroke={2.2} /> Itinéraire</button>
        <button className="dp-action-btn ghost" onClick={() => onToggleSave(item)}>
          <Icon name={isSaved ? 'starFilled' : 'star'} size={14} color={isSaved ? '#E8B600' : 'currentColor'} fill={isSaved ? '#FFD600' : 'none'} stroke={isSaved ? 0 : 1.9} />
          {isSaved ? 'Enregistré' : 'Enregistrer'}
        </button>
        <button className="dp-action-btn ghost"><Icon name="share" size={14} stroke={1.9} /> Partager</button>
        <button className="dp-action-btn ghost icon-only"><Icon name="more" size={14} stroke={2} /></button>
      </div>

      <div className="dp-tabs">
        <button className={'dp-tab' + (tab === 'apercu' ? ' active' : '')} onClick={() => setTab('apercu')}>Aperçu</button>
        <button className={'dp-tab' + (tab === 'infos' ? ' active' : '')} onClick={() => setTab('infos')}>Informations</button>
        {isParish && <button className={'dp-tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>Statistiques</button>}
        {isParish && <button className={'dp-tab' + (tab === 'works' ? ' active' : '')} onClick={() => setTab('works')}>Œuvres</button>}
        {isParish && <button className={'dp-tab' + (tab === 'workers' ? ' active' : '')} onClick={() => setTab('workers')}>Ouvriers</button>}
      </div>

      {tab === 'apercu' && isParish && (
        <>
          <div className="dp-section">
            <h4>Statistiques 2025</h4>
            <div className="big-stat-row">
              <div className="big-stat green">
                <div className="bs-value">{item.stats.communiants}</div>
                <div className="bs-label">Communiants</div>
              </div>
              <div className="big-stat orange">
                <div className="bs-value">{item.stats.nonCommuniants}</div>
                <div className="bs-label">Non-communiants</div>
              </div>
              <div className="big-stat blue">
                <div className="bs-value">{item.stats.fideles}</div>
                <div className="bs-label">Total fidèles</div>
              </div>
            </div>
            <div className="big-stat-row">
              <div className="big-stat"><div className="bs-value" style={{color:'var(--t-1)'}}>{item.stats.baptemes}</div><div className="bs-label">Baptêmes</div></div>
              <div className="big-stat"><div className="bs-value" style={{color:'var(--t-1)'}}>{item.stats.mariages}</div><div className="bs-label">Mariages</div></div>
              <div className="big-stat"><div className="bs-value" style={{color:'var(--t-1)'}}>{item.stats.deces}</div><div className="bs-label">Décès</div></div>
            </div>
          </div>

          {workers.length > 0 && (
            <div className="dp-section">
              <h4>Ouvriers ({workers.length}) <button className="view-all" onClick={() => setTab('workers')}>Voir tous ›</button></h4>
              {workers.slice(0, 3).map(w => {
                const initials = w.name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={w.id} className="dp-worker">
                    <span className="avatar">{initials}</span>
                    <span className="w-body">
                      <div className="w-name">{w.gradeLabel} {w.name.split(' ').slice(1).join(' ')}</div>
                      <div className="w-meta">{w.gradeLabel} · {w.name.split(' ')[0]}</div>
                    </span>
                    <span className={'w-status ' + w.status}>{w.status === 'actif' ? 'Actif' : w.status === 'retraite' ? 'Retraité' : 'Susp.'}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="dp-foot-cards">
            <button className="dp-foot-card" onClick={() => setTab('works')}>
              <span className="fc-ico"><Icon name="buildings" size={16} stroke={1.9} /></span>
              <span className="fc-name">Œuvres liées</span>
              <span className="fc-sub">{linkedWorks.length} œuvres</span>
            </button>
            <button className="dp-foot-card" onClick={() => setTab('infos')}>
              <span className="fc-ico"><Icon name="pinFilled" size={16} fill="currentColor" stroke={0} /></span>
              <span className="fc-name">Coordonnées</span>
              <span className="fc-sub">GPS &amp; contact</span>
            </button>
            <button className="dp-foot-card">
              <span className="fc-ico"><Icon name="route" size={16} stroke={2} /></span>
              <span className="fc-name">Itinéraire</span>
              <span className="fc-sub">Y aller</span>
            </button>
          </div>
        </>
      )}

      {tab === 'apercu' && !isParish && (
        <>
          <div className="dp-section">
            <h4>Présentation</h4>
            <div className="big-stat-row">
              <div className="big-stat green"><div className="bs-value">{item.capacity}</div><div className="bs-label">Capacité</div></div>
              <div className="big-stat blue"><div className="bs-value">{item.year}</div><div className="bs-label">Fondation</div></div>
              <div className="big-stat orange"><div className="bs-value">{2025 - item.year}</div><div className="bs-label">Ans d'activité</div></div>
            </div>
          </div>
          <div className="dp-foot-cards">
            <button className="dp-foot-card"><span className="fc-ico"><Icon name="pinFilled" size={16} fill="currentColor" stroke={0} /></span><span className="fc-name">Coordonnées</span><span className="fc-sub">GPS</span></button>
            <button className="dp-foot-card"><span className="fc-ico"><Icon name="phone" size={16} stroke={1.9} /></span><span className="fc-name">Contact</span><span className="fc-sub">Bureau</span></button>
            <button className="dp-foot-card"><span className="fc-ico"><Icon name="route" size={16} stroke={2} /></span><span className="fc-name">Itinéraire</span><span className="fc-sub">Y aller</span></button>
          </div>
        </>
      )}

      {tab === 'infos' && (
        <div className="dp-section">
          <h4>Informations générales</h4>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <InfoLine ico="pin" label={(district ? district.name + ' · ' : '') + region.name} sub={region.admin + ' · Cameroun'} />
            <InfoLine ico="clock" label={isParish ? 'Culte dominical : 09 h 00 · 11 h 00' : `Fondée en ${item.year}`} sub={isParish ? 'Étude biblique : mercredi 18 h 00' : `Capacité : ${item.capacity} places`} />
            <InfoLine ico="phone" label={`+237 6${(item.id.charCodeAt(2)+10)%99} ${(item.id.charCodeAt(3)+10)%99} ${(item.id.charCodeAt(4)+10)%99} ${(item.id.charCodeAt(1)+10)%99}`} sub="Bureau pastoral" />
            <InfoLine ico="globe" label={`eec-cameroun.org/${region.id.toLowerCase()}`} sub="Site régional" />
          </div>

          <div className="gps-box" style={{marginTop: 14}}>
            <div className="g-coords"><span className="g-tag">GPS</span>{item.lat.toFixed(5)}° N&nbsp;&nbsp;·&nbsp;&nbsp;{item.lng.toFixed(5)}° E</div>
            <div className="gps-actions">
              <button onClick={() => navigator.clipboard?.writeText(`${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}`)}><Icon name="copy" size={11} stroke={1.9} /> Copier</button>
              <button onClick={() => window.open(`https://maps.google.com/?q=${item.lat},${item.lng}`, '_blank')}><Icon name="extLink" size={11} stroke={1.9} /> Google Maps</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && isParish && (
        <div className="dp-section">
          <h4>Statistiques détaillées <span className="yr">· 2025</span></h4>
          <div className="big-stat-row">
            <div className="big-stat green"><div className="bs-value">{item.stats.communiants}</div><div className="bs-label">Communiants</div></div>
            <div className="big-stat orange"><div className="bs-value">{item.stats.nonCommuniants}</div><div className="bs-label">Non-communiants</div></div>
            <div className="big-stat blue"><div className="bs-value">{item.stats.fideles}</div><div className="bs-label">Total fidèles</div></div>
          </div>
          <div className="big-stat-row">
            <div className="big-stat"><div className="bs-value">{item.stats.baptemes}</div><div className="bs-label">Baptêmes</div></div>
            <div className="big-stat"><div className="bs-value">{item.stats.mariages}</div><div className="bs-label">Mariages</div></div>
            <div className="big-stat red"><div className="bs-value">{item.stats.deces}</div><div className="bs-label">Décès</div></div>
          </div>
          <div style={{fontSize:11, color:'var(--t-3)', marginTop:12, textAlign:'center'}}>
            Année de référence : {2025} · Recensement synodal annuel
          </div>
        </div>
      )}

      {tab === 'works' && isParish && (
        <div className="dp-section">
          <h4>Œuvres rattachées <span className="yr">· {linkedWorks.length}</span></h4>
          {linkedWorks.map(o => {
            const t = D.ENTITY_TYPES.find(x => x.id === o.type);
            return (
              <button key={o.id} className="list-row" style={{padding:'10px 0', borderBottom:'1px solid var(--border-soft)'}}>
                <span className="lr-ico" style={{background: t.color+'15', color: t.color}}><Icon name={TYPE_ICON[o.type]} size={15} stroke={1.9} /></span>
                <span className="lr-body">
                  <span className="lr-title">{o.name}</span>
                  <span className="lr-sub">{t.singular} · capacité {o.capacity}</span>
                </span>
                <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'workers' && isParish && (
        <div className="dp-section">
          <h4>Ouvriers ecclésiastiques <span className="yr">· {workers.length}</span></h4>
          {workers.map(w => {
            const initials = w.name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={w.id} className="dp-worker">
                <span className="avatar">{initials}</span>
                <span className="w-body">
                  <div className="w-name">{w.gradeLabel} {w.name}</div>
                  <div className="w-meta">{w.gradeLabel}</div>
                </span>
                <span className={'w-status ' + w.status}>{w.status === 'actif' ? 'Actif' : w.status === 'retraite' ? 'Retraité' : 'Susp.'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoLine = ({ ico, label, sub }) => (
  <div style={{display:'flex', alignItems:'flex-start', gap:12}}>
    <span style={{width:32, height:32, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', background:'var(--surface-2)', color:'var(--t-2)', flexShrink:0}}>
      <Icon name={ico} size={14} stroke={1.9} />
    </span>
    <div style={{flex:1, minWidth:0}}>
      <div style={{fontSize:13, color:'var(--t-1)', fontWeight:500}}>{label}</div>
      {sub && <div style={{fontSize:11, color:'var(--t-2)', marginTop:1}}>{sub}</div>}
    </div>
  </div>
);

/* ============================== LEGEND ============================== */
const Legend = ({ counts, basemap, visibleCount }) => (
  <footer className="legend" data-screen-label="Legend">
    <div className="legend-title">
      <span className="lt-flag" />
      <span className="lt-text">Légende EEC</span>
    </div>
    <div className="legend-items">
      <span className="legend-item">
        <span className="l-glyph" style={{ background: '#2E9744' }}>
          <Icon name="region" size={13} color="#fff" stroke={1.8} />
        </span>
        Région <span className="l-count">22</span>
      </span>
      {D.ENTITY_TYPES.map(t => (
        <span key={t.id} className="legend-item">
          <span className="l-glyph" style={{ background: t.color }}>
            <Icon name={TYPE_ICON[t.id]} size={13} color="#fff" stroke={1.9} />
          </span>
          {t.singular} <span className="l-count">{counts[t.id]}</span>
        </span>
      ))}
    </div>
    <div className="legend-end">
      <span className="le-update">{basemap === 'sat' ? 'Satellite' : 'CARTO Positron'}</span>
      <span className="le-live"><span className="live-dot" /> {fmt(visibleCount)} visibles</span>
    </div>
  </footer>
);

/* ============================== LIST VIEW ============================== */
const ListView = ({ items, onPick }) => (
  <div className="listview" data-screen-label="List view">
    <div className="lv-head">
      <h3>Annuaire des établissements EEC</h3>
      <span className="lv-count">{fmt(items.length)} résultats</span>
    </div>
    <div className="lv-cols">
      <span></span><span>Nom</span><span>Type</span><span>Région · Ville</span><span style={{textAlign:'right'}}>Fidèles</span><span>Statut</span>
    </div>
    <div className="lv-body">
      {items.slice(0, 200).map(it => {
        const t = D.ENTITY_TYPES.find(x => x.id === it.type);
        const r = D.REGIONS.find(x => x.id === it.regionId);
        return (
          <div key={it.id} className="lv-row" onClick={() => onPick(it)}>
            <span className="lv-ico" style={{ background: t.color + '15', color: t.color }}>
              <Icon name={TYPE_ICON[it.type]} size={14} stroke={1.9} />
            </span>
            <span className="lv-name">{it.name}</span>
            <span className="lv-type">{t.singular}</span>
            <span className="lv-region">{r.admin} · {r.city}</span>
            <span className="lv-num">{it.stats ? it.stats.fideles : '—'}</span>
            <span className="lv-status">
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#2E9744', display:'inline-block' }} />
              Opérationnel
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

/* === Export to window === */
Object.assign(window, {
  Navbar, Rail, RAIL_TABS,
  SearchPanel, FiltersPanel, SliderRow,
  StatsPanel, EntityListPanel, ParcoursPanel, HistoryPanel, SettingsPanel,
  DetailPanel, Legend, ListView,
});
