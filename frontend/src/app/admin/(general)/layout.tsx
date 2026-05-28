import type { ReactNode } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Console Synodale — EEC Cameroun',
};

export default function AdminGeneralLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </AdminShell>
  );
}
