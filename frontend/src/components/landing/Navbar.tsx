'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import EECLogo from './EECLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-brand">
        <EECLogo size={44} />
        <div>
          <div>EEC Cameroun</div>
          <small>Géolocalisation · SIG</small>
        </div>
      </Link>

      <div className="nav-links">
        <Link href="/carte">Carte interactive</Link>
        <a href="#stats">Statistiques</a>
        <a href="#about">À propos</a>
        <a href="#oeuvres">Nos œuvres</a>
        <a href="#direction">Direction</a>
      </div>

      <div className="nav-actions">
        <Link href="/register" className="nav-inscription">
          S&apos;inscrire
        </Link>
        <Link href="/login" className="lp-btn lp-btn-ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Connexion
        </Link>
      </div>
    </nav>
  );
}
