import type { ReactNode } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import './admin.css';

// TOUT l'espace /admin passe par la garde : seuls les administrateurs
// agréés (SUPER, REGION, DISTRICT, PAROISSE) peuvent y entrer.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
