import Stripe from "stripe";

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "STRIPE_SECRET_KEY is not set on the server." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  const { sessionId } = await req.json();
  if (!sessionId) {
    return Response.json({ paid: false, error: "Missing session_id." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return Response.json({ paid: session.payment_status === "paid" });
  } catch (e) {
    return Response.json({ paid: false, error: e.message || "Could not verify session." }, { status: 500 });
  }
}
