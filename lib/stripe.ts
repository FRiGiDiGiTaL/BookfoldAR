// lib/stripe.ts - Simplified for one-time payments only
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Single one-time payment price
export const BOOKFOLDAR_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1234567890'; // Your actual price ID

export const PLAN_DETAILS = {
  name: 'BookfoldAR Full Access',
  price: 24.99,
  description: 'One-time payment for lifetime access to all AR features'
} as const;

export async function createStripeCustomer(email: string): Promise<Stripe.Customer | null> {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        app: 'bookfoldar'
      }
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating/finding Stripe customer:', error);
    return null;
  }
}

// Fixed function signature to match the API route call
export async function createCheckoutSession({
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {}
}: {
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session | null> {
  try {
    // Get or create customer
    const customer = await createStripeCustomer(customerEmail);
    if (!customer) {
      throw new Error('Failed to create/find customer');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment
      line_items: [
        {
          price: BOOKFOLDAR_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        app: 'bookfoldar',
        customer_email: customerEmail,
        ...metadata
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          app: 'bookfoldar',
          customer_email: customerEmail,
          ...metadata
        }
      }
    });
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session | null> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return null;
  }
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    return null;
  }
}