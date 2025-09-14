// pages/paywall.tsx - Complete Payment Links with Trial Expiration Support
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function PaywallPage() {
  const router = useRouter();
  const { success, canceled, expired } = router.query;
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');

  const plans = {
    monthly: { 
      price: '$5.99', 
      period: 'per month', 
      savings: '',
      description: 'Full access to all AR features',
      paymentLink: 'https://buy.stripe.com/14A14mcn4bfLbRM7pqgbm00'
    },
    yearly: { 
      price: '$19.99', 
      period: 'per year', 
      savings: 'Save 67%',
      description: 'Best value - 2 months free',
      paymentLink: 'https://buy.stripe.com/7sY00i2MuerX094h00gbm01'
    },
    lifetime: { 
      price: '$59.99', 
      period: 'one-time', 
      savings: 'Best Deal',
      description: 'Pay once, use forever',
      paymentLink: 'https://buy.stripe.com/fZu9ASfzgabH2hc112gbm02'
    }
  };

  // Try to get user email from localStorage on component mount
  useEffect(() => {
    const getUserEmail = () => {
      // Check trial data first
      const trialData = localStorage.getItem('bookfoldar_trial');
      if (trialData) {
        try {
          const trial = JSON.parse(trialData);
          if (trial.email) return trial.email;
        } catch (e) {
          console.error('Invalid trial data in localStorage');
        }
      }

      // Check subscription data
      const subData = localStorage.getItem('bookfoldar_subscription');
      if (subData) {
        try {
          const sub = JSON.parse(subData);
          if (sub.email) return sub.email;
        } catch (e) {
          console.error('Invalid subscription data in localStorage');
        }
      }

      return '';
    };

    const userEmail = getUserEmail();
    if (userEmail) {
      setEmail(userEmail);
    }
  }, []);

  const handleSubscribe = () => {
    console.log('NEW PAYMENT LINKS VERSION RUNNING!');
    
    // Basic email validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Get the payment link for selected plan
    const selectedPaymentLink = plans[selectedPlan].paymentLink;

    // Add email as URL parameter to pre-fill Stripe checkout
    let paymentUrl = selectedPaymentLink;
    if (email.trim()) {
      const url = new URL(selectedPaymentLink);
      url.searchParams.set('prefilled_email', email.trim());
      paymentUrl = url.toString();
    }

    // Simply redirect to Stripe Payment Link
    window.location.href = paymentUrl;
  };

  // Handle success return from Stripe
  useEffect(() => {
    if (success) {
      // Store simple subscription data
      const subscriptionData = {
        plan: router.query.plan || selectedPlan,
        status: 'active',
        startDate: Date.now(),
        source: 'payment_link',
        email: email || 'unknown'
      };
      localStorage.setItem('bookfoldar_subscription', JSON.stringify(subscriptionData));
    }
  }, [success, router.query.plan, selectedPlan, email]);

  // Success state - payment completed
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="bg-green-700/10 border border-green-500/30 rounded-2xl p-8 max-w-md text-center backdrop-blur-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Welcome to BookfoldAR Pro!</h1>
          <p className="text-gray-200 mb-6">
            Your subscription is active. You now have full access to all AR features, voice control, and PDF import.
          </p>
          
          <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-300 space-y-1">
              <p>✅ Plan: {router.query.plan || 'BookfoldAR Pro'}</p>
              <p>✅ AR camera system unlocked</p>
              <p>✅ Voice control enabled</p>
              <p>✅ PDF pattern import ready</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/app")}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-semibold text-lg text-white transition-colors w-full"
          >
            Launch BookfoldAR Pro 🚀
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            🎯 Ready to create amazing book folding art!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-16 px-6">
      {/* Dynamic Header - Changes based on how user arrived */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          {expired ? "Trial Expired - Choose Your Plan" : "Choose Your Plan"}
        </h1>
        <p className="text-gray-300 text-lg">
          {expired 
            ? "Your 7-day free trial has ended. Upgrade now to continue using BookfoldAR's amazing features!"
            : "Unlock BookfoldAR Pro — AR precision guides, voice control, and PDF import."
          }
        </p>
        
        {/* Status messages */}
        {canceled && (
          <div className="mt-6 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-400 flex items-center justify-center">
            <span className="mr-2">❌</span>
            Payment was canceled - no charges were made
          </div>
        )}
        
        {expired && (
          <div className="mt-6 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg text-yellow-400 flex items-center justify-center">
            <span className="mr-2">⏰</span>
            Trial period has ended - upgrade to continue
          </div>
        )}
      </div>

      {/* Email input section */}
      <div className="max-w-md mx-auto mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
          {email && <span className="text-green-400 ml-2">✓ Found from your account</span>}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          placeholder="Enter your email address"
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will pre-fill your information in Stripe's secure checkout
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-md mx-auto mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      {/* Plan selection cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            onClick={() => setSelectedPlan(key as any)}
            className={`cursor-pointer bg-white/6 backdrop-blur-lg border-2 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl ${
              selectedPlan === key
                ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30'
                : 'border-white/12 hover:border-white/25'
            }`}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2 capitalize">
                BookfoldAR Pro — {key}
              </h2>
              
              <div className="text-4xl font-bold mb-1 text-blue-400">{plan.price}</div>
              <div className="text-gray-400 text-sm mb-4">{plan.period}</div>
              
              {plan.savings && (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                  key === 'yearly' ? 'bg-green-500/20 text-green-400 border border-green-400/30' : 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                }`}>
                  {plan.savings}
                </div>
              )}
              
              <p className="text-gray-300 text-sm mb-6">{plan.description}</p>

              {/* Feature list */}
              <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  AR precision folding camera
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Voice control navigation
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  PDF pattern import
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Grid alignment tools
                </li>
                {key !== 'monthly' && (
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Priority support
                  </li>
                )}
                {key === 'lifetime' && (
                  <li className="flex items-center">
                    <span className="text-purple-400 mr-2">✓</span>
                    All future updates included
                  </li>
                )}
              </ul>

              {selectedPlan === key && (
                <div className="text-blue-400 text-sm font-semibold bg-blue-500/10 rounded-lg p-2">
                  ✅ Selected Plan
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Subscribe button and info */}
      <div className="text-center max-w-2xl mx-auto">
        <button
          onClick={handleSubscribe}
          disabled={!email.trim()}
          className={`px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
            email.trim()
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-600 cursor-not-allowed text-gray-400'
          }`}
        >
          <span className="mr-2">🚀</span>
          Subscribe to {plans[selectedPlan].price} {selectedPlan}
        </button>
        
        <div className="mt-6 text-sm text-gray-400 space-y-2">
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">🔒</span>
            Secure payment via Stripe
          </p>
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">💳</span>
            Cancel anytime • No hidden fees
          </p>
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">⚡</span>
            Instant access after payment
          </p>
        </div>

        {/* How it works section */}
        <div className="mt-8 p-6 bg-blue-500/10 rounded-lg border border-blue-400/20 backdrop-blur-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-300">💡 How it works</h3>
          <div className="text-sm text-blue-200 space-y-2">
            <p>1. Click "Subscribe" to go to Stripe's secure checkout</p>
            <p>2. Complete payment with your preferred method</p>
            <p>3. Return here with instant access to all Pro features</p>
            <p>4. Start creating amazing book folding art immediately!</p>
          </div>
        </div>

        {/* Trial specific messaging */}
        {expired && (
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-400/20 backdrop-blur-lg">
            <p className="text-sm text-yellow-200">
              <span className="font-semibold">Thank you for trying BookfoldAR!</span><br />
              Your trial gave you a taste of our powerful AR features. 
              Upgrade now to continue your book folding journey.
            </p>
          </div>
        )}

        {/* Legal text */}
        <div className="mt-8 text-xs text-gray-500 space-y-1">
          <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
          <p>Subscriptions auto-renew unless canceled. Lifetime plans are one-time purchases.</p>
          <p>All payments processed securely by Stripe. No card details stored on our servers.</p>
        </div>
      </div>
    </main>
  );
}