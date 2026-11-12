import { authExtension, getUsage, HttpError, isPremiumUser, json, preflight, safe } from "@/lib/extension/auth";
import { loadApplicant } from "@/lib/extension/profile";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export const GET = safe("profile", async (req) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");

  // Not premium: answer with the plan state only, so the extension can show an upgrade screen.
  if (!(await isPremiumUser(a.userId))) return json({ premium: false });

  const [p, usage] = await Promise.all([loadApplicant(a.userId), getUsage(a.userId)]);
  // The full resume text is never sent to the extension, only what it needs to fill forms.
  return json({
    premium: true,
    hasResume: p.hasResume,
    fullName: p.fullName,
    headline: p.headline,
    applicant: p.applicant,
    usage,
  });
});
