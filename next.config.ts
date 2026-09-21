import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptxgenjs", "@vercel/sandbox", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
