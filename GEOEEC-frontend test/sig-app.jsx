// EEC GEO — SIG v2 : hover tooltip + bottom drawer + full modal
const { useState: useS, useMemo, useEffect: useE, useRef: useR } = React;
const data = window.EEC_DATA;

const IMGS = ['assets/church.png','assets/crucifix.jpg','assets/bible.png'];

function genParishes() {
  const out = [];
  let id = 1;
  let seed = 42;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(seed) / 0x7fffffff; };
  data.regions.forEach(r => {
    for (let i = 0; i < r.count; i++) {
      const a = rng() * Math.PI * 2;
      const rad = Math.sqrt(rng()) * 3.4;
      const x = r.x + Math.cos(a) * rad;
      const y = r.y + Math.sin(a) * rad;
      const niveau = i===0 ? 'Bureau Régional' : i<3 ? 'Bureau de District' : 'Paroisse';
      const fideles = 200 + Math.floor(rng() * 2200);
      out.push({
        id: id++,
        name: `Paroisse ${r.name.split('-')[0]} ${i+1}`,
        fullName: `Paroisse EEC de ${r.name.split('-')[0]} ${i<3?'Centre':i%2===0?'Nord':'Sud'}`,
        region: r.name, regionCode: r.code, color: r.color,
        x, y, niveau,
        fideles,
        ouvriers: Math.max(2, Math.floor(fideles / 100)),
        oeuvres: ['École','Centre médical','Terrain','Université'].filter(()=>rng()>0.55),
        district: `District ${i%5+1}`,
        founded: 1940 + Math.floor(rng()*60),
        gps: `${(4.5+rng()*4.5).toFixed(4)}°N, ${(9.0+rng()*5.0).toFixed(4)}°E`,
        pasteur: `Pasteur ${['WAMBA','NGOUFFO','TCHOUMI','FOWE','NJOYA','MBOUNA','KAMENI'][Math.floor(rng()*7)]} ${String.fromCharCode(65+Math.floor(rng()*20))}.`,
        photos: [IMGS[i%3], IMGS[(i+1)%3], IMGS[(i+2)%3]],
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

/* ── Bottom Drawer ── */
function BottomDrawer({ parish, onClose, onExpand }) {
  const open = !!parish;
  if (!parish) return null;
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:30,
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.45s cubic-bezier(.2,.7,.3,1)',
    }}>
      {/* Blurred backdrop strip */}
      <div style={{
        position:'absolute', inset:0,
        background:'rgba(8,17,11,0.72)',
        backdropFilter:'blur(18px)',
        WebkitBackdropFilter:'blur(18px)',
        borderTop:'1px solid rgba(245,197,24,0.25)',
      }}/>
      <div style={{position:'relative', zIndex:1, padding:'0 28px 20px', maxWidth:900, margin:'0 auto'}}>
        {/* Handle bar */}
        <div style={{display:'flex', justifyContent:'center', padding:'12px 0 8px'}}>
          <div style={{width:40, height:4, borderRadius:2, background:'rgba(245,197,24,0.3)'}}></div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:24, alignItems:'start'}}>
          {/* Identity */}
          <div>
            <div style={{fontFamily:'var(--mono)', fontSize:'10px', letterSpacing:'0.2em', color:'var(--eec-gold)', marginBottom:8, textTransform:'uppercase'}}>{parish.region} · {parish.niveau}</div>
            <div style={{fontFamily:'var(--serif)', fontSize:'22px', fontWeight:400, color:'white', lineHeight:1.1, marginBottom:8}}>{parish.fullName}</div>
            <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:10}}>
              {parish.oeuvres.map(o=>(
                <span key={o} style={{fontFamily:'var(--mono)', fontSize:'10px', letterSpacing:'0.12em', padding:'3px 9px', borderRadius:4, background:'rgba(245,197,24,0.1)', color:'var(--eec-gold)', border:'1px solid rgba(245,197,24,0.2)'}}>{o}</span>
              ))}
              {parish.oeuvres.length===0 && <span style={{color:'rgba(240,244,241,0.4)', fontSize:'12px'}}>Aucune œuvre enregistrée</span>}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {[
              {l:'Fidèles', v: parish.fideles.toLocaleString('fr-FR')},
              {l:'Ouvriers', v: parish.ouvriers},
              {l:'Fondée', v: parish.founded},
              {l:'District', v: parish.district},
            ].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,0.04)', borderRadius:6, padding:'10px 14px', border:'1px solid rgba(245,197,24,0.08)'}}>
                <div style={{fontFamily:'var(--mono)', fontSize:'9.5px', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(240,244,241,0.5)', marginBottom:4}}>{s.l}</div>
                <div style={{fontFamily:'var(--serif)', fontSize:'20px', fontWeight:400, color:'white'}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Photos strip */}
          <div style={{display:'flex', gap:6}}>
            {parish.photos.map((src, i) => (
              <div key={i} style={{flex:1, aspectRatio:'1/1', borderRadius:6, overflow:'hidden', background:'#0A1610'}}>
                <img src={src} alt="" style={{width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75) saturate(0.85) hue-rotate(50deg)', transition:'transform 0.4s', cursor:'pointer'}}
                  onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
                  onMouseLeave={e=>e.target.style.transform='scale(1)'}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
            <button onClick={onExpand} style={{
              width:44, height:44,
              borderRadius:'50%',
              background:'var(--eec-gold)', border:'none',
              color:'var(--eec-green-deep)',
              fontSize:22, fontWeight:700,
              cursor:'pointer', display:'grid', placeItems:'center',
              transition:'all 0.2s',
              boxShadow:'0 4px 16px rgba(245,197,24,0.3)',
            }}
            onMouseEnter={e=>{e.target.style.transform='scale(1.1)';e.target.style.boxShadow='0 8px 24px rgba(245,197,24,0.45)'}}
            onMouseLeave={e=>{e.target.style.transform='scale(1)';e.target.style.boxShadow='0 4px 16px rgba(245,197,24,0.3)'}}
            title="Voir la fiche complète">+</button>
            <button onClick={onClose} style={{
              width:44, height:44, borderRadius:'50%',
              background:'transparent', border:'1px solid rgba(245,197,24,0.3)',
              color:'var(--eec-text-mute)', fontSize:18,
              cursor:'pointer', display:'grid', placeItems:'center',
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>{e.target.style.borderColor='rgba(245,197,24,0.7)';e.target.style.color='var(--eec-gold)'}}
            onMouseLeave={e=>{e.target.style.borderColor='rgba(245,197,24,0.3)';e.target.style.color='var(--eec-text-mute)'}}
            title="Fermer">×</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Full Modal ── */
function ParishModal({ parish, onClose }) {
  if (!parish) return null;
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(8,17,11,0.88)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'fadeIn 0.35s ease',
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        width:'92vw', maxWidth:900,
        maxHeight:'88vh',
        background:'linear-gradient(180deg, #0F1F16 0%, #08110B 100%)',
        border:'1px solid rgba(245,197,24,0.25)',
        borderRadius:12,
        overflow:'hidden',
        display:'flex', flexDirection:'column',
        boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
        animation:'slideUp 0.4s cubic-bezier(.2,.7,.3,1)',
      }}>
        {/* Modal header */}
        <div style={{
          position:'relative', height:220, overflow:'hidden', flexShrink:0,
        }}>
          <img src={parish.photos[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.38) saturate(0.8) hue-rotate(55deg) contrast(1.1)'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 20%,rgba(8,17,11,0.98) 100%)'}}/>
          <div style={{position:'absolute',bottom:24,left:32,right:32}}>
            <div style={{fontFamily:'var(--mono)',fontSize:'11px',letterSpacing:'0.2em',color:'var(--eec-gold)',marginBottom:8,textTransform:'uppercase'}}>{parish.region} · {parish.niveau} · ID EEC-{parish.regionCode}-{String(parish.id).padStart(3,'0')}</div>
            <div style={{fontFamily:'var(--serif)',fontSize:'clamp(24px,3vw,38px)',fontWeight:400,color:'white',lineHeight:1.05}}>{parish.fullName}</div>
          </div>
          <button onClick={onClose} style={{
            position:'absolute',top:16,right:16,
            width:36,height:36,borderRadius:'50%',
            background:'rgba(8,17,11,0.7)',border:'1px solid rgba(245,197,24,0.3)',
            color:'white',fontSize:18,cursor:'pointer',
            display:'grid',placeItems:'center',
            backdropFilter:'blur(8px)',
          }}>×</button>
        </div>

        {/* Modal body */}
        <div style={{flex:1, overflowY:'auto', padding:'28px 32px 32px'}}>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'rgba(245,197,24,0.1)',borderRadius:8,overflow:'hidden',marginBottom:28}}>
            {[
              {l:'Fidèles',v:parish.fideles.toLocaleString('fr-FR')},
              {l:'Ouvriers',v:parish.ouvriers},
              {l:'Fondée en',v:parish.founded},
              {l:'Œuvres',v:parish.oeuvres.length||0},
            ].map(k=>(
              <div key={k.l} style={{background:'linear-gradient(180deg,#0F1F16,#0A1610)',padding:'18px 20px'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'9.5px',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(245,197,24,0.65)',marginBottom:8}}>{k.l}</div>
                <div style={{fontFamily:'var(--serif)',fontSize:'32px',fontWeight:300,color:'white'}}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            {/* Left */}
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:'10.5px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--eec-gold)',marginBottom:14}}>Identité</div>
              {[
                ['Pasteur titulaire', parish.pasteur],
                ['District', parish.district],
                ['GPS', parish.gps],
                ['Région synodale', parish.region],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(245,197,24,0.06)',fontSize:'13.5px'}}>
                  <span style={{color:'rgba(240,244,241,0.55)',fontFamily:'var(--mono)',fontSize:'10.5px',letterSpacing:'0.12em',textTransform:'uppercase'}}>{k}</span>
                  <span style={{color:'white',fontWeight:500}}>{v}</span>
                </div>
              ))}

              {parish.oeuvres.length > 0 && (
                <>
                  <div style={{fontFamily:'var(--mono)',fontSize:'10.5px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--eec-gold)',marginBottom:12,marginTop:22}}>Œuvres sociales</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {parish.oeuvres.map(o=>(
                      <span key={o} style={{padding:'6px 14px',borderRadius:999,background:'rgba(45,158,85,0.12)',color:'#6FCB95',border:'1px solid rgba(45,158,85,0.25)',fontSize:'12.5px',fontWeight:500}}>{o}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: photos */}
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:'10.5px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--eec-gold)',marginBottom:14}}>Galerie</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {parish.photos.map((src,i)=>(
                  <div key={i} style={{aspectRatio:i===0?'2/1':'4/3',borderRadius:6,overflow:'hidden',gridColumn:i===0?'span 2':'span 1',background:'#0A1610'}}>
                    <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.7) saturate(0.85) hue-rotate(50deg)',transition:'transform 0.5s,filter 0.3s'}}
                      onMouseEnter={e=>{e.target.style.transform='scale(1.05)';e.target.style.filter='brightness(0.9) saturate(1)';}}
                      onMouseLeave={e=>{e.target.style.transform='scale(1)';e.target.style.filter='brightness(0.7) saturate(0.85) hue-rotate(50deg)';}}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:12,marginTop:28,paddingTop:20,borderTop:'1px solid rgba(245,197,24,0.1)'}}>
            <a href="paroisse.html" style={{fontFamily:'var(--sans)',fontSize:'13.5px',fontWeight:600,padding:'11px 24px',borderRadius:999,background:'var(--eec-gold)',color:'var(--eec-green-deep)',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,transition:'all 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FFD93D'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--eec-gold)'}
            >Ouvrir la fiche complète →</a>
            <button onClick={onClose} style={{fontFamily:'var(--sans)',fontSize:'13.5px',fontWeight:500,padding:'11px 24px',borderRadius:999,background:'transparent',color:'var(--eec-gold)',border:'1px solid rgba(245,197,24,0.35)',cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.target.style.background='rgba(245,197,24,0.08)'}}
              onMouseLeave={e=>{e.target.style.background='transparent'}}
            >Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hover tooltip ── */
function HoverTooltip({ parish, mousePos }) {
  if (!parish || !mousePos) return null;
  return (
    <div style={{
      position:'absolute',
      left: mousePos.x + 14,
      top: mousePos.y - 20,
      zIndex:50,
      background:'rgba(8,17,11,0.95)',
      border:'1px solid rgba(245,197,24,0.4)',
      borderRadius:8,
      padding:'10px 14px',
      minWidth:180,
      pointerEvents:'none',
      backdropFilter:'blur(10px)',
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
      animation:'fadeIn 0.15s ease',
    }}>
      <div style={{fontFamily:'var(--serif)',fontSize:'14px',fontWeight:500,color:'white',marginBottom:4,lineHeight:1.2}}>{parish.fullName}</div>
      <div style={{fontFamily:'var(--mono)',fontSize:'10px',letterSpacing:'0.14em',color:'var(--eec-gold)',textTransform:'uppercase',marginBottom:8}}>{parish.region} · {parish.niveau}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div style={{fontSize:'12px',color:'rgba(240,244,241,0.65)'}}>Fidèles<br/><b style={{color:'white',fontFamily:'var(--mono)',fontSize:'13px'}}>{parish.fideles.toLocaleString('fr-FR')}</b></div>
        <div style={{fontSize:'12px',color:'rgba(240,244,241,0.65)'}}>Ouvriers<br/><b style={{color:'white',fontFamily:'var(--mono)',fontSize:'13px'}}>{parish.ouvriers}</b></div>
      </div>
      <div style={{marginTop:8,fontFamily:'var(--mono)',fontSize:'9.5px',color:'rgba(245,197,24,0.6)',letterSpacing:'0.12em'}}>CLIC POUR DÉTAILS</div>
    </div>
  );
}

/* ── Main SIG App ── */
function SIGApp() {
  const [activeRegions, setActiveRegions] = useS(new Set());
  const [niveau, setNiveau] = useS(new Set(['Bureau Régional','Bureau de District','Paroisse']));
  const [oeuvresF, setOeuvresF] = useS(new Set());
  const [minFideles, setMinFideles] = useS(0);
  const [layer, setLayer] = useS('dots');
  const [hover, setHover] = useS(null);
  const [mousePos, setMousePos] = useS(null);
  const [drawer, setDrawer] = useS(null);
  const [modal, setModal] = useS(null);
  const [search, setSearch] = useS('');
  const mainRef = useR(null);

  const filtered = useMemo(() => PARISHES.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.region.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeRegions.size && !activeRegions.has(p.regionCode)) return false;
    if (!niveau.has(p.niveau)) return false;
    if (oeuvresF.size && !p.oeuvres.some(o => oeuvresF.has(o))) return false;
    if (p.fideles < minFideles) return false;
    return true;
  }), [activeRegions, niveau, oeuvresF, minFideles, search]);

  const toggle = (set, val, setter) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const handleMouseMove = (e) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleDotClick = (p) => {
    setDrawer(p);
    setHover(null);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <div className="sig-shell">
        {/* LEFT PANEL */}
        <aside className="sig-panel">
          <div className="sig-panel-head">
            <window.DashboardCore.Logo size={36}/>
            <div className="name">Carte synodale<small>SIG · {filtered.length} PAROISSES</small></div>
          </div>
          <div className="sig-panel-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <input placeholder="Rechercher une paroisse..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="sig-filters">
            <div className="filter-block">
              <h6>Régions <span className="reset" onClick={()=>setActiveRegions(new Set())}>réinitialiser</span></h6>
              <div className="chip-row">
                {data.regions.slice(0,12).map(r=>(
                  <span key={r.code} className={`chip ${activeRegions.has(r.code)?'on':''}`} onClick={()=>toggle(activeRegions, r.code, setActiveRegions)}>{r.name}</span>
                ))}
              </div>
            </div>
            <div className="filter-block">
              <h6>Niveau</h6>
              <div className="chip-row">
                {['Bureau Régional','Bureau de District','Paroisse'].map(n=>(
                  <span key={n} className={`chip ${niveau.has(n)?'on':''}`} onClick={()=>toggle(niveau, n, setNiveau)}>{n}</span>
                ))}
              </div>
            </div>
            <div className="filter-block">
              <h6>Œuvres</h6>
              <div className="chip-row">
                {['École','Centre médical','Terrain','Université'].map(o=>(
                  <span key={o} className={`chip ${oeuvresF.has(o)?'on':''}`} onClick={()=>toggle(oeuvresF, o, setOeuvresF)}>{o}</span>
                ))}
              </div>
            </div>
            <div className="filter-block">
              <h6>Fidèles min.</h6>
              <div className="range-input">
                <span>0</span>
                <input type="range" min="0" max="2000" step="100" value={minFideles} onChange={e=>setMinFideles(+e.target.value)}/>
                <span style={{color:'var(--eec-gold)',fontWeight:500}}>{minFideles}</span>
              </div>
            </div>
          </div>
          <div className="sig-results">
            <div className="sig-results-head">
              <span><span className="count">{filtered.length}</span> RÉSULTATS</span>
              <span className="sort">NOM ↓</span>
            </div>
            {filtered.slice(0,40).map(p=>(
              <div key={p.id} className={`sig-result ${drawer?.id===p.id?'active':''}`}
                   onClick={()=>handleDotClick(p)}>
                <div className="swatch-bar" style={{background:p.color}}></div>
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

        {/* MAP AREA */}
        <main className="sig-main" ref={mainRef} onMouseMove={handleMouseMove}>
          {/* Toolbar */}
          <div className="sig-toolbar">
            <div className="left">
              <a href="dashboard.html" className="breadcrumb" style={{textDecoration:'none'}}>← TABLEAU DE BORD</a>
              <span className="breadcrumb">CARTE / <b>NATIONAL · 22 RÉGIONS</b></span>
            </div>
            <div className="layer-toggles">
              {['dots','clusters','heat'].map(l=>(
                <button key={l} className={layer===l?'on':''} onClick={()=>setLayer(l)}>
                  {l==='dots'?'Points':l==='clusters'?'Clusters':'Densité'}
                </button>
              ))}
            </div>
          </div>

          <div className="sig-zoom-controls">
            <button>+</button><button>−</button>
            <button><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button>
          </div>

          {/* MAP SVG */}
          <svg viewBox="0 0 100 95" className="sig-map-svg" preserveAspectRatio="xMidYMid meet"
               style={{filter: drawer ? 'blur(1px) brightness(0.7)' : 'none', transition:'filter 0.4s'}}>
            <defs>
              <radialGradient id="sigCountry" cx="0.4" cy="0.5">
                <stop offset="0%" stopColor="rgba(45,158,85,0.14)"/>
                <stop offset="100%" stopColor="rgba(27,107,53,0.04)"/>
              </radialGradient>
              <filter id="sigGlow"><feGaussianBlur stdDeviation="1.5"/></filter>
            </defs>
            {[15,30,45,60,75].map(y=><line key={y} x1="14" x2="84" y1={y} y2={y} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.4 1"/>)}
            {[25,40,55,70].map(x=><line key={x} y1="2" y2="90" x1={x} x2={x} stroke="rgba(245,197,24,0.05)" strokeDasharray="0.4 1"/>)}
            <path d={cameroonPath} fill="url(#sigCountry)" stroke="rgba(245,197,24,0.5)" strokeWidth="0.3"/>

            {layer==='heat' && data.regions.map(r=>(
              <circle key={r.code} cx={r.x} cy={r.y} r={Math.sqrt(r.count)*1.5} fill={r.color} opacity="0.25" filter="url(#sigGlow)"/>
            ))}

            {layer==='clusters' && data.regions.map(r=>{
              const n = filtered.filter(p=>p.regionCode===r.code).length;
              if (!n) return null;
              return (
                <g key={r.code} style={{cursor:'pointer'}} onClick={()=>handleDotClick(filtered.find(p=>p.regionCode===r.code))}>
                  <circle cx={r.x} cy={r.y} r={Math.sqrt(n)*0.9+1.5} fill={r.color} opacity="0.22"/>
                  <circle cx={r.x} cy={r.y} r={Math.sqrt(n)*0.6+1.2} fill={r.color}/>
                  <text x={r.x} y={r.y+0.7} fill="white" fontSize="2" fontFamily="Inter" fontWeight="600" textAnchor="middle">{n}</text>
                </g>
              );
            })}

            {layer==='dots' && filtered.map(p=>(
              <circle key={p.id} cx={p.x} cy={p.y} r={drawer?.id===p.id ? 1.2 : 0.6}
                      fill={p.color}
                      opacity={drawer && drawer.id!==p.id ? 0.25 : 0.95}
                      style={{cursor:'pointer', transition:'r 0.2s, opacity 0.3s'}}
                      onMouseEnter={()=>setHover(p)}
                      onMouseLeave={()=>setHover(null)}
                      onClick={()=>handleDotClick(p)}
              />
            ))}

            {drawer && (
              <g>
                <circle cx={drawer.x} cy={drawer.y} r="3.5" fill={drawer.color} opacity="0.25" filter="url(#sigGlow)"/>
                <circle cx={drawer.x} cy={drawer.y} r="1.4" fill={drawer.color}/>
                <circle cx={drawer.x} cy={drawer.y} r="0.5" fill="white"/>
              </g>
            )}

            <circle cx="53" cy="70" r="1.2" fill="#F5C518" stroke="white" strokeWidth="0.2"/>
            <text x="55" y="71.5" fill="rgba(245,197,24,0.85)" fontSize="2" fontFamily="JetBrains Mono" letterSpacing="0.1em">YAOUNDÉ</text>
          </svg>

          {/* Hover tooltip (only when no drawer) */}
          {!drawer && hover && mousePos && <HoverTooltip parish={hover} mousePos={mousePos}/>}

          {/* Legend */}
          <div className="sig-legend">
            <h6>Légende — régions</h6>
            {data.regions.slice(0,6).map(r=>(
              <div className="row" key={r.code}>
                <span className="swatch" style={{background:r.color,color:r.color}}></span>
                <span>{r.name}</span>
                <span className="num">{r.count}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontFamily:'var(--mono)',fontSize:'10px',color:'rgba(245,197,24,0.55)',letterSpacing:'0.1em'}}>+ 16 RÉGIONS</div>
          </div>

          {/* Stats bar */}
          <div className="sig-stats-bar" style={{filter: drawer ? 'blur(1px) opacity(0.5)' : 'none', transition:'filter 0.3s'}}>
            <div className="stat"><span className="v">{filtered.length}</span><span className="l">Affichées</span></div>
            <div className="stat"><span className="v">{filtered.reduce((a,p)=>a+p.fideles,0).toLocaleString('fr-FR')}</span><span className="l">Fidèles</span></div>
            <div className="stat"><span className="v">{filtered.reduce((a,p)=>a+p.ouvriers,0)}</span><span className="l">Ouvriers</span></div>
          </div>

          {/* Instruction hint */}
          {!drawer && (
            <div style={{
              position:'absolute', top:72, left:'50%', transform:'translateX(-50%)',
              fontFamily:'var(--mono)', fontSize:'10.5px', letterSpacing:'0.16em',
              color:'rgba(245,197,24,0.55)', textTransform:'uppercase',
              background:'rgba(8,17,11,0.7)', padding:'6px 14px', borderRadius:999,
              border:'1px solid rgba(245,197,24,0.15)', backdropFilter:'blur(8px)',
              pointerEvents:'none', zIndex:10,
            }}>Survoler pour aperçu · Cliquer pour détails</div>
          )}

          {/* Bottom Drawer */}
          <BottomDrawer parish={drawer} onClose={()=>setDrawer(null)} onExpand={()=>setModal(drawer)}/>
        </main>
      </div>

      {/* Full Modal */}
      {modal && <ParishModal parish={modal} onClose={()=>setModal(null)}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SIGApp/>);
