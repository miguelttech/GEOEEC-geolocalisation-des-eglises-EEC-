'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PALETTE, type RegionData } from './LandingMap';

const LandingMap = dynamic(() => import('./LandingMap'), { ssr: false });

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

export default function MapSection() {
  const [regions,    setRegions]    = useState<RegionData[]>([]);
  const [activeNom,  setActiveNom]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch(`${API}/api/geo/regions/`)
      .then(r => r.json())
      .then(data => {
        const regs: RegionData[] = data.features.map((f: any, i: number) => ({
          id:           f.id,
          nom:          f.properties.nom,
          nb_paroisses: f.properties.nb_paroisses ?? 0,
          nb_districts: f.properties.nb_districts ?? 0,
          color:        PALETTE[i % PALETTE.length],
          geometry:     f.geometry,
        }));
        setRegions(regs);
      })
      .catch(() => {/* backend non disponible → map vide */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="map-section" id="carte">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 02 / Cartographie</div>
            <h2 className="lp-serif">
              Du <em>Logone</em> à <em>l&apos;Atlantique,</em><br />une seule communion.
            </h2>
          </div>
          <div className="meta">
            Aperçu des 22 régions synodales. Survolez une région pour la mettre en évidence
            — ou cliquez pour ouvrir la carte interactive complète.
          </div>
        </div>

        <div className="map-canvas">
          {/* Carte Leaflet interactive */}
          <div className="map-frame">
            <span className="map-coord-tr">CMR · 6.0°N 12.5°E<br />ÉCHELLE 1 : 4 800 000</span>

            <div className="map-img-wrap">
              {loading ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(27,107,53,0.5)', fontSize: 13, fontFamily: 'monospace',
                }}>
                  Chargement des régions…
                </div>
              ) : (
                <LandingMap
                  regions={regions}
                  activeNom={activeNom}
                  onHover={setActiveNom}
                />
              )}
            </div>

            <span className="map-coord">
              {regions.length > 0
                ? `${regions.length} RÉGIONS · ${regions.reduce((s, r) => s + r.nb_districts, 0)} DISTRICTS · ${regions.reduce((s, r) => s + r.nb_paroisses, 0)} PAROISSES`
                : '22 RÉGIONS · 137 DISTRICTS · 553 PAROISSES'}
            </span>
            <div className="map-corners"><span /></div>
          </div>

          {/* Liste des régions */}
          <div className="region-list">
            <div className="region-list-head">
              <h4>Régions synodales</h4>
              <span>{regions.length || 22} / 22</span>
            </div>

            {(regions.length > 0 ? regions : FALLBACK_REGIONS).slice(0, 12).map(r => (
              <div
                key={r.nom}
                className={`region-row${activeNom === r.nom ? ' active' : ''}`}
                onMouseEnter={() => setActiveNom(r.nom)}
                onMouseLeave={() => setActiveNom(null)}
              >
                <span className="swatch" style={{ background: r.color }} />
                <div className="rname">
                  {r.nom}
                  <small>SYNODE · {r.nb_districts} DISTRICTS</small>
                </div>
                <div className="rcount">{r.nb_paroisses}</div>
              </div>
            ))}

            <Link href="/carte" className="region-more">
              + {Math.max(0, (regions.length || 22) - 12)} AUTRES RÉGIONS →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Données statiques de secours si le backend est hors ligne
const FALLBACK_REGIONS: RegionData[] = [
  { id:1,  nom:'ADAMAOUA',     nb_paroisses:17, nb_districts:3, color: PALETTE[0],  geometry:null },
  { id:2,  nom:'CENTRE',       nb_paroisses:41, nb_districts:6, color: PALETTE[1],  geometry:null },
  { id:3,  nom:'EST',          nb_paroisses:19, nb_districts:4, color: PALETTE[2],  geometry:null },
  { id:4,  nom:'EXTRÊME-NORD', nb_paroisses:9,  nb_districts:2, color: PALETTE[3],  geometry:null },
  { id:5,  nom:'LITTORAL',     nb_paroisses:38, nb_districts:5, color: PALETTE[4],  geometry:null },
  { id:6,  nom:'NORD',         nb_paroisses:12, nb_districts:3, color: PALETTE[5],  geometry:null },
  { id:7,  nom:'NORD-OUEST',   nb_paroisses:33, nb_districts:4, color: PALETTE[6],  geometry:null },
  { id:8,  nom:'OUEST',        nb_paroisses:44, nb_districts:5, color: PALETTE[7],  geometry:null },
  { id:9,  nom:'SUD',          nb_paroisses:24, nb_districts:4, color: PALETTE[8],  geometry:null },
  { id:10, nom:'SUD-OUEST',    nb_paroisses:29, nb_districts:4, color: PALETTE[9],  geometry:null },
  { id:11, nom:'YAOUNDÉ',      nb_paroisses:26, nb_districts:3, color: PALETTE[10], geometry:null },
  { id:12, nom:'DOUALA',       nb_paroisses:23, nb_districts:3, color: PALETTE[11], geometry:null },
];
