import type { ReactNode } from 'react';
import '../admin.css';
import SidebarRegional from '@/components/admin/SidebarRegional';
import ScopeBar from '@/components/admin/ScopeBar';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';
import AdminMapFrame from '@/components/admin/AdminMapFrame';
import RoleGuard from '@/components/admin/RoleGuard';

export const metadata = {
  title: 'Bureau Régional — EEC Cameroun',
};

export default function AdminRegionalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <RoleGuard allow={['REGION']} />
      <AdminMapFrame
        sidebar={<SidebarRegional />}
        topbar={<><Topbar /><ScopeBar /></>}
      >
        {children}
      </AdminMapFrame>
    </AdminShell>
  );
}
