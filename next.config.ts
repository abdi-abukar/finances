import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Disable type checking during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
