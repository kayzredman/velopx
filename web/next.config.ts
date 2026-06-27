import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      { hostname: 'img.clerk.com' },
      { hostname: 'images.clerk.dev' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'picsum.photos' },
    ],
  },
}

export default nextConfig
