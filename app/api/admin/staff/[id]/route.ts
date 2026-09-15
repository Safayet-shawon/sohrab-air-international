import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { staffMembers } from "@/db/schema";
import { isDenied, requireAdmin } from "@/backend/admin-auth";

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){const actor=await requireAdmin(request,true);if(isDenied(actor))return actor;const{id}=await context.params;const body=await request.json() as {active?:boolean};await getDb().update(staffMembers).set({active:body.active!==false}).where(and(eq(staffMembers.id,id),eq(staffMembers.role,'manager')));return Response.json({ok:true});}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){const actor=await requireAdmin(request,true);if(isDenied(actor))return actor;const{id}=await context.params;await getDb().delete(staffMembers).where(and(eq(staffMembers.id,id),eq(staffMembers.role,'manager')));return Response.json({ok:true});}
