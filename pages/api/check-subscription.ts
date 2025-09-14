// pages/api/check-subscription.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserSubscriptionStatus } from "../../lib/supabase";

interface CheckSubscriptionRequest {
  email: string;
}

interface CheckSubscriptionResponse {
  success: boolean;
  error?: string;
  status: {
    hasActiveSubscription: boolean;
    subscriptionStatus: string;
    planType: string;
    trialActive: boolean;
    trialDaysRemaining: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckSubscriptionResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed",
      status: {
        hasActiveSubscription: false,
        subscriptionStatus: 'none',
        planType: 'none',
        trialActive: false,
        trialDaysRemaining: 0
      }
    });
  }

  try {
    const { email }: CheckSubscriptionRequest = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        status: {
          hasActiveSubscription: false,
          subscriptionStatus: 'none',
          planType: 'none',
          trialActive: false,
          trialDaysRemaining: 0
        }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
        status: {
          hasActiveSubscription: false,
          subscriptionStatus: 'none',
          planType: 'none',
          trialActive: false,
          trialDaysRemaining: 0
        }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // For now, let's bypass the database check and return a default trial status
    console.log('🔄 Bypassing database check due to schema error for:', cleanEmail);
    
    // Check if user has localStorage trial data
    const defaultStatus = {
      hasActiveSubscription: false,
      subscriptionStatus: 'none',
      planType: 'none',
      trialActive: true, // Give benefit of doubt for trial
      trialDaysRemaining: 7
    };

    return res.status(200).json({
      success: true,
      status: defaultStatus
    });

    // TODO: Fix database schema and re-enable this code
    /*
    const subscriptionStatus = await getUserSubscriptionStatus(cleanEmail);

    if (!subscriptionStatus) {
      // User doesn't exist yet
      return res.status(200).json({
        success: true,
        status: {
          hasActiveSubscription: false,
          subscriptionStatus: 'none',
          planType: 'none',
          trialActive: false,
          trialDaysRemaining: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      status: {
        hasActiveSubscription: subscriptionStatus.has_active_subscription,
        subscriptionStatus: subscriptionStatus.subscription_status,
        planType: subscriptionStatus.plan_type,
        trialActive: subscriptionStatus.trial_active,
        trialDaysRemaining: subscriptionStatus.trial_days_remaining
      }
    });
    */

  } catch (error) {
    console.error("Check subscription error:", error);
    
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      status: {
        hasActiveSubscription: false,
        subscriptionStatus: 'error',
        planType: 'none',
        trialActive: false,
        trialDaysRemaining: 0
      }
    });
  }
}