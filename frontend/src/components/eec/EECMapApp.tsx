'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import L from 'leaflet';
import 'leaflet.markercluster';
// leaflet-rotate (sans types) : patche L pour activer la rotation de la carte
import 'leaflet-rotate';
// Décodage des tuiles vectorielles OpenFreeMap (source des points d'intérêt,
// identique à celle de la carte 3D — voir usePOILayer)
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Icon, TYPE_ICON, markerSvg } from './icons';

// Vue de navigation 3D (MapLibre) — chargée paresseusement, uniquement pendant la navigation
const NavMap3D = dynamic(() => import('./NavMap3D'), { ssr: false });
import { ENTITY_TYPES } from '@/lib/eec-data';
import {
  loadMapData,
  type MapDataResult,
  type RegionItem,
  type DistrictItem,
  type ParishItem,
  type OeuvreItem,
} from '@/lib/eec-api';

/* ============================================================
   Types
   ============================================================ */
export type MapMode = 'public' | 'visitor';
export interface MapUser {
  id: number; first_name: string; last_name: string; email: string; role: string;
}

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

// Récupère le token CSRF : lit d'abord le cookie (rapide), sinon une seule requête.
let _csrfCache = '';
async function ensureCsrf(): Promise<string> {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)eec_csrftoken=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  if (_csrfCache) return _csrfCache;
  _csrfCache = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' })
    .then(r => r.json()).then(d => d.csrfToken ?? '').catch(() => '');
  return _csrfCache;
}

// Type d'entité générique pour la persistance (paroisse ou œuvre)
const entityKind = (item: any): 'paroisse' | 'oeuvre' =>
  (item?.type === 'paroisse' ? 'paroisse' : 'oeuvre');

type AnyItem = ParishItem | OeuvreItem | RegionItem | DistrictItem;
type FilterState = {
  region: string | null; district: string | null; parish: string | null;
  layers: Record<string, boolean>; grades: Set<string>;
  status: string; year: number; minFideles: number; minCommun: number;
};

/* Routing types (itinéraire type Google Maps) */
export type TravelMode = 'auto' | 'bicycle' | 'pedestrian';
export type RoutePoint = { lat: number; lng: number; label: string; kind: string };
export type RouteStep = { instruction: string; distance_km: number; duration_min: number; type: number };
export type RouteData = {
  mode: string;
  distance_km: number;
  duration_min: number;
  geometry: [number, number][];   // [lat, lng]
  steps: RouteStep[];
} | null;

const DEFAULT_FILTERS: FilterState = {
  region: null, district: null, parish: null,
  layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true },
  grades: new Set(), status: 'tous', year: 2025, minFideles: 0, minCommun: 0,
};

/* ============================================================
   Map data context
   ============================================================ */
const EMPTY_DATA: MapDataResult = {
  regions: [], districts: [], parishes: [], oeuvres: [], workers: [],
  allItems: [],
  globalStats: { regions: 0, districts: 0, parishes: 0, oeuvres: 0, workers: 0 },
};

const MapDataCtx = React.createContext<MapDataResult>(EMPTY_DATA);
const useMapData = () => useContext(MapDataCtx);

/* ============================================================
   Helpers
   ============================================================ */
function useDebounced<T>(value: T, ms = 180): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
const fmt = (n?: number) => (n || 0).toLocaleString('fr');
function relTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60); if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24); if (d < 30) return `il y a ${d} j`;
  return `il y a ${Math.floor(d / 30)} mois`;
}

function makeIcon(type: string, color: string, sel = false) {
  const sz: [number, number] = sel ? [36, 44] : [30, 38];
  return L.divIcon({
    html: markerSvg(type, color, sel), className: 'eec-marker',
    iconSize: sz, iconAnchor: [sz[0] / 2, sz[1] - 4], popupAnchor: [0, -sz[1] + 6],
  });
}

/* ============================================================
   Map constants
   ============================================================ */
// CartoDB Voyager = routes + noms de rues/quartiers + POI (proche de Google Maps)
const BASEMAPS = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap, © CARTO' },
  sat:   { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar' },
};
// Labels overlay pour mode satellite (routes + noms par-dessus l'image satellite)
const SAT_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
const CAMEROON_BOUNDS = L.latLngBounds([1.6, 8.4], [13.1, 16.2]);
const CAMEROON_CENTER: [number, number] = [6.5, 12.5];
// Tuile transparente (1px GIF) pour remplacer les tuiles manquantes ou "Map data not yet available"
const BLANK_TILE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// Palette de 22 couleurs distinctes pour les régions synodales
const REG_COLORS = [
  '#1F7331','#2196F3','#E65100','#9C27B0','#00838F','#AD1457',
  '#558B2F','#1565C0','#BF360C','#6A1B9A','#006064','#880E4F',
  '#33691E','#0D47A1','#D84315','#4A148C','#004D40','#78350F',
  '#1B5E20','#01579B','#B71C1C','#4E342E',
];

/* ============================================================
   POI — lus depuis les TUILES VECTORIELLES OpenFreeMap, c'est-à-dire
   EXACTEMENT la même source de données que la carte de navigation 3D
   (qui affiche déjà correctement écoles, hôpitaux, monuments…).
   L'ancien système Overpass a été abandonné : ses serveurs publics
   sont injoignables depuis ce réseau (timeouts systématiques vérifiés).
   Ici : on télécharge la tuile .pbf de la zone visible (z14), on décode
   la couche `poi` (schéma OpenMapTiles) et on filtre par classe.
   ============================================================ */

// Classes de POI retenues (schéma OpenMapTiles) → glyphe, couleur, zoom
// d'apparition. L'affichage est PROGRESSIF : les lieux majeurs (hôpitaux,
// universités, administrations) dès z14, les commerces vers z16 — comme
// sur la carte 3D et Google Maps. Les classes parasites (coiffeurs, bars,
// garages…) sont volontairement exclues pour ne pas saturer la carte.
const POI_CLASSES: Record<string, { glyph: string; color: string; minZoom: number }> = {
  hospital:         { glyph: 'hospital',   color: '#C62828', minZoom: 14 },
  doctors:          { glyph: 'hospital',   color: '#C62828', minZoom: 16 },
  pharmacy:         { glyph: 'pharmacy',   color: '#2E7D32', minZoom: 15 },
  college:          { glyph: 'school',     color: '#0D47A1', minZoom: 14 },
  university:       { glyph: 'school',     color: '#0D47A1', minZoom: 14 },
  school:           { glyph: 'school',     color: '#1565C0', minZoom: 15 },
  library:          { glyph: 'school',     color: '#5E35B1', minZoom: 16 },
  town_hall:        { glyph: 'admin',      color: '#6A1B9A', minZoom: 14 },
  police:           { glyph: 'admin',      color: '#37474F', minZoom: 15 },
  fire_station:     { glyph: 'admin',      color: '#BF360C', minZoom: 16 },
  post:             { glyph: 'admin',      color: '#F57F17', minZoom: 16 },
  museum:           { glyph: 'monument',   color: '#795548', minZoom: 14 },
  monument:         { glyph: 'monument',   color: '#795548', minZoom: 14 },
  attraction:       { glyph: 'monument',   color: '#795548', minZoom: 15 },
  cinema:           { glyph: 'monument',   color: '#4527A0', minZoom: 16 },
  stadium:          { glyph: 'stadium',    color: '#00695C', minZoom: 14 },
  place_of_worship: { glyph: 'worship',    color: '#8D6E63', minZoom: 16 },
  bank:             { glyph: 'bank',       color: '#0D47A1', minZoom: 15 },
  fuel:             { glyph: 'fuel',       color: '#FF6F00', minZoom: 15 },
  grocery:          { glyph: 'market',     color: '#6A1B9A', minZoom: 16 },
  restaurant:       { glyph: 'restaurant', color: '#E65100', minZoom: 16 },
  cafe:             { glyph: 'restaurant', color: '#E65100', minZoom: 17 },
  fast_food:        { glyph: 'restaurant', color: '#E65100', minZoom: 17 },
  lodging:          { glyph: 'hotel',      color: '#00838F', minZoom: 16 },
};

// Entrées montrées dans la légende (une par famille de glyphe)
const LEGEND_POI: { glyph: string; color: string; label: string }[] = [
  { glyph: 'hospital',   color: '#C62828', label: 'Hôpital / Clinique' },
  { glyph: 'school',     color: '#1565C0', label: 'École / Université' },
  { glyph: 'admin',      color: '#6A1B9A', label: 'Administration' },
  { glyph: 'monument',   color: '#795548', label: 'Musée / Monument' },
  { glyph: 'pharmacy',   color: '#2E7D32', label: 'Pharmacie' },
  { glyph: 'bank',       color: '#0D47A1', label: 'Banque' },
  { glyph: 'market',     color: '#6A1B9A', label: 'Marché / Supermarché' },
  { glyph: 'restaurant', color: '#E65100', label: 'Restaurant / Café' },
  { glyph: 'hotel',      color: '#00838F', label: 'Hôtel' },
  { glyph: 'fuel',       color: '#FF6F00', label: 'Station essence' },
];

// Glyphes SVG plats (2D) pour les POI secondaires — style trait fin, discret
const POI_GLYPHS: Record<string, string> = {
  school:    '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-4"/>',
  hospital:  '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M12 9v7"/><path d="M8.5 12.5h7"/>',
  pharmacy:  '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  restaurant:'<path d="M6 3v7"/><path d="M9 3v7"/><path d="M7.5 10v11"/><path d="M15 3c-1.4 0-2 3-2 5s2 2.5 2 2.5V21"/>',
  market:    '<path d="M4 5h2l1.6 9.5h9.4L19 8H6.4"/><circle cx="9" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/>',
  monument:  '<path d="M4 20h16"/><path d="M6 20V10"/><path d="M10 20V10"/><path d="M14 20V10"/><path d="M18 20V10"/><path d="M4 10l8-5 8 5z"/>',
  bank:      '<path d="M3 10l9-5 9 5"/><path d="M5 10v9"/><path d="M19 10v9"/><path d="M9 10v9"/><path d="M15 10v9"/><path d="M3 20h18"/>',
  fuel:      '<rect x="4" y="4" width="9" height="16" rx="1"/><path d="M13 9h3l2 2v5.5a1.5 1.5 0 0 1-3 0V14h-2"/>',
  admin:     '<rect x="5" y="9" width="14" height="11" rx="1"/><path d="M12 9V3"/><path d="M12 3l5 1.5-5 1.5"/><path d="M9 20v-4h6v4"/>',
  stadium:   '<ellipse cx="12" cy="12" rx="9" ry="5"/><ellipse cx="12" cy="12" rx="4" ry="2.2"/>',
  worship:   '<path d="M12 3v4"/><path d="M10 5h4"/><path d="M6 21v-9l6-4 6 4v9"/><path d="M6 21h12"/>',
  hotel:     '<path d="M3 18V7"/><path d="M3 14h18v4"/><circle cx="7" cy="10.5" r="1.8"/><path d="M11 14v-4h7a3 3 0 0 1 3 3v1"/>',
};

// Petite icône POI 2D, discrète (pastille blanche pour lisibilité)
function poiSvg(glyphId: string, color: string): string {
  const glyph = POI_GLYPHS[glyphId] || '<circle cx="12" cy="12" r="6"/>';
  return `<div class="poi-2d">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}"
         stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
  </div>`;
}

// ── Accès aux tuiles vectorielles ──────────────────────────────────────────
const POI_TILE_ZOOM = 14;              // zoom natif max des tuiles OpenFreeMap
const POI_MIN_DISPLAY_ZOOM = 14;       // en-dessous : aucun POI (éléments secondaires)
const OFM_TILEJSON = 'https://tiles.openfreemap.org/planet';

type PoiFeature = { lat: number; lng: number; name: string; cls: string };

let _poiTileTemplate: string | null = null;      // résolu une seule fois
let _poiTemplatePromise: Promise<string | null> | null = null;
const _poiTileCache = new Map<string, PoiFeature[]>();   // clé "x/y" → POI décodés

async function resolvePoiTileTemplate(): Promise<string | null> {
  if (_poiTileTemplate) return _poiTileTemplate;
  if (!_poiTemplatePromise) {
    _poiTemplatePromise = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch(OFM_TILEJSON, { signal: ctrl.signal });
        clearTimeout(t);
        const tj = await res.json();
        _poiTileTemplate = (tj.tiles?.[0] as string) ?? null;
        return _poiTileTemplate;
      } catch { return null; }
    })();
  }
  return _poiTemplatePromise;
}

const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2tile = (lat: number, z: number) =>
  Math.floor(((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * 2 ** z);

// Télécharge + décode la couche `poi` d'une tuile (avec cache mémoire)
async function loadPoiTile(x: number, y: number): Promise<PoiFeature[]> {
  const key = `${x}/${y}`;
  const cached = _poiTileCache.get(key);
  if (cached) return cached;
  const template = await resolvePoiTileTemplate();
  if (!template) return [];
  const url = template.replace('{z}', String(POI_TILE_ZOOM)).replace('{x}', String(x)).replace('{y}', String(y));
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) { _poiTileCache.set(key, []); return []; }
    const buf = new Uint8Array(await res.arrayBuffer());
    const tile = new VectorTile(new PbfReader(buf) as any);
    const layer = tile.layers.poi;
    const out: PoiFeature[] = [];
    if (layer) {
      for (let i = 0; i < layer.length; i++) {
        const f = layer.feature(i);
        const cls = String(f.properties.class ?? '');
        if (!POI_CLASSES[cls]) continue;                       // classe non retenue
        const name = String(f.properties['name:fr'] ?? f.properties.name ?? '');
        if (!name) continue;                                   // sans nom = inutile
        const gj = f.toGeoJSON(x, y, POI_TILE_ZOOM);
        if (gj.geometry.type !== 'Point') continue;
        const [lng, lat] = gj.geometry.coordinates as [number, number];
        out.push({ lat, lng, name, cls });
      }
    }
    _poiTileCache.set(key, out);
    return out;
  } catch { return []; }
}

function usePOILayer(mapRef: React.RefObject<L.Map | null>, enabled: boolean, showNames: boolean) {
  const poiRef = useRef<L.LayerGroup | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled) {
      if (poiRef.current) { map?.removeLayer(poiRef.current); poiRef.current = null; }
      return;
    }
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const render = async () => {
      const z = map.getZoom();
      if (z < POI_MIN_DISPLAY_ZOOM) {
        if (poiRef.current) { map.removeLayer(poiRef.current); poiRef.current = null; }
        return;
      }
      const b = map.getBounds();
      // Tuiles z14 couvrant la vue (bornées à 9 pour éviter tout excès)
      const x0 = lon2tile(b.getWest(), POI_TILE_ZOOM),  x1 = lon2tile(b.getEast(), POI_TILE_ZOOM);
      const y0 = lat2tile(b.getNorth(), POI_TILE_ZOOM), y1 = lat2tile(b.getSouth(), POI_TILE_ZOOM);
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 9) return;
      const myReq = ++reqIdRef.current;
      const tiles: Promise<PoiFeature[]>[] = [];
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tiles.push(loadPoiTile(x, y));
      const all = (await Promise.all(tiles)).flat();
      if (myReq !== reqIdRef.current || !mapRef.current) return;   // vue changée entre-temps

      const layer = L.layerGroup();
      const seen = new Set<string>();
      let count = 0;
      for (const p of all) {
        const cfg = POI_CLASSES[p.cls];
        if (!cfg || z < cfg.minZoom) continue;         // apparition progressive
        if (!b.pad(0.1).contains([p.lat, p.lng])) continue;
        const dedup = `${p.name}|${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`;
        if (seen.has(dedup)) continue;
        seen.add(dedup);
        if (++count > 400) break;                      // garde-fou densité
        const icon = L.divIcon({ className: 'poi-marker', html: poiSvg(cfg.glyph, cfg.color), iconSize: [22, 22], iconAnchor: [11, 11] });
        const m = L.marker([p.lat, p.lng], { icon, zIndexOffset: 300 });
        // Nom : permanent si l'option est cochée ET zoom rapproché, sinon au survol
        m.bindTooltip(p.name, { direction: 'top', offset: [0, -12], className: 'eec-map-label poi-label', permanent: showNames && z >= 15 });
        layer.addLayer(m);
      }
      if (poiRef.current) map.removeLayer(poiRef.current);
      layer.addTo(map);
      poiRef.current = layer;
    };

    const onMoveEnd = () => { if (debounce) clearTimeout(debounce); debounce = setTimeout(render, 300); };
    map.on('moveend', onMoveEnd);
    render();   // rendu immédiat (ex : au cochage de l'option)
    return () => {
      if (debounce) clearTimeout(debounce);
      map.off('moveend', onMoveEnd);
      if (poiRef.current) { map.removeLayer(poiRef.current); poiRef.current = null; }
    };
  }, [mapRef, enabled, showNames]);
}

