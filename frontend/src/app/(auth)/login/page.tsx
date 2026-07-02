'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Appel direct au backend Django — bypass le proxy Next.js (bug Turbopack)
const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const shake600 = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let csrf = '';
    try {
      const r = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' });
      const d = await r.json();
      csrf = d.csrfToken ?? '';
    } catch { /* réseau */ }
    if (!csrf) {
      setError('Erreur de sécurité. Rechargez la page et réessayez.');
      shake600(); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Identifiants incorrects.');
        shake600(); return;
      }
      const role = data.user?.role;
      if (role === 'VISITEUR') {
        window.location.href = '/carte';
      } else if (data.force_password_change) {
        window.location.href = '/admin/changer-mot-de-passe';
      } else {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get('next') || '/admin';
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      shake600();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-root">

      <div className="ls-left">
        <Image src="/images/crucifix.jpg" alt="" fill sizes="50vw" className="ls-img" priority />
        <div className="ls-overlay" />
        <div className="ls-left-body">
          <div className="ls-brand">
            <img src="/logo-eec.png" alt="EEC" style={{ width:40, height:40, objectFit:'contain', borderRadius:6, padding:4, background:'rgba(255,255,255,0.12)' }} />
            <div>EEC Cameroun<small>Console synodale · SIG</small></div>
          </div>
          <div className="ls-quote">
            <q>" Allez, faites de toutes les nations <em>des disciples.</em></q>
            <q>les baptisant au nom du Père, <em>du Fils et du Saint-Esprit. "</em></q>
            <p className="ls-ref">— Matthieu 28 : 19</p>
          </div>
        </div>
      </div>

      <div className="ls-right">
        <div className={`ls-box${shake ? ' ls-shake' : ''}`}>

          <p className="ls-eyebrow">
            <span className="ls-dot" />
            Console synodale EEC
          </p>

          <h1 className="ls-h1">Connexion <em>sécurisée.</em></h1>
          <p className="ls-sub">
            Accédez à votre espace d&apos;administration paroissiale,
            régionale ou synodale.
          </p>

          {error && (
            <div className="ls-error" role="alert">
              <IconWarn />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="ls-field">
              <label htmlFor="ls-email">Adresse e-mail</label>
              <div className="ls-iw">
                <IconMail />
                <input
                  id="ls-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="j.ataba@eec.cm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="ls-field">
              <label htmlFor="ls-pw">Mot de passe</label>
              <div className="ls-iw">
                <IconLock />
                <input
                  id="ls-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="ls-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Masquer' : 'Afficher'}>
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <div className="ls-opts">
              <span />
              <Link href="/auth/mot-de-passe-oublie" style={{ fontSize: 12, color: 'var(--m)', opacity: 0.8 }}>
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="ls-submit">
              {loading
                ? <span className="ls-spinner" />
                : <><span>Se connecter</span> <IconArrow /></>
              }
            </button>
          </form>

          <p className="ls-footer">
            Pas encore de compte ?{' '}
            <Link href="/register">S&apos;inscrire</Link>
            <br />
            <Link href="/">← Retour au site public</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function IconWarn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}
