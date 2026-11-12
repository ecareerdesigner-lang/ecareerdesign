import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { hasPremium } from "@/lib/premium.js";
import { logError } from "@/lib/logError.js";

// Service-role client for usage + profile reads. Next 14 caches server-side fetch() calls by
// default, and supabase-js uses fetch, so without cache: "no-store" a profile or counter read
// can come back stale (a new Premium buyer still looking limited, a counter stuck at 0).
let _db;
function db() {
  if (!_db) {
    _db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return _db;
}

const bearer = (req) => {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
};

// A normal Supabase session token (sent by the web app) -> user id, or null.
export async function userFromRequest(req) {
  const jwt = bearer(req);
  if (!jwt) return null;
  const { data, error } = await db().auth.getUser(jwt);
  return error ? null : data.user?.id || null;
}

// ---- free tier configuration ------------------------------------------------
// Free accounts get FREE_LIMIT generations of each "capped" action. "assist" calls are the
// smaller helper calls inside a builder session (one per requirement answer, skills section,
// work-history polish, and so on). They are pooled so a single job-tailoring run is not charged
// ten times, but they are still bounded so the route cannot be used as a free AI proxy.
export const FREE_LIMIT = Number(process.env.FREE_TIER_LIMIT) || 2;
export const ASSIST_LIMIT = Number(process.env.FREE_TIER_ASSIST_LIMIT) || FREE_LIMIT * 40;
// Open public tools (ATS checker, resume/job match, resume score): per-IP, per day.
export const PUBLIC_PER_DAY = Number(process.env.PUBLIC_TOOL_PER_DAY) || 30;

// kind: capped   -> counts against FREE_LIMIT for free accounts
//       assist   -> counts against the pooled ASSIST_LIMIT for free accounts
//       premium  -> Premium (or grandfathered) accounts only
//       public   -> no account needed, limited per IP
export const ACTIONS = {
  resume: { kind: "capped", noun: "resume generations" },
  cover_letter: { kind: "capped", noun: "cover letter generations" },
  tailoring: { kind: "capped", noun: "job tailoring runs" },
  assist: { kind: "assist", noun: "builder assists" },
  premium: { kind: "premium", noun: "Premium features" },
  public_tool: { kind: "public", noun: "free tool scans" },
};
export const COUNTED_ACTIONS = Object.keys(ACTIONS).filter((a) => ["capped", "assist"].includes(ACTIONS[a].kind));

const MAX_PROMPT_CHARS = { default: 80000, public: 40000 };

function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
const hashIp = (ip) =>
  crypto.createHash("sha256").update(`${process.env.USAGE_IP_SALT || "ecd"}:${ip}`).digest("hex").slice(0, 32);

const deny = (status, error, code, extra = {}) => ({ ok: false, status, body: { error, code, ...extra } });
const allow = (extra = {}) => ({ ok: true, refund: async () => {}, ...extra });

export async function getProfile(userId) {
  const { data } = await db()
    .from("profiles")
    .select("is_premium, premium_until, grandfathered")
    .eq("id", userId)
    .maybeSingle();
  return data || null;
}

export const isUnlimited = (profile) => !!profile && (hasPremium(profile) || !!profile.grandfathered);

// Decide whether this request may run. Returns { ok: true, refund() } or { ok: false, status, body }.
export async function authorize(req, action, promptLength = 0) {
  const cfg = ACTIONS[action];
  if (!cfg) return deny(400, "That request type isn't supported.", "bad_action");

  const maxChars = cfg.kind === "public" ? MAX_PROMPT_CHARS.public : MAX_PROMPT_CHARS.default;
  if (promptLength > maxChars) return deny(413, "That request was too large.", "too_large");

  if (cfg.kind === "public") {
    const { data, error } = await db().rpc("consume_anon", {
      p_ip: hashIp(clientIp(req)),
      p_action: action,
      p_limit: PUBLIC_PER_DAY,
      p_window: "24 hours",
    });
    if (error) {
      // Fail open: a broken counter must not take the free tools offline.
      logError({ source: "server", feature: "usage-public", message: error.message });
      return allow();
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row && !row.allowed) {
      return deny(429, "You've reached today's limit for the free tools. Please try again tomorrow, or create a free account.", "rate_limited");
    }
    return allow();
  }

  const userId = await userFromRequest(req);
  if (!userId) return deny(401, "Please sign in (it's free) to continue.", "auth_required");

  const profile = await getProfile(userId);
  if (isUnlimited(profile)) return allow({ userId, unlimited: true });

  if (cfg.kind === "premium") {
    return deny(402, "This is part of eCareer Design Premium.", "premium_required", { action });
  }

  const limit = cfg.kind === "assist" ? ASSIST_LIMIT : FREE_LIMIT;
  const { data, error } = await db().rpc("consume_usage", { p_user: userId, p_action: action, p_limit: limit });
  if (error) {
    // Fail open for signed-in users and say so in the error log, so a missing migration or an
    // outage is visible without locking people out.
    logError({ source: "server", feature: "usage-consume", message: error.message, context: { action } });
    return allow({ userId });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (row && !row.allowed) {
    return deny(
      402,
      `You've used all ${limit} of your free ${cfg.noun}. Upgrade to keep going.`,
      "limit_reached",
      { action, used: row.used, limit }
    );
  }
  return allow({
    userId,
    refund: async () => {
      const { error: refundErr } = await db().rpc("refund_usage", { p_user: userId, p_action: action });
      if (refundErr) logError({ source: "server", feature: "usage-refund", message: refundErr.message, context: { action } });
    },
  });
}

// Usage summary for the signed-in user (drives the counters and upgrade prompts in the UI).
export async function usageSummary(userId) {
  const profile = await getProfile(userId);
  const unlimited = isUnlimited(profile);
  const used = Object.fromEntries(COUNTED_ACTIONS.map((a) => [a, 0]));
  if (!unlimited) {
    const { data } = await db().from("usage_events").select("action").eq("user_id", userId);
    for (const r of data || []) if (r.action in used) used[r.action] += 1;
  }
  return {
    unlimited,
    premium: !!profile && hasPremium(profile),
    limit: FREE_LIMIT,
    assistLimit: ASSIST_LIMIT,
    used,
  };
}
