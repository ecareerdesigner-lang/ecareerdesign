import { HttpError } from "./auth";
import { logError } from "@/lib/logError.js";

// Minimal Claude helper. If you'd rather keep everything behind your existing /api/claude route,
// replace the body of callOnce with a call to it.
const MODEL = process.env.EXT_CLAUDE_MODEL || "claude-sonnet-5-5";
const TIMEOUT_MS = 45000;

async function callOnce({ system, user, maxTokens }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system:
          `${system}\nRespond with a single valid JSON object and nothing else. ` +
          `Never use double-quote characters inside text values; use single quotes instead.`,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (e) {
    throw new HttpError(504, "The AI service took too long to answer. Please try again.", "ai_unavailable");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const e = await res.json();
      detail = (e && e.error && e.error.message) || "";
    } catch {}
    // Details (for example a low credit balance) go to your logs, not to the customer.
    console.error(`[extension] Claude request failed (${res.status}): ${detail}`);
    logError({ source: "server", feature: "extension-claude", message: `Claude ${res.status}: ${detail}`, context: { status: res.status } });
    throw new HttpError(502, "Our AI service is temporarily unavailable. Please try again in a moment.", "ai_unavailable");
  }
  const data = await res.json();
  const raw = (data.content || []).map((c) => c.text || "").join("").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new SyntaxError("The model returned no JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function askJson({ system, user, maxTokens = 2500 }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[extension] ANTHROPIC_API_KEY is not set on the server.");
    throw new HttpError(503, "This feature isn't available right now. Please try again later.", "ai_unavailable");
  }
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callOnce({ system, user, maxTokens });
    } catch (e) {
      lastErr = e;
      if (!(e instanceof SyntaxError)) throw e; // retry only when the answer couldn't be read
    }
  }
  throw new HttpError(502, "The AI answer couldn't be read. Please try again.", "ai_unavailable");
}
