"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { animate, motion } from "motion/react";
import type { LeadStatus, Priority, State } from "@/lib/store";
import { STATUS_LABEL, money } from "@/lib/store";

export function Counter({ value, format = "number" }: { value: number; format?: "number" | "money" | "percent" }) {
  const [shown, setShown] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: v => setShown(v) });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  if (format === "money") return <>{money(shown)}</>;
  if (format === "percent") return <>{Math.round(shown)}%</>;
  return <>{Math.round(shown).toLocaleString("en-IN")}</>;
}

export function Panel({ title, sub, action, children, className = "", delay = 0 }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; delay?: number }) {
  return <motion.section className={`crm-panel ${className}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay, ease: [0.16, 1, 0.3, 1] }}>
    {(title || action) && <header className="crm-panel-head"><div>{title && <h3>{title}</h3>}{sub && <p>{sub}</p>}</div>{action}</header>}
    {children}
  </motion.section>;
}

export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`pill st-${status}`}>{STATUS_LABEL[status]}</span>;
}
export function PriorityDot({ p }: { p: Priority }) {
  return <span className={`prio prio-${p}`} title={`${p} priority`}>{p}</span>;
}
export function Avatar({ name, color, size = 34 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, background: color || "#0e4b3e", fontSize: size * .36 }}>{initials}</span>;
}
export function Empty({ children }: { children: ReactNode }) { return <div className="crm-empty">{children}</div>; }

export function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: withTime ? undefined : "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}
export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400); return d < 30 ? `${d}d ago` : fmtDate(iso);
}

export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

/** Items that need an admin's attention — used by the dashboard and the bell. */
export type Alert = { id: string; level: "high" | "medium" | "low"; title: string; detail: string; view: string; leadId?: string };
export function attentionItems(s: State): Alert[] {
  const t = new Date().toISOString().slice(0, 10);
  const out: Alert[] = [];
  const open = s.leads.filter(l => !["completed", "lost"].includes(l.status));
  open.filter(l => !l.assignedTo).forEach(l => out.push({ id: "un-" + l.id, level: "high", title: `Unassigned: ${l.name}`, detail: `${l.ref} · assign an employee`, view: "leads", leadId: l.id }));
  open.filter(l => l.followUp && l.followUp < t).forEach(l => out.push({ id: "fu-" + l.id, level: "high", title: `Overdue follow-up: ${l.name}`, detail: `${l.ref} · due ${fmtDate(l.followUp)}`, view: "leads", leadId: l.id }));
  open.filter(l => l.passport === "missing").forEach(l => out.push({ id: "pp-" + l.id, level: "medium", title: `Passport missing: ${l.name}`, detail: `${l.ref} · collect a passport copy`, view: "leads", leadId: l.id }));
  s.leads.filter(l => l.status === "confirmed").forEach(l => {
    const due = l.amount - s.payments.filter(p => p.leadId === l.id).reduce((a, p) => a + p.amount, 0);
    if (due > 0) out.push({ id: "due-" + l.id, level: "medium", title: `Balance due: ${money(due)}`, detail: `${l.name} · ${l.ref}`, view: "accounts", leadId: l.id });
  });
  s.leads.filter(l => l.status === "quoted" && !l.amount).forEach(l => out.push({ id: "q-" + l.id, level: "low", title: `Quote has no amount: ${l.name}`, detail: l.ref, view: "leads", leadId: l.id }));
  s.packages.filter(p => !p.active).forEach(p => out.push({ id: "pk-" + p.id, level: "low", title: `Package hidden: ${p.nameEn}`, detail: "Publish it or remove it", view: "packages" }));
  s.tasks.filter(x => !x.done && x.due < t).forEach(x => out.push({ id: "tk-" + x.id, level: "medium", title: `Overdue task: ${x.title}`, detail: `Due ${fmtDate(x.due)}`, view: "employees" }));
  const marked = s.attendance[t] || {};
  const unmarked = s.employees.filter(e => e.status === "active" && !marked[e.id]).length;
  if (unmarked) out.push({ id: "att", level: "low", title: `Attendance not marked for ${unmarked} employee${unmarked > 1 ? "s" : ""}`, detail: "Mark today's attendance", view: "employees" });
  return out;
}
