/** true when no Java backend is configured (Vercel demo deployment) */
export const DEMO_MODE = !process.env.NEXT_PUBLIC_BACKEND;
/** URL prefix when hosted under a sub-path (GitHub Pages) */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
