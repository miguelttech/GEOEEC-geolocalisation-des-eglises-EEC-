'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

export default function ResetPasswordPage() {
  const params                    = useParams<{ uid: string; token: string }>();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [shake,     setShake]     = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const shake600 = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères.');
      shake600(); return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      shake600(); return;
    }

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
      const res = await fetch(`${BACKEND}/api/auth/password-reset/confirm/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({
          uid:              params.uid,
          token:            params.token,
          new_password:     password,
          confirm_password: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Lien invalide ou expiré. Recommencez la procédure.');
        shake600(); return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/login'; }, 3000);
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
            <q>" Sois fort et courageux.</q>
            <q>Car l&apos;Éternel, ton Dieu, <em>est avec toi.</em> "</q>
            <p className="ls-ref">— Josué 1 : 9</p>
          </div>
        </div>
      </div>

      <div className="ls-right">
        <div className={`ls-box${shake ? ' ls-shake' : ''}`}>

          <p className="ls-eyebrow">
            <span className="ls-dot" />
            Réinitialisation du mot de passe
          </p>

          <h1 className="ls-h1">Nouveau <em>mot de passe.</em></h1>
          <p className="ls-sub">
            Choisissez un mot de passe sécurisé d&apos;au moins 12 caractères.
          </p>

          {error && (
            <div className="ls-error" role="alert">
              <IconWarn />
              {error}
            </div>
          )}

          {success ? (
            <div className="ls-success" role="status">
              <IconCheck />
              <div>
                <strong>Mot de passe modifié avec succès !</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Redirection vers la page de connexion dans 3 secondes…
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="ls-field">
                <label htmlFor="rp-pw">Nouveau mot de passe <span style={{ color: 'var(--m)', fontWeight: 400 }}>(12 car. min.)</span></label>
                <div className="ls-iw">
                  <IconLock />
                  <input id="rp-pw" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" required autoComplete="new-password" />
                  <button type="button" className="ls-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Masquer' : 'Afficher'}>
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div className="ls-field">
                <label htmlFor="rp-cf">Confirmer le mot de passe</label>
                <div className="ls-iw">
                  <IconLock />
                  <input
                    id="rp-cf"
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                    style={{ borderColor: confirm.length > 0 ? confirm === password ? 'rgba(46,151,68,0.5)' : 'rgba(220,60,40,0.45)' : undefined }}
                  />
                  <button type="button" className="ls-eye" onClick={() => setShowCf(v => !v)} aria-label={showCf ? 'Masquer' : 'Afficher'}>
                    {showCf ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }} />

              <button type="submit" disabled={loading || !password || !confirm} className="ls-submit">
                {loading ? <span className="ls-spinner" /> : <><span>Réinitialiser le mot de passe</span> <IconArrow /></>}
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
function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
