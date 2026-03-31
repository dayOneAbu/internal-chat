import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { hostname: "*.supabase.co" },
      { hostname: "127.0.0.1" },
      { hostname: "localhost" },
    ],
  },
};

export default nextConfig;
