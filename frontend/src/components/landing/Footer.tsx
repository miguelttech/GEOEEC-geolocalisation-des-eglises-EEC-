import Link from 'next/link';
import EECLogo from './EECLogo';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <EECLogo size={56} />
            <p className="footer-brand-text">
              <em>EEC Cameroun.</em><br />
              Geolocaliser votre Église, pour la marche ensemble.
            </p>
            <div className="footer-meta">
              SIÈGE · Douala, Akwa (13 rue Alfred Saker)<br />
              EEC@SYNODE.CM · +237 233 44 12 89<br />
              Site web :{' '}
              <a
                href="https://www.eecmr.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--lp-gold)', textDecoration: 'underline' }}
              >
                www.eecmr.com
              </a>
            </div>
          </div>

          <div>
            <h6>Plateforme</h6>
            <ul>
              <li><Link href="/carte">Carte interactive</Link></li>
              <li><Link href="/#stats">Statistiques</Link></li>
              <li><Link href="/carte">Annuaire des paroisses</Link></li>
              <li><Link href="/login">Connexion admin</Link></li>
            </ul>
          </div>

          <div>
            <h6>L&apos;Église</h6>
            <ul>
              <li><a href="#about">Notre histoire</a></li>
              <li><a href="#direction">Direction</a></li>
              <li><a href="#oeuvres">Œuvres sociales</a></li>
              <li><a href="#about">Théologie</a></li>
            </ul>
          </div>

          <div>
            <h6>Contact</h6>
            <ul>
              <li><a href="mailto:secretariat@eec-cameroun.org">Synode Général</a></li>
              <li><a href="mailto:regions@eec-cameroun.org">Régions synodales</a></li>
              <li><a href="mailto:presse@eec-cameroun.org">Presse &amp; médias</a></li>
              <li><a href="mailto:dons@eec-cameroun.org">Faire un don</a></li>
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
