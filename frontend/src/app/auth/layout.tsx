'use client';

import { useEffect } from 'react';

export default function AuthPublicLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  return <>{children}</>;
}
