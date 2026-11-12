import { admin, authExtension, HttpError, json, preflight, safe } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// The extension calls this when the person clicks Disconnect, so the connection is revoked on the server too.
export const POST = safe("disconnect", async (req) => {
  const a = await authExtension(req);
  if (!a) return json({ ok: true }); // already gone
  await admin().from("extension_tokens").update({ revoked: true }).eq("token_hash", a.tokenHash);
  return json({ ok: true });
});
