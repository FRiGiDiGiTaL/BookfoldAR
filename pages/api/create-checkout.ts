// pages/api/create-checkout.ts - Enhanced with better error handling and validation
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
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Log the incoming request for debugging
  console.log('🔵 Checkout API called:', {
    method: req.method,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    }
  });

  try {
    const { email, successUrl, cancelUrl }: CreateCheckoutRequest = req.body;

    // Enhanced email validation
    if (!email || typeof email !== 'string') {
      console.error('❌ Invalid email:', email);
      return res.status(400).json({ 
        error: 'Email is required',
        details: 'Valid email address is required to create checkout session'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error('❌ Invalid email format:', email);
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Validate URLs are provided and are valid
    if (!successUrl || !cancelUrl) {
      console.error('❌ Missing URLs:', { successUrl, cancelUrl });
      return res.status(400).json({ 
        error: 'Success and cancel URLs are required',
        details: 'Both successUrl and cancelUrl must be provided'
      });
    }

    // Validate URLs are absolute
    try {
      new URL(successUrl);
      new URL(cancelUrl);
    } catch (urlError) {
      console.error('❌ Invalid URL format:', { successUrl, cancelUrl, urlError });
      return res.status(400).json({ 
        error: 'Invalid URL format',
        details: 'Success and cancel URLs must be absolute URLs'
      });
    }

    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Stripe configuration is incomplete'
      });
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      console.error('❌ Missing NEXT_PUBLIC_STRIPE_PRICE_ID environment variable');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Product pricing configuration is missing'
      });
    }

    console.log(`🔵 Creating checkout session for: ${email.trim().toLowerCase()}`);
    console.log(`🔵 Using price ID: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID}`);

    // Create checkout session
    const session = await createCheckoutSession({
      customerEmail: email.trim().toLowerCase(),
      successUrl,
      cancelUrl,
      metadata: {
        source: 'webapp_checkout',
        timestamp: Date.now().toString(),
        user_agent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
      }
    });

    if (!session) {
      console.error('❌ Failed to create checkout session - session is null');
      return res.status(500).json({ 
        error: 'Failed to create checkout session',
        details: 'Unable to initialize payment session. Please try again.'
      });
    }

    if (!session.url) {
      console.error('❌ Checkout session created but no URL returned:', session.id);
      return res.status(500).json({ 
        error: 'Invalid checkout session',
        details: 'Payment session was created but redirect URL is missing'
      });
    }

    console.log(`✅ Checkout session created successfully:`, {
      sessionId: session.id,
      customerEmail: email.trim().toLowerCase(),
      url: session.url
    });

    // Return session info for redirect
    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('💥 Checkout API error:', {
      error: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid payment request',
        details: error.message
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment system authentication failed',
        details: 'Server configuration issue'
      });
    }

    if (error.type === 'StripePermissionError') {
      return res.status(500).json({ 
        error: 'Payment system permissions error',
        details: 'Server configuration issue'
      });
    }

    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({ 
        error: 'Too many requests',
        details: 'Please wait a moment and try again'
      });
    }

    // Generic error response
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
}