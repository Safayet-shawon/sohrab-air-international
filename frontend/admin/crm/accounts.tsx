"use client";
import { useMemo, useState } from "react";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { State } from "@/lib/store";
import { TYPE_LABEL, log, money, paidFor, setState, today, uid } from "@/lib/store";
import { Counter, Empty, Panel, StatusPill, downloadCSV, fmtDate } from "./common";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const EXP_CATS = ["Rent", "Salary", "Marketing", "Utilities", "Operations", "Travel", "Other"];

export function Accounts({ s, openLead }: { s: State; openLead: (id: string) => void }) {
  const [exp, setExp] = useState({ title: "", category: "Operations", amount: "" });
  const invoices = useMemo(() => s.leads.filter(l => ["confirmed", "completed"].includes(l.status) && l.amount > 0).map(l => ({ l, paid: paidFor(s, l.id) })), [s]);
  const invoiced = invoices.reduce((a, x) => a + x.l.amount, 0);
  const collected = s.payments.reduce((a, p) => a + p.amount, 0);
  const due = invoices.reduce((a, x) => a + Math.max(0, x.l.amount - x.paid), 0);
  const spent = s.expenses.reduce((a, x) => a + x.amount, 0);
  const months = useMemo(() => {
    const keys: string[] = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); keys.push(d.toISOString().slice(0, 7)); }
    return keys.map(k => ({ name: new Date(k + "-01").toLocaleDateString("en-GB", { month: "short" }), Income: s.payments.filter(p => p.at.startsWith(k)).reduce((a, p) => a + p.amount, 0), Expenses: s.expenses.filter(x => x.at.startsWith(k)).reduce((a, x) => a + x.amount, 0) }));
  }, [s]);
  const addExpense = () => {
    const amount = Number(exp.amount); if (!exp.title.trim() || !amount) return toast.error("Add a title and amount");
    setState(st => { st.expenses.unshift({ id: uid(), title: exp.title.trim(), category: exp.category, amount, at: new Date().toISOString() }); log(st, "expense", `Expense ${money(amount)} — ${exp.title}`); });
    setExp({ title: "", category: exp.category, amount: "" }); toast.success("Expense added");
  };
  const printInvoice = (id: string) => {
    const x = invoices.find(i => i.l.id === id); if (!x) return;
    const w = window.open("", "_blank", "width=720,height=900"); if (!w) return;
    const rows = s.payments.filter(p => p.leadId === id).map(p => `<tr><td>${fmtDate(p.at)}</td><td>${esc(p.method)}</td><td>${esc(p.note)}</td><td style="text-align:right">${money(p.amount)}</td></tr>`).join("");
    w.document.write(`<html><head><title>Invoice ${esc(x.l.ref)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:40px;color:#172b27}h1{color:#0e4b3e;margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.tot{font-size:18px;font-weight:700}</style></head><body><h1>Sohrab Air International</h1><p>Mouchak Market, Dhaka · 01720 531113 · Hajj Licence 0968</p><hr/><h2>Invoice ${esc(x.l.ref)}</h2><p><b>${esc(x.l.name)}</b><br/>${esc(x.l.phone)}<br/>${esc(x.l.area)}</p><p>Service: ${TYPE_LABEL[x.l.type]} · Travellers: ${x.l.travellers}</p><table><tr><th>Date</th><th>Method</th><th>Note</th><th style="text-align:right">Amount</th></tr>${rows}</table><p class="tot">Total: ${money(x.l.amount)}<br/>Paid: ${money(x.paid)}<br/>Balance: ${money(Math.max(0, x.l.amount - x.paid))}</p><script>window.print()</script></body></html>`);
    w.document.close();
  };
  return <div className="crm-stack">
    <div className="kpi-row kpi-row-5">
      {[["Invoiced", invoiced], ["Collected", collected], ["Outstanding", due], ["Expenses", spent], ["Net profit", collected - spent]].map(([k, v], i) =>
        <div key={k as string} className={`kpi-tile static ${i === 2 ? "warn" : i === 4 ? "good" : ""}`}><span className="kpi-label">{k}</span><strong><Counter value={v as number} format="money" /></strong></div>)}
    </div>
    <div className="grid-2-1">
      <Panel title="Income vs expenses" sub="Last 6 months">
        <ResponsiveContainer width="100%" height={250}><BarChart data={months} margin={{ left: -8 }}><CartesianGrid vertical={false} stroke="#e7eeeb" /><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} /><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={v => v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : String(v)} /><Tooltip formatter={v => money(Number(v))} /><Legend /><Bar dataKey="Income" fill="#0e4b3e" radius={[6, 6, 0, 0]} animationDuration={1100} /><Bar dataKey="Expenses" fill="#d3a64d" radius={[6, 6, 0, 0]} animationDuration={1100} /></BarChart></ResponsiveContainer>
      </Panel>
      <Panel title="Add expense">
        <div className="grid gap-3">
          <Input placeholder="e.g. Visa processing fees" value={exp.title} onChange={e => setExp({ ...exp, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-2"><Select value={exp.category} onValueChange={category => setExp({ ...exp, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXP_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Input type="number" placeholder="Amount" value={exp.amount} onChange={e => setExp({ ...exp, amount: e.target.value })} /></div>
          <Button className="btn-shine btn-primary" onClick={addExpense}><Plus />Add expense</Button>
        </div>
        <ul className="pay-list mt-4">{s.expenses.slice(0, 6).map(x => <li key={x.id}><span>{x.title}<small className="block muted">{x.category} · {fmtDate(x.at)}</small></span><span className="flex items-center gap-2"><b>{money(x.amount)}</b><button className="icon-btn" onClick={() => setState(st => { st.expenses = st.expenses.filter(e => e.id !== x.id); })}><Trash2 /></button></span></li>)}</ul>
      </Panel>
    </div>
    <Panel title="Invoices" sub="Confirmed and completed bookings" action={<Button variant="outline" size="sm" onClick={() => downloadCSV(`sohrab-invoices-${today()}.csv`, [["Ref", "Customer", "Phone", "Service", "Total", "Paid", "Due"], ...invoices.map(({ l, paid }) => [l.ref, l.name, l.phone, TYPE_LABEL[l.type], l.amount, paid, Math.max(0, l.amount - paid)])])}><Download />CSV</Button>} className="p-0">
      <div className="table-wrap"><table className="crm-table">
        <thead><tr><th>Invoice</th><th>Customer</th><th>Stage</th><th className="num">Total</th><th className="num">Paid</th><th className="num">Due</th><th /></tr></thead>
        <tbody>{invoices.map(({ l, paid }) => <tr key={l.id} onClick={() => openLead(l.id)}><td><b>{l.ref}</b></td><td>{l.name}<small className="block muted">{TYPE_LABEL[l.type]}</small></td><td><StatusPill status={l.status} /></td><td className="num">{money(l.amount)}</td><td className="num">{money(paid)}</td><td className={`num ${l.amount - paid > 0 ? "overdue" : "ok"}`}>{money(Math.max(0, l.amount - paid))}</td><td><button className="icon-btn" title="Print invoice" onClick={e => { e.stopPropagation(); printInvoice(l.id); }}><Printer /></button></td></tr>)}</tbody>
      </table></div>
      {!invoices.length && <Empty>No invoices yet.</Empty>}
    </Panel>
  </div>;
}
