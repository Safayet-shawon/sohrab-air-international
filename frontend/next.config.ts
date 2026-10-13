import type { NextConfig } from "next";

// API_INTERNAL_URL points at the Java backend (Docker deployment).
// When it is not set (Vercel / GitHub Pages) the site runs in standalone demo mode:
// forms, packages and the CRM admin use browser storage with sample data.
const api = process.env.API_INTERNAL_URL;
// STATIC_EXPORT=1 builds plain HTML files (GitHub Pages). BASE_PATH is the sub-path, e.g. /repo-name.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(api ? { output: "standalone" as const } : {}),
  ...(staticExport ? { output: "export" as const, trailingSlash: true, basePath } : {}),
  env: { NEXT_PUBLIC_BACKEND: api ? "1" : "", NEXT_PUBLIC_BASE_PATH: staticExport ? basePath : "" },
  images: { unoptimized: true },
  ...(staticExport ? {} : {
    async rewrites() {
      return api ? [{ source: "/api/:path*", destination: `${api}/api/:path*` }] : [];
    },
    async headers() {
      return [{ source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" }
      ] }];
    },
  }),
};
export default nextConfig;
