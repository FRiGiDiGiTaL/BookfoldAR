// app/api/webhooks/route.ts
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import supabaseAdmin from "../../../lib/supabaseAdmin";

// Initialize Stripe with server secret key and API version compatible with your SDK
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  try {
    // Read raw body
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("Missing stripe-signature header");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed.", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Idempotency: skip if event already processed
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 });
    }

    // Insert raw event
    await supabaseAdmin.from("stripe_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data.object,
      processed: false,
      created_at: new Date().toISOString(),
    });

    // Handle key events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const plan = subscription.items.data[0]?.price?.recurring?.interval || "unknown";

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          await supabaseAdmin.from("subscriptions").upsert({
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price?.id,
            user_id: user.id,
            status,
            plan_type: plan,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
          });
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const paymentIntentId = invoice.payment_intent as string;
        const amount = invoice.amount_paid;
        const currency = invoice.currency;
        const subId = invoice.subscription as string;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", invoice.customer as string)
          .single();

        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subId)
          .single();

        if (user && subscription) {
          await supabaseAdmin.from("payments").insert({
            user_id: user.id,
            subscription_id: subscription.id,
            stripe_payment_intent_id: paymentIntentId,
            amount,
            currency,
            status: "paid",
            created_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Mark event processed
    await supabaseAdmin
      .from("stripe_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
}
