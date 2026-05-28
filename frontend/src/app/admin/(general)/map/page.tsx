'use client';
import React from 'react';
import 'leaflet/dist/leaflet.css';
import { REGIONS_22 } from '@/components/admin/data';
import { Dropdown } from '@/components/admin/atoms';

const CLUSTERS = [
  { lat: 3.866, lng: 11.516, count: 95, name: 'CENTRE SUD 1' },
  { lat: 4.061, lng: 9.787, count: 72, name: 'WOURI CENTRE' },
  { lat: 5.475, lng: 10.418, count: 48, name: 'MIFI' },
  { lat: 5.448, lng: 10.057, count: 41, name: 'MENOUA' },
  { lat: 7.323, lng: 13.583, count: 24, name: 'ADAMAOUA' },
  { lat: 4.578, lng: 13.685, count: 31, name: 'EST' },
  { lat: 10.595, lng: 14.323, count: 22, name: 'NORD & EXT. NORD' },
  { lat: 2.928, lng: 11.158, count: 38, name: 'CENTRE SUD 2' },
  { lat: 5.140, lng: 10.273, count: 30, name: 'HAUT-NKAM' },
  { lat: 5.466, lng: 10.892, count: 35, name: 'NOUN NORD' },
  { lat: 4.453, lng: 9.985, count: 32, name: 'MOUNGO CENTRE' },
  { lat: 4.020, lng: 9.700, count: 38, name: 'WOURI SUD' },
];

export default function MapPage() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current || (ref.current as any)._init) return;
    (ref.current as any)._init = true;

    import('leaflet').then(({ default: L }) => {
      if (!ref.current) return;
      const map = L.map(ref.current, { attributionControl: true }).setView([6.4, 12.3], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      CLUSTERS.forEach(c => {
        const size = 24 + Math.sqrt(c.count) * 3.4;
        const icon = L.divIcon({
          html: `<div class="map-cluster" style="width:${size}px;height:${size}px">${c.count}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
        });
        L.marker([c.lat, c.lng], { icon })
          .bindTooltip(`<b>${c.name}</b><br>${c.count} paroisses`, { direction: 'top', offset: [0, -10] })
          .addTo(map);
      });
    });
  }, []);

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 60px - 56px)', margin: '-28px -32px -28px', padding: 0 }}>
      {/* Filter panel */}
      <div style={{ width: 280, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--border)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <h3 className="sg-md" style={{ fontSize: 14, margin: 0 }}>Filtres carte</h3>
        <Dropdown label="Région" value="Toutes régions" options={['Toutes régions', ...REGIONS_22]} onChange={() => {}} />
        <Dropdown label="Niveau" value="Tous" options={['Tous','Paroisse','Station','Annexe']} onChange={() => {}} />
        <Dropdown label="GPS" value="Toutes" options={['Toutes','Avec GPS (426)','Sans GPS (127)']} onChange={() => {}} />
        <Dropdown label="Année stats" value="2025" options={['2025','2024','2023']} onChange={() => {}} />
        <div style={{ height: 1, background: 'var(--border)' }} />
        <h3 className="sg-md" style={{ fontSize: 14, margin: 0 }}>Affichage</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" defaultChecked /> Marqueurs clusterisés</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" defaultChecked /> Choroplèthe régions</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" /> Limites districts</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" /> Heatmap fidèles</label>
        <div style={{ marginTop: 'auto', padding: '12px 14px', background: 'rgba(46,151,68,0.06)', border: '1px solid rgba(46,151,68,0.25)', borderRadius: 6 }}>
          <div className="sg" style={{ fontSize: 22, color: '#5AC472' }}>426</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>paroisses affichées avec GPS</div>
          <div style={{ fontSize: 11, color: '#FFB877', marginTop: 4 }}>127 masquées (GPS manquant)</div>
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(8,17,11,0.92)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, fontSize: 11, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>Densité de paroisses</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="map-cluster" style={{ width: 16, height: 16, fontSize: 9 }}>10</span> Faible</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="map-cluster" style={{ width: 24, height: 24, fontSize: 11 }}>40</span> Moyenne</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="map-cluster" style={{ width: 32, height: 32, fontSize: 13 }}>95</span> Forte</div>
        </div>
      </div>
    </div>
  );
}
