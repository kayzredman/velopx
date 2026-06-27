import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
