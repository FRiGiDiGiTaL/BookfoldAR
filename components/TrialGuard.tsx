// components/TrialGuard.tsx - Complete trial management system
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface TrialStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  planType: string;
  trialActive: boolean;
  trialDaysRemaining: number;
}

interface TrialGuardProps {
  children: React.ReactNode;
  userEmail?: string;
}

export const TrialGuard: React.FC<TrialGuardProps> = ({ children, userEmail }) => {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState<string>('');

  const checkTrialStatus = async (email: string) => {
    try {
      console.log('🔍 Checking trial status for:', email);
      
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Trial status received:', data.status);
        return data.status;
      } else {
        console.error('❌ Failed to check trial status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking trial status:', error);
    }
    return null;
  };

  const getUserEmail = (): string | null => {
    // Priority order: prop > localStorage trial > localStorage subscription
    if (userEmail) return userEmail;
    
    // Check trial data
    const localTrialData = localStorage.getItem('bookfoldar_trial');
    if (localTrialData) {
      try {
        const trialData = JSON.parse(localTrialData);
        if (trialData.email) return trialData.email;
      } catch (e) {
        console.error('Invalid trial data in localStorage');
        localStorage.removeItem('bookfoldar_trial');
      }
    }

    // Check subscription data
    const localSubData = localStorage.getItem('bookfoldar_subscription');
    if (localSubData) {
      try {
        const subData = JSON.parse(localSubData);
        if (subData.email) return subData.email;
      } catch (e) {
        console.error('Invalid subscription data in localStorage');
        localStorage.removeItem('bookfoldar_subscription');
      }
    }

    return null;
  };

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      setError('');

      const emailToCheck = getUserEmail();

      if (!emailToCheck) {
        console.log('📧 No email found - redirecting to landing page');
        router.push('/');
        return;
      }

      console.log('🔐 Checking access for:', emailToCheck);
      
      const status = await checkTrialStatus(emailToCheck);
      
      if (!status) {
        setError('Unable to verify your account status. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      setTrialStatus(status);
      console.log('📊 Access Status:', {
        hasSubscription: status.hasActiveSubscription,
        trialActive: status.trialActive,
        daysRemaining: status.trialDaysRemaining
      });

      // Show warning if trial ending soon (3 days or less)
      if (status.trialActive && status.trialDaysRemaining <= 3 && status.trialDaysRemaining > 0) {
        setShowWarning(true);
        console.log('⚠️ Showing trial warning - days remaining:', status.trialDaysRemaining);
      }

      // Redirect to paywall if no access
      if (!status.hasActiveSubscription && !status.trialActive) {
        console.log('🚪 No active access - redirecting to paywall');
        setTimeout(() => {
          router.push('/paywall?expired=true');
        }, 1000); // Small delay to show the message
        return;
      }

      setLoading(false);
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      checkAccess();
    }
  }, [userEmail, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl mb-2">Verifying your access...</p>
          {trialStatus === null && (
            <p className="text-sm text-gray-400">Checking trial and subscription status</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
        <div className="text-white text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Connection Issue</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/paywall')}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors w-full"
            >
              Go to Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial expired - show message before redirect
  if (trialStatus && !trialStatus.hasActiveSubscription && !trialStatus.trialActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
        <div className="text-white text-center max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-4">Trial Expired</h2>
          <p className="text-gray-300 mb-6">
            Your 7-day free trial has ended. Upgrade now to continue using BookfoldAR's amazing AR features!
          </p>
          <button
            onClick={() => router.push('/paywall')}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            View Subscription Plans
          </button>
          <p className="text-xs text-gray-500 mt-4">Redirecting automatically...</p>
        </div>
      </div>
    );
  }

  // Trial warning banner component
  const TrialWarningBanner = () => {
    if (!showWarning || !trialStatus?.trialActive) return null;

    const isUrgent = trialStatus.trialDaysRemaining <= 1;
    const bgClass = isUrgent 
      ? "bg-gradient-to-r from-red-600 to-red-700" 
      : "bg-gradient-to-r from-yellow-600 to-orange-600";

    return (
      <div className={`fixed top-0 left-0 right-0 ${bgClass} text-white p-3 text-center z-50 shadow-lg animate-pulse`}>
        <div className="flex items-center justify-center space-x-4 flex-wrap">
          <span className="text-lg">{isUrgent ? '🚨' : '⚠️'}</span>
          <span className="font-medium">
            {isUrgent 
              ? `Trial expires in ${trialStatus.trialDaysRemaining} day${trialStatus.trialDaysRemaining !== 1 ? 's' : ''}!`
              : `${trialStatus.trialDaysRemaining} day${trialStatus.trialDaysRemaining !== 1 ? 's' : ''} left in your trial`
            }
          </span>
          <button
            onClick={() => router.push('/paywall')}
            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-semibold transition-colors"
          >
            {isUrgent ? 'Upgrade Now!' : 'View Plans'}
          </button>
          <button
            onClick={() => setShowWarning(false)}
            className="text-white/70 hover:text-white text-xl leading-none ml-2"
            title="Hide warning"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Status indicator for development/debugging
  const StatusIndicator = () => {
    if (!trialStatus || process.env.NODE_ENV === 'production') return null;

    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg z-40 max-w-sm">
        <div className="font-semibold mb-1">Debug Status:</div>
        <div>Trial Active: {trialStatus.trialActive ? '✅' : '❌'}</div>
        <div>Days Left: {trialStatus.trialDaysRemaining}</div>
        <div>Subscription: {trialStatus.hasActiveSubscription ? '✅' : '❌'}</div>
        <div>Plan: {trialStatus.planType || 'none'}</div>
      </div>
    );
  };

  // Render children with optional warning banner
  return (
    <>
      <TrialWarningBanner />
      <StatusIndicator />
      <div className={showWarning ? "pt-12" : ""}>
        {children}
      </div>
    </>
  );
};