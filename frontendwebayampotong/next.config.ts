import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
