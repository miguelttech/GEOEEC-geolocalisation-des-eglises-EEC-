// EEC GEO — Main App with Tweaks
const { useState: useS, useEffect: useE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "forest",
  "typoPair": "fraunces-inter",
  "heroTreatment": "cinematic",
  "particles": true,
  "intensity": "medium"
}/*EDITMODE-END*/;

const PALETTES = {
  forest:   { green: '#1B6B35', light: '#2D9E55', deep: '#0D1B12', mid: '#142A1C', soft: '#1F3A28', gold: '#F5C518', goldDeep: '#C99A0E', label: 'Forêt EEC' },
  emerald:  { green: '#0F5A3C', light: '#1F8A5B', deep: '#0A1812', mid: '#0F2018', soft: '#162E22', gold: '#E8B82D', goldDeep: '#B58812', label: 'Émeraude' },
  olive:    { green: '#3D5A2A', light: '#6B8E3D', deep: '#141810', mid: '#1E2418', soft: '#2A3220', gold: '#F0C040', goldDeep: '#B8902C', label: 'Olive sahel' },
  midnight: { green: '#1B6B35', light: '#2D9E55', deep: '#0A0F1A', mid: '#0F1525', soft: '#181F32', gold: '#F5C518', goldDeep: '#C99A0E', label: 'Minuit' },
};

const TYPO_PAIRS = {
  'fraunces-inter':   { serif: '"Fraunces", serif', sans: '"Inter", sans-serif', label: 'Fraunces / Inter' },
  'cormorant-manrope':{ serif: '"Cormorant Garamond", serif', sans: '"Manrope", sans-serif', label: 'Cormorant / Manrope' },
  'playfair-dmsans':  { serif: '"Playfair Display", serif', sans: '"DM Sans", sans-serif', label: 'Playfair / DM Sans' },
  'instrument-inter': { serif: '"Instrument Serif", serif', sans: '"Inter", sans-serif', label: 'Instrument / Inter' },
};

function applyPalette(t) {
  const p = PALETTES[t.palette] || PALETTES.forest;
  const root = document.documentElement.style;
  root.setProperty('--eec-green', p.green);
  root.setProperty('--eec-light', p.light);
  root.setProperty('--eec-green-deep', p.deep);
  root.setProperty('--eec-green-mid', p.mid);
  root.setProperty('--eec-green-soft', p.soft);
  root.setProperty('--eec-gold', p.gold);
  root.setProperty('--eec-gold-deep', p.goldDeep);
  const tp = TYPO_PAIRS[t.typoPair] || TYPO_PAIRS['fraunces-inter'];
  root.setProperty('--serif', tp.serif);
  root.setProperty('--sans', tp.sans);
  document.body.style.fontFamily = tp.sans;
}

function App() {
  const [t, setT] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  useE(() => { applyPalette(t); }, [t.palette, t.typoPair]);

  // Reveal-on-scroll
  useE(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Navbar/>
      <Hero/>
      <div className="reveal"><Stats/></div>
      <div className="reveal"><MapSection/></div>
      <ScriptureBand/>
      <div className="reveal"><About/></div>
      <div className="reveal"><Oeuvres/></div>
      <div className="reveal"><Direction/></div>
      <div className="reveal"><CTABand/></div>
      <Footer/>

      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection title="Palette">
            <window.TweakSelect t={t} setT={setT} k="palette" label="Couleurs" options={Object.keys(PALETTES).map(k => ({ value: k, label: PALETTES[k].label }))}/>
          </window.TweakSection>
          <window.TweakSection title="Typographie">
            <window.TweakSelect t={t} setT={setT} k="typoPair" label="Pairing" options={Object.keys(TYPO_PAIRS).map(k => ({ value: k, label: TYPO_PAIRS[k].label }))}/>
          </window.TweakSection>
          <window.TweakSection title="Hero">
            <window.TweakRadio t={t} setT={setT} k="heroTreatment" label="Style" options={[{value:'cinematic',label:'Cinéma'},{value:'editorial',label:'Édito'}]}/>
            <window.TweakToggle t={t} setT={setT} k="particles" label="Particules dorées"/>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

// Apply palette early
applyPalette(TWEAK_DEFAULTS);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
