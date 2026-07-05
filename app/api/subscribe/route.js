// Sends the person a real copy of what they just built (genuine value, not a
// cold signup ask), and — only if they opt in — adds them to a Resend
// Audience for future product updates.
//
// Requires a free Resend account and API key: https://resend.com
//   RESEND_API_KEY      — required for sending the email at all
//   RESEND_FROM_EMAIL   — required, must be a verified sender/domain in Resend
//   RESEND_AUDIENCE_ID  — optional; only needed if you want the opt-in list feature

export async function POST(req) {
  let email, optIn, content, contentType, pdfBase64, pdfFilename;
  try {
    ({ email, optIn, content, contentType, pdfBase64, pdfFilename } = await req.json());
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

    const label = contentType || "content";
    const bodyText = pdfBase64
      ? `Here's the ${label} you just built with eCareer Design — attached as a PDF, matching the exact template and color you picked.\n\nA plain-text copy is included below too, in case you want to paste it somewhere directly.\n\n${"=".repeat(40)}\n\n${content || ""}\n\n${"=".repeat(40)}\n\nThis is an independent tool, not an official product of any employer, agency, or job platform. Review this content for accuracy before submitting it anywhere.\n\n— eCareer Design`
      : `Here's the ${label} you just built with eCareer Design.\n\n${"=".repeat(40)}\n\n${content || ""}\n\n${"=".repeat(40)}\n\nThis is an independent tool, not an official product of any employer, agency, or job platform. Review this content for accuracy before submitting it anywhere.\n\n— eCareer Design`;

    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: `Your ${label} from eCareer Design`,
      text: bodyText,
      attachments: pdfBase64
        ? [{ filename: pdfFilename || `${label.replace(/\s+/g, "_")}.pdf`, content: pdfBase64 }]
        : undefined,
    });

    if (sendResult.error) {
      console.error("Resend send error:", sendResult.error);
      return Response.json({ success: false, error: sendResult.error.message || "Could not send the email." }, { status: 500 });
    }

    // Opt-in to the mailing list is best-effort — if it fails or isn't
    // configured, we still consider the request a success since the person
    // already got their email.
    if (optIn && process.env.RESEND_AUDIENCE_ID) {
      try {
        const { Resend } = await import("resend");
        const resend2 = new Resend(process.env.RESEND_API_KEY);
        await resend2.contacts.create({
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
    console.error("subscribe route failed:", e);
    return Response.json({ success: false, error: e.message || "Something went wrong." }, { status: 500 });
  }
}
