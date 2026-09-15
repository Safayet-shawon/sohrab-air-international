import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { staffMembers } from "@/db/schema";
import { cleanText, isDenied, requireAdmin } from "@/backend/admin-auth";

export async function GET(request: Request) { const actor=await requireAdmin(request,true); if(isDenied(actor))return actor; return Response.json({staff:await getDb().select().from(staffMembers).orderBy(desc(staffMembers.createdAt))}); }
export async function POST(request: Request) {
  const actor=await requireAdmin(request,true); if(isDenied(actor))return actor;
  const body=await request.json() as Record<string,unknown>; const identifier=cleanText(body.identifier,200).toLowerCase(), name=cleanText(body.name,120);
  if(!identifier||!name)return Response.json({error:"Name and ChatGPT email/ID are required"},{status:400});
  try{const id=crypto.randomUUID();await getDb().insert(staffMembers).values({id,identifier,name,role:'manager',createdBy:actor.identifier});return Response.json({id},{status:201});}catch{return Response.json({error:"This account already has access"},{status:409});}
}
