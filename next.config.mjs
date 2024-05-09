/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
    // trailingSlash: true,
  
    // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
    // skipTrailingSlashRedirect: true,
  
    // Optional: Change the output directory `out` -> `dist`
    // distDir: 'dist',
    env: {
      commitTag: process.env.COMMIT_TAG || 'local',
    },
    webpack: (config) => {
      config.module.rules.push({
        test: /\.svg$/,
        issuer: /\.(js|ts)x?$/,
        use: ['@svgr/webpack'],
      });  
      return config;
    },
    experimental: {
      scrollRestoration: true,
      largePageDataBytes: 256000,
    },
  };
  
  export default nextConfig;