"use client";
import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type LeadType = "booking" | "ticket" | "job" | "leader";
export type LeadStatus = "new" | "contacted" | "quoted" | "confirmed" | "completed" | "lost";
export type Priority = "low" | "normal" | "high";
export type Note = { at: string; by: string; text: string };
export type Lead = {
  id: string; ref: string; type: LeadType; status: LeadStatus; priority: Priority; source: string;
  name: string; phone: string; email: string; area: string; travellers: number; groupLeader: string;
  packageId: string | null; assignedTo: string | null; followUp: string | null; amount: number;
  passport: "uploaded" | "missing" | "not-required"; payload: Record<string, string>; notes: Note[]; createdAt: string;
};
export type Payment = { id: string; leadId: string; amount: number; method: string; at: string; note: string };
export type Package = {
  id: string; category: "hajj" | "umrah"; nameBn: string; nameEn: string; descriptionBn: string; descriptionEn: string;
  price: number; durationDays: number; destinations: string[]; inclusions: string[]; seats: number; active: boolean;
};
export type EmployeeStatus = "active" | "on-leave" | "inactive";
export type Employee = {
  id: string; code: string; name: string; role: string; department: string; phone: string; email: string;
  salary: number; joinedAt: string; status: EmployeeStatus; color: string;
};
export type AttendanceMark = "present" | "late" | "absent" | "leave";
export type Task = { id: string; title: string; assignee: string | null; due: string; priority: Priority; done: boolean; leadId: string | null };
export type Expense = { id: string; title: string; category: string; amount: number; at: string };
export type Activity = { id: string; at: string; kind: string; text: string };
export type State = {
  version: number; leads: Lead[]; payments: Payment[]; packages: Package[]; employees: Employee[];
  attendance: Record<string, Record<string, AttendanceMark>>; tasks: Task[]; expenses: Expense[]; activity: Activity[];
  payroll: Record<string, string[]>; // month -> employee ids paid
};

export const STATUSES: LeadStatus[] = ["new", "contacted", "quoted", "confirmed", "completed", "lost"];
export const STATUS_LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", confirmed: "Confirmed", completed: "Completed", lost: "Lost" };
export const TYPE_LABEL: Record<LeadType, string> = { booking: "Hajj/Umrah", ticket: "Air ticket", job: "Overseas job", leader: "Group leader" };
export const DEPARTMENTS = ["Hajj & Umrah", "Ticketing", "Recruitment", "Accounts", "Management", "Front desk"];
export const SOURCES = ["Website", "Walk-in", "Phone", "Facebook", "Referral", "Group leader"];
export const PAY_METHODS = ["Cash", "bKash", "Nagad", "Bank transfer", "Card"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const today = () => new Date().toISOString().slice(0, 10);
export const daysFrom = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const isoAgo = (days: number, hour = 11) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, (days * 7) % 60, 0, 0); return d.toISOString(); };
export const money = (v: number) => "৳\u00a0" + Math.round(v).toLocaleString("en-IN");
export const paidFor = (s: State, leadId: string) => s.payments.filter(p => p.leadId === leadId).reduce((a, p) => a + p.amount, 0);
export const refFor = (type: LeadType, n: number) => `${{ booking: "HU", ticket: "TK", job: "RC", leader: "GL" }[type]}-${String(n).padStart(5, "0")}`;

