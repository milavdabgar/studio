import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow serving images from our content API
    domains: ['localhost'],
    // Disable the warning about width/height when using CSS sizing
    unoptimized: false,
  },
  // Environment variables for build-time optimization
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://gppalanpur.ac.in',
  },
  // Set metadataBase to fix the metadataBase warning
  experimental: {
    // Add any experimental features here
    serverComponentsExternalPackages: ['rimraf'],
  },
  serverExternalPackages: ['rimraf', 'canvas', 'chartjs-node-canvas'],
};

export default nextConfig;
