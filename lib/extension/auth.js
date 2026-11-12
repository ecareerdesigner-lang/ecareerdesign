import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { hasPremium } from "@/lib/premium.js";
import { logError } from "@/lib/logError.js";

export const LIMITS = {
  matchesPerDay: Number(process.env.EXT_MATCHES_PER_DAY) || 20,
  preparesPerDay: Number(process.env.EXT_PREPARES_PER_DAY) || 40,
};
export const TOKEN_TTL_DAYS = 90;
export const MAX_ACTIVE_TOKENS = 5;

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");

// Pairing codes avoid look-alike characters (no 0/O, 1/I/L), shown as XXXXX-XXXXX.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makePairCode() {
  let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}
export const normalizeCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

let _admin;
export function admin() {
  if (!_admin) {
    _admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _admin;
}

// ---- responses -------------------------------------------------------------
// The extension authenticates with a bearer token (never cookies), so a permissive CORS policy
// can't be used for cross-site request forgery.
export function cors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  return res;
}
export function json(body, status = 200) {
  return cors(Response.json(body, { status }));
}
export const preflight = () => cors(new Response(null, { status: 204 }));

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Wrap a handler: expected problems (HttpError) are shown to the person; anything else is logged
// and replaced with a generic message so internal details never reach customers.
export function safe(feature, handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.message, ...(e.code ? { code: e.code } : {}) }, e.status);
      }
      console.error(`[extension:${feature}]`, e);
      logError({ source: "server", feature: `extension-${feature}`, message: e && e.message, stack: e && e.stack });
      return json({ error: "Something went wrong on our side. Please try again in a moment." }, 500);
    }
  };
}

export async function readJson(req, maxChars = 200000) {
  const text = await req.text();
  if (text.length > maxChars) throw new HttpError(413, "That request was too large.");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "That request couldn't be read.");
  }
}

// ---- authentication --------------------------------------------------------
const bearer = (req) => {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
};

// Extension token -> { userId, tokenHash } or null. Rejects revoked and expired tokens.
export async function authExtension(req) {
  const token = bearer(req);
  if (!token) return null;
  const tokenHash = sha256(token);
  const { data } = await admin().from("extension_tokens").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (!data || data.revoked) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  const last = data.last_used_at ? new Date(data.last_used_at).getTime() : 0;
  if (Date.now() - last > 10 * 60 * 1000) {
    await admin().from("extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash);
  }
  return { userId: data.user_id, tokenHash };
}

// Kept for older call sites.
export async function userFromExtensionToken(req) {
  const a = await authExtension(req);
  return a ? a.userId : null;
}

// A normal Supabase session token (sent by the web app) -> user id.
export async function userFromSupabaseJwt(req) {
  const jwt = bearer(req);
  if (!jwt) return null;
  const { data, error } = await admin().auth.getUser(jwt);
  return error ? null : data.user?.id || null;
}

// ---- premium + usage -------------------------------------------------------
export async function isPremiumUser(userId) {
  const { data } = await admin().from("profiles").select("is_premium, premium_until").eq("id", userId).maybeSingle();
  return hasPremium(data);
}

// Returns a 403 Response when the person isn't premium, otherwise null.
export async function premiumGate(userId) {
  if (await isPremiumUser(userId)) return null;
  return json(
    { error: "The browser extension is part of eCareer Design Premium.", code: "premium_required" },
    403
  );
}

// Adds one use for today. A broken counter never blocks a paying customer, but the limit is enforced when it works.
export async function bumpUsage(userId, kind, limit) {
  const { data, error } = await admin().rpc("extension_bump_usage", { p_user: userId, p_kind: kind, p_limit: limit });
  if (error) {
    console.error("[extension] usage counter failed:", error.message);
    return { ok: true, used: null };
  }
  if (data === -1) return { ok: false, used: limit };
  return { ok: true, used: data };
}

export async function getUsage(userId) {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await admin()
    .from("extension_usage")
    .select("matches, prepares")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  return {
    matches: (data && data.matches) || 0,
    prepares: (data && data.prepares) || 0,
    matchesLimit: LIMITS.matchesPerDay,
    preparesLimit: LIMITS.preparesPerDay,
  };
}
