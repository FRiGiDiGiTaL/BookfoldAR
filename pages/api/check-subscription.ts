// pages/api/check-subscription.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase";

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
        subscriptionStatus: "none",
        planType: "none",
        trialActive: false,
        trialDaysRemaining: 0,
      },
    });
  }

  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        status: {
          hasActiveSubscription: false,
          subscriptionStatus: "none",
          planType: "none",
          trialActive: false,
          trialDaysRemaining: 0,
        },
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 🔹 Check user access via Supabase function
    const { data, error } = await supabaseAdmin.rpc("check_user_access", {
      user_email: cleanEmail,
    });

    if (error) {
      console.error("Supabase check_user_access error:", error);
      throw new Error("Database check failed");
    }

    // If no user exists, start a trial automatically
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log(`No user found for ${cleanEmail}, starting trial...`);
      await supabaseAdmin.rpc("start_user_trial", { user_email: cleanEmail });

      return res.status(200).json({
        success: true,
        status: {
          hasActiveSubscription: false,
          subscriptionStatus: "trial",
          planType: "trial",
          trialActive: true,
          trialDaysRemaining: 3, // default trial length
        },
      });
    }

    // Format response from Supabase
    const accessRecord = Array.isArray(data) ? data[0] : data;

    let responseStatus: CheckSubscriptionResponse["status"] = {
      hasActiveSubscription: false,
      subscriptionStatus: "none",
      planType: "none",
      trialActive: false,
      trialDaysRemaining: 0,
    };

    if (accessRecord.access_type === "lifetime") {
      responseStatus = {
        hasActiveSubscription: true,
        subscriptionStatus: "active",
        planType: "lifetime",
        trialActive: false,
        trialDaysRemaining: 0,
      };
    } else if (accessRecord.access_type === "trial" && accessRecord.trial_days_remaining > 0) {
      responseStatus = {
        hasActiveSubscription: false,
        subscriptionStatus: "trial",
        planType: "trial",
        trialActive: true,
        trialDaysRemaining: accessRecord.trial_days_remaining,
      };
    } else if (accessRecord.access_type === "expired") {
      responseStatus = {
        hasActiveSubscription: false,
        subscriptionStatus: "expired",
        planType: "none",
        trialActive: false,
        trialDaysRemaining: 0,
      };
    }

    return res.status(200).json({
      success: true,
      status: responseStatus,
    });
  } catch (error) {
    console.error("Check subscription error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      status: {
        hasActiveSubscription: false,
        subscriptionStatus: "error",
        planType: "none",
        trialActive: false,
        trialDaysRemaining: 0,
      },
    });
  }
}
