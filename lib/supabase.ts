// lib/supabase.ts - Simplified for one-time payments only
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client for browser operations  
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified types for one-time payment system
export interface User {
  id: string;
  email: string;
  stripe_customer_id?: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
}

export interface StripeEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  created_at: string;
  processed_at?: string;
}

// Main function to check if user has paid for access
export async function checkUserAccess(email: string): Promise<boolean> {
  if (!email || !email.includes('@')) {
    console.log('Invalid email provided for access check');
    return false;
  }

  try {
    console.log(`Checking access for: ${email}`);

    // Look for any successful purchase by this email
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        id,
        status,
        users!inner(email)
      `)
      .eq('users.email', email.toLowerCase().trim())
      .eq('status', 'paid')
      .limit(1);

    if (error) {
      console.error('Database error checking user access:', error);
      return false;
    }

    const hasAccess = data && data.length > 0;
    console.log(`Access check result for ${email}: ${hasAccess}`);
    
    return hasAccess;

  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Helper function to create a new user
export async function createUser(email: string, stripeCustomerId?: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        stripe_customer_id: stripeCustomerId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}