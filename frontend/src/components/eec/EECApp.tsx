'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import { Icon, TYPE_ICON, markerSvg } from './icons';
import {
  REGIONS, DISTRICTS, PARISHES, OEUVRES, WORKERS,
  ENTITY_TYPES, ALL_ITEMS,
} from '@/lib/eec-data';

/* ============================================================
   Types
   ============================================================ */
type AnyItem = typeof ALL_ITEMS[number] | Region | District;
type Region  = typeof REGIONS[number];
type District = typeof DISTRICTS[number];
type FilterState = {
  region: string | null;
  district: string | null;
  parish: string | null;
  layers: Record<string, boolean>;
  grades: Set<string>;
  status: string;
  year: number;
  minFideles: number;
  minCommun: number;
};

const DEFAULT_FILTERS: FilterState = {
  region: null, district: null, parish: null,
  layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true },
  grades: new Set(),
  status: 'tous',
  year: 2025,
  minFideles: 0, minCommun: 0,
};

/* ============================================================
   Helpers
   ============================================================ */
function useDebounced<T>(value: T, ms = 180): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const fmt = (n?: number) => (n || 0).toLocaleString('fr');

function makeIcon(type: string, color: string, sel = false) {
  const sz: [number, number] = sel ? [36, 44] : [30, 38];
  return L.divIcon({
    html: markerSvg(type, color, sel),
    className: 'eec-marker',
    iconSize: sz,
    iconAnchor: [sz[0] / 2, sz[1] - 4],
    popupAnchor: [0, -sz[1] + 6],
  });
}

/* ============================================================
   Map constants
   ============================================================ */
const BASEMAPS = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap, © CARTO' },
  sat:   { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar' },
};
const CAMEROON_BOUNDS = L.latLngBounds([1.6, 8.4], [13.1, 16.2]);
const CAMEROON_CENTER: [number, number] = [6.5, 12.5];

/* ============================================================
   useLeafletMap
   ============================================================ */
