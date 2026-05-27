// EEC GEO — Components
const { useState, useEffect, useRef } = React;

// — EEC Logo recreated as inline SVG (yellow sail + green EEC + white cross) —
function EECLogo({ size = 44 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" className="logo-mark">
      <defs>
        <linearGradient id="sailGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#F5C518" />
        </linearGradient>
      </defs>
      <path d="M 18 32 Q 80 12 168 22 Q 152 90 144 168 Q 80 110 24 60 Q 14 46 18 32 Z"
      fill="url(#sailGrad)" stroke="#C99A0E" strokeWidth="1.5" />
      <g fill="#0F5A2A" fontFamily="Georgia, serif" fontWeight="900" fontStyle="italic" fontSize="48" letterSpacing="-2">
        <text x="44" y="92">E</text>
        <text x="74" y="92">E</text>
        <text x="104" y="92">C</text>
      </g>
      <path d="M 38 110 Q 70 116 102 108 T 158 102" stroke="#0F5A2A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="80" y="148" fill="#0F5A2A" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="6.5" letterSpacing="1.2" textAnchor="middle">LA MARCHE ENSEMBLE</text>
      <g fill="#FFFFFF" stroke="#E8E1D2" strokeWidth="0.8">
        <rect x="186" y="50" width="14" height="120" rx="1" />
        <rect x="166" y="78" width="54" height="14" rx="1" />
      </g>
    </svg>);

}

// — Navbar —
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#" className="nav-brand">
        <EECLogo size={44} />
        <div>
          <div>EEC Cameroun</div>
          <small>Géolocalisation · SIG</small>
        </div>
      </a>
      <div className="nav-links">
        <a href="#carte">Carte interactive</a>
        <a href="#stats">Statistiques</a>
        <a href="#about">À propos</a>
        <a href="#oeuvres">Nos œuvres</a>
        <a href="#direction">Direction</a>
      </div>
      <a href="#login" className="btn btn-ghost" style={{ backgroundColor: "rgb(54, 113, 10)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
        Connexion Admin
      </a>
    </nav>);

}

// — Hero —
function Particles({ n = 14 }) {
  const items = Array.from({ length: n }).map((_, i) => {
    const left = i * 71 % 100;
    const delay = i * 1.7 % 18;
    const duration = 14 + i % 5 * 2;
    const dx = (i % 3 - 1) * 80;
    const size = 2 + i % 3;
    return (
      <span key={i} className="particle"
      style={{
        left: `${left}%`,
        bottom: '-4px',
        width: `${size}px`, height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        background: i % 3 === 0 ? '#2D9E55' : '#F5C518',
        boxShadow: `0 0 8px ${i % 3 === 0 ? '#2D9E55' : '#F5C518'}`,
        '--dx': `${dx}px`
      }} />);


  });
  return <div className="particles">{items}</div>;
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg" style={{ opacity: "5" }}>
        <img src="assets/crucifix.jpg" alt="" className="hero-bg-img" />
        <div className="hero-bg-vignette"></div>
      </div>
      <Particles n={18} />
      <div className="hero-content">
        <div>
          <span className="hero-eyebrow">
            <span className="dot"></span>
            Plateforme officielle · Église Évangélique du Cameroun
          </span>
          <h1 style={{ fontFamily: "Georgia" }}>
            La carte vivante <br />
            <em>de notre Église</em><br />
            <span className="underline">à travers le Cameroun.</span>
          </h1>
          <p className="lede">
            546 paroisses, 22 régions synodales, une seule communion.
            Cartographiez, consultez et accompagnez chaque assemblée locale —
            du Logone à l'Atlantique.
          </p>
          <div className="hero-cta-row">
            <a href="#carte" className="btn btn-gold">
              Explorer la carte
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
            <a href="#about" className="btn btn-ghost">Notre mission</a>
          </div>
        </div>
        <div className="hero-side">
          <div className="marker-stack">
            <div className="hero-stat-line">
              <div className="num">546</div>
              <div className="lbl">Paroisses cartographiées<br /><span className="mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.7)' }}>418 GÉOLOCALISÉES · 128 EN COURS</span></div>
            </div>
            <div className="hero-stat-line">
              <div className="num">708</div>
              <div className="lbl">Ouvriers ecclésiastiques<br /><span className="mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.7)' }}>PASTEURS · DIACRES · CATÉCHISTES</span></div>
            </div>
            <div className="hero-stat-line">
              <div className="num">22<sup>·</sup></div>
              <div className="lbl">Régions synodales<br /><span className="mono" style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'rgba(245,197,24,0.7)' }}>RÉPARTIES SUR 133 DISTRICTS</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="scroll-cue">
        <span>Faire défiler</span>
        <span className="line"></span>
      </div>
    </section>);

}

// — Animated counter —
function Counter({ to, duration = 1600 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - k, 3);
          setVal(Math.floor(eased * to));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString('fr-FR')}</span>;
}

// — Stats —
function Stats() {
  const cells = [
  { num: 546, label: 'Paroisses cartographiées', tag: 'Réseau national' },
  { num: 708, label: 'Ouvriers actifs', tag: 'Pasteurs · Diacres' },
  { num: 22, label: 'Régions synodales', tag: 'Du Nord à l\'Océan' },
  { num: 133, label: 'Districts', tag: 'Maillage territorial' }];

  return (
    <section className="stats" id="stats">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 01 / Aperçu</div>
            <h2>L'Église en <em>chiffres vivants.</em></h2>
          </div>
          <div className="meta">
            Les données sont mises à jour par les administrateurs régionaux
            et synchronisées en temps réel avec le Synode Général.
          </div>
        </div>
        <div className="stats-grid">
          {cells.map((c, i) =>
          <div className="stat-cell" key={i}>
              <div className="stat-num">
                <Counter to={c.num} />
                {i === 0 && <span className="plus">+</span>}
              </div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-tag">{c.tag}</div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

Object.assign(window, { EECLogo, Navbar, Hero, Stats, Counter });