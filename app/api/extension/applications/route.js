import { admin, authExtension, HttpError, json, preflight, readJson, safe } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const ALLOWED = new Set(["prepared", "dismissed", "submitted_by_user_approval"]);

// The extension reports what happened after the person reviewed the page.
// "submitted_by_user_approval" means the person clicked Approve; it is not proof the site accepted it.
export const POST = safe("applications-update", async (req) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");
  const body = await readJson(req, 20000);
  const { applicationId, status } = body;
  if (typeof applicationId !== "string" || !/^[0-9a-f-]{36}$/i.test(applicationId) || !ALLOWED.has(status)) {
    throw new HttpError(400, "Bad request.");
  }
  const url = typeof body.url === "string" && /^https?:\/\//i.test(body.url) ? body.url.slice(0, 2000) : undefined;
  const unanswered = Array.isArray(body.unanswered) ? body.unanswered.filter((x) => typeof x === "string").map((x) => x.slice(0, 120)).slice(0, 50) : [];

  const { error } = await admin()
    .from("extension_applications")
    .update({ status, url, unanswered, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", a.userId);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});

export const GET = safe("applications-list", async (req) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");
  const { data } = await admin()
    .from("extension_applications")
    .select("id, job_title, company, url, score, status, created_at")
    .eq("user_id", a.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return json({ applications: data || [] });
});
