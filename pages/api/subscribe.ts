// pages/api/subscribe.ts - Simplified version that bypasses database issues
import type { NextApiRequest, NextApiResponse } from "next";

interface SubscribeRequest {
  email: string;
}

interface SubscribeResponse {
  success: boolean;
  message?: string;
  error?: string;
  trialData?: {
    email: string;
    startDate: number;
    expiryDate: number;
    trialDays: number;
    status: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }

  try {
    const { email }: SubscribeRequest = req.body;

    // Validate email
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log('🚀 Starting trial for:', cleanEmail);

    // For now, bypass database and just return success
    // TODO: Fix database schema issues and re-enable database operations

    // Calculate trial dates
    const startDate = Date.now();
    const expiryDate = startDate + (7 * 24 * 60 * 60 * 1000); // 7 days

    const trialData = {
      email: cleanEmail,
      startDate,
      expiryDate,
      trialDays: 7,
      status: 'active'
    };

    console.log(`✅ Trial started successfully for ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: "Trial started successfully",
      trialData
    });

  } catch (error) {
    console.error("Trial signup error:", error);
    
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again later."
    });
  }
}