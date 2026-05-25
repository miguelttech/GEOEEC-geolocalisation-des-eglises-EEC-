/* =============================================================================
   EEC Géolocalisation — Main app · useLeafletMap + App
   ============================================================================= */

const { useState: _useState, useEffect: _useEffect, useRef: _useRef, useMemo: _useMemo, useCallback: _useCallback } = React;
const _D = window.EEC_DATA;

/* ============================== MAP ============================== */
const BASEMAPS = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap, © CARTO' },
  sat:   { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar' },
};
const CAMEROON_BOUNDS = L.latLngBounds([1.6, 8.4], [13.1, 16.2]);
const CAMEROON_CENTER = [6.5, 12.5];

function useLeafletMap(filteredItems, basemap, selectedId, onMarkerClick, focusTarget) {
  const mapRef = _useRef(null);
  const tileRef = _useRef(null);
  const clusterRef = _useRef(null);
  const focusRippleRef = _useRef(null);

  _useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('eec-map', {
      center: CAMEROON_CENTER, zoom: 6,
      minZoom: 5, maxZoom: 18,
      zoomControl: false, attributionControl: true,
      preferCanvas: true,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;
    map.setMaxBounds([[-1, 5], [15, 20]]);

    const regionLayer = L.layerGroup();
    _D.REGIONS.forEach(r => {
      const circle = L.circle([r.lat, r.lng], {
        radius: r.radius * 110000,
        color: '#2E9744', weight: 1.6, opacity: 0.7,
        fillColor: '#2E9744', fillOpacity: 0.06,
        interactive: true,
      });
      const pc = _D.PARISHES.filter(p => p.regionId === r.id).length;
      const dc = _D.DISTRICTS.filter(d => d.regionId === r.id).length;
      circle.bindPopup(`<div class="region-popup"><div class="rp-strip"></div><div class="rp-type">Région Synodale</div><div class="rp-name">${r.city}</div><div class="rp-stats"><span>Districts</span><b>${dc}</b><span>Paroisses</span><b>${pc}</b><span>Région admin.</span><b>${r.admin}</b></div></div>`, { closeButton: false, maxWidth: 260 });
      circle.on('mouseover', () => circle.setStyle({ fillOpacity: 0.16, weight: 2 }));
      circle.on('mouseout',  () => circle.setStyle({ fillOpacity: 0.06, weight: 1.6 }));
      circle.on('click', () => map.flyToBounds(circle.getBounds().pad(0.2), { duration: 0.6 }));
      regionLayer.addLayer(circle);
    });
    regionLayer.addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const isLarge = n >= 30;
        return L.divIcon({
          html: `<div>${n}</div>`,
          className: 'marker-cluster' + (isLarge ? ' marker-cluster-large' : ''),
          iconSize: [40, 40],
        });
      },
    });
    cluster.addTo(map);
    clusterRef.current = cluster;
  }, []);

  _useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const bm = BASEMAPS[basemap];
    tileRef.current = L.tileLayer(bm.url, { attribution: bm.attr, maxZoom: 19 }).addTo(map);
    tileRef.current.bringToBack();
  }, [basemap]);

  _useEffect(() => {
    const cluster = clusterRef.current; if (!cluster) return;
    cluster.clearLayers();
    filteredItems.forEach(it => {
      const t = _D.ENTITY_TYPES.find(x => x.id === it.type);
      const m = L.marker([it.lat, it.lng], { icon: makeIcon(it.type, t.color, it.id === selectedId), title: it.name });
      m.on('click', () => onMarkerClick(it));
      cluster.addLayer(m);
    });
  }, [filteredItems, selectedId]);

  _useEffect(() => {
    const map = mapRef.current; if (!map || !focusTarget) return;
    const { lat, lng, zoom = 12 } = focusTarget;
    map.flyTo([lat, lng], zoom, { duration: 0.6 });
    if (focusRippleRef.current) map.removeLayer(focusRippleRef.current);
    const ring = L.circleMarker([lat, lng], { radius: 4, color: '#FFD600', weight: 3, fillOpacity: 0, opacity: 0.9 }).addTo(map);
    focusRippleRef.current = ring;
    let r = 4; let op = 0.9;
    const iv = setInterval(() => {
      r += 1.8; op -= 0.04;
      if (op <= 0) { clearInterval(iv); map.removeLayer(ring); return; }
      ring.setRadius(r);
      ring.setStyle({ opacity: op });
    }, 30);
    return () => clearInterval(iv);
  }, [focusTarget]);

  return { mapRef };
}

/* ============================== APP ============================== */
const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "openTab": "search",
  "primary": "#2E9744"
}/*EDITMODE-END*/;

