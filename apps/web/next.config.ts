import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kairo/ui", "@kairo/types", "@kairo/database"],

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

  async rewrites() {
    return [
      {
        source: "/api/trpc/:path*",
        destination: `${process.env.API_URL}/trpc/:path*`,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
