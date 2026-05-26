import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy toutes les requêtes /api/* vers le backend Django (port 8000)
  // Ça évite les problèmes CORS et permet de partager les cookies de session
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
