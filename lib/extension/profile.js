import { admin } from "./auth";

const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim()) || "";

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

  // Send the model the whole saved profile, but drop any huge strings (photos, embedded files).
  const resumeText = JSON.stringify(d, (_k, v) => (typeof v === "string" && v.length > 5000 ? undefined : v));

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
