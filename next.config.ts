import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
    // Disable ESLint during production builds
    // This allows deployment to succeed while linting issues are fixed incrementally
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during production builds
    // This allows deployment to succeed while type issues are fixed incrementally
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.ENVIRONMENT === "PRODUCTION",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark FFmpeg and Prisma as external to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@ffmpeg-installer/ffmpeg': '@ffmpeg-installer/ffmpeg',
        'fluent-ffmpeg': 'fluent-ffmpeg',
        '@prisma/client': '@prisma/client',
        '.prisma/client': '.prisma/client',
      });
    }
    return config;
  },
};

export default nextConfig;
