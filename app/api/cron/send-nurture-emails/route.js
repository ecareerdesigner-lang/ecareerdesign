import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logError.js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = "https://www.ecareerdesign.net";
const MAILING_ADDRESS = "eCareer Design, 110 Kingshall Rd, Mooresville, NC 28117";

function unsubscribeUrl(token) {
  return `${SITE_URL}/api/unsubscribe?token=${token}`;
}

// Every marketing email must carry a working opt-out link and the sender's
// postal address, so the footer is added here rather than in each template.
function withFooter(text, token) {
  return `${text}

--
You're getting this because you requested a free resume report at ecareerdesign.net.
Unsubscribe: ${unsubscribeUrl(token)}

${MAILING_ADDRESS}`;
}

function day2Email() {
  return {
    subject: "Here's what eCareerDesign Premium actually does",
    text: `You already saw your score. Here's what happens if you keep going.

Premium unlocks:

- Career Dashboard - track every application and its status in one place
- Interview Coach - practice live mock interviews with AI feedback on your actual answers
- Resume Match Scoring - check your resume against any job posting, not just one
- Performance Review Writer - polished mid-year, end-of-year, or end-of-position reviews

It's $9.99/month, no long-term contract. Prefer not to subscribe? A one-time 30-day pass is $15.99. Most people use it to stop guessing whether an application is worth sending before they send it.

See the plans: https://www.ecareerdesign.net/pricing?utm_source=email&utm_medium=nurture&utm_campaign=day2

- eCareerDesign`,
  };
}

function day5Email() {
  return {
    subject: "Still thinking it over?",
    text: `No pressure - just a nudge.

If checking your score answered one question, it probably raised another: what do I actually change? That's the part eCareerDesign Premium is built for - matching your resume to a specific job, practicing the interview that follows, and tracking the whole search in one place instead of scattered tabs and guesswork.

$9.99/month, cancel anytime. Or skip the subscription: a one-time 30-day pass is $15.99.

Pick up where you left off: https://www.ecareerdesign.net/pricing?utm_source=email&utm_medium=nurture&utm_campaign=day5

- eCareerDesign`,
  };
}

async function sendNurtureEmail(resend, lead, content) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: lead.email,
    subject: content.subject,
    text: withFooter(content.text, lead.unsubscribe_token),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl(lead.unsubscribe_token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

async function selectWithRetry(buildQuery, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await buildQuery();
    if (!error) return data;
    lastError = error;
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return Response.json({ error: "Email delivery isn't configured yet." }, { status: 500 });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  let day2Sent = 0;
  let day5Sent = 0;

  try {
    const day2Leads = await selectWithRetry(() =>
      supabaseAdmin
        .from("email_nurture_leads")
        .select("id, email, unsubscribe_token")
        .is("unsubscribed_at", null)
        .is("day2_sent_at", null)
        .lte("captured_at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
    );

    for (const lead of day2Leads || []) {
      try {
        if (!lead.unsubscribe_token) continue; // never send without an opt-out link
        await sendNurtureEmail(resend, lead, day2Email());
        await supabaseAdmin
          .from("email_nurture_leads")
          .update({ day2_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
        day2Sent++;
      } catch (e) {
        console.error(`day2 nurture email failed for ${lead.email}:`, e);
        await logError({ source: "server", feature: "cron-send-nurture-emails", message: e.message, context: { stage: "day2", leadId: lead.id } });
      }
    }

    const day5Leads = await selectWithRetry(() =>
      supabaseAdmin
        .from("email_nurture_leads")
        .select("id, email, unsubscribe_token")
        .is("unsubscribed_at", null)
        .is("day5_sent_at", null)
        .lte("captured_at", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
    );

    for (const lead of day5Leads || []) {
      try {
        if (!lead.unsubscribe_token) continue; // never send without an opt-out link
        await sendNurtureEmail(resend, lead, day5Email());
        await supabaseAdmin
          .from("email_nurture_leads")
          .update({ day5_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
        day5Sent++;
      } catch (e) {
        console.error(`day5 nurture email failed for ${lead.email}:`, e);
        await logError({ source: "server", feature: "cron-send-nurture-emails", message: e.message, context: { stage: "day5", leadId: lead.id } });
      }
    }

    return Response.json({ success: true, day2Sent, day5Sent });
  } catch (e) {
    console.error("send-nurture-emails cron failed:", e);
    await logError({ source: "server", feature: "cron-send-nurture-emails", message: e.message, stack: e.stack, context: { stage: "top-level" } });
    return Response.json({ error: e.message }, { status: 500 });
  }
}