import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { cleanText, isDenied, requireAdmin, stringList } from "@/backend/admin-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request); if (isDenied(actor)) return actor;
  const body = await request.json() as Record<string, unknown>; const { id } = await context.params;
  const category = cleanText(body.category, 20), nameBn = cleanText(body.nameBn, 120), nameEn = cleanText(body.nameEn, 120);
  if (!['hajj','umrah'].includes(category) || !nameBn || !nameEn) return Response.json({ error: "Invalid package" }, { status: 400 });
  await getDb().update(packages).set({ category, nameBn, nameEn, descriptionBn: cleanText(body.descriptionBn,1200), descriptionEn: cleanText(body.descriptionEn,1200), price: Math.max(0,Number(body.price)||0), durationDays: Math.max(0,Number(body.durationDays)||0), destinationsJson: JSON.stringify(stringList(body.destinations)), inclusionsJson: JSON.stringify(stringList(body.inclusions)), active: body.active !== false, updatedAt: new Date().toISOString() }).where(eq(packages.id,id));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin(request); if (isDenied(actor)) return actor;
  const { id } = await context.params; await getDb().delete(packages).where(eq(packages.id,id));
  return Response.json({ ok: true });
}
