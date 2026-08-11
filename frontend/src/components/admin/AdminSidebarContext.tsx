'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface AdminSidebarCtx {
  mobileOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const Ctx = createContext<AdminSidebarCtx | null>(null);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <Ctx.Provider value={{
      mobileOpen,
      toggle: () => setMobileOpen(v => !v),
      close: () => setMobileOpen(false),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminSidebar(): AdminSidebarCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminSidebar must be used within AdminSidebarProvider');
  return ctx;
}

export function AdminSidebarOverlay() {
  const { mobileOpen, close } = useAdminSidebar();
  if (!mobileOpen) return null;
  return <div className="admin-sidebar-overlay" onClick={close} />;
}
