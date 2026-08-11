'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import EECLogo from './EECLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-brand" onClick={closeMenu}>
        <EECLogo size={44} />
        <div>
          <div>GÉOLOCALISATION</div>
          <small>Église Évangélique du Cameroun</small>
        </div>
      </Link>

      <div className={`nav-links${menuOpen ? ' open' : ''}`}>
        <Link href="/carte" onClick={closeMenu}>Carte interactive</Link>
        <a href="#stats" onClick={closeMenu}>Statistiques</a>
        <a href="#about" onClick={closeMenu}>À propos</a>
        <a href="#oeuvres" onClick={closeMenu}>Nos œuvres</a>
        <a href="#direction" onClick={closeMenu}>Direction</a>
        <a href="#news" onClick={closeMenu}>News</a>
        <div className="nav-links-actions">
          <Link href="/register" className="nav-inscription" onClick={closeMenu}>
            S&apos;inscrire
          </Link>
          <Link href="/login" className="lp-btn lp-btn-ghost" onClick={closeMenu}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Connexion
          </Link>
        </div>
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
        <button
          type="button"
          className={`nav-burger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