function useLeafletMap(
  filteredItems: AnyItem[],
  basemap: 'light' | 'sat',
  selectedId: string | undefined,
  onMarkerClick: (item: AnyItem) => void,
  focusTarget: { lat: number; lng: number; zoom?: number } | null,
) {
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const focusRippleRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('eec-map', {
      center: CAMEROON_CENTER, zoom: 6,
      minZoom: 5, maxZoom: 18,
      zoomControl: false, attributionControl: true,
      preferCanvas: true,
    } as L.MapOptions);
    L.control.zoom({ position: 'topleft' }).addTo(map);
    mapRef.current = map;
    map.setMaxBounds([[-1, 5], [15, 20]]);

    const regionLayer = L.layerGroup();
    REGIONS.forEach(r => {
      const circle = L.circle([r.lat, r.lng], {
        radius: r.radius * 110000,
        color: '#2E9744', weight: 1.6, opacity: 0.7,
        fillColor: '#2E9744', fillOpacity: 0.06,
        interactive: true,
      });
      const pc = PARISHES.filter(p => p.regionId === r.id).length;
      const dc = DISTRICTS.filter(d => d.regionId === r.id).length;
      circle.bindPopup(
        `<div class="region-popup"><div class="rp-strip"></div><div class="rp-type">Région Synodale</div><div class="rp-name">${r.city}</div><div class="rp-stats"><span>Districts</span><b>${dc}</b><span>Paroisses</span><b>${pc}</b><span>Région admin.</span><b>${r.admin}</b></div></div>`,
        { closeButton: false, maxWidth: 260 },
      );
      circle.on('mouseover', () => circle.setStyle({ fillOpacity: 0.16, weight: 2 }));
      circle.on('mouseout',  () => circle.setStyle({ fillOpacity: 0.06, weight: 1.6 }));
      circle.on('click', () => map.flyToBounds(circle.getBounds().pad(0.2), { duration: 0.6 } as L.FitBoundsOptions));
      regionLayer.addLayer(circle);
    });
    regionLayer.addTo(map);

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c: any) => {
        const n = c.getChildCount();
        return L.divIcon({
          html: `<div>${n}</div>`,
          className: 'marker-cluster' + (n >= 30 ? ' marker-cluster-large' : ''),
          iconSize: [40, 40],
        });
      },
    });
    cluster.addTo(map);
    clusterRef.current = cluster;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const bm = BASEMAPS[basemap];
    tileRef.current = L.tileLayer(bm.url, { attribution: bm.attr, maxZoom: 19 }).addTo(map);
    tileRef.current.bringToBack();
  }, [basemap]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    filteredItems.forEach(it => {
      const item = it as any;
      const type = item.type || (it.id.startsWith('R') ? 'region' : 'district');
      const t = ENTITY_TYPES.find(x => x.id === type);
      const color = t?.color ?? '#2E9744';
      const m = L.marker([it.lat, it.lng], {
        icon: makeIcon(type, color, it.id === selectedId),
        title: it.name,
      });
      m.on('click', () => onMarkerClick(it));
      cluster.addLayer(m);
    });
  }, [filteredItems, selectedId, onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    const { lat, lng, zoom = 12 } = focusTarget;
    map.flyTo([lat, lng], zoom, { duration: 0.6 } as L.ZoomPanOptions);
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

/* ============================================================
   NAVBAR
   ============================================================ */
const Navbar = ({ view, setView, stats, theme, setTheme }: {
  view: 'map' | 'list'; setView: (v: 'map' | 'list') => void;
  stats: Record<string, number>;
  theme: string; setTheme: (t: string) => void;
}) => {
  const NAV_STATS = [
    { id: 'regions',   icon: 'compass',   value: stats.regions,   label: 'Régions Synodales', bg: '#FFF6C8',              fg: '#E8B600' },
    { id: 'districts', icon: 'network',   value: stats.districts, label: 'Districts',         bg: 'rgba(46,151,68,0.12)', fg: '#1F7331' },
    { id: 'parishes',  icon: 'cross',     value: stats.parishes,  label: 'Paroisses',         bg: 'rgba(46,151,68,0.16)', fg: '#1F7331' },
    { id: 'oeuvres',   icon: 'buildings', value: stats.oeuvres,   label: 'Œuvres',            bg: 'rgba(103,58,183,0.12)', fg: '#673AB7' },
    { id: 'workers',   icon: 'briefcase', value: stats.workers,   label: 'Ouvriers',          bg: 'rgba(217,48,37,0.10)', fg: '#D93025' },
  ];
  return (
    <header className="navbar">
      <div className="brand">
        <img className="brand-logo" src="/logo-eec.png" alt="EEC" />
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
          <button onClick={() => setView('map')} style={{ border:0, background: view==='map' ? 'var(--eec-green)' : 'transparent', color: view==='map' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' } as React.CSSProperties}>
            <Icon name="map" size={13} stroke={1.9} /> Carte
          </button>
          <button onClick={() => setView('list')} style={{ border:0, background: view==='list' ? 'var(--eec-green)' : 'transparent', color: view==='list' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' } as React.CSSProperties}>
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

/* ============================================================
   RAIL
   ============================================================ */
const RAIL_TABS = [
  { id: 'search',    label: 'Recherche',    icon: 'search' },
  { id: 'filters',   label: 'Filtres',      icon: 'filterFunnel' },
  { id: 'parcours',  label: 'Parcours',     icon: 'trail' },
  { id: 'stats',     label: 'Statistiques', icon: 'stat' },
  { id: 'regions',   label: 'Régions',    icon: 'region' },
  { id: 'districts', label: 'Districts',  icon: 'network' },
  { id: 'paroisses', label: 'Paroisses',    icon: 'church' },
  { id: 'oeuvres',   label: 'Œuvres',       icon: 'buildings' },
  { id: 'ouvriers',  label: 'Ouvriers',     icon: 'users' },
  { id: 'history',   label: 'Historique',   icon: 'history' },
  { id: 'settings',  label: 'Paramètres',   icon: 'settings' },
];

const Rail = ({ active, setActive, onCollapse, badges }: {
  active: string | null;
  setActive: (id: string | null) => void;
  onCollapse: () => void;
  badges: Record<string, number | null>;
}) => (
  <nav className="rail">
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

/* ============================================================
   SEARCH PANEL
   ============================================================ */
const SearchPanel = ({ onPick, onClose, recents }: {
  onPick: (kind: string, item: any) => void;
  onClose: () => void;
  recents: AnyItem[];
}) => {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!dq.trim()) return null;
    const n = dq.toLowerCase();
    return {
      par: PARISHES.filter(p => p.name.toLowerCase().includes(n)).slice(0, 6),
      oeu: OEUVRES.filter(o => o.name.toLowerCase().includes(n)).slice(0, 5),
      dis: DISTRICTS.filter(d => d.name.toLowerCase().includes(n)).slice(0, 4),
      reg: REGIONS.filter(r => r.name.toLowerCase().includes(n) || r.city.toLowerCase().includes(n)).slice(0, 4),
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
            <input ref={inputRef} value={q} placeholder="Tapez pour rechercher…" onChange={e => setQ(e.target.value)} />
            <button className="mic" title="Recherche vocale"><Icon name="mic" size={14} stroke={1.9} /></button>
          </div>
        </div>

        {!dq.trim() && (
          <>
            <div className="panel-section">
              <h3 className="section-label">Suggestions <span className="num">{REGIONS.length} régions</span></h3>
              {REGIONS.slice(0, 6).map(r => {
                const cnt = PARISHES.filter(p => p.regionId === r.id).length;
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
                const item = it as any;
                const type = item.type || (item.id.startsWith('R') ? 'region' : 'district');
                const t = ENTITY_TYPES.find(x => x.id === type);
                const r = REGIONS.find(x => x.id === item.regionId);
                return (
                  <button key={item.id + (item as any)._at} className="list-row" onClick={() => onPick('item', item)} style={{padding:'8px 0', borderBottom:'1px solid var(--border-soft)'}}>
                    <span className="lr-ico" style={{background: (t?.color ?? '#000') + '15'}}>
                      <Icon name={TYPE_ICON[type]} size={15} color={t?.color} stroke={1.9} />
                    </span>
                    <span className="lr-body">
                      <span className="lr-title">{item.name}</span>
                      <span className="lr-sub">{t?.singular || (type === 'region' ? 'Région' : 'District')} · {r?.city || item.city}</span>
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
                const r = REGIONS.find(x => x.id === p.regionId);
                return (
                  <button key={p.id} className="list-row" onClick={() => onPick('item', p)}>
                    <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}><Icon name="church" size={15} stroke={1.9} /></span>
                    <span className="lr-body">
                      <span className="lr-title">{p.name}</span>
                      <span className="lr-sub">{r?.city} · {p.stats.fideles} fidèles</span>
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
                const t = ENTITY_TYPES.find(x => x.id === o.type);
                return (
                  <button key={o.id} className="list-row" onClick={() => onPick('item', o)}>
                    <span className="lr-ico" style={{background: (t?.color ?? '#000') + '15', color: t?.color}}><Icon name={TYPE_ICON[o.type]} size={15} stroke={1.9} /></span>
                    <span className="lr-body">
                      <span className="lr-title">{o.name}</span>
                      <span className="lr-sub">{t?.singular}</span>
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

/* ============================================================
   SLIDER ROW
   ============================================================ */
const SliderRow = ({ label, value, max, step = 50, onChange, formatValue }: {
  label: string; value: number; max: number; step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) => {
  const p = Math.min(100, (value / max) * 100);
  return (
    <div className="slider-row">
      <div className="sr-head">
        <span className="sr-lbl">{label}</span>
        <span className="sr-value">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input type="range" min={0} max={max} step={step} value={value}
             style={{ '--p': p + '%' } as React.CSSProperties}
             onChange={e => onChange(+e.target.value)} />
      <div className="sr-marks"><span>0</span><span>{max/2}</span><span>{max}</span></div>
    </div>
  );
};

/* ============================================================
   CUSTOM SELECT
   ============================================================ */
interface SelectOption { value: string; label: string; }

const CustomSelect = ({ value, options, onChange, disabled = false, placeholder }: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`csel${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}>
      <button className="csel-btn" onClick={() => !disabled && setOpen(o => !o)}>
        <span className={`csel-val${!selected ? ' placeholder' : ''}`}>
          {selected?.label ?? placeholder ?? '—'}
        </span>
        <span className="csel-chevron"><Icon name="chevronD" size={13} stroke={2} /></span>
      </button>
      {open && (
        <div className="csel-list">
          {options.map(opt => (
            <button key={opt.value}
              className={`csel-opt${opt.value === value ? ' sel' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.value === value && (
                <span className="csel-opt-check"><Icon name="check" size={12} stroke={2.5} color="var(--eec-green)" /></span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   FILTER SECTION HEADER
   ============================================================ */
const FSHeader = ({ icon, label }: { icon: string; label: string }) => (
  <div className="fsh">
    <span className="fsh-ico"><Icon name={icon} size={13} color="var(--eec-green)" stroke={2} /></span>
    <span className="fsh-lbl">{label}</span>
  </div>
);

/* ============================================================
   FILTERS PANEL
   ============================================================ */
const FiltersPanel = ({ filters, setFilters, layerCounts, onClose, onReset, onApply }: {
  filters: FilterState;
  setFilters: (fn: (f: FilterState) => FilterState) => void;
  layerCounts: Record<string, number>;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) => {
  const districts = filters.region ? DISTRICTS.filter(d => d.regionId === filters.region) : [];
  const parishes  = filters.district ? PARISHES.filter(p => p.districtId === filters.district) : [];

  const toggleLayer = (id: string) => setFilters(f => ({ ...f, layers: { ...f.layers, [id]: !f.layers[id] } }));

  const regionOptions: SelectOption[] = [
    { value: '', label: `Toutes les régions (${REGIONS.length})` },
    ...REGIONS.map(r => ({ value: r.id, label: r.city })),
  ];
  const districtOptions: SelectOption[] = [
    { value: '', label: filters.region ? `Tous les districts (${districts.length})` : '— Choisir une région d\'abord' },
    ...districts.map(d => ({ value: d.id, label: d.name.replace('District de ', '') })),
  ];
  const parishOptions: SelectOption[] = [
    { value: '', label: filters.district ? `Toutes les paroisses (${parishes.length})` : '— Choisir un district d\'abord' },
    ...parishes.map(p => ({ value: p.id, label: p.name })),
  ];
  const yearOptions: SelectOption[] = [
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  return (
    <>
      <div className="panel-head">
        <h2>Filtres &amp; Recherche</h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>

      <div className="panel-body" style={{ paddingBottom: 0 }}>

        {/* Search */}
        <div className="panel-section" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input placeholder="Tapez pour rechercher…" />
            <button className="mic" title="Recherche vocale"><Icon name="mic" size={14} stroke={1.9} /></button>
          </div>
        </div>

        {/* LOCALISATION */}
        <div className="panel-section">
          <FSHeader icon="near" label="Localisation" />

          <div className="floc-row">
            <div className="floc-label">
              <Icon name="region" size={13} color="var(--eec-green)" stroke={2} />
              Région synodale
            </div>
            <CustomSelect
              value={filters.region ?? ''}
              options={regionOptions}
              onChange={v => setFilters(f => ({ ...f, region: v || null, district: null, parish: null }))}
            />
          </div>

          <div className="floc-row" style={{ opacity: filters.region ? 1 : 0.5 }}>
            <div className="floc-label">
              <Icon name="layers" size={13} color="var(--eec-green)" stroke={2} />
              District
            </div>
            <CustomSelect
              value={filters.district ?? ''}
              options={districtOptions}
              onChange={v => setFilters(f => ({ ...f, district: v || null, parish: null }))}
              disabled={!filters.region}
            />
          </div>

          <div className="floc-row" style={{ opacity: filters.district ? 1 : 0.5, marginBottom: 0 }}>
            <div className="floc-label">
              <Icon name="church" size={13} color="var(--eec-green)" stroke={2} />
              Paroisse
            </div>
            <CustomSelect
              value={filters.parish ?? ''}
              options={parishOptions}
              onChange={v => setFilters(f => ({ ...f, parish: v || null }))}
              disabled={!filters.district}
            />
          </div>
        </div>

        {/* TYPES D'ENTITÉS */}
        <div className="panel-section">
          <FSHeader icon="layers" label="Types d'entités" />
          <div className="types-grid-v2">
            {ENTITY_TYPES.map(t => (
              <div key={t.id}
                className={`type-card-v2${filters.layers[t.id] ? ' on' : ''}`}
                onClick={() => toggleLayer(t.id)}>
                <div className="tc2-top">
                  <span className="tc2-ico" style={{ background: t.color + '1A' }}>
                    <Icon name={TYPE_ICON[t.id]} size={16} color={t.color} stroke={1.9} />
                  </span>
                  <span className="tc2-check">
                    {filters.layers[t.id] && <Icon name="check" size={10} color="#fff" stroke={3} />}
                  </span>
                </div>
                <div className="tc2-lbl">{t.singular}</div>
                <div className="tc2-count" style={{ color: t.color }}>{layerCounts[t.id]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OUVRIERS */}
        <div className="panel-section">
          <FSHeader icon="users" label="Ouvriers" />

          <div className="floc-row">
            <div className="floc-label">
              <Icon name="grad" size={13} color="var(--eec-green)" stroke={2} />
              Grade ecclésiastique
            </div>
            <CustomSelect
              value=""
              options={[
                { value: '', label: 'Tous les grades' },
                { value: 'eveque', label: 'Évêque' },
                { value: 'pasteur', label: 'Pasteur' },
                { value: 'diacre', label: 'Diacre' },
                { value: 'ancien', label: 'Ancien' },
              ]}
              onChange={() => {}}
              placeholder="Tous les grades"
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <div className="floc-label" style={{ marginBottom: 8 }}>
              <Icon name="shield" size={13} color="var(--eec-green)" stroke={2} />
              Statut
            </div>
            <div className="status-row-v2">
              {[
                { id: 'tous', lbl: 'Tous' },
                { id: 'actif', lbl: 'Actifs' },
                { id: 'retraite', lbl: 'Retraités' },
                { id: 'suspendu', lbl: 'Suspendus' },
              ].map(s => (
                <button key={s.id} data-s={s.id}
                  className={`status-chip-v2${filters.status === s.id ? ' on' : ''}`}
                  onClick={() => setFilters(f => ({ ...f, status: s.id }))}>
                  <span className="sc2-dot" />
                  {s.lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="panel-section" style={{ paddingBottom: 18 }}>
          <FSHeader icon="stat" label="Statistiques" />

          <div className="floc-row">
            <div className="floc-label">
              <Icon name="clock" size={13} color="var(--eec-green)" stroke={2} />
              Année de référence
            </div>
            <CustomSelect
              value={String(filters.year)}
              options={yearOptions}
              onChange={v => setFilters(f => ({ ...f, year: +v }))}
            />
          </div>

          <div className="slider-row-v2">
            <div className="slr2-head">
              <span className="slr2-lbl">Fidèles minimum</span>
              <span className="slr2-val">{filters.minFideles === 0 ? 'Tous' : filters.minFideles + '+'}</span>
            </div>
            <input type="range" min={0} max={3000} step={50} value={filters.minFideles}
                   style={{ '--p': Math.min(100, (filters.minFideles / 3000) * 100) + '%' } as React.CSSProperties}
                   onChange={e => setFilters(f => ({ ...f, minFideles: +e.target.value }))} />
            <div className="slr2-marks"><span>0</span><span>1 500</span><span>3 000+</span></div>
          </div>

          <div className="slider-row-v2" style={{ marginBottom: 0 }}>
            <div className="slr2-head">
              <span className="slr2-lbl">Communiants minimum</span>
              <span className="slr2-val">{filters.minCommun === 0 ? 'Tous' : filters.minCommun + '+'}</span>
            </div>
            <input type="range" min={0} max={1500} step={50} value={filters.minCommun}
                   style={{ '--p': Math.min(100, (filters.minCommun / 1500) * 100) + '%' } as React.CSSProperties}
                   onChange={e => setFilters(f => ({ ...f, minCommun: +e.target.value }))} />
            <div className="slr2-marks"><span>0</span><span>750</span><span>1 500+</span></div>
          </div>
        </div>

      </div>

      {/* Boutons — toujours visibles en bas */}
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

/* ============================================================
   STATS PANEL
   ============================================================ */
const StatsPanel = ({ filters, layerCounts, onClose, onFocusRegion }: {
  filters: FilterState;
  layerCounts: Record<string, number>;
  onClose: () => void;
  onFocusRegion: (r: Region) => void;
}) => {
  const totalFideles = useMemo(() => PARISHES.reduce((s, p) => s + p.stats.fideles, 0), []);
  const totalCommun = useMemo(() => PARISHES.reduce((s, p) => s + p.stats.communiants, 0), []);
  const totalBapt = useMemo(() => PARISHES.reduce((s, p) => s + p.stats.baptemes, 0), []);
  const totalMar = useMemo(() => PARISHES.reduce((s, p) => s + p.stats.mariages, 0), []);
  const regionStats = useMemo(() => {
    const max = Math.max(...REGIONS.map(r => PARISHES.filter(p => p.regionId === r.id).length));
    return REGIONS.map(r => {
      const count = PARISHES.filter(p => p.regionId === r.id).length;
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
              <div key={r.id} className="region-bar" onClick={() => onFocusRegion(r as Region)}>
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
            {ENTITY_TYPES.filter(t => t.id !== 'paroisse').map(t => (
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

/* ============================================================
   ENTITY LIST PANEL
   ============================================================ */
const EntityListPanel = ({ title, items, kind, onPick, onClose, totalLabel, onEdit }: {
  title: string; items: any[]; kind: string;
  onPick?: (kind: string, item: any) => void;
  onClose: () => void; totalLabel: string;
  onEdit?: (item: any) => void;
}) => {
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
        {filtered.slice(0, 80).map((it: any) => {
          const r = REGIONS.find(x => x.id === it.regionId);
          if (kind === 'worker') {
            const initials = it.name.split(' ').map((s: string) => s[0]).join('').slice(0,2).toUpperCase();
            return (
              <button key={it.id} className="list-row">
                <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)', fontWeight:700, fontSize:13}}>{initials}</span>
                <span className="lr-body">
                  <span className="lr-title">{it.name}</span>
                  <span className="lr-sub">{it.gradeLabel} · {r?.city}</span>
                </span>
                <span className="dp-worker w-status" style={{padding:'3px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', borderRadius:999, background: it.status === 'actif' ? 'var(--eec-green)' : 'var(--surface-3)', color: it.status === 'actif' ? '#fff' : 'var(--t-2)'}}>
                  {it.status === 'actif' ? 'Actif' : it.status === 'retraite' ? 'Retraité' : 'Susp.'}
                </span>
              </button>
            );
          }
          const t = ENTITY_TYPES.find(x => x.id === it.type);
          return (
            <div key={it.id} className="list-row list-row-admin">
              <button className="lr-main" onClick={() => onPick && onPick(kind === 'worker' ? 'worker' : (kind === 'region' ? 'region' : (kind === 'district' ? 'district' : 'item')), it)}>
                <span className="lr-ico" style={{background: (t?.color ?? '#000') + '15', color: t?.color}}>
                  <Icon name={kind === 'region' ? 'region' : kind === 'district' ? 'network' : TYPE_ICON[it.type] || 'church'} size={15} stroke={1.9} />
                </span>
                <span className="lr-body">
                  <span className="lr-title">{it.name}</span>
                  <span className="lr-sub">{t?.singular || (kind === 'region' ? 'Région' : 'District')} · {r?.city || it.city || (it as any).admin}</span>
                </span>
              </button>
              <div className="lr-actions">
                <button className="act-btn" onClick={() => onPick && onPick('item', it)} title="Détails"><Icon name="eye" size={14} stroke={2} /></button>
                <button className="act-btn" onClick={() => onEdit && onEdit(it)} title="Modifier"><Icon name="edit" size={14} stroke={2} /></button>
                <button className="act-btn"><Icon name="more" size={14} stroke={2} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length > 80 && (
          <div className="search-empty" style={{padding:'16px 0'}}>+ {filtered.length - 80} autres résultats. Affinez la recherche.</div>
        )}
      </div>
    </>
  );
};

/* ============================================================
   PARCOURS PANEL
   ============================================================ */
const ParcoursPanel = ({ onClose }: { onClose: () => void }) => (
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

/* ============================================================
   HISTORY PANEL
   ============================================================ */
const HistoryPanel = ({ recents, onPick, onClose, onClear }: {
  recents: any[]; onPick: (item: any) => void; onClose: () => void; onClear: () => void;
}) => (
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
            const t = ENTITY_TYPES.find(x => x.id === it.type);
            const r = REGIONS.find(x => x.id === it.regionId);
            return (
              <button key={it.id + '-' + it._at} className="list-row" onClick={() => onPick(it)}>
                <span className="lr-ico" style={{background: (t?.color ?? '#000') + '15', color: t?.color}}>
                  <Icon name={TYPE_ICON[it.type]} size={15} stroke={1.9} />
                </span>
                <span className="lr-body">
                  <span className="lr-title">{it.name}</span>
                  <span className="lr-sub">{t?.singular} · {r?.city}</span>
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

/* ============================================================
   SETTINGS PANEL
   ============================================================ */
const SettingsPanel = ({ theme, setTheme, onClose }: {
  theme: string; setTheme: (t: string) => void; onClose: () => void;
}) => (
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

/* ============================================================
   DETAIL PANEL
   ============================================================ */
const InfoLine = ({ ico, label, sub }: { ico: string; label: string; sub?: string }) => (
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

const DetailPanel = ({ item, onClose, saved, onToggleSave, onPick }: {
  item: AnyItem | null;
  onClose: () => void;
  saved: AnyItem[];
  onToggleSave: (item: AnyItem) => void;
  onPick: (item: AnyItem) => void;
}) => {
  const [tab, setTab] = useState('apercu');
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setTab('apercu'); }, [item?.id]);

  if (!item) return <div className="detail-panel" />;

  // Detect type
  const isRegion = 'admin' in item && 'city' in item && !('type' in item);
  const isDistrict = 'name' in item && 'regionId' in item && !('type' in item) && !isRegion;
  const isEntity = 'type' in item;

  const itemType = isRegion ? 'region' : isDistrict ? 'district' : (item as any).type;
  const typeMeta = isEntity ? ENTITY_TYPES.find(t => t.id === (item as any).type) : {
    singular: isRegion ? 'Région Synodale' : 'District',
    color: '#2E9744',
  };

  const region = isRegion ? (item as Region) : REGIONS.find(r => r.id === (item as any).regionId);
  const district = isDistrict ? (item as District) : ((item as any).districtId ? DISTRICTS.find(d => d.id === (item as any).districtId) : null);

  const isParish = isEntity && (item as any).type === 'paroisse';
  const workers = isParish ? WORKERS.filter(w => w.parishId === item.id).slice(0, 6) : [];
  const linkedWorks = isParish ? OEUVRES.filter(o => o.regionId === item.regionId).slice(0, 4) : [];
  
  // Specific stats for Regions/Districts
  const regionDistricts = isRegion ? DISTRICTS.filter(d => d.regionId === item.id) : [];
  const regionParishes = isRegion ? PARISHES.filter(p => p.regionId === item.id) : [];
  const districtParishes = isDistrict ? PARISHES.filter(p => p.districtId === item.id) : [];

  const isSaved = saved.some(s => s.id === item.id);
  const rating = (4.0 + ((item.id.charCodeAt(item.id.length-1) % 10) / 10)).toFixed(1);
  const reviewCount = 8 + (item.id.charCodeAt(item.id.length-1) % 80);

  return (
    <div className="detail-panel open">
      <div className="dp-hero">
        <div className="hero-fallback">
          <div className="dp-hero-grid" />
          <div style={{position:'absolute', inset:0, background: `radial-gradient(circle at 75% 20%, ${typeMeta?.color ?? '#2E9744'}22, transparent 55%)`, pointerEvents:'none'}} />
          <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -55%)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div style={{width:76, height:76, borderRadius:'50%', background: (typeMeta?.color ?? '#2E9744') + '1E', border:`2px solid ${typeMeta?.color ?? '#2E9744'}38`, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <Icon name={isRegion ? 'region' : isDistrict ? 'network' : TYPE_ICON[(item as any).type]} size={34} color={typeMeta?.color} stroke={1.6} />
            </div>
          </div>
          <div style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: typeMeta?.color, opacity:0.88}} />
        </div>
        <div className="dp-hero-badge">
          <Icon name={isRegion ? 'region' : isDistrict ? 'network' : TYPE_ICON[(item as any).type]} size={11} color={typeMeta?.color} stroke={2} />
          {typeMeta?.singular}
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
        <div className="dp-type" style={{ color: typeMeta?.color }}>{typeMeta?.singular} EEC</div>
        <div className="dp-title-row">
          <h3 className="dp-title">{isRegion ? (item as Region).name : (item as any).name}</h3>
          <span className="dp-verified"><Icon name="check" size={11} color="#fff" stroke={3} /></span>
        </div>
        <div className="dp-meta-line">
          <span className="stars">
            <span className="s-y"><Icon name="starFilled" size={13} color="#92400E" fill="#FFD600" stroke={0} /></span>
            {rating}
            <span style={{color:'var(--t-3)', fontWeight:400}}>({reviewCount} avis)</span>
          </span>
          <span className="ml-sep">·</span>
          <span>{isRegion ? (item as Region).admin : district ? district.name : region?.city}</span>
          <span className="ml-sep">·</span>
          <span>{region?.admin}</span>
        </div>
      </div>

      <div className="dp-actions">
        <button className="dp-action-btn primary"><Icon name="directions" size={14} stroke={2.2} /> Itinéraire</button>
        <button className="dp-action-btn ghost" onClick={() => onToggleSave(item)}>
          <Icon name={isSaved ? 'starFilled' : 'star'} size={14} color={isSaved ? '#92400E' : 'currentColor'} fill={isSaved ? '#FFD600' : 'none'} stroke={isSaved ? 0 : 1.9} />
          {isSaved ? 'Enregistré' : 'Enregistrer'}
        </button>
        <button className="dp-action-btn ghost"><Icon name="share" size={14} stroke={1.9} /> Partager</button>
        <button className="dp-action-btn ghost icon-only"><Icon name="more" size={14} stroke={2} /></button>
      </div>

      <div className="dp-tabs" ref={tabsRef}>
        <button className={'dp-tab' + (tab === 'apercu' ? ' active' : '')} onClick={() => setTab('apercu')}>Aperçu</button>
        <button className={'dp-tab' + (tab === 'infos' ? ' active' : '')} onClick={() => setTab('infos')}>Informations</button>
        {isRegion && <button className={'dp-tab' + (tab === 'districts' ? ' active' : '')} onClick={() => setTab('districts')}>Districts</button>}
        {(isRegion || isDistrict) && <button className={'dp-tab' + (tab === 'parishes' ? ' active' : '')} onClick={() => setTab('parishes')}>Paroisses</button>}
        {isParish && <button className={'dp-tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>Statistiques</button>}
        {isParish && <button className={'dp-tab' + (tab === 'works' ? ' active' : '')} onClick={() => setTab('works')}>Œuvres</button>}
        {isParish && <button className={'dp-tab' + (tab === 'workers' ? ' active' : '')} onClick={() => setTab('workers')}>Ouvriers</button>}
      </div>

      {tab === 'apercu' && (
        <div className="dp-section">
          {isRegion && (
            <>
              <h4>Vue d'ensemble de la région</h4>
              <div className="big-stat-row">
                <div className="big-stat green"><div className="bs-value">{regionDistricts.length}</div><div className="bs-label">Districts</div></div>
                <div className="big-stat blue"><div className="bs-value">{regionParishes.length}</div><div className="bs-label">Paroisses</div></div>
                <div className="big-stat"><div className="bs-value">{(item as Region).city}</div><div className="bs-label">Siège</div></div>
              </div>
            </>
          )}
          {isDistrict && (
            <>
              <h4>Vue d'ensemble du district</h4>
              <div className="big-stat-row">
                <div className="big-stat green"><div className="bs-value">{districtParishes.length}</div><div className="bs-label">Paroisses</div></div>
                <div className="big-stat blue"><div className="bs-value">{region?.city}</div><div className="bs-label">Région</div></div>
              </div>
            </>
          )}
          {isParish && (item as any).stats && (
            <>
              <h4>Statistiques 2025</h4>
              <div className="big-stat-row">
                <div className="big-stat green"><div className="bs-value">{(item as any).stats.communiants}</div><div className="bs-label">Communiants</div></div>
                <div className="big-stat orange"><div className="bs-value">{(item as any).stats.nonCommuniants}</div><div className="bs-label">Non-communiants</div></div>
                <div className="big-stat blue"><div className="bs-value">{(item as any).stats.fideles}</div><div className="bs-label">Total fidèles</div></div>
              </div>
            </>
          )}
          {!isRegion && !isDistrict && !isParish && isEntity && (
            <div className="big-stat-row">
              <div className="big-stat green"><div className="bs-value">{(item as any).capacity}</div><div className="bs-label">Capacité</div></div>
              <div className="big-stat blue"><div className="bs-value">{(item as any).year}</div><div className="bs-label">Fondation</div></div>
            </div>
          )}
        </div>
      )}

      {tab === 'districts' && isRegion && (
        <div className="dp-section">
          <h4>Districts de la région ({regionDistricts.length})</h4>
          {regionDistricts.map(d => (
            <button key={d.id} className="list-row" onClick={() => onPick(d)}>
              <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}><Icon name="network" size={15} stroke={1.9} /></span>
              <span className="lr-body">
                <span className="lr-title">{d.name}</span>
                <span className="lr-sub">District synodal</span>
              </span>
              <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
          ))}
        </div>
      )}

      {tab === 'parishes' && (isRegion || isDistrict) && (
        <div className="dp-section">
          <h4>Paroisses ({isRegion ? regionParishes.length : districtParishes.length})</h4>
          {(isRegion ? regionParishes : districtParishes).slice(0, 50).map(p => (
            <button key={p.id} className="list-row" onClick={() => onPick(p)}>
              <span className="lr-ico" style={{background:'var(--eec-green-soft)', color:'var(--green-deep-text)'}}><Icon name="church" size={15} stroke={1.9} /></span>
              <span className="lr-body">
                <span className="lr-title">{p.name}</span>
                <span className="lr-sub">{p.stats.fideles} fidèles</span>
              </span>
              <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
          ))}
        </div>
      )}

      {tab === 'infos' && (
        <div className="dp-section">
          <h4>Informations générales</h4>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <InfoLine ico="pin" label={(district ? district.name + ' · ' : '') + region?.name} sub={region?.admin + ' · Cameroun'} />
            <InfoLine ico="clock" label={isParish ? 'Culte dominical : 09 h 00 · 11 h 00' : isRegion || isDistrict ? 'Ouvert du Lun. au Ven.' : `Fondée en ${(item as any).year}`} sub={isParish ? 'Étude biblique : mercredi 18 h 00' : ''} />
            <InfoLine ico="phone" label={`+237 6${(item.id.charCodeAt(item.id.length-1)+10)%99} ${(item.id.charCodeAt(3)+10)%99} ${(item.id.charCodeAt(4)+10)%99} ${(item.id.charCodeAt(1)+10)%99}`} sub="Bureau administratif" />
            <InfoLine ico="globe" label={`eec-cameroun.org/${region?.id?.toLowerCase()}`} sub="Site régional" />
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

      {tab === 'stats' && isParish && (item as any).stats && (
        <div className="dp-section">
          <h4>Statistiques détaillées <span className="yr">· 2025</span></h4>
          <div className="big-stat-row">
            <div className="big-stat green"><div className="bs-value">{(item as any).stats.communiants}</div><div className="bs-label">Communiants</div></div>
            <div className="big-stat orange"><div className="bs-value">{(item as any).stats.nonCommuniants}</div><div className="bs-label">Non-communiants</div></div>
            <div className="big-stat blue"><div className="bs-value">{(item as any).stats.fideles}</div><div className="bs-label">Total fidèles</div></div>
          </div>
        </div>
      )}

      {tab === 'works' && isParish && (
        <div className="dp-section">
          <h4>Œuvres rattachées <span className="yr">· {linkedWorks.length}</span></h4>
          {linkedWorks.map(o => {
            const t = ENTITY_TYPES.find(x => x.id === o.type);
            return (
              <button key={o.id} className="list-row" onClick={() => onPick(o)}>
                <span className="lr-ico" style={{background: (t?.color ?? '#000')+'15', color: t?.color}}><Icon name={TYPE_ICON[o.type]} size={15} stroke={1.9} /></span>
                <span className="lr-body">
                  <span className="lr-title">{o.name}</span>
                  <span className="lr-sub">{t?.singular} · capacité {o.capacity}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'workers' && isParish && (
        <div className="dp-section">
          <h4>Ouvriers ecclésiastiques <span className="yr">· {workers.length}</span></h4>
          {workers.map(w => {
            const initials = w.name.split(' ').map((s: string) => s[0]).join('').slice(0,2).toUpperCase();
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

/* ============================================================
   LEGEND
   ============================================================ */
const Legend = ({ counts, basemap, visibleCount }: {
  counts: Record<string, number>; basemap: string; visibleCount: number;
}) => (
  <footer className="legend">
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
      {ENTITY_TYPES.map(t => (
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

/* ============================================================
   EDIT PANEL
   ============================================================ */
const EditPanel = ({ item, onClose, onSave }: {
  item: AnyItem | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) => {
  const [tab, setTab] = useState('general');
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (item) setFormData({ ...item });
  }, [item]);

  if (!item || !formData) return null;

  const isRegion = 'admin' in item && 'city' in item && !('type' in item);
  const isDistrict = 'name' in item && 'regionId' in item && !('type' in item) && !isRegion;
  const isParish = 'type' in item && (item as any).type === 'paroisse';

  const typeLabel = isRegion ? 'la Région' : isDistrict ? 'le District' : 'l\'Établissement';

  return (
    <div className="detail-panel open edit-mode">
      <div className="dp-head" style={{paddingTop: 20}}>
        <div className="dp-type" style={{ color: 'var(--eec-green)' }}>Modification de {typeLabel}</div>
        <div className="dp-title-row">
          <h3 className="dp-title">{formData.name}</h3>
        </div>
      </div>

      <div className="dp-tabs">
        <button className={'dp-tab' + (tab === 'general' ? ' active' : '')} onClick={() => setTab('general')}>Général</button>
        <button className={'dp-tab' + (tab === 'location' ? ' active' : '')} onClick={() => setTab('location')}>Emplacement</button>
        {isParish && <button className={'dp-tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>Stats 2025</button>}
      </div>

      <div className="dp-body" style={{padding: '0 20px 20px'}}>
        {tab === 'general' && (
          <div className="form-grid">
            <div className="field-row">
              <label>Nom officiel</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            {isRegion && (
              <div className="field-row">
                <label>Chef-lieu / Ville</label>
                <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            )}
            {isRegion && (
              <div className="field-row">
                <label>Région administrative</label>
                <input value={formData.admin} onChange={e => setFormData({...formData, admin: e.target.value})} />
              </div>
            )}
          </div>
        )}

        {tab === 'location' && (
          <div className="form-grid">
            <div className="field-row">
              <label>Latitude</label>
              <input type="number" step="0.000001" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})} />
            </div>
            <div className="field-row">
              <label>Longitude</label>
              <input type="number" step="0.000001" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})} />
            </div>
          </div>
        )}

        {tab === 'stats' && isParish && formData.stats && (
          <div className="form-grid">
            <div className="field-row">
              <label>Fidèles (total)</label>
              <input type="number" value={formData.stats.fideles} onChange={e => setFormData({...formData, stats: {...formData.stats, fideles: parseInt(e.target.value)}})} />
            </div>
            <div className="field-row">
              <label>Communiants</label>
              <input type="number" value={formData.stats.communiants} onChange={e => setFormData({...formData, stats: {...formData.stats, communiants: parseInt(e.target.value)}})} />
            </div>
          </div>
        )}
      </div>

      <div className="dp-actions" style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface-1)', padding: 16, borderTop: '1px solid var(--border)', display:'flex', gap: 12}}>
        <button className="dp-action-btn primary" style={{flex: 1}} onClick={() => { onSave(formData); onClose(); }}>
          <Icon name="check" size={14} stroke={2} /> Enregistrer
        </button>
        <button className="dp-action-btn ghost" style={{flex: 1}} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
};

/* ============================================================
   LIST VIEW
   ============================================================ */
const ListView = ({ items, onPick, onEdit }: { items: AnyItem[]; onPick: (item: AnyItem) => void; onEdit?: (item: AnyItem) => void }) => (
  <div className="listview">
    <div className="lv-head">
      <h3>Annuaire des établissements EEC</h3>
      <span className="lv-count">{fmt(items.length)} résultats</span>
    </div>
    <div className="lv-cols">
      <span></span><span>Nom</span><span>Type</span><span>Région · Ville</span><span style={{textAlign:'right'}}>Fidèles</span><span>Statut</span>
    </div>
    <div className="lv-body">
      {items.slice(0, 200).map((it: any) => {
        const t = ENTITY_TYPES.find(x => x.id === it.type);
        const r = REGIONS.find(x => x.id === it.regionId);
        return (
          <div key={it.id} className="lv-row">
            <div className="lv-main" onClick={() => onPick(it)}>
              <span className="lv-ico" style={{ background: (t?.color ?? '#000') + '15', color: t?.color }}>
                <Icon name={TYPE_ICON[it.type] || 'church'} size={14} stroke={1.9} />
              </span>
              <span className="lv-name">{it.name}</span>
              <span className="lv-type">{t?.singular || '—'}</span>
              <span className="lv-region">{r?.admin || it.admin} · {r?.city || it.city}</span>
              <span className="lv-num">{it.stats ? it.stats.fideles : '—'}</span>
              <span className="lv-status">
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#2E9744', display:'inline-block' }} />
                Opérationnel
              </span>
            </div>
            <div className="lv-actions">
              <button className="act-btn" onClick={() => onPick(it)} title="Détails"><Icon name="eye" size={14} stroke={2} /></button>
              <button className="act-btn" onClick={() => onEdit && onEdit(it)} title="Modifier"><Icon name="edit" size={14} stroke={2} /></button>
              <button className="act-btn"><Icon name="more" size={14} stroke={2} /></button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ============================================================
   QUICK CHIPS
   ============================================================ */
const QUICK_CHIPS = [
  { id: 'paroisse', lbl: 'Paroisses',    ico: 'church' },
  { id: 'scolaire', lbl: 'Écoles',       ico: 'graduation' },
  { id: 'medical',  lbl: 'Hôpitaux',     ico: 'hospital' },
  { id: 'univ',     lbl: 'Universités',  ico: 'university' },
  { id: 'agro',     lbl: 'Domaines',     ico: 'leaf' },
  { id: 'immeuble', lbl: 'Immeubles',    ico: 'buildings' },
  { id: 'terrain',  lbl: 'Terrains',     ico: 'fields' },
];

/* ============================================================
   APP (main component)
   ============================================================ */
export default function EECApp() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [theme, setTheme] = useState<string>('dark');
  const [activeTab, setActiveTab] = useState<string | null>('search');
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [basemap, setBasemap] = useState<'light' | 'sat'>('light');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [floatQ, setFloatQ] = useState('');
  const [selected, setSelected] = useState<AnyItem | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [recents, setRecents] = useState<any[]>([]);
  const [saved, setSaved] = useState<AnyItem[]>([]);
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) { setFullscreen(false); return; }
        if (selected)   { setSelected(null); return; }
        if (floatQ)     { setFloatQ(''); return; }
        if (activeTab)  { setActiveTab(null); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreen, selected, floatQ, activeTab]);

  const filteredItems = useMemo(() => {
    return ALL_ITEMS.filter(it => {
      const item = it as any;
      if (floatQ && !item.name.toLowerCase().includes(floatQ.toLowerCase())) return false;
      if (!filters.layers[item.type]) return false;
      if (filters.region && item.regionId !== filters.region) return false;
      if (filters.district && item.districtId !== filters.district) return false;
      if (filters.parish && item.id !== filters.parish) return false;
      if (item.type === 'paroisse' && item.stats) {
        if (filters.minFideles && item.stats.fideles < filters.minFideles) return false;
        if (filters.minCommun && item.stats.communiants < filters.minCommun) return false;
      }
      return true;
    });
  }, [filters, floatQ]);

  const layerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ENTITY_TYPES.forEach(t => { counts[t.id] = 0; });
    ALL_ITEMS.forEach(it => {
      if (filters.region && it.regionId !== filters.region) return;
      if (filters.district && (it as any).districtId !== filters.district) return;
      counts[it.type] = (counts[it.type] || 0) + 1;
    });
    return counts;
  }, [filters.region, filters.district]);

  const stats = {
    regions: REGIONS.length, districts: DISTRICTS.length,
    parishes: PARISHES.length, oeuvres: OEUVRES.length, workers: WORKERS.length,
  };

  const badges: Record<string, number | null> = {
    saved:   saved.length > 0 ? saved.length : null,
    history: recents.length > 0 ? recents.length : null,
  };

  const addToRecents = useCallback((item: AnyItem) => {
    setRecents(prev => {
      const filtered = prev.filter((x: any) => x.id !== item.id);
      return [{ ...item, _at: Date.now(), _timeAgo: "à l'instant" }, ...filtered].slice(0, 25);
    });
  }, []);

  const handleMarkerClick = useCallback((item: AnyItem) => {
    setSelected(item);
    if ('type' in item) addToRecents(item as any);
    setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 13 });
  }, [addToRecents]);

  const handleSearchPick = useCallback((kind: string, item: any) => {
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

  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true }, grades: new Set() });
  }, []);

  const toggleSave = useCallback((item: AnyItem) => {
    setSaved(prev => prev.some(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]);
  }, []);

  const handleFloatSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!floatQ.trim()) return setActiveTab('search');
    const n = floatQ.toLowerCase();
    const hit: any = ALL_ITEMS.find(it => it.name.toLowerCase().includes(n))
             || REGIONS.find(r => r.city.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
    if (hit) {
      if (hit.type) { setSelected(hit); addToRecents(hit); setFocusTarget({ lat: hit.lat, lng: hit.lng, zoom: 13 }); }
      else setFocusTarget({ lat: hit.lat, lng: hit.lng, zoom: 8 });
    } else setActiveTab('search');
  };

  const { mapRef } = useLeafletMap(filteredItems, basemap, selected?.id, handleMarkerClick, focusTarget);

  const recenter = () => mapRef.current?.flyToBounds(CAMEROON_BOUNDS, { duration: 0.7 } as L.FitBoundsOptions);

  const toggleQuickChip = (id: string) => {
    setFilters(f => {
      const onlyMe = f.layers[id] && ENTITY_TYPES.every(t => t.id === id || !f.layers[t.id]);
      const next: Record<string, boolean> = {};
      if (onlyMe) { ENTITY_TYPES.forEach(t => { next[t.id] = true; }); }
      else        { ENTITY_TYPES.forEach(t => { next[t.id] = t.id === id; }); }
      return { ...f, layers: next };
    });
  };

  return (
    <div className={'app' + (fullscreen ? ' fs' : '')}>
      {!fullscreen && <Navbar view={view} setView={setView} stats={stats} theme={theme} setTheme={setTheme} />}

      <div className={'main' + (activeTab ? ' panel-open' : '') + (railCollapsed ? ' rail-collapsed' : '') + (fullscreen ? ' fullscreen' : '')}>
        {!fullscreen && !railCollapsed && (
          <Rail active={activeTab} setActive={setActiveTab} onCollapse={() => setRailCollapsed(true)} badges={badges} />
        )}

        {!fullscreen && (
          <aside className="panel">
            {activeTab === 'search'    && <SearchPanel onPick={handleSearchPick} recents={recents} onClose={() => setActiveTab(null)} />}
            {activeTab === 'filters'   && <FiltersPanel filters={filters} setFilters={setFilters as any} layerCounts={layerCounts} onClose={() => setActiveTab(null)} onReset={handleReset} onApply={() => setActiveTab(null)} />}
            {activeTab === 'parcours'  && <ParcoursPanel onClose={() => setActiveTab(null)} />}
            {activeTab === 'stats'     && <StatsPanel filters={filters} layerCounts={layerCounts} onClose={() => setActiveTab(null)} onFocusRegion={r => { setFilters(f => ({ ...f, region: r.id })); setFocusTarget({ lat: r.lat, lng: r.lng, zoom: 8 }); }} />}
            {activeTab === 'regions'   && <EntityListPanel title="Régions" items={REGIONS} kind="region" onPick={(k, i) => handleSearchPick(k, i)} onClose={() => setActiveTab(null)} totalLabel={`${REGIONS.length} régions synodales`} onEdit={item => setEditingItem(item)} />}
            {activeTab === 'districts' && <EntityListPanel title="Districts" items={DISTRICTS} kind="district" onPick={(k, i) => handleSearchPick(k, i)} onClose={() => setActiveTab(null)} totalLabel={`${DISTRICTS.length} districts recensés`} onEdit={item => setEditingItem(item)} />}
            {activeTab === 'paroisses' && <EntityListPanel title="Paroisses" items={PARISHES} kind="parish" onPick={(k, i) => handleSearchPick(k, i)} onClose={() => setActiveTab(null)} totalLabel={`${PARISHES.length} paroisses recensées`} onEdit={item => setEditingItem(item)} />}
            {activeTab === 'oeuvres'   && <EntityListPanel title="Œuvres" items={OEUVRES} kind="oeuvre" onPick={(k, i) => handleSearchPick(k, i)} onClose={() => setActiveTab(null)} totalLabel={`${OEUVRES.length} œuvres recensées`} onEdit={item => setEditingItem(item)} />}
            {activeTab === 'ouvriers'  && <EntityListPanel title="Ouvriers" items={WORKERS} kind="worker" onClose={() => setActiveTab(null)} totalLabel={`${WORKERS.length} ouvriers ecclésiastiques`} onEdit={item => setEditingItem(item)} />}
            {activeTab === 'history'   && <HistoryPanel recents={recents} onPick={handleMarkerClick} onClose={() => setActiveTab(null)} onClear={() => setRecents([])} />}
            {activeTab === 'settings'  && <SettingsPanel theme={theme} setTheme={setTheme} onClose={() => setActiveTab(null)} />}
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
                <form className="floating-search" onSubmit={handleFloatSearch} style={{left: (fullscreen || railCollapsed) ? 60 : 56}}>
                  <span className="fs-icon"><Icon name="search" size={18} stroke={1.9} /></span>
                  <input value={floatQ} onChange={e => setFloatQ(e.target.value)}
                         placeholder="Rechercher une paroisse, une œuvre, une région…"
                         onFocus={() => !floatQ && setActiveTab('search')} />
                  {floatQ && <button type="button" className="fs-btn" onClick={() => setFloatQ('')}><Icon name="close" size={14} stroke={2} /></button>}
                  <button type="button" className="fs-btn" onClick={() => setActiveTab('search')}><Icon name="more" size={16} stroke={2} /></button>
                  <button type="button" className="fs-mic" title="Recherche vocale"><Icon name="mic" size={14} stroke={1.9} /></button>
                </form>
              )}

              <div className="chip-row" style={{left: (fullscreen || railCollapsed) ? 60 : 56, top: (activeTab === 'search' || activeTab === 'filters') ? 14 : 70}}>
                {QUICK_CHIPS.map(c => {
                  const t = ENTITY_TYPES.find(x => x.id === c.id);
                  const onlyMe = filters.layers[c.id] && ENTITY_TYPES.every(x => x.id === c.id || !filters.layers[x.id]);
                  return (
                    <button key={c.id} className={'chip' + (onlyMe ? ' active' : '')} onClick={() => toggleQuickChip(c.id)}>
                      <span className="chip-ico"><Icon name={c.ico} size={13} color={onlyMe ? '#FFD600' : t?.color} stroke={1.9} /></span>
                      {c.lbl}
                      <span style={{ color: onlyMe ? '#FFD600' : 'var(--t-3)', fontWeight: 700, fontVariantNumeric:'tabular-nums', marginLeft: 2 }}>{layerCounts[c.id]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="map-ctrls-right">
                <div className="map-ctrl-card">
                  <button onClick={recenter} title="Recentrer sur le Cameroun"><Icon name="home" size={16} stroke={1.9} /></button>
                  <button onClick={() => setBasemap(b => b === 'light' ? 'sat' : 'light')} title="Basculer fond carte"><Icon name="layers" size={15} stroke={1.9} /></button>
                  {fullscreen ? (
                    <button onClick={() => setFullscreen(false)} title="Quitter le plein écran (Échap)"><Icon name="compress" size={15} stroke={1.9} /></button>
                  ) : (
                    <button onClick={() => { setFullscreen(true); setActiveTab(null); }} title="Plein écran"><Icon name="expand" size={15} stroke={1.9} /></button>
                  )}
                </div>
                <div className="map-ctrl-card">
                  <button className="yellow" title="Ma position (GPS)">
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

            </>
          )}

        {editingItem && (
          <EditPanel 
            item={editingItem} 
            onClose={() => setEditingItem(null)} 
            onSave={(data) => {
              console.log('Saving data:', data);
              // In a real app, this would be an API call
              // For now, we just close and maybe show a toast
              setEditingItem(null);
            }} 
          />
        )}

        {selected && (
          <DetailPanel 
            item={selected} 
            onClose={() => setSelected(null)} 
            saved={saved} 
            onToggleSave={toggleSave} 
            onPick={handleMarkerClick}
          />
        )}

        </div>
      </div>

      <Legend counts={layerCounts} basemap={basemap} visibleCount={filteredItems.length} />
    </div>
  );
}
