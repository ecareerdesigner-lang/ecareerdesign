import { authExtension, bumpUsage, HttpError, json, LIMITS, preflight, premiumGate, safe } from "@/lib/extension/auth";
import { loadApplicant } from "@/lib/extension/profile";
import { searchJobs } from "@/lib/extension/jobSearch";
import { askJson } from "@/lib/extension/claude";
import { classify } from "@/lib/extension/siteSupport";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const OPTIONS = preflight;

export const POST = safe("matches", async (req) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");
  const gate = await premiumGate(a.userId);
  if (gate) return gate;

  const p = await loadApplicant(a.userId);
  if (!p.hasResume) throw new HttpError(400, "Add a resume in eCareer Design first.", "no_resume");

  const used = await bumpUsage(a.userId, "matches", LIMITS.matchesPerDay);
  if (!used.ok) {
    throw new HttpError(429, `You've used all ${LIMITS.matchesPerDay} job searches for today. The limit resets tomorrow.`, "limit_reached");
  }
  const usage = { matches: used.used, matchesLimit: LIMITS.matchesPerDay };

  // Saved titles are often internal codes (for example "2301-6218 POSTMASTER 18 (B) EAS-43").
  // Ask the model for plain job-board titles to search with.
  let roles = [];
  try {
    const plan = await askJson({
      system:
        "You turn a resume into job-search keywords. Return {\"roles\":[up to 3 plain job titles people would type " +
        "into a job board, such as Operations Manager]}. No codes, pay grades, levels, or place names.",
      user: `Title as saved: ${p.headline}\n\nRESUME:\n${p.resumeText.slice(0, 6000)}`,
      maxTokens: 300,
    });
    roles = (plan.roles || []).filter((r) => typeof r === "string" && r.trim()).slice(0, 3);
  } catch {
    roles = [];
  }
  if (!roles.length) roles = p.targetRoles;

  const { jobs, report } = await searchJobs({ roles, location: p.location });
  if (!jobs.length) return json({ matches: [], report, usage });

  // One batched call: score every posting against the resume, with a plain reason each.
  const result = await askJson({
    system:
      "You are a careful recruiter. Score how well each job fits the candidate from 0-100 using ONLY evidence in the resume. " +
      "Do not invent experience. Keep each reason under 12 words and never use double-quote characters. " +
      "Return {\"scores\":[{\"id\":string,\"score\":number,\"reasons\":[string,string]}]}.",
    user:
      `RESUME:\n${p.resumeText.slice(0, 14000)}\n\nJOBS:\n` +
      jobs.map((j) => `ID ${j.id}: ${j.title} at ${j.company}\n${(j.description || "").slice(0, 600)}`).join("\n---\n"),
    maxTokens: 3000,
  });

  const byId = new Map((result.scores || []).map((s) => [String(s.id), s]));
  const matches = jobs
    .map((j) => {
      const s = byId.get(j.id) || { score: 0, reasons: [] };
      const score = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
      return {
        id: j.id,
        source: j.source,
        title: j.title,
        company: j.company,
        location: j.location,
        url: j.url,
        description: (j.description || "").slice(0, 3000),
        score,
        reasons: (Array.isArray(s.reasons) ? s.reasons : []).filter((r) => typeof r === "string").slice(0, 2),
        support: classify(j.url),
      };
    });
  const ranked = matches
    .filter((m) => m.score >= 40)
    .sort((x, y) => y.score - x.score)
    .slice(0, 10);

  return json({ matches: ranked, report, usage });
});
