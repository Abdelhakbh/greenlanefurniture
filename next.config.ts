import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const wpUrl = process.env.WORDPRESS_URL;
let wpHostname: string | undefined;
try {
  wpHostname = wpUrl ? new URL(wpUrl).hostname : undefined;
} catch {
  wpHostname = undefined;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "greenlanefurniture.co.uk",
      },
      {
        protocol: "https",
        hostname: "shop.greenlanefurniture.co.uk",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(wpHostname
        ? [{ protocol: "https" as const, hostname: wpHostname }]
        : []),
    ],
  },
};

export default nextConfig;
