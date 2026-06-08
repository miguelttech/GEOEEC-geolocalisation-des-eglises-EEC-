'use client';
import React from 'react';
import Link from 'next/link';
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

const NOTIF_ITEMS = [
  { type:'warn',  title:'7 statistiques en attente',  time:'Il y a 12 min', unread:true,  body:'Validation requise pour 7 paroisses' },
  { type:'info',  title:'Import terminé',              time:'Il y a 1 h',   unread:true,  body:'94 ouvriers importés avec succès' },
  { type:'err',   title:'5 GPS hors Cameroun',         time:'Il y a 2 h',   unread:true,  body:'Action recommandée — Audit qualité' },
  { type:'info',  title:'Nouveau compte créé',         time:'Hier',         unread:false, body:'Admin Paroisse ajouté avec succès' },
  { type:'info',  title:'Rapport mensuel disponible',  time:'Hier',         unread:false, body:'Mai 2026 — 553 paroisses' },
];
const NOTIF_COLOR: Record<string, string> = { warn:'#FFB877', err:'#FF6B6B', info:'#5B9BD5', success:'#5AC472' };

function NotifPanel({ onClose }: { onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, onClose);
  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
      background: '#0F1F15', border: '1px solid rgba(245,197,24,0.20)', borderRadius: 8,
      boxShadow: '0 18px 48px rgba(0,0,0,0.6)', zIndex: 70, animation: 'a-cascade 200ms ease both',
    }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Notifications <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(3 non lues)</span></div>
        <button className="btn-ghost btn" style={{ padding: '4px 8px', fontSize: 11 }}>Tout marquer comme lu</button>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {NOTIF_ITEMS.map((n, i) => (
          <div key={i} style={{
            padding: '12px 16px', display: 'flex', gap: 11, alignItems: 'flex-start',
            background: n.unread ? 'rgba(255,214,0,0.045)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.unread ? NOTIF_COLOR[n.type] : 'transparent', marginTop: 7, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: n.unread ? 600 : 500, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <Link href="/admin/journal" onClick={onClose} style={{ fontSize: 12, color: '#5AC472', textDecoration: 'none', fontWeight: 500 }}>
          Voir toutes les notifications →
        </Link>
      </div>
    </div>
  );
}

interface MeUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  role_display: string;
  scope_label: string;
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

  const [openNotif, setOpenNotif] = React.useState(false);
  const [openUser,  setOpenUser]  = React.useState(false);
  const [me, setMe]               = React.useState<MeUser | null>(null);
  const userRef = React.useRef<HTMLDivElement>(null);
  useOutside(userRef, () => setOpenUser(false));

  React.useEffect(() => {
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMe)
      .catch(() => {});
  }, []);

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

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" style={{ width: 34, height: 34, position: 'relative' }} onClick={() => setOpenNotif(o => !o)}>
            <I.bell size={18} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#C62828', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--chrome)' }}>3</span>
          </button>
          {openNotif && <NotifPanel onClose={() => setOpenNotif(false)} />}
        </div>

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
