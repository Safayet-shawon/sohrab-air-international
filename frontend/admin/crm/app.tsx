"use client";
import { useEffect, useState } from "react";
import { BASE } from "@/lib/mode";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Bell, Boxes, CheckCheck, ChevronRight, Database, Download, LayoutDashboard, Menu, RotateCcw, Search, Upload, Users, Wallet, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { State } from "@/lib/store";
import { getState, resetDemo, setState, today, useCRM } from "@/lib/store";
import { Avatar, Panel, attentionItems } from "./common";
import { Dashboard } from "./dashboard";
import { Leads } from "./leads";
import { LeadSheet } from "./lead-sheet";
import { Accounts } from "./accounts";
import { Packages } from "./packages";
import { Employees } from "./employees";

const NAV = [
  ["dashboard", "Dashboard", LayoutDashboard], ["leads", "Leads & CRM", Zap], ["accounts", "Accounts", Wallet],
  ["packages", "Packages", Boxes], ["employees", "Employees", Users], ["attention", "Needs attention", AlertTriangle], ["settings", "Data & settings", Database],
] as const;
type View = (typeof NAV)[number][0];
const TITLES: Record<View, [string, string]> = {
  dashboard: ["Good to see you", "Here is what is happening at Sohrab Air today."],
  leads: ["Leads & CRM", "Every website request, call and walk-in in one pipeline."],
  accounts: ["Accounts", "Invoices, collections, dues and expenses."],
  packages: ["Packages", "Manage Hajj & Umrah packages shown on the website."],
  employees: ["Employees", "Staff directory, attendance, tasks, payroll and performance."],
  attention: ["Needs attention", "Items in the system waiting for an admin."],
  settings: ["Data & settings", "Backup, restore and reset."],
};

export function CRMApp() {
  const s = useCRM();
  const [view, setView] = useState<View>(() => { try { const v = sessionStorage.getItem("crm-view") as View | null; if (v && NAV.some(n => n[0] === v)) return v; } catch { /* ignore */ } return "dashboard"; });
  const [leadId, setLeadId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  useEffect(() => { try { sessionStorage.setItem("crm-view", view); } catch { /* ignore */ } window.scrollTo({ top: 0, behavior: "smooth" }); }, [view]);
  if (!s) return <div className="crm-boot"><div className="crm-loader"><img src={`${BASE}/brand-logo.svg`} alt="" /><span /></div><p>Opening admin panel…</p></div>;
  const alerts = attentionItems(s);
  const go = (v: string) => { setView(v as View); setMenu(false); };
  const openLead = (id: string) => setLeadId(id);
  const [title, sub] = TITLES[view];
  return <div className="crm">
    <aside className={`crm-side ${menu ? "open" : ""}`}>
      <div className="crm-brand"><img src={`${BASE}/brand-logo.svg`} alt="" /><div><b>Sohrab Air</b><small>Agency CRM</small></div><button className="crm-close" onClick={() => setMenu(false)}><X /></button></div>
      <nav>{NAV.map(([k, label, Icon]) => <button key={k} className={view === k ? "on" : ""} onClick={() => go(k)}>
        {view === k && <motion.span layoutId="nav-ink" className="nav-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
        <Icon /><span>{label}</span>
        {k === "attention" && alerts.length > 0 && <em>{alerts.length}</em>}
        {k === "leads" && <em className="soft">{s.leads.filter(l => l.status === "new").length}</em>}
      </button>)}</nav>
      <div className="crm-side-foot">
        <div className="me"><Avatar name="Md Sohrab Hossain" color="#b8872e" size={36} /><div><b>Owner</b><small>Full access</small></div></div>
        <Link href="/" className="back-site"><ArrowLeft />Back to website</Link>
      </div>
    </aside>
    {menu && <div className="crm-scrim" onClick={() => setMenu(false)} />}

    <main className="crm-main">
      <header className="crm-top">
        <button className="crm-burger" onClick={() => setMenu(true)}><Menu /></button>
        <form className="search top-search" onSubmit={e => { e.preventDefault(); setView("leads"); setSearchKey(k => k + 1); }}><Search /><Input placeholder="Search leads by name, phone or ref…" value={search} onChange={e => setSearch(e.target.value)} /></form>
        <span className="demo-badge" title="Data is stored in this browser">Demo mode</span>
        <div className="bell-wrap">
          <button className="bell" onClick={() => setBell(b => !b)}><Bell />{alerts.length > 0 && <motion.em key={alerts.length} initial={{ scale: 0 }} animate={{ scale: 1 }}>{alerts.length}</motion.em>}</button>
          <AnimatePresence>{bell && <motion.div className="bell-pop" initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}>
            <header><b>Notifications</b><button onClick={() => { setBell(false); go("attention"); }}>View all</button></header>
            <ul>{alerts.slice(0, 6).map(a => <li key={a.id} onClick={() => { setBell(false); if (a.leadId && a.view === "leads") openLead(a.leadId); else go(a.view); }}><span className={`lvl lvl-${a.level}`} /><div><b>{a.title}</b><small>{a.detail}</small></div></li>)}</ul>
            {!alerts.length && <p className="muted p-4">All clear ✓</p>}
          </motion.div>}</AnimatePresence>
        </div>
      </header>

      <div className="crm-content">
        <motion.div key={view + "-h"} className="crm-heading" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .35 }}>
          <div><span className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><h1>{title}</h1><p>{sub}</p></div>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div key={view + searchKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .28, ease: [0.16, 1, 0.3, 1] }}>
            {view === "dashboard" && <Dashboard s={s} go={go} openLead={openLead} />}
            {view === "leads" && <Leads s={s} openLead={openLead} query={search} />}
            {view === "accounts" && <Accounts s={s} openLead={openLead} />}
            {view === "packages" && <Packages s={s} />}
            {view === "employees" && <Employees s={s} />}
            {view === "attention" && <Attention s={s} go={go} openLead={openLead} />}
            {view === "settings" && <Settings s={s} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
    <LeadSheet s={s} leadId={leadId} onClose={() => setLeadId(null)} />
  </div>;
}

