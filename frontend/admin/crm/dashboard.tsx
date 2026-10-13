"use client";
import { useMemo } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowUpRight, BadgeDollarSign, CalendarClock, ChevronRight, Plane, TrendingUp, UserCheck, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { State } from "@/lib/store";
import { STATUSES, STATUS_LABEL, TYPE_LABEL, money, today } from "@/lib/store";
import { Avatar, Counter, Panel, StatusPill, attentionItems, timeAgo } from "./common";

const PIE = ["#0e4b3e", "#d3a64d", "#2b7a66", "#8fb8a8"];

export function Dashboard({ s, go, openLead }: { s: State; go: (v: string) => void; openLead: (id: string) => void }) {
  const m = useMemo(() => {
    const revenue = s.payments.reduce((a, p) => a + p.amount, 0);
    const expenses = s.expenses.reduce((a, x) => a + x.amount, 0);
    const confirmedValue = s.leads.filter(l => ["confirmed", "completed"].includes(l.status)).reduce((a, l) => a + l.amount, 0);
    const pipeline = s.leads.filter(l => ["new", "contacted", "quoted"].includes(l.status)).reduce((a, l) => a + l.amount, 0);
    const closed = s.leads.filter(l => ["completed", "lost", "confirmed"].includes(l.status));
    const won = closed.filter(l => l.status !== "lost").length;
    const conversion = closed.length ? (won / closed.length) * 100 : 0;
    const pilgrims = s.leads.filter(l => l.type === "booking" && l.status !== "lost").reduce((a, l) => a + l.travellers, 0);
    // revenue by week (last 8 weeks)
    const weeks = Array.from({ length: 8 }, (_, i) => { const end = new Date(); end.setDate(end.getDate() - (7 - i) * 7); return end; });
    const trend = weeks.map((end, i) => {
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const inRange = (iso: string) => { const d = new Date(iso); return d > start && d <= end; };
      return { name: end.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), revenue: s.payments.filter(p => inRange(p.at)).reduce((a, p) => a + p.amount, 0), leads: s.leads.filter(l => inRange(l.createdAt)).length, i };
    });
    const byType = (Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map(k => ({ name: TYPE_LABEL[k], value: s.leads.filter(l => l.type === k).length })).filter(x => x.value);
    const funnel = STATUSES.filter(x => x !== "lost").map(st => ({ name: STATUS_LABEL[st], value: s.leads.filter(l => l.status === st).length }));
    const t = today(); const att = s.attendance[t] || {};
    const present = Object.values(att).filter(v => v === "present" || v === "late").length;
    const staffPerf = s.employees.filter(e => e.status !== "inactive").map(e => {
      const mine = s.leads.filter(l => l.assignedTo === e.id);
      return { e, total: mine.length, won: mine.filter(l => ["confirmed", "completed"].includes(l.status)).length, value: mine.filter(l => ["confirmed", "completed"].includes(l.status)).reduce((a, l) => a + l.amount, 0) };
    }).filter(x => x.total).sort((a, b) => b.value - a.value).slice(0, 5);
    const followToday = s.leads.filter(l => l.followUp === t && !["completed", "lost"].includes(l.status));
    return { revenue, expenses, confirmedValue, pipeline, conversion, pilgrims, trend, byType, funnel, present, staffPerf, followToday };
  }, [s]);
  const alerts = attentionItems(s);
  const kpis = [
    { label: "Collected revenue", value: m.revenue, fmt: "money" as const, icon: BadgeDollarSign, hint: `${money(m.revenue - m.expenses)} after expenses` },
    { label: "Open pipeline", value: m.pipeline, fmt: "money" as const, icon: TrendingUp, hint: `${s.leads.filter(l => ["new", "contacted", "quoted"].includes(l.status)).length} active leads` },
    { label: "Conversion rate", value: m.conversion, fmt: "percent" as const, icon: ArrowUpRight, hint: "Confirmed ÷ closed leads" },
    { label: "Pilgrims booked", value: m.pilgrims, fmt: "number" as const, icon: Users, hint: `${s.leads.filter(l => l.type === "ticket").length} ticket requests` },
    { label: "Staff present today", value: m.present, fmt: "number" as const, icon: UserCheck, hint: `of ${s.employees.filter(e => e.status !== "inactive").length} employees` },
    { label: "Needs attention", value: alerts.length, fmt: "number" as const, icon: AlertTriangle, hint: `${alerts.filter(a => a.level === "high").length} high priority` },
  ];
  return <div className="crm-stack">
    <div className="kpi-row">
      {kpis.map((k, i) => <motion.button key={k.label} className="kpi-tile" onClick={() => go(k.label === "Needs attention" ? "attention" : k.label.startsWith("Staff") ? "employees" : k.label.includes("revenue") ? "accounts" : "leads")}
        initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * .06, duration: .5, ease: [0.16, 1, 0.3, 1] }} whileHover={{ y: -4 }}>
        <span className="kpi-icon"><k.icon /></span>
        <span className="kpi-label">{k.label}</span>
        <strong><Counter value={k.value} format={k.fmt} /></strong>
        <small>{k.hint}</small>
      </motion.button>)}
    </div>

    <div className="grid-2-1">
      <Panel title="Revenue & leads" sub="Last 8 weeks" delay={.1}>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={m.trend} margin={{ left: -10, right: 8, top: 10 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0e4b3e" stopOpacity={.35} /><stop offset="100%" stopColor="#0e4b3e" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e7eeeb" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={v => v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : String(v)} />
              <Tooltip formatter={(v, n) => n === "revenue" ? money(Number(v)) : v} contentStyle={{ borderRadius: 12, border: "1px solid #dce6e2" }} />
              <Area type="monotone" dataKey="revenue" stroke="#0e4b3e" strokeWidth={2.5} fill="url(#rev)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Service mix" sub="All requests by service" delay={.15}>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={m.byType} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} animationDuration={1000}>{m.byType.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="legend">{m.byType.map((x, i) => <span key={x.name}><i style={{ background: PIE[i % PIE.length] }} />{x.name} <b>{x.value}</b></span>)}</div>
        </div>
      </Panel>
    </div>

    <div className="grid-3">
      <Panel title="Sales pipeline" sub="Leads at each stage" delay={.2} action={<button className="link-btn" onClick={() => go("leads")}>Open <ChevronRight /></button>}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={m.funnel} layout="vertical" margin={{ left: 10, right: 16 }}>
            <XAxis type="number" hide /><YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} fontSize={12} />
            <Tooltip cursor={{ fill: "#f1f6f4" }} /><Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#2b7a66" animationDuration={1100} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Needs your attention" sub={`${alerts.length} items`} delay={.25} action={<button className="link-btn" onClick={() => go("attention")}>All <ChevronRight /></button>}>
        <ul className="alert-list">{alerts.slice(0, 6).map(a => <li key={a.id} onClick={() => a.leadId && a.view === "leads" ? openLead(a.leadId) : go(a.view)}><span className={`lvl lvl-${a.level}`} /><div><b>{a.title}</b><small>{a.detail}</small></div><ChevronRight /></li>)}</ul>
      </Panel>
      <Panel title="Top performers" sub="By confirmed booking value" delay={.3}>
        <ul className="perf-list">{m.staffPerf.map((x, i) => <li key={x.e.id}><span className="rank">{i + 1}</span><Avatar name={x.e.name} color={x.e.color} size={30} /><div><b>{x.e.name}</b><small>{x.won}/{x.total} won · {money(x.value)}</small></div></li>)}</ul>
      </Panel>
    </div>

    <div className="grid-2">
      <Panel title="Follow-ups today" sub={<><CalendarClock className="inline size-3.5" /> {m.followToday.length} scheduled</>} delay={.35}>
        {m.followToday.length ? <ul className="mini-list">{m.followToday.map(l => <li key={l.id} onClick={() => openLead(l.id)}><div><b>{l.name}</b><small>{l.ref} · {l.phone}</small></div><StatusPill status={l.status} /></li>)}</ul> : <p className="muted">No follow-ups scheduled for today.</p>}
      </Panel>
      <Panel title="Recent activity" delay={.4}>
        <ul className="timeline">{s.activity.slice(0, 7).map(a => <li key={a.id}><span className={`dot k-${a.kind}`}>{a.kind === "lead" ? <Plane /> : null}</span><div><p>{a.text}</p><small>{timeAgo(a.at)}</small></div></li>)}</ul>
      </Panel>
    </div>
  </div>;
}
