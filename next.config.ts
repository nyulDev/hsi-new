import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove or update the devIndicators section
  devIndicators: {
    // Remove buildActivity if you have it
    // buildActivity: false, // ❌ Remove this line
    // If you want to change the position, use one of these values:
    // buildActivityPosition: "bottom-right", // or 'bottom-left', 'top-left', 'top-right'
  },

  experimental: {
    // Remove 'reactQueryDevtools' if you have it
    // reactQueryDevtools: false, // ❌ Remove this line
    // Other experimental features...
  },

  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
};

export default nextConfig;