const QUICK_CHIPS = [
  { id: 'paroisse', lbl: 'Paroisses',    ico: 'church' },
  { id: 'scolaire', lbl: 'Écoles',       ico: 'graduation' },
  { id: 'medical',  lbl: 'Hôpitaux',     ico: 'hospital' },
  { id: 'univ',     lbl: 'Universités',  ico: 'university' },
  { id: 'agro',     lbl: 'Domaines',     ico: 'leaf' },
  { id: 'immeuble', lbl: 'Immeubles',    ico: 'buildings' },
  { id: 'terrain',  lbl: 'Terrains',     ico: 'fields' },
];

const App = () => {
  const [view, setView] = _useState('map');
  const [theme, setTheme] = _useState(DEFAULT_TWEAKS.theme);
  const [activeTab, setActiveTab] = _useState(DEFAULT_TWEAKS.openTab || 'search');
  const [railCollapsed, setRailCollapsed] = _useState(false);
  const [basemap, setBasemap] = _useState('light');
  const [filters, setFilters] = _useState({
    region: null, district: null, parish: null,
    layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true },
    grades: new Set(),
    status: 'tous',
    year: 2025,
    minFideles: 0, minCommun: 0,
  });
  const [floatQ, setFloatQ] = _useState('');
  const [selected, setSelected] = _useState(null);
  const [focusTarget, setFocusTarget] = _useState(null);
  const [fullscreen, setFullscreen] = _useState(false);
  const [recents, setRecents] = _useState([]);
  const [saved, setSaved] = _useState([]);
  const [tweaks, setTweak] = useTweaks(DEFAULT_TWEAKS);

  _useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const filteredItems = _useMemo(() => _D.ALL_ITEMS.filter(it => {
    if (!filters.layers[it.type]) return false;
    if (filters.region && it.regionId !== filters.region) return false;
    if (filters.district && it.districtId !== filters.district) return false;
    if (filters.parish && it.id !== filters.parish) return false;
    if (it.type === 'paroisse' && it.stats) {
      if (filters.minFideles && it.stats.fideles < filters.minFideles) return false;
      if (filters.minCommun && it.stats.communiants < filters.minCommun) return false;
    }
    return true;
  }), [filters]);

  const layerCounts = _useMemo(() => {
    const counts = {};
    _D.ENTITY_TYPES.forEach(t => { counts[t.id] = 0; });
    _D.ALL_ITEMS.forEach(it => {
      if (filters.region && it.regionId !== filters.region) return;
      if (filters.district && it.districtId !== filters.district) return;
      counts[it.type] = (counts[it.type] || 0) + 1;
    });
    return counts;
  }, [filters.region, filters.district]);

  const stats = { regions: _D.REGIONS.length, districts: _D.DISTRICTS.length, parishes: _D.PARISHES.length, oeuvres: _D.OEUVRES.length, workers: _D.WORKERS.length };

  const badges = {
    saved:   saved.length > 0 ? saved.length : null,
    history: recents.length > 0 ? recents.length : null,
  };

  const addToRecents = _useCallback((item) => {
    setRecents(prev => {
      const filtered = prev.filter(x => x.id !== item.id);
      return [{ ...item, _at: Date.now(), _timeAgo: "à l'instant" }, ...filtered].slice(0, 25);
    });
  }, []);

  const handleMarkerClick = _useCallback((item) => {
    setSelected(item);
    addToRecents(item);
    setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 13 });
  }, [addToRecents]);

  const handleSearchPick = _useCallback((kind, item) => {
    if (kind === 'item') {
      setSelected(item);
      addToRecents(item);
      setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 13 });
    } else if (kind === 'region') {
      setFilters(f => ({ ...f, region: item.id, district: null, parish: null }));
      setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 8 });
    } else if (kind === 'district') {
      setFilters(f => ({ ...f, region: item.regionId, district: item.id, parish: null }));
      setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 11 });
    }
  }, [addToRecents]);

  const handleReset = _useCallback(() => {
    setFilters({
      region: null, district: null, parish: null,
      layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true },
      grades: new Set(),
      status: 'tous', year: 2025, minFideles: 0, minCommun: 0,
    });
  }, []);

  const toggleSave = _useCallback((item) => {
    setSaved(prev => prev.some(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]);
  }, []);

  const handleFloatSearch = (e) => {
    e?.preventDefault();
    if (!floatQ.trim()) return setActiveTab('search');
    const n = floatQ.toLowerCase();
    const hit = _D.ALL_ITEMS.find(it => it.name.toLowerCase().includes(n))
             || _D.REGIONS.find(r => r.city.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
    if (hit) {
      if (hit.type) { setSelected(hit); addToRecents(hit); setFocusTarget({ lat: hit.lat, lng: hit.lng, zoom: 13 }); }
      else setFocusTarget({ lat: hit.lat, lng: hit.lng, zoom: 8 });
    } else setActiveTab('search');
  };

  const downloadProject = () => {
    alert("Pour télécharger le projet complet :\n\n1. Dites à Claude dans le chat : « Télécharge tout le projet »\n2. Claude générera un fichier ZIP contenant tout le code source.\n3. Vous pourrez ensuite l'intégrer à votre infrastructure ou poursuivre le développement.");
  };

  const { mapRef } = useLeafletMap(filteredItems, basemap, selected?.id, handleMarkerClick, focusTarget);

  const recenter = () => mapRef.current?.flyToBounds(CAMEROON_BOUNDS, { duration: 0.7 });

  const toggleQuickChip = (id) => {
    setFilters(f => {
      const onlyMe = f.layers[id] && _D.ENTITY_TYPES.every(t => t.id === id || !f.layers[t.id]);
      const next = {};
      if (onlyMe) { _D.ENTITY_TYPES.forEach(t => { next[t.id] = true; }); }
      else        { _D.ENTITY_TYPES.forEach(t => { next[t.id] = t.id === id; }); }
      return { ...f, layers: next };
    });
  };

  return (
    <div className="app" data-screen-label="EEC Geolocation App">
      {!fullscreen && <Navbar view={view} setView={setView} stats={stats} theme={theme} setTheme={setTheme} />}

      <div className={'main' + (activeTab ? ' panel-open' : '') + (railCollapsed ? ' rail-collapsed' : '') + (fullscreen ? ' fullscreen' : '')}>
        {!fullscreen && !railCollapsed && <Rail active={activeTab} setActive={setActiveTab} onCollapse={() => setRailCollapsed(true)} badges={badges} />}

        {!fullscreen && (
          <aside className="panel" data-screen-label={`Panel · ${activeTab}`}>
            {activeTab === 'search'    && <SearchPanel onPick={handleSearchPick} recents={recents} onClose={() => setActiveTab(null)} />}
            {activeTab === 'filters'   && <FiltersPanel filters={filters} setFilters={setFilters} layerCounts={layerCounts} onClose={() => setActiveTab(null)} onReset={handleReset} onApply={() => setActiveTab(null)} />}
            {activeTab === 'parcours'  && <ParcoursPanel onClose={() => setActiveTab(null)} />}
            {activeTab === 'stats'     && <StatsPanel filters={filters} layerCounts={layerCounts} onClose={() => setActiveTab(null)}
                                              onFocusRegion={(r) => { setFilters(f => ({ ...f, region: r.id })); setFocusTarget({ lat: r.lat, lng: r.lng, zoom: 8 }); }} />}
            {activeTab === 'paroisses' && <EntityListPanel title="Paroisses" items={_D.PARISHES} kind="parish" onPick={handleMarkerClick} onClose={() => setActiveTab(null)} totalLabel={`${_D.PARISHES.length} paroisses recensées`} />}
            {activeTab === 'oeuvres'   && <EntityListPanel title="Œuvres" items={_D.OEUVRES} kind="oeuvre" onPick={handleMarkerClick} onClose={() => setActiveTab(null)} totalLabel={`${_D.OEUVRES.length} œuvres recensées`} />}
            {activeTab === 'ouvriers'  && <EntityListPanel title="Ouvriers" items={_D.WORKERS} kind="worker" onClose={() => setActiveTab(null)} totalLabel={`${_D.WORKERS.length} ouvriers ecclésiastiques`} />}
            {activeTab === 'history'   && <HistoryPanel recents={recents} onPick={handleMarkerClick} onClose={() => setActiveTab(null)} onClear={() => setRecents([])} />}
            {activeTab === 'settings'  && <SettingsPanel theme={theme} setTheme={setTheme} onClose={() => setActiveTab(null)} onDownload={downloadProject} />}
          </aside>
        )}

        <div className="map-wrap">
          {railCollapsed && !fullscreen && (
            <button className="rail-reopen" onClick={() => setRailCollapsed(false)} title="Rouvrir le rail">
              <Icon name="chevron" size={16} stroke={2} />
            </button>
          )}

          <div id="eec-map" className="map" style={{ display: view === 'map' ? 'block' : 'none' }} />
          {view === 'list' && <ListView items={filteredItems} onPick={handleMarkerClick} />}

          {view === 'map' && (
            <>
              {activeTab !== 'search' && activeTab !== 'filters' && (
                <form className="floating-search" onSubmit={handleFloatSearch} style={{left: railCollapsed ? 60 : 14}}>
                  <span className="fs-icon"><Icon name="search" size={18} stroke={1.9} /></span>
                  <input value={floatQ} onChange={e => setFloatQ(e.target.value)}
                         placeholder="Rechercher une paroisse, une œuvre, une région…"
                         onFocus={() => !floatQ && setActiveTab('search')} />
                  {floatQ && <button type="button" className="fs-btn" onClick={() => setFloatQ('')}><Icon name="close" size={14} stroke={2} /></button>}
                  <button type="button" className="fs-btn" onClick={() => setActiveTab('search')}><Icon name="more" size={16} stroke={2} /></button>
                  <button type="button" className="fs-mic" title="Recherche vocale"><Icon name="mic" size={14} stroke={1.9} /></button>
                </form>
              )}

              <div className="chip-row" style={{left: railCollapsed ? 60 : 14, top: (activeTab === 'search' || activeTab === 'filters') ? 14 : 70}}>
                {QUICK_CHIPS.map(c => {
                  const t = _D.ENTITY_TYPES.find(x => x.id === c.id);
                  const onlyMe = filters.layers[c.id] && _D.ENTITY_TYPES.every(x => x.id === c.id || !filters.layers[x.id]);
                  return (
                    <button key={c.id} className={'chip' + (onlyMe ? ' active' : '')} onClick={() => toggleQuickChip(c.id)}>
                      <span className="chip-ico"><Icon name={c.ico} size={13} color={onlyMe ? '#FFD600' : t.color} stroke={1.9} /></span>
                      {c.lbl}
                      <span style={{ color: onlyMe ? '#FFD600' : 'var(--t-3)', fontWeight: 700, fontVariantNumeric:'tabular-nums', marginLeft: 2 }}>{layerCounts[c.id]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="map-ctrls-right">
                <div className="map-ctrl-card" style={{marginTop: 86}}>
                  <button onClick={recenter} title="Recentrer sur le Cameroun"><Icon name="home" size={16} stroke={1.9} /></button>
                  <button onClick={() => setBasemap(b => b === 'light' ? 'sat' : 'light')} title="Basculer fond carte"><Icon name="layers" size={15} stroke={1.9} /></button>
                  <button onClick={() => setFullscreen(true)} title="Plein écran"><Icon name="expand" size={15} stroke={1.9} /></button>
                </div>
                <div className="map-ctrl-card">
                  <button className="yellow" title="Ma position">
                    <Icon name="pinFilled" size={14} fill="currentColor" stroke={0} />
                  </button>
                </div>
              </div>

              <div className={'basemap-thumb' + (basemap === 'sat' ? ' sat' : '')} onClick={() => setBasemap(b => b === 'light' ? 'sat' : 'light')}>
                <div className="bt-prev" />
                <div className="bt-label">
                  {basemap === 'light' ? 'Plan' : 'Satellite'}
                  <div className="bt-sub">Basculer</div>
                </div>
              </div>

              <div className="map-info-pill">
                <span className="mi-dot" /> CMR · {fmt(filteredItems.length)} éléments visibles
              </div>

              {/* Detail close-toggle on map (if detail panel open) */}
              {selected && (
                <button className="detail-toggle" onClick={() => setSelected(null)} title="Fermer le panneau détail">
                  <Icon name="close" size={15} stroke={2} />
                </button>
              )}
            </>
          )}

          <DetailPanel item={selected} onClose={() => setSelected(null)} saved={saved} onToggleSave={toggleSave} />

          {fullscreen && (
            <button className="exit-fs" onClick={() => setFullscreen(false)}>
              <Icon name="compress" size={14} stroke={2} /> Quitter le plein écran
            </button>
          )}
        </div>
      </div>

      {!fullscreen && <Legend counts={layerCounts} basemap={basemap} visibleCount={filteredItems.length} />}

      <TweaksPanel title="Tweaks · Géolocalisation EEC">
        <TweakSection label="Apparence" />
        <TweakRadio label="Thème" value={theme}
          options={['light', 'dark']}
          onChange={(v) => setTheme(v)} />
        <TweakColor label="Couleur primaire" value={tweaks.primary}
          options={['#2E9744','#1B5E20','#43A047','#00897B']}
          onChange={(v) => {
            setTweak('primary', v);
            document.documentElement.style.setProperty('--eec-green', v);
          }} />
        <TweakSection label="Navigation rapide" />
        <TweakSelect label="Région synodale"
          value={filters.region || ''}
          options={[{ value: '', label: 'Toutes' }, ..._D.REGIONS.map(r => ({ value: r.id, label: r.city }))]}
          onChange={(v) => {
            setFilters(f => ({ ...f, region: v || null, district: null, parish: null }));
            if (v) { const r = _D.REGIONS.find(x => x.id === v); setFocusTarget({ lat: r.lat, lng: r.lng, zoom: 8 }); }
          }} />
        <TweakButton label="Recentrer Cameroun" onClick={recenter} />
        <TweakButton label="Mode plein écran" onClick={() => setFullscreen(true)} />
        <TweakButton label="Télécharger le projet" onClick={downloadProject} />
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
