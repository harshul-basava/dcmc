import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a plain HTML/CSS/JS bundle to `out/`, deployable to Netlify, Vercel,
  // GitHub Pages, or any static host.
  output: "export",
  // Static export has no image optimization server, so images are served as-is.
  images: { unoptimized: true },
};

export default nextConfig;
