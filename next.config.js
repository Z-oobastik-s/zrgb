/** @type {import('next').NextConfig} */
// Для GitHub Pages в CI задайте BASE_PATH=/имя-репозитория (workflow делает это автоматически).
const basePath = process.env.BASE_PATH ?? ''

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  output: 'export',
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

module.exports = nextConfig
