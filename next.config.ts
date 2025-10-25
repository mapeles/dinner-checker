import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    instrumentationHook: true, // DB 백업을 위한 instrumentation 활성화
  },
};

export default nextConfig;
