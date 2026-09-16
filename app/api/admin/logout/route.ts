import { expiredSessionCookie, revokeCurrentSession } from "@/backend/admin-auth";
export async function POST(request:Request){await revokeCurrentSession(request);return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":expiredSessionCookie()}})}
