// pages/app.tsx - Fixed layout to prevent banner from breaking the side-by-side design
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Head from "next/head";

// Import the main App component from MainApp.tsx in the root directory
const MainApp = dynamic(() => import("../MainApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl">Loading BookfoldAR...</p>
      </div>
    </div>
  )
});

interface TrialData {
  email: string;
  startDate: number;
  expiryDate: number;
  status: 'active' | 'expired';
}

interface SubscriptionData {
  active: boolean;
  plan: string;
  email: string;
}

export default function AppPage() {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'trial' | 'denied'>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

  const checkAccess = async () => {
    try {
      console.log('🔍 Checking user access...');
      
      // Check for paid subscription first (highest priority)
      const subscriptionData = localStorage.getItem('bookfoldar_subscription');
      if (subscriptionData) {
        try {
          const subData: SubscriptionData = JSON.parse(subscriptionData);
          if (subData.active && subData.email) {
            console.log('✅ Found active subscription for:', subData.email);
            setUserEmail(subData.email);
            setAccessStatus('granted');
            return;
          }
        } catch (e) {
          console.error('Invalid subscription data, removing');
          localStorage.removeItem('bookfoldar_subscription');
        }
      }

      // Check for active trial (secondary priority)
      const trialData = localStorage.getItem('bookfoldar_trial');
      if (trialData) {
        try {
          const trial: TrialData = JSON.parse(trialData);
          const daysRemaining = Math.ceil((trial.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0 && trial.status === 'active') {
            console.log(`✅ Found active trial for ${trial.email}, ${daysRemaining} days remaining`);
            setUserEmail(trial.email);
            setTrialDaysRemaining(Math.max(0, daysRemaining));
            setAccessStatus('trial');
            return;
          } else {
            console.log('❌ Trial expired, removing data');
            localStorage.removeItem('bookfoldar_trial');
          }
        } catch (e) {
          console.error('Invalid trial data, removing');
          localStorage.removeItem('bookfoldar_trial');
        }
      }

      // No valid access found
      console.log('❌ No valid access found, redirecting to home');
      setAccessStatus('denied');
      setTimeout(() => {
        router.push('/?expired=true');
      }, 2000);

    } catch (error) {
      console.error('Error checking access:', error);
      setAccessStatus('denied');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAccess();
      
      // Check for successful payment return
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        console.log('🎉 Payment success detected, rechecking access');
        setTimeout(checkAccess, 2000); // Give webhook time to process
      }
    }
  }, [router]);

  // Loading state
  if (accessStatus === 'loading') {
    return (
      <>
        <Head>
          <title>BookfoldAR - Loading...</title>
          <meta name="description" content="Loading BookfoldAR application" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl mb-2">Verifying your access...</p>
            <p className="text-sm text-gray-400">Checking trial and subscription status</p>
          </div>
        </div>
      </>
    );
  }

  // Access denied - show message before redirect
  if (accessStatus === 'denied') {
    return (
      <>
        <Head>
          <title>BookfoldAR - Access Required</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
          <div className="text-white text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Access Required</h2>
            <p className="text-gray-300 mb-6">
              You need an active trial or subscription to access BookfoldAR. 
              Start your free trial to begin!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </button>
            <p className="text-xs text-gray-500 mt-4">Redirecting automatically...</p>
          </div>
        </div>
      </>
    );
  }

  // Trial warning banner removed to fix layout issues

  // Access granted - render the main app with proper layout container
  return (
    <>
      <Head>
        <title>BookfoldAR - AR Book Folding Assistant</title>
        <meta name="description" content="Precision book folding with augmented reality assistance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainApp />

      {/* Status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg z-40 max-w-sm">
          <div className="font-semibold mb-1">Access Status:</div>
          <div>Status: {accessStatus}</div>
          <div>Email: {userEmail || 'none'}</div>
          {accessStatus === 'trial' && <div>Days Left: {trialDaysRemaining}</div>}
        </div>
      )}
    </>
  );
}