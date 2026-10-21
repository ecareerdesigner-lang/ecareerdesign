import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logError.js";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function htmlPage(title, message, status = 200) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | eCareer Design</title>
</head>
<body style="margin:0;background:#EEF0EC;font-family:Inter,Arial,sans-serif;color:#16283D">
<div style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center">
<h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 12px">${title}</h1>
<p style="font-size:16px;line-height:1.6;color:#3C5069;margin:0 0 24px">${message}</p>
<a href="https://www.ecareerdesign.net" style="color:#F2660A;font-weight:600">Back to eCareer Design</a>
</div>
</body>
</html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handle(req) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token || !UUID_RE.test(token)) {
    return htmlPage(
      "This link isn't valid",
      "The unsubscribe link looks incomplete. Please use the link from the bottom of the email, or write to hello@ecareerdesign.net and we'll remove you.",
      400
    );
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: lead, error: findError } = await supabaseAdmin
      .from("email_nurture_leads")
      .select("id, email, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (findError) throw findError;

    if (!lead) {
      return htmlPage(
        "This link isn't valid",
        "We couldn't find that subscription. Write to hello@ecareerdesign.net and we'll remove you.",
        404
      );
    }

    if (!lead.unsubscribed_at) {
      const { error: updateError } = await supabaseAdmin
        .from("email_nurture_leads")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("id", lead.id);
      if (updateError) throw updateError;

      // Best effort: mark the contact unsubscribed in Resend too.
      if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.contacts.update({
            email: lead.email,
            audienceId: process.env.RESEND_AUDIENCE_ID,
            unsubscribed: true,
          });
        } catch (e) {
          console.error("Resend contact unsubscribe failed (non-fatal):", e);
        }
      }
    }

    return htmlPage(
      "You're unsubscribed",
      "We won't send you any more follow-up emails. If one still arrives, write to hello@ecareerdesign.net and we'll fix it."
    );
  } catch (e) {
    console.error("unsubscribe route failed:", e);
    await logError({ source: "server", feature: "unsubscribe", message: e.message, stack: e.stack });
    return htmlPage(
      "Something went wrong",
      "We couldn't process that just now. Please try the link again, or write to hello@ecareerdesign.net and we'll remove you.",
      500
    );
  }
}

// GET: the link in the email. POST: mail clients' one-click unsubscribe button
// (List-Unsubscribe-Post). Both read the token from the query string.
export async function GET(req) {
  return handle(req);
}

export async function POST(req) {
  return handle(req);
}
