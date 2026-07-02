'use client';

import React from 'react';
import 'leaflet/dist/leaflet.css';

// 22 couleurs vraiment distinctes — spectre complet, aucune paire similaire
export const PALETTE = [
  '#E63946', // rouge vif
  '#2196F3', // bleu
  '#FF9800', // orange
  '#4CAF50', // vert
  '#9C27B0', // violet
  '#FFEB3B', // jaune
  '#F06292', // rose
  '#00BCD4', // cyan
  '#795548', // brun
  '#3F51B5', // indigo
  '#FF5722', // rouge-orange
  '#8BC34A', // vert lime
  '#E91E63', // magenta
  '#03A9F4', // bleu clair
  '#FFC107', // ambre
  '#009688', // teal
  '#673AB7', // violet foncé
  '#FF6F00', // orange foncé
  '#1565C0', // bleu foncé
  '#2E7D32', // vert foncé
  '#AD1457', // rose foncé
  '#00695C', // teal foncé
];

export interface RegionData {
  id: number;
  nom: string;
  nb_paroisses: number;
  nb_districts: number;
  color: string;
  geometry: any;
}

interface Props {
  regions: RegionData[];
  activeNom: string | null;
  onHover: (nom: string | null) => void;
}

export default function LandingMap({ regions, activeNom, onHover }: Props) {
  const ref      = React.useRef<HTMLDivElement>(null);
  const mapRef   = React.useRef<any>(null);
  const layerMap = React.useRef<Map<string, any>>(new Map());

  // Initialise la carte une seule fois
  React.useEffect(() => {
    if (!ref.current || mapRef.current) return;

    import('leaflet').then(({ default: L }) => {
      if (!ref.current || mapRef.current) return;

      // Fond neutre correspondant à la page (pas de tuiles)
      ref.current.style.background = '#F4F4F1';
      ref.current.style.height = '100%';
      ref.current.style.width  = '100%';

      const map = L.map(ref.current, {
        zoomControl:        false,
        attributionControl: false,
        dragging:           false,
        scrollWheelZoom:    false,
        doubleClickZoom:    false,
        touchZoom:          false,
        boxZoom:            false,
      });

      mapRef.current = map;

      if (regions.length > 0) addRegions(L, map, regions, onHover);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ajoute / met à jour les couches quand les données arrivent
  React.useEffect(() => {
    if (!mapRef.current || regions.length === 0) return;
    import('leaflet').then(({ default: L }) => {
      addRegions(L, mapRef.current, regions, onHover);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions]);

  // Highlight depuis la liste externe
  React.useEffect(() => {
    layerMap.current.forEach((layer, nom) => {
      const isActive = nom === activeNom;
      layer.setStyle({
        fillOpacity: isActive ? 1 : 0.85,
        weight:      isActive ? 3 : 1,
        color:       isActive ? '#fff' : 'rgba(255,255,255,0.7)',
      });
      if (isActive) layer.bringToFront();
    });
  }, [activeNom]);

  function addRegions(L: any, map: any, regs: RegionData[], onHov: (n: string | null) => void) {
    layerMap.current.forEach(l => l.remove());
    layerMap.current.clear();

    let combined: any = null;

    regs.forEach(region => {
      const layer = L.geoJSON(region.geometry, {
        style: {
          color:       'rgba(255,255,255,0.7)',
          weight:      1,
          fillColor:   region.color,
          fillOpacity: 0.85,
        },
      });

      layer.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.6;padding:2px 4px">
           <strong style="color:${region.color}">${region.nom}</strong><br>
           ${region.nb_paroisses} paroisses &nbsp;·&nbsp; ${region.nb_districts} districts
         </div>`,
        { sticky: true, opacity: 0.97 }
      );

      layer.on('mouseover', () => onHov(region.nom));
      layer.on('mouseout',  () => onHov(null));

      layer.addTo(map);
      layerMap.current.set(region.nom, layer);

      const b = layer.getBounds();
      combined = combined ? combined.extend(b) : b;
    });

    // Force le recalcul de la taille du conteneur, puis zoom sur le Cameroun
    // (délai court pour que le layout soit finalisé par le navigateur)
    if (combined) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(combined, { padding: [6, 6], animate: false });
      }, 80);
    }
  }

  return (
    <div
      ref={ref}
      style={{ height: '100%', width: '100%', background: '#F4F4F1' }}
    />
  );
}
