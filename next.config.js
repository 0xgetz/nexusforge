/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use different output dir ONLY for local production builds
  output: 'standalone',
  distDir: process.env.NODE_ENV === 'production'
    ? (process.env.BUILD_DIR || '.next-build')
    : '.next',
  // Enable CORS for Design Mode to load resources cross-origin (dev only)
  // Note: Do NOT set allowedDevOrigins - the default allows all origins in dev mode
  async headers() {
    // Only add permissive CORS headers in development
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  // Surface real TypeScript errors during builds instead of silently ignoring them.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Linting is handled by Biome (see biome.json) and runs in CI via `bun run lint`.
  // Next's built-in ESLint integration stays disabled to avoid running two linters.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
