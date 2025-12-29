import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // rewrites removed completely (they caused redirect loops)
};

export default nextConfig;
