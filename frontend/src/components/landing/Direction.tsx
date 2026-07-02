import Image from 'next/image';
import { EEC_DIRECTION } from '@/lib/landing-data';

export default function Direction() {
  return (
    <section className="direction" id="direction">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 05 / Direction</div>
            <h2 className="lp-serif">Le <em>Synode Général</em> de l&apos;EEC.</h2>
          </div>
          <div className="meta">
            Élus pour servir l&apos;Église dans la fidélité, le discernement
            et l&apos;unité du témoignage évangélique.
          </div>
        </div>

        <div className="dir-grid">
          {EEC_DIRECTION.map((d, i) => (
            <div className="dir-card" key={i}>
              <div className="dir-portrait">
                <span className="dir-badge">0{i + 1}</span>
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
              <div style={{
                fontSize: 10.5,
                fontFamily: 'var(--lp-mono)',
                letterSpacing: '0.15em',
                color: 'rgba(245,197,24,0.60)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                {d.grade}
              </div>
              <h4>{d.name}</h4>
              <div className="dir-titre">{d.titre}</div>
              <div className="dir-region">{d.region ? `${d.region} · ` : ''}MANDAT 2022–2027</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: '1px solid rgba(245,197,24,0.12)',
          textAlign: 'center',
          fontFamily: 'var(--lp-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          color: 'rgba(240,244,241,0.35)',
          textTransform: 'uppercase',
        }}>
          Élu au Synode Général de Bagangté · 29 décembre 2022 · Mandat quinquennal
        </div>
      </div>
    </section>
  );
}
