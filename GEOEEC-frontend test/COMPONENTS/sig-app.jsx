// EEC GEO — SIG full-page (carte interactive complète)
const { useState: useS, useMemo, useEffect: useE } = React;
const data = window.EEC_DATA;

// Generate ~546 fictive parishes spread across regions weighted by region.count
function genParishes() {
  const out = [];
  let id = 1;
  data.regions.forEach(r => {
    const n = r.count;
    for (let i=0; i<n; i++) {
      const a = Math.random()*Math.PI*2;
      const rad = Math.sqrt(Math.random()) * 3.4;
      const x = r.x + Math.cos(a) * rad;
      const y = r.y + Math.sin(a) * rad;
      const niveau = i===0 ? 'Bureau Régional' : i<3 ? 'Bureau de District' : 'Paroisse';
      const fideles = 200 + Math.floor(Math.random()*2200);
      out.push({
        id: id++,
        name: `Paroisse ${r.name.split('-')[0]} ${i+1}`,
        region: r.name, regionCode: r.code, color: r.color,
        x, y, niveau,
        fideles, ouvriers: Math.max(2, Math.floor(fideles/100)),
        oeuvres: ['École','Centre médical','Terrain','Université'].filter(()=>Math.random()>0.5),
        district: `District ${i%5+1}`,
      });
    }
  });
  return out;
}

const PARISHES = genParishes();

const cameroonPath = `
  M 56 4 Q 60 3 64 5 L 66 9 Q 67 13 64 16 L 60 19 L 58 24
  Q 60 28 64 30 L 70 34 Q 73 36 72 40 L 70 44 Q 71 48 74 52
  L 78 58 Q 80 62 79 66 L 76 72 L 74 78 Q 73 82 70 84
  L 60 86 L 50 86 L 42 87 L 36 86 Q 32 84 30 80 L 26 75 L 22 72
  L 19 68 Q 17 64 19 60 L 22 57 Q 21 53 24 50 L 27 47
  Q 25 43 22 41 L 19 38 Q 18 34 22 32 L 27 30 Q 30 27 34 28
  L 38 30 Q 42 28 44 24 L 46 18 Q 48 14 52 12 L 54 8 Z
`;

