import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.176", "172.30.137.120"],
  // Pages that moved: keep old links and shares working. Query strings (?project=, ?category=) carry over.
  async redirects() {
    return [
      { source: "/creations-and-explorations/inspiration", destination: "/inspiration", permanent: true },
      { source: "/creations-and-explorations", destination: "/works", permanent: true },
      { source: "/contact-me", destination: "/reach-out", permanent: true },
    ];
  },
  images: {
    // Finer steps than the default (… 256, 384, then 640), so images arrive close to the size
    // they are shown at and the browser hardly has to shrink them: its quick shrink turns fine
    // dot and line work into speckle. All below the smallest device size (640).
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 200, 240, 280, 320, 360, 420, 480, 560],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
