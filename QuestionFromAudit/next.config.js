const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
    ],
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {
    root: __dirname,
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, 'node_modules/tailwindcss'),
    },
  },
  // Optimise production builds: enable gzip compression for API responses
  compress: true,
  // Enable automatic static optimization where possible
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://lh3.googleusercontent.com https://pbs.twimg.com https://images.unsplash.com https://logos-world.net",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Suppresses source maps uploading logs during build
  silent: true,
  // Upload source maps for better error stack traces
  widenClientFileUpload: true,
  // Hide source maps from the client
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
});
