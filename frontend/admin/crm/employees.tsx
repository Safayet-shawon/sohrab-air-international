"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, CheckCircle2, Circle, ClipboardList, Download, Mail, Pencil, Phone, Plus, Search, Trash2, Trophy, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AttendanceMark, Employee, EmployeeStatus, Priority, State } from "@/lib/store";
import { DEPARTMENTS, log, money, setState, today, uid } from "@/lib/store";
import { Avatar, Counter, Empty, Panel, PriorityDot, downloadCSV, fmtDate } from "./common";

const TABS = [["directory", "Directory", Users], ["attendance", "Attendance", CalendarCheck], ["tasks", "Tasks", ClipboardList], ["payroll", "Payroll", Wallet], ["performance", "Performance", Trophy]] as const;
const COLORS = ["#0e4b3e", "#b8872e", "#2563eb", "#9333ea", "#0891b2", "#dc2626", "#db2777", "#65a30d"];

export function Employees({ s }: { s: State }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("directory");
  const active = s.employees.filter(e => e.status !== "inactive");
  const att = s.attendance[today()] || {};
  return <div className="crm-stack">
    <div className="kpi-row kpi-row-4">
      <div className="kpi-tile static"><span className="kpi-label">Employees</span><strong><Counter value={active.length} /></strong><small>{s.employees.filter(e => e.status === "on-leave").length} on leave</small></div>
      <div className="kpi-tile static good"><span className="kpi-label">Present today</span><strong><Counter value={Object.values(att).filter(v => v === "present" || v === "late").length} /></strong><small>{Object.values(att).filter(v => v === "late").length} late</small></div>
      <div className="kpi-tile static"><span className="kpi-label">Open tasks</span><strong><Counter value={s.tasks.filter(t => !t.done).length} /></strong><small>{s.tasks.filter(t => !t.done && t.due < today()).length} overdue</small></div>
      <div className="kpi-tile static"><span className="kpi-label">Monthly payroll</span><strong><Counter value={active.reduce((a, e) => a + e.salary, 0)} format="money" /></strong><small>Gross salaries</small></div>
    </div>
    <div className="seg seg-lg">{TABS.map(([k, label, Icon]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><Icon /><span>{label}</span>{tab === k && <motion.i layoutId="emp-tab" className="seg-ink" />}</button>)}</div>
    <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .25 }}>
      {tab === "directory" && <Directory s={s} />}
      {tab === "attendance" && <Attendance s={s} />}
      {tab === "tasks" && <Tasks s={s} />}
      {tab === "payroll" && <Payroll s={s} />}
      {tab === "performance" && <Performance s={s} />}
    </motion.div></AnimatePresence>
  </div>;
}

