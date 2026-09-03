import { logError } from "@/lib/logError.js";

export async function POST(req) {
  let email, data = {};
  try {
    ({ email, ...data } = await req.json());
  } catch (e) {
    return Response.json({ success: false, error: "Could not read the request." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return Response.json(
      { success: false, error: "Email delivery isn't configured yet." },
      { status: 500 }
    );
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { score, matchedSkills, missingSkills, keywordGaps, summary } = data;

    const bodyText = `Here's your free Resume ↔ Job Description Match Score from eCareer Design.

Match Score: ${score}/100

What Matches:
${(matchedSkills || []).map((s) => `- ${s}`).join("\n") || "None flagged"}

Missing Skills:
${(missingSkills || []).map((s) => `- ${s}`).join("\n") || "None flagged"}

Keywords to Add for ATS:
${(keywordGaps || []).map((k) => `- ${k}`).join("\n") || "None flagged"}

Recruiter Take:
${summary || ""}

${"=".repeat(40)}

Want help closing these gaps? eCareer Design's Resume Builder and Job Tailoring can rewrite your resume around this exact posting. Log back in anytime at ecareerdesign.net.

This is an independent tool, not an official product of any employer, agency, or job platform.

— eCareer Design`;

    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: `Your Resume Match Score: ${score}/100`,
      text: bodyText,
    });

    if (sendResult.error) {
      console.error("Resend send error:", sendResult.error);
      await logError({ source: "server", feature: "match-score-email", message: sendResult.error.message || "Resend send error", context: { stage: "send" } });
      return Response.json({ success: false, error: sendResult.error.message || "Could not send the email." }, { status: 500 });
    }

    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          unsubscribed: false,
        });
      } catch (e) {
        console.error("Resend contact create failed (non-fatal):", e);
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("send-match-score-email route failed:", e);
    await logError({ source: "server", feature: "match-score-email", message: e.message, stack: e.stack });
    return Response.json({ success: false, error: e.message || "Something went wrong." }, { status: 500 });
  }
}
