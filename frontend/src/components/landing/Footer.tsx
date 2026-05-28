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
              La carte vivante de notre Église, pour la marche ensemble.
            </p>
            <div className="footer-meta">
              SIÈGE · BP 89 BAFOUSSAM<br />
              EEC@SYNODE.CM · +237 233 44 12 89
            </div>
          </div>

          <div>
            <h6>Plateforme</h6>
            <ul>
              <li><Link href="/carte">Carte interactive</Link></li>
              <li><Link href="/carte">Statistiques</Link></li>
              <li><Link href="/carte">Annuaire des paroisses</Link></li>
              <li><Link href="/admin">Connexion admin</Link></li>
            </ul>
          </div>

          <div>
            <h6>L&apos;Église</h6>
            <ul>
              <li>Notre histoire</li>
              <li>Direction</li>
              <li>Œuvres sociales</li>
              <li>Théologie</li>
            </ul>
          </div>

          <div>
            <h6>Contact</h6>
            <ul>
              <li>Synode Général</li>
              <li>Régions synodales</li>
              <li>Presse &amp; médias</li>
              <li>Faire un don</li>
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
