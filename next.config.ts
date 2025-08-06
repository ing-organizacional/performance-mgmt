import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // Commented out for development - uncomment for Docker deployment
  // Ensure SQLite works in production
  webpack: (config: { externals: Array<Record<string, string>> }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

export default nextConfig;
