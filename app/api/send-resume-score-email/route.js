export async function POST(req) {
  let email, scores = {};
  try {
    ({ email, ...scores } = await req.json());
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

    const {
      overallScore, atsScore, keywordScore, formattingScore,
      weakBulletPoints, missingSkills, employerReadiness,
    } = scores;

    const bodyText = `Here's your free Resume Score from eCareer Design.

Overall Score: ${overallScore}/100
ATS Score: ${atsScore}/100
Keyword Score: ${keywordScore}/100
Formatting Score: ${formattingScore}/100

Weak Bullet Points to Improve:
${(weakBulletPoints || []).map((b) => `- ${b}`).join("\n") || "None flagged"}

Missing Skills to Consider Adding:
${(missingSkills || []).map((s) => `- ${s}`).join("\n") || "None flagged"}

Employer Readiness:
${employerReadiness || ""}

${"=".repeat(40)}

Want help fixing these gaps? eCareer Design's Resume Builder, Job Tailoring, and premium Interview Coach can help you land more interviews. Log back in anytime at ecareerdesign.net.

This is an independent tool, not an official product of any employer, agency, or job platform.

— eCareer Design`;

    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: `Your Free Resume Score: ${overallScore}/100`,
      text: bodyText,
    });

    if (sendResult.error) {
      console.error("Resend send error:", sendResult.error);
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
    console.error("send-resume-score-email route failed:", e);
    return Response.json({ success: false, error: e.message || "Something went wrong." }, { status: 500 });
  }
}