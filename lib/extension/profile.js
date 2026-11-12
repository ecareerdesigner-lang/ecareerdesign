import { admin } from "./auth";

const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim()) || "";

// Keys that hold leftovers from other tools (old cover letters, pasted postings, saved tailoring), not the person's
// background. Sending them confuses the model, so they are dropped at any depth.
const NOISE = /cover|letter|posting|jobdescription|tailor|interview|selectedlib|photo|image|base64|avatar/i;
// Sections the model needs most come first, so any cut-off at the end only loses minor details.
// Short sections go before the long work history, so the cut-off only ever trims the long tail of old job detail.
const FIRST = ["jobTitle", "summary", "education", "skills", "certifications", "trainingEntries", "training", "awards", "volunteer", "languages", "workExperience", "experience"];
// Long free-text blocks that add little to scoring go last.
const LAST = ["additionalContext", "requirements", "trainingPasteText"];
const MAX_FIELD = 1200;
const MAX_TOTAL = 20000;

function clean(v) {
  if (Array.isArray(v)) return v.map(clean).filter((x) => x !== undefined);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (NOISE.test(k)) continue;
      const c = clean(val);
      if (c === undefined) continue;
      out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof v === "string") {
    const t = v.trim();
    return !t ? undefined : t.length > MAX_FIELD ? t.slice(0, MAX_FIELD) + "..." : t;
  }
  return v === null || v === false ? undefined : v;
}

export function buildResumeText(d, { fullName, location }) {
  const cleaned = clean(d) || {};
  delete cleaned.contactInfo; // name and city/state are added back below; phone, email and street are not needed by the model
  const ordered = { name: fullName || undefined, location: location || undefined };
  for (const k of FIRST) if (cleaned[k] !== undefined) { ordered[k] = cleaned[k]; delete cleaned[k]; }
  const tail = {};
  for (const k of LAST) if (cleaned[k] !== undefined) { tail[k] = cleaned[k]; delete cleaned[k]; }
  Object.assign(ordered, cleaned, tail);
  return JSON.stringify(ordered).slice(0, MAX_TOTAL);
}

// Reads the same table your match-jobs cron already uses: resume_profiles(user_id, profile_data jsonb).
// Field names inside profile_data are read with fallbacks, because only workExperience[].positionTitle,
// contactInfo.city/state, jobTitle and selectedLib.title were visible when this was written.
export async function loadApplicant(userId) {
  const { data } = await admin()
    .from("resume_profiles")
    .select("profile_data")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const d = (data && data.profile_data) || {};
  const c = d.contactInfo || {};
  const work = Array.isArray(d.workExperience) ? d.workExperience : [];

  const fullName = pick(c.fullName, c.name, [c.firstName, c.lastName].filter(Boolean).join(" "));
  const nameParts = fullName.split(" ").filter(Boolean);
  const jobTitle = pick(d.jobTitle, d.selectedLib && d.selectedLib.title, work[0] && work[0].positionTitle);
  const location = [c.city, c.state].filter(Boolean).join(", ");

  const resumeText = buildResumeText(d, { fullName, location });

  const hasResume = work.length > 0 || !!(d.summary || d.education || d.skills);

  return {
    hasResume,
    fullName,
    headline: jobTitle,
    resumeText,
    targetRoles: jobTitle ? [jobTitle] : [],
    location,
    // Fields the extension may autofill. Anything missing here is left for the person to fill in.
    applicant: {
      fullName,
      firstName: pick(c.firstName, nameParts[0]),
      lastName: pick(c.lastName, nameParts.slice(1).join(" ")),
      email: pick(c.email),
      phone: pick(c.phone, c.phoneNumber),
      linkedin: pick(c.linkedin, c.linkedIn, c.linkedinUrl),
      website: pick(c.website, c.portfolio),
      street: pick(c.street),
      city: pick(c.city),
      state: pick(c.state),
      zip: pick(c.zip, c.zipCode, c.postalCode),
      currentTitle: pick(work[0] && work[0].positionTitle),
      currentCompany: pick(work[0] && (work[0].companyName || work[0].employer || work[0].company)),
    },
  };
}
