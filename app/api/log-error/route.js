import { logError } from "@/lib/logError.js";

// Receives client-side error reports (uncaught exceptions, unhandled
// promise rejections) from the global handler installed in layout.js.
export async function POST(req) {
  try {
    const body = await req.json();
    await logError({
      source: "client",
      feature: body.feature || "uncaught",
      message: body.message,
      stack: body.stack,
      context: body.context,
    });
  } catch (e) {
    // Never fail the client over a logging problem.
  }
  return Response.json({ ok: true });
}
