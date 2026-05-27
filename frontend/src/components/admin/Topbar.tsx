'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { I } from './icons';
import { Avatar, useOutside } from './atoms';

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  dashboard:  { title: 'Tableau de bord',        crumb: 'Accueil / Tableau de bord' },
  map:        { title: 'Carte interactive',       crumb: 'Accueil / Carte interactive' },
  paroisses:  { title: 'Paroisses',               crumb: 'Accueil / Paroisses' },
  oeuvres:    { title: 'Œuvres',                  crumb: 'Accueil / Œuvres' },
  ouvriers:   { title: 'Ouvriers',                crumb: 'Accueil / Ouvriers' },
  regions:    { title: 'Régions synodales',        crumb: 'Accueil / Régions' },
  districts:  { title: 'Districts',               crumb: 'Accueil / Districts' },
  stats:      { title: 'Statistiques',            crumb: 'Accueil / Statistiques' },
  io:         { title: 'Import / Export',         crumb: 'Accueil / Import / Export' },
  comptes:    { title: 'Comptes utilisateurs',    crumb: 'Accueil / Administration / Comptes utilisateurs' },
  journal:    { title: "Journal d'activité",      crumb: "Accueil / Administration / Journal d'activité" },
  parametres: { title: 'Paramètres',              crumb: 'Accueil / Paramètres' },
};

const NOTIF_ITEMS = [
  { type:'warn',  title:'7 statistiques en attente',   time:'Il y a 12 min', unread:true,  body:'Validation requise pour 7 paroisses' },
  { type:'info',  title:'Import terminé',               time:'Il y a 1 h',   unread:true,  body:'94 ouvriers importés par M. BIYA' },
  { type:'err',   title:'5 GPS hors Cameroun',          time:'Il y a 2 h',   unread:true,  body:'Action recommandée — Audit qualité' },
  { type:'info',  title:'Nouveau compte créé',          time:'Hier',         unread:false, body:'Brigitte NKONO — Admin Paroisse' },
  { type:'info',  title:'Rapport mensuel disponible',   time:'Hier',         unread:false, body:'Mai 2026 — 553 paroisses' },
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
        <a style={{ fontSize: 12, color: '#5AC472', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}>Voir toutes les notifications →</a>
      </div>
    </div>
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const seg = pathname.split('/').filter(Boolean);
  const key = seg[1] || 'dashboard';
  const meta = PAGE_META[key] || { title: 'EEC', crumb: 'Accueil' };

  const [openNotif, setOpenNotif] = React.useState(false);
  const [openUser,  setOpenUser]  = React.useState(false);
  const userRef = React.useRef<HTMLDivElement>(null);
  useOutside(userRef, () => setOpenUser(false));

  return (
    <header style={{
      height: 60, background: 'var(--chrome)', borderBottom: '1px solid rgba(245,197,24,0.10)',
      padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 60,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 className="sg" style={{ fontSize: 18, color: 'var(--text)', margin: 0 }}>{meta.title}</h1>
        <div style={{ fontSize: 12, color: 'rgba(240,244,241,0.45)' }}>{meta.crumb}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 13, color: 'rgba(240,244,241,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.calendar size={14} style={{ opacity: 0.6 }} />
          26 mai 2026 — 14:32
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
            <Avatar initials="JE" size={34} bg="rgba(46,151,68,0.25)" color="#5AC472" ringColor="rgba(46,151,68,0.50)" />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>J.-P. Essomba</span>
            <I.chevD size={14} style={{ opacity: 0.6, transform: openUser ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </div>
          {openUser && (
            <div className="menu" style={{ top: 'calc(100% + 6px)', right: 0, width: 220 }}>
              <button><I.user size={14}/>Mon profil</button>
              <button><I.gear size={14}/>Paramètres</button>
              <button><I.shield size={14}/>Sécurité &amp; 2FA</button>
              <hr/>
              <button className="danger"><I.logout size={14}/>Déconnexion</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
