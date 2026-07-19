import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Restates Next's default, but stated explicitly because the failure mode is
    // nasty: the optimizer rejects any `quality` prop not in this list with a 400
    // at REQUEST time, never at build time. A `quality={90}` passes typecheck,
    // lint and `next build`, then 400s the image in production. Adding a
    // quality={N} anywhere means adding N here.
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
