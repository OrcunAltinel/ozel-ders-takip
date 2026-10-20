import type { NextConfig } from "next";

/** Tüm yanıtlara eklenen güvenlik başlıkları. */
const guvenlikBasliklari = [
  // Sayfa başka sitelerde iframe içinde açılamaz (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Yalnızca HTTPS üzerinden sunulduğunda (yayında) tarayıcı dikkate alır.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Test/production build'leri çalışan `npm run dev`'in `.next` klasörünü
  // ezmesin diye ayrı bir klasöre yönlendirilebilir (örn. NEXT_DIST_DIR=.next-test).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: guvenlikBasliklari }];
  },
};

export default nextConfig;
