"use client";

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, House, LogIn, MoonStar, Plane, Settings, Users } from "lucide-react";
import { B } from "@/components/bilingual";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

const items = [
  ["/", "হোম", "Home", House], ["/hajj-umrah", "হজ ও ওমরাহ", "Hajj & Umrah", MoonStar],
  ["/ticketing", "এয়ার টিকেট", "Air tickets", Plane], ["/recruitment", "বিদেশে চাকরি", "Overseas jobs", BriefcaseBusiness],
  ["/group-leader", "গ্রুপ লিডার হন", "Become a group leader", Users], ["/admin", "Admin", "Admin", Settings],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(()=>{document.documentElement.dataset.language=localStorage.getItem("sohrab-language")||"bn"},[]);
  const toggleLanguage = () => { const root = document.documentElement; root.dataset.language = root.dataset.language === "en" ? "bn" : "en"; localStorage.setItem("sohrab-language", root.dataset.language); };
  return <SidebarProvider style={{ "--sidebar-width": "16rem" } as CSSProperties}>
    <Sidebar className="border-r-0 bg-white"><SidebarHeader className="p-5"><Link href="/" className="flex items-center gap-3"><img src="/brand-logo.svg" className="h-12 w-12" alt="Sohrab Air logo"/><span><strong className="block text-lg">Sohrab Air</strong><small className="tracking-[.17em] text-slate-500">INTERNATIONAL</small></span></Link></SidebarHeader><SidebarContent><SidebarGroup><SidebarMenu>{items.map(([href,bn,en,Icon])=><SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={pathname===href} size="lg" className="rounded-xl px-3 data-[active=true]:bg-[#0e4b3e] data-[active=true]:text-white"><Link href={href}><Icon/><span><B bn={bn} en={en}/></span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup></SidebarContent><SidebarFooter className="m-3 rounded-xl bg-[#edf5f1] p-4 text-sm"><strong><B bn="সহায়তা প্রয়োজন?" en="Need assistance?"/></strong><a href="tel:+8801720531113" className="font-bold text-[#0e4b3e]">01720 531113</a><span className="text-slate-500">Mouchak Market, Dhaka</span></SidebarFooter></Sidebar>
    <SidebarInset><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><SidebarTrigger className="md:hidden"/><strong><B bn="হজ লাইসেন্স ০৯৬৮ · ঢাকা" en="Hajj Licence 0968 · Dhaka"/></strong></div><div className="flex gap-2"><Button variant="outline" onClick={toggleLanguage}>বাংলা / EN</Button><Button asChild className="hidden bg-[#0e4b3e] sm:inline-flex"><Link href="/signin-with-chatgpt?return_to=/admin" target="_top"><LogIn/><B bn="লগইন" en="Sign in"/></Link></Button></div></header>{children}<footer className="mx-5 mt-10 flex flex-col justify-between gap-3 border-t py-7 text-sm text-slate-500 sm:flex-row md:mx-10"><span>© 2026 Sohrab Air International</span><span>sohrabairinternational@gmail.com · 01720 531113</span></footer></SidebarInset><Toaster richColors position="top-right"/>
  </SidebarProvider>;
}
