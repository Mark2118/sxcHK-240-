/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/xsc',
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/xsc/',
        permanent: false,
        basePath: false,
      },
    ]
  },
}

export default nextConfig
