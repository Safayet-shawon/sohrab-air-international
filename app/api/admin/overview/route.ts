import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { packages, staffMembers, submissions } from "@/db/schema";
import { isDenied, requireAdmin } from "@/backend/admin-auth";

export async function GET(request: Request) {
  const actor = await requireAdmin(request, false, true);
  if (isDenied(actor)) return actor;
  if (actor.requiresPasswordSetup) return Response.json({ actor, requiresPasswordSetup: true, requests: [], packages: [], staff: [] });
  const db = getDb();
  const [requests, packageRows, staff] = await Promise.all([
    db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(500),
    db.select().from(packages).orderBy(desc(packages.updatedAt)),
    actor.role === "owner" ? db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt)) : Promise.resolve([]),
  ]);
  return Response.json({ actor, requests, packages: packageRows, staff });
}
