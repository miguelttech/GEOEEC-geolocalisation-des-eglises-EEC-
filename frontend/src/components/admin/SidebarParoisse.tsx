'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from './icons';
import { Avatar } from './atoms';

const NAV = [
  { group: 'Ma paroisse', items: [
    { key: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  ]},
  { group: 'Données de ma paroisse', items: [
    { key: 'fiche',     label: 'Fiche paroisse', icon: 'church' },
    { key: 'oeuvres',   label: 'Œuvres',          icon: 'hexagon' },
    { key: 'ouvriers',  label: 'Ouvriers',         icon: 'user' },
  ]},
  { group: 'Rapports & données', items: [
    { key: 'stats', label: 'Statistiques',    icon: 'chart' },
    { key: 'io',    label: 'Import / Export', icon: 'swap' },
  ]},
];

const C = '#E67A2E';

const EECLogo = ({ size = 32 }: { size?: number }) => (
  <Image src="/logo-eec.png" alt="EEC" width={size} height={size} style={{ objectFit: 'contain' }} />
);

function LogoutBtn() {
  const handleLogout = async () => {
    try { await fetch('/api/auth/logout/', { method: 'POST', credentials: 'include' }); } finally {
      window.location.href = '/login';
    }
  };
  return (
    <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
      <div className="nav-item danger" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6 }}>
        <span className="ni-icon"><I.logout size={17} /></span>
        <span>Déconnexion</span>
      </div>
    </button>
  );
}

function activeKey(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean);
  return seg[2] || 'dashboard';
}

export default function SidebarParoisse() {
  const pathname = usePathname();
  const active = activeKey(pathname);

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: 'var(--chrome)',
      borderRight: `1px solid rgba(230,122,46,0.10)`,
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ height: 72, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <EECLogo />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span className="fr" style={{ fontSize: 15, color: '#fff', letterSpacing: '0.005em' }}>EEC Cameroun</span>
          <span style={{ fontSize: 11, color: 'rgba(230,122,46,0.80)', fontWeight: 500 }}>Console Paroisse</span>
        </div>
      </div>

      {/* Paroisse admin user */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Avatar initials="NE" size={38} bg="rgba(230,122,46,0.20)" color={C} ringColor="rgba(230,122,46,0.50)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Nicolas ESSONO</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="pill" style={{ alignSelf: 'flex-start', padding: '2px 6px', background: 'rgba(230,122,46,0.18)', color: C, borderColor: 'rgba(230,122,46,0.35)', fontSize: 10 }}>Admin Paroisse</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>Bafoussam-Centre</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '4px 0 18px', overflowY: 'auto' }}>
        {NAV.map((g, gi) => (
          <div key={gi}>
            <div className="nav-group-label">{g.group}</div>
            {g.items.map(it => {
              const Ic = I[it.icon as keyof typeof I];
              const isActive = active === it.key;
              return (
                <Link key={it.key} href={`/admin/paroisse/${it.key}`} style={{ textDecoration: 'none' }}>
                  <div className={'nav-item' + (isActive ? ' active' : '')} style={isActive ? { borderLeftColor: C } : {}}>
                    <span className="ni-icon" style={isActive ? { color: C } : {}}>{Ic && <Ic size={17} />}</span>
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
          <Link href="/admin/paroisse/parametres" style={{ textDecoration: 'none' }}>
            <div className={'nav-item' + (active === 'parametres' ? ' active' : '')} style={active === 'parametres' ? { borderLeftColor: C } : {}}>
              <span className="ni-icon" style={active === 'parametres' ? { color: C } : {}}><I.gear size={17} /></span>
              <span>Paramètres</span>
            </div>
          </Link>
          <LogoutBtn />
        </div>
      </div>
    </aside>
  );
}
