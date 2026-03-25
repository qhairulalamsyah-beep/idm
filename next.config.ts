import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output for Vercel - Vercel handles this automatically
  // output: "standalone",

  experimental: {
    serverActions: {
      allowedOrigins: ["*.vercel.app", "*.space.z.ai", "localhost:3000"],
    },
  },

  // Enable strict TypeScript checking for production
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Allowed dev origins
  allowedDevOrigins: [
    "*.vercel.app",
    "*.space.z.ai",
    "localhost",
  ],
};

export default nextConfig;