/* ============================================================
   Rail tabs per mode
   ============================================================ */
const ALL_RAIL_TABS = [
  { id: 'search',    label: 'Recherche',    icon: 'search' },
  { id: 'filters',   label: 'Filtres',      icon: 'filterFunnel' },
  { id: 'parcours',  label: 'Parcours',     icon: 'trail' },
  { id: 'stats',     label: 'Statistiques', icon: 'stat' },
  { id: 'regions',   label: 'Régions',      icon: 'region' },
  { id: 'districts', label: 'Districts',    icon: 'network' },
  { id: 'paroisses', label: 'Paroisses',    icon: 'church' },
  { id: 'oeuvres',   label: 'Œuvres',       icon: 'buildings' },
  { id: 'ouvriers',  label: 'Ouvriers',     icon: 'users' },
  { id: 'favoris',   label: 'Favoris',      icon: 'starFilled' },
  { id: 'history',   label: 'Historique',   icon: 'history' },
  { id: 'settings',  label: 'Paramètres',   icon: 'settings' },
];
// Onglets réservés au visiteur connecté. En mode 'public' ils restent cliquables
// mais ouvrent l'invite de connexion (même système que le favori).
// EXIGENCE : les statistiques sont réservées aux utilisateurs ayant un compte —
// un visiteur non connecté ne doit plus y avoir accès.
const LOCKED_FOR_PUBLIC = new Set(['stats', 'favoris', 'parcours', 'history', 'settings']);

/* ============================================================
   useLeafletMap hook
   ============================================================ */
function useLeafletMap(
  mapId: string,
  regions: RegionItem[],
  allParishes: ParishItem[],
  allDistricts: DistrictItem[],
  filteredItems: AnyItem[],
  basemap: 'light' | 'sat',
  selectedId: string | undefined,
  onMarkerClick: (item: AnyItem) => void,
  focusTarget: { lat: number; lng: number; zoom?: number; atLeast?: boolean } | null,
  route: RouteData,
  routeStart: RoutePoint | null,
  routeEnd: RoutePoint | null,
  userPos: { lat: number; lng: number } | null,
  mapSettings: { regions: boolean; cluster: boolean; labels: boolean; poi: boolean },
  measuring: boolean,
  measurePoints: [number, number][],
  onMeasureClick: (lat: number, lng: number) => void,
) {
  const mapRef         = useRef<L.Map | null>(null);
  const tileRef        = useRef<L.TileLayer | null>(null);
  const labelsRef      = useRef<L.TileLayer | null>(null);
  const clusterRef     = useRef<L.MarkerClusterGroup | null>(null);
  const plainLayerRef  = useRef<L.LayerGroup | null>(null);
  const rippleRef      = useRef<L.CircleMarker | null>(null);
  const regionLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef  = useRef<L.LayerGroup | null>(null);
  const userPosRef     = useRef<L.LayerGroup | null>(null);
  const measureRef     = useRef<L.LayerGroup | null>(null);
  // Renderer SVG dédié aux polygones de régions : le renderer Canvas (preferCanvas)
  // clignote au zoom avec leaflet-rotate ; le SVG reste stable.
  const svgRendererRef = useRef<L.Renderer | null>(null);

  // Map initialisation (runs once)
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(mapId, {
      center: CAMEROON_CENTER, zoom: 6, minZoom: 5, maxZoom: 19,
      zoomControl: false, attributionControl: true, preferCanvas: true,
      // Rotation (leaflet-rotate) : gestes tactiles + boutons dédiés
      rotate: true, rotateControl: false, touchRotate: true, bearing: 0,
    } as L.MapOptions);
    L.control.zoom({ position: 'topleft' }).addTo(map);
    mapRef.current = map;
    svgRendererRef.current = L.svg({ padding: 0.5 }).addTo(map);
    map.setMaxBounds([[-1, 5], [15, 20]]);

    // ResizeObserver : recalcule la taille Leaflet à CHAQUE changement de dimension
    // du conteneur (plein écran, ouverture/fermeture de panneau, redim. fenêtre).
    // C'est la parade définitive au bug « carte blanche » après resize.
    if (typeof ResizeObserver !== 'undefined') {
      let rafId = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          map.invalidateSize({ animate: false } as L.ZoomPanOptions);
          // Fix leaflet-rotate : à la création, le conteneur a parfois une
          // taille encore nulle → son calcul interne de bearing devient NaN
          // et reste bloqué ainsi (flyToBounds plante alors avec "Invalid
          // LatLng (NaN, NaN)"). Dès que le conteneur a une vraie taille,
          // on recale le bearing à 0 pour purger ce NaN.
          const anyMap = map as any;
          if (typeof anyMap.getBearing === 'function' && Number.isNaN(anyMap.getBearing())) {
            anyMap.setBearing(0);
          }
        });
      });
      ro.observe(map.getContainer());
    }

    // Apparition PROGRESSIVE des noms selon le zoom (comme Google Maps) :
    // dézoomé = icônes seules (carte claire) ; en zoomant, les noms apparaissent.
    // Évite la carte confuse quand le regroupement est désactivé.
    const LABEL_MIN_ZOOM = 13;
    const applyLabelVisibility = () => {
      const c = map.getContainer();
      if (map.getZoom() < LABEL_MIN_ZOOM) c.classList.add('labels-hidden');
      else c.classList.remove('labels-hidden');
    };
    map.on('zoomend', applyLabelVisibility);
    applyLabelVisibility();

    // Placeholder for region circles (filled when data loads)
    const rl = L.layerGroup().addTo(map);
    regionLayerRef.current = rl;

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50, showCoverageOnHover: false, spiderfyOnMaxZoom: true,
      iconCreateFunction: (c: any) => {
        const n = c.getChildCount();
        return L.divIcon({ html: `<div>${n}</div>`, className: 'marker-cluster' + (n >= 30 ? ' marker-cluster-large' : ''), iconSize: [40, 40] });
      },
    });
    cluster.addTo(map);
    clusterRef.current = cluster;

    // Couche plate (utilisée quand le regroupement/cluster est désactivé)
    plainLayerRef.current = L.layerGroup().addTo(map);
  }, [mapId]);

  // Region circles — re-runs when real data arrives ou quand on (dé)active l'option
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (regionLayerRef.current) { map.removeLayer(regionLayerRef.current); regionLayerRef.current = null; }
    if (!regions.length || !mapSettings.regions) return;
    const rl = L.layerGroup();

    regions.forEach((r, idx) => {
      const color = REG_COLORS[idx % REG_COLORS.length];
      const pc = allParishes.filter(p => p.regionId === r.id).length;
      const dc = allDistricts.filter(d => d.regionId === r.id).length;
      // Popup compact
      const popup = `<div class="region-popup-compact"><div class="rpc-dot" style="background:${color}"></div><div class="rpc-name">${r.city}</div><div class="rpc-stats">${dc} districts · ${pc} paroisses</div></div>`;

      // Pendant l'outil de mesure, les polygones ne captent pas les clics
      // (pour ne pas gêner le placement des points de mesure).
      const clickable = !measuring;
      if (r.geometry) {
        const poly = L.geoJSON({ type: 'Feature', geometry: r.geometry, properties: {} } as any, {
          style: { color, weight: 1.8, opacity: 0.85, fillColor: color, fillOpacity: 0.07, dashArray: '4 3' },
          interactive: clickable, renderer: svgRendererRef.current ?? undefined,
        } as any);
        if (clickable) {
          poly.bindPopup(popup, { closeButton: false, maxWidth: 180 });
          poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.18, weight: 2.4 }));
          poly.on('mouseout',  () => poly.setStyle({ fillOpacity: 0.07, weight: 1.8 }));
          poly.on('click', () => {
            try { map.flyToBounds(poly.getBounds().pad(0.08), { duration: 0.7, maxZoom: 10 } as L.FitBoundsOptions); } catch {}
          });
        }
        rl.addLayer(poly);
      } else {
        const circle = L.circle([r.lat, r.lng], {
          radius: r.radius * 110000, color, weight: 1.6, opacity: 0.7,
          fillColor: color, fillOpacity: 0.06, interactive: clickable,
          renderer: svgRendererRef.current ?? undefined,
        } as any);
        if (clickable) {
          circle.bindPopup(popup, { closeButton: false, maxWidth: 180 });
          circle.on('mouseover', () => circle.setStyle({ fillOpacity: 0.16, weight: 2 }));
          circle.on('mouseout',  () => circle.setStyle({ fillOpacity: 0.06, weight: 1.6 }));
          circle.on('click', () => map.flyToBounds(circle.getBounds().pad(0.2), { duration: 0.6 } as L.FitBoundsOptions));
        }
        rl.addLayer(circle);
      }
    });
    rl.addTo(map);
    regionLayerRef.current = rl;
  }, [regions, allParishes, allDistricts, mapSettings.regions, measuring]);

  // Basemap + labels overlay for satellite
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (tileRef.current)   { map.removeLayer(tileRef.current);   tileRef.current = null; }
    if (labelsRef.current) { map.removeLayer(labelsRef.current); labelsRef.current = null; }
    const bm = BASEMAPS[basemap];
    // Éviter "Map data not yet available" : le satellite Esri n'a pas d'imagerie
    // haute résolution en zone rurale camerounaise (> z17). On plafonne le zoom
    // NATIF et Leaflet agrandit la dernière tuile valide au lieu d'en demander
    // une inexistante. CARTO Voyager a une couverture mondiale jusqu'à z18.
    const nativeMax = basemap === 'sat' ? 17 : 18;
    tileRef.current = L.tileLayer(bm.url, {
      attribution: bm.attr, maxZoom: 19, maxNativeZoom: nativeMax, errorTileUrl: BLANK_TILE,
    }).addTo(map);
    tileRef.current.bringToBack();
    if (basemap === 'sat') {
      labelsRef.current = L.tileLayer(SAT_LABELS_URL, {
        attribution: '', maxZoom: 19, maxNativeZoom: 17, opacity: 0.85, errorTileUrl: BLANK_TILE,
      }).addTo(map);
    }
  }, [basemap]);

  // Markers — cluster ON/OFF + étiquettes de noms (style Google Maps).
  // PERFORMANCE : cet effet ne dépend NI de selectedId NI du callback de clic
  // (passé via ref) → les ~550 marqueurs ne sont construits qu'au changement
  // de filtre, pas à chaque clic. La sélection est gérée par l'effet suivant
  // qui ne retouche que les 2 marqueurs concernés.
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const markersByIdRef = useRef(new Map<string, { m: L.Marker; type: string; color: string }>());
  const prevSelectedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const cluster = clusterRef.current;
    const plain   = plainLayerRef.current;
    if (!cluster || !plain) return;
    cluster.clearLayers();
    plain.clearLayers();
    markersByIdRef.current.clear();
    prevSelectedRef.current = undefined;
    const target = mapSettings.cluster ? cluster : plain;
    filteredItems.forEach(it => {
      const item = it as any;
      const type = item.type ?? 'paroisse';
      const t = ENTITY_TYPES.find(x => x.id === type);
      const color = t?.color ?? '#2E9744';
      const m = L.marker([it.lat, it.lng], { icon: makeIcon(type, color, false), title: it.name });
      // Noms des paroisses/œuvres : toujours liés (information principale) ;
      // le CSS labels-hidden les masque sous le zoom 13 pour rester lisible.
      m.bindTooltip(it.name, {
        direction: 'top', offset: [0, -34], className: 'eec-map-label',
        opacity: 1, permanent: true,
      });
      m.on('click', () => onMarkerClickRef.current(it));
      markersByIdRef.current.set(String(it.id), { m, type, color });
      target.addLayer(m);
    });
    // Réappliquer la surbrillance de l'élément sélectionné après reconstruction
    const sel = selectedIdRef.current;
    if (sel) {
      const e = markersByIdRef.current.get(String(sel));
      if (e) { e.m.setIcon(makeIcon(e.type, e.color, true)); prevSelectedRef.current = String(sel); }
    }
  }, [filteredItems, mapSettings.cluster]);

  // Sélection : mise à jour CIBLÉE des icônes (ancien + nouveau marqueur)
  useEffect(() => {
    const prev = prevSelectedRef.current;
    if (prev && prev !== selectedId) {
      const e = markersByIdRef.current.get(prev);
      if (e) e.m.setIcon(makeIcon(e.type, e.color, false));
    }
    if (selectedId) {
      const e = markersByIdRef.current.get(String(selectedId));
      if (e) e.m.setIcon(makeIcon(e.type, e.color, true));
    }
    prevSelectedRef.current = selectedId ? String(selectedId) : undefined;
  }, [selectedId]);

  // Marqueur "Ma position" — point bleu + onde animée (style Google Maps)
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (userPosRef.current) { map.removeLayer(userPosRef.current); userPosRef.current = null; }
    if (!userPos) return;
    const icon = L.divIcon({
      className: 'eec-userpos',
      html: '<span class="up-pulse"></span><span class="up-dot"></span>',
      iconSize: [22, 22], iconAnchor: [11, 11],
    });
    const grp = L.layerGroup([L.marker([userPos.lat, userPos.lng], { icon, zIndexOffset: 2000 })]);
    grp.addTo(map);
    userPosRef.current = grp;
  }, [userPos]);

  // Focus / ripple
  useEffect(() => {
    const map = mapRef.current; if (!map || !focusTarget) return;
    const { lat, lng, zoom = 12, atLeast = false } = focusTarget;
    // « atLeast » : ne jamais DÉZOOMER en cliquant un élément — on garde le zoom
    // courant s'il est déjà plus rapproché (comportement Google Maps).
    const target = atLeast ? Math.max(map.getZoom(), zoom) : zoom;
    // Si la carte est masquée (vue liste → conteneur display:none, taille 0),
    // flyTo divise par zéro et plante. On se contente d'un setView sans animation ;
    // le focus animé se fera au retour sur la vue carte.
    const sz = map.getSize();
    try {
      if (sz.x > 0 && sz.y > 0) map.flyTo([lat, lng], target, { duration: 0.6 } as L.ZoomPanOptions);
      else map.setView([lat, lng], target, { animate: false } as L.ZoomPanOptions);
    } catch { /* carte non prête — ignore */ }
    if (sz.x === 0 || sz.y === 0) return; // pas de ripple sur carte cachée
    if (rippleRef.current) map.removeLayer(rippleRef.current);
    const ring = L.circleMarker([lat, lng], { radius: 4, color: '#FFD600', weight: 3, fillOpacity: 0, opacity: 0.9 }).addTo(map);
    rippleRef.current = ring;
    let r = 4, op = 0.9;
    const iv = setInterval(() => {
      r += 1.8; op -= 0.04;
      if (op <= 0) { clearInterval(iv); map.removeLayer(ring); return; }
      ring.setRadius(r); ring.setStyle({ opacity: op });
    }, 30);
    return () => clearInterval(iv);
  }, [focusTarget]);

  // Route tracé (style Google Maps : casing sombre + ligne colorée animée + marqueurs A/B)
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (!route || !route.geometry.length) return;

    const layer = L.layerGroup();
    const latlngs = route.geometry as L.LatLngExpression[];
    const color = route.mode === 'pedestrian' ? '#1F7331'
                : route.mode === 'bicycle'    ? '#0277BD'
                : '#1A73E8'; // voiture — bleu Google

    // 1. Casing (contour sombre, donne la profondeur)
    L.polyline(latlngs, { color: '#0D2818', weight: 9, opacity: 0.35, lineJoin: 'round', lineCap: 'round' }).addTo(layer);
    // 2. Ligne principale colorée
    L.polyline(latlngs, { color, weight: 5.5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(layer);
    // 3. Flux animé par-dessus (pointillés qui défilent)
    L.polyline(latlngs, { color: '#FFFFFF', weight: 2.5, opacity: 0.85, lineJoin: 'round', lineCap: 'round', className: 'eec-route-flow', dashArray: '1 14' }).addTo(layer);

    // Marqueurs Départ (A) et Arrivée (B)
    const pin = (txt: string, bg: string) => L.divIcon({
      className: 'eec-route-pin',
      html: `<div class="rp-dot" style="background:${bg}">${txt}</div>`,
      iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
    });
    // Si départ = Ma position, le marqueur bleu animé suffit (pas de doublon pin A)
    if (routeStart && routeStart.kind !== 'me') L.marker([routeStart.lat, routeStart.lng], { icon: pin('A', '#2E9744'), zIndexOffset: 1000 })
      .bindTooltip(routeStart.label, { direction: 'top', offset: [0, -30], className: 'eec-map-label', permanent: false }).addTo(layer);
    if (routeEnd) L.marker([routeEnd.lat, routeEnd.lng], { icon: pin('B', '#D32F2F'), zIndexOffset: 1000 })
      .bindTooltip(routeEnd.label, { direction: 'top', offset: [0, -30], className: 'eec-map-label', permanent: false }).addTo(layer);

    layer.addTo(map);
    routeLayerRef.current = layer;

    // Cadrer la carte sur tout le tracé — de façon robuste (évite le crash si le
    // conteneur a une taille nulle ou des bornes dégénérées).
    const bounds = L.latLngBounds(latlngs as L.LatLngTuple[]);
    const sz = map.getSize();
    if (bounds.isValid() && sz.x > 0 && sz.y > 0) {
      try {
        map.flyToBounds(bounds.pad(0.18), { duration: 0.7, maxZoom: 15 } as L.FitBoundsOptions);
      } catch {
        try { map.fitBounds(bounds.pad(0.18), { maxZoom: 15 } as L.FitBoundsOptions); } catch { /* ignore */ }
      }
    }
  }, [route, routeStart, routeEnd]);

  // ── Outil de mesure : capter les clics quand l'outil est actif ──
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (!measuring) return;
    const handler = (e: L.LeafletMouseEvent) => onMeasureClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    map.getContainer().style.cursor = 'crosshair';
    return () => { map.off('click', handler); map.getContainer().style.cursor = ''; };
  }, [measuring, onMeasureClick]);

  // ── Outil de mesure : dessiner le tracé + distances cumulées ──
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (measureRef.current) { map.removeLayer(measureRef.current); measureRef.current = null; }
    if (!measurePoints.length) return;
    const grp = L.layerGroup();
    const pts = measurePoints.map(p => L.latLng(p[0], p[1]));
    L.polyline(pts, { color: '#FF6D00', weight: 3, dashArray: '6 6', opacity: 0.95 }).addTo(grp);
    let cumul = 0;
    pts.forEach((pt, i) => {
      if (i > 0) cumul += pts[i - 1].distanceTo(pt);
      const dot = L.circleMarker(pt, { radius: 5, color: '#fff', weight: 2, fillColor: '#FF6D00', fillOpacity: 1 });
      if (i > 0) {
        const txt = cumul >= 1000 ? `${(cumul / 1000).toFixed(2)} km` : `${Math.round(cumul)} m`;
        dot.bindTooltip(txt, { permanent: true, direction: 'top', offset: [0, -6], className: 'eec-measure-label' });
      }
      dot.addTo(grp);
    });
    grp.addTo(map);
    measureRef.current = grp;
  }, [measurePoints]);

  // La navigation réelle est prise en charge par la vue 3D (MapLibre) montée en
  // surcouche pendant la navigation — voir NavMap3D. Rien à faire côté Leaflet ici.

  return { mapRef };
}

