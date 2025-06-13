/** @type {import('next').NextConfig} */
import crypto from 'crypto';

const randomString = crypto.randomBytes(32).toString('base64');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',')
    : ['localhost:3000'],
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
    RANDOM_STRING: randomString,
  },
  images: {
    domains: ['image.tmdb.org'],
  },
  async redirects() {
    return [
      {
        source: '/watch',
        destination: '/watch/web/index.html#!',
        permanent: false,
      },
      {
        source: '/watch{/:path((?!web).*)}',
        destination: '/watch/web/index.html#!',
        permanent: false,
      },
      {
        source: '/watch/web{/:slug((?!index.html).*)}',
        destination: '/watch/web/index.html#!',
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });
    config.resolve.fallback = {
      fs: false,
      path: false,
    };
    return config;
  },
  experimental: {
    scrollRestoration: true,
    largePageDataBytes: 256000,
  },
};

export default nextConfig;
