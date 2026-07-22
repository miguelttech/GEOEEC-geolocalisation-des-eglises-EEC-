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
};

export default nextConfig;
