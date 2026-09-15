import { env } from "cloudflare:workers";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  if (!request.headers.get("oai-authenticated-user-id")) return new Response("Sign in required", { status: 401 });
  if (!env.BUCKET) return new Response("Storage unavailable", { status: 503 });
  const { key } = await context.params;
  const object = await env.BUCKET.get(`passports/${key}`);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();object.writeHttpMetadata(headers);headers.set("Cache-Control", "private, no-store");
  return new Response(object.body, { headers });
}
