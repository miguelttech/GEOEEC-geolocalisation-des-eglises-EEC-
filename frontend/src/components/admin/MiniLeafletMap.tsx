'use client';
import React from 'react';
import 'leaflet/dist/leaflet.css';

const CLUSTERS = [
  { lat: 3.866,  lng: 11.516, count: 95, name: 'CENTRE SUD 1' },
  { lat: 4.061,  lng: 9.787,  count: 72, name: 'WOURI CENTRE' },
  { lat: 5.475,  lng: 10.418, count: 48, name: 'MIFI' },
  { lat: 5.448,  lng: 10.057, count: 41, name: 'MENOUA' },
  { lat: 7.323,  lng: 13.583, count: 24, name: 'ADAMAOUA' },
  { lat: 4.578,  lng: 13.685, count: 31, name: 'EST' },
  { lat: 10.595, lng: 14.323, count: 22, name: 'NORD & EXT. NORD' },
  { lat: 2.928,  lng: 11.158, count: 38, name: 'CENTRE SUD 2' },
  { lat: 5.140,  lng: 10.273, count: 30, name: 'HAUT-NKAM' },
  { lat: 5.466,  lng: 10.892, count: 35, name: 'NOUN NORD' },
  { lat: 4.453,  lng: 9.985,  count: 32, name: 'MOUNGO CENTRE' },
];

export default function MiniLeafletMap({ height = 320 }: { height?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current || (ref.current as any)._init) return;
    (ref.current as any)._init = true;

    import('leaflet').then(({ default: L }) => {
      if (!ref.current) return;
      const map = L.map(ref.current, {
        zoomControl: false, attributionControl: true,
        dragging: false, scrollWheelZoom: false,
        doubleClickZoom: false, touchZoom: false, boxZoom: false,
      }).setView([6.4, 12.3], 5.4);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB',
        maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      CLUSTERS.forEach(c => {
        const size = 18 + Math.sqrt(c.count) * 2.6;
        const icon = L.divIcon({
          html: `<div class="map-cluster" style="width:${size}px;height:${size}px">${c.count}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
        });
        L.marker([c.lat, c.lng], { icon })
          .bindTooltip(`<b>${c.name}</b><br>${c.count} paroisses`, { direction: 'top', offset: [0, -8] })
          .addTo(map);
      });
    });
  }, []);

  return <div ref={ref} style={{ height, width: '100%', borderRadius: 4 }} />;
}
