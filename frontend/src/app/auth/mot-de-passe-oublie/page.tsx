'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthVerse from '@/components/landing/AuthVerse';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

export default function MotDePasseOubliePage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [shake,   setShake]   = useState(false);

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
      const res = await fetch(`${BACKEND}/api/auth/password-reset/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Une erreur est survenue. Réessayez.');
        shake600(); return;
      }
      setSent(true);
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
            <div>EEC Cameroun<small>Géolocalisation · SIG</small></div>
          </div>
          <AuthVerse />
        </div>
      </div>

      <div className="ls-right">
        <div className={`ls-box${shake ? ' ls-shake' : ''}`}>

          <p className="ls-eyebrow">
            <span className="ls-dot" />
            Récupération de compte
          </p>

          <h1 className="ls-h1">Mot de passe <em>oublié.</em></h1>
          <p className="ls-sub">
            Entrez l&apos;adresse e-mail associée à votre compte.
            Nous vous enverrons directement un nouveau mot de passe par e-mail.
          </p>

          {error && (
            <div className="ls-error" role="alert">
              <IconWarn />
              {error}
            </div>
          )}

          {sent ? (
            <div className="ls-success" role="status">
              <IconCheck />
              <div>
                <strong>Demande envoyée !</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Si cet e-mail est associé à un compte actif, un nouveau mot de passe
                  vient de vous être envoyé par e-mail.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="ls-field">
                <label htmlFor="fp-email">Adresse e-mail</label>
                <div className="ls-iw">
                  <IconMail />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="j.ataba@eec.cm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div style={{ marginBottom: 24 }} />
              <button type="submit" disabled={loading || !email} className="ls-submit">
                {loading ? <span className="ls-spinner" /> : <><span>Envoyer un nouveau mot de passe</span> <IconArrow /></>}
              </button>
            </form>
          )}

          <p className="ls-footer">
            <Link href="/login">← Retour à la connexion</Link>
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
function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
