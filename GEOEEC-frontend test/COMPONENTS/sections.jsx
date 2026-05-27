// EEC GEO — Map, Œuvres, About, Direction, CTA, Footer
const { useState: useState2, useEffect: useEffect2, useRef: useRef2 } = React;

// — Stylized Cameroon SVG (simplified outline of the country) —
function CameroonMap({ activeRegion, onRegionHover }) {
  const data = window.EEC_DATA;
  // Cameroon outline — anatomically faithful (Lake Chad tip, narrow waist,
  // wide southern body, Atlantic coast on southwest)
  const cameroonPath = `
    M 56 4
    Q 60 3 64 5
    L 66 9
    Q 67 13 64 16
    L 60 19
    L 58 24
    Q 60 28 64 30
    L 70 34
    Q 73 36 72 40
    L 70 44
    Q 71 48 74 52
    L 78 58
    Q 80 62 79 66
    L 76 72
    L 74 78
    Q 73 82 70 84
    L 60 86
    L 50 86
    L 42 87
    L 36 86
    Q 32 84 30 80
    L 26 75
    L 22 72
    L 19 68
    Q 17 64 19 60
    L 22 57
    Q 21 53 24 50
    L 27 47
    Q 25 43 22 41
    L 19 38
    Q 18 34 22 32
    L 27 30
    Q 30 27 34 28
    L 38 30
    Q 42 28 44 24
    L 46 18
    Q 48 14 52 12
    L 54 8
    Z
  `;

  return (
    <svg viewBox="0 0 100 95" className="map-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="countryGrad" cx="0.4" cy="0.4">
          <stop offset="0%" stopColor="rgba(45,158,85,0.18)"/>
          <stop offset="100%" stopColor="rgba(27,107,53,0.05)"/>
        </radialGradient>
        <filter id="markerGlow">
          <feGaussianBlur stdDeviation="0.8"/>
        </filter>
      </defs>

      {/* Country fill */}
      <path d={cameroonPath} fill="url(#countryGrad)" stroke="rgba(245,197,24,0.4)" strokeWidth="0.3"/>

      {/* Latitude/longitude grid lines for cartographic feel */}
      {[15, 30, 45, 60, 75].map(y => (
        <line key={'h'+y} x1="14" y1={y} x2="84" y2={y} stroke="rgba(245,197,24,0.06)" strokeWidth="0.15" strokeDasharray="0.5 1"/>
      ))}
      {[25, 40, 55, 70].map(x => (
        <line key={'v'+x} x1={x} y1="2" x2={x} y2="90" stroke="rgba(245,197,24,0.06)" strokeWidth="0.15" strokeDasharray="0.5 1"/>
      ))}

      {/* Sub-region clusters (small dots scattered) */}
      {Array.from({ length: 110 }).map((_, i) => {
        const seed = i * 137;
        const x = 22 + (seed % 56);
        const y = 8 + ((seed * 7) % 76);
        return <circle key={'d'+i} cx={x} cy={y} r="0.25" fill="rgba(245,197,24,0.3)" />;
      })}

      {/* Region markers */}
      {data.regions.map((r, i) => {
        const isActive = activeRegion === r.code;
        return (
          <g key={r.code} className="marker"
             onMouseEnter={() => onRegionHover && onRegionHover(r.code)}
             onMouseLeave={() => onRegionHover && onRegionHover(null)}>
            <circle cx={r.x} cy={r.y} r={isActive ? 4.5 : 3} fill={r.color} className="marker-pulse" opacity="0.4" filter="url(#markerGlow)"/>
            <circle cx={r.x} cy={r.y} r={isActive ? 1.6 : 1.1} fill={r.color}/>
            <circle cx={r.x} cy={r.y} r={isActive ? 0.5 : 0.3} fill="white"/>
            {isActive && (
              <>
                <line x1={r.x} y1={r.y} x2={r.x + 8} y2={r.y - 6} stroke={r.color} strokeWidth="0.2"/>
                <text x={r.x + 9} y={r.y - 5.5} fill="white" fontSize="2.2" fontFamily="Inter" fontWeight="500">{r.name}</text>
                <text x={r.x + 9} y={r.y - 3} fill="rgba(245,197,24,0.8)" fontSize="1.6" fontFamily="JetBrains Mono">{r.count} paroisses</text>
              </>
            )}
          </g>
        );
      })}

      {/* Capital marker */}
      <g>
        <circle cx="52" cy="68" r="0.8" fill="#F5C518"/>
        <text x="54" y="69.5" fill="rgba(245,197,24,0.7)" fontSize="2" fontFamily="JetBrains Mono" letterSpacing="0.2">YAOUNDÉ</text>
      </g>
    </svg>
  );
}

