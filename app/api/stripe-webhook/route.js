import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { nextPassEnd } from "../../../lib/premium.js";
import { logError } from "@/lib/logError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;

      if (userId) {
        const isPass =
          session.mode === "payment" || session.metadata?.plan === "pass";

        if (isPass) {
          const { data: existing } = await supabaseAdmin
            .from("profiles")
            .select("premium_until")
            .eq("id", userId)
            .maybeSingle();

          const patch = {
            id: userId,
            premium_until: nextPassEnd(existing?.premium_until),
          };

          if (session.customer) patch.stripe_customer_id = session.customer;

          await supabaseAdmin
            .from("profiles")
            .upsert(patch, { onConflict: "id" });
        } else {
          const patch = { id: userId, is_premium: true };
          if (session.customer) patch.stripe_customer_id = session.customer;

          await supabaseAdmin
            .from("profiles")
            .upsert(patch, { onConflict: "id" });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer);

      if (rows && rows.length > 0) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_premium: false })
          .eq("id", rows[0].id);
      }
    }

    return Response.json({ received: true });
  } catch (e) {
    console.error("stripe-webhook handler failed:", e);
    await logError({ source: "server", feature: "stripe-webhook", message: e.message, stack: e.stack, context: { eventType: event?.type } });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
