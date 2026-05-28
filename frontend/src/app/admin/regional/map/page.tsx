'use client';
import React from 'react';
import 'leaflet/dist/leaflet.css';
import { I } from '@/components/admin/icons';
import { Dropdown } from '@/components/admin/atoms';
import { PAROISSES_MIFI, DISTRICTS_MIFI } from '@/components/admin/dataRegional';

export default function MapMifiPage() {
  const [district, setDistrict] = React.useState('Tous districts');
  const [niveau, setNiveau] = React.useState('Tous niveaux');
  const [gps, setGps] = React.useState('Avec GPS');
  const [showPanel, setShowPanel] = React.useState(true);

  const filteredParoisses = PAROISSES_MIFI.filter(p => {
    if (district !== 'Tous districts' && p.district !== district) return false;
    if (niveau !== 'Tous niveaux' && p.niveau !== niveau) return false;
    if (gps === 'Avec GPS' && !p.gps) return false;
    if (gps === 'Sans GPS' && p.gps) return false;
    return true;
  });

  const districtOptions = ['Tous districts', ...DISTRICTS_MIFI.map(d => d.nom)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 220px)', minHeight: 600 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.map size={15} style={{ color: '#5B9BD5' }}/>
          <span className="sg-md" style={{ fontSize: 14 }}>Carte — Région MIFI</span>
        </div>
        <div style={{ width: 200 }}><Dropdown label="" value={district} options={districtOptions} onChange={setDistrict}/></div>
        <div style={{ width: 160 }}><Dropdown label="" value={niveau} options={['Tous niveaux','PAROISSE','STATION','ANNEXE']} onChange={setNiveau}/></div>
        <div style={{ width: 140 }}><Dropdown label="" value={gps} options={['Avec GPS','Sans GPS','GPS — tous']} onChange={setGps}/></div>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>
          <b style={{ color: 'var(--text)' }}>{filteredParoisses.length}</b> paroisses affichées
        </span>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '6px 10px', fontSize: 12 }} onClick={() => setShowPanel(p => !p)}>
          {showPanel ? <><I.x size={12}/> Masquer liste</> : <><I.list size={12}/> Afficher liste</>}
        </button>
      </div>

      {/* Map + side panel */}
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {/* Map */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minWidth: 0 }}>
          <MapRegionalLeaflet paroisses={filteredParoisses} />
        </div>

        {/* Side list */}
        {showPanel && (
          <div className="card" style={{ width: 280, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Paroisses ({filteredParoisses.length})
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredParoisses.map((p) => (
                <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.gps ? '#5AC472' : '#FF8A7A', flexShrink: 0 }}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.district} · {p.niveau}</div>
                  </div>
                </div>
              ))}
              {filteredParoisses.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Aucune paroisse correspondante</div>
              )}
            </div>
            {/* GPS legend */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5AC472', flexShrink: 0 }}/> Avec GPS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8A7A', flexShrink: 0 }}/> Sans GPS</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MapRegionalLeaflet({ paroisses }: { paroisses: typeof PAROISSES_MIFI }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    if ((ref.current as any)._leafletInit) return;
    (ref.current as any)._leafletInit = true;

    import('leaflet').then(({ default: L }) => {
      if (!ref.current) return;
      const map = L.map(ref.current, { attributionControl: true }).setView([5.475, 10.418], 10);
      mapRef.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      const regionCoords: [number, number][] = [
        [5.30, 10.20], [5.30, 10.65], [5.65, 10.65], [5.65, 10.20],
      ];
      L.polygon(regionCoords, {
        color: '#5B9BD5', fillColor: 'rgba(91,155,213,0.08)', weight: 2, fillOpacity: 1,
      }).bindTooltip('Région MIFI', { permanent: false }).addTo(map);

      const mockCoords: Record<string, [number, number]> = {
        'Bafoussam-Centre':    [5.475, 10.418],
        'Bafoussam-Plateau':   [5.482, 10.424],
        'Bafoussam-Kamkop':    [5.470, 10.410],
        'Bafoussam-Nord':      [5.495, 10.430],
        'Bafoussam-Tougang':   [5.500, 10.438],
        'Bafoussam-Sud':       [5.460, 10.405],
        'Baham-Centre':        [5.435, 10.367],
        'Baham-Nord':          [5.440, 10.370],
        'Bamendjou':           [5.510, 10.382],
        'Koupan-Centre':       [5.380, 10.310],
        'Bafoussam-Djemoun':   [5.455, 10.400],
        'Bafoussam-Tamdja':    [5.488, 10.435],
        'Kouoptamo Station':   [5.375, 10.305],
      };

      paroisses.filter(p => p.gps).forEach(p => {
        const coords = mockCoords[p.nom] || [5.475 + (Math.random() - 0.5) * 0.1, 10.418 + (Math.random() - 0.5) * 0.1];
        const color = p.niveau === 'PAROISSE' ? '#5AC472' : p.niveau === 'STATION' ? '#5B9BD5' : '#E67A2E';
        const circle = L.circleMarker(coords, {
          radius: p.niveau === 'PAROISSE' ? 8 : 6,
          fillColor: color, color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.9,
        });
        circle.bindTooltip(`<b>${p.nom}</b><br>${p.district} · ${p.niveau}<br>${p.fideles} fidèles`, { direction: 'top', offset: [0, -6] });
        circle.addTo(map);
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; if (ref.current) (ref.current as any)._leafletInit = false; }
    };
  }, []);

  return <div ref={ref} style={{ height: '100%', width: '100%' }} />;
}