function MapSection() {
  const [active, setActive] = useState2(null);
  const data = window.EEC_DATA;
  return (
    <section className="map-section" id="carte">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 02 / Cartographie</div>
            <h2>Du <em>Logone</em> à <em>l'Atlantique,</em><br/>une seule communion.</h2>
          </div>
          <div className="meta">
            Aperçu en direct des 22 régions synodales. Survolez une région pour
            la mettre en évidence — ou cliquez pour ouvrir la carte interactive complète.
          </div>
        </div>
        <div className="map-canvas">
          <div className="map-frame">
            <span className="map-coord-tr">CMR · 6.0°N 12.5°E<br/>ÉCHELLE 1 : 4 800 000</span>
            <CameroonMap activeRegion={active} onRegionHover={setActive}/>
            <span className="map-coord">22 RÉGIONS · 133 DISTRICTS · 546 PAROISSES</span>
            <div className="map-corners"><span></span></div>
          </div>
          <div className="region-list">
            <div className="region-list-head">
              <h4>Régions synodales</h4>
              <span>22 / 22</span>
            </div>
            {data.regions.slice(0, 12).map(r => (
              <div className={`region-row ${active === r.code ? 'active' : ''}`}
                   key={r.code}
                   onMouseEnter={() => setActive(r.code)}
                   onMouseLeave={() => setActive(null)}>
                <span className="swatch" style={{ background: r.color, color: r.color }}></span>
                <div className="name">
                  {r.name}
                  <small>SYNODE · {r.code}</small>
                </div>
                <div className="count">{r.count}</div>
              </div>
            ))}
            <div style={{padding:'16px 24px 4px', fontFamily:'var(--mono)', fontSize:'10.5px', color:'rgba(245,197,24,0.7)', letterSpacing:'0.15em'}}>
              + 10 AUTRES RÉGIONS →
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// — About —
function About() {
  return (
    <section className="about" id="about">
      <div className="wrap">
        <div className="about-grid">
          <div>
            <div className="section-num">— 03 / Notre mission</div>
            <h3>Une Église au service du <em>peuple camerounais</em> depuis 1957.</h3>
            <p>
              Née de l'œuvre missionnaire et profondément enracinée dans la culture
              africaine, l'Église Évangélique du Cameroun rassemble des centaines
              de milliers de fidèles à travers dix régions du pays.
            </p>
            <p>
              Cette plateforme géospatiale rend visible ce maillage — chaque
              paroisse, chaque ouvrier, chaque œuvre sociale — pour mieux
              accompagner la marche commune de l'Église.
            </p>
            <div className="about-pillars">
              <div className="pillar">
                <h5>Mission</h5>
                <p>Annoncer l'Évangile et servir le prochain dans toutes les régions du Cameroun.</p>
              </div>
              <div className="pillar">
                <h5>Vision</h5>
                <p>Une Église visible, connectée, fidèle à sa devise « La Marche Ensemble ».</p>
              </div>
              <div className="pillar">
                <h5>Valeurs</h5>
                <p>Foi, fraternité, transparence et engagement social.</p>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img src="assets/church.png" alt="Église EEC"/>
            <div className="frame"></div>
            <span className="caption">CATHÉDRALE EEC · BAFANG · 1962</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// — Œuvres / Galerie —
function Oeuvres() {
  const tabs = ['Tous', 'Paroisses', 'Écoles', 'Centres médicaux', 'Universités', 'Terrains'];
  const [active, setActive] = useState2('Tous');
  return (
    <section className="oeuvres" id="oeuvres">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 04 / Nos œuvres</div>
            <h2>Plus qu'une Église — <em>une présence</em><br/>au cœur des communautés.</h2>
          </div>
          <div className="meta">
            Écoles, centres médicaux, universités, œuvres agropastorales :
            l'EEC accompagne le développement humain dans 133 districts.
          </div>
        </div>
        <div className="oeuvre-tabs">
          {tabs.map(t => (
            <button key={t} className={active === t ? 'active' : ''} onClick={() => setActive(t)}>{t}</button>
          ))}
        </div>
        <div className="oeuvre-grid">
          <div className="oeuvre-card span-6">
            <img src="assets/church.png" alt=""/>
            <div className="overlay"></div>
            <div className="label">
              <div className="kind">Paroisse · MIFI</div>
              <div className="name">Cathédrale EEC de Bafoussam — Bureau Régional</div>
            </div>
          </div>
          <div className="oeuvre-card span-3-tall">
            <img src="assets/crucifix.jpg" alt=""/>
            <div className="overlay"></div>
            <div className="label">
              <div className="kind">Patrimoine · CENTRE</div>
              <div className="name">Sanctuaire — Yaoundé Mvog-Ada</div>
            </div>
          </div>
          <div className="oeuvre-card span-3-tall">
            <img src="assets/bible.png" alt=""/>
            <div className="overlay"></div>
            <div className="label">
              <div className="kind">Vie spirituelle</div>
              <div className="name">Étude biblique · Districts du Sud-Ouest</div>
            </div>
          </div>
          <div className="span-quote">
            <q>La marche ensemble dans l'Église — c'est savoir où chacun se tient, et avancer d'un même pas.</q>
            <div className="attr">— Devise officielle de l'EEC</div>
          </div>
          <div className="oeuvre-card span-3">
            <img src="assets/church.png" alt=""/>
            <div className="overlay"></div>
            <div className="label">
              <div className="kind">École · MÉNOUA</div>
              <div className="name">Collège EEC Dschang</div>
            </div>
          </div>
          <div className="oeuvre-card span-3">
            <img src="assets/church.png" alt=""/>
            <div className="overlay"></div>
            <div className="label">
              <div className="kind">Médical · LITTORAL</div>
              <div className="name">Hôpital Protestant Douala</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// — Direction —
function Direction() {
  const data = window.EEC_DATA;
  return (
    <section className="direction" id="direction">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 05 / Direction</div>
            <h2>Le <em>Synode Général</em> de l'EEC.</h2>
          </div>
          <div className="meta">
            Élus pour servir l'Église dans la fidélité, le discernement
            et l'unité du témoignage évangélique.
          </div>
        </div>
        <div className="dir-grid">
          {data.direction.map((d, i) => (
            <div className="dir-card" key={i}>
              <div className="dir-portrait">
                <span className="badge">0{i+1}</span>
                <div className="silhouette"></div>
              </div>
              <h4>{d.name}</h4>
              <div className="titre">{d.titre}</div>
              <div className="region">{d.region} · MANDAT 2023–2028</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// — CTA —
function CTABand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="cta-inner">
          <div className="section-num" style={{textAlign:'center', display:'block'}}>— 06 / Rejoindre la plateforme</div>
          <h2>Vous êtes <em>responsable régional,</em> de district ou paroissial ?</h2>
          <p>
            Connectez-vous à votre espace pour mettre à jour les données de votre
            paroisse, ajouter des photos, gérer vos ouvriers et publier vos œuvres.
          </p>
          <div style={{display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap'}}>
            <a href="dashboard.html" className="btn btn-gold">Connexion administrateur</a>
            <a href="carte.html" className="btn btn-ghost">Découvrir la carte publique</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// — Footer —
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <EECLogo size={56}/>
            <p className="footer-brand-text">
              <em>EEC Cameroun.</em><br/>
              La carte vivante de notre Église, pour la marche ensemble.
            </p>
            <div className="footer-meta">
              SIÈGE · BP 89 BAFOUSSAM<br/>
              EEC@SYNODE.CM · +237 233 44 12 89
            </div>
          </div>
          <div>
            <h6>Plateforme</h6>
            <ul>
              <li>Carte interactive</li>
              <li>Statistiques</li>
              <li>Annuaire des paroisses</li>
              <li>Connexion admin</li>
            </ul>
          </div>
          <div>
            <h6>L'Église</h6>
            <ul>
              <li>Notre histoire</li>
              <li>Direction</li>
              <li>Œuvres sociales</li>
              <li>Théologie</li>
            </ul>
          </div>
          <div>
            <h6>Contact</h6>
            <ul>
              <li>Synode Général</li>
              <li>Régions synodales</li>
              <li>Presse & médias</li>
              <li>Faire un don</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ÉGLISE ÉVANGÉLIQUE DU CAMEROUN — SYNODE GÉNÉRAL</span>
          <span>PLATEFORME SIG · v 1.0 · BAFOUSSAM</span>
        </div>
      </div>
    </footer>
  );
}

// — Scripture band (uses Bible image as parallax) —
function ScriptureBand() {
  const ref = useRef2(null);
  useEffect2(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const y = (progress - 0.5) * 120;
      ref.current.style.setProperty('--parallax-y', `${y}px`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="scripture" ref={ref}>
      <div className="scripture-bg">
        <img src="assets/bible.png" alt=""/>
      </div>
      <div className="scripture-inner wrap">
        <div className="section-num" style={{textAlign:'center', display:'block', marginBottom:'20px'}}>— Lumière sur nos pas</div>
        <q className="serif">
          Ta parole est une lampe à mes pieds,<br/>
          <em>et une lumière sur mon sentier.</em>
        </q>
        <div className="scripture-attr">PSAUME 119 : 105</div>
      </div>
    </section>
  );
}

Object.assign(window, { CameroonMap, MapSection, About, Oeuvres, Direction, CTABand, Footer, ScriptureBand });
