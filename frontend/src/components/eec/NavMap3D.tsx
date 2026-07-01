'use client';

/* =============================================================================
   Vue de navigation 3D (MapLibre GL) — chargée UNIQUEMENT pendant la navigation.
   Toute l'application reste sur Leaflet (exigence du cahier des charges). Ce
   composant n'est monté qu'au clic sur « Démarrer la navigation » (import
   paresseux via next/dynamic), puis démonté à l'arrêt → aucun impact sur le
   reste de l'app. Rendu WebGL : inclinaison + rotation selon le cap, comme
   Google Maps. Suivi GPS réel (watchPosition) et calculs réels de distance.
   ============================================================================= */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type Nav3DRoute = {
  geometry: [number, number][];               // [lat, lng]
  distance_km: number;
  duration_min: number;
  steps: { instruction: string; distance_km: number }[];
  mode: string;
} | null;

type ProgressInfo = {
  remainingKm: number; remainingMin: number; instruction: string;
  progress: number; gpsError?: boolean; speedKmh?: number;
};

// Style vectoriel 3D gratuit et sans clé (riche en POI)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
type LL = { lat: number; lng: number };

function haversine(a: LL, b: LL): number {
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
function bearingOf(a: LL, b: LL): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
            Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function closestOnSeg(p: LL, a: LL, b: LL): LL {
  const kx = Math.cos(toRad(a.lat));
  const ax = a.lng * kx, ay = a.lat, bx = b.lng * kx, by = b.lat, px = p.lng * kx, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const denom = dx * dx + dy * dy || 1e-12;
  let t = ((px - ax) * dx + (py - ay) * dy) / denom;
  t = Math.max(0, Math.min(1, t));
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export default function NavMap3D({ route, onProgress, onEnd }: {
  route: Nav3DRoute; mode: string;
  onProgress: (i: ProgressInfo) => void; onEnd: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!route || route.geometry.length < 2 || !containerRef.current) return;
    let cancelled = false;

    const pts: LL[] = route.geometry.map(g => ({ lat: g[0], lng: g[1] }));
    const coords = pts.map(p => [p.lng, p.lat]) as [number, number][];
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + haversine(pts[i - 1], pts[i]);
    const totalM = cum[cum.length - 1];
    const totalMin = route.duration_min;
    const stepCum: number[] = []; let acc = 0;
    route.steps.forEach(s => { stepCum.push(acc); acc += s.distance_km * 1000; });

    const project = (p: LL) => {
      let best = { d: Infinity, along: 0, brg: 0, snap: pts[0] };
      for (let i = 1; i < pts.length; i++) {
        const snap = closestOnSeg(p, pts[i - 1], pts[i]);
        const d = haversine(p, snap);
        if (d < best.d) best = { d, along: cum[i - 1] + haversine(pts[i - 1], snap), brg: bearingOf(pts[i - 1], pts[i]), snap };
      }
      return best;
    };
    const stepAt = (along: number) => {
      let idx = 0; for (let i = 0; i < stepCum.length; i++) if (along >= stepCum[i]) idx = i;
      return route.steps[idx]?.instruction || 'Continuez tout droit';
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: coords[0], zoom: 16.5, pitch: 62,
      bearing: bearingOf(pts[0], pts[1]), attributionControl: false,
      // Bornes de zoom : empêche de trop dézoomer (évite l'aberration visuelle
      // « carte 3D par-dessus la 2D » et les milliers de tuiles au zoom faible)
      minZoom: 12, maxZoom: 19, maxPitch: 70,
    });
    mapRef.current = map;
    // Force MapLibre à (re)lire la taille du conteneur plein écran
    requestAnimationFrame(() => { if (!cancelled) map.resize(); });
    setTimeout(() => { if (!cancelled) map.resize(); }, 250);

    const puckEl = document.createElement('div');
    puckEl.className = 'nav3d-puck';
    puckEl.innerHTML = '<span class="p-ring"></span><span class="p-core"></span>';
    const puck = new maplibregl.Marker({ element: puckEl }).setLngLat(coords[0]).addTo(map);

    map.on('load', () => {
      if (cancelled) return;
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0D2818', 'line-width': 12, 'line-opacity': 0.3 } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1A73E8', 'line-width': 8 } });

      const destEl = document.createElement('div'); destEl.className = 'nav3d-dest';
      new maplibregl.Marker({ element: destEl, anchor: 'bottom' }).setLngLat(coords[coords.length - 1]).addTo(map);

      onProgress({ remainingKm: totalM / 1000, remainingMin: totalMin, instruction: 'Recherche du signal GPS…', progress: 0 });

      if (!navigator.geolocation) {
        onProgress({ remainingKm: totalM / 1000, remainingMin: totalMin, instruction: 'GPS indisponible sur cet appareil.', progress: 0, gpsError: true });
        return;
      }
      let arrived = false;
      watchRef.current = navigator.geolocation.watchPosition(
        pos => {
          if (cancelled || arrived) return;
          const p: LL = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const pr = project(p);
          const remaining = Math.max(0, totalM - pr.along);
          const shown = pr.d <= 60 ? pr.snap : p;
          puck.setLngLat([shown.lng, shown.lat]);
          const heading = (pos.coords.heading != null && pos.coords.speed && pos.coords.speed > 0.5) ? pos.coords.heading : pr.brg;
          map.easeTo({ center: [shown.lng, shown.lat], bearing: heading, pitch: 62, zoom: 17, duration: 700 });
          const speedMs = (pos.coords.speed != null && pos.coords.speed >= 0) ? pos.coords.speed : null;
          const remainingMin = (speedMs && speedMs > 0.6) ? remaining / speedMs / 60 : (totalM > 0 ? totalMin * (remaining / totalM) : 0);
          onProgress({
            remainingKm: remaining / 1000, remainingMin,
            instruction: pr.d > 80 ? 'Rejoignez l’itinéraire…' : stepAt(pr.along),
            progress: totalM > 0 ? Math.min(1, pr.along / totalM) : 0,
            speedKmh: speedMs != null ? speedMs * 3.6 : undefined,
          });
          if (remaining < 30) {
            arrived = true;
            onProgress({ remainingKm: 0, remainingMin: 0, instruction: 'Vous êtes arrivé à destination.', progress: 1 });
            setTimeout(() => { if (!cancelled) onEnd(); }, 2500);
          }
        },
        err => onProgress({
          remainingKm: totalM / 1000, remainingMin: totalMin,
          instruction: err.code === err.PERMISSION_DENIED ? 'Autorisez la localisation pour naviguer.' : 'Signal GPS indisponible.',
          progress: 0, gpsError: true,
        }),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
      );
    });

    return () => {
      cancelled = true;
      if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [route, onProgress, onEnd]);

  const rotate3d = (delta: number) => {
    const m = mapRef.current; if (!m) return;
    m.easeTo({ bearing: m.getBearing() + delta, duration: 300 });
  };

  return (
    <>
      <div ref={containerRef} className="nav3d-container"
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 1500, background: '#aadaff' }} />
      {/* Boutons de rotation — bas-centre, au-dessus de la carte 3D */}
      <div className="nav3d-rotate" style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 1600, display: 'flex', gap: 10 }}>
        <button onClick={() => rotate3d(-30)} title="Pivoter à gauche">⟲</button>
        <button onClick={() => rotate3d(30)} title="Pivoter à droite">⟳</button>
      </div>
    </>
  );
}
