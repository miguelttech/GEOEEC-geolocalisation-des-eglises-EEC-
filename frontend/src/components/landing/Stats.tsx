import Counter from './Counter';

const CELLS = [
  { num: 553,  label: 'Paroisses cartographiées', tag: 'Réseau national',       plus: true  },
  { num: 685,  label: 'Ouvriers actifs',           tag: 'Pasteurs · Évangélistes', plus: false },
  { num: 22,   label: 'Régions synodales',          tag: "Du Nord à l'Océan",   plus: false },
  { num: 137,  label: 'Districts',                  tag: 'Maillage territorial', plus: false },
];

export default function Stats() {
  return (
    <section className="lp-stats" id="stats">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 01 / Aperçu</div>
            <h2 className="lp-serif">L&apos;Église en <em>chiffres vivants.</em></h2>
          </div>
          <div className="meta">
            Les données sont mises à jour par les administrateurs régionaux
            et synchronisées avec le Synode Général.
          </div>
        </div>
        <div className="stats-grid">
          {CELLS.map((c, i) => (
            <div className="stat-cell" key={i}>
              <div className="stat-num">
                <Counter to={c.num} />
                {c.plus && <span className="plus">+</span>}
              </div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-tag">{c.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
