import { logError } from "@/lib/logError.js";
import { authorize } from "@/lib/usage.js";

const MAX_OUTPUT_TOKENS = 10000;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "That request couldn't be read." }, { status: 400 });
  }
  const { prompt, maxTokens, action } = body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "Missing prompt." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  // Who is asking, and are they allowed? Free accounts are capped per action; Premium and
  // existing (grandfathered) accounts pass; the public tools are limited per IP.
  const gate = await authorize(req, action, prompt.length);
  if (!gate.ok) return Response.json(gate.body, { status: gate.status });

  const STYLE_GUARD = "Write in plain, natural human prose, the way a skilled person actually writes, not the way an AI typically writes. Do not use em dashes or en dashes as punctuation anywhere in your response; use commas, periods, parentheses, or \"and\"/\"but\" instead. Avoid stock AI phrasing such as 'moreover,' 'furthermore,' 'delve into,' 'in today's competitive,' 'leverage,' 'unlock your potential,' or excessive rule-of-three parallelism. Vary sentence length and structure naturally. Follow this style guidance without ever mentioning it in your output. When the caller's prompt requests strict JSON output, still apply this style within any free-text string values, while keeping the JSON structure itself exactly as specified.";

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: Math.min(Number(maxTokens) || 1000, MAX_OUTPUT_TOKENS),
        system: STYLE_GUARD,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    await gate.refund();
    await logError({ source: "server", feature: "claude-proxy", message: e.message, stack: e.stack });
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    await gate.refund();
    await logError({ source: "server", feature: "claude-proxy", message: "Unreadable response from Anthropic: " + e.message });
    return Response.json({ error: "The AI service returned an unreadable response." }, { status: 502 });
  }

  if (!response.ok) {
    await gate.refund();
    await logError({
      source: "server",
      feature: "claude-proxy",
      message: data?.error?.message || "Anthropic API error",
      context: { status: response.status },
    });
    return Response.json(
      { error: data?.error?.message || "Anthropic API error" },
      { status: response.status }
    );
  }

  return Response.json(data);
}
