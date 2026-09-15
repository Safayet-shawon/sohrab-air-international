import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { cleanText, isDenied, requireAdmin, stringList } from "@/backend/admin-auth";

export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (isDenied(actor)) return actor;
  return Response.json({ packages: await getDb().select().from(packages).orderBy(desc(packages.updatedAt)) });
}

export async function POST(request: Request) {
  const actor = await requireAdmin(request);
  if (isDenied(actor)) return actor;
  const body = await request.json() as Record<string, unknown>;
  const category = cleanText(body.category, 20);
  const nameBn = cleanText(body.nameBn, 120), nameEn = cleanText(body.nameEn, 120);
  if (!['hajj','umrah'].includes(category) || !nameBn || !nameEn) return Response.json({ error: "Category and both package names are required" }, { status: 400 });
  const id = crypto.randomUUID();
  await getDb().insert(packages).values({ id, category, nameBn, nameEn, descriptionBn: cleanText(body.descriptionBn, 1200), descriptionEn: cleanText(body.descriptionEn, 1200), price: Math.max(0, Number(body.price) || 0), durationDays: Math.max(0, Number(body.durationDays) || 0), destinationsJson: JSON.stringify(stringList(body.destinations)), inclusionsJson: JSON.stringify(stringList(body.inclusions)), active: body.active !== false });
  return Response.json({ id }, { status: 201 });
}
