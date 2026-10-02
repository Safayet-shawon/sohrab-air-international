import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Sohrab Air International",
  description: "Hajj, Umrah, air ticketing and responsible overseas employment services from Dhaka, Bangladesh.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" data-language="bn" suppressHydrationWarning>
      <body className="antialiased"><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
