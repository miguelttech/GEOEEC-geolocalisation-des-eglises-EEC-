import type { ReactNode } from 'react';
import '../admin.css';
import SidebarRegional from '@/components/admin/SidebarRegional';
import ScopeBar from '@/components/admin/ScopeBar';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Console Régionale MIFI — EEC Cameroun',
};

export default function AdminRegionalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <SidebarRegional />
      <div className="admin-main">
        <Topbar />
        <ScopeBar regionNom="MIFI" nbParoisses={48} nbDistricts={6} />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </AdminShell>
  );
}
