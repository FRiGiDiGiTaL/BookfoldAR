// pages/api/verify-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe";

interface VerifySessionResponse {
  paid: boolean;
  error?: string;
  session?: {
    id: string;
    status: string | null; // Update the type to allow null values
    payment_status: string;
    customer_email?: string;
    mode: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifySessionResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      paid: false, 
      error: "Method not allowed" 
    });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        paid: false,
        error: "Session ID is required"
      });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'subscription', 'payment_intent']
    });

    if (!session) {
      return res.status(404).json({
        paid: false,
        error: "Session not found"
      });
    }

    // Check if payment was successful
    const paid = session.payment_status === 'paid';

    console.log(`Session ${session_id} verification:`, {
      status: session.status,
      payment_status: session.payment_status,
      mode: session.mode,
      paid
    });

    return res.status(200).json({
      paid,
      session: {
        id: session.id,
        status: session.status ?? '', // Add a null coalescing operator to provide a default value
        payment_status: session.payment_status,
        customer_email: session.customer_email || undefined,
        mode: session.mode
      }
    });

  } catch (error) {
    console.error("Session verification error:", error);
    
    return res.status(500).json({
      paid: false,
      error: "Failed to verify session"
    });
  }
}