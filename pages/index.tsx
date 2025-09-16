// pages/index.tsx - Fixed payment handling
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

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

export default function LandingPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<"loading" | "new" | "trial" | "expired" | "paid">("loading");
  const [isClient, setIsClient] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getTrialData = (): TrialData | null => {
    try {
      const trial = localStorage.getItem("bookfoldar_trial");
      return trial ? JSON.parse(trial) : null;
    } catch (error) {
      console.error("Error parsing trial data:", error);
      localStorage.removeItem("bookfoldar_trial");
      return null;
    }
  };

  const getSubscriptionData = (): SubscriptionData | null => {
    try {
      const subscription = localStorage.getItem("bookfoldar_subscription");
      return subscription ? JSON.parse(subscription) : null;
    } catch (error) {
      console.error("Error parsing subscription data:", error);
      localStorage.removeItem("bookfoldar_subscription");
      return null;
    }
  };

  const calculateTrialDaysRemaining = (trialData: TrialData): number => {
    const remaining = Math.ceil((trialData.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const isTrialActive = (trialData: TrialData): boolean => {
    return Date.now() < trialData.expiryDate && trialData.status === 'active';
  };

  const checkUserAccess = async () => {
    console.log('🔍 Checking user access on landing page...');

    // First check for paid subscription (highest priority)
    const subscriptionData = getSubscriptionData();
    if (subscriptionData && subscriptionData.active && subscriptionData.email) {
      console.log('✅ Found active subscription for:', subscriptionData.email);
      setUserEmail(subscriptionData.email);
      setUserStatus("paid");
      return;
    }

    // Then check trial status
    const trialData = getTrialData();
    if (trialData) {
      setUserEmail(trialData.email);
      const daysRemaining = calculateTrialDaysRemaining(trialData);
      setTrialDaysRemaining(daysRemaining);

      if (isTrialActive(trialData)) {
        console.log(`✅ Found active trial for ${trialData.email}, ${daysRemaining} days remaining`);
        setUserStatus("trial");
      } else {
        console.log('❌ Trial expired for:', trialData.email);
        setUserStatus("expired");
      }
    } else {
      console.log('👤 New user, no trial or subscription found');
      setUserStatus("new");
    }
  };

  useEffect(() => {
    if (isClient) {
      checkUserAccess();
      
      // Check for successful payment return
      if (router.query.success === 'true') {
        console.log('🎉 Payment success detected, rechecking access');
        setTimeout(() => checkUserAccess(), 2000);
      }
      
      // Check for payment cancellation
      if (router.query.cancelled === 'true') {
        setPaymentError('Payment was cancelled. No charges were made.');
        setTimeout(() => setPaymentError(''), 5000);
      }
    }
  }, [isClient, router.query.success, router.query.cancelled]);

  const startTrial = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsStartingTrial(true);
    setPaymentError('');

    try {
      // Create trial data
      const startDate = Date.now();
      const expiryDate = startDate + (3 * 24 * 60 * 60 * 1000); // 3 days
      
      const trialData: TrialData = {
        email: email.trim().toLowerCase(),
        startDate,
        expiryDate,
        status: 'active'
      };

      // Store trial data locally
      localStorage.setItem('bookfoldar_trial', JSON.stringify(trialData));
      localStorage.setItem('userEmail', email.trim().toLowerCase());

      console.log('✅ Trial started for:', email.trim().toLowerCase());

      // Update state
      setUserEmail(email.trim().toLowerCase());
      setUserStatus("trial");
      setTrialDaysRemaining(3);

    } catch (error) {
      console.error('Error starting trial:', error);
      alert('Failed to start trial. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handlePayment = async () => {
    const userEmailToUse = userEmail || email.trim().toLowerCase();
    
    if (!userEmailToUse) {
      setPaymentError('Please enter your email address');
      return;
    }

    if (!userEmailToUse.includes('@')) {
      setPaymentError('Please enter a valid email address');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      console.log('💳 Creating checkout session for:', userEmailToUse);

      // Create absolute URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/?success=true`;
      const cancelUrl = `${baseUrl}/?cancelled=true`;

      console.log('Using URLs:', { successUrl, cancelUrl });

      // Create checkout session for $24.99 one-time payment
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmailToUse,
          successUrl,
          cancelUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.url) {
        throw new Error('No checkout URL received from server');
      }

      // Store email for later verification
      localStorage.setItem('userEmail', userEmailToUse);
      
      console.log('✅ Checkout session created, redirecting to:', data.url);

      // Direct redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAccessApp = () => {
    router.push("/app");
  };

  const renderMainSection = () => {
    if (!isClient || userStatus === "loading") {
      return (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto border border-white/20 mb-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-300/20 rounded w-3/4 mb-4"></div>
            <div className="h-12 bg-gray-300/20 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-300/20 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (userStatus === "paid") {
      return (
        <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto border border-green-400/30 mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-green-300">
            🎉 Welcome Back!
          </h3>
          <p className="text-sm text-gray-200 mb-4">
            You have full access to BookfoldAR. Ready to create amazing book art?
          </p>
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-400/20">
            <p className="text-xs text-green-200">
              ✅ Account: {userEmail}<br />
              ✅ Full lifetime access unlocked<br />
              ✅ All AR features available
            </p>
          </div>
          <button
            onClick={handleAccessApp}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            🚀 Launch BookfoldAR
          </button>
        </div>
      );
    }

    if (userStatus === "trial") {
      return (
        <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto border border-blue-400/30 mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-blue-300">
            ✨ Trial Active
          </h3>
          <p className="text-sm text-gray-200 mb-4">
            You have <span className="font-bold text-blue-300">{trialDaysRemaining} days remaining</span> in your free trial.
          </p>
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/20">
            <p className="text-xs text-blue-200">
              ✅ Trial for: {userEmail}<br />
              ✅ Full access to all AR features<br />
              ✅ No credit card required
            </p>
          </div>
          {paymentError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm">
              {paymentError}
            </div>
          )}
          <button
            onClick={handleAccessApp}
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors mb-3"
          >
            📱 Continue Using BookfoldAR
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-4 py-2 rounded text-white text-sm transition-colors"
          >
            {isProcessingPayment ? 'Creating checkout session...' : 'Upgrade Now - $24.99 (Lifetime)'}
          </button>
        </div>
      );
    }

    if (userStatus === "expired") {
      return (
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto border border-red-400/30 mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-red-300">
            ⏰ Trial Expired
          </h3>
          <p className="text-sm text-gray-200 mb-4">
            Your 3-day trial has ended. Upgrade to continue using BookfoldAR's amazing AR features!
          </p>
          <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-400/20">
            <p className="text-xs text-red-200">
              📧 Account: {userEmail}<br />
              ⏰ Trial ended<br />
              💎 One-time payment for lifetime access
            </p>
          </div>
          {paymentError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm">
              {paymentError}
            </div>
          )}
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            {isProcessingPayment ? 'Creating checkout session...' : '💎 Get Lifetime Access - $24.99'}
          </button>
        </div>
      );
    }

    // New user - show trial signup
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-lg mx-auto border border-white/20 mb-8">
        <h3 className="text-2xl font-semibold mb-4">
          🚀 Start Your 3-Day Free Trial
        </h3>
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-400">3 Days Free</span>
          <span className="block text-gray-400 mt-1">Then $24.99 lifetime</span>
        </div>
        <p className="text-sm text-gray-200 mb-6">
          Full access to all AR features during your trial. No credit card required to start!
        </p>
        
        {paymentError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm">
            {paymentError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isStartingTrial}
            />
          </div>
          
          <button
            onClick={startTrial}
            disabled={isStartingTrial || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold text-white transition-colors"
          >
            {isStartingTrial ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Trial...
              </span>
            ) : (
              '🎯 Start 3-Day Free Trial'
            )}
          </button>
          
          <p className="text-xs text-gray-400 text-center">
            No credit card required. Cancel anytime during trial.
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
          <h4 className="font-semibold text-blue-300 mb-2">What You Get:</h4>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>✅ AR camera with real-time overlay</li>
            <li>✅ Voice control navigation</li>
            <li>✅ PDF import capabilities</li>
            <li>✅ Advanced mark navigation</li>
            <li>✅ Lifetime access after trial</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-600 to-purple-700 px-4">
        <h1 className="text-5xl font-bold mb-4">📚 BookfoldAR</h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-100 mb-8">
          Precision book folding with augmented reality assistance. Transform any book into stunning art with AR guidance.
        </p>
        {renderMainSection()}
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 space-y-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-3">AR Camera Overlay</h3>
            <p className="text-gray-300">
              Real-time augmented reality guidance shows exactly where to fold your book pages with precision accuracy.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-bold mb-3">Voice Control</h3>
            <p className="text-gray-300">
              Navigate hands-free with voice commands while your hands stay focused on folding.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-3">PDF Import</h3>
            <p className="text-gray-300">
              Import folding patterns directly from PDF files with automatic measurement extraction.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Why BookfoldAR?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">✨ Professional Results</h3>
              <p className="text-gray-300 mb-4">
                Get museum-quality book art with precise measurements and AR-guided folding that ensures perfect alignment every time.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-green-300">⚡ Save Time</h3>
              <p className="text-gray-300 mb-4">
                Complete projects 3x faster with AR overlay eliminating measurement errors and providing visual guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 py-8 px-4 text-center text-gray-400">
        <p>&copy; 2025 BookfoldAR. Transform your book folding with AR precision.</p>
      </footer>
    </div>
  );
}