// Searches USAJOBS, Adzuna and Jooble (same sources and keys as /api/job-search) and returns
// { jobs: [{ id, title, company, location, url, description, source }], report: [{ source, count, error? }] }.
// A source with no key, or that fails, is skipped and shows up in the report instead of breaking the search.

const TIMEOUT_MS = 10000;
const PER_SOURCE = 8;

async function timedFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function usajobs(what, where) {
  if (!process.env.USAJOBS_API_KEY || !process.env.USAJOBS_EMAIL) return { error: "not configured" };
  const one = async (loc) => {
    const params = new URLSearchParams({ Keyword: what, ResultsPerPage: String(PER_SOURCE) });
    if (loc) { params.set("LocationName", loc); params.set("Radius", "75"); }
    const res = await timedFetch(`https://data.usajobs.gov/api/search?${params}`, {
      headers: {
        Host: "data.usajobs.gov",
        "User-Agent": process.env.USAJOBS_EMAIL,
        "Authorization-Key": process.env.USAJOBS_API_KEY,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.SearchResult?.SearchResultItems || [])
      .map((i) => i.MatchedObjectDescriptor)
      .filter(Boolean)
      .map((d) => ({
        id: "usajobs_" + (d.PositionID || d.PositionURI),
        title: d.PositionTitle || "",
        company: d.OrganizationName || "",
        location: d.PositionLocationDisplay || "",
        url: d.PositionURI || "",
        description: [d.UserArea?.Details?.JobSummary, d.QualificationSummary].filter(Boolean).join("\n").slice(0, 3000),
        source: "USAJOBS",
      }));
  };
  let jobs = await one(where);
  if (!jobs.length && where) jobs = await one("");
  return { jobs };
}

async function adzuna(what, where) {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return { error: "not configured" };
  const one = async (loc) => {
    const params = new URLSearchParams({
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: String(PER_SOURCE),
      what,
      max_days_old: "45", // older ads are usually closed
      sort_by: "date",
      "content-type": "application/json",
    });
    if (loc) { params.set("where", loc); params.set("distance", "80"); }
    const res = await timedFetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.results || []).map((r) => ({
      id: "adzuna_" + r.id,
      title: r.title || "",
      company: r.company?.display_name || "",
      location: r.location?.display_name || "",
      url: r.redirect_url || "",
      description: r.description || "",
      source: "Adzuna",
    }));
  };
  let jobs = await one(where);
  if (!jobs.length && where) jobs = await one("");
  return { jobs };
}

async function jooble(what, where) {
  if (!process.env.JOOBLE_API_KEY) return { error: "not configured" };
  const one = async (loc) => {
    const res = await timedFetch(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: what, location: loc || "", ResultOnPage: String(PER_SOURCE) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.jobs || []).map((r) => ({
      id: "jooble_" + (r.id || r.link),
      title: r.title || "",
      company: r.company || "",
      location: r.location || "",
      url: r.link || "",
      description: (r.snippet || "").replace(/<[^>]+>/g, "").slice(0, 3000),
      source: "Jooble",
    }));
  };
  let jobs = await one(where);
  if (!jobs.length && where) jobs = await one("");
  return { jobs };
}

// ---------- extra sources (no key needed) ----------
const words = (t) => (t || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
const matchesWhat = (title, what) => {
  const w = words(what);
  const tt = (title || "").toLowerCase();
  return w.length ? w.some((x) => tt.includes(x)) : true;
};
const strip = (h) => (h || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const list = (envName, fallback) => (process.env[envName] ? process.env[envName].split(",") : fallback).map((x) => x.trim()).filter(Boolean);

// Keep a posting only if it is remote or in the person's city/state. Unknown locations are dropped.
function localOk(loc, where) {
  const l = (loc || "").toLowerCase();
  if (/remote|anywhere|work from home|hybrid/.test(l) && !/(canada|uk|united kingdom|europe|india|emea|apac|latam)/.test(l)) return true;
  const [city, st] = (where || "").split(",").map((x) => x.trim().toLowerCase());
  if (!city && !st) return true;
  if (city && l.includes(city)) return true;
  if (st && new RegExp(`(^|[\\s,])${st}($|[\\s,;])`).test(l)) return true;
  return false;
}

// Short in-memory cache so three role searches don't hit the same board three times.
const cache = new Map();
async function cachedJson(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.v;
  const res = await timedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const v = await res.json();
  cache.set(url, { t: Date.now(), v });
  return v;
}

// Direct employer boards. Set GREENHOUSE_BOARDS / LEVER_BOARDS (comma-separated board names) to choose employers.
const GREENHOUSE = ["stripe", "airbnb", "doordash", "instacart", "robinhood", "datadog", "cloudflare", "twilio", "okta", "asana", "dropbox", "reddit", "pinterest", "lyft", "coinbase", "gitlab", "figma", "affirm"];
const LEVER = ["palantir", "spotify", "plaid"];

async function boards(what, where) {
  const out = [];
  const gh = list("GREENHOUSE_BOARDS", GREENHOUSE).map(async (slug) => {
    try {
      const d = await cachedJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`);
      for (const j of d.jobs || []) {
        if (!matchesWhat(j.title, what) || !localOk(j.location?.name, where)) continue;
        out.push({
          id: "gh_" + slug + "_" + j.id,
          title: j.title || "",
          company: j.company_name || slug,
          location: j.location?.name || "",
          url: j.absolute_url || "",
          description: strip(j.content).slice(0, 3000),
          source: "Greenhouse",
        });
      }
    } catch {}
  });
  const lv = list("LEVER_BOARDS", LEVER).map(async (slug) => {
    try {
      const d = await cachedJson(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
      for (const j of Array.isArray(d) ? d : []) {
        if (!matchesWhat(j.text, what) || !localOk(j.categories?.location, where)) continue;
        out.push({
          id: "lv_" + slug + "_" + j.id,
          title: j.text || "",
          company: slug,
          location: j.categories?.location || "",
          url: j.hostedUrl || "",
          description: (j.descriptionPlain || "").slice(0, 3000),
          source: "Lever",
        });
      }
    } catch {}
  });
  await Promise.all([...gh, ...lv]);
  // prefer postings in the person's area (or remote), then cap
  const place = (where || "").toLowerCase().split(",")[0].trim();
  out.sort((a, b) => {
    const f = (j) => (place && j.location.toLowerCase().includes(place)) || /remote/i.test(j.location) ? 0 : 1;
    return f(a) - f(b);
  });
  return { jobs: out.slice(0, PER_SOURCE) };
}

async function themuse(what) {
  const out = [];
  for (const page of [0, 1]) {
    const d = await cachedJson(`https://www.themuse.com/api/public/jobs?page=${page}`);
    for (const j of d.results || []) {
      if (!matchesWhat(j.name, what)) continue;
      out.push({
        id: "muse_" + j.id,
        title: j.name || "",
        company: j.company?.name || "",
        location: (j.locations || []).map((l) => l.name).join("; "),
        url: j.refs?.landing_page || "",
        description: strip(j.contents).slice(0, 3000),
        source: "The Muse",
      });
    }
  }
  return { jobs: out.slice(0, PER_SOURCE) };
}

async function remotive(what) {
  const d = await cachedJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(what)}&limit=${PER_SOURCE}`);
  return {
    jobs: (d.jobs || []).filter((j) => /^(|worldwide|anywhere|usa|us|united states|north america|americas)/i.test((j.candidate_required_location || "").trim()) || /usa|united states|north america|worldwide|anywhere/i.test(j.candidate_required_location || "")).map((j) => ({
      id: "remotive_" + j.id,
      title: j.title || "",
      company: j.company_name || "",
      location: j.candidate_required_location ? "Remote: " + j.candidate_required_location : "Remote",
      url: j.url || "",
      description: strip(j.description).slice(0, 3000),
      source: "Remotive",
    })),
  };
}

export async function searchJobs({ roles, location }) {
  const list = (roles || []).filter(Boolean).slice(0, 3);
  const sources = [
    ["USAJOBS", usajobs],
    ["Adzuna", adzuna],
    ["Employer boards", boards],
    // The Muse listings often lead to "job not found" pages, so it is off unless THEMUSE_ENABLED=1.
    ...(process.env.THEMUSE_ENABLED === "1" ? [["The Muse", themuse]] : []),
    ["Remotive", remotive],
    // Jooble links are redirects through jooble.org, which Cloudflare often blocks. Off unless JOOBLE_ENABLED=1.
    ...(process.env.JOOBLE_ENABLED === "1" ? [["Jooble", jooble]] : []),
  ];
  const report = [];
  const bySource = [];

  await Promise.all(
    sources.map(async ([name, fn]) => {
      try {
        const per = await Promise.all(list.map((what) => fn(what, location).catch((e) => ({ error: e.message }))));
        const jobs = per.flatMap((p) => p.jobs || []);
        const err = per.length && per.every((p) => p.error) ? per[0].error : null;
        report.push({ source: name, count: jobs.length, ...(err ? { error: err } : {}) });
        bySource.push(jobs);
      } catch (e) {
        report.push({ source: name, count: 0, error: e.message });
      }
    })
  );

  // de-duplicate by link or title+company, and mix the sources so one doesn't crowd out the rest
  const seen = new Set();
  const jobs = [];
  const maxLen = Math.max(0, ...bySource.map((b) => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const b of bySource) {
      const j = b[i];
      if (!j || !j.url) continue;
      const key = j.url || `${j.title}|${j.company}`.toLowerCase();
      const key2 = `${j.title}|${j.company}|${j.location}`.toLowerCase();
      if (seen.has(key) || seen.has(key2)) continue;
      seen.add(key); seen.add(key2);
      jobs.push(j);
    }
  }
  return { jobs: jobs.slice(0, 24), report };
}
