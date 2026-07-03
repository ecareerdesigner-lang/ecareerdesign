import Stripe from "stripe";
import { PRICE_CENTS } from "../../../lib/pricing";

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

  const { jobTitle, origin } = await req.json();
  const safeOrigin = origin || "";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `KSA Assist — ${jobTitle || "job application"}`,
              description: "STAR-format response generation for one federal job application.",
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${safeOrigin}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/?paid=0`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    return Response.json({ error: e.message || "Could not create checkout session." }, { status: 500 });
  }
}
