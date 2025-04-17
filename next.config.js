/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  output: 'standalone',
  swcMinify: true,
};

module.exports = nextConfig; 