/* ============================================================
   AUTH-AWARE NAVBAR
   ============================================================ */
const MapNavbar = ({ view, setView, stats, theme, setTheme, user, mode, onLogout }: {
  view: 'map' | 'list'; setView: (v: 'map' | 'list') => void;
  stats: MapDataResult['globalStats']; theme: string; setTheme: (t: string) => void;
  user: MapUser | null; mode: MapMode; onLogout: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);
  const NAV_STATS = [
    { id: 'regions',   icon: 'compass',   value: stats.regions,   label: 'Régions Synodales', bg: '#FFF6C8',               fg: '#E8B600', prefix: ''  },
    { id: 'districts', icon: 'network',   value: stats.districts, label: 'Districts',          bg: 'rgba(46,151,68,0.12)',  fg: '#1F7331', prefix: ''  },
    { id: 'parishes',  icon: 'cross',     value: stats.parishes,  label: 'Paroisses',          bg: 'rgba(46,151,68,0.16)',  fg: '#1F7331', prefix: '+' },
    { id: 'oeuvres',   icon: 'buildings', value: stats.oeuvres,   label: 'Œuvres',             bg: 'rgba(103,58,183,0.12)', fg: '#673AB7', prefix: '+' },
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
            <b>{s.prefix}{fmt(s.value)}</b>
            <span className="ns-label">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="nav-actions">
        <div className="view-toggle" style={{ display:'inline-flex', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'999px', padding:'3px' }}>
          <button onClick={() => setView('map')} style={{ border:0, background: view==='map' ? 'var(--eec-green)' : 'transparent', color: view==='map' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' } as React.CSSProperties}>
            <Icon name="map" size={13} stroke={1.9} /> Carte
          </button>
          <button onClick={() => setView('list')} style={{ border:0, background: view==='list' ? 'var(--eec-green)' : 'transparent', color: view==='list' ? '#fff' : 'var(--t-2)', padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:'999px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' } as React.CSSProperties}>
            <Icon name="list" size={13} stroke={1.9} /> Liste
          </button>
        </div>
        <div className="theme-toggle">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="Mode clair"><Icon name="sun" size={14} stroke={1.9} /></button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="Mode sombre"><Icon name="moon" size={14} stroke={1.9} /></button>
        </div>

        {user ? (
          <div className="account-menu" ref={menuRef}>
            <button className="admin-pill" title={user.email} onClick={() => setMenuOpen(o => !o)}>
              <span className="ap-avatar" style={{ background: 'var(--eec-green)' }}>
                {user.first_name.charAt(0).toUpperCase()}
              </span>
              <span className="ap-label">{user.first_name} {user.last_name}</span>
              <Icon name="chevronD" size={13} stroke={2} />
            </button>
            {menuOpen && (
              <div className="account-dropdown">
                <div className="ad-head">
                  <span className="ad-avatar">{user.first_name.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ad-name">{user.first_name} {user.last_name}</div>
                    <div className="ad-mail">{user.email}</div>
                    <div className="ad-role">{user.role === 'VISITEUR' ? 'Compte visiteur' : user.role}</div>
                  </div>
                </div>
                <button className="ad-item danger" onClick={onLogout}>
                  <Icon name="logout" size={15} stroke={1.9} /> Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/register" style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 999, background: 'var(--eec-green)', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              S&apos;inscrire
            </Link>
            <Link href="/login" style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 999, border: '1px solid var(--border)', color: 'var(--t-1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="logout" size={13} stroke={2} /> Connexion
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

/* ============================================================
   MODE-AWARE RAIL
   ============================================================ */
const MapRail = ({ active, setActive, badges, mode, onLockedClick }: {
  active: string | null; setActive: (id: string | null) => void;
  badges: Record<string, number | null>;
  mode: MapMode; onLockedClick: () => void;
}) => (
  <nav className="rail">
    {ALL_RAIL_TABS.map(t => {
      const locked = mode === 'public' && LOCKED_FOR_PUBLIC.has(t.id);
      return (
        <button key={t.id}
          className={'rail-tab' + (active === t.id ? ' active' : '')}
          onClick={() => locked ? onLockedClick() : setActive(active === t.id ? null : t.id)}
          title={locked ? `${t.label} · Connexion requise` : t.label}
        >
          <Icon name={t.icon} size={20} stroke={1.7} />
          <span className="lbl">{t.label}</span>
          {locked
            ? <span className="rail-lock"><Icon name="lock" size={10} stroke={2} /></span>
            : (badges[t.id] != null && <span className="badge">{badges[t.id]}</span>)}
        </button>
      );
    })}
  </nav>
);

/* ============================================================
   LOGIN PROMPT
   ============================================================ */
const LoginPrompt = ({ onClose }: { onClose: () => void }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
  }} onClick={onClose}>
    <div style={{
      background: 'var(--surface-1)', borderRadius: 16, padding: '32px 36px', maxWidth: 380, width: '90%',
      border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
    }} onClick={e => e.stopPropagation()}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--eec-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name="lock" size={22} color="var(--eec-green)" stroke={1.8} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-1)', margin: '0 0 8px' }}>Fonctionnalité réservée</h3>
      <p style={{ fontSize: 13.5, color: 'var(--t-2)', lineHeight: 1.6, margin: '0 0 24px' }}>
        Créez un compte gratuit pour accéder aux itinéraires pastoraux, à l&apos;historique de navigation et à l&apos;annuaire complet des ouvriers.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/register" style={{ flex: 1, padding: '11px 16px', borderRadius: 8, background: 'var(--eec-green)', color: '#fff', fontWeight: 600, fontSize: 14, textAlign: 'center', textDecoration: 'none' }}>
          Créer un compte
        </Link>
        <Link href="/login" style={{ flex: 1, padding: '11px 16px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--t-1)', fontWeight: 600, fontSize: 14, textAlign: 'center', textDecoration: 'none' }}>
          Se connecter
        </Link>
      </div>
      <button onClick={onClose} style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', fontSize: 12, color: 'var(--t-3)', cursor: 'pointer' }}>
        Continuer en tant que visiteur
      </button>
    </div>
  </div>
);

/* ============================================================
   AUTH CTA BANNER
   ============================================================ */
const AuthCTABanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <div style={{
    position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
    zIndex: 1200, background: 'var(--eec-green)', borderRadius: 12,
    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 8px 32px rgba(46,151,68,0.35)', whiteSpace: 'nowrap',
  }}>
    <Icon name="star" size={16} color="#FFD600" fill="#FFD600" stroke={0} />
    <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
      Inscrivez-vous gratuitement pour accéder à toutes les fonctionnalités
    </span>
    <Link href="/register" style={{ padding: '6px 16px', borderRadius: 999, background: '#fff', color: 'var(--eec-green)', fontWeight: 700, fontSize: 12.5, textDecoration: 'none', flexShrink: 0 }}>
      S&apos;inscrire →
    </Link>
    <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
      <Icon name="close" size={13} stroke={2} />
    </button>
  </div>
);

/* ============================================================
   SEARCH PANEL
   ============================================================ */
const SearchPanel = ({ onPick, onClose, recents }: {
  onPick: (kind: string, item: any) => void; onClose: () => void; recents: AnyItem[];
}) => {
  const { regions, districts, parishes, oeuvres } = useMapData();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!dq.trim()) return null;
    const n = dq.toLowerCase();
    return {
      par: parishes.filter(p => p.name.toLowerCase().includes(n)).slice(0, 6),
      oeu: oeuvres.filter(o => o.name.toLowerCase().includes(n)).slice(0, 5),
      dis: districts.filter(d => d.name.toLowerCase().includes(n)).slice(0, 4),
      reg: regions.filter(r => r.name.toLowerCase().includes(n) || r.city.toLowerCase().includes(n)).slice(0, 4),
    };
  }, [dq, parishes, oeuvres, districts, regions]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <>
      <div className="panel-head">
        <h2>Recherche rapide</h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        <div className="panel-section" style={{ paddingTop: 14 }}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input ref={inputRef} value={q} placeholder="Tapez pour rechercher…" onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {!dq.trim() && (
          <div className="panel-section">
            <h3 className="section-label">Suggestions <span className="num">{regions.length} régions</span></h3>
            {regions.slice(0, 6).map(r => {
              const cnt = parishes.filter(p => p.regionId === r.id).length;
              return (
                <button key={r.id} className="list-row" onClick={() => onPick('region', r)} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)' }}><Icon name="region" size={15} stroke={1.9} /></span>
                  <span className="lr-body"><span className="lr-title">{r.city}</span><span className="lr-sub">{r.admin} · {cnt} paroisses</span></span>
                  <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                </button>
              );
            })}
          </div>
        )}

        {dq.trim() && results && (
          <>
            {results.par.length === 0 && results.oeu.length === 0 && results.dis.length === 0 && results.reg.length === 0 && (
              <div className="search-empty" style={{ paddingTop: 40 }}>
                <div className="em-glyph"><Icon name="search" size={24} stroke={1.6} /></div>
                Aucun résultat pour « <b>{dq}</b> ».
              </div>
            )}
            {results.reg.length > 0 && (
              <>
                <div className="panel-section" style={{ paddingBottom: 0 }}><h3 className="section-label">Régions <span className="num">{results.reg.length}</span></h3></div>
                {results.reg.map(r => (
                  <button key={r.id} className="list-row" onClick={() => onPick('region', r)}>
                    <span className="lr-ico" style={{ background: 'var(--eec-yellow-tint)', color: 'var(--eec-yellow-d)' }}><Icon name="region" size={15} stroke={1.9} /></span>
                    <span className="lr-body"><span className="lr-title">{r.city}</span><span className="lr-sub">{r.admin}</span></span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                ))}
              </>
            )}
            {results.dis.length > 0 && (
              <>
                <div className="panel-section" style={{ paddingBottom: 0 }}><h3 className="section-label">Districts <span className="num">{results.dis.length}</span></h3></div>
                {results.dis.map(d => (
                  <button key={d.id} className="list-row" onClick={() => onPick('district', d)}>
                    <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)' }}><Icon name="network" size={15} stroke={1.9} /></span>
                    <span className="lr-body"><span className="lr-title">{d.name}</span><span className="lr-sub">District · {regions.find(x => x.id === d.regionId)?.city}</span></span>
                    <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                  </button>
                ))}
              </>
            )}
            {results.par.length > 0 && (
              <>
                <div className="panel-section" style={{ paddingBottom: 0 }}><h3 className="section-label">Paroisses <span className="num">{results.par.length}</span></h3></div>
                {results.par.map(p => {
                  const r = regions.find(x => x.id === p.regionId);
                  return (
                    <button key={p.id} className="list-row" onClick={() => onPick('item', p)}>
                      <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)' }}><Icon name="church" size={15} stroke={1.9} /></span>
                      <span className="lr-body"><span className="lr-title">{p.name}</span><span className="lr-sub">{r?.city} · {p.stats.fideles} fidèles</span></span>
                      <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                    </button>
                  );
                })}
              </>
            )}
            {results.oeu.length > 0 && (
              <>
                <div className="panel-section" style={{ paddingBottom: 0 }}><h3 className="section-label">Œuvres <span className="num">{results.oeu.length}</span></h3></div>
                {results.oeu.map(o => {
                  const t = ENTITY_TYPES.find(x => x.id === o.type);
                  return (
                    <button key={o.id} className="list-row" onClick={() => onPick('item', o)}>
                      <span className="lr-ico" style={{ background: (t?.color ?? '#000') + '20', color: t?.color }}><Icon name={TYPE_ICON[o.type] ?? 'buildings'} size={15} stroke={1.9} /></span>
                      <span className="lr-body"><span className="lr-title">{o.name}</span><span className="lr-sub">{t?.singular}</span></span>
                      <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

/* ============================================================
   Custom Select
   ============================================================ */
interface SelectOption { value: string; label: string; }
const CustomSelect = ({ value, options, onChange, disabled = false, placeholder }: {
  value: string; options: SelectOption[]; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className={`csel${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}>
      <button className="csel-btn" onClick={() => !disabled && setOpen(o => !o)}>
        <span className={`csel-val${!selected ? ' placeholder' : ''}`}>{selected?.label ?? placeholder ?? '—'}</span>
        <span className="csel-chevron"><Icon name="chevronD" size={13} stroke={2} /></span>
      </button>
      {open && (
        <div className="csel-list">
          {options.map(opt => (
            <button key={opt.value} className={`csel-opt${opt.value === value ? ' sel' : ''}`} onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.value === value && <span className="csel-opt-check"><Icon name="check" size={12} stroke={2.5} color="var(--eec-green)" /></span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   FILTERS PANEL
   ============================================================ */
const FiltersPanel = ({ filters, setFilters, layerCounts, onClose, onReset, onApply }: {
  filters: FilterState; setFilters: (fn: (f: FilterState) => FilterState) => void;
  layerCounts: Record<string, number>; onClose: () => void; onReset: () => void; onApply: () => void;
}) => {
  const { regions, districts, parishes } = useMapData();
  const districtList = filters.region ? districts.filter(d => d.regionId === filters.region) : [];
  const parishList   = filters.district ? parishes.filter(p => p.districtId === filters.district) : [];
  const toggleLayer  = (id: string) => setFilters(f => ({ ...f, layers: { ...f.layers, [id]: !f.layers[id] } }));

  const regionOptions: SelectOption[]   = [{ value: '', label: `Toutes les régions (${regions.length})` }, ...regions.map(r => ({ value: r.id, label: r.city }))];
  const districtOptions: SelectOption[] = [{ value: '', label: filters.region ? `Tous les districts (${districtList.length})` : "— Choisir une région d'abord" }, ...districtList.map(d => ({ value: d.id, label: d.name }))];
  const parishOptions: SelectOption[]   = [{ value: '', label: filters.district ? `Toutes les paroisses (${parishList.length})` : '— Choisir un district d\'abord' }, ...parishList.map(p => ({ value: p.id, label: p.name }))];

  return (
    <>
      <div className="panel-head">
        <h2>Filtres &amp; Recherche</h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body" style={{ paddingBottom: 0 }}>
        <div className="panel-section">
          <div className="fsh"><span className="fsh-ico"><Icon name="near" size={13} color="var(--eec-green)" stroke={2} /></span><span className="fsh-lbl">Localisation</span></div>
          <div className="floc-row">
            <div className="floc-label"><Icon name="region" size={13} color="var(--eec-green)" stroke={2} />Région synodale</div>
            <CustomSelect value={filters.region ?? ''} options={regionOptions} onChange={v => setFilters(f => ({ ...f, region: v || null, district: null, parish: null }))} />
          </div>
          <div className="floc-row" style={{ opacity: filters.region ? 1 : 0.5 }}>
            <div className="floc-label"><Icon name="layers" size={13} color="var(--eec-green)" stroke={2} />District</div>
            <CustomSelect value={filters.district ?? ''} options={districtOptions} onChange={v => setFilters(f => ({ ...f, district: v || null, parish: null }))} disabled={!filters.region} />
          </div>
          <div className="floc-row" style={{ opacity: filters.district ? 1 : 0.5, marginBottom: 0 }}>
            <div className="floc-label"><Icon name="church" size={13} color="var(--eec-green)" stroke={2} />Paroisse</div>
            <CustomSelect value={filters.parish ?? ''} options={parishOptions} onChange={v => setFilters(f => ({ ...f, parish: v || null }))} disabled={!filters.district} />
          </div>
        </div>
        <div className="panel-section">
          <div className="fsh"><span className="fsh-ico"><Icon name="layers" size={13} color="var(--eec-green)" stroke={2} /></span><span className="fsh-lbl">Types d&apos;entités</span></div>
          <div className="types-grid-v2">
            {ENTITY_TYPES.map(t => (
              <div key={t.id} className={`type-card-v2${filters.layers[t.id] ? ' on' : ''}`} onClick={() => toggleLayer(t.id)}>
                <div className="tc2-top">
                  <span className="tc2-ico" style={{ background: t.color + '1A' }}><Icon name={TYPE_ICON[t.id]} size={16} color={t.color} stroke={1.9} /></span>
                  <span className="tc2-check">{filters.layers[t.id] && <Icon name="check" size={10} color="#fff" stroke={3} />}</span>
                </div>
                <div className="tc2-lbl">{t.singular}</div>
                <div className="tc2-count" style={{ color: t.color }}>{layerCounts[t.id]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-section" style={{ paddingBottom: 18 }}>
          <div className="fsh"><span className="fsh-ico"><Icon name="stat" size={13} color="var(--eec-green)" stroke={2} /></span><span className="fsh-lbl">Statistiques</span></div>
          <div className="slider-row-v2">
            <div className="slr2-head"><span className="slr2-lbl">Fidèles minimum</span><span className="slr2-val">{filters.minFideles === 0 ? 'Tous' : filters.minFideles + '+'}</span></div>
            <input type="range" min={0} max={3000} step={50} value={filters.minFideles} style={{ '--p': Math.min(100, (filters.minFideles / 3000) * 100) + '%' } as React.CSSProperties} onChange={e => setFilters(f => ({ ...f, minFideles: +e.target.value }))} />
            <div className="slr2-marks"><span>0</span><span>1 500</span><span>3 000+</span></div>
          </div>
        </div>
      </div>
      <div className="panel-actions">
        <button className="btn-apply" onClick={onApply}><Icon name="filterFunnel" size={14} stroke={2} /> Appliquer</button>
        <button className="btn-reset" onClick={onReset}><Icon name="refresh" size={12} stroke={2} /> Réinitialiser</button>
      </div>
    </>
  );
};

/* ============================================================
   STATS PANEL
   ============================================================ */
const StatsPanel = ({ filters, layerCounts, onClose, onFocusRegion }: {
  filters: FilterState; layerCounts: Record<string, number>; onClose: () => void;
  onFocusRegion: (r: RegionItem) => void;
}) => {
  const { regions, parishes } = useMapData();

  const totalFideles = useMemo(() => parishes.reduce((s, p) => s + p.stats.fideles, 0), [parishes]);
  const totalCommun  = useMemo(() => parishes.reduce((s, p) => s + p.stats.communiants, 0), [parishes]);

  const regionStats = useMemo(() => {
    const max = Math.max(1, ...regions.map(r => parishes.filter(p => p.regionId === r.id).length));
    return regions
      .map(r => { const count = parishes.filter(p => p.regionId === r.id).length; return { ...r, count, pct: (count / max) * 100 }; })
      .sort((a, b) => b.count - a.count);
  }, [regions, parishes]);

  return (
    <>
      <div className="panel-head"><h2>Statistiques</h2><button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button></div>
      <div className="panel-body">
        <div className="panel-section">
          <h3 className="section-label">Fidèles · Année {filters.year}</h3>
          <div className="stats-row">
            <div className="stat-card featured"><div className="sc-label">Total fidèles</div><div className="sc-value">{fmt(totalFideles)}</div></div>
            <div className="stat-card yellow"><div className="sc-label">Communiants</div><div className="sc-value">{fmt(totalCommun)}</div><div className="sc-delta">{totalFideles ? Math.round(totalCommun / totalFideles * 100) : 0} % du total</div></div>
          </div>
        </div>
        <div className="panel-section">
          <h3 className="section-label">Top régions par paroisses</h3>
          <div className="region-bar-list">
            {regionStats.slice(0, 12).map(r => (
              <div key={r.id} className="region-bar" onClick={() => onFocusRegion(r as RegionItem)}>
                <span className="rb-name">{r.city}</span><span className="rb-val">{r.count}</span>
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
const EntityListPanel = ({ title, items, kind, onPick, onClose, totalLabel }: {
  title: string; items: any[]; kind: string;
  onPick?: (kind: string, item: any) => void; onClose: () => void; totalLabel: string;
}) => {
  const { regions } = useMapData();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 180);
  const filtered = useMemo(() => dq.trim() ? items.filter(it => it.name.toLowerCase().includes(dq.toLowerCase())) : items, [items, dq]);

  return (
    <>
      <div className="panel-head">
        <h2>{title}<div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t-2)', marginTop: 2 }}>{totalLabel}</div></h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        <div className="panel-section" style={{ paddingTop: 14 }}>
          <div className="sp-search-input">
            <span className="left-ico"><Icon name="search" size={18} stroke={1.9} /></span>
            <input placeholder={`Filtrer ${title.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
        {filtered.slice(0, 80).map((it: any) => {
          const r = regions.find(x => x.id === it.regionId);
          if (kind === 'worker') {
            const initials = it.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button key={it.id} className="list-row">
                <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)', fontWeight: 700, fontSize: 13 }}>{initials}</span>
                <span className="lr-body"><span className="lr-title">{it.name}</span><span className="lr-sub">{it.gradeLabel} · {r?.city}</span></span>
                <span className="dp-worker w-status" style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderRadius: 999, background: it.status === 'occupe' ? 'var(--eec-green)' : 'var(--surface-3)', color: it.status === 'occupe' ? '#fff' : 'var(--t-2)' }}>
                  {it.status === 'occupe' ? 'Occupé' : 'Inoccupé'}
                </span>
              </button>
            );
          }
          const t = ENTITY_TYPES.find(x => x.id === it.type);
          return (
            <button key={it.id} className="list-row" onClick={() => onPick && onPick(kind === 'region' ? 'region' : kind === 'district' ? 'district' : 'item', it)}>
              <span className="lr-ico" style={{ background: (t?.color ?? '#000') + '15', color: t?.color }}>
                <Icon name={kind === 'region' ? 'region' : kind === 'district' ? 'network' : TYPE_ICON[it.type] || 'church'} size={15} stroke={1.9} />
              </span>
              <span className="lr-body">
                <span className="lr-title">{it.name}</span>
                <span className="lr-sub">{t?.singular || (kind === 'region' ? 'Région' : 'District')} · {r?.city || it.city || (it as any).admin}</span>
              </span>
              <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
          );
        })}
        {filtered.length > 80 && <div className="search-empty" style={{ padding: '16px 0' }}>+ {filtered.length - 80} autres résultats. Affinez la recherche.</div>}
      </div>
    </>
  );
};

/* ============================================================
   PARCOURS PANEL
   ============================================================ */
const TRAVEL_MODES: { id: TravelMode; label: string; icon: string }[] = [
  { id: 'auto',       label: 'Voiture', icon: 'car' },
  { id: 'bicycle',    label: 'Vélo',    icon: 'bike' },
  { id: 'pedestrian', label: 'À pied',  icon: 'walk' },
];

const fmtDuration = (min: number) => {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

// Champ de point (départ ou destination) avec recherche d'élément
const PointField = ({ kind, point, accent, letter, placeholder, picking, onPickMap, onMyPos, onSelect, onClear }: {
  kind: 'start' | 'end'; point: RoutePoint | null; accent: string; letter: string;
  placeholder: string; picking: boolean;
  onPickMap: () => void; onMyPos?: () => void;
  onSelect: (p: RoutePoint) => void; onClear: () => void;
}) => {
  const { parishes, oeuvres } = useMapData();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 160);
  const results = useMemo(() => {
    if (!dq.trim()) return [] as AnyItem[];
    const n = dq.toLowerCase();
    return [...parishes, ...oeuvres].filter(x => x.name.toLowerCase().includes(n)).slice(0, 7);
  }, [dq, parishes, oeuvres]);

  if (point) {
    const isMe = point.kind === 'me';
    return (
      <div className="rt-field filled">
        <span className="rt-dot" style={{ background: accent }}>{letter}</span>
        <div className="rt-field-body">
          <div className="rt-field-label">{point.label}</div>
          <div className="rt-field-sub">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</div>
        </div>
        <div className="rt-field-actions">
          {isMe && onMyPos && (
            <button className="rt-mini on" onClick={onMyPos} title="Retirer ma position">
              <Icon name="crosshair" size={14} stroke={2} />
            </button>
          )}
          <button className="rt-field-x" onClick={onClear} title="Effacer"><Icon name="close" size={13} stroke={2.2} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={'rt-field' + (picking ? ' picking' : '')}>
      <span className="rt-dot" style={{ background: accent }}>{letter}</span>
      <div className="rt-field-body" style={{ position: 'relative' }}>
        <input className="rt-input" value={q} placeholder={picking ? 'Cliquez un marqueur sur la carte…' : placeholder}
          onChange={e => setQ(e.target.value)} disabled={picking} />
        {results.length > 0 && (
          <div className="rt-results">
            {results.map(r => {
              const t = ENTITY_TYPES.find(x => x.id === (r as any).type);
              return (
                <button key={(r as any).id} className="rt-result" onClick={() => {
                  onSelect({ lat: r.lat, lng: r.lng, label: (r as any).name, kind: (r as any).type ?? 'paroisse' });
                  setQ('');
                }}>
                  <span className="rt-result-ico" style={{ color: t?.color ?? 'var(--eec-green)' }}>
                    <Icon name={TYPE_ICON[(r as any).type] ?? 'church'} size={13} stroke={1.9} />
                  </span>
                  <span className="rt-result-name">{(r as any).name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="rt-field-actions">
        {onMyPos && <button className="rt-mini" onClick={onMyPos} title="Ma position"><Icon name="crosshair" size={14} stroke={1.9} /></button>}
        <button className={'rt-mini' + (picking ? ' on' : '')} onClick={onPickMap} title="Choisir sur la carte"><Icon name="pin" size={14} stroke={1.9} /></button>
      </div>
    </div>
  );
};

const ParcoursPanel = ({
  onClose, routeStart, routeEnd, routeMode, route, routeLoading, routeError, pickTarget,
  setRouteMode, setRouteStart, setRouteEnd, setPickTarget, onUseMyPosition, onCompute, onClear, onSwap, onStartNav,
}: {
  onClose: () => void;
  routeStart: RoutePoint | null; routeEnd: RoutePoint | null; routeMode: TravelMode;
  route: RouteData; routeLoading: boolean; routeError: string; pickTarget: 'start' | 'end' | null;
  setRouteMode: (m: TravelMode) => void;
  setRouteStart: (p: RoutePoint | null) => void; setRouteEnd: (p: RoutePoint | null) => void;
  setPickTarget: (t: 'start' | 'end' | null) => void;
  onUseMyPosition: (t: 'start' | 'end') => void;
  onCompute: () => void; onClear: () => void; onSwap: () => void; onStartNav: () => void;
}) => {
  const canCompute = !!routeStart && !!routeEnd && !routeLoading;
  return (
    <>
      <div className="panel-head">
        <h2>Itinéraire<div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t-2)', marginTop: 2 }}>Calcul réel sur les routes</div></h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        {/* Sélecteur de mode */}
        <div className="panel-section" style={{ paddingBottom: 8 }}>
          <div className="rt-modes">
            {TRAVEL_MODES.map(m => (
              <button key={m.id} className={'rt-mode' + (routeMode === m.id ? ' on' : '')} onClick={() => setRouteMode(m.id)}>
                <Icon name={m.icon} size={18} stroke={1.8} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Planificateur départ → destination */}
        <div className="panel-section" style={{ paddingTop: 4 }}>
          <div className="rt-planner">
            <PointField kind="start" point={routeStart} accent="#2E9744" letter="A"
              placeholder="Point de départ (ou ma position)" picking={pickTarget === 'start'}
              onPickMap={() => setPickTarget(pickTarget === 'start' ? null : 'start')}
              onMyPos={() => onUseMyPosition('start')}
              onSelect={p => { setRouteStart(p); setPickTarget(null); }}
              onClear={() => setRouteStart(null)} />

            <button className="rt-swap" onClick={onSwap} title="Inverser"><Icon name="swap" size={15} stroke={2} /></button>

            <PointField kind="end" point={routeEnd} accent="#D32F2F" letter="B"
              placeholder="Destination (église, œuvre…)" picking={pickTarget === 'end'}
              onPickMap={() => setPickTarget(pickTarget === 'end' ? null : 'end')}
              onSelect={p => { setRouteEnd(p); setPickTarget(null); }}
              onClear={() => setRouteEnd(null)} />
          </div>

          {pickTarget && (
            <div className="rt-hint"><Icon name="pin" size={12} stroke={2} /> Cliquez un marqueur sur la carte pour définir {pickTarget === 'start' ? 'le départ' : 'la destination'}.</div>
          )}
          {routeError && <div className="rt-error"><Icon name="help" size={13} stroke={2} /> {routeError}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-apply" style={{ flex: 1 }} disabled={!canCompute} onClick={onCompute}>
              {routeLoading ? <span className="rt-spin" /> : <><Icon name="route" size={14} stroke={2} /> Calculer l&apos;itinéraire</>}
            </button>
            {(route || routeStart || routeEnd) && (
              <button className="btn-reset" onClick={onClear} title="Effacer"><Icon name="refresh" size={12} stroke={2} /></button>
            )}
          </div>
        </div>

        {/* Résultat */}
        {route && (
          <>
            <div className="panel-section" style={{ paddingTop: 4 }}>
              <div className="rt-summary">
                <div className="rt-sum-main">
                  <Icon name={TRAVEL_MODES.find(m => m.id === routeMode)?.icon ?? 'car'} size={22} stroke={1.8} />
                  <div>
                    <div className="rt-sum-time">{fmtDuration(route.duration_min)}</div>
                    <div className="rt-sum-dist">{route.distance_km.toLocaleString('fr')} km</div>
                  </div>
                </div>
                <div className="rt-sum-tag">{TRAVEL_MODES.find(m => m.id === routeMode)?.label}</div>
              </div>
              {routeStart?.kind === 'me' && (
                <button className="rt-start-nav" onClick={onStartNav}>
                  <Icon name="navStart" size={16} stroke={0} fill="#fff" /> Démarrer la navigation
                </button>
              )}
              {routeStart?.kind !== 'me' && (
                <div className="rt-nav-hint">
                  <Icon name="crosshair" size={13} stroke={2} /> Définissez <b>Ma position</b> comme départ pour démarrer la navigation GPS
                </div>
              )}
            </div>
            <div className="panel-section">
              <h3 className="section-label">Étapes <span className="num">{route.steps.length}</span></h3>
              <div className="rt-steps">
                {route.steps.map((s, i) => (
                  <div key={i} className="rt-step">
                    <span className="rt-step-idx">{i + 1}</span>
                    <div className="rt-step-body">
                      <div className="rt-step-instr">{s.instruction || '—'}</div>
                      {s.distance_km > 0 && <div className="rt-step-dist">{(s.distance_km * 1000).toLocaleString('fr', { maximumFractionDigits: 0 })} m</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!route && !routeStart && !routeEnd && (
          <div className="panel-section">
            <div className="rt-tips">
              <div className="rt-tip"><span className="rt-tip-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--eec-green)' }}><Icon name="crosshair" size={14} stroke={1.9} /></span>
                <div><b>Depuis ma position</b><span>Touchez la cible sur le départ, puis choisissez une destination.</span></div></div>
              <div className="rt-tip"><span className="rt-tip-ico" style={{ background: 'rgba(211,47,47,0.1)', color: '#D32F2F' }}><Icon name="pin" size={14} stroke={1.9} /></span>
                <div><b>Entre deux éléments</b><span>Choisissez une église/œuvre en A et une autre en B pour la distance.</span></div></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ============================================================
   HISTORY PANEL
   ============================================================ */
const HistoryPanel = ({ recents, onPick, onClose, onClear }: {
  recents: any[]; onPick: (item: any) => void; onClose: () => void; onClear: () => void;
}) => {
  const { regions } = useMapData();
  return (
    <>
      <div className="panel-head"><h2>Historique de navigation</h2><button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button></div>
      <div className="panel-body">
        {recents.length === 0 ? (
          <div className="search-empty" style={{ paddingTop: 60 }}>
            <div className="em-glyph"><Icon name="history" size={26} stroke={1.6} /></div>
            Aucun élément consulté pour le moment.
          </div>
        ) : (
          <>
            <div className="panel-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="section-label" style={{ margin: 0 }}>Récemment vus <span className="num">{recents.length}</span></h3>
              <button onClick={onClear} className="btn-reset" style={{ padding: '4px 8px', fontSize: 11 }}>Effacer</button>
            </div>
            {recents.map(it => {
              const t = ENTITY_TYPES.find(x => x.id === it.type);
              const r = regions.find(x => x.id === it.regionId);
              return (
                <button key={it.id + '-' + it._at} className="list-row" onClick={() => onPick(it)}>
                  <span className="lr-ico" style={{ background: (t?.color ?? '#000') + '15', color: t?.color }}><Icon name={TYPE_ICON[it.type]} size={15} stroke={1.9} /></span>
                  <span className="lr-body"><span className="lr-title">{it.name}</span><span className="lr-sub">{t?.singular} · {r?.city}</span></span>
                  <span className="lr-meta">{it._timeAgo}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};

/* ============================================================
   SETTINGS PANEL
   ============================================================ */
const SettingsPanel = ({ theme, setTheme, onClose, user, onLogout, mapSettings, setMapSettings }: {
  theme: string; setTheme: (t: string) => void; onClose: () => void;
  user: MapUser | null; onLogout: () => void;
  mapSettings: { regions: boolean; cluster: boolean; labels: boolean; poi: boolean };
  setMapSettings: (fn: (s: { regions: boolean; cluster: boolean; labels: boolean; poi: boolean }) => { regions: boolean; cluster: boolean; labels: boolean; poi: boolean }) => void;
}) => (
  <>
    <div className="panel-head"><h2>Paramètres</h2><button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button></div>
    <div className="panel-body">
      {user && (
        <div className="panel-section">
          <h3 className="section-label">Mon compte</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
            <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--eec-green)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {(user.first_name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-1)' }}>{user.first_name} {user.last_name}</div>
              <div style={{ fontSize: 12, color: 'var(--t-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              <div style={{ fontSize: 10.5, color: 'var(--eec-green)', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2, textTransform: 'uppercase' }}>
                {user.role === 'VISITEUR' ? 'Compte visiteur' : user.role}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{ marginTop: 10, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Icon name="logout" size={14} stroke={1.9} /> Se déconnecter
          </button>
        </div>
      )}
      <div className="panel-section">
        <h3 className="section-label">Apparence</h3>
        <div className="setting-row">
          <span className="lr-ico" style={{ background: 'var(--eec-yellow-tint)', color: 'var(--eec-yellow-d)', width: 32, height: 32 }}><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={15} stroke={1.9} /></span>
          <div className="sr-body"><div className="sr-name">Mode sombre</div><div className="sr-desc">Interface en vert profond.</div></div>
          <button className={'toggle-switch' + (theme === 'dark' ? ' on' : '')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </div>
      <div className="panel-section">
        <h3 className="section-label">Cartographie</h3>
        <div className="setting-row">
          <span className="lr-ico" style={{ background: 'var(--surface-3)', color: 'var(--t-2)', width: 32, height: 32 }}><Icon name="region" size={15} stroke={1.9} /></span>
          <div className="sr-body"><div className="sr-name">Découpage synodal</div><div className="sr-desc">Contours colorés des 22 régions synodales.</div></div>
          <button className={'toggle-switch' + (mapSettings.regions ? ' on' : '')} onClick={() => setMapSettings(s => ({ ...s, regions: !s.regions }))} />
        </div>
        <div className="setting-row">
          <span className="lr-ico" style={{ background: 'var(--surface-3)', color: 'var(--t-2)', width: 32, height: 32 }}><Icon name="users" size={15} stroke={1.9} /></span>
          <div className="sr-body"><div className="sr-name">Regroupement (cluster)</div><div className="sr-desc">Regroupe les marqueurs proches.</div></div>
          <button className={'toggle-switch' + (mapSettings.cluster ? ' on' : '')} onClick={() => setMapSettings(s => ({ ...s, cluster: !s.cluster }))} />
        </div>
        <div className="setting-row">
          <span className="lr-ico" style={{ background: 'var(--surface-3)', color: 'var(--t-2)', width: 32, height: 32 }}><Icon name="pin" size={15} stroke={1.9} /></span>
          <div className="sr-body"><div className="sr-name">Noms des points d&apos;intérêt</div><div className="sr-desc">Noms des POI en permanence (sinon au survol). Les paroisses et œuvres restent toujours visibles.</div></div>
          <button className={'toggle-switch' + (mapSettings.labels ? ' on' : '')} onClick={() => setMapSettings(s => ({ ...s, labels: !s.labels }))} />
        </div>
        <div className="sr-item">
          <span className="lr-ico" style={{ background: 'var(--surface-3)', color: '#E65100', width: 32, height: 32 }}><Icon name="pin" size={15} stroke={1.9} /></span>
          <div className="sr-body"><div className="sr-name">Points d&apos;intérêt (POI)</div><div className="sr-desc">Écoles, hôpitaux, pharmacies… (zoom ≥ 14).</div></div>
          <button className={'toggle-switch' + (mapSettings.poi ? ' on' : '')} onClick={() => setMapSettings(s => ({ ...s, poi: !s.poi }))} />
        </div>
      </div>
      <div className="panel-section">
        <h3 className="section-label">À propos</h3>
        <div style={{ fontSize: 12, color: 'var(--t-2)', lineHeight: 1.6 }}>
          Plateforme officielle de géolocalisation de l&apos;<b style={{ color: 'var(--t-1)' }}>Église Évangélique du Cameroun</b>.<br />
          Version 1.0 · {new Date().getFullYear()}<br />
          <span style={{ color: 'var(--t-3)' }}>informatique@eec-cameroun.org</span>
        </div>
      </div>
    </div>
  </>
);

/* ============================================================
   FAVORIS PANEL
   ============================================================ */
const FavorisPanel = ({ saved, onOpen, onRemove, onClose }: {
  saved: AnyItem[]; onOpen: (item: AnyItem) => void; onRemove: (item: AnyItem) => void; onClose: () => void;
}) => {
  const { regions } = useMapData();
  return (
    <>
      <div className="panel-head">
        <h2>Favoris<div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t-2)', marginTop: 2 }}>{saved.length} élément{saved.length > 1 ? 's' : ''} enregistré{saved.length > 1 ? 's' : ''}</div></h2>
        <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
      </div>
      <div className="panel-body">
        {saved.length === 0 ? (
          <div className="search-empty" style={{ paddingTop: 60 }}>
            <div className="em-glyph"><Icon name="star" size={26} stroke={1.6} /></div>
            Aucun favori pour le moment.<br />
            <span style={{ fontSize: 12, color: 'var(--t-3)' }}>Ouvrez une église ou une œuvre, puis touchez l&apos;étoile ⭐ pour l&apos;enregistrer.</span>
          </div>
        ) : (
          <div className="panel-section" style={{ paddingTop: 12 }}>
            {saved.map((it: any) => {
              const t = ENTITY_TYPES.find(x => x.id === it.type);
              const r = regions.find(x => x.id === it.regionId);
              return (
                <div key={it.id} className="list-row" style={{ cursor: 'default' }}>
                  <button onClick={() => onOpen(it)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
                    <span className="lr-ico" style={{ background: (t?.color ?? '#2E9744') + '18', color: t?.color ?? '#2E9744' }}>
                      <Icon name={TYPE_ICON[it.type] ?? 'church'} size={15} stroke={1.9} />
                    </span>
                    <span className="lr-body"><span className="lr-title">{it.name}</span><span className="lr-sub">{t?.singular ?? 'Élément'} · {r?.city ?? it.regionName ?? ''}</span></span>
                  </button>
                  <button className="fav-remove" onClick={() => onRemove(it)} title="Retirer des favoris">
                    <Icon name="starFilled" size={15} color="#1A1A1A" fill="#FFD600" stroke={0} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

/* ============================================================
   SHARE MODAL — partage de géolocalisation
   ============================================================ */
function buildShareLink(item: any): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    id: String(item.id), lat: String(item.lat), lng: String(item.lng),
    name: item.name ?? 'Localisation EEC',
  });
  return `${origin}/carte?${params.toString()}`;
}

/* ============================================================
   Légende flottante — bouton circulaire + panneau animé
   ============================================================ */
const LegendPanel = ({ regions, mapSettings, setMapSettings, onClose }: {
  regions: RegionItem[];
  mapSettings: { regions: boolean; cluster: boolean; labels: boolean; poi: boolean };
  setMapSettings: (fn: (s: any) => any) => void;
  onClose: () => void;
}) => {
  return (
    <div className="legend-panel" onClick={e => e.stopPropagation()}>
      <div className="legend-header">
        <span className="legend-title">Légende</span>
        <button className="legend-close" onClick={onClose}>×</button>
      </div>
      <div className="legend-scroll">
        {/* Toggle découpage */}
        <div className="legend-toggle-row">
          <span>Découpage synodal</span>
          <button className={'toggle-switch sm' + (mapSettings.regions ? ' on' : '')}
            onClick={() => setMapSettings((s: any) => ({ ...s, regions: !s.regions }))} />
        </div>

        {/* Clusters */}
        <div className="legend-section-title">Regroupements</div>
        <div className="legend-item"><span className="legend-sym cluster-region" />Région synodale (clic = zoom)</div>
        <div className="legend-item"><span className="legend-sym cluster-district" />District</div>
        <div className="legend-item"><span className="legend-sym cluster-parish" />Paroisse / Œuvre</div>

        {/* POI */}
        <div className="legend-section-title">Points d&apos;intérêt <span className="legend-note">(zoom ≥ 14)</span></div>
        {LEGEND_POI.map(p => (
          <div key={p.label} className="legend-item">
            <span className="poi-glyph-sm" dangerouslySetInnerHTML={{ __html:
              `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${p.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${POI_GLYPHS[p.glyph] || ''}</svg>` }} />
            {p.label}
          </div>
        ))}

        {/* Couleurs des régions synodales */}
        {mapSettings.regions && regions.length > 0 && (
          <>
            <div className="legend-section-title">Régions synodales</div>
            {regions.map((r, i) => (
              <div key={r.id} className="legend-item">
                <span className="legend-color" style={{ background: REG_COLORS[i % REG_COLORS.length] }} />
                {r.name}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const ShareModal = ({ item, onClose }: { item: AnyItem; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const it = item as any;
  const t = ENTITY_TYPES.find(x => x.id === it.type);
  const typeLabel = t?.singular ?? 'Localisation';
  const link = buildShareLink(it);
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${it.lat},${it.lng}`;
  const message = `📍 ${it.name} — ${typeLabel} de l'Église Évangélique du Cameroun`
    + (it.address ? `\nQuartier : ${it.address}` : '')
    + (it.regionName ? `\nRégion : ${it.regionName}` : '')
    + `\n\nVoir sur la carte EEC : ${link}`
    + `\nOuvrir dans Google Maps : ${gmaps}`;
  const enc = encodeURIComponent(message);

  const channels = [
    { id: 'wa',  label: 'WhatsApp',     color: '#25D366', href: `https://wa.me/?text=${enc}`, icon: 'wa' },
    { id: 'tg',  label: 'Telegram',     color: '#0088CC', href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(it.name)}`, icon: 'tg' },
    { id: 'gm',  label: 'Google Maps',  color: '#1A73E8', href: gmaps, icon: 'pin' },
    { id: 'sms', label: 'SMS',          color: '#16A34A', href: `sms:?body=${enc}`, icon: 'phone' },
    { id: 'mail',label: 'E-mail',       color: '#7C3AED', href: `mailto:?subject=${encodeURIComponent(it.name + ' — EEC')}&body=${enc}`, icon: 'bell' },
    { id: 'fb',  label: 'Facebook',     color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, icon: 'globe' },
  ];

  const copy = () => {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  const nativeShare = () => {
    if (navigator.share) navigator.share({ title: it.name, text: message, url: link }).catch(() => {});
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-head">
          <div>
            <div className="share-title">Partager la localisation</div>
            <div className="share-sub">{it.name}</div>
          </div>
          <button className="ib" onClick={onClose}><Icon name="close" size={16} stroke={2} /></button>
        </div>

        <div className="share-grid">
          {channels.map(c => (
            <a key={c.id} href={c.href} target="_blank" rel="noopener noreferrer" className="share-chan" onClick={() => { if (c.id !== 'gm') setTimeout(onClose, 100); }}>
              <span className="share-chan-ico" style={{ background: c.color }}><Icon name={c.icon} size={18} color="#fff" stroke={1.9} /></span>
              <span>{c.label}</span>
            </a>
          ))}
        </div>

        <div className="share-link">
          <input readOnly value={link} onFocus={e => e.currentTarget.select()} />
          <button onClick={copy} className={copied ? 'copied' : ''}>
            <Icon name={copied ? 'check' : 'copy'} size={13} stroke={2} /> {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button className="share-native" onClick={nativeShare}>
            <Icon name="share" size={14} stroke={1.9} /> Plus d&apos;options de partage
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   DETAIL PANEL
   ============================================================ */
const InfoLine = ({ ico, label, sub }: { ico: string; label: string; sub?: string }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--t-2)', flexShrink: 0 }}>
      <Icon name={ico} size={14} stroke={1.9} />
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, color: 'var(--t-1)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t-2)', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const DetailPanel = ({ item, onClose, saved, onToggleSave, onPick, mode, onLoginRequired, onRoute, onShare }: {
  item: AnyItem | null; onClose: () => void; saved: AnyItem[];
  onToggleSave: (item: AnyItem) => void; onPick: (item: AnyItem) => void;
  mode: MapMode; onLoginRequired: () => void; onRoute: (item: AnyItem) => void;
  onShare: (item: AnyItem) => void;
}) => {
  const { regions, districts, parishes, workers } = useMapData();
  const [tab, setTab] = useState('apercu');
  useEffect(() => { setTab('apercu'); }, [item?.id]);
  if (!item) return <div className="detail-panel" />;

  const isRegion   = 'admin' in item && 'city' in item && !('type' in item);
  const isDistrict = !isRegion && 'regionId' in item && !('type' in item);
  const isEntity   = 'type' in item;
  const isParish   = isEntity && (item as any).type === 'paroisse';
  const typeMeta   = isEntity ? ENTITY_TYPES.find(t => t.id === (item as any).type) : { singular: isRegion ? 'Région Synodale' : 'District', color: '#2E9744' };
  const region     = isRegion ? (item as RegionItem) : regions.find(r => r.id === (item as any).regionId);
  const district   = isDistrict ? (item as DistrictItem) : ((item as any).districtId ? districts.find(d => d.id === (item as any).districtId) : null);
  const parishWorkers = isParish ? workers.filter(w => w.parishId === item.id).slice(0, 6) : [];
  const regionDistricts  = isRegion ? districts.filter(d => d.regionId === item.id) : [];
  const regionParishes   = isRegion ? parishes.filter(p => p.regionId === item.id) : [];
  const districtParishes = isDistrict ? parishes.filter(p => p.districtId === item.id) : [];
  const isSaved = saved.some(s => s.id === item.id);

  const handleSave = () => { if (mode === 'public') onLoginRequired(); else onToggleSave(item); };

  return (
    <div className="detail-panel open">
      <div className="dp-hero">
        <div className="hero-fallback">
          <div className="dp-hero-grid" />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 75% 20%, ${typeMeta?.color ?? '#2E9744'}22, transparent 55%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -55%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: (typeMeta?.color ?? '#2E9744') + '1E', border: `2px solid ${typeMeta?.color ?? '#2E9744'}38`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={isRegion ? 'region' : isDistrict ? 'network' : TYPE_ICON[(item as any).type]} size={34} color={typeMeta?.color} stroke={1.6} />
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: typeMeta?.color, opacity: 0.88 }} />
        </div>
        <div className="dp-hero-badge"><Icon name={isRegion ? 'region' : isDistrict ? 'network' : TYPE_ICON[(item as any).type]} size={11} color={typeMeta?.color} stroke={2} />{typeMeta?.singular}</div>
        <div className="dp-hero-actions">
          <button onClick={handleSave} title={mode === 'public' ? 'Connexion requise' : (isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris')}>
            <Icon name={isSaved ? 'starFilled' : 'star'} size={16} color={isSaved ? '#FFC400' : 'currentColor'} fill={isSaved ? '#FFC400' : 'none'} stroke={isSaved ? 0 : 1.9} />
          </button>
          <button onClick={() => onShare(item)} title="Partager la localisation"><Icon name="share" size={14} stroke={1.9} /></button>
          <button onClick={onClose} title="Fermer"><Icon name="close" size={14} stroke={2} /></button>
        </div>
      </div>
      <div className="dp-head">
        <div className="dp-type" style={{ color: typeMeta?.color }}>{typeMeta?.singular} EEC</div>
        <div className="dp-title-row">
          <h3 className="dp-title">{isRegion ? (item as RegionItem).name : (item as any).name}</h3>
          <span className="dp-verified"><Icon name="check" size={11} color="#fff" stroke={3} /></span>
        </div>
        <div className="dp-meta-line">
          {isParish && (item as ParishItem).address && (
            <>{(item as ParishItem).categorie && (
              <><span style={{ background: 'var(--eec-green-soft)', color: 'var(--eec-green)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
                Cat. {(item as ParishItem).categorie}
              </span><span className="ml-sep">·</span></>
            )}<span>{(item as ParishItem).address}</span><span className="ml-sep">·</span></>
          )}
          <span>{isRegion ? (item as RegionItem).admin : isDistrict ? (item as DistrictItem).regionName : (item as any).districtName || district?.name}</span>
          <span className="ml-sep">·</span>
          <span>{isRegion ? 'Cameroun' : (item as any).regionName || region?.name}</span>
        </div>
      </div>
      <div className="dp-actions">
        <button className="dp-action-btn primary" onClick={() => onRoute(item)}><Icon name="directions" size={14} stroke={2.2} /> Itinéraire</button>
        <button className="dp-action-btn ghost" onClick={handleSave}>
          <Icon name={isSaved ? 'starFilled' : 'star'} size={14} color={isSaved ? '#FFC400' : 'currentColor'} fill={isSaved ? '#FFC400' : 'none'} stroke={isSaved ? 0 : 1.9} />
          {isSaved ? 'Enregistré' : 'Enregistrer'}
        </button>
        <button className="dp-action-btn ghost" onClick={() => onShare(item)}><Icon name="share" size={14} stroke={1.9} /> Partager</button>
      </div>
      <div className="dp-tabs">
        <button className={'dp-tab' + (tab === 'apercu' ? ' active' : '')} onClick={() => setTab('apercu')}>Aperçu</button>
        <button className={'dp-tab' + (tab === 'infos' ? ' active' : '')} onClick={() => setTab('infos')}>Informations</button>
        {isRegion && <button className={'dp-tab' + (tab === 'districts' ? ' active' : '')} onClick={() => setTab('districts')}>Districts</button>}
        {(isRegion || isDistrict) && <button className={'dp-tab' + (tab === 'parishes' ? ' active' : '')} onClick={() => setTab('parishes')}>Paroisses</button>}
        {isParish && <button className={'dp-tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>Statistiques</button>}
        {isParish && <button className={'dp-tab' + (tab === 'workers' ? ' active' : '')} onClick={() => setTab('workers')}>Ouvriers</button>}
      </div>
      {tab === 'apercu' && (
        <div className="dp-section">
          {isRegion && (
            <>
              <h4>Région synodale — {(item as RegionItem).name}</h4>
              <div className="big-stat-row">
                <div className="big-stat green"><div className="bs-value">{regionDistricts.length}</div><div className="bs-label">Districts</div></div>
                <div className="big-stat blue"><div className="bs-value">{regionParishes.length}</div><div className="bs-label">Paroisses GPS</div></div>
              </div>
            </>
          )}
          {isDistrict && (
            <>
              <h4>District — {(item as DistrictItem).name}</h4>
              <div className="big-stat-row">
                <div className="big-stat green"><div className="bs-value">{(item as DistrictItem).parishCount || districtParishes.length}</div><div className="bs-label">Paroisses</div></div>
                <div className="big-stat blue"><div className="bs-value">{(item as DistrictItem).regionName}</div><div className="bs-label">Région</div></div>
              </div>
            </>
          )}
          {isParish && (
            <>
              <h4>Quartier : {(item as ParishItem).address || '—'}</h4>
              <div style={{ fontSize: 12, color: 'var(--t-2)', marginBottom: 10 }}>
                District <b style={{ color: 'var(--t-1)' }}>{(item as ParishItem).districtName}</b> · Région <b style={{ color: 'var(--eec-green)' }}>{(item as ParishItem).regionName}</b>
              </div>
              {(item as ParishItem).stats.fideles > 0 ? (
                <div className="big-stat-row">
                  <div className="big-stat green"><div className="bs-value">{fmt((item as ParishItem).stats.communiants)}</div><div className="bs-label">Communiants</div></div>
                  <div className="big-stat orange"><div className="bs-value">{fmt((item as ParishItem).stats.nonCommuniants)}</div><div className="bs-label">Non-communiants</div></div>
                  <div className="big-stat blue"><div className="bs-value">{fmt((item as ParishItem).stats.fideles)}</div><div className="bs-label">Total fidèles</div></div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--t-3)', padding: '12px 0' }}>Aucune statistique enregistrée.</div>
              )}
              {(item as ParishItem).stats.annee > 0 && (
                <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 6 }}>Données {(item as ParishItem).stats.annee}</div>
              )}
            </>
          )}
          {!isRegion && !isDistrict && !isParish && (item as OeuvreItem).address && (
            <>
              <h4>Adresse : {(item as OeuvreItem).address}</h4>
              <div style={{ fontSize: 12, color: 'var(--t-2)' }}>
                Région <b style={{ color: 'var(--eec-green)' }}>{(item as OeuvreItem).regionName}</b>
                {(item as OeuvreItem).year > 0 && <> · Année {(item as OeuvreItem).year}</>}
                {(item as OeuvreItem).capacity > 0 && <> · Capacité : {fmt((item as OeuvreItem).capacity)}</>}
              </div>
            </>
          )}
        </div>
      )}
      {tab === 'infos' && (
        <div className="dp-section">
          <h4>Informations générales</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isParish && (item as ParishItem).address && (
              <InfoLine ico="near" label={(item as ParishItem).address} sub="Quartier / Localité" />
            )}
            {!isRegion && !isParish && !isDistrict && (item as OeuvreItem).address && (
              <InfoLine ico="near" label={(item as OeuvreItem).address} sub="Adresse" />
            )}
            <InfoLine
              ico="pin"
              label={isParish ? `District ${(item as ParishItem).districtName}` : isDistrict ? `Région ${(item as DistrictItem).regionName}` : (district ? district.name + ' · ' : '') + (region?.name ?? '')}
              sub={isParish ? `Région ${(item as ParishItem).regionName} · Cameroun` : isDistrict ? 'Cameroun' : (region?.admin ?? '') + ' · Cameroun'}
            />
            {isParish && (item as ParishItem).categorie && <InfoLine ico="church" label={`Catégorie ${(item as ParishItem).categorie}`} sub="Catégorie officielle (résolution R05/CSG)" />}
          </div>
          <div className="gps-box" style={{ marginTop: 14 }}>
            <div className="g-coords"><span className="g-tag">GPS</span>{item.lat.toFixed(5)}° N · {item.lng.toFixed(5)}° E</div>
            <div className="gps-actions">
              <button onClick={() => navigator.clipboard?.writeText(`${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}`)}><Icon name="copy" size={11} stroke={1.9} /> Copier</button>
              <button onClick={() => window.open(`https://maps.google.com/?q=${item.lat},${item.lng}`, '_blank')}><Icon name="extLink" size={11} stroke={1.9} /> Google Maps</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'districts' && isRegion && (
        <div className="dp-section">
          <h4>Districts ({regionDistricts.length})</h4>
          {regionDistricts.map(d => (
            <button key={d.id} className="list-row" onClick={() => onPick(d)}>
              <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)' }}><Icon name="network" size={15} stroke={1.9} /></span>
              <span className="lr-body"><span className="lr-title">{d.name}</span><span className="lr-sub">District synodal</span></span>
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
              <span className="lr-ico" style={{ background: 'var(--eec-green-soft)', color: 'var(--green-deep-text)' }}><Icon name="church" size={15} stroke={1.9} /></span>
              <span className="lr-body"><span className="lr-title">{p.name}</span><span className="lr-sub">{p.stats.fideles} fidèles</span></span>
              <span className="lr-chev"><Icon name="chevron" size={14} stroke={2} /></span>
            </button>
          ))}
        </div>
      )}
      {tab === 'stats' && isParish && (item as ParishItem).stats && (
        <div className="dp-section">
          <h4>Statistiques {(item as ParishItem).stats.annee > 0 ? `— ${(item as ParishItem).stats.annee}` : ''}</h4>
          <div className="big-stat-row">
            <div className="big-stat green"><div className="bs-value">{fmt((item as ParishItem).stats.communiants)}</div><div className="bs-label">Communiants</div></div>
            <div className="big-stat orange"><div className="bs-value">{fmt((item as ParishItem).stats.nonCommuniants)}</div><div className="bs-label">Non-communiants</div></div>
            <div className="big-stat blue"><div className="bs-value">{fmt((item as ParishItem).stats.fideles)}</div><div className="bs-label">Total fidèles</div></div>
          </div>
          {(item as any).stats.baptemes > 0 && (
            <div className="big-stat-row" style={{ marginTop: 8 }}>
              <div className="big-stat"><div className="bs-value">{(item as any).stats.baptemes}</div><div className="bs-label">Baptêmes</div></div>
              <div className="big-stat"><div className="bs-value">{(item as any).stats.mariages}</div><div className="bs-label">Mariages</div></div>
              <div className="big-stat"><div className="bs-value">{(item as any).stats.deces}</div><div className="bs-label">Décès</div></div>
            </div>
          )}
        </div>
      )}
      {tab === 'workers' && isParish && (
        <div className="dp-section">
          <h4>Ouvriers ecclésiastiques · {parishWorkers.length}</h4>
          {parishWorkers.length === 0 && (
            <div className="search-empty" style={{ padding: '20px 0' }}>
              <div className="em-glyph"><Icon name="users" size={20} stroke={1.6} /></div>
              Aucun ouvrier enregistré pour cette paroisse.
            </div>
          )}
          {parishWorkers.map(w => {
            const initials = w.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={w.id} className="dp-worker">
                <span className="avatar">{initials}</span>
                <span className="w-body"><div className="w-name">{w.gradeLabel} {w.name}</div><div className="w-meta">{w.gradeLabel}</div></span>
                <span className={'w-status ' + w.status}>{w.status === 'occupe' ? 'Occupé' : 'Inoccupé'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   LIST VIEW
   ============================================================ */
const ListView = ({ items, onPick }: { items: AnyItem[]; onPick: (item: AnyItem) => void }) => {
  const { regions } = useMapData();
  return (
    <div className="listview">
      <div className="lv-head"><h3>Annuaire des établissements EEC</h3><span className="lv-count">{fmt(items.length)} résultats</span></div>
      <div className="lv-cols"><span /><span>Nom</span><span>Type</span><span>Région</span><span style={{ textAlign: 'right' }}>Fidèles</span><span>Statut</span></div>
      <div className="lv-body">
        {items.slice(0, 200).map((it: any) => {
          const t = ENTITY_TYPES.find(x => x.id === it.type);
          const r = regions.find(x => x.id === it.regionId);
          return (
            <div key={it.id} className="lv-row" onClick={() => onPick(it)}>
              <span className="lv-ico" style={{ background: (t?.color ?? '#000') + '15', color: t?.color }}><Icon name={TYPE_ICON[it.type] || 'church'} size={14} stroke={1.9} /></span>
              <span className="lv-name">{it.name}</span>
              <span className="lv-type">{t?.singular || '—'}</span>
              <span className="lv-region">{r?.city || r?.name || r?.admin || '—'}</span>
              <span className="lv-num">{it.stats ? fmt(it.stats.fideles) : '—'}</span>
              <span className="lv-status">{(it as any).categorie ? `Cat. ${(it as any).categorie}` : '—'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================
   Quick chips
   ============================================================ */
const QUICK_CHIPS = [
  { id: 'paroisse', lbl: 'Paroisses', ico: 'church' },
  { id: 'scolaire', lbl: 'Écoles',    ico: 'graduation' },
  { id: 'medical',  lbl: 'Hôpitaux', ico: 'hospital' },
  { id: 'univ',     lbl: 'Universités', ico: 'university' },
  { id: 'agro',     lbl: 'Domaines', ico: 'leaf' },
  { id: 'immeuble', lbl: 'Immeubles', ico: 'buildings' },
  { id: 'terrain',  lbl: 'Terrains',  ico: 'fields' },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function EECMapApp({ mode, user, embedded = false }: { mode: MapMode; user: MapUser | null; embedded?: boolean }) {
  const [mapData, setMapData]           = useState<MapDataResult>(EMPTY_DATA);
  const [dataLoading, setDataLoading]   = useState(true);
  const [view, setView]                 = useState<'map' | 'list'>('map');
  // État initial : carte SEULE, thème clair, aucun panneau ouvert — l'utilisateur
  // arrive sur une carte propre et ouvre lui-même ce dont il a besoin.
  const [theme, setTheme]               = useState<string>('light');
  const [activeTab, setActiveTab]       = useState<string | null>(null);
  const [basemap, setBasemap]           = useState<'light' | 'sat'>('light');
  const [filters, setFilters]           = useState<FilterState>(DEFAULT_FILTERS);
  const [floatQ, setFloatQ]             = useState('');
  const [selected, setSelected]         = useState<AnyItem | null>(null);
  const [focusTarget, setFocusTarget]   = useState<{ lat: number; lng: number; zoom?: number; atLeast?: boolean } | null>(null);
  const [fullscreen, setFullscreen]     = useState(false);
  const [recents, setRecents]           = useState<any[]>([]);
  const [saved, setSaved]               = useState<AnyItem[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCTA, setShowCTA]           = useState(mode === 'public');
  const [shareItem, setShareItem]       = useState<AnyItem | null>(null);
  const [mapSettings, setMapSettings]   = useState({ regions: true, cluster: true, labels: true, poi: true });
  const [showLegend, setShowLegend]     = useState(false);
  // La légende reste ouverte jusqu'à ce que l'utilisateur clique ailleurs ou sur la croix
  const openLegend = useCallback(() => setShowLegend(v => !v), []);

  // ── Routing (itinéraire type Google Maps) ──────────────────────────────
  const [routeStart, setRouteStart]     = useState<RoutePoint | null>(null);
  const [routeEnd, setRouteEnd]         = useState<RoutePoint | null>(null);
  const [routeMode, setRouteMode]       = useState<TravelMode>('auto');
  const [route, setRoute]               = useState<RouteData>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError]     = useState<string>('');
  const [userPos, setUserPos]           = useState<{ lat: number; lng: number } | null>(null);
  // Quand on attend que l'utilisateur clique un marqueur pour fixer départ/arrivée
  const [pickTarget, setPickTarget]     = useState<'start' | 'end' | null>(null);

  // ── Outil de mesure de distance ────────────────────────────────────────
  const [measuring, setMeasuring]       = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  // ── Mode navigation animée ─────────────────────────────────────────────
  const [navigating, setNavigating]     = useState(false);
  const [navInfo, setNavInfo]           = useState<{ remainingKm: number; remainingMin: number; instruction: string; progress: number; gpsError?: boolean; speedKmh?: number } | null>(null);

  // ── Menu contextuel clic droit ─────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);

  // Load real data from backend on mount
  useEffect(() => {
    loadMapData()
      .then(d => setMapData(d))
      .catch(() => {/* keep empty data */})
      .finally(() => setDataLoading(false));
  }, []);

  // Lien profond de partage : /carte?id=&lat=&lng=&name= → vole + ouvre le détail
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (deepLinkDone.current || !mapData.allItems.length) return;
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const id = p.get('id'); const lat = parseFloat(p.get('lat') || ''); const lng = parseFloat(p.get('lng') || '');
    if (!id && Number.isNaN(lat)) return;
    deepLinkDone.current = true;
    const found = id ? mapData.allItems.find(it => String(it.id) === id) : null;
    if (found) {
      setSelected(found);
      setFocusTarget({ lat: found.lat, lng: found.lng, zoom: 15 });
    } else if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setFocusTarget({ lat, lng, zoom: 15 });
    }
    setActiveTab(null);
  }, [mapData.allItems]);

  // Persistance : charger favoris + historique du visiteur connecté (une fois les données prêtes)
  const persistLoaded = useRef(false);
  useEffect(() => {
    if (persistLoaded.current || mode !== 'visitor' || !mapData.allItems.length) return;
    persistLoaded.current = true;
    const find = (kind: string, eid: number | string) =>
      mapData.allItems.find(it => entityKind(it) === kind && String(it.id) === String(eid));

    fetch(`${BACKEND}/api/visitor/favoris-carte/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { type_entite: string; entite_id: number }[]) => {
        const items = rows.map(r => find(r.type_entite, r.entite_id)).filter(Boolean) as AnyItem[];
        if (items.length) setSaved(items);
      }).catch(() => {});

    fetch(`${BACKEND}/api/visitor/consultations/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { type_entite: string; entite_id: number; vue_at: string }[]) => {
        const items = rows.map(r => {
          const it = find(r.type_entite, r.entite_id);
          const ms = new Date(r.vue_at).getTime();
          return it ? { ...it, _at: ms, _timeAgo: relTime(ms) } : null;
        }).filter(Boolean);
        if (items.length) setRecents(items as any[]);
      }).catch(() => {});
  }, [mode, mapData.allItems]);

  useEffect(() => {
    if (embedded) return;
    document.documentElement.setAttribute('data-theme', theme);
    return () => { document.documentElement.removeAttribute('data-theme'); };
  }, [theme, embedded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLoginPrompt) { setShowLoginPrompt(false); return; }
        if (fullscreen)  { setFullscreen(false); return; }
        if (selected)    { setSelected(null); return; }
        if (floatQ)      { setFloatQ(''); return; }
        if (activeTab)   { setActiveTab(null); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showLoginPrompt, fullscreen, selected, floatQ, activeTab]);

  const filteredItems = useMemo(() => {
    return mapData.allItems.filter(it => {
      const item = it as any;
      if (floatQ && !item.name.toLowerCase().includes(floatQ.toLowerCase())) return false;
      if (!filters.layers[item.type]) return false;
      if (filters.region   && item.regionId   !== filters.region)   return false;
      if (filters.district && item.districtId !== filters.district) return false;
      if (filters.parish   && item.id         !== filters.parish)   return false;
      if (item.type === 'paroisse' && item.stats) {
        if (filters.minFideles && item.stats.fideles     < filters.minFideles) return false;
        if (filters.minCommun  && item.stats.communiants < filters.minCommun)  return false;
      }
      return true;
    });
  }, [mapData.allItems, filters, floatQ]);

  const layerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ENTITY_TYPES.forEach(t => { counts[t.id] = 0; });
    mapData.allItems.forEach(it => {
      if (filters.region   && it.regionId         !== filters.region)   return;
      if (filters.district && (it as any).districtId !== filters.district) return;
      counts[it.type] = (counts[it.type] || 0) + 1;
    });
    return counts;
  }, [mapData.allItems, filters.region, filters.district]);

  const badges: Record<string, number | null> = {
    history: recents.length > 0 ? recents.length : null,
    saved:   saved.length   > 0 ? saved.length   : null,
  };

  const addToRecents = useCallback((item: AnyItem) => {
    setRecents(prev => {
      const f = prev.filter((x: any) => x.id !== item.id);
      return [{ ...item, _at: Date.now(), _timeAgo: "à l'instant" }, ...f].slice(0, 40);
    });
    // Persistance backend (visiteur connecté uniquement)
    if (mode === 'visitor' && 'type' in item) {
      ensureCsrf().then(csrf => fetch(`${BACKEND}/api/visitor/consultations/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ type_entite: entityKind(item), entite_id: Number(item.id) }),
      })).catch(() => {});
    }
  }, [mode]);

  const itemToPoint = (item: AnyItem): RoutePoint => ({
    lat: item.lat, lng: item.lng,
    label: (item as any).name ?? 'Élément',
    kind: 'type' in item ? (item as any).type : 'region',
  });

  const handleMarkerClick = useCallback((item: AnyItem) => {
    // Si on est en mode "choisir un point pour l'itinéraire", on capture le clic
    if (pickTarget) {
      const pt = itemToPoint(item);
      if (pickTarget === 'start') setRouteStart(pt); else setRouteEnd(pt);
      setPickTarget(null);
      return;
    }
    setSelected(item);
    if ('type' in item) addToRecents(item as any);
    // Zoomer SUR l'élément (jamais de dézoom) : on centre et on rapproche
    // à 16 si on était plus loin, sinon on garde le zoom courant.
    setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 16, atLeast: true });
  }, [addToRecents, pickTarget]);

  // Géolocalisation : "Ma position" comme point de départ
  const useMyPosition = useCallback((target: 'start' | 'end' = 'start') => {
    setRouteError('');
    // Bascule : si « Ma position » est déjà sur ce champ, un nouveau tap la retire.
    const current = target === 'start' ? routeStart : routeEnd;
    if (current && current.kind === 'me') {
      if (target === 'start') setRouteStart(null); else setRouteEnd(null);
      return;
    }
    if (!navigator.geolocation) { setRouteError("La géolocalisation n'est pas disponible sur cet appareil."); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Ma position', kind: 'me' };
        setUserPos({ lat: p.lat, lng: p.lng });
        if (target === 'start') setRouteStart(p); else setRouteEnd(p);
        setFocusTarget({ lat: p.lat, lng: p.lng, zoom: 15 }); // zoom net sur la localisation
      },
      err => setRouteError(
        err.code === err.PERMISSION_DENIED
          ? 'Autorisez la localisation dans votre navigateur pour utiliser votre position.'
          : "Impossible d'obtenir votre position GPS."
      ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [routeStart, routeEnd]);

  // Bouton "Ma position" de la carte : localise + centre + marqueur bleu animé
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setFocusTarget({ ...p, zoom: 14 });
      },
      () => {/* permission refusée — silencieux ici */},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  // Ouvrir un favori : voler dessus + ouvrir le détail
  const openSaved = useCallback((item: AnyItem) => {
    setSelected(item);
    setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 14 });
    setActiveTab(null);
  }, []);

  // Calcul de l'itinéraire réel via le backend (Valhalla)
  const computeRoute = useCallback(async () => {
    if (!routeStart || !routeEnd) { setRouteError('Définissez un départ et une destination.'); return; }
    setRouteLoading(true); setRouteError(''); setRoute(null);
    try {
      const csrf = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' })
        .then(r => r.json()).then(d => d.csrfToken ?? '').catch(() => '');
      const res = await fetch(`${BACKEND}/api/visitor/itineraires/route/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({
          start_lat: routeStart.lat, start_lng: routeStart.lng,
          end_lat: routeEnd.lat, end_lng: routeEnd.lng, mode: routeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRouteError(data.detail || "Calcul d'itinéraire impossible."); return; }
      setRoute(data as RouteData);
    } catch {
      setRouteError('Erreur réseau pendant le calcul.');
    } finally {
      setRouteLoading(false);
    }
  }, [routeStart, routeEnd, routeMode]);

  // Recalcul automatique quand on change de mode si un itinéraire existe déjà
  useEffect(() => {
    if (route && routeStart && routeEnd) { computeRoute(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode]);

  const clearRoute = useCallback(() => {
    setRoute(null); setRouteStart(null); setRouteEnd(null); setRouteError(''); setPickTarget(null);
  }, []);

  const swapRoute = useCallback(() => {
    setRouteStart(routeEnd); setRouteEnd(routeStart);
  }, [routeStart, routeEnd]);

  // ── Mesure ──
  const onMeasureClick = useCallback((lat: number, lng: number) => {
    setMeasurePoints(p => [...p, [lat, lng]]);
  }, []);
  const toggleMeasure = useCallback(() => {
    setMeasuring(m => {
      const next = !m;
      if (next) { setActiveTab(null); setSelected(null); }
      else setMeasurePoints([]);
      return next;
    });
  }, []);
  const clearMeasure = useCallback(() => setMeasurePoints([]), []);

  // ── Navigation animée ──
  const startNav = useCallback(() => {
    if (route && route.geometry.length > 1) { setNavigating(true); setActiveTab(null); setSelected(null); }
  }, [route]);
  const stopNav = useCallback(() => { setNavigating(false); setNavInfo(null); }, []);

  // ── Menu contextuel (clic droit sur la carte) ──────────────────────────
  // handleMapRightClick est défini APRÈS useLeafletMap (qui expose mapRef)

  const handleSearchPick = useCallback((kind: string, item: any) => {
    if (kind === 'item')     { setSelected(item); addToRecents(item); setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 13 }); setActiveTab(null); }
    else if (kind === 'region')   { setFilters(f => ({ ...f, region: item.id, district: null, parish: null })); setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 8 }); setActiveTab(null); }
    else if (kind === 'district') { setFilters(f => ({ ...f, region: item.regionId, district: item.id, parish: null })); setFocusTarget({ lat: item.lat, lng: item.lng, zoom: 11 }); setActiveTab(null); }
  }, [addToRecents]);

  const handleReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, layers: { paroisse: true, scolaire: true, medical: true, univ: true, agro: true, immeuble: true, terrain: true }, grades: new Set() });
  }, []);

  const toggleSave = useCallback((item: AnyItem) => {
    const wasSaved = saved.some(s => s.id === item.id);
    setSaved(prev => wasSaved ? prev.filter(s => s.id !== item.id) : [...prev, item]);
    // Persistance backend (visiteur connecté uniquement)
    if (mode === 'visitor' && 'type' in item) {
      const kind = entityKind(item);
      ensureCsrf().then(csrf => {
        if (wasSaved) {
          return fetch(`${BACKEND}/api/visitor/favoris-carte/${kind}/${item.id}/`, {
            method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrf },
          });
        }
        return fetch(`${BACKEND}/api/visitor/favoris-carte/`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
          body: JSON.stringify({ type_entite: kind, entite_id: Number(item.id) }),
        });
      }).catch(() => {});
    }
  }, [saved, mode]);

  const clearHistory = useCallback(() => {
    setRecents([]);
    if (mode === 'visitor') {
      ensureCsrf().then(csrf => fetch(`${BACKEND}/api/visitor/consultations/clear/`, {
        method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrf },
      })).catch(() => {});
    }
  }, [mode]);

  const handleLogout = useCallback(async () => {
    try {
      const csrf = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' })
        .then(r => r.json()).then(d => d.csrfToken ?? '').catch(() => '');
      await fetch(`${BACKEND}/api/auth/logout/`, {
        method: 'POST', credentials: 'include',
        headers: { 'X-CSRFToken': csrf, 'Content-Type': 'application/json' },
      });
    } finally {
      window.location.href = '/';
    }
  }, []);

  const toggleQuickChip = (id: string) => {
    setFilters(f => {
      const onlyMe = f.layers[id] && ENTITY_TYPES.every(t => t.id === id || !f.layers[t.id]);
      const next: Record<string, boolean> = {};
      if (onlyMe) { ENTITY_TYPES.forEach(t => { next[t.id] = true; }); }
      else        { ENTITY_TYPES.forEach(t => { next[t.id] = t.id === id; }); }
      return { ...f, layers: next };
    });
  };

  const { mapRef } = useLeafletMap(
    'eec-map-visitor',
    mapData.regions,
    mapData.parishes,
    mapData.districts,
    filteredItems,
    basemap,
    selected?.id,
    handleMarkerClick,
    focusTarget,
    route,
    routeStart,
    routeEnd,
    userPos,
    mapSettings,
    measuring,
    measurePoints,
    onMeasureClick,
  );
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    // Filet de sécurité : si le bearing interne de leaflet-rotate est resté
    // NaN (voir ResizeObserver plus haut), on le purge avant de recentrer.
    const anyMap = map as any;
    if (typeof anyMap.getBearing === 'function' && Number.isNaN(anyMap.getBearing())) {
      anyMap.setBearing(0);
    }
    map.flyToBounds(CAMEROON_BOUNDS, { duration: 0.7 } as L.FitBoundsOptions);
  };

  // Rotation de la carte 2D (leaflet-rotate) — boutons gauche/droite
  const rotateMap = useCallback((delta: number) => {
    const map = mapRef.current as any;
    if (!map || typeof map.setBearing !== 'function') return;
    map.setBearing((map.getBearing?.() ?? 0) + delta);
  }, [mapRef]);
  const resetBearing = useCallback(() => {
    const map = mapRef.current as any;
    if (map && typeof map.setBearing === 'function') map.setBearing(0);
  }, [mapRef]);

  usePOILayer(mapRef, mapSettings.poi, mapSettings.labels);

  const handleMapRightClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const map = mapRef.current;
    if (!map) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const latlng = map.containerPointToLatLng(L.point(e.clientX - rect.left, e.clientY - rect.top));
    setCtxMenu({ lat: latlng.lat, lng: latlng.lng, x: e.clientX, y: e.clientY });
  }, [mapRef]);

  // IMPORTANT : recalculer la taille du conteneur Leaflet quand la mise en page
  // change (plein écran, ouverture/fermeture du panneau, bascule carte/liste).
  // Sans cela, Leaflet garde l'ancienne taille → tuiles manquantes / page blanche.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || view !== 'map') return;
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 300); // après la transition CSS (260ms)
    return () => clearTimeout(t);
  }, [fullscreen, activeTab, view, mapRef]);

  // Distance totale de la mesure (Haversine via Leaflet)
  const measureTotal = useMemo(() => {
    let m = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      m += L.latLng(measurePoints[i - 1][0], measurePoints[i - 1][1])
        .distanceTo(L.latLng(measurePoints[i][0], measurePoints[i][1]));
    }
    return m;
  }, [measurePoints]);

  // Depuis le panneau de détail : "Itinéraire vers cet élément"
  const routeToItem = useCallback((item: AnyItem) => {
    const pt = itemToPoint(item);
    setRouteEnd(pt);
    setSelected(null);
    setActiveTab('parcours');
    if (userPos) setRouteStart({ lat: userPos.lat, lng: userPos.lng, label: 'Ma position', kind: 'me' });
    else useMyPosition('start');
  }, [userPos, useMyPosition]);

  return (
    <MapDataCtx.Provider value={mapData}>
      <div
        className={'app' + (fullscreen ? ' fs' : '')}
        style={embedded ? { height: '100%', gridTemplateRows: '1fr' } : undefined}
      >
        {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}

        {!fullscreen && !embedded && (
          <MapNavbar view={view} setView={setView} stats={mapData.globalStats} theme={theme} setTheme={setTheme}
            user={user} mode={mode} onLogout={handleLogout} />
        )}

        <div className={'main' + (activeTab ? ' panel-open' : '') + (fullscreen ? ' fullscreen' : '')}>
          {!fullscreen && (
            <MapRail active={activeTab} setActive={setActiveTab}
              badges={badges} mode={mode} onLockedClick={() => setShowLoginPrompt(true)} />
          )}

          {!fullscreen && (
            <aside className="panel">
              {activeTab === 'search'    && <SearchPanel onPick={handleSearchPick} recents={recents} onClose={() => setActiveTab(null)} />}
              {activeTab === 'filters'   && <FiltersPanel filters={filters} setFilters={setFilters as any} layerCounts={layerCounts} onClose={() => setActiveTab(null)} onReset={handleReset} onApply={() => setActiveTab(null)} />}
              {activeTab === 'parcours'  && <ParcoursPanel
                onClose={() => setActiveTab(null)}
                routeStart={routeStart} routeEnd={routeEnd} routeMode={routeMode}
                route={route} routeLoading={routeLoading} routeError={routeError} pickTarget={pickTarget}
                setRouteMode={setRouteMode} setRouteStart={setRouteStart} setRouteEnd={setRouteEnd}
                setPickTarget={setPickTarget} onUseMyPosition={useMyPosition}
                onCompute={computeRoute} onClear={clearRoute} onSwap={swapRoute} onStartNav={startNav} />}
              {activeTab === 'stats'     && <StatsPanel filters={filters} layerCounts={layerCounts} onClose={() => setActiveTab(null)} onFocusRegion={r => { setFilters(f => ({ ...f, region: r.id })); setFocusTarget({ lat: r.lat, lng: r.lng, zoom: 8 }); }} />}
              {activeTab === 'regions'   && <EntityListPanel title="Régions"   items={mapData.regions}   kind="region"   onPick={handleSearchPick} onClose={() => setActiveTab(null)} totalLabel={`${mapData.regions.length} régions synodales`} />}
              {activeTab === 'districts' && <EntityListPanel title="Districts"  items={mapData.districts} kind="district" onPick={handleSearchPick} onClose={() => setActiveTab(null)} totalLabel={`${mapData.districts.length} districts`} />}
              {activeTab === 'paroisses' && <EntityListPanel title="Paroisses"  items={mapData.parishes}  kind="parish"   onPick={handleSearchPick} onClose={() => setActiveTab(null)} totalLabel={`${mapData.globalStats.parishes} paroisses`} />}
              {activeTab === 'oeuvres'   && <EntityListPanel title="Œuvres"     items={mapData.oeuvres}   kind="oeuvre"   onPick={handleSearchPick} onClose={() => setActiveTab(null)} totalLabel={`${mapData.oeuvres.length} œuvres`} />}
              {activeTab === 'ouvriers'  && <EntityListPanel title="Ouvriers"   items={mapData.workers}   kind="worker"   onClose={() => setActiveTab(null)} totalLabel={`${mapData.globalStats.workers} ouvriers ecclésiastiques`} />}
              {activeTab === 'favoris'   && <FavorisPanel saved={saved} onOpen={openSaved} onRemove={toggleSave} onClose={() => setActiveTab(null)} />}
              {activeTab === 'history'   && <HistoryPanel recents={recents} onPick={handleMarkerClick} onClose={() => setActiveTab(null)} onClear={clearHistory} />}
              {activeTab === 'settings'  && <SettingsPanel theme={theme} setTheme={setTheme} onClose={() => setActiveTab(null)} user={user} onLogout={handleLogout} mapSettings={mapSettings} setMapSettings={setMapSettings} />}
            </aside>
          )}

          <div className="map-wrap">
            {/* Loading overlay */}
            {dataLoading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 900,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(13,26,15,0.75)', backdropFilter: 'blur(3px)', gap: 14, pointerEvents: 'none',
              }}>
                <div style={{
                  width: 36, height: 36, border: '3px solid rgba(93,191,122,0.25)',
                  borderTopColor: '#5DBF7A', borderRadius: '50%',
                  animation: 'spin 0.75s linear infinite',
                }} />
                <span style={{ color: 'rgba(240,244,241,0.55)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}>
                  CHARGEMENT DES DONNÉES…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            <div id="eec-map-visitor" className="map"
              style={{ display: view === 'map' ? 'block' : 'none' }}
              onContextMenu={handleMapRightClick}
            />
            {view === 'list' && <ListView items={filteredItems} onPick={handleMarkerClick} />}

            {view === 'map' && (
              <>
                {!fullscreen && activeTab !== 'search' && activeTab !== 'filters' && (
                  <form className="floating-search" onSubmit={e => { e.preventDefault(); }} style={{ left: 56 }}>
                    <span className="fs-icon"><Icon name="search" size={18} stroke={1.9} /></span>
                    <input value={floatQ} onChange={e => setFloatQ(e.target.value)}
                      placeholder="Rechercher une paroisse, une œuvre, une région…"
                      onFocus={() => !floatQ && setActiveTab('search')} />
                    {floatQ && <button type="button" className="fs-btn" onClick={() => setFloatQ('')}><Icon name="close" size={14} stroke={2} /></button>}
                  </form>
                )}

                {!fullscreen && <div className="chip-row" style={{ left: 56, top: (activeTab === 'search' || activeTab === 'filters') ? 14 : 70 }}>
                  {QUICK_CHIPS.map(c => {
                    const t = ENTITY_TYPES.find(x => x.id === c.id);
                    const onlyMe = filters.layers[c.id] && ENTITY_TYPES.every(x => x.id === c.id || !filters.layers[x.id]);
                    return (
                      <button key={c.id} className={'chip' + (onlyMe ? ' active' : '')} onClick={() => toggleQuickChip(c.id)}>
                        {/* Icône identique au marqueur de la carte (goutte colorée) */}
                        <span className="chip-ico chip-marker" dangerouslySetInnerHTML={{ __html: markerSvg(c.id, t?.color ?? '#2E9744', false) }} />
                        {c.lbl}
                        <span style={{ color: onlyMe ? '#FFD600' : 'var(--t-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginLeft: 2 }}>{layerCounts[c.id]}</span>
                      </button>
                    );
                  })}
                </div>}

                {/* Gros bouton de sortie plein écran (centre-haut, type Google Maps) */}
                {fullscreen && (
                  <button className="fs-exit" onClick={() => setFullscreen(false)} title="Quitter le plein écran">
                    <Icon name="close" size={20} stroke={2.4} />
                  </button>
                )}

                <div className="map-ctrls-right">
                  <div className="map-ctrl-card">
                    <button onClick={recenter} title="Recentrer sur le Cameroun"><Icon name="home" size={16} stroke={1.9} /></button>
                    <button onClick={() => setBasemap(b => b === 'light' ? 'sat' : 'light')} title="Changer de fond de carte"><Icon name="layers" size={15} stroke={1.9} /></button>
                    {fullscreen
                      ? <button onClick={() => setFullscreen(false)} title="Quitter plein écran"><Icon name="compress" size={15} stroke={1.9} /></button>
                      : <button onClick={() => { setFullscreen(true); setActiveTab(null); setSelected(null); }} title="Plein écran"><Icon name="expand" size={15} stroke={1.9} /></button>
                    }
                  </div>
                  <div className="map-ctrl-card">
                    <button className={'measure-btn' + (measuring ? ' on' : '')} onClick={toggleMeasure} title="Mesurer une distance">
                      <Icon name="ruler" size={15} stroke={1.9} />
                    </button>
                    <button className={'locate-btn' + (userPos ? ' on' : '')} onClick={locateMe} title="Ma position (GPS)">
                      <Icon name="crosshair" size={15} stroke={2} />
                    </button>
                  </div>
                </div>

                {/* Boutons de rotation de la carte — bas-centre (comme Google Maps sur mobile) */}
                <div className="rotate-ctrls">
                  <button onClick={() => rotateMap(-30)} title="Pivoter à gauche"><Icon name="refresh" size={16} stroke={2} /></button>
                  <button className="rotate-reset" onClick={resetBearing} title="Nord en haut"><Icon name="navArrow" size={15} stroke={0} fill="currentColor" /></button>
                  <button onClick={() => rotateMap(30)} title="Pivoter à droite" style={{ transform: 'scaleX(-1)' }}><Icon name="refresh" size={16} stroke={2} /></button>
                </div>

                {/* Bouton Légende — coin haut-droit, panneau juste en dessous.
                    Se décale à gauche quand la fiche détail (à droite) est ouverte.
                    Masqué pendant la navigation 3D (surcouche plein écran). */}
                {showLegend && !navigating && <div className="legend-overlay" onClick={() => setShowLegend(false)} />}
                <div className={'legend-corner' + (selected ? ' shifted' : '') + (navigating ? ' hidden' : '')}>
                  <button className={'legend-btn' + (showLegend ? ' active' : '')} onClick={openLegend} title="Légende de la carte">
                    <Icon name="help" size={13} stroke={2} />
                    <span>Légende</span>
                  </button>
                  {showLegend && (
                    <LegendPanel regions={mapData.regions} mapSettings={mapSettings} setMapSettings={setMapSettings} onClose={() => setShowLegend(false)} />
                  )}
                </div>

                {/* Panneau outil de mesure */}
                {measuring && (
                  <div className="measure-panel">
                    <div className="measure-head">
                      <span className="measure-ico"><Icon name="ruler" size={15} stroke={1.9} /></span>
                      <div>
                        <div className="measure-title">Mesure de distance</div>
                        <div className="measure-hint">{measurePoints.length === 0 ? 'Cliquez sur la carte pour commencer' : `${measurePoints.length} point${measurePoints.length > 1 ? 's' : ''}`}</div>
                      </div>
                    </div>
                    <div className="measure-total">
                      {measureTotal >= 1000 ? `${(measureTotal / 1000).toFixed(2)} km` : `${Math.round(measureTotal)} m`}
                    </div>
                    <div className="measure-actions">
                      <button onClick={clearMeasure} disabled={!measurePoints.length}><Icon name="refresh" size={12} stroke={2} /> Effacer</button>
                      <button className="primary" onClick={toggleMeasure}><Icon name="check" size={12} stroke={2.5} /> Terminer</button>
                    </div>
                  </div>
                )}

                {!fullscreen && (
                  <div className={'basemap-thumb' + (basemap === 'sat' ? ' sat' : '')} onClick={() => setBasemap(b => b === 'light' ? 'sat' : 'light')}>
                    <div className="bt-prev" /><div className="bt-label">{basemap === 'light' ? 'Plan' : 'Satellite'}<div className="bt-sub">Basculer</div></div>
                  </div>
                )}

                {!fullscreen && (
                  <div className="map-info-pill">
                    <span className="mi-dot" /> CMR · {fmt(filteredItems.length)} éléments
                    {mode === 'public' && <span style={{ marginLeft: 8, opacity: 0.65, fontSize: 10 }}>· Visiteur public</span>}
                  </div>
                )}

                {!fullscreen && mode === 'public' && showCTA && (
                  <AuthCTABanner onDismiss={() => setShowCTA(false)} />
                )}
              </>
            )}

            {selected && (
              <DetailPanel item={selected} onClose={() => setSelected(null)} saved={saved}
                onToggleSave={toggleSave} onPick={handleMarkerClick} mode={mode}
                onLoginRequired={() => setShowLoginPrompt(true)}
                onShare={setShareItem}
                onRoute={mode === 'public' ? () => setShowLoginPrompt(true) : routeToItem} />
            )}
          </div>
        </div>

        {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}

        {/* Navigation 3D (MapLibre) + HUD par-dessus — rendu via PORTAL dans <body>
            pour garantir un plein écran fiable (hors de tout ancêtre transformé). */}
        {navigating && route && typeof document !== 'undefined' && createPortal(
          <>
            <NavMap3D route={route} mode={routeMode} onProgress={setNavInfo} onEnd={stopNav} />
            <div className={'nav-banner' + (navInfo?.gpsError ? ' err' : '')}>
              <span className="nav-banner-arrow"><Icon name={navInfo?.gpsError ? 'crosshair' : 'navArrow'} size={22} color="#fff" stroke={navInfo?.gpsError ? 2 : 0} fill={navInfo?.gpsError ? 'none' : '#fff'} /></span>
              <div className="nav-banner-body">
                <div className="nav-banner-instr">{navInfo?.instruction || 'Recherche du signal GPS…'}</div>
                <div className="nav-banner-sub">
                  {navInfo?.gpsError
                    ? 'Localisation requise'
                    : <>Suivi GPS en temps réel · {routeMode === 'pedestrian' ? 'à pied' : routeMode === 'bicycle' ? 'à vélo' : 'en voiture'}{navInfo?.speedKmh != null && navInfo.speedKmh > 1 ? ` · ${Math.round(navInfo.speedKmh)} km/h` : ''}</>}
                </div>
              </div>
              <button className="nav-quit" onClick={stopNav} title="Quitter la navigation"><Icon name="close" size={18} stroke={2.4} /></button>
            </div>
            <div className="nav-hud">
              <div className="nav-hud-item">
                <div className="nav-hud-val">{navInfo ? (navInfo.remainingKm >= 1 ? navInfo.remainingKm.toFixed(1) : Math.round(navInfo.remainingKm * 1000).toString()) : '—'}</div>
                <div className="nav-hud-lbl">{navInfo && navInfo.remainingKm >= 1 ? 'km restants' : 'm restants'}</div>
              </div>
              <div className="nav-hud-sep" />
              <div className="nav-hud-item">
                <div className="nav-hud-val">{navInfo ? fmtDuration(navInfo.remainingMin) : '—'}</div>
                <div className="nav-hud-lbl">temps restant</div>
              </div>
              <div className="nav-hud-progress"><span style={{ width: `${(navInfo?.progress ?? 0) * 100}%` }} /></div>
            </div>
          </>,
          document.body,
        )}

        {/* Menu contextuel clic droit */}
        {ctxMenu && (
          <div className="ctx-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}
            onMouseLeave={() => setCtxMenu(null)}>
            <div className="ctx-coords">{ctxMenu.lat.toFixed(5)}, {ctxMenu.lng.toFixed(5)}</div>
            <button className="ctx-item" onClick={() => {
              setRouteStart({ lat: ctxMenu.lat, lng: ctxMenu.lng, label: `${ctxMenu.lat.toFixed(4)}, ${ctxMenu.lng.toFixed(4)}`, kind: 'map' });
              setActiveTab('parcours'); setCtxMenu(null);
            }}><Icon name="navStart" size={13} stroke={0} fill="#1A73E8" /> Itinéraire depuis ici</button>
            <button className="ctx-item" onClick={() => {
              if (userPos) { setRouteStart({ lat: userPos.lat, lng: userPos.lng, label: 'Ma position', kind: 'me' }); }
              setRouteEnd({ lat: ctxMenu.lat, lng: ctxMenu.lng, label: `${ctxMenu.lat.toFixed(4)}, ${ctxMenu.lng.toFixed(4)}`, kind: 'map' });
              setActiveTab('parcours'); setCtxMenu(null);
            }}><Icon name="pin" size={13} stroke={1.8} /> Itinéraire vers ici</button>
            <div className="ctx-sep" />
            <button className="ctx-item" onClick={() => {
              const url = `https://maps.google.com?q=${ctxMenu.lat},${ctxMenu.lng}`;
              window.open(url, '_blank'); setCtxMenu(null);
            }}><Icon name="map" size={13} stroke={1.8} /> Voir dans Google Maps</button>
          </div>
        )}
      </div>
    </MapDataCtx.Provider>
  );
}
