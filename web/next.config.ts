import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.clerk.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  webpack: (config) => {
    config.cache = false
    return config
  },
}

export default nextConfig
