import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Build de production autonome (docker-compose.prod.yml / Dockerfile.prod) —
  // ne modifie rien en développement (next dev l'ignore).
  output: "standalone",

  // Empêche Next.js de faire une redirection 308 qui enlève le slash final
  // Django exige le slash final sur toutes ses routes (/api/auth/login/ pas /api/auth/login)
  skipTrailingSlashRedirect: true,

  // Proxy /api/* → backend Django
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${backendUrl}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Headers de sécurité (audit du 24/07/2026) — pas de Content-Security-Policy
  // ici volontairement : la carte (Leaflet + MapLibre) charge des tuiles
  // depuis plusieurs domaines externes (CartoDB, ArcGIS, OpenFreeMap) via des
  // Web Workers, et une CSP mal calibrée casserait silencieusement la
  // fonctionnalité centrale de l'app sans qu'un test navigateur réel ne
  // valide chaque directive. À ajouter séparément, testée en navigateur.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
