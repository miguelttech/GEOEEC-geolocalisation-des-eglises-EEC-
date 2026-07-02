'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { I } from './icons';
import { Avatar, useOutside } from './atoms';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  dashboard:  { title: 'Tableau de bord',        crumb: '/ Tableau de bord' },
  map:        { title: 'Carte interactive',       crumb: '/ Carte interactive' },
  paroisses:  { title: 'Paroisses',               crumb: '/ Paroisses' },
  oeuvres:    { title: 'Œuvres',                  crumb: '/ Œuvres' },
  ouvriers:   { title: 'Ouvriers',                crumb: '/ Ouvriers' },
  regions:    { title: 'Régions synodales',        crumb: '/ Régions' },
  districts:  { title: 'Districts',               crumb: '/ Districts' },
  stats:      { title: 'Statistiques',            crumb: '/ Statistiques' },
  io:         { title: 'Import / Export',         crumb: '/ Import / Export' },
  comptes:    { title: 'Comptes utilisateurs',    crumb: '/ Administration / Comptes' },
  journal:    { title: "Journal d'activité",      crumb: "/ Administration / Journal" },
  parametres: { title: 'Paramètres',              crumb: '/ Paramètres' },
  fiche:      { title: 'Fiche paroisse',          crumb: '/ Fiche paroisse' },
};

const SCOPE_LABELS: Record<string, string> = {
  district: 'Console District',
  paroisse: 'Console Paroisse',
  regional: 'Console Régionale',
};

interface MeUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  role_display: string;
  scope_label: string;
  theme: 'clair' | 'sombre';
}

function initials(u: MeUser | null): string {
  if (!u) return '–';
  const f = (u.first_name || '').trim();
  const l = (u.last_name  || '').trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f)      return f.slice(0, 2).toUpperCase();
  if (u.email) return u.email[0].toUpperCase();
  return '?';
}

function displayName(u: MeUser | null): string {
  if (!u) return '—';
  const f = (u.first_name || '').trim();
  const l = (u.last_name  || '').trim();
  if (f && l) return `${f} ${l}`;
  if (f)      return f;
  return u.email || '—';
}

export default function Topbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const seg    = pathname.split('/').filter(Boolean);
  const scope  = SCOPE_LABELS[seg[1]] ?? 'Console Synodale';
  const key    = seg[seg.length - 1] || 'dashboard';
  const meta   = PAGE_META[key] || { title: 'EEC', crumb: '' };

  const [openUser,  setOpenUser]  = React.useState(false);
  const [me, setMe]               = React.useState<MeUser | null>(null);
  const [theme, setThemeState]    = React.useState<'clair' | 'sombre'>('sombre');
  const userRef = React.useRef<HTMLDivElement>(null);
  useOutside(userRef, () => setOpenUser(false));

  React.useEffect(() => {
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: MeUser) => { setMe(d); setThemeState(d.theme || 'sombre'); })
      .catch(() => {});
  }, []);

  function toggleTheme() {
    const next = theme === 'clair' ? 'sombre' : 'clair';
    setThemeState(next);
    (window as any).__setEECTheme?.(next === 'clair' ? 'light' : 'dark');
  }

  const handleLogout = async () => {
    try {
      const csrf = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' })
        .then(r => r.json()).then(d => d.csrfToken ?? '').catch(() => '');
      await fetch(`${BACKEND}/api/auth/logout/`, {
        method: 'POST', credentials: 'include',
        headers: { 'X-CSRFToken': csrf, 'Content-Type': 'application/json' },
      });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header style={{
      height: 60, background: 'var(--chrome)', borderBottom: '1px solid rgba(245,197,24,0.10)',
      padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 60,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 className="sg" style={{ fontSize: 18, color: 'var(--text)', margin: 0 }}>{meta.title}</h1>
        <div style={{ fontSize: 12, color: 'rgba(240,244,241,0.45)' }}>{scope}{meta.crumb}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 13, color: 'rgba(240,244,241,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.calendar size={14} style={{ opacity: 0.6 }} />
          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* Thème Clair/Sombre */}
        <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={toggleTheme} title={theme === 'clair' ? 'Passer en sombre' : 'Passer en clair'}>
          {theme === 'clair' ? <I.moon size={17} /> : <I.sun size={17} />}
        </button>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div onClick={() => setOpenUser(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px 4px 4px', borderRadius: 6, background: openUser ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
            <Avatar initials={initials(me)} size={34} bg="rgba(46,151,68,0.25)" color="#5AC472" ringColor="rgba(46,151,68,0.50)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>{displayName(me)}</span>
              {me && <span style={{ fontSize: 10, color: 'rgba(240,244,241,0.40)', lineHeight: 1 }}>{me.role_display}</span>}
            </div>
            <I.chevD size={14} style={{ opacity: 0.6, transform: openUser ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </div>
          {openUser && (
            <div className="menu" style={{ top: 'calc(100% + 6px)', right: 0, width: 240 }}>
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{displayName(me)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{me?.email ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#5AC472', marginTop: 3, fontWeight: 500 }}>{me?.scope_label ?? '—'}</div>
              </div>
              <button onClick={() => { setOpenUser(false); router.push('/admin/parametres'); }}>
                <I.user size={14}/>Mon profil
              </button>
              <button onClick={() => { setOpenUser(false); router.push('/admin/parametres'); }}>
                <I.gear size={14}/>Paramètres
              </button>
              <button onClick={() => { setOpenUser(false); router.push('/admin/changer-mot-de-passe'); }}>
                <I.shield size={14}/>Changer le mot de passe
              </button>
              <hr/>
              <button className="danger" onClick={handleLogout}>
                <I.logout size={14}/>Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
