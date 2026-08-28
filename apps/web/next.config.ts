import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared package is TS source; let Next transpile it.
  transpilePackages: ["@aso/shared"],
  // Don't auto-generate AGENTS.md / CLAUDE.md in the app dir.
  agentRules: false,
  images: {
    // App Store artwork + screenshots come from Apple's CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "*.mzstatic.com" },
      { protocol: "https", hostname: "**.apple.com" },
    ],
  },
};

export default nextConfig;