/* ------------------------------------------------------------------ */
/* Sample data (clearly fictional, used for the demo deployment)       */
/* ------------------------------------------------------------------ */
function seed(): State {
  const packages: Package[] = [
    { id: "pk-umrah-econ", category: "umrah", nameBn: "ইকোনমি ওমরাহ", nameEn: "Economy Umrah", descriptionBn: "১৪ দিনের সাশ্রয়ী ওমরাহ সফর, হারাম থেকে হাঁটার দূরত্বে হোটেল।", descriptionEn: "14-day value Umrah with hotels within walking distance of the Haram.", price: 145000, durationDays: 14, destinations: ["Dhaka", "Makkah", "Madinah", "Dhaka"], inclusions: ["Visa", "Return air ticket", "3★ hotel", "Ziyarat", "Transport"], seats: 40, active: true },
    { id: "pk-umrah-prem", category: "umrah", nameBn: "প্রিমিয়াম ওমরাহ", nameEn: "Premium Umrah", descriptionBn: "হারামের পাশে ৫ তারকা হোটেল, বুফে খাবার ও প্রাইভেট ট্রান্সপোর্ট।", descriptionEn: "5★ hotels beside the Haram with buffet meals and private transport.", price: 265000, durationDays: 12, destinations: ["Dhaka", "Madinah", "Makkah", "Dhaka"], inclusions: ["Visa", "Direct flight", "5★ hotel", "Buffet meals", "Private transport", "Ziyarat"], seats: 20, active: true },
    { id: "pk-hajj-std", category: "hajj", nameBn: "সাধারণ হজ প্যাকেজ", nameEn: "Standard Hajj", descriptionBn: "সরকারি নির্দেশনা অনুযায়ী পূর্ণাঙ্গ হজ প্যাকেজ, অভিজ্ঞ মোয়াল্লেম সহ।", descriptionEn: "Complete Hajj package following government guidance, with an experienced guide.", price: 690000, durationDays: 40, destinations: ["Dhaka", "Makkah", "Mina", "Arafat", "Muzdalifah", "Madinah"], inclusions: ["Hajj visa", "Air ticket", "Mina tent", "Meals", "Training", "Guide"], seats: 60, active: true },
    { id: "pk-hajj-vip", category: "hajj", nameBn: "ভিআইপি হজ", nameEn: "VIP Hajj", descriptionBn: "শিফটিং ছাড়া হজ, আজিজিয়া এপার্টমেন্ট ও ভিআইপি মিনা তাঁবু।", descriptionEn: "Non-shifting Hajj with Aziziyah apartments and VIP Mina tents.", price: 1150000, durationDays: 30, destinations: ["Dhaka", "Makkah", "Mina", "Arafat", "Madinah"], inclusions: ["Hajj visa", "Direct flight", "VIP tent", "Full board", "Personal guide"], seats: 15, active: false },
  ];
  const employees: Employee[] = [
    ["Md. Sohrab Hossain", "Managing Director", "Management", 120000, "2012-03-01", "active", "#0e4b3e"],
    ["Farhana Akter", "Hajj & Umrah Manager", "Hajj & Umrah", 65000, "2016-07-10", "active", "#b8872e"],
    ["Rakibul Islam", "Senior Ticketing Officer", "Ticketing", 45000, "2018-01-15", "active", "#2563eb"],
    ["Nusrat Jahan", "Recruitment Coordinator", "Recruitment", 42000, "2019-09-02", "active", "#9333ea"],
    ["Tanvir Ahmed", "Accounts Officer", "Accounts", 40000, "2020-02-20", "active", "#0891b2"],
    ["Sabbir Rahman", "Sales Executive", "Hajj & Umrah", 30000, "2022-05-11", "active", "#dc2626"],
    ["Mim Chowdhury", "Front Desk Executive", "Front desk", 25000, "2023-03-05", "on-leave", "#db2777"],
    ["Arif Hasan", "Ticketing Executive", "Ticketing", 28000, "2024-01-08", "active", "#65a30d"],
  ].map(([name, role, department, salary, joinedAt, status, color], i) => ({
    id: `emp-${i + 1}`, code: `SAI-${String(101 + i)}`, name: name as string, role: role as string, department: department as string,
    phone: `+880 17${(20531113 + i * 7919).toString().slice(0, 8)}`, email: `${(name as string).split(" ").slice(-1)[0].toLowerCase()}@sohrabair.example`,
    salary: salary as number, joinedAt: joinedAt as string, status: status as EmployeeStatus, color: color as string,
  }));
  const people = [
    ["Abdul Karim", "Mirpur, Dhaka"], ["Rokeya Begum", "Narayanganj"], ["Jahangir Alam", "Cumilla"], ["Shahana Parvin", "Gazipur"],
    ["Mizanur Rahman", "Chattogram"], ["Kulsum Akter", "Sylhet"], ["Habibur Rahman", "Mymensingh"], ["Nazma Khatun", "Tangail"],
    ["Delwar Hossain", "Noakhali"], ["Selina Akter", "Uttara, Dhaka"], ["Mostafa Kamal", "Rajshahi"], ["Ayesha Siddika", "Feni"],
    ["Ruhul Amin", "Bogura"], ["Shirin Sultana", "Khulna"], ["Anwar Hossain", "Brahmanbaria"], ["Monir Uddin", "Chandpur"],
    ["Parveen Akter", "Mohammadpur, Dhaka"], ["Faruk Ahmed", "Barishal"], ["Lutfa Begum", "Savar"], ["Kamrul Hasan", "Jashore"],
    ["Rafiq Mia", "Kishoreganj"], ["Sumaiya Islam", "Dhanmondi, Dhaka"],
  ];
  const leaders = ["Hafez Nurul Islam", "Mawlana Abdur Rahim", "Direct", "Alhaj Shafiqul Haque"];
  const plan: [LeadType, LeadStatus, number, string | null, number][] = [
    ["booking", "completed", 2, "pk-umrah-econ", 70], ["booking", "confirmed", 3, "pk-hajj-std", 62], ["booking", "confirmed", 1, "pk-umrah-prem", 55],
    ["ticket", "completed", 2, null, 50], ["booking", "quoted", 4, "pk-umrah-econ", 46], ["job", "contacted", 1, null, 41],
    ["booking", "completed", 5, "pk-umrah-econ", 38], ["ticket", "confirmed", 1, null, 34], ["booking", "confirmed", 2, "pk-hajj-std", 30],
    ["leader", "contacted", 1, null, 27], ["booking", "lost", 3, "pk-umrah-prem", 24], ["ticket", "quoted", 3, null, 21],
    ["job", "new", 1, null, 18], ["booking", "contacted", 6, "pk-umrah-econ", 15], ["booking", "confirmed", 2, "pk-umrah-prem", 12],
    ["ticket", "new", 2, null, 9], ["booking", "new", 3, "pk-hajj-std", 7], ["job", "quoted", 1, null, 5],
    ["booking", "new", 2, "pk-umrah-econ", 3], ["ticket", "contacted", 1, null, 2], ["leader", "new", 1, null, 1], ["booking", "new", 4, null, 0],
  ];
  const assign: Record<LeadType, string[]> = { booking: ["emp-2", "emp-6"], ticket: ["emp-3", "emp-8"], job: ["emp-4"], leader: ["emp-2"] };
  const leads: Lead[] = plan.map(([type, status, travellers, packageId, ago], i) => {
    const [name, area] = people[i % people.length];
    const pkg = packages.find(p => p.id === packageId);
    const ticketFare = 68000 + (i % 4) * 9500;
    const amount = type === "booking" ? (pkg?.price || 150000) * travellers : type === "ticket" ? ticketFare * travellers : type === "job" ? 35000 : 0;
    const payload: Record<string, string> =
      type === "booking" ? { journey_kind: pkg?.category || "umrah", package: pkg?.nameEn || "Not decided" } :
      type === "ticket" ? { from: "Dhaka (DAC)", to: ["Jeddah (JED)", "Dubai (DXB)", "Kuala Lumpur (KUL)", "Riyadh (RUH)"][i % 4], departure: daysFrom(10 + i), cabin: "Economy" } :
      type === "job" ? { job: ["Steel Fixer", "Driver", "Electrician"][i % 3], country: ["Saudi Arabia", "Malaysia", "UAE"][i % 3], age: String(24 + i) } :
      { district: area.split(",").slice(-1)[0].trim(), experience: "Organised local Umrah groups" };
    const assignedTo = status === "new" && i % 2 === 0 ? null : assign[type][i % assign[type].length];
    return {
      id: `ld-${i + 1}`, ref: refFor(type, 1000 + i), type, status, priority: (i % 5 === 0 ? "high" : i % 3 === 0 ? "low" : "normal") as Priority,
      source: SOURCES[i % SOURCES.length], name, phone: `+880 1${7 + (i % 3)}${String(11223344 + i * 104729).slice(0, 8)}`, email: i % 3 === 0 ? "" : `${name.split(" ")[0].toLowerCase()}${i}@mail.example`,
      area, travellers, groupLeader: type === "booking" ? leaders[i % leaders.length] : "", packageId, assignedTo,
      followUp: ["new", "contacted", "quoted"].includes(status) ? daysFrom((i % 5) - 2) : null, amount,
      passport: type === "booking" || type === "job" ? (i % 4 === 1 ? "missing" : "uploaded") : "not-required",
      payload, notes: status === "new" ? [] : [{ at: isoAgo(Math.max(0, ago - 1)), by: employees.find(e => e.id === assignedTo)?.name || "Admin", text: "Called customer and shared package details." }],
      createdAt: isoAgo(ago, 9 + (i % 8)),
    };
  });
  const payments: Payment[] = [];
  leads.forEach((l, i) => {
    const age = daysAgo(l.createdAt);
    if (l.status === "completed") {
      payments.push({ id: `pay-${i}-a`, leadId: l.id, amount: Math.round(l.amount * .4), method: PAY_METHODS[i % 5], at: isoAgo(Math.max(0, age - 2)), note: "Advance" });
      payments.push({ id: `pay-${i}-b`, leadId: l.id, amount: l.amount - Math.round(l.amount * .4), method: PAY_METHODS[(i + 1) % 5], at: isoAgo(Math.max(0, Math.floor(age / 2))), note: "Final payment" });
    }
    if (l.status === "confirmed") payments.push({ id: `pay-${i}-a`, leadId: l.id, amount: Math.round(l.amount * (i % 2 ? 0.5 : 0.3)), method: PAY_METHODS[(i + 2) % 5], at: isoAgo(Math.max(0, age - 2)), note: "Advance" });
  });
  const attendance: State["attendance"] = {};
  for (let d = 13; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    if (date.getDay() === 5) continue; // Friday weekend
    const key = date.toISOString().slice(0, 10);
    if (d === 0) { attendance[key] = { "emp-1": "present", "emp-2": "present", "emp-3": "late", "emp-7": "leave" }; continue; }
    attendance[key] = Object.fromEntries(employees.map((e, i) => [e.id, e.status === "on-leave" && d < 4 ? "leave" : (i + d) % 11 === 0 ? "absent" : (i + d) % 6 === 0 ? "late" : "present"])) as Record<string, AttendanceMark>;
  }
  const tasks: Task[] = [
    { id: "t1", title: "Submit visa files for Umrah group (Oct batch)", assignee: "emp-2", due: daysFrom(1), priority: "high", done: false, leadId: null },
    { id: "t2", title: "Reconfirm Jeddah flight seats with airline", assignee: "emp-3", due: daysFrom(0), priority: "high", done: false, leadId: "ld-8" },
    { id: "t3", title: "Collect missing passport copy", assignee: "emp-6", due: daysFrom(-1), priority: "normal", done: false, leadId: "ld-2" },
    { id: "t4", title: "Verify Saudi demand letter on OEP", assignee: "emp-4", due: daysFrom(3), priority: "normal", done: false, leadId: "ld-6" },
    { id: "t5", title: "Monthly accounts reconciliation", assignee: "emp-5", due: daysFrom(5), priority: "low", done: false, leadId: null },
    { id: "t6", title: "Hajj pre-registration training session", assignee: "emp-2", due: daysFrom(-3), priority: "normal", done: true, leadId: null },
  ];
  const expenses: Expense[] = [
    { id: "x1", title: "Office rent — Mouchak Market", category: "Rent", amount: 55000, at: isoAgo(12) },
    { id: "x2", title: "Facebook ads (Umrah campaign)", category: "Marketing", amount: 18000, at: isoAgo(8) },
    { id: "x3", title: "Utilities & internet", category: "Utilities", amount: 9500, at: isoAgo(6) },
    { id: "x4", title: "Visa processing fees", category: "Operations", amount: 42000, at: isoAgo(4) },
    { id: "x5", title: "Office rent — previous month", category: "Rent", amount: 55000, at: isoAgo(42) },
  ];
  const activity: Activity[] = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)
    .map(l => ({ id: uid(), at: l.createdAt, kind: "lead", text: `New ${TYPE_LABEL[l.type]} request from ${l.name} (${l.ref})` }));
  return { version: 1, leads, payments, packages, employees, attendance, tasks, expenses, activity, payroll: {} };
}
function daysAgo(iso: string) { return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5); }

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
const KEY = "sohrab-crm-v2";
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try { const raw = localStorage.getItem(KEY); if (raw) { state = JSON.parse(raw) as State; return state; } } catch { /* ignore */ }
  state = seed(); persist(); return state;
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } }

