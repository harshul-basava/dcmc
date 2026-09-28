import type { NextConfig } from "next";

/*
 * Left on Next's defaults so Vercel runs the app natively: zero config on
 * import, and next/image serves resized, modern-format versions of the hero
 * photograph instead of the full 486KB original.
 *
 * To go back to a portable static bundle for GitHub Pages or any plain file
 * host, add `output: "export"` and `images: { unoptimized: true }`.
 */
const nextConfig: NextConfig = {
  // Profile forms post a headshot through a Server Action, and the default
  // 1MB cap rejected the whole save. Kept under Vercel's 4.5MB request limit;
  // HeadshotInput shrinks photos in the browser so they land well inside it.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
