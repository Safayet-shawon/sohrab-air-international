import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
export async function GET(request:Request){const category=new URL(request.url).searchParams.get('category');const rows=category&&['hajj','umrah'].includes(category)?await getDb().select().from(packages).where(and(eq(packages.active,true),eq(packages.category,category))).orderBy(asc(packages.price)):await getDb().select().from(packages).where(eq(packages.active,true)).orderBy(asc(packages.price));return Response.json({packages:rows});}
