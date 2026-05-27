'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from './icons';
import { Avatar } from './atoms';

const NAV = [
  { group: 'Principal', items: [
    { key: 'dashboard', label: 'Tableau de bord',   icon: 'dashboard' },
    { key: 'map',       label: 'Carte interactive', icon: 'map' },
  ]},
  { group: 'Gestion des données', items: [
    { key: 'paroisses', label: 'Paroisses',          icon: 'church' },
    { key: 'oeuvres',   label: 'Œuvres',             icon: 'hexagon' },
    { key: 'ouvriers',  label: 'Ouvriers',           icon: 'user' },
    { key: 'regions',   label: 'Régions synodales',  icon: 'compass' },
    { key: 'districts', label: 'Districts',          icon: 'network' },
  ]},
  { group: 'Rapports & données', items: [
    { key: 'stats', label: 'Statistiques',  icon: 'chart' },
    { key: 'io',    label: 'Import / Export', icon: 'swap' },
  ]},
  { group: 'Administration', items: [
    { key: 'comptes', label: 'Comptes utilisateurs', icon: 'users' },
    { key: 'journal', label: "Journal d'activité",   icon: 'list' },
  ]},
];

const EECLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="2" y="2" width="44" height="44" rx="6" fill="#0D2515" stroke="rgba(255,214,0,0.35)" strokeWidth="1.2"/>
    <path d="M24 9v30M14 24h20" stroke="#F0F4F1" strokeWidth="2.4" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="3.5" fill="#2E9744"/>
    <path d="M24 6l1.6 3.2 3.4.4-2.5 2.3.6 3.4-3.1-1.7-3.1 1.7.6-3.4-2.5-2.3 3.4-.4L24 6z" fill="#FFD600" opacity="0.85"/>
  </svg>
);

function activeKey(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean);
  return seg[1] || 'dashboard';
}

export default function Sidebar() {
  const pathname = usePathname();
  const active = activeKey(pathname);

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: 'var(--chrome)',
      borderRight: '1px solid rgba(245,197,24,0.08)',
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ height: 72, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <EECLogo />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span className="fr" style={{ fontSize: 15, color: '#fff', letterSpacing: '0.005em' }}>EEC Cameroun</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>Console Synodale</span>
        </div>
      </div>

      {/* Admin user */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Avatar initials="JE" size={38} bg="rgba(46,151,68,0.25)" color="#5AC472" ringColor="rgba(46,151,68,0.50)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Jean-Paul ESSOMBA</span>
          <span className="pill pill-gold" style={{ alignSelf: 'flex-start', padding: '2px 6px' }}>Super Admin</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '4px 0 18px', overflowY: 'auto' }}>
        {NAV.map((g, gi) => (
          <div key={gi}>
            <div className="nav-group-label">{g.group}</div>
            {g.items.map(it => {
              const Ic = I[it.icon];
              const isActive = active === it.key;
              return (
                <Link key={it.key} href={`/admin/${it.key}`} style={{ textDecoration: 'none' }}>
                  <div className={'nav-item' + (isActive ? ' active' : '')}>
                    <span className="ni-icon">{Ic && <Ic size={17} />}</span>
                    <span>{it.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Système */}
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
          <div className="nav-group-label">Système</div>
          <Link href="/admin/parametres" style={{ textDecoration: 'none' }}>
            <div className={'nav-item' + (active === 'parametres' ? ' active' : '')}>
              <span className="ni-icon"><I.gear size={17} /></span>
              <span>Paramètres</span>
            </div>
          </Link>
          <Link href="/api/auth/logout" style={{ textDecoration: 'none' }}>
            <div className="nav-item danger" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6 }}>
              <span className="ni-icon"><I.logout size={17} /></span>
              <span>Déconnexion</span>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
