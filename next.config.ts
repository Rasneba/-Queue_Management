import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'motion'],
  },
  staticPageGenerationTimeout: 60,
  headers: async () => [
    {
      source: '/api/patients',
      headers: [
        { key: 'Cache-Control', value: 'private, max-age=5, stale-while-revalidate=30' },
      ],
    },
    {
      source: '/api/stats',
      headers: [
        { key: 'Cache-Control', value: 'private, max-age=5, stale-while-revalidate=30' },
      ],
    },
    {
      source: '/api/doctors/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, max-age=3, stale-while-revalidate=15' },
      ],
    },
    {
      source: '/api/staff/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, max-age=10, stale-while-revalidate=30' },
      ],
    },
    {
      source: '/api/reports',
      headers: [
        { key: 'Cache-Control', value: 'private, max-age=30, stale-while-revalidate=60' },
      ],
    },
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
};

export default nextConfig;
