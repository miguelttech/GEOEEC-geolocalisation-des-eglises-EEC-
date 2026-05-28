'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EEC_REGIONS, type Region } from '@/lib/landing-data';

export default function MapSection() {
  const [active, setActive] = useState<string | null>(null);

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
          <div className="map-frame">
            <span className="map-coord-tr">CMR · 6.0°N 12.5°E<br />ÉCHELLE 1 : 4 800 000</span>
            <div className="map-img-wrap">
              <Image
                src="/landing/cameroon-regions.png"
                alt="Carte des régions synodales EEC du Cameroun"
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
              />
            </div>
            <span className="map-coord">22 RÉGIONS · 137 DISTRICTS · 553 PAROISSES</span>
            <div className="map-corners"><span /></div>
          </div>

          <div className="region-list">
            <div className="region-list-head">
              <h4>Régions synodales</h4>
              <span>22 / 22</span>
            </div>
            {EEC_REGIONS.slice(0, 12).map((r: Region) => (
              <div
                key={r.code}
                className={`region-row${active === r.code ? ' active' : ''}`}
                onMouseEnter={() => setActive(r.code)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="swatch" style={{ background: r.color }} />
                <div className="rname">
                  {r.name}
                  <small>SYNODE · {r.code}</small>
                </div>
                <div className="rcount">{r.count}</div>
              </div>
            ))}
            <Link href="/carte" className="region-more">
              + 10 AUTRES RÉGIONS →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
