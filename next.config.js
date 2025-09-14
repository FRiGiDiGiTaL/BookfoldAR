/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Removed experimental optimizeCss that required critters
  // experimental: {
  //   optimizeCss: true,
  // },

  // Image optimization (no domains, just remotePatterns)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Webpack configuration for custom modules
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Redirects to ensure proper routing
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/landing", destination: "/", permanent: true },
      { source: "/trial", destination: "/", permanent: true },
      { source: "/signup", destination: "/", permanent: true },
      { source: "/register", destination: "/", permanent: true },
    ];
  },

  // Headers for PWA and security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=*, microphone=*" },
        ],
      },
      {
        source: "/app",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },

  // Rewrites (none defined yet)
  async rewrites() {
    return [];
  },

  // Configure build output for better performance
  output: "standalone",
  compress: true,
  trailingSlash: false,

  // Configure TypeScript and ESLint
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

module.exports = nextConfig;