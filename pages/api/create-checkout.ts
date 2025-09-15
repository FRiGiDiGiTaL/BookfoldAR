// pages/api/create-checkout.ts - Converted to Pages Router format
import type { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "../../lib/stripe";

interface CreateCheckoutRequest {
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CreateCheckoutResponse {
  sessionId?: string;
  url?: string;
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCheckoutResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, successUrl, cancelUrl }: CreateCheckoutRequest = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Validate URLs
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Success and cancel URLs required' });
    }

    console.log(`Creating checkout session for: ${email}`);

    // Create checkout session
    const session = await createCheckoutSession({
      customerEmail: email.trim().toLowerCase(),
      successUrl,
      cancelUrl,
      metadata: {
        source: 'webapp_checkout',
        timestamp: Date.now().toString()
      }
    });

    if (!session) {
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    console.log(`✅ Checkout session created: ${session.id}`);

    // Return session info for redirect
    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url!
    });

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}