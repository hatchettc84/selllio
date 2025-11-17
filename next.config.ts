import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
    // Disable ESLint during production builds
    // This allows deployment to succeed while linting issues are fixed incrementally
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.ENVIRONMENT === "PRODUCTION",
  },
};

export default nextConfig;
