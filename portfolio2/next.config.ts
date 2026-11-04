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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