function Directory({ s }: { s: State }) {
  const [q, setQ] = useState(""), [dept, setDept] = useState("all");
  const [edit, setEdit] = useState<Employee | null>(null);
  const rows = s.employees.filter(e => (dept === "all" || e.department === dept) && [e.name, e.role, e.code, e.phone].some(x => x.toLowerCase().includes(q.toLowerCase())));
  const blank = (): Employee => ({ id: "", code: `SAI-${101 + s.employees.length}`, name: "", role: "", department: DEPARTMENTS[0], phone: "", email: "", salary: 25000, joinedAt: today(), status: "active", color: COLORS[s.employees.length % COLORS.length] });
  const save = () => {
    if (!edit) return; if (!edit.name.trim() || !edit.role.trim()) return toast.error("Name and designation are required");
    setState(st => { const e = { ...edit, id: edit.id || uid() }; const i = st.employees.findIndex(x => x.id === e.id); if (i >= 0) st.employees[i] = e; else st.employees.push(e); log(st, "employee", `Employee ${i >= 0 ? "updated" : "added"}: ${e.name}`); });
    toast.success("Employee saved"); setEdit(null);
  };
  const remove = (e: Employee) => { setState(st => { st.employees = st.employees.filter(x => x.id !== e.id); st.leads.forEach(l => { if (l.assignedTo === e.id) l.assignedTo = null; }); st.tasks.forEach(t => { if (t.assignee === e.id) t.assignee = null; }); log(st, "employee", `Employee removed: ${e.name}`); }); toast.success("Employee removed — their leads are now unassigned"); };
  return <>
    <div className="toolbar"><div className="search"><Search /><Input placeholder="Search employees…" value={q} onChange={e => setQ(e.target.value)} /></div>
      <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" onClick={() => downloadCSV(`sohrab-employees-${today()}.csv`, [["ID", "Name", "Designation", "Department", "Phone", "Email", "Salary", "Joined", "Status"], ...s.employees.map(e => [e.code, e.name, e.role, e.department, e.phone, e.email, e.salary, e.joinedAt, e.status])])}><Download />Export</Button>
      <Button className="btn-shine btn-primary" onClick={() => setEdit(blank())}><Plus />Add employee</Button></div>
    <div className="emp-grid">{rows.map((e, i) => <motion.article key={e.id} className="emp-card" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .04 }} whileHover={{ y: -4 }}>
      <div className="emp-head"><Avatar name={e.name} color={e.color} size={48} /><div><b>{e.name}</b><small>{e.role}</small></div><span className={`emp-st st-${e.status}`}>{e.status.replace("-", " ")}</span></div>
      <dl><div><dt>ID</dt><dd>{e.code}</dd></div><div><dt>Department</dt><dd>{e.department}</dd></div><div><dt>Joined</dt><dd>{fmtDate(e.joinedAt)}</dd></div><div><dt>Salary</dt><dd>{money(e.salary)}</dd></div></dl>
      <div className="emp-actions"><a href={`tel:${e.phone}`} className="icon-btn" title={e.phone}><Phone /></a><a href={`mailto:${e.email}`} className="icon-btn" title={e.email}><Mail /></a><div className="grow" /><Button variant="outline" size="sm" onClick={() => setEdit(e)}><Pencil />Edit</Button><Button variant="ghost" size="icon-sm" className="text-red-700" onClick={() => remove(e)}><Trash2 /></Button></div>
    </motion.article>)}</div>
    {!rows.length && <Empty>No employees found.</Empty>}
    <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{edit?.id ? "Edit employee" : "Add employee"}</DialogTitle></DialogHeader>
      {edit && <div className="field-grid">
        <label>Full name *<Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></label>
        <label>Employee ID<Input value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} /></label>
        <label>Designation *<Input value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })} /></label>
        <label>Department<Select value={edit.department} onValueChange={department => setEdit({ ...edit, department })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></label>
        <label>Phone<Input value={edit.phone} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></label>
        <label>Email<Input value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} /></label>
        <label>Monthly salary (BDT)<Input type="number" value={edit.salary} onChange={e => setEdit({ ...edit, salary: Number(e.target.value) })} /></label>
        <label>Joining date<Input type="date" value={edit.joinedAt} onChange={e => setEdit({ ...edit, joinedAt: e.target.value })} /></label>
        <label>Status<Select value={edit.status} onValueChange={v => setEdit({ ...edit, status: v as EmployeeStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on-leave">On leave</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></label>
      </div>}
      <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button className="btn-shine btn-primary" onClick={save}>Save</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}

const MARKS: [AttendanceMark, string][] = [["present", "P"], ["late", "L"], ["absent", "A"], ["leave", "LV"]];
function Attendance({ s }: { s: State }) {
  const [date, setDate] = useState(today());
  const day = s.attendance[date] || {};
  const staff = s.employees.filter(e => e.status !== "inactive");
  const days = useMemo(() => Object.keys(s.attendance).sort().slice(-14), [s.attendance]);
  const mark = (id: string, m: AttendanceMark) => setState(st => { st.attendance[date] = { ...(st.attendance[date] || {}), [id]: m }; });
  const markAll = () => { setState(st => { st.attendance[date] = Object.fromEntries(staff.map(e => [e.id, (st.attendance[date] || {})[e.id] || (e.status === "on-leave" ? "leave" : "present")])); log(st, "attendance", `Attendance completed for ${fmtDate(date)}`); }); toast.success("Remaining staff marked present"); };
  const rate = (id: string) => { const d = days.filter(k => s.attendance[k][id]); return d.length ? Math.round(d.filter(k => ["present", "late"].includes(s.attendance[k][id])).length / d.length * 100) : 0; };
  return <div className="grid-2-1">
    <Panel title="Daily attendance" sub={fmtDate(date)} action={<div className="flex gap-2"><Input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} className="w-40" /><Button className="btn-shine btn-primary" onClick={markAll}><CheckCircle2 />Mark rest present</Button></div>}>
      <ul className="att-list">{staff.map(e => <li key={e.id}><Avatar name={e.name} color={e.color} size={34} /><div><b>{e.name}</b><small>{e.role}</small></div>
        <div className="att-marks">{MARKS.map(([m, l]) => <button key={m} className={`mk mk-${m} ${day[e.id] === m ? "on" : ""}`} onClick={() => mark(e.id, m)} title={m}>{l}</button>)}</div></li>)}</ul>
    </Panel>
    <Panel title="Attendance rate" sub="Last 14 working days">
      <ul className="perf-list">{staff.map(e => <li key={e.id}><Avatar name={e.name} color={e.color} size={28} /><div className="grow"><div className="flex justify-between text-sm"><b>{e.name.split(" ").slice(-2).join(" ")}</b><span>{rate(e.id)}%</span></div><Progress value={rate(e.id)} className="mt-1.5" /></div></li>)}</ul>
      <div className="heat">{days.map(k => <div key={k} title={fmtDate(k)}><small>{new Date(k + "T00:00:00").getDate()}</small>{staff.map(e => <i key={e.id} className={`h-${s.attendance[k][e.id] || "none"}`} />)}</div>)}</div>
    </Panel>
  </div>;
}

