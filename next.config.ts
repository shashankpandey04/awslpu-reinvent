import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://dqq6hmbhjgrfe.cloudfront.net https://static.awslpu.in https://*.cloudfront.net https://api.qrserver.com;
  font-src 'self' data: https://fonts.gstatic.com;
  media-src 'self' blob: data: https://static.awslpu.in https://dqq6hmbhjgrfe.cloudfront.net https://*.cloudfront.net;
  connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://dqq6hmbhjgrfe.cloudfront.net https://static.awslpu.in https://cloudflareinsights.com https://*.cloudflareinsights.com;
  frame-src 'self' https://api.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dqq6hmbhjgrfe.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "static.awslpu.in",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/advertisement",
        destination: "/adversitment",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
