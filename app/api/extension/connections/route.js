import { admin, HttpError, json, preflight, safe, userFromSupabaseJwt } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// Web app (signed in): list this person's connected browsers.
export const GET = safe("connections-list", async (req) => {
  const userId = await userFromSupabaseJwt(req);
  if (!userId) throw new HttpError(401, "Sign in to eCareer Design first.");
  const { data } = await admin()
    .from("extension_tokens")
    .select("id, label, created_at, last_used_at, expires_at")
    .eq("user_id", userId)
    .eq("revoked", false)
    .order("created_at", { ascending: false });
  const now = Date.now();
  const connections = (data || []).filter((t) => !t.expires_at || new Date(t.expires_at).getTime() > now);
  return json({ connections });
});

// Web app (signed in): disconnect one browser (?id=...) or all of them (?all=1).
export const DELETE = safe("connections-revoke", async (req) => {
  const userId = await userFromSupabaseJwt(req);
  if (!userId) throw new HttpError(401, "Sign in to eCareer Design first.");
  const url = new URL(req.url);
  let q = admin().from("extension_tokens").update({ revoked: true }).eq("user_id", userId);
  if (url.searchParams.get("all") === "1") {
    // revoke everything
  } else {
    const id = url.searchParams.get("id") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "Choose a connection to disconnect.");
    q = q.eq("id", id);
  }
  const { error } = await q;
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
