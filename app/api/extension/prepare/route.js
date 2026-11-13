import { admin, authExtension, bumpUsage, HttpError, json, LIMITS, preflight, premiumGate, readJson, safe } from "@/lib/extension/auth";
import { loadApplicant } from "@/lib/extension/profile";
import { askJson } from "@/lib/extension/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const OPTIONS = preflight;

const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const list = (v, n, len) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.slice(0, len)).slice(0, n) : []);

export const POST = safe("prepare", async (req) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");
  const gate = await premiumGate(a.userId);
  if (gate) return gate;

  const body = await readJson(req, 60000);
  const job = body.job || {};
  const title = str(job.title, 200);
  const company = str(job.company, 200);
  const url = str(job.url, 2000);
  const text = str(job.text, 20000);
  if (url && !/^https?:\/\//i.test(url)) throw new HttpError(400, "That link isn't a valid web address.");
  if (!text && !title) throw new HttpError(400, "There's no job to prepare. Open a job posting first.");

  const p = await loadApplicant(a.userId);
  if (!p.hasResume) throw new HttpError(400, "Add a resume in eCareer Design first.", "no_resume");

  const used = await bumpUsage(a.userId, "prepares", LIMITS.preparesPerDay);
  if (!used.ok) {
    throw new HttpError(429, `You've prepared ${LIMITS.preparesPerDay} applications today, which is the daily limit. It resets tomorrow.`, "limit_reached");
  }

  const partial = text.length < 400;
  const posting = (text || `${title} at ${company}`).slice(0, 12000);

  const out = await askJson({
    system:
      "You help a job seeker apply. Rules: use ONLY facts present in the resume; never invent employers, titles, dates, metrics, " +
      "degrees, or skills; if the posting wants something the resume lacks, list it as a gap instead of claiming it. " +
      "Write in the candidate's plain first-person voice, no filler or clichés. " +
      "Never round up or invent numbers: work out years of experience from the resume's actual start and end dates and state them no higher than that total, or avoid stating a total. Only use counts, percentages and dollar figures that appear in the resume. " +
      (partial ? "The posting text below is short or partial: score only on what is given and add a gap saying the full posting should be reviewed. " : "") +
      'tailoredResume must be plain text in this exact layout: do NOT write the name or any contact details (they are added automatically). ' +
      'Start with a line PROFESSIONAL SUMMARY, then a short paragraph. Section headings are ALL CAPS on their own line: PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS, and CERTIFICATIONS only if the resume has them. ' +
      'Under EXPERIENCE write each role as one line "Job Title | Employer | City, ST | Start - End" followed by achievement lines that each start with "- ". ' +
      'Under EDUCATION write one line per entry "Degree | School | Year". Under SKILLS write one comma-separated line. No tables, columns, or special symbols. ' +
      'Return {"score":0-100,"strengths":[string],"gaps":[string],"tailoredResume":string,"coverLetter":string (under 250 words)}.',
    user: `RESUME:\n${p.resumeText.slice(0, 20000)}\n\nJOB POSTING:\nTitle: ${title}\nCompany: ${company}\n${posting}`,
    maxTokens: 4000,
  });

  const row = {
    user_id: a.userId,
    job_title: title || null,
    company: company || null,
    url: url || null,
    score: Math.max(0, Math.min(100, Math.round(Number(out.score) || 0))),
    strengths: list(out.strengths, 8, 300),
    gaps: list(out.gaps, 8, 300),
    tailored_resume: str(out.tailoredResume, 12000),
    cover_letter: str(out.coverLetter, 4000),
    status: "prepared",
  };
  const { data, error } = await admin().from("extension_applications").insert(row).select("id").single();
  if (error) throw new Error(error.message);

  return json({
    applicationId: data.id,
    title,
    company,
    score: row.score,
    strengths: row.strengths,
    gaps: row.gaps,
    coverLetter: row.cover_letter,
    usage: { prepares: used.used, preparesLimit: LIMITS.preparesPerDay },
  });
});
