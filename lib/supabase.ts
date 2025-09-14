// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for server-side operations (admin)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_used: boolean;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_price_id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  plan_type: 'monthly' | 'yearly' | 'lifetime';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface StripeEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processed_at?: string;
  created_at: string;
  api_version?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UserSubscriptionStatus {
  has_active_subscription: boolean;
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'none' | 'error';
  plan_type: 'pro' | 'premium' | 'none';
  trial_active: boolean;
  trial_days_remaining: number;
}

// Stripe Events / Idempotency Functions
export async function recordStripeEvent(
  stripeEventId: string,
  eventType: string,
  data?: Record<string, any>,
  apiVersion?: string
): Promise<boolean> {
  try {
    console.log(`Recording Stripe event: ${stripeEventId} (${eventType})`);
    
    const { data: result, error } = await supabaseAdmin
      .from('stripe_events')
      .insert({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        data,
        api_version: apiVersion,
        processed: false
      })
      .select()
      .single();

    if (error) {
      // If it's a unique constraint violation, the event already exists
      if (error.code === '23505') {
        console.log(`Stripe event ${stripeEventId} already recorded`);
        return false; // Event already exists
      }
      console.error('Error recording Stripe event:', error);
      return false;
    }

    console.log(`Successfully recorded event: ${stripeEventId}`);
    return true; // New event, proceed with processing
  } catch (error) {
    console.error('Error recording Stripe event:', error);
    return false;
  }
}

export async function markEventProcessed(stripeEventId: string): Promise<boolean> {
  try {
    console.log(`Marking event as processed: ${stripeEventId}`);
    
    const { error } = await supabaseAdmin
      .from('stripe_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', stripeEventId);

    if (error) {
      console.error('Error marking event as processed:', error);
      return false;
    }

    console.log(`Successfully marked event as processed: ${stripeEventId}`);
    return true;
  } catch (error) {
    console.error('Error marking event as processed:', error);
    return false;
  }
}

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  try {
    console.log(`Checking if event is processed: ${stripeEventId}`);
    
    const { data, error } = await supabaseAdmin
      .from('stripe_events')
      .select('processed')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error) {
      // If event not found, it hasn't been processed
      if (error.code === 'PGRST116') {
        console.log(`Event ${stripeEventId} not found in database`);
        return false;
      }
      console.error('Error checking if event is processed:', error);
      return false;
    }

    const isProcessed = data?.processed === true;
    console.log(`Event ${stripeEventId} processed status: ${isProcessed}`);
    return isProcessed;
  } catch (error) {
    console.error('Error checking if event is processed:', error);
    return false;
  }
}

// User Management Functions
export async function getUserSubscriptionStatus(email: string): Promise<UserSubscriptionStatus | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_user_subscription_status', {
      user_email: email
    });

    if (error) {
      console.error('Error getting user subscription status:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error calling get_user_subscription_status:', error);
    return null;
  }
}

export async function upsertUser(email: string, stripeCustomerId?: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('upsert_user', {
      user_email: email,
      stripe_customer_id: stripeCustomerId
    });

    if (error) {
      console.error('Error upserting user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error calling upsert_user:', error);
    return null;
  }
}

export async function startTrial(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('start_trial', {
      user_email: email
    });

    if (error) {
      console.error('Error starting trial:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error calling start_trial:', error);
    return false;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error getting user by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function getUserByStripeCustomerId(customerId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error) {
      console.error('Error getting user by stripe customer ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by stripe customer ID:', error);
    return null;
  }
}

// Subscription Management Functions
export async function createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
  try {
    console.log('Creating subscription:', subscription);
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    console.log('Successfully created subscription:', data.id);
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

export async function updateSubscription(
  stripeSubscriptionId: string, 
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  try {
    console.log(`Updating subscription: ${stripeSubscriptionId}`, updates);
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updates)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return null;
    }

    console.log('Successfully updated subscription:', data.id);
    return data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return null;
  }
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (error) {
      console.error('Error getting subscription by Stripe ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting subscription by Stripe ID:', error);
    return null;
  }
}

// Payment Management Functions
export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> {
  try {
    console.log('Creating payment record:', payment.stripe_payment_intent_id);
    
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert(payment)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      return null;
    }

    console.log('Successfully created payment record:', data.id);
    return data;
  } catch (error) {
    console.error('Error creating payment record:', error);
    return null;
  }
}

export async function updatePayment(
  paymentIntentId: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(updates)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating payment:', error);
    return null;
  }
}