function SIGApp() {
  const [activeRegions, setActiveRegions] = useS(new Set());
  const [niveau, setNiveau] = useS(new Set(['Bureau Régional','Bureau de District','Paroisse']));
  const [oeuvres, setOeuvres] = useS(new Set());
  const [minFideles, setMinFideles] = useS(0);
  const [layer, setLayer] = useS('dots');
  const [selected, setSelected] = useS(null);
  const [hover, setHover] = useS(null);

  const filtered = useMemo(() => PARISHES.filter(p => {
    if (activeRegions.size && !activeRegions.has(p.regionCode)) return false;
    if (!niveau.has(p.niveau)) return false;
    if (oeuvres.size && !p.oeuvres.some(o => oeuvres.has(o))) return false;
    if (p.fideles < minFideles) return false;
    return true;
  }), [activeRegions, niveau, oeuvres, minFideles]);

  const toggle = (set, val, setter) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const dotR = layer==='clusters' ? 1.8 : 0.55;

  return (
    <div className="sig-shell">
      <aside className="sig-panel">
        <div className="sig-panel-head">
          <window.DashboardCore.Logo size={36}/>
          <div className="name">Carte synodale<small>SIG · 546 PAROISSES</small></div>
        </div>
        <div className="sig-panel-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <input placeholder="Rechercher une paroisse, district..."/>
        </div>
        <div className="sig-filters">
          <div className="filter-block">
            <h6>Régions synodales <span className="reset" onClick={()=>setActiveRegions(new Set())}>réinitialiser</span></h6>
            <div className="chip-row">
              {data.regions.slice(0,12).map(r=>(
                <span key={r.code} className={`chip ${activeRegions.has(r.code)?'on':''}`} onClick={()=>toggle(activeRegions, r.code, setActiveRegions)}>{r.name}</span>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <h6>Niveau hiérarchique</h6>
            <div className="chip-row">
              {['Bureau Régional','Bureau de District','Paroisse'].map(n=>(
                <span key={n} className={`chip ${niveau.has(n)?'on':''}`} onClick={()=>toggle(niveau, n, setNiveau)}>{n}</span>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <h6>Œuvres présentes</h6>
            <div className="chip-row">
              {['École','Centre médical','Terrain','Université'].map(o=>(
                <span key={o} className={`chip ${oeuvres.has(o)?'on':''}`} onClick={()=>toggle(oeuvres, o, setOeuvres)}>{o}</span>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <h6>Fidèles minimum</h6>
            <div className="range-input">
              <span>0</span>
              <input type="range" min="0" max="2000" step="100" value={minFideles} onChange={e=>setMinFideles(+e.target.value)}/>
              <span style={{color:'var(--eec-gold)', fontWeight:500}}>{minFideles}</span>
            </div>
          </div>
        </div>
        <div className="sig-results">
          <div className="sig-results-head">
            <span><span className="count">{filtered.length}</span> RÉSULTATS</span>
            <span className="sort">TRI : NOM ↓</span>
          </div>
          {filtered.slice(0,40).map(p=>(
            <div key={p.id} className={`sig-result ${selected?.id===p.id?'active':''}`} onClick={()=>setSelected(p)}>
              <div className="swatch-bar" style={{background: p.color}}></div>
              <div>
                <h5>{p.name}</h5>
                <div className="det">{p.region} · {p.district}</div>
                <div className="stats-mini">
                  <span><b>{p.fideles.toLocaleString('fr-FR')}</b> fidèles</span>
                  <span><b>{p.ouvriers}</b> ouvriers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="sig-main">
        <div className="sig-toolbar">
          <div className="left">
            <a href="dashboard.html" className="breadcrumb" style={{textDecoration:'none'}}>← TABLEAU DE BORD</a>
            <span className="breadcrumb">CARTE / <b>NATIONAL · 22 RÉGIONS</b></span>
          </div>
          <div className="layer-toggles">
            <button className={layer==='dots'?'on':''} onClick={()=>setLayer('dots')}>Points</button>
            <button className={layer==='clusters'?'on':''} onClick={()=>setLayer('clusters')}>Clusters</button>
            <button className={layer==='heat'?'on':''} onClick={()=>setLayer('heat')}>Densité</button>
          </div>
        </div>

        <div className="sig-zoom-controls">
          <button>+</button>
          <button>−</button>
          <button title="Recentrer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button>
        </div>

        <svg viewBox="0 0 100 95" className="sig-map-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="sigCountry" cx="0.4" cy="0.5">
              <stop offset="0%" stopColor="rgba(45,158,85,0.14)"/>
              <stop offset="100%" stopColor="rgba(27,107,53,0.04)"/>
            </radialGradient>
            <filter id="sigGlow"><feGaussianBlur stdDeviation="1.5"/></filter>
            {layer==='heat' && (
              <radialGradient id="heatG" cx="0.5" cy="0.5">
                <stop offset="0%" stopColor="#F5C518" stopOpacity="0.5"/>
                <stop offset="60%" stopColor="#2D9E55" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#2D9E55" stopOpacity="0"/>
              </radialGradient>
            )}
          </defs>
          {[15,30,45,60,75].map(y=><line key={y} x1="14" x2="84" y1={y} y2={y} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.4 1"/>)}
          {[25,40,55,70].map(x=><line key={x} y1="2" y2="90" x1={x} x2={x} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.4 1"/>)}
          <path d={cameroonPath} fill="url(#sigCountry)" stroke="rgba(245,197,24,0.5)" strokeWidth="0.3"/>

          {layer==='heat' && data.regions.map(r=>(
            <circle key={r.code} cx={r.x} cy={r.y} r={Math.sqrt(r.count)*1.5} fill="url(#heatG)" filter="url(#sigGlow)"/>
          ))}

          {layer==='clusters' && data.regions.map(r=>{
            const visibleCount = filtered.filter(p=>p.regionCode===r.code).length;
            if (!visibleCount) return null;
            return (
              <g key={r.code}>
                <circle cx={r.x} cy={r.y} r={Math.sqrt(visibleCount)*0.9 + 1.5} fill={r.color} opacity="0.25"/>
                <circle cx={r.x} cy={r.y} r={Math.sqrt(visibleCount)*0.6 + 1.2} fill={r.color}/>
                <text x={r.x} y={r.y+0.7} fill="white" fontSize="2" fontFamily="Inter" fontWeight="600" textAnchor="middle">{visibleCount}</text>
              </g>
            );
          })}

          {layer==='dots' && filtered.map(p => (
            <circle key={p.id} cx={p.x} cy={p.y} r={dotR}
                    fill={p.color}
                    opacity={selected && selected.id !== p.id ? 0.35 : 0.95}
                    onMouseEnter={()=>setHover(p)} onMouseLeave={()=>setHover(null)}
                    onClick={()=>setSelected(p)}
                    style={{cursor:'pointer'}}/>
          ))}

          {selected && (
            <g>
              <circle cx={selected.x} cy={selected.y} r="3" fill={selected.color} opacity="0.3" filter="url(#sigGlow)"/>
              <circle cx={selected.x} cy={selected.y} r="1" fill={selected.color}/>
              <circle cx={selected.x} cy={selected.y} r="0.4" fill="white"/>
            </g>
          )}

          <circle cx="53" cy="70" r="1.2" fill="#F5C518" stroke="white" strokeWidth="0.2"/>
          <text x="55" y="71.5" fill="rgba(245,197,24,0.85)" fontSize="2" fontFamily="JetBrains Mono" letterSpacing="0.1em">YAOUNDÉ</text>
        </svg>

        {(hover || selected) && (() => {
          const p = hover || selected;
          return (
            <div className="parish-popover" style={{ left: `calc(${(p.x/100)*100}% + 320px)`, top: `${(p.y/95)*100 - 10}%` }}>
              <h6>{p.name}</h6>
              <div className="meta">{p.region} · {p.niveau}</div>
              <div className="row"><span>Fidèles</span><b>{p.fideles.toLocaleString('fr-FR')}</b></div>
              <div className="row"><span>Ouvriers</span><b>{p.ouvriers}</b></div>
              <div className="row"><span>Œuvres</span><b>{p.oeuvres.length || '—'}</b></div>
              <a href={`paroisse.html?id=${p.id}`} className="popover-link">Voir la fiche complète →</a>
            </div>
          );
        })()}

        <div className="sig-legend">
          <h6>Légende — régions</h6>
          {data.regions.slice(0,6).map(r=>(
            <div className="row" key={r.code}>
              <span className="swatch" style={{background:r.color, color:r.color}}></span>
              <span>{r.name}</span>
              <span className="num">{r.count}</span>
            </div>
          ))}
          <div style={{marginTop:'6px', fontFamily:'var(--mono)', fontSize:'10px', color:'var(--eec-text-mute)', letterSpacing:'0.1em'}}>+ 16 RÉGIONS →</div>
        </div>

        <div className="sig-stats-bar">
          <div className="stat"><span className="v">{filtered.length}</span><span className="l">Affichées</span></div>
          <div className="stat"><span className="v">{filtered.reduce((a,p)=>a+p.fideles,0).toLocaleString('fr-FR')}</span><span className="l">Fidèles</span></div>
          <div className="stat"><span className="v">{filtered.reduce((a,p)=>a+p.ouvriers,0)}</span><span className="l">Ouvriers</span></div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SIGApp/>);
