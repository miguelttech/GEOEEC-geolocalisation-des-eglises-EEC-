// EEC GEO — Dashboard charts, tables, activity feed
const { useState: useS2, useEffect: useE2, useRef: useR2 } = React;

// — Area chart : croissance des paroisses cartographiées —
function GrowthChart() {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const cart = [428, 442, 458, 471, 485, 498, 510, 518, 524, 532, 540, 546];
  const ouvriers = [614, 625, 638, 650, 658, 668, 678, 685, 692, 698, 703, 708];

  const W = 700, H = 280, P = { l: 36, r: 16, t: 20, b: 36 };
  const yMax = 720, yMin = 380;
  const xStep = (W - P.l - P.r) / (months.length - 1);
  const yScale = v => H - P.b - ((v - yMin) / (yMax - yMin)) * (H - P.t - P.b);

  const linePath = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${P.l + i*xStep} ${yScale(v)}`).join(' ');
  const areaPath = arr => `${linePath(arr)} L ${P.l + (arr.length-1)*xStep} ${H - P.b} L ${P.l} ${H - P.b} Z`;

  const [hoverIdx, setHoverIdx] = useS2(7);

  return (
    <>
      <div className="card-head">
        <div>
          <h3>Croissance du réseau</h3>
          <div className="ch-sub">Paroisses cartographiées vs ouvriers actifs · 12 derniers mois</div>
        </div>
        <div className="card-head-tabs">
          <button>3M</button>
          <button>6M</button>
          <button className="active">12M</button>
          <button>Tout</button>
        </div>
      </div>
      <div className="chart-legend">
        <span><span className="swatch" style={{background:'#F5C518'}}></span>Paroisses</span>
        <span><span className="swatch" style={{background:'#2D9E55'}}></span>Ouvriers</span>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C518" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#F5C518" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D9E55" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#2D9E55" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Y grid */}
          {[400, 500, 600, 700].map(v => (
            <g key={v}>
              <line x1={P.l} x2={W - P.r} y1={yScale(v)} y2={yScale(v)} stroke="rgba(245,197,24,0.06)" strokeDasharray="2 4"/>
              <text x={P.l - 10} y={yScale(v) + 4} fill="rgba(240,244,241,0.4)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">{v}</text>
            </g>
          ))}
          {/* X labels */}
          {months.map((m, i) => (
            <text key={m} x={P.l + i*xStep} y={H - 12} fill="rgba(240,244,241,0.5)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">{m.toUpperCase()}</text>
          ))}
          {/* Areas + lines */}
          <path d={areaPath(ouvriers)} fill="url(#greenArea)"/>
          <path d={areaPath(cart)} fill="url(#goldArea)"/>
          <path d={linePath(ouvriers)} fill="none" stroke="#2D9E55" strokeWidth="1.8"/>
          <path d={linePath(cart)} fill="none" stroke="#F5C518" strokeWidth="2"/>
          {/* Hover indicator */}
          <line x1={P.l + hoverIdx*xStep} x2={P.l + hoverIdx*xStep} y1={P.t} y2={H - P.b}
                stroke="rgba(245,197,24,0.3)" strokeDasharray="2 3"/>
          <circle cx={P.l + hoverIdx*xStep} cy={yScale(cart[hoverIdx])} r="4" fill="#F5C518" stroke="#0A1610" strokeWidth="2"/>
          <circle cx={P.l + hoverIdx*xStep} cy={yScale(ouvriers[hoverIdx])} r="4" fill="#2D9E55" stroke="#0A1610" strokeWidth="2"/>
          {/* Hover overlays */}
          {months.map((_, i) => (
            <rect key={i} x={P.l + i*xStep - xStep/2} y="0" width={xStep} height={H}
                  fill="transparent" onMouseEnter={() => setHoverIdx(i)}/>
          ))}
          {/* Tooltip */}
          <g transform={`translate(${Math.min(P.l + hoverIdx*xStep + 12, W - 130)}, ${P.t + 10})`}>
            <rect width="120" height="56" rx="4" fill="#0A1610" stroke="rgba(245,197,24,0.25)"/>
            <text x="10" y="16" fill="rgba(245,197,24,0.7)" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="0.1em">{months[hoverIdx].toUpperCase()} 2025</text>
            <text x="10" y="32" fill="white" fontSize="11" fontFamily="Inter" fontWeight="500">Paroisses : <tspan fill="#F5C518" fontWeight="600">{cart[hoverIdx]}</tspan></text>
            <text x="10" y="48" fill="white" fontSize="11" fontFamily="Inter" fontWeight="500">Ouvriers : <tspan fill="#2D9E55" fontWeight="600">{ouvriers[hoverIdx]}</tspan></text>
          </g>
        </svg>
      </div>
    </>
  );
}

// — Donut : répartition des œuvres —
function OeuvresDonut() {
  const data = [
    { label: 'Paroisses', value: 546, color: '#F5C518' },
    { label: 'Écoles', value: 187, color: '#2D9E55' },
    { label: 'Centres médicaux', value: 42, color: '#6FCB95' },
    { label: 'Universités', value: 3, color: '#E0A914' },
    { label: 'Œuvres agropastorales', value: 24, color: '#3FB36A' },
    { label: 'Terrains', value: 312, color: '#1B6B35' },
  ];
  const total = data.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  const R = 70, S = 14, C = 90;
  return (
    <>
      <div className="card-head">
        <div>
          <h3>Répartition des œuvres</h3>
          <div className="ch-sub">Tous types · 22 régions · réseau national</div>
        </div>
      </div>
      <div className="card-body">
        <div className="donut-wrap">
          <svg viewBox="0 0 180 180" style={{width: 180, height: 180}}>
            {data.map((d, i) => {
              const frac = d.value / total;
              const startAngle = (acc / total) * 2 * Math.PI - Math.PI/2;
              const endAngle = ((acc + d.value) / total) * 2 * Math.PI - Math.PI/2;
              acc += d.value;
              const x1 = C + R * Math.cos(startAngle);
              const y1 = C + R * Math.sin(startAngle);
              const x2 = C + R * Math.cos(endAngle);
              const y2 = C + R * Math.sin(endAngle);
              const large = frac > 0.5 ? 1 : 0;
              return (
                <path key={i}
                      d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
                      fill="none" stroke={d.color} strokeWidth={S}
                      strokeLinecap="butt"/>
              );
            })}
            <text x={C} y={C - 4} textAnchor="middle" fill="white" fontFamily="Fraunces" fontSize="32" fontWeight="300" letterSpacing="-0.02em">{total.toLocaleString('fr-FR')}</text>
            <text x={C} y={C + 16} textAnchor="middle" fill="rgba(245,197,24,0.7)" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.18em">ŒUVRES TOTALES</text>
          </svg>
          <div className="donut-legend">
            {data.map(d => (
              <div className="row" key={d.label}>
                <span className="swatch" style={{background: d.color}}></span>
                <span>{d.label}</span>
                <span className="num">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// — Activity feed —
function ActivityFeed() {
  const items = [
    { kind: 'gold', text: <><b>Paroisse de Bafang Nord</b> a été créée par Pasteur Mbouna André.</>, sub: 'Région MIFI · Bureau régional', time: 'IL Y A 8 MIN' },
    { kind: 'green', text: <><b>Hôpital Protestant de Douala</b> — 14 photos ajoutées à la galerie.</>, sub: 'Région LITTORAL · Œuvre médicale', time: 'IL Y A 32 MIN' },
    { kind: 'gold', text: <>Mise à jour des coordonnées GPS de <b>17 paroisses</b> du district de Bandjoun.</>, sub: 'Région KOUNG-KHI · Lot synchronisé', time: 'IL Y A 2 H' },
    { kind: 'warn', text: <><b>3 paroisses</b> sont sans bureau régional assigné dans la région ADAMAOUA.</>, sub: 'Action requise · validation manuelle', time: 'IL Y A 4 H' },
    { kind: 'green', text: <>Rév. Pasteur <b>NGAH Émile</b> a publié le rapport trimestriel synodal.</>, sub: 'Document · 88 pages · public', time: 'HIER, 16:42' },
    { kind: 'gold', text: <>Création de <b>12 comptes</b> administrateurs de district.</>, sub: 'Régions OUEST · BAMBOUTOS · MÉNOUA', time: 'HIER, 14:08' },
  ];
  const icons = {
    gold: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>,
    green: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
    warn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M12 4 2 20h20zM12 10v4M12 18v.01"/></svg>,
  };
  return (
    <>
      <div className="card-head">
        <div>
          <h3>Activité du synode</h3>
          <div className="ch-sub">Mises à jour récentes · temps réel</div>
        </div>
        <a href="#" style={{fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em', color: 'var(--eec-gold)', textDecoration: 'none'}}>TOUT VOIR →</a>
      </div>
      <div className="feed">
        {items.map((it, i) => (
          <div className="feed-item" key={i}>
            <div className={`feed-icon ${it.kind}`}>{icons[it.kind]}</div>
            <div className="feed-text">{it.text}<small>{it.sub}</small></div>
            <div className="feed-time">{it.time}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// — Mini-map widget —
function MiniMap() {
  const data = window.EEC_DATA;
  const cameroonPath = `
    M 56 4 Q 60 3 64 5 L 66 9 Q 67 13 64 16 L 60 19 L 58 24
    Q 60 28 64 30 L 70 34 Q 73 36 72 40 L 70 44 Q 71 48 74 52
    L 78 58 Q 80 62 79 66 L 76 72 L 74 78 Q 73 82 70 84
    L 60 86 L 50 86 L 42 87 L 36 86 Q 32 84 30 80 L 26 75 L 22 72
    L 19 68 Q 17 64 19 60 L 22 57 Q 21 53 24 50 L 27 47
    Q 25 43 22 41 L 19 38 Q 18 34 22 32 L 27 30 Q 30 27 34 28
    L 38 30 Q 42 28 44 24 L 46 18 Q 48 14 52 12 L 54 8 Z
  `;
  return (
    <div className="minimap">
      <div className="card-head" style={{padding: 0, marginBottom: 16, borderBottom: 'none'}}>
        <div>
          <h3>Couverture territoriale</h3>
          <div className="ch-sub">22 régions · 133 districts</div>
        </div>
        <span className="health-pill"><span className="dot"></span>418 GÉOLOC.</span>
      </div>
      <svg viewBox="0 0 100 95" className="minimap-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="dashCountry" cx="0.4" cy="0.5">
            <stop offset="0%" stopColor="rgba(45,158,85,0.25)"/>
            <stop offset="100%" stopColor="rgba(27,107,53,0.05)"/>
          </radialGradient>
        </defs>
        {/* lat/lng grid */}
        {[15, 30, 45, 60, 75].map(y => <line key={'h'+y} x1="14" x2="84" y1={y} y2={y} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.5 1"/>)}
        {[25, 40, 55, 70].map(x => <line key={'v'+x} y1="2" y2="90" x1={x} x2={x} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.5 1"/>)}
        <path d={cameroonPath} fill="url(#dashCountry)" stroke="rgba(245,197,24,0.5)" strokeWidth="0.3"/>
        {/* density dots */}
        {Array.from({ length: 130 }).map((_, i) => {
          const seed = i * 137;
          const x = 22 + (seed % 56);
          const y = 8 + ((seed * 7) % 76);
          return <circle key={i} cx={x} cy={y} r="0.3" fill="rgba(245,197,24,0.4)"/>;
        })}
        {data.regions.map(r => (
          <g key={r.code}>
            <circle cx={r.x} cy={r.y} r="2.5" fill={r.color} opacity="0.3" className="marker-pulse"/>
            <circle cx={r.x} cy={r.y} r="1.1" fill={r.color}/>
          </g>
        ))}
        <circle cx="53" cy="70" r="1.4" fill="#F5C518"/>
        <text x="55" y="71.5" fill="rgba(245,197,24,0.8)" fontSize="2.2" fontFamily="JetBrains Mono" letterSpacing="0.1em">YAOUNDÉ</text>
      </svg>
    </div>
  );
}

// — Regions table —
function RegionsTable() {
  const data = window.EEC_DATA;
  const rows = data.regions.slice(0, 8).map(r => ({
    ...r,
    progress: Math.min(100, Math.round((r.count / 60) * 100)),
    bureaux: Math.max(2, Math.round(r.count / 10)),
    statut: r.count > 30 ? 'Actif' : r.count > 18 ? 'En croissance' : 'À renforcer',
  }));
  return (
    <>
      <div className="card-head">
        <div>
          <h3>Régions synodales — performances</h3>
          <div className="ch-sub">22 régions classées par densité paroissiale</div>
        </div>
        <div className="card-head-tabs">
          <button className="active">Toutes</button>
          <button>Actives</button>
          <button>À renforcer</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Région</th>
              <th>Bureaux</th>
              <th>Paroisses</th>
              <th>Couverture</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code}>
                <td>
                  <div className="cell-name">
                    <span className="dot" style={{background: r.color, color: r.color}}></span>
                    <div>
                      <b>{r.name}</b>
                      <small>SYNODE · {r.code}</small>
                    </div>
                  </div>
                </td>
                <td><span style={{fontFamily:'var(--mono)', color:'white'}}>{r.bureaux}</span></td>
                <td><span style={{fontFamily:'var(--serif)', fontSize:'18px', fontWeight:'400'}}>{r.count}</span></td>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div className="bar"><span style={{width: r.progress + '%'}}></span></div>
                    <span style={{fontFamily:'var(--mono)', fontSize:'11px', color:'var(--eec-text-mute)'}}>{r.progress}%</span>
                  </div>
                </td>
                <td>
                  <span className={`tag ${r.statut === 'Actif' ? 'green' : r.statut === 'En croissance' ? 'gold' : 'red'}`}>
                    <span style={{width:'5px', height:'5px', borderRadius:'50%', background:'currentColor'}}></span>
                    {r.statut}
                  </span>
                </td>
                <td>
                  <a href="#" style={{fontFamily:'var(--mono)', fontSize:'11px', letterSpacing:'0.1em', color:'var(--eec-gold)', textDecoration:'none'}}>OUVRIR →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

window.DashWidgets = { GrowthChart, OeuvresDonut, ActivityFeed, MiniMap, RegionsTable };
