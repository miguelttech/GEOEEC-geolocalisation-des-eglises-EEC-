import type { ReactNode } from 'react';
import SidebarParoisse from '@/components/admin/SidebarParoisse';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';
import ScopeBarParoisse from '@/components/admin/ScopeBarParoisse';
import RoleGuard from '@/components/admin/RoleGuard';

export const metadata = {
  title: 'Bureau de Paroisse — EEC Cameroun',
};

export default function AdminParoisseLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <RoleGuard allow={['PAROISSE']} />
      <SidebarParoisse />
      <div className="admin-main">
        <Topbar />
        <ScopeBarParoisse />
        <div className="admin-content">{children}</div>
      </div>
    </AdminShell>
  );
}
