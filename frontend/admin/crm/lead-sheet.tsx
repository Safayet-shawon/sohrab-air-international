"use client";
import { useState } from "react";
import { BadgeDollarSign, Copy, MessageSquarePlus, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Lead, State } from "@/lib/store";
import { PAY_METHODS, SOURCES, STATUSES, STATUS_LABEL, TYPE_LABEL, log, money, paidFor, setState, uid } from "@/lib/store";
import { StatusPill, fmtDate, timeAgo } from "./common";

export function LeadSheet({ s, leadId, onClose }: { s: State; leadId: string | null; onClose: () => void }) {
  const lead = s.leads.find(l => l.id === leadId) || null;
  return <Sheet open={!!lead} onOpenChange={o => !o && onClose()}>
    <SheetContent className="lead-sheet w-full overflow-y-auto sm:max-w-xl">
      {lead && <LeadBody key={lead.id} s={s} lead={lead} onClose={onClose} />}
    </SheetContent>
  </Sheet>;
}

function LeadBody({ s, lead, onClose }: { s: State; lead: Lead; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [pay, setPay] = useState({ amount: "", method: "Cash", note: "" });
  const paid = paidFor(s, lead.id);
  const due = Math.max(0, lead.amount - paid);
  const update = (patch: Partial<Lead>, msg?: string) => setState(st => {
    const l = st.leads.find(x => x.id === lead.id); if (!l) return;
    if (patch.status && patch.status !== l.status) log(st, "status", `${l.ref} moved to ${STATUS_LABEL[patch.status]}`);
    if (patch.assignedTo !== undefined && patch.assignedTo !== l.assignedTo) log(st, "assign", `${l.ref} assigned to ${st.employees.find(e => e.id === patch.assignedTo)?.name || "nobody"}`);
    Object.assign(l, patch);
    if (msg) toast.success(msg);
  });
  const addNote = () => { if (!note.trim()) return; setState(st => { const l = st.leads.find(x => x.id === lead.id)!; l.notes.unshift({ at: new Date().toISOString(), by: "Admin", text: note.trim() }); log(st, "note", `Note added on ${l.ref}`); }); setNote(""); toast.success("Note added"); };
  const addPayment = () => {
    const amount = Number(pay.amount); if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    setState(st => { st.payments.unshift({ id: uid(), leadId: lead.id, amount, method: pay.method, at: new Date().toISOString(), note: pay.note || "Payment" }); log(st, "payment", `${money(amount)} received from ${lead.name} (${pay.method})`); });
    setPay({ amount: "", method: pay.method, note: "" }); toast.success("Payment recorded");
  };
  const remove = () => { setState(st => { st.leads = st.leads.filter(l => l.id !== lead.id); st.payments = st.payments.filter(p => p.leadId !== lead.id); log(st, "delete", `${lead.ref} deleted`); }); toast.success("Lead deleted"); onClose(); };
  return <>
    <SheetHeader className="lead-sheet-head">
      <div className="flex items-center gap-2"><span className="ref-chip">{lead.ref}</span><StatusPill status={lead.status} /><span className="muted text-xs">{TYPE_LABEL[lead.type]} · {timeAgo(lead.createdAt)}</span></div>
      <SheetTitle className="text-2xl font-extrabold">{lead.name}</SheetTitle>
      <SheetDescription className="flex flex-wrap gap-3">
        <a href={`tel:${lead.phone}`} className="contact-chip"><Phone className="size-3.5" />{lead.phone}</a>
        <button className="contact-chip" onClick={() => { navigator.clipboard?.writeText(lead.phone); toast.success("Phone copied"); }}><Copy className="size-3.5" />Copy</button>
        {lead.email && <span className="contact-chip">{lead.email}</span>}
      </SheetDescription>
    </SheetHeader>

    <div className="sheet-body">
      <div className="stage-track">{STATUSES.map(st => <button key={st} className={st === lead.status ? "on" : STATUSES.indexOf(st) < STATUSES.indexOf(lead.status) && lead.status !== "lost" ? "done" : ""} onClick={() => update({ status: st }, `Moved to ${STATUS_LABEL[st]}`)}>{STATUS_LABEL[st]}</button>)}</div>

      <div className="field-grid">
        <label>Assigned to<Select value={lead.assignedTo || "none"} onValueChange={v => update({ assignedTo: v === "none" ? null : v }, "Assignment updated")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{s.employees.filter(e => e.status !== "inactive").map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></label>
        <label>Priority<Select value={lead.priority} onValueChange={v => update({ priority: v as Lead["priority"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["low", "normal", "high"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select></label>
        <label>Follow-up date<Input type="date" value={lead.followUp || ""} onChange={e => update({ followUp: e.target.value || null })} /></label>
        <label>Source<Select value={lead.source} onValueChange={v => update({ source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></label>
        {lead.type === "booking" && <label>Package<Select value={lead.packageId || "none"} onValueChange={v => { const p = s.packages.find(x => x.id === v); update({ packageId: v === "none" ? null : v, ...(p ? { amount: p.price * lead.travellers } : {}) }, "Package updated"); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not selected</SelectItem>{s.packages.map(p => <SelectItem key={p.id} value={p.id}>{p.nameEn}</SelectItem>)}</SelectContent></Select></label>}
        <label>Travellers<Input type="number" min={1} value={lead.travellers} onChange={e => update({ travellers: Math.max(1, Number(e.target.value)) })} /></label>
        <label>Area<Input value={lead.area} onChange={e => update({ area: e.target.value })} /></label>
        {lead.type === "booking" && <label>Group leader<Input value={lead.groupLeader} onChange={e => update({ groupLeader: e.target.value })} /></label>}
        <label>Passport<Select value={lead.passport} onValueChange={v => update({ passport: v as Lead["passport"] }, "Passport status updated")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uploaded">Received</SelectItem><SelectItem value="missing">Missing</SelectItem><SelectItem value="not-required">Not required</SelectItem></SelectContent></Select></label>
        <label>Deal amount (BDT)<Input type="number" min={0} value={lead.amount} onChange={e => update({ amount: Math.max(0, Number(e.target.value)) })} /></label>
      </div>

      {Object.keys(lead.payload).length > 0 && <div className="kv-box"><h4>Request details</h4><dl>{Object.entries(lead.payload).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k.replace(/_/g, " ")}</dt><dd>{v}</dd></div>)}</dl></div>}

      <div className="pay-box">
        <div className="flex items-center justify-between"><h4><BadgeDollarSign className="inline size-4" /> Payments</h4><span className="muted text-sm">{money(paid)} of {money(lead.amount)}</span></div>
        <Progress value={lead.amount ? Math.min(100, (paid / lead.amount) * 100) : 0} className="my-3" />
        <p className={due ? "due" : "paid-ok"}>{due ? `Balance due ${money(due)}` : lead.amount ? "Fully paid ✓" : "No amount set"}</p>
        <div className="pay-form"><Input type="number" placeholder="Amount" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} /><Select value={pay.method} onValueChange={method => setPay({ ...pay, method })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAY_METHODS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select><Button onClick={addPayment} className="btn-shine">Record</Button></div>
        <ul className="pay-list">{s.payments.filter(p => p.leadId === lead.id).map(p => <li key={p.id}><span>{fmtDate(p.at)} · {p.method}</span><b>{money(p.amount)}</b></li>)}</ul>
      </div>

      <div className="notes-box">
        <h4><MessageSquarePlus className="inline size-4" /> Notes & call log</h4>
        <div className="flex gap-2"><Textarea rows={2} placeholder="e.g. Customer will visit office on Sunday" value={note} onChange={e => setNote(e.target.value)} /><Button onClick={addNote} disabled={!note.trim()}>Add</Button></div>
        <ul>{lead.notes.map((n, i) => <li key={i}><p>{n.text}</p><small>{n.by} · {timeAgo(n.at)}</small></li>)}</ul>
      </div>

      <Button variant="outline" className="text-red-700" onClick={remove}><Trash2 />Delete lead</Button>
    </div>
  </>;
}
