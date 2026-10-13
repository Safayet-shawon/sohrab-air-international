"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, KanbanSquare, List, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Lead, LeadStatus, LeadType, State } from "@/lib/store";
import { SOURCES, STATUSES, STATUS_LABEL, TYPE_LABEL, log, money, paidFor, refFor, setState, today, uid } from "@/lib/store";
import { Avatar, Empty, Panel, PriorityDot, StatusPill, downloadCSV, fmtDate } from "./common";

export function Leads({ s, openLead, query }: { s: State; openLead: (id: string) => void; query: string }) {
  const [q, setQ] = useState(query);
  const [type, setType] = useState("all"), [status, setStatus] = useState("all"), [owner, setOwner] = useState("all");
  const [view, setView] = useState<"table" | "board">("table");
  const [creating, setCreating] = useState(false);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return s.leads.filter(l => (type === "all" || l.type === type) && (status === "all" || l.status === status) && (owner === "all" || (owner === "none" ? !l.assignedTo : l.assignedTo === owner))
      && (!term || [l.name, l.phone, l.ref, l.area, l.email, l.groupLeader].some(x => x?.toLowerCase().includes(term))));
  }, [s.leads, q, type, status, owner]);
  const emp = (id: string | null) => s.employees.find(e => e.id === id);
  const exportCSV = () => downloadCSV(`sohrab-leads-${today()}.csv`, [["Ref", "Type", "Status", "Name", "Phone", "Email", "Area", "Travellers", "Assigned", "Amount", "Paid", "Created"],
    ...rows.map(l => [l.ref, TYPE_LABEL[l.type], STATUS_LABEL[l.status], l.name, l.phone, l.email, l.area, l.travellers, emp(l.assignedTo)?.name || "", l.amount, paidFor(s, l.id), fmtDate(l.createdAt)])]);
  const move = (id: string, st: LeadStatus) => setState(x => { const l = x.leads.find(y => y.id === id); if (l && l.status !== st) { l.status = st; log(x, "status", `${l.ref} moved to ${STATUS_LABEL[st]}`); toast.success(`${l.name} → ${STATUS_LABEL[st]}`); } });

  return <div className="crm-stack">
    <div className="toolbar">
      <div className="search"><Search /><Input placeholder="Search name, phone, ref, area…" value={q} onChange={e => setQ(e.target.value)} /></div>
      <Select value={type} onValueChange={setType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All services</SelectItem>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{STATUSES.map(k => <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>)}</SelectContent></Select>
      <Select value={owner} onValueChange={setOwner}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Everyone</SelectItem><SelectItem value="none">Unassigned</SelectItem>{s.employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
      <div className="seg"><button className={view === "table" ? "on" : ""} onClick={() => setView("table")}><List />Table</button><button className={view === "board" ? "on" : ""} onClick={() => setView("board")}><KanbanSquare />Board</button></div>
      <Button variant="outline" onClick={exportCSV}><Download />Export</Button>
      <Button className="btn-shine btn-primary" onClick={() => setCreating(true)}><Plus />New lead</Button>
    </div>

    {view === "table" ? <Panel className="p-0">
      <div className="table-wrap"><table className="crm-table">
        <thead><tr><th>Lead</th><th>Service</th><th>Stage</th><th>Assigned</th><th>Follow-up</th><th className="num">Value</th><th className="num">Paid</th></tr></thead>
        <tbody><AnimatePresence initial={false}>{rows.map((l, i) => {
          const e = emp(l.assignedTo); const paid = paidFor(s, l.id); const overdue = l.followUp && l.followUp < today() && !["completed", "lost"].includes(l.status);
          return <motion.tr key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i, 15) * .015 }} onClick={() => openLead(l.id)}>
            <td><div className="lead-cell"><b>{l.name}</b><small>{l.ref} · {l.phone}</small></div></td>
            <td><span className="svc">{TYPE_LABEL[l.type]}</span><small className="block muted">{l.area}</small></td>
            <td><StatusPill status={l.status} /> <PriorityDot p={l.priority} /></td>
            <td>{e ? <span className="owner"><Avatar name={e.name} color={e.color} size={24} />{e.name.split(" ").slice(-1)}</span> : <span className="unassigned">Unassigned</span>}</td>
            <td className={overdue ? "overdue" : ""}>{fmtDate(l.followUp)}</td>
            <td className="num">{l.amount ? money(l.amount) : "—"}</td>
            <td className="num">{paid ? money(paid) : "—"}</td>
          </motion.tr>;
        })}</AnimatePresence></tbody>
      </table></div>
      {!rows.length && <Empty>No leads match these filters.</Empty>}
    </Panel> : <Board rows={rows} s={s} openLead={openLead} move={move} />}
    <NewLead open={creating} onClose={() => setCreating(false)} s={s} openLead={openLead} />
  </div>;
}

