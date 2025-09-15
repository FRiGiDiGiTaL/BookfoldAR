// pages/api/webhooks.ts - Converted to Pages Router format
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from 'micro';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get raw body
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed.", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`✅ Webhook received: ${event.type} - ${event.id}`);

    // Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`💰 Payment completed for session: ${session.id}`);
        console.log(`📧 Customer email: ${session.customer_email}`);
        
        // TODO: Update your database here to mark user as paid
        // Example:
        // await supabaseAdmin.from('purchases').insert({
        //   email: session.customer_email,
        //   stripe_session_id: session.id,
        //   amount: session.amount_total,
        //   status: 'paid'
        // });
        
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💳 Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success
    return res.status(200).json({ received: true, event_id: event.id });

  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}