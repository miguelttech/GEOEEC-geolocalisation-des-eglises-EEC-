'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/* ── Calcul du niveau de sécurité du mot de passe (0..4) ── */
function strengthScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ['', 'Faible', 'Passable', 'Bon', 'Fort'];
const STRENGTH_COLORS = ['', '#D93025', '#F29900', '#FFD600', '#2E9744'];

export default function ChangerMotDePassePage() {
  const router = useRouter();

  const [oldPw,     setOldPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld,   setShowOld]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [csrf,      setCsrf]      = useState('');
  const [shake,     setShake]     = useState(false);

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

  const strength       = strengthScore(newPw);
  const passwordsMatch = confirmPw.length > 0 && newPw === confirmPw;

  const shake600 = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError('Les mots de passe ne correspondent pas.');
      shake600();
      return;
    }
    if (newPw.length < 12) {
      setError('Le nouveau mot de passe doit contenir au moins 12 caractères.');
      shake600();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/change-password/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({
          old_password:     oldPw,
          new_password:     newPw,
          confirm_password: confirmPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Une erreur est survenue.');
        shake600();
        return;
      }
      setSuccess(true);
      setTimeout(() => router.replace('/admin'), 2200);
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      shake600();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-root">

      {/* ── Panneau gauche ── */}
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
            <img
              src="/logo-eec.png"
              alt="EEC"
              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6,
                       padding: 4, background: 'rgba(255,255,255,0.12)' }}
            />
            <div>
              EEC Cameroun
              <small>Console synodale · SIG</small>
            </div>
          </div>
          <div className="ls-quote">
            <q>&ldquo; Je suis la vigne, vous êtes les sarments.</q>
            <q>Celui qui demeure en moi porte <em>beaucoup de fruit.</em> &rdquo;</q>
            <p className="ls-ref">— Jean 15 : 5</p>
          </div>
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="ls-right">
        <div className={`ls-box${shake ? ' ls-shake' : ''}`}>

          <p className="ls-eyebrow">
            <span className="ls-dot" />
            Sécurisez votre accès
          </p>

          <h1 className="ls-h1">Définissez votre <em>mot de passe.</em></h1>
          <p className="ls-sub">
            Ce compte utilise un mot de passe temporaire.
            Définissez votre mot de passe personnel avant de continuer.
          </p>

          {success && (
            <div className="cp-success" role="status">
              <IconCheck />
              Mot de passe défini avec succès. Redirection en cours…
            </div>
          )}

          {error && (
            <div className="ls-error" role="alert">
              <IconWarn />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Mot de passe temporaire */}
            <div className="ls-field">
              <label htmlFor="cp-old">Mot de passe temporaire</label>
              <div className="ls-iw">
                <IconLock />
                <input
                  id="cp-old"
                  type={showOld ? 'text' : 'password'}
                  value={oldPw}
                  onChange={e => setOldPw(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="ls-eye"
                  onClick={() => setShowOld(v => !v)}
                  aria-label={showOld ? 'Masquer' : 'Afficher'}>
                  {showOld ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="ls-field">
              <label htmlFor="cp-new">Nouveau mot de passe</label>
              <div className="ls-iw">
                <IconKey />
                <input
                  id="cp-new"
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="12 caractères minimum"
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="ls-eye"
                  onClick={() => setShowNew(v => !v)}
                  aria-label={showNew ? 'Masquer' : 'Afficher'}>
                  {showNew ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {newPw && (
                <>
                  <div className="cp-strength-bars" role="progressbar"
                    aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4}>
                    {([1, 2, 3, 4] as const).map(i => (
                      <div
                        key={i}
                        className={`cp-bar${i <= strength ? ` cp-l${strength}` : ''}`}
                      />
                    ))}
                  </div>
                  <p className="cp-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                    {strength < 3 && strength > 0
                      ? ' — ajoutez majuscules, chiffres et symboles'
                      : ''}
                  </p>
                </>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div className="ls-field">
              <label htmlFor="cp-conf">Confirmer le mot de passe</label>
              <div className="ls-iw">
                <IconLock />
                <input
                  id="cp-conf"
                  type={showConf ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="ls-eye"
                  onClick={() => setShowConf(v => !v)}
                  aria-label={showConf ? 'Masquer' : 'Afficher'}>
                  {showConf ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {confirmPw && (
                <p className={`cp-match${passwordsMatch ? ' ok' : ' bad'}`}>
                  {passwordsMatch
                    ? '✓ Les mots de passe correspondent'
                    : '✗ Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="ls-submit"
            >
              {loading
                ? <span className="ls-spinner" />
                : <><span>Définir mon mot de passe</span> <IconArrow /></>}
            </button>
          </form>

          <p className="ls-footer">
            Besoin d&apos;aide ?{' '}
            <a href="mailto:secretariat@eec-cameroun.org">
              Contacter le Secrétariat Général
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Icônes ── */

function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l2 2M17.5 5.5l2 2" />
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