function Tasks({ s }: { s: State }) {
  const [f, setF] = useState({ title: "", assignee: "none", due: today(), priority: "normal" as Priority });
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const add = () => { if (!f.title.trim()) return; setState(st => { st.tasks.unshift({ id: uid(), title: f.title.trim(), assignee: f.assignee === "none" ? null : f.assignee, due: f.due, priority: f.priority, done: false, leadId: null }); log(st, "task", `Task assigned: ${f.title}`); }); setF({ ...f, title: "" }); toast.success("Task assigned"); };
  const rows = s.tasks.filter(t => filter === "all" || (filter === "done" ? t.done : !t.done)).sort((a, b) => a.due.localeCompare(b.due));
  return <Panel title="Team tasks" action={<div className="seg">{(["open", "done", "all"] as const).map(k => <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{k}</button>)}</div>}>
    <div className="task-form"><Input placeholder="What needs to be done?" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} onKeyDown={e => e.key === "Enter" && add()} />
      <Select value={f.assignee} onValueChange={assignee => setF({ ...f, assignee })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{s.employees.filter(e => e.status !== "inactive").map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
      <Input type="date" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} />
      <Select value={f.priority} onValueChange={v => setF({ ...f, priority: v as Priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["low", "normal", "high"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      <Button className="btn-shine btn-primary" onClick={add}><Plus />Assign</Button></div>
    <ul className="task-list"><AnimatePresence initial={false}>{rows.map(t => { const e = s.employees.find(x => x.id === t.assignee); const late = !t.done && t.due < today(); return <motion.li key={t.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={t.done ? "done" : ""}>
      <button className="check" onClick={() => setState(st => { const x = st.tasks.find(y => y.id === t.id)!; x.done = !x.done; if (x.done) log(st, "task", `Task completed: ${x.title}`); })}>{t.done ? <CheckCircle2 /> : <Circle />}</button>
      <div className="grow"><b>{t.title}</b><small className={late ? "overdue" : ""}>{e?.name || "Unassigned"} · due {fmtDate(t.due)}{late ? " · overdue" : ""}</small></div><PriorityDot p={t.priority} />
      <button className="icon-btn" onClick={() => setState(st => { st.tasks = st.tasks.filter(x => x.id !== t.id); })}><Trash2 /></button></motion.li>; })}</AnimatePresence></ul>
    {!rows.length && <Empty>Nothing here.</Empty>}
  </Panel>;
}

function Payroll({ s }: { s: State }) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const paid = s.payroll[month] || [];
  const staff = s.employees.filter(e => e.status !== "inactive");
  const days = Object.keys(s.attendance).filter(k => k.startsWith(month));
  const row = (e: Employee) => { const absent = days.filter(k => s.attendance[k][e.id] === "absent").length; const deduction = Math.round(e.salary / 26 * absent); return { absent, deduction, net: e.salary - deduction }; };
  const total = staff.reduce((a, e) => a + row(e).net, 0);
  const pay = (ids: string[]) => setState(st => {
    const before = st.payroll[month] || []; const fresh = ids.filter(id => !before.includes(id));
    st.payroll[month] = [...before, ...fresh];
    const amount = staff.filter(e => fresh.includes(e.id)).reduce((a, e) => a + row(e).net, 0);
    if (amount) { st.expenses.unshift({ id: uid(), title: `Salary ${month} (${fresh.length} staff)`, category: "Salary", amount, at: new Date().toISOString() }); log(st, "payroll", `Salary paid ${money(amount)} for ${month}`); }
  });
  return <Panel title="Payroll" sub={`Net payable ${money(total)} · absent days deducted at salary ÷ 26`} action={<div className="flex gap-2"><Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40" /><Button className="btn-shine btn-primary" onClick={() => { pay(staff.map(e => e.id)); toast.success("Payroll processed and added to expenses"); }}><Wallet />Pay all</Button></div>} className="p-0">
    <div className="table-wrap"><table className="crm-table"><thead><tr><th>Employee</th><th className="num">Gross</th><th className="num">Absent</th><th className="num">Deduction</th><th className="num">Net</th><th>Status</th></tr></thead>
      <tbody>{staff.map(e => { const r = row(e); const done = paid.includes(e.id); return <tr key={e.id}><td><span className="owner"><Avatar name={e.name} color={e.color} size={26} />{e.name}</span></td><td className="num">{money(e.salary)}</td><td className="num">{r.absent}</td><td className="num">{r.deduction ? "−" + money(r.deduction) : "—"}</td><td className="num"><b>{money(r.net)}</b></td><td>{done ? <span className="pill st-completed">Paid</span> : <Button size="xs" variant="outline" onClick={() => { pay([e.id]); toast.success(`Salary paid to ${e.name}`); }}>Mark paid</Button>}</td></tr>; })}</tbody></table></div>
  </Panel>;
}

function Performance({ s }: { s: State }) {
  const rows = s.employees.filter(e => e.status !== "inactive").map(e => {
    const mine = s.leads.filter(l => l.assignedTo === e.id); const won = mine.filter(l => ["confirmed", "completed"].includes(l.status));
    return { e, total: mine.length, won: won.length, value: won.reduce((a, l) => a + l.amount, 0), open: mine.filter(l => ["new", "contacted", "quoted"].includes(l.status)).length, tasks: s.tasks.filter(t => t.assignee === e.id && t.done).length };
  }).sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map(r => r.value));
  return <Panel title="Leaderboard" sub="Lead conversion and booking value by employee">
    <ul className="leader-list">{rows.map((r, i) => <motion.li key={r.e.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }}>
      <span className={`rank r${i + 1}`}>{i + 1}</span><Avatar name={r.e.name} color={r.e.color} size={36} />
      <div className="grow"><div className="flex flex-wrap justify-between gap-2"><b>{r.e.name}</b><span className="muted text-sm">{r.won}/{r.total} won · {r.open} open · {r.tasks} tasks done</span></div>
        <div className="lb-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(3, r.value / max * 100)}%` }} transition={{ duration: 1, delay: .2 + i * .05 }} /></div></div>
      <b className="lb-val">{money(r.value)}</b></motion.li>)}</ul>
  </Panel>;
}
