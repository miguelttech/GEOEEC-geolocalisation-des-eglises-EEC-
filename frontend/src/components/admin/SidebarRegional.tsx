'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from './icons';
import { Avatar } from './atoms';

const NAV = [
  { group: 'Ma région', items: [
    { key: 'dashboard', label: 'Tableau de bord',   icon: 'dashboard' },
    { key: 'map',       label: 'Carte régionale',   icon: 'map' },
  ]},
  { group: 'Gestion des données', items: [
    { key: 'paroisses', label: 'Paroisses',          icon: 'church' },
    { key: 'oeuvres',   label: 'Œuvres',             icon: 'hexagon' },
    { key: 'ouvriers',  label: 'Ouvriers',           icon: 'user' },
    { key: 'districts', label: 'Districts',          icon: 'network' },
  ]},
  { group: 'Rapports & données', items: [
    { key: 'stats', label: 'Statistiques',    icon: 'chart' },
    { key: 'io',    label: 'Import / Export', icon: 'swap' },
  ]},
  { group: 'Administration', items: [
    { key: 'comptes', label: 'Comptes utilisateurs', icon: 'users' },
    { key: 'journal', label: "Journal d'activité",   icon: 'list' },
  ]},
];

const EECLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="2" y="2" width="44" height="44" rx="6" fill="#0D2040" stroke="rgba(91,155,213,0.35)" strokeWidth="1.2"/>
    <path d="M24 9v30M14 24h20" stroke="#F0F4F1" strokeWidth="2.4" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="3.5" fill="#5B9BD5"/>
    <path d="M24 6l1.6 3.2 3.4.4-2.5 2.3.6 3.4-3.1-1.7-3.1 1.7.6-3.4-2.5-2.3 3.4-.4L24 6z" fill="#5B9BD5" opacity="0.85"/>
  </svg>
);

function activeKey(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean);
  return seg[2] || 'dashboard';
}

export default function SidebarRegional() {
  const pathname = usePathname();
  const active = activeKey(pathname);

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: 'var(--chrome)',
      borderRight: '1px solid rgba(91,155,213,0.10)',
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ height: 72, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <EECLogo />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span className="fr" style={{ fontSize: 15, color: '#fff', letterSpacing: '0.005em' }}>EEC Cameroun</span>
          <span style={{ fontSize: 11, color: 'rgba(91,155,213,0.80)', fontWeight: 500 }}>Console Régionale</span>
        </div>
      </div>

      {/* Regional admin user */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Avatar initials="PA" size={38} bg="rgba(91,155,213,0.20)" color="#5B9BD5" ringColor="rgba(91,155,213,0.50)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Paul ATEBA</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="pill" style={{ alignSelf: 'flex-start', padding: '2px 6px', background: 'rgba(91,155,213,0.18)', color: '#5B9BD5', borderColor: 'rgba(91,155,213,0.35)', fontSize: 10 }}>Admin Régional</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>Région MIFI</span>
          </div>
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
                <Link key={it.key} href={`/admin/regional/${it.key}`} style={{ textDecoration: 'none' }}>
                  <div className={'nav-item' + (isActive ? ' active' : '')} style={isActive ? { borderLeftColor: '#5B9BD5' } : {}}>
                    <span className="ni-icon" style={isActive ? { color: '#5B9BD5' } : {}}>{Ic && <Ic size={17} />}</span>
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
          <Link href="/admin/regional/parametres" style={{ textDecoration: 'none' }}>
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
