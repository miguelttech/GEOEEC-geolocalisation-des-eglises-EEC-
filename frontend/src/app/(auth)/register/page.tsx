'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const [firstName, setFirstName]   = useState('');
  const [lastName,  setLastName]    = useState('');
  const [email,     setEmail]       = useState('');
  const [password,  setPassword]    = useState('');
  const [confirm,   setConfirm]     = useState('');
  const [showPw,    setShowPw]      = useState(false);
  const [showCf,    setShowCf]      = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState('');
  const [success,   setSuccess]     = useState(false);
  const [shake,     setShake]       = useState(false);
  const [csrf,      setCsrf]        = useState('');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    fetch('/api/auth/csrf/', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCsrf(d.csrfToken ?? ''))
      .catch(() => {});
  }, []);

  const shake600 = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      shake600();
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      shake600();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/visitor/register/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({
          first_name: firstName,
          last_name:  lastName,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Une erreur est survenue. Réessayez.');
        shake600();
        return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/carte'; }, 2000);
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      shake600();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-root">

      {/* ── Panneau gauche : image + citation ── */}
      <div className="ls-left">
        <Image
          src="/images/crucifix.jpg"
          alt=""
          fill
          sizes="50vw"
          className="ls-img"
          priority
        />
        <div className="ls-overlay" />

        <div className="ls-left-body">
          <div className="ls-brand">
            <img src="/logo-eec.png" alt="EEC" style={{width:40,height:40,objectFit:'contain',borderRadius:6,padding:4,background:'rgba(255,255,255,0.12)'}} />
            <div>
              EEC Cameroun
              <small>Plateforme SIG · Visiteurs</small>
            </div>
          </div>
          <div className="ls-quote">
            <q>" Vous n&apos;êtes plus des étrangers ni des gens de passage,</q>
            <q>mais vous êtes <em>concitoyens des saints,</em> membres de la famille de Dieu. "</q>
            <p className="ls-ref">— Éphésiens 2 : 19</p>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="ls-right">
        <div className={`ls-box${shake ? ' ls-shake' : ''}`}>

          <p className="ls-eyebrow">
            <span className="ls-dot" />
            Espace visiteur EEC
          </p>

          <h1 className="ls-h1">Créer votre <em>compte.</em></h1>
          <p className="ls-sub">
            Rejoignez la plateforme et accédez à la carte interactive des
            paroisses, districts et régions synodales de l&apos;EEC Cameroun.
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
                <strong>Compte créé avec succès !</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Redirection vers la carte interactive…
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Prénom + Nom en ligne */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="ls-field">
                  <label htmlFor="rs-fn">Prénom</label>
                  <div className="ls-iw">
                    <IconUser />
                    <input
                      id="rs-fn"
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jean"
                      autoComplete="given-name"
                    />
                  </div>
                </div>

                <div className="ls-field">
                  <label htmlFor="rs-ln">Nom</label>
                  <div className="ls-iw">
                    <IconUser />
                    <input
                      id="rs-ln"
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="ATEBA"
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              <div className="ls-field">
                <label htmlFor="rs-email">Adresse e-mail</label>
                <div className="ls-iw">
                  <IconMail />
                  <input
                    id="rs-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="j.ateba@exemple.cm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="ls-field">
                <label htmlFor="rs-pw">Mot de passe <span style={{ color: 'var(--m)', fontWeight: 400 }}>(8 caractères min.)</span></label>
                <div className="ls-iw">
                  <IconLock />
                  <input
                    id="rs-pw"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="ls-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Masquer' : 'Afficher'}>
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {password.length > 0 && (
                  <PasswordStrength password={password} />
                )}
              </div>

              <div className="ls-field">
                <label htmlFor="rs-cf">Confirmer le mot de passe</label>
                <div className="ls-iw">
                  <IconLock />
                  <input
                    id="rs-cf"
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••••"
                    required
                    autoComplete="new-password"
                    style={{
                      borderColor: confirm.length > 0
                        ? confirm === password ? 'rgba(46,151,68,0.5)' : 'rgba(220,60,40,0.45)'
                        : undefined,
                    }}
                  />
                  <button type="button" className="ls-eye" onClick={() => setShowCf(v => !v)} aria-label={showCf ? 'Masquer' : 'Afficher'}>
                    {showCf ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }} />

              <button
                type="submit"
                disabled={loading || !email || !password || !confirm}
                className="ls-submit"
              >
                {loading
                  ? <span className="ls-spinner" />
                  : <><span>Créer mon compte</span> <IconArrow /></>
                }
              </button>
            </form>
          )}

          <p className="ls-footer">
            Déjà inscrit ?{' '}
            <Link href="/login">Se connecter →</Link>
            <br />
            <Link href="/">← Retour au site public</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Indicateur de force du mot de passe ── */
function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const colors = ['#DC3C28', '#F29900', '#F5C518', '#2E9744', '#1B6B35'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < score ? colors[score] : 'rgba(240,244,241,0.12)',
          transition: 'background 0.3s',
        }} />
      ))}
      <span style={{ fontSize: 10, color: score > 0 ? colors[score] : 'var(--m)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', flexShrink: 0 }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ── Icônes ── */

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
