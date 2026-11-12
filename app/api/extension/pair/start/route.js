import { admin, HttpError, json, makePairCode, normalizeCode, premiumGate, preflight, safe, sha256, userFromSupabaseJwt } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// Called by the web app (signed-in user, Supabase access token as Bearer).
// Returns a short-lived, single-use pairing code to paste into the extension.
export const POST = safe("pair-start", async (req) => {
  const userId = await userFromSupabaseJwt(req);
  if (!userId) throw new HttpError(401, "Sign in to eCareer Design first.");
  const gate = await premiumGate(userId);
  if (gate) return gate;

  const db = admin();
  const nowIso = new Date().toISOString();
  await db.from("extension_pair_codes").delete().eq("user_id", userId).or(`used.eq.true,expires_at.lt.${nowIso}`);
  const { count } = await db
    .from("extension_pair_codes")
    .select("code_hash", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("used", false);
  if ((count || 0) >= 5) throw new HttpError(429, "You already have several unused codes. Use one of them, or wait a few minutes.");

  const code = makePairCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await db
    .from("extension_pair_codes")
    .insert({ code_hash: sha256(normalizeCode(code)), user_id: userId, expires_at: expiresAt });
  if (error) throw new Error(error.message);
  return json({ code, expiresAt });
});
