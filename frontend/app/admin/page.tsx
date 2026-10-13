import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { CRMApp } from "@/admin/crm/app";
import { DEMO_MODE } from "@/lib/mode";

export const metadata: Metadata = { title: "Admin · Sohrab Air International", robots: { index: false, follow: false } };

export default function Admin() {
  // Demo deployment (no backend): open the CRM directly, no password.
  if (DEMO_MODE) return <CRMApp />;
  // Production deployment with the Java backend: keep the protected login.
  return <div className="page"><section className="section"><AdminDashboard displayName="Admin"/></section></div>;
}
