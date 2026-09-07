import Image from 'next/image';

export default function About() {
  return (
    <section className="about" id="about">
      <div className="wrap">
        <div className="about-grid">
          <div>
            <div className="section-num">— 03 / Notre mission</div>
            <h3>Une Église au service du <em>peuple de DIEU</em> depuis 1957.</h3>
            <p>
              Née de l&apos;œuvre missionnaire et profondément enracinée dans la culture
              africaine, l&apos;Église Évangélique du Cameroun rassemble des centaines
              de milliers de fidèles à travers dix régions du pays.
            </p>
            <p>
              Cette plateforme géospatiale rend visible ce maillage — chaque
              paroisse, chaque ouvrier, chaque œuvre sociale — pour mieux
              accompagner la marche commune de l&apos;Église.
            </p>
            <div className="about-pillars">
              <div className="pillar">
                <h5>Mission</h5>
                <p>Annoncer l&apos;Évangile et servir le prochain dans toutes les régions du Cameroun.</p>
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
            <Image src="/landing/church.png" alt="Église EEC" fill style={{ objectFit: 'cover' }} />
            <div className="frame" />
            <span className="caption">CATHÉDRALE EEC · BAFANG · 1962</span>
          </div>
        </div>
      </div>
    </section>
  );
}
