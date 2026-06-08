import Link from 'next/link';

export default function CTABand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="cta-inner">
          <div className="section-num" style={{ textAlign: 'center', display: 'block' }}>
            — 06 / Rejoindre la plateforme
          </div>
          <h2 className="lp-serif">
            Vous êtes <em>responsable régional,</em> de district ou paroissial ?
          </h2>
          <p>
            Connectez-vous à votre espace pour mettre à jour les données de votre
            paroisse, ajouter des photos, gérer vos ouvriers et publier vos œuvres.
          </p>
          <div className="cta-btns">
            <Link href="/login" className="lp-btn lp-btn-gold">Connexion administrateur</Link>
            <Link href="/carte" className="lp-btn lp-btn-ghost">Découvrir la carte publique</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
