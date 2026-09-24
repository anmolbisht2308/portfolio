import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@react-three/drei", "@react-three/postprocessing"],
  },
};

export default nextConfig;
