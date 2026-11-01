import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@applypilot/shared", "@applypilot/validators"],
};

export default nextConfig;
