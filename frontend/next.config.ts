import type { NextConfig } from "next";

// API_INTERNAL_URL points at the Java backend (Docker deployment).
// When it is not set (e.g. on Vercel) the site runs in standalone demo mode:
// forms, packages and the CRM admin use browser storage with sample data.
const api = process.env.API_INTERNAL_URL;

const nextConfig: NextConfig = {
  ...(api ? { output: "standalone" as const } : {}),
  env: { NEXT_PUBLIC_BACKEND: api ? "1" : "" },
  images: { unoptimized: true },
  async rewrites() {
    return api ? [{ source: "/api/:path*", destination: `${api}/api/:path*` }] : [];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" }
    ] }];
  }
};
export default nextConfig;
