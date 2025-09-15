// lib/supabase.ts - Simplified version for one-time payments
import { createClient } from '@supabase/supabase-js';

// Only initialize if environment variables are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for server-side operations (optional)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Simple types for one-time payment system
export interface Purchase {
  id: string;
  email: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
}

// Simple function to check if user has paid (for future use)
export async function checkUserAccess(email: string): Promise<boolean> {
  if (!supabaseAdmin || !email || !email.includes('@')) {
    console.log('Supabase not configured or invalid email, using localStorage only');
    return false;
  }

  try {
    console.log(`Checking database access for: ${email}`);

    const { data, error } = await supabaseAdmin
      .from('purchases')
      .select('status')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'paid')
      .limit(1);

    if (error) {
      console.error('Database error checking user access:', error);
      return false;
    }

    const hasAccess = data && data.length > 0;
    console.log(`Database access check result for ${email}: ${hasAccess}`);
    
    return hasAccess;

  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

// Function to record a purchase (for webhook use)
export async function recordPurchase(purchaseData: Omit<Purchase, 'id' | 'created_at'>): Promise<boolean> {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, cannot record purchase');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .insert({
        ...purchaseData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording purchase:', error);
      return false;
    }

    console.log('✅ Purchase recorded:', data.id);
    return true;

  } catch (error) {
    console.error('Error recording purchase:', error);
    return false;
  }
}

// Database schema for reference (SQL):
/*
CREATE TABLE purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_purchases_email_status ON purchases(email, status);
*/