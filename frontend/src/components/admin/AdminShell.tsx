'use client';
import React from 'react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    const stored = (localStorage.getItem('eec-admin-theme') as 'dark' | 'light') || 'dark';
    setTheme(stored);

    (window as any).__setEECTheme = (t: 'dark' | 'light') => {
      setTheme(t);
      localStorage.setItem('eec-admin-theme', t);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'eec-admin-theme') setTheme((e.newValue as 'dark' | 'light') || 'dark');
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      delete (window as any).__setEECTheme;
    };
  }, []);

  return (
    <div suppressHydrationWarning className={`admin-shell${theme === 'light' ? ' light' : ''}`}>
      {children}
    </div>
  );
}
