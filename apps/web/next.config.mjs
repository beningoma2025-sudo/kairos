import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Vercel, VERCEL_URL is set automatically.
const API_URL =
  process.env.API_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js the monorepo root so it includes root-level node_modules in output tracing
  outputFileTracingRoot: path.join(__dirname, "../../"),

  transpilePackages: ["@kairo/ui", "@kairo/types", "@kairo/database"],

  env: {
    API_URL,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "img.youtube.com" },
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push({ "@prisma/client": "commonjs @prisma/client" });
    }
    return config;
  },
};

export default nextConfig;
