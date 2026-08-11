'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from './icons';
import { Avatar } from './atoms';
import AdminBrand from './AdminBrand';
import { logout } from '@/lib/api';
import { useAdminSidebar } from './AdminSidebarContext';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

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

interface MeUser {
  first_name: string; last_name: string; email: string;
  role_display: string; paroisse_nom?: string | null; avatar_url?: string | null;
}

function getInitials(u: MeUser | null): string {
  if (!u) return '–';
  const f = (u.first_name || '').trim();
  const l = (u.last_name  || '').trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f)      return f.slice(0, 2).toUpperCase();
  return (u.email || '?')[0].toUpperCase();
}

function getDisplayName(u: MeUser | null): string {
  if (!u) return '—';
  const f = (u.first_name || '').trim();
  const l = (u.last_name  || '').trim();
  if (f && l) return `${f} ${l}`;
  return f || u.email || '—';
}

function LogoutBtn() {
  return (
    <button onClick={logout} style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
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
  const [me, setMe] = React.useState<MeUser | null>(null);
  const { mobileOpen, close } = useAdminSidebar();

  const loadMe = React.useCallback(() => {
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => {});
  }, []);

  React.useEffect(() => { loadMe(); }, [loadMe]);

  React.useEffect(() => {
    window.addEventListener('eec-profile-updated', loadMe);
    return () => window.removeEventListener('eec-profile-updated', loadMe);
  }, [loadMe]);

  return (
    <aside
      className={'admin-sidebar' + (mobileOpen ? ' mobile-open' : '')}
      style={{ borderRight: `1px solid rgba(230,122,46,0.10)` }}
    >
      <AdminBrand spaceLabel="Bureau de Paroisse" />

      {/* Paroisse admin user */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {me?.avatar_url ? (
          <img src={me.avatar_url} alt={getDisplayName(me)} width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', border: `1px solid rgba(230,122,46,0.50)`, flexShrink: 0 }} />
        ) : (
          <Avatar initials={getInitials(me)} size={38} bg="rgba(230,122,46,0.20)" color={C} ringColor="rgba(230,122,46,0.50)" />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDisplayName(me)}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="pill" style={{ alignSelf: 'flex-start', padding: '2px 6px', background: 'rgba(230,122,46,0.18)', color: C, borderColor: 'rgba(230,122,46,0.35)', fontSize: 10 }}>{me?.role_display ?? 'Admin Paroisse'}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>{me?.paroisse_nom ?? '—'}</span>
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
                <Link key={it.key} href={`/admin/paroisse/${it.key}`} style={{ textDecoration: 'none' }} onClick={close}>
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
          <Link href="/admin/paroisse/parametres" style={{ textDecoration: 'none' }} onClick={close}>
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
