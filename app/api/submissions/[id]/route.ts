import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, submissions } from "@/db/schema";
import { isDenied, requireAdmin } from "@/backend/admin-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request);
  if (isDenied(actor)) return actor;
  const actorId = actor.identifier;
  const { id } = await context.params;
  const payload = (await request.json()) as { status?: string; area?: string; travellersCount?: number; groupLeaderName?: string; revenue?: number; packageId?: string | null };
  const status = payload.status?.trim();
  if (!status || !["new", "contacted", "confirmed", "closed"].includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  const db = getDb();
  const changes={status,area:(payload.area||'Unspecified').trim().slice(0,160),travellersCount:Math.max(1,Math.min(1000,Number(payload.travellersCount)||1)),groupLeaderName:payload.groupLeaderName?.trim().slice(0,160)||null,revenue:Math.max(0,Math.round(Number(payload.revenue)||0)),packageId:payload.packageId?.trim()||null,updatedAt:new Date().toISOString()};
  await db.batch([
    db.update(submissions).set(changes).where(and(eq(submissions.id, id))),
    db.insert(auditEvents).values({ submissionId: id, action: `status:${status}`, actorId }),
  ]);
  return Response.json({ ok: true });
}
