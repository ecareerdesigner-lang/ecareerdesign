import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    for (const profile of profiles || []) {
      const data = profile.profile_data || {};
      const workExperience = data.workExperience || [];
      const contactInfo = data.contactInfo || {};

      const jobTitle = data.jobTitle || data.selectedLib?.title || workExperience[0]?.positionTitle;
      const location = [contactInfo.city, contactInfo.state].filter(Boolean).join(", ");

      if (!jobTitle) continue;

      let listings = [];
      try {
        const adzunaId = process.env.ADZUNA_APP_ID;
        const adzunaKey = process.env.ADZUNA_APP_KEY;
        if (adzunaId && adzunaKey) {
          const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=20&what=${encodeURIComponent(jobTitle)}${location ? `&where=${encodeURIComponent(location)}` : ""}`;
          const res = await fetch(url);
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
        continue;
      }

      if (!listings.length) continue;

      const rows = listings.map((l) => ({ ...l, user_id: profile.user_id }));
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("job_matches")
        .upsert(rows, { onConflict: "user_id,external_job_id", ignoreDuplicates: true })
        .select();

      if (insertError) {
        console.error(`Insert failed for user ${profile.user_id}:`, insertError);
        continue;
      }

      usersProcessed++;
      totalNewMatches += inserted?.length || 0;
    }

    return Response.json({ success: true, usersProcessed, totalNewMatches });
  } catch (e) {
    console.error("match-jobs cron failed:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}