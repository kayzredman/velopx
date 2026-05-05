const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
  webpack: (config) => {
    // Disable file-system cache to avoid serializer registration conflicts
    config.cache = false
    return config
  },
}

module.exports = nextConfig

module.exports = nextConfig
