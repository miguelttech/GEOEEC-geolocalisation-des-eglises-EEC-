import type { ReactNode } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';
import AdminMapFrame from '@/components/admin/AdminMapFrame';
import RoleGuard from '@/components/admin/RoleGuard';

export const metadata = {
  title: 'Bureau National — EEC Cameroun',
};

export default function AdminGeneralLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <RoleGuard allow={['SUPER']} />
      <AdminMapFrame sidebar={<Sidebar />} topbar={<Topbar />}>
        {children}
      </AdminMapFrame>
    </AdminShell>
  );
}
