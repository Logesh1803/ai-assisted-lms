import type { NextConfig } from "next";
import path from "path";

const root = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: {
    root,
  },

};

export default nextConfig;
