import { admin, HttpError, json, MAX_ACTIVE_TOKENS, normalizeCode, preflight, randomToken, readJson, safe, sha256, TOKEN_TTL_DAYS } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// Called by the extension: trade a pairing code for a bearer token that expires and can be revoked.
export const POST = safe("pair-exchange", async (req) => {
  const body = await readJson(req, 2000);
  const code = normalizeCode(body.code);
  if (code.length < 8) throw new HttpError(400, "Enter the pairing code shown in eCareer Design.");
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : "";

  const db = admin();
  const codeHash = sha256(code);
  const { data: row } = await db
    .from("extension_pair_codes")
    .select("user_id, expires_at, used")
    .eq("code_hash", codeHash)
    .maybeSingle();
  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    throw new HttpError(400, "That code is invalid or expired. Make a new one in eCareer Design.");
  }

  // Claim the code first; if someone else claimed it a moment earlier, nothing comes back and we stop.
  const { data: claimed } = await db
    .from("extension_pair_codes")
    .update({ used: true })
    .eq("code_hash", codeHash)
    .eq("used", false)
    .select("code_hash");
  if (!claimed || !claimed.length) throw new HttpError(400, "That code was already used. Make a new one.");

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 86400000).toISOString();
  const { error } = await db
    .from("extension_tokens")
    .insert({ token_hash: sha256(token), user_id: row.user_id, label: label || null, expires_at: expiresAt });
  if (error) throw new Error(error.message);

  // Keep only the newest few connections per person.
  const { data: active } = await db
    .from("extension_tokens")
    .select("token_hash")
    .eq("user_id", row.user_id)
    .eq("revoked", false)
    .order("created_at", { ascending: false });
  const extra = (active || []).slice(MAX_ACTIVE_TOKENS).map((t) => t.token_hash);
  if (extra.length) await db.from("extension_tokens").update({ revoked: true }).in("token_hash", extra);

  return json({ token, expiresAt });
});
