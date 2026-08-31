/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- next.config CommonJS
const path = require('path');

const nextConfig = {
  output: 'standalone',
  // monorepo：让 standalone 产出 apps/frontEnd/server.js（与目录名大小写一致）
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'backEnd', port: '4000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'backend', port: '4000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  async rewrites() {
    const backend = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
