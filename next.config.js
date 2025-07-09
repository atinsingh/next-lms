/** @type {import('next').NextConfig} */ 
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ THIS is what you need
  },
}

module.exports = nextConfig
