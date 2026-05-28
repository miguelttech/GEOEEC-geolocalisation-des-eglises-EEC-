import type { ReactNode } from 'react';
import SidebarDistrict from '@/components/admin/SidebarDistrict';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Console District — EEC Cameroun',
};

const C = '#9B72CF';

function ScopeBarDistrict() {
  return (
    <div style={{
      background: 'rgba(155,114,207,0.07)',
      borderBottom: '1px solid rgba(155,114,207,0.20)',
      padding: '8px 24px',
      display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(155,114,207,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, lineHeight: 1 }}>District</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C, lineHeight: 1.3 }}>Bafoussam Centre</div>
        </div>
      </div>
      <div style={{ width: 1, height: 28, background: 'rgba(155,114,207,0.20)' }} />
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>8</span> paroisses
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>14</span> ouvriers
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Région MIFI</span>
          </span>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(155,114,207,0.70)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Scope limité à votre district</span>
      </div>
    </div>
  );
}

export default function AdminDistrictLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <SidebarDistrict />
      <div className="admin-main">
        <Topbar />
        <ScopeBarDistrict />
        <div className="admin-content">{children}</div>
      </div>
    </AdminShell>
  );
}
