import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logError.js";
export const dynamic = 'force-dynamic';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADZUNA_TIMEOUT_MS = 10000;
const PROFILE_CONCURRENCY = 5;

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function processProfile(profile) {
  const data = profile.profile_data || {};
  const workExperience = data.workExperience || [];
  const contactInfo = data.contactInfo || {};

  const jobTitle = data.jobTitle || data.selectedLib?.title || workExperience[0]?.positionTitle;
  const location = [contactInfo.city, contactInfo.state].filter(Boolean).join(", ");

  if (!jobTitle) return { processed: false, newMatches: 0 };

  let listings = [];
  try {
    const adzunaId = process.env.ADZUNA_APP_ID;
    const adzunaKey = process.env.ADZUNA_APP_KEY;
    if (adzunaId && adzunaKey) {
      const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=20&what=${encodeURIComponent(jobTitle)}${location ? `&where=${encodeURIComponent(location)}` : ""}`;
      const res = await fetchWithTimeout(url, ADZUNA_TIMEOUT_MS);
      if (res.ok) {
        const json = await res.json();
        listings = (json.results || []).map((j) => ({
          external_job_id: `adzuna_${j.id}`,
          job_title: j.title,
          company_name: j.company?.display_name || null,
          job_url: j.redirect_url,
          source: "adzuna",
        }));
      }
    }
  } catch (e) {
    console.error(`Job search failed for user ${profile.user_id}:`, e);
    await logError({ source: "server", feature: "cron-match-jobs", message: e.message, stack: e.stack, context: { userId: profile.user_id, stage: "search" } });
    return { processed: false, newMatches: 0 };
  }

  if (!listings.length) return { processed: false, newMatches: 0 };

  const rows = listings.map((l) => ({ ...l, user_id: profile.user_id }));
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("job_matches")
    .upsert(rows, { onConflict: "user_id,external_job_id", ignoreDuplicates: true })
    .select();

  if (insertError) {
    console.error(`Insert failed for user ${profile.user_id}:`, insertError);
    await logError({ source: "server", feature: "cron-match-jobs", message: insertError.message, context: { userId: profile.user_id, stage: "insert" } });
    return { processed: false, newMatches: 0 };
  }

  return { processed: true, newMatches: inserted?.length || 0 };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("resume_profiles")
      .select("user_id, profile_data");

    if (profileError) throw profileError;

    let usersProcessed = 0;
    let totalNewMatches = 0;

    const list = profiles || [];
    for (let i = 0; i < list.length; i += PROFILE_CONCURRENCY) {
      const batch = list.slice(i, i + PROFILE_CONCURRENCY);
      const results = await Promise.all(batch.map(processProfile));
      for (const r of results) {
        if (r.processed) usersProcessed++;
        totalNewMatches += r.newMatches;
      }
    }

    return Response.json({ success: true, usersProcessed, totalNewMatches });
  } catch (e) {
    console.error("match-jobs cron failed:", e);
    await logError({ source: "server", feature: "cron-match-jobs", message: e.message, stack: e.stack, context: { stage: "top-level" } });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
