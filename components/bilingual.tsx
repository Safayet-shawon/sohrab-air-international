import type { ReactNode } from "react";
export function B({ bn, en }: { bn: ReactNode; en: ReactNode }) {
  return <><span className="bn">{bn}</span><span className="en">{en}</span></>;
}