function Attention({ s, go, openLead }: { s: State; go: (v: string) => void; openLead: (id: string) => void }) {
  const items = attentionItems(s);
  const groups = (["high", "medium", "low"] as const).map(l => [l, items.filter(i => i.level === l)] as const);
  const autoAssign = () => {
    let n = 0;
    setState(st => {
      const load = (id: string) => st.leads.filter(l => l.assignedTo === id && !["completed", "lost"].includes(l.status)).length;
      const dept: Record<string, string> = { booking: "Hajj & Umrah", ticket: "Ticketing", job: "Recruitment", leader: "Hajj & Umrah" };
      st.leads.filter(l => !l.assignedTo && !["completed", "lost"].includes(l.status)).forEach(l => {
        const pool = st.employees.filter(e => e.status === "active" && e.department === dept[l.type]);
        const pick = (pool.length ? pool : st.employees.filter(e => e.status === "active")).sort((a, b) => load(a.id) - load(b.id))[0];
        if (pick) { l.assignedTo = pick.id; n++; }
      });
      if (n) st.activity.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), kind: "assign", text: `Auto-assigned ${n} leads by department and workload` });
    });
    toast.success(n ? `Assigned ${n} lead${n > 1 ? "s" : ""} to the least-busy staff in each department` : "No unassigned leads");
  };
  const rollFollowUps = () => { setState(st => { st.leads.forEach(l => { if (l.followUp && l.followUp < today() && !["completed", "lost"].includes(l.status)) l.followUp = today(); }); }); toast.success("Overdue follow-ups moved to today"); };
  return <div className="crm-stack">
    <div className="toolbar"><Button className="btn-shine btn-primary" onClick={autoAssign}><Zap />Auto-assign unassigned leads</Button><Button variant="outline" onClick={rollFollowUps}><RotateCcw />Move overdue follow-ups to today</Button></div>
    {!items.length && <Panel><div className="all-clear"><CheckCheck /><h3>All clear</h3><p>Nothing needs your attention right now.</p></div></Panel>}
    {groups.filter(([, g]) => g.length).map(([lvl, g], gi) => <Panel key={lvl} title={<><span className={`lvl lvl-${lvl}`} /> {lvl === "high" ? "Urgent" : lvl === "medium" ? "Important" : "Housekeeping"}</>} sub={`${g.length} item${g.length > 1 ? "s" : ""}`} delay={gi * .08}>
      <ul className="alert-list">{g.map(a => <li key={a.id} onClick={() => a.leadId && a.view === "leads" ? openLead(a.leadId) : a.leadId ? openLead(a.leadId) : go(a.view)}><span className={`lvl lvl-${a.level}`} /><div><b>{a.title}</b><small>{a.detail}</small></div><ChevronRight /></li>)}</ul>
    </Panel>)}
  </div>;
}

function Settings({ s }: { s: State }) {
  const backup = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = `sohrab-crm-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url); toast.success("Backup downloaded"); };
  const restore = (file: File) => { file.text().then(t => { const data = JSON.parse(t) as State; if (!Array.isArray(data.leads) || !Array.isArray(data.employees)) throw new Error("Not a Sohrab CRM backup"); setState(() => data); toast.success("Backup restored"); }).catch(e => toast.error(e instanceof Error ? e.message : "Restore failed")); };
  return <div className="grid-2">
    <Panel title="Backup & restore" sub="Download everything as a JSON file, or restore a previous backup.">
      <div className="flex flex-wrap gap-2"><Button className="btn-shine btn-primary" onClick={backup}><Download />Download backup</Button>
        <label className="upload-btn"><Upload />Restore backup<input type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && restore(e.target.files[0])} /></label></div>
      <dl className="stat-dl"><div><dt>Leads</dt><dd>{s.leads.length}</dd></div><div><dt>Payments</dt><dd>{s.payments.length}</dd></div><div><dt>Employees</dt><dd>{s.employees.length}</dd></div><div><dt>Packages</dt><dd>{s.packages.length}</dd></div></dl>
    </Panel>
    <Panel title="About this deployment" sub="Demo mode">
      <p className="muted">This site runs without the Java backend, so all data is saved in this browser only. Website form submissions made in this browser appear here instantly. To collect real customer requests across devices, deploy the backend (Docker stack in the repository) — it keeps password-protected admin access for passport data.</p>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-4 text-red-700"><RotateCcw />Reset to sample data</Button></AlertDialogTrigger>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset all data?</AlertDialogTitle><AlertDialogDescription>Everything in this browser is replaced with the original sample data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { resetDemo(); toast.success("Sample data restored"); }}>Reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Panel>
  </div>;
}
