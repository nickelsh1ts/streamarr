/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
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
