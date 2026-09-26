import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CV uploads (PDF) go through a server action; default limit is 1 MB.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
