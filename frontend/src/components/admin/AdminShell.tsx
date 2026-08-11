'use client';
import React from 'react';
import { api } from '@/lib/api';
import { AdminSidebarProvider, AdminSidebarOverlay } from './AdminSidebarContext';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    const stored = (localStorage.getItem('eec-admin-theme') as 'dark' | 'light') || 'dark';
    setTheme(stored);

    // EXIGENCE : le thème est persistant en base et restauré à la connexion —
    // la valeur serveur (clair/sombre) fait autorité sur le cache local.
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((me: { theme?: 'clair' | 'sombre' }) => {
        const t: 'dark' | 'light' = me.theme === 'clair' ? 'light' : 'dark';
        setTheme(t);
        localStorage.setItem('eec-admin-theme', t);
      })
      .catch(() => {});

    window.__setEECTheme = (t: 'dark' | 'light') => {
      setTheme(t);
      localStorage.setItem('eec-admin-theme', t);
      api.patch('/api/auth/me/', { theme: t === 'light' ? 'clair' : 'sombre' }).catch(() => {});
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'eec-admin-theme') setTheme((e.newValue as 'dark' | 'light') || 'dark');
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      delete window.__setEECTheme;
    };
  }, []);

  return (
    <div suppressHydrationWarning className={`admin-shell${theme === 'light' ? ' light' : ''}`}>
      <AdminSidebarProvider>
        {children}
        <AdminSidebarOverlay />
      </AdminSidebarProvider>
    </div>
  );
}
