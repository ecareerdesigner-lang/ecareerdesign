import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return Response.json({ error: "Missing user info" }, { status: 400 });
    }

    const origin = req.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("create-checkout-session failed:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}