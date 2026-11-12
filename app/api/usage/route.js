import { userFromRequest, usageSummary } from "@/lib/usage.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const userId = await userFromRequest(req);
  if (!userId) return Response.json({ error: "Please sign in." }, { status: 401 });
  return Response.json(await usageSummary(userId), { headers: { "Cache-Control": "no-store" } });
}
