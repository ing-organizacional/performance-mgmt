import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker deployment
  serverExternalPackages: ['@prisma/client'],
  
  // Turbopack configuration (minimal as recommended by Next.js docs)
  turbopack: {
    // Start with minimal config - Turbopack has built-in optimizations
    // Add resolveAlias, resolveExtensions, or rules only when needed
  },
  
  // Webpack configuration (for production builds and fallback)
  webpack: (config: { externals: Array<Record<string, string>> }) => {
    // Ensure SQLite works in production
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

export default nextConfig;
