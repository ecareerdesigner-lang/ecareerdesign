import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fire-and-forget error capture used across API routes and the client.
// Never throws -- a failure to log must never break the feature that
// triggered it. Rows here are read by an automated bug-detection bot,
// so keep messages/context genuinely useful for diagnosing root cause.
export async function logError({ source, feature, message, stack, context }) {
  try {
    const trimmedMessage = String(message || "Unknown error").slice(0, 2000);
    const fingerprint = `${feature || "unknown"}:${trimmedMessage.slice(0, 120)}`;
    await supabase.from("error_logs").insert({
      source,
      feature: feature || null,
      message: trimmedMessage,
      stack: stack ? String(stack).slice(0, 4000) : null,
      context: context || null,
      fingerprint,
    });
  } catch (e) {
    console.error("logError failed:", e);
  }
}
