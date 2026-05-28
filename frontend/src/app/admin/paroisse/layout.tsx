import type { ReactNode } from 'react';
import SidebarParoisse from '@/components/admin/SidebarParoisse';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Console Paroisse — EEC Cameroun',
};

const C = '#E67A2E';

function ScopeBarParoisse() {
  return (
    <div style={{
      background: 'rgba(230,122,46,0.07)',
      borderBottom: '1px solid rgba(230,122,46,0.20)',
      padding: '8px 24px',
      display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(230,122,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, lineHeight: 1 }}>Paroisse</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C, lineHeight: 1.3 }}>Bafoussam-Centre</div>
        </div>
      </div>
      <div style={{ width: 1, height: 28, background: 'rgba(230,122,46,0.20)' }} />
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>730</span> fidèles
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>PAROISSE</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>GPS ✓</span>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(230,122,46,0.70)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Scope limité à votre paroisse</span>
      </div>
    </div>
  );
}

export default function AdminParoisseLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <SidebarParoisse />
      <div className="admin-main">
        <Topbar />
        <ScopeBarParoisse />
        <div className="admin-content">{children}</div>
      </div>
    </AdminShell>
  );
}
