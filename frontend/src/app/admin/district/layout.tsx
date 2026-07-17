import type { ReactNode } from 'react';
import SidebarDistrict from '@/components/admin/SidebarDistrict';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';
import AdminMapFrame from '@/components/admin/AdminMapFrame';
import ScopeBarDistrict from '@/components/admin/ScopeBarDistrict';
import RoleGuard from '@/components/admin/RoleGuard';

export const metadata = {
  title: 'Bureau de District — EEC Cameroun',
};

export default function AdminDistrictLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <RoleGuard allow={['DISTRICT']} />
      <AdminMapFrame
        sidebar={<SidebarDistrict />}
        topbar={<><Topbar /><ScopeBarDistrict /></>}
      >
        {children}
      </AdminMapFrame>
    </AdminShell>
  );
}
