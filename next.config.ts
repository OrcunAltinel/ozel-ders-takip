import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Test/production build'leri çalışan `npm run dev`'in `.next` klasörünü
  // ezmesin diye ayrı bir klasöre yönlendirilebilir (örn. NEXT_DIST_DIR=.next-test).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
