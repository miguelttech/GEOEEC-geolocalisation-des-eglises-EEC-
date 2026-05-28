import { EEC_DIRECTION } from '@/lib/landing-data';

export default function Direction() {
  return (
    <section className="direction" id="direction">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 05 / Direction</div>
            <h2 className="lp-serif">Le <em>Synode Général</em> de l&apos;EEC.</h2>
          </div>
          <div className="meta">
            Élus pour servir l&apos;Église dans la fidélité, le discernement
            et l&apos;unité du témoignage évangélique.
          </div>
        </div>

        <div className="dir-grid">
          {EEC_DIRECTION.map((d, i) => (
            <div className="dir-card" key={i}>
              <div className="dir-portrait">
                <span className="dir-badge">0{i + 1}</span>
                <div className="dir-silhouette" />
              </div>
              <h4>{d.name}</h4>
              <div className="dir-titre">{d.titre}</div>
              <div className="dir-region">{d.region} · MANDAT 2023–2028</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
