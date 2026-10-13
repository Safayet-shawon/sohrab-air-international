"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Package, State } from "@/lib/store";
import { log, money, setState, uid } from "@/lib/store";

type Draft = Omit<Package, "destinations" | "inclusions"> & { destinations: string; inclusions: string };
const blank = (): Draft => ({ id: "", category: "umrah", nameBn: "", nameEn: "", descriptionBn: "", descriptionEn: "", price: 0, durationDays: 14, destinations: "Dhaka\nMakkah\nMadinah\nDhaka", inclusions: "Visa\nAir ticket\nHotel\nTransport", seats: 30, active: true });

export function Packages({ s }: { s: State }) {
  const [edit, setEdit] = useState<Draft | null>(null);
  const booked = (id: string) => s.leads.filter(l => l.packageId === id && ["confirmed", "completed"].includes(l.status)).reduce((a, l) => a + l.travellers, 0);
  const save = () => {
    if (!edit) return; if (!edit.nameEn.trim() || !edit.nameBn.trim()) return toast.error("Both names are required");
    const pkg: Package = { ...edit, id: edit.id || uid(), destinations: edit.destinations.split("\n").map(x => x.trim()).filter(Boolean), inclusions: edit.inclusions.split("\n").map(x => x.trim()).filter(Boolean) };
    setState(st => { const i = st.packages.findIndex(p => p.id === pkg.id); if (i >= 0) st.packages[i] = pkg; else st.packages.unshift(pkg); log(st, "package", `Package ${i >= 0 ? "updated" : "created"}: ${pkg.nameEn}`); });
    toast.success("Package saved — the website updates instantly"); setEdit(null);
  };
  const toDraft = (p: Package, copy = false): Draft => ({ ...p, id: copy ? "" : p.id, nameEn: copy ? p.nameEn + " (copy)" : p.nameEn, destinations: p.destinations.join("\n"), inclusions: p.inclusions.join("\n") });
  return <div className="crm-stack">
    <div className="toolbar"><p className="muted">Packages marked <b>Live</b> appear on the Hajj & Umrah page.</p><div className="grow" /><Button className="btn-shine btn-primary" onClick={() => setEdit(blank())}><Plus />New package</Button></div>
    <div className="pkg-grid">{s.packages.map((p, i) => {
      const b = booked(p.id);
      return <motion.article key={p.id} className={`pkg-card ${p.active ? "" : "off"}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }} whileHover={{ y: -5 }}>
        <div className="pkg-top"><span className={`cat cat-${p.category}`}>{p.category}</span><label className="live"><Switch checked={p.active} onCheckedChange={active => { setState(st => { st.packages.find(x => x.id === p.id)!.active = active; }); toast.success(active ? "Published on website" : "Hidden from website"); }} />{p.active ? "Live" : "Hidden"}</label></div>
        <h3>{p.nameEn}</h3><p className="bn-name">{p.nameBn}</p>
        <p className="price">{money(p.price)} <small>/ person · {p.durationDays} days</small></p>
        <div className="chips">{p.inclusions.slice(0, 5).map(x => <span key={x}>{x}</span>)}</div>
        <div className="seats"><div className="flex justify-between text-xs"><span>{b} of {p.seats} seats booked</span><span>{Math.round((b / Math.max(1, p.seats)) * 100)}%</span></div><Progress value={Math.min(100, (b / Math.max(1, p.seats)) * 100)} /></div>
        <div className="pkg-actions">
          <Button variant="outline" size="sm" onClick={() => setEdit(toDraft(p))}><Pencil />Edit</Button>
          <Button variant="outline" size="sm" onClick={() => setEdit(toDraft(p, true))}><Copy />Duplicate</Button>
          <Button variant="ghost" size="icon-sm" className="text-red-700" onClick={() => { setState(st => { st.packages = st.packages.filter(x => x.id !== p.id); st.leads.forEach(l => { if (l.packageId === p.id) l.packageId = null; }); log(st, "package", `Package removed: ${p.nameEn}`); }); toast.success("Package removed"); }}><Trash2 /></Button>
        </div>
      </motion.article>;
    })}</div>
    <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{edit?.id ? "Edit package" : "New package"}</DialogTitle></DialogHeader>
      {edit && <div className="field-grid">
        <label>Category<Select value={edit.category} onValueChange={v => setEdit({ ...edit, category: v as Package["category"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="umrah">Umrah</SelectItem><SelectItem value="hajj">Hajj</SelectItem></SelectContent></Select></label>
        <label>Duration (days)<Input type="number" value={edit.durationDays} onChange={e => setEdit({ ...edit, durationDays: Number(e.target.value) })} /></label>
        <label>English name<Input value={edit.nameEn} onChange={e => setEdit({ ...edit, nameEn: e.target.value })} /></label>
        <label>বাংলা নাম<Input value={edit.nameBn} onChange={e => setEdit({ ...edit, nameBn: e.target.value })} /></label>
        <label>Price per person (BDT)<Input type="number" value={edit.price} onChange={e => setEdit({ ...edit, price: Number(e.target.value) })} /></label>
        <label>Total seats<Input type="number" value={edit.seats} onChange={e => setEdit({ ...edit, seats: Number(e.target.value) })} /></label>
        <label className="wide">English description<Textarea value={edit.descriptionEn} onChange={e => setEdit({ ...edit, descriptionEn: e.target.value })} /></label>
        <label className="wide">বাংলা বিবরণ<Textarea value={edit.descriptionBn} onChange={e => setEdit({ ...edit, descriptionBn: e.target.value })} /></label>
        <label>Route — one per line<Textarea rows={4} value={edit.destinations} onChange={e => setEdit({ ...edit, destinations: e.target.value })} /></label>
        <label>Included services — one per line<Textarea rows={4} value={edit.inclusions} onChange={e => setEdit({ ...edit, inclusions: e.target.value })} /></label>
      </div>}
      <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button className="btn-shine btn-primary" onClick={save}>Save package</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