function Board({ rows, s, openLead, move }: { rows: Lead[]; s: State; openLead: (id: string) => void; move: (id: string, st: LeadStatus) => void }) {
  const [over, setOver] = useState<string | null>(null);
  return <div className="board">{STATUSES.map(st => {
    const col = rows.filter(l => l.status === st);
    return <div key={st} className={`board-col ${over === st ? "drop" : ""}`} onDragOver={e => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)} onDrop={e => { e.preventDefault(); setOver(null); move(e.dataTransfer.getData("text/plain"), st); }}>
      <header><StatusPill status={st} /><span>{col.length}</span><small>{money(col.reduce((a, l) => a + l.amount, 0))}</small></header>
      <AnimatePresence>{col.map(l => {
        const e = s.employees.find(x => x.id === l.assignedTo);
        return <motion.article key={l.id} layout layoutId={l.id} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }} whileHover={{ y: -3 }}
          draggable onDragStartCapture={(ev: React.DragEvent) => ev.dataTransfer.setData("text/plain", l.id)} onClick={() => openLead(l.id)} className="board-card">
          <div className="flex items-center justify-between"><span className="ref-chip">{l.ref}</span><PriorityDot p={l.priority} /></div>
          <b>{l.name}</b><small>{TYPE_LABEL[l.type]} · {l.area}</small>
          <div className="flex items-center justify-between"><span className="amt">{l.amount ? money(l.amount) : "—"}</span>{e ? <Avatar name={e.name} color={e.color} size={22} /> : <span className="unassigned">—</span>}</div>
        </motion.article>;
      })}</AnimatePresence>
    </div>;
  })}</div>;
}

function NewLead({ open, onClose, s, openLead }: { open: boolean; onClose: () => void; s: State; openLead: (id: string) => void }) {
  const blank = { name: "", phone: "", email: "", type: "booking" as LeadType, area: "", travellers: 1, packageId: "none", source: "Walk-in", assignedTo: "none" };
  const [f, setF] = useState(blank);
  const save = () => {
    if (!f.name.trim() || !f.phone.trim()) return toast.error("Name and phone are required");
    const id = uid(); const pkg = s.packages.find(p => p.id === f.packageId);
    setState(st => {
      const ref = refFor(f.type, 1000 + st.leads.length + 37);
      st.leads.unshift({ id, ref, type: f.type, status: "new", priority: "normal", source: f.source, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), area: f.area || "Unspecified", travellers: f.travellers, groupLeader: "", packageId: pkg?.id || null, assignedTo: f.assignedTo === "none" ? null : f.assignedTo, followUp: today(), amount: pkg ? pkg.price * f.travellers : 0, passport: f.type === "booking" || f.type === "job" ? "missing" : "not-required", payload: pkg ? { package: pkg.nameEn, journey_kind: pkg.category } : {}, notes: [], createdAt: new Date().toISOString() });
      log(st, "lead", `New ${TYPE_LABEL[f.type]} lead added: ${f.name} (${ref})`);
    });
    toast.success("Lead created"); setF(blank); onClose(); setTimeout(() => openLead(id), 250);
  };
  return <Dialog open={open} onOpenChange={o => !o && onClose()}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>New lead</DialogTitle></DialogHeader>
    <div className="field-grid">
      <label>Full name *<Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label>Mobile *<Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label>
      <label>Service<Select value={f.type} onValueChange={v => setF({ ...f, type: v as LeadType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label>
      <label>Source<Select value={f.source} onValueChange={v => setF({ ...f, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></label>
      {f.type === "booking" && <label>Package<Select value={f.packageId} onValueChange={v => setF({ ...f, packageId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not selected</SelectItem>{s.packages.map(p => <SelectItem key={p.id} value={p.id}>{p.nameEn}</SelectItem>)}</SelectContent></Select></label>}
      <label>Travellers<Input type="number" min={1} value={f.travellers} onChange={e => setF({ ...f, travellers: Math.max(1, Number(e.target.value)) })} /></label>
      <label>Area<Input value={f.area} onChange={e => setF({ ...f, area: e.target.value })} /></label>
      <label>Assign to<Select value={f.assignedTo} onValueChange={v => setF({ ...f, assignedTo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{s.employees.filter(e => e.status !== "inactive").map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></label>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="btn-shine btn-primary" onClick={save}>Create lead</Button></DialogFooter>
  </DialogContent></Dialog>;
}
