'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

const HOME_BY_ROLE: Record<string, string> = {
  SUPER: '/admin/dashboard',
  REGION: '/admin/regional/dashboard',
  DISTRICT: '/admin/district/dashboard',
  PAROISSE: '/admin/paroisse/dashboard',
};

/**
 * Vérifie que le rôle du compte connecté correspond à l'espace admin
 * courant (général = SUPER, regional = REGION, etc.) et redirige vers le
 * bon espace sinon — défense en profondeur en complément du filtrage
 * déjà appliqué côté backend sur chaque endpoint.
 */
export default function RoleGuard({ allow }: { allow: string[] }) {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND}/api/auth/me/`, { credentials: 'include' })
      .then(async r => {
        if (cancelled) return;
        // Seule une réponse d'authentification explicitement négative (401/403)
        // justifie une redirection vers /login. Une panne réseau ou serveur
        // transitoire ne doit jamais éjecter l'utilisateur de son espace —
        // les endpoints backend restent de toute façon l'autorité réelle.
        if (r.status === 401 || r.status === 403) { router.replace('/login'); return; }
        if (!r.ok) return;
        const me: { role?: string } = await r.json();
        if (!me.role || allow.includes(me.role)) return;
        router.replace(HOME_BY_ROLE[me.role] || '/login');
      })
      .catch(() => { /* réseau indisponible — on ne redirige pas */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
