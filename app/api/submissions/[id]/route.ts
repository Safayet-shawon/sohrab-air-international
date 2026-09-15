import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, submissions } from "@/db/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actorId = request.headers.get("oai-authenticated-user-id");
  if (!actorId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const payload = (await request.json()) as { status?: string };
  const status = payload.status?.trim();
  if (!status || !["new", "contacted", "confirmed", "closed"].includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  const db = getDb();
  await db.batch([
    db.update(submissions).set({ status, updatedAt: new Date().toISOString() }).where(and(eq(submissions.id, id))),
    db.insert(auditEvents).values({ submissionId: id, action: `status:${status}`, actorId }),
  ]);
  return Response.json({ ok: true });
}
