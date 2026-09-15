import { desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { auditEvents, submissions } from "@/db/schema";
import { clean, isPhone, submissionTypes } from "@/lib/submission";
import { isDenied, requireAdmin } from "@/backend/admin-auth";

export async function GET(request: Request) {
  const actor = await requireAdmin(request);
  if (isDenied(actor)) return actor;
  const rows = await getDb().select().from(submissions).orderBy(desc(submissions.createdAt)).limit(100);
  return Response.json({ submissions: rows });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const type = clean(form.get("type"), 20);
    const name = clean(form.get("name"), 120);
    const phone = clean(form.get("phone"), 20);
    const email = clean(form.get("email"), 160) || null;
    if (!submissionTypes.includes(type as (typeof submissionTypes)[number])) return Response.json({ error: "Invalid request type" }, { status: 400 });
    if (!name || !isPhone(phone)) return Response.json({ error: "Name and a valid phone number are required" }, { status: 400 });

    const file = form.get("passport");
    let fileKey: string | null = null;
    if (file instanceof File && file.size) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return Response.json({ error: "Passport image must be JPG, PNG or WebP and under 5 MB" }, { status: 400 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
      if (!isJpeg && !isPng && !isWebp) return Response.json({ error: "The uploaded file is not a valid passport image" }, { status: 400 });
      if (!env.BUCKET) return Response.json({ error: "File storage is unavailable" }, { status: 503 });
      fileKey = `passports/${crypto.randomUUID()}`;
      await env.BUCKET.put(fileKey, bytes, { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name.slice(0, 120) } });
    }

    const payload: Record<string, string> = {};
    for (const [key, value] of form.entries()) if (!["type", "name", "phone", "email", "passport"].includes(key) && typeof value === "string") payload[key] = value.trim().slice(0, 1000);
    const id = crypto.randomUUID();
    const db = getDb();
    const travellersCount = Math.max(1, Math.min(1000, Number(payload.travellers) || 1));
    const area = (payload.area || payload.address || "Unspecified").slice(0, 160);
    const groupLeaderName = (payload.group_leader || payload.groupLeader || "").slice(0, 160) || null;
    await db.batch([
      db.insert(submissions).values({ id, type, name, phone, email, payloadJson: JSON.stringify(payload), fileKey, travellersCount, area, groupLeaderName }),
      db.insert(auditEvents).values({ submissionId: id, action: "created", actorId: request.headers.get("oai-authenticated-user-id") }),
    ]);
    return Response.json({ id, reference: `SAI-${id.slice(0, 8).toUpperCase()}` }, { status: 201 });
  } catch (error) {
    console.error("submission.create", error);
    return Response.json({ error: "Unable to save the request right now" }, { status: 500 });
  }
}
