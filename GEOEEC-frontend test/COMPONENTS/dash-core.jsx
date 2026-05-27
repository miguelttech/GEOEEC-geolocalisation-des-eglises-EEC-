// EEC GEO — Dashboard Admin Général
const { useState, useEffect, useRef } = React;

// — Reuse logo from components.jsx — kept inline for standalone load
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sailGradD" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD93D"/>
          <stop offset="100%" stopColor="#F5C518"/>
        </linearGradient>
      </defs>
      <path d="M 18 32 Q 80 12 168 22 Q 152 90 144 168 Q 80 110 24 60 Q 14 46 18 32 Z" fill="url(#sailGradD)" stroke="#C99A0E" strokeWidth="1.5"/>
      <g fill="#0F5A2A" fontFamily="Georgia, serif" fontWeight="900" fontStyle="italic" fontSize="48" letterSpacing="-2">
        <text x="44" y="92">E</text><text x="74" y="92">E</text><text x="104" y="92">C</text>
      </g>
      <g fill="#FFFFFF"><rect x="186" y="50" width="14" height="120" rx="1"/><rect x="166" y="78" width="54" height="14" rx="1"/></g>
    </svg>
  );
}

// Icons
const I = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12 12 3l9 9M5 10v10h14V10"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>,
  church: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2v4M10 4h4M5 22V11l7-4 7 4v11M9 22v-6h6v6M9 14h6"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-4 4-4s2 2 2 4"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21V3M3 21h18M7 17v-6M11 17V8M15 17v-9M19 17v-4"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3H6v18h12V7l-4-4zM14 3v4h4M8 12h8M8 16h8M8 8h2"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3V8zM10 19a2 2 0 0 0 4 0"/></svg>,
  cog: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>,
  sparkles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  tree: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h6M3 12h10M3 18h14M3 6v12"/></svg>,
};

// — Sidebar —
function Sidebar() {
  const [active, setActive] = useState('overview');
  const groups = [
    { label: 'Pilotage', items: [
      { id: 'overview', label: "Vue d'ensemble", icon: I.home },
      { id: 'carte', label: 'Carte SIG', icon: I.map },
      { id: 'stats', label: 'Statistiques', icon: I.chart, badge: '24' },
    ]},
    { label: 'Réseau', items: [
      { id: 'paroisses', label: 'Paroisses', icon: I.church, badge: '546' },
      { id: 'regions', label: 'Régions synodales', icon: I.tree },
      { id: 'ouvriers', label: 'Ouvriers', icon: I.users, badge: '708' },
    ]},
    { label: 'Administration', items: [
      { id: 'comptes', label: 'Comptes & rôles', icon: I.users },
      { id: 'docs', label: 'Documents', icon: I.doc },
      { id: 'audit', label: "Journal d'audit", icon: I.sparkles },
      { id: 'settings', label: 'Paramètres', icon: I.cog },
    ]},
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <Logo size={40}/>
        <div className="name">EEC Cameroun<small>Console synodale</small></div>
      </div>
      <div className="sb-nav">
        {groups.map(g => (
          <React.Fragment key={g.label}>
            <div className="sb-section">{g.label}</div>
            {g.items.map(it => (
              <div key={it.id} className={`sb-link ${active === it.id ? 'active' : ''}`} 
                   onClick={() => {
                     if (it.id === 'carte') window.location.href = 'carte.html';
                     else if (it.id === 'comptes') window.location.href = 'comptes.html';
                     else if (it.id === 'overview') window.location.href = 'dashboard.html';
                     else if (it.id === 'paroisses') window.location.href = 'admin-paroisses.html';
                     else if (it.id === 'regions') window.location.href = 'dashboards.html';
                     else if (it.id === 'docs') window.location.href = 'admin-rapports.html';
                     else if (it.id === 'settings') window.location.href = 'admin-parametres.html';
                     else setActive(it.id);
                   }}>
                {it.icon}
                <span>{it.label}</span>
                {it.badge && <span className="badge">{it.badge}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="sb-foot">
        <div className="sb-avatar">JA</div>
        <div className="who">
          Pasteur ATABA Joël
          <small>SYNODE GÉNÉRAL</small>
        </div>
      </div>
    </aside>
  );
}

// — Topbar —
function Topbar() {
  return (
    <div className="topbar">
      <div className="crumbs">PILOTAGE / <b>VUE D'ENSEMBLE</b></div>
      <div className="search">
        {I.search}
        <input placeholder="Rechercher une paroisse, un ouvrier, une région…"/>
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        <span className="health-pill"><span className="dot"></span>SYNCHRO À JOUR</span>
        <button className="tb-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{I.bell.props.children}</svg><span className="dot"></span></button>
        <button className="tb-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{I.cog.props.children}</svg></button>
      </div>
    </div>
  );
}

// — Counter —
function Counter({ to, duration = 1400, suffix = '' }) {
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
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString('fr-FR')}{suffix}</span>;
}

// — Sparkline —
function Sparkline({ data, color = '#F5C518' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 200, h = 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 6) - 3}`).join(' ');
  const area = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="kpi-spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${color})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
}

// — KPIs —
function KPIs() {
  const cards = [
    { label: 'Paroisses cartographiées', value: 546, unit: '/ 546', delta: '+12 ce trim.', dir: 'up', spark: [420, 440, 458, 470, 489, 510, 528, 546], color: '#F5C518' },
    { label: 'Ouvriers actifs', value: 708, unit: '', delta: '+24 ce mois', dir: 'up', spark: [610, 630, 650, 660, 672, 685, 695, 708], color: '#2D9E55' },
    { label: 'Régions synodales', value: 22, unit: '/ 22', delta: 'Toutes actives', dir: 'up', spark: [22,22,22,22,22,22,22,22], color: '#6FCB95' },
    { label: 'Œuvres recensées', value: 646, unit: '', delta: '+8 cette semaine', dir: 'up', spark: [580, 590, 605, 615, 625, 632, 640, 646], color: '#E8B82D' },
  ];
  return (
    <div className="kpi-row">
      {cards.map((c, i) => (
        <div className="kpi" key={i}>
          <div className="kpi-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>
            {c.label}
          </div>
          <div className="kpi-value">
            <Counter to={c.value}/>
            <span className="unit">{c.unit}</span>
          </div>
          <div className="kpi-trend">
            <span className={`delta ${c.dir}`}>↗ {c.delta.split(' ')[0]}</span>
            <span>{c.delta.split(' ').slice(1).join(' ')}</span>
          </div>
          <Sparkline data={c.spark} color={c.color}/>
        </div>
      ))}
    </div>
  );
}

// — Quick actions —
function QuickActions() {
  const actions = [
    { icon: I.plus, title: 'Ajouter une paroisse', sub: 'Création + géolocalisation' },
    { icon: I.users, title: 'Créer un compte régional', sub: 'Délégation administrateur' },
    { icon: I.download, title: 'Exporter rapport synodal', sub: 'PDF · 88 pages · trim. 2026' },
    { icon: I.filter, title: 'Auditer une région', sub: 'Vérification des données' },
  ];
  return (
    <div className="qa-row">
      {actions.map((a, i) => (
        <div className="qa" key={i}>
          <div className="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{a.icon.props.children}</svg></div>
          <div className="qa-text"><b>{a.title}</b><small>{a.sub}</small></div>
        </div>
      ))}
    </div>
  );
}

window.DashboardCore = { Sidebar, Topbar, KPIs, QuickActions, Counter, Sparkline, Logo, I };
