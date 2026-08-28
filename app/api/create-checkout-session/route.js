import Stripe from "stripe";
import { logError } from "@/lib/logError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { userId, email, plan } = await req.json();

    if (!userId || !email) {
      return Response.json({ error: "Missing user info" }, { status: 400 });
    }

    const isPass = plan === "pass";
    const priceId = isPass
      ? process.env.STRIPE_PASS_PRICE_ID
      : process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      console.error("Missing price id for plan:", plan);
      await logError({ source: "server", feature: "stripe-checkout", message: `Missing price id for plan: ${plan}` });
      return Response.json(
        { error: "That plan is not available right now." },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      mode: isPass ? "payment" : "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      ...(isPass ? { customer_creation: "always" } : {}),
      metadata: { plan: isPass ? "pass" : "subscription", userId },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("create-checkout-session failed:", e);
    await logError({ source: "server", feature: "stripe-checkout", message: e.message, stack: e.stack });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
