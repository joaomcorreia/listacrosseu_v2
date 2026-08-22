import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: process.env.NODE_ENV === "development",
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const backendUrl = (process.env.BACKEND_URL || "http://127.0.0.1:8020").replace(/\/+$/g, "");
    return {
      afterFiles: [
        {
          source: "/api/:path*/",
          destination: `${backendUrl}/api/:path*/`,
        },
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/media/:path*/",
          destination: `${backendUrl}/media/:path*/`,
        },
        {
          source: "/media/:path*",
          destination: `${backendUrl}/media/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
