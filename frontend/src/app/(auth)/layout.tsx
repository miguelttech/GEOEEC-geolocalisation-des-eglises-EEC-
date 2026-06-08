'use client';

import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Nettoyage du thème posé par la carte (data-theme="dark")
    document.documentElement.removeAttribute('data-theme');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  return <>{children}</>;
}
