// app/api/create-checkout/route.ts - Fixed for one-time payments
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { email, successUrl, cancelUrl } = await req.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Validate URLs
    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Success and cancel URLs required' }, { status: 400 });
    }

    console.log(`Creating checkout session for: ${email}`);

    // Create checkout session with correct parameter name
    const session = await createCheckoutSession({
      customerEmail: email.trim().toLowerCase(), // Fixed: was customerId, now customerEmail
      successUrl,
      cancelUrl,
      metadata: {
        source: 'webapp_checkout'
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    console.log(`Checkout session created: ${session.id}`);

    // Return session info for redirect
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}