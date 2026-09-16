import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { staffMembers } from "@/db/schema";
import { cleanLoginId, cleanText, createPassword, isDenied, requireAdmin } from "@/backend/admin-auth";

export async function GET(request: Request) { const actor=await requireAdmin(request,true); if(isDenied(actor))return actor; return Response.json({staff:await getDb().select().from(staffMembers).orderBy(desc(staffMembers.createdAt))}); }
export async function POST(request: Request) {
  const actor=await requireAdmin(request,true); if(isDenied(actor))return actor;
  const body=await request.json() as Record<string,unknown>; const identifier=cleanText(body.identifier,200).toLowerCase(), name=cleanText(body.name,120),loginId=cleanLoginId(body.loginId);
  if(!identifier||!name||loginId.length<4)return Response.json({error:"Name, ChatGPT email/ID and a 4+ character Admin ID are required"},{status:400});
  let secret:Awaited<ReturnType<typeof createPassword>>;try{secret=await createPassword(cleanText(body.password,128))}catch(e){return Response.json({error:e instanceof Error?e.message:"Invalid password"},{status:400})}
  try{const id=crypto.randomUUID();await getDb().insert(staffMembers).values({id,identifier,loginId,...secret,name,role:'manager',createdBy:actor.identifier});return Response.json({id},{status:201});}catch{return Response.json({error:"This account or Admin ID already has access"},{status:409});}
}