export function getState() { return load(); }
export function setState(fn: (s: State) => State | void) {
  const current = load();
  const draft = structuredClone(current);
  const next = fn(draft) || draft;
  state = next; persist(); listeners.forEach(l => l());
}
export function log(s: State, kind: string, text: string) { s.activity.unshift({ id: uid(), at: new Date().toISOString(), kind, text }); s.activity = s.activity.slice(0, 80); }
export function resetDemo() { state = seed(); persist(); listeners.forEach(l => l()); }
export function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = null; listeners.forEach(x => x()); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
const serverSnapshot = null;
export function useCRM(): State | null {
  return useSyncExternalStore(subscribe, () => load(), () => serverSnapshot);
}

/* Public-site helpers ------------------------------------------------ */
export function addLeadFromForm(form: FormData): string {
  let ref = "";
  setState(s => {
    const type = (String(form.get("type")) as LeadType) || "booking";
    const str = (k: string) => { const v = form.get(k); return typeof v === "string" ? v.trim().slice(0, 1000) : ""; };
    const payload: Record<string, string> = {};
    form.forEach((v, k) => { if (typeof v === "string" && !["type", "name", "phone", "email"].includes(k)) payload[k] = v.trim().slice(0, 1000); });
    const file = form.get("passport");
    const hasFile = typeof file === "object" && file !== null && (file as File).size > 0;
    const pkg = s.packages.find(p => p.nameEn.toLowerCase() === str("package").toLowerCase() || p.id === str("package"));
    const travellers = Math.max(1, Number(str("travellers") || str("passengers")) || 1);
    ref = refFor(type, 1000 + s.leads.length + Math.floor(Math.random() * 90));
    s.leads.unshift({
      id: uid(), ref, type, status: "new", priority: "normal", source: "Website", name: str("name"), phone: str("phone"), email: str("email"),
      area: str("area") || str("district") || "Unspecified", travellers, groupLeader: str("group_leader"), packageId: pkg?.id || null,
      assignedTo: null, followUp: today(), amount: pkg ? pkg.price * travellers : 0,
      passport: type === "booking" || type === "job" ? (hasFile ? "uploaded" : "missing") : "not-required",
      payload, notes: [], createdAt: new Date().toISOString(),
    });
    log(s, "lead", `New ${TYPE_LABEL[type]} request from ${str("name")} (${ref})`);
  });
  return ref;
}
