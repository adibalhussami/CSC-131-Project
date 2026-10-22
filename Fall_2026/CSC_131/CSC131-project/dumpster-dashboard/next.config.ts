import type { NextConfig } from "next";

const config: NextConfig = {
  // CSV imports go through a server action; Vercel caps request bodies at 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default config;
