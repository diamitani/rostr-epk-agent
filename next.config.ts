import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptxgenjs", "@vercel/sandbox", "@modelcontextprotocol/sdk"],
  experimental: {
    serverComponentsExternalPackages: ["pptxgenjs"],
  },
};

export default nextConfig;
