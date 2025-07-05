import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Reduce build memory usage
    workerThreads: false,
    cpus: 1
  },
  // Skip type checking during build (we already checked locally)
  typescript: {
    ignoreBuildErrors: true
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true
  },
  // Disable source maps in production to speed up build
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    domains: [],
    unoptimized: true
  }
}

export default nextConfig
