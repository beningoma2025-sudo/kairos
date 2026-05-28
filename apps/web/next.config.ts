import type { NextConfig } from "next";

// On Vercel, VERCEL_URL is set automatically.
// Locally, API_URL defaults to the Fastify dev server.
const API_URL =
  process.env.API_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const nextConfig: NextConfig = {
  transpilePackages: ["@kairo/ui", "@kairo/types", "@kairo/database"],

  env: {
    // Expose the resolved API_URL to server components
    API_URL,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
