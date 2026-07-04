// Searches real job postings from public job-search APIs and returns a
// normalized list with direct links to the original posting.
//
// Requires free API keys, set as environment variables:
//   USAJOBS_API_KEY, USAJOBS_EMAIL   — https://developer.usajobs.gov/apirequest/
//   ADZUNA_APP_ID, ADZUNA_APP_KEY    — https://developer.adzuna.com/
//   JOOBLE_API_KEY                   — https://jooble.org/api/about
//
// Any source can be left unconfigured — it's skipped with a warning rather
// than failing the whole request.

export async function POST(req) {
  const { title, location } = await req.json();
  const results = [];
  const warnings = [];

  // ---------- USAJOBS (federal positions) ----------
  if (process.env.USAJOBS_API_KEY && process.env.USAJOBS_EMAIL) {
    try {
      const params = new URLSearchParams({
        Keyword: title || "",
        LocationName: location || "",
        ResultsPerPage: "10",
      });
      const res = await fetch(`https://data.usajobs.gov/api/search?${params.toString()}`, {
        headers: {
          Host: "data.usajobs.gov",
          "User-Agent": process.env.USAJOBS_EMAIL,
          "Authorization-Key": process.env.USAJOBS_API_KEY,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data?.SearchResult?.SearchResultItems || [];
        items.forEach((item) => {
          const d = item.MatchedObjectDescriptor;
          if (!d) return;
          results.push({
            source: "USAJOBS",
            title: d.PositionTitle || "",
            employer: d.OrganizationName || "",
            location: d.PositionLocationDisplay || "",
            url: d.PositionURI || "",
            snippet: (d.UserArea?.Details?.JobSummary || "").slice(0, 220),
          });
        });
      } else {
        warnings.push("USAJOBS search failed (check USAJOBS_API_KEY / USAJOBS_EMAIL).");
      }
    } catch (e) {
      warnings.push("USAJOBS search failed.");
    }
  } else {
    warnings.push("USAJOBS is not configured yet.");
  }

  // ---------- Adzuna (broader private-sector postings) ----------
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    try {
      const params = new URLSearchParams({
        app_id: process.env.ADZUNA_APP_ID,
        app_key: process.env.ADZUNA_APP_KEY,
        results_per_page: "10",
        what: title || "",
        where: location || "",
        "content-type": "application/json",
      });
      const res = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        (data?.results || []).forEach((item) => {
          results.push({
            source: "Adzuna",
            title: item.title || "",
            employer: item.company?.display_name || "",
            location: item.location?.display_name || "",
            url: item.redirect_url || "",
            snippet: (item.description || "").slice(0, 220),
          });
        });
      } else {
        warnings.push("Adzuna search failed (check ADZUNA_APP_ID / ADZUNA_APP_KEY).");
      }
    } catch (e) {
      warnings.push("Adzuna search failed.");
    }
  } else {
    warnings.push("Adzuna is not configured yet.");
  }

  // ---------- Jooble (broad general-purpose aggregator) ----------
  if (process.env.JOOBLE_API_KEY) {
    try {
      const res = await fetch(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: title || "",
          location: location || "",
          ResultOnPage: "10",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        (data?.jobs || []).forEach((item) => {
          results.push({
            source: "Jooble",
            title: item.title || "",
            employer: item.company || "",
            location: item.location || "",
            url: item.link || "",
            snippet: (item.snippet || "").slice(0, 220),
          });
        });
      } else {
        warnings.push("Jooble search failed (check JOOBLE_API_KEY).");
      }
    } catch (e) {
      warnings.push("Jooble search failed.");
    }
  } else {
    warnings.push("Jooble is not configured yet.");
  }

  return Response.json({ results, warnings });
}
