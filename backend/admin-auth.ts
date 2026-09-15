import { and, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { staffMembers } from "@/db/schema";

export type AdminActor = { id: string; name: string; identifier: string; role: "owner" | "manager" };

function identity(request: Request) {
  const userId = request.headers.get("oai-authenticated-user-id")?.trim() || "";
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() || "";
  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  let name = email || "Owner";
  if (encodedName && request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(encodedName); } catch { /* use email */ }
  }
  return { userId, email, name };
}

export async function requireAdmin(request: Request, ownerOnly = false): Promise<AdminActor | Response> {
  const current = identity(request);
  if (!current.userId || !current.email) return Response.json({ error: "Sign in required" }, { status: 401 });
  const db = getDb();
  let rows = await db.select().from(staffMembers).where(and(eq(staffMembers.active, true), or(eq(staffMembers.identifier, current.userId), eq(staffMembers.identifier, current.email)))).limit(1);
  if (!rows.length) {
    const anyStaff = await db.select({ id: staffMembers.id }).from(staffMembers).limit(1);
    if (!anyStaff.length) {
      const id = crypto.randomUUID();
      await db.insert(staffMembers).values({ id, identifier: current.userId, name: current.name, role: "owner", createdBy: current.userId });
      rows = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1);
    }
  }
  const member = rows[0];
  if (!member) return Response.json({ error: "You do not have admin access" }, { status: 403 });
  if (ownerOnly && member.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
  return { id: member.id, name: member.name, identifier: member.identifier, role: member.role as "owner" | "manager" };
}

export function isDenied(value: AdminActor | Response): value is Response { return value instanceof Response; }

export function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function stringList(value: unknown) {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n|,/g) : [];
  return items.map((item) => cleanText(item, 160)).filter(Boolean).slice(0, 30);
}
