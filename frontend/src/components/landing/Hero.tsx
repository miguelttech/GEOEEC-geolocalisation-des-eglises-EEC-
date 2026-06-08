import Link from 'next/link';
import Image from 'next/image';

function Particles({ n = 18 }: { n?: number }) {
  const items = Array.from({ length: n }).map((_, i) => {
    const left     = (i * 71) % 100;
    const delay    = (i * 1.7) % 18;
    const duration = 14 + (i % 5) * 2;
    const dx       = ((i % 3) - 1) * 80;
    const size     = 2 + (i % 3);
    const isGreen  = i % 3 === 0;
    
    return (
      <span
        key={i}
        className="particle"
        style={{
          left:             `${left}%`,
          bottom:           '-4px',
          width:            `${size}px`,
          height:           `${size}px`,
          animationDelay:   `${delay}s`,
          animationDuration:`${duration}s`,
          background:       isGreen ? '#FFFFFF' : '#F5C518',
          boxShadow:        `0 0 8px ${isGreen ? '#FFFFFF' : '#F5C518'}`,
          ['--dx' as string]: `${dx}px`,
        }}
      />
    );
  });
  return <div className="particles">{items}</div>;
}

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <Image
          src="/landing/eglise_beau.png"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
          className="hero-bg-img"
        />
        <div className="hero-bg-vignette" />
      </div>

      <Particles n={18} />

      <div className="hero-content">
        <div>
          <span className="hero-eyebrow">
            <span className="dot" />
            Plateforme officielle · Église Évangélique du Cameroun
          </span>
          <h1>
            Geolocaliser<br />
            <em>votre Église</em><br />
            <span className="underline">à travers le Cameroun.</span>
          </h1>
          <p className="lede">
            553 paroisses, 22 régions synodales, une seule communion.
            Cartographiez, consultez et accompagnez chaque assemblée locale —
            du Logone à l&apos;Atlantique.
          </p>
          <div className="hero-cta-row">
            <Link href="/carte" className="lp-btn lp-btn-gold">
              Explorer la carte
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#about" className="lp-btn lp-btn-ghost">Notre mission</a>
          </div>
        </div>

        <div className="hero-side">
          <div className="marker-stack">
            <div className="hero-stat-line">
              <div className="num">553</div>
              <div className="lbl">
                Paroisses cartographiées<br />
                <span className="lp-mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.65)' }}>
                  402 GÉOLOCALISÉES · 151 EN COURS
                </span>
              </div>
            </div>
            <div className="hero-stat-line">
              <div className="num">685</div>
              <div className="lbl">
                Ouvriers ecclésiastiques<br />
                <span className="lp-mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.65)' }}>
                  PASTEURS · ÉVANGÉLISTES · DÉLÉGUÉS
                </span>
              </div>
            </div>
            <div className="hero-stat-line">
              <div className="num">22<sup>·</sup></div>
              <div className="lbl">
                Régions synodales<br />
                <span className="lp-mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.65)' }}>
                  RÉPARTIES SUR 137 DISTRICTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-cue">
        <span>Faire défiler</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}
