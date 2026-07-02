import type { ReactNode } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import AdminShell from '@/components/admin/AdminShell';
import AdminContentFrame from '@/components/admin/AdminContentFrame';

export const metadata = {
  title: 'Console Synodale — EEC Cameroun',
};

export default function AdminGeneralLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Sidebar />
      <AdminContentFrame>{children}</AdminContentFrame>
    </AdminShell>
  );
}
