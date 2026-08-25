import Link from 'next/link';
import Image from 'next/image';

function Particles({ n = 14 }: { n?: number }) {
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
      {/* ── PHOTO (colonne de droite) ────────────────────────────
          Cadre au format 3/4, identique au format du fichier :
          bâtiment entier, aucun rognage, et affichage sous la
          taille native (756px) donc parfaitement net.
          ───────────────────────────────────────────────────────── */}
      <div className="hero-bg">
        <Image
          src="/landing/catédrale.jpeg"
          alt=""
          fill
          priority
          sizes="(max-width: 960px) 100vw, 720px"
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
          className="hero-bg-img"
        />
        <div className="hero-bg-vignette" />
      </div>

      <Particles n={14} />

      <div className="hero-content">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            {/* width/height = dimensions INTRINSÈQUES du fichier (900×843).
                La taille d'affichage est fixée en CSS, jamais ici : c'est ce qui
                évite toute déformation. */}
            <Image
              src="/eec-logo-transparent.png"
              alt=""
              width={900}
              height={843}
              sizes="24px"
              className="eyebrow-logo"
            />
            <span className="dot" />
            Plateforme officielle · Église Évangélique du Cameroun
          </span>
          <h1>
            Géolocalisation<br />
            <em>de l&apos;Église Évangélique</em><br />
            <span className="underline">du Cameroun.</span>
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
                <span className="stat-sub lp-mono">402 GÉOLOCALISÉES · 151 EN COURS</span>
              </div>
            </div>
            <div className="hero-stat-line">
              <div className="num">685</div>
              <div className="lbl">
                Ouvriers ecclésiastiques<br />
                <span className="stat-sub lp-mono">PASTEURS · ÉVANGÉLISTES · DÉLÉGUÉS</span>
              </div>
            </div>
            <div className="hero-stat-line">
              <div className="num">22<sup>·</sup></div>
              <div className="lbl">
                Régions synodales<br />
                <span className="stat-sub lp-mono">RÉPARTIES SUR 137 DISTRICTS</span>
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
