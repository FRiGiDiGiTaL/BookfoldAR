// pages/paywall.tsx - Fixed for $24.99 one-time payment
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function PaywallPage() {
  const router = useRouter();
  const { success, canceled, expired, session_id } = router.query;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Single plan - $24.99 one-time payment
  const plan = {
    name: 'BookfoldAR Pro',
    price: '$24.99',
    period: 'one-time payment',
    description: 'Lifetime access to all AR features',
    features: [
      'AR precision folding camera',
      'Voice control navigation', 
      'PDF pattern import',
      'Grid alignment tools',
      'Particle effects & animations',
      'All future updates included'
    ]
  };

  // Get user email from localStorage
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

  // Handle successful payment return
  useEffect(() => {
    if (success && session_id) {
      verifyPaymentSuccess(session_id as string);
    }
  }, [success, session_id]);

  const verifyPaymentSuccess = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
      const data = await response.json();

      if (data.paid) {
        // Store subscription data in localStorage
        const subscriptionData = {
          plan: 'lifetime',
          status: 'active',
          active: true,
          startDate: Date.now(),
          source: 'stripe_checkout',
          email: data.session?.customer_email || email,
          paidViaStripe: true,
          sessionId: sessionId
        };
        
        localStorage.setItem('bookfoldar_subscription', JSON.stringify(subscriptionData));
        
        // Clear trial data since user now has full access
        localStorage.removeItem('bookfoldar_trial');
        
        console.log('✅ Payment verified and access granted');
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
      setError('Payment verification failed. Please contact support.');
    }
  };

  const handleSubscribe = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          successUrl: `${window.location.origin}/paywall?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/paywall?canceled=true`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state - payment completed
  if (success && !error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="bg-green-700/10 border border-green-500/30 rounded-2xl p-8 max-w-md text-center backdrop-blur-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Welcome to BookfoldAR Pro!</h1>
          <p className="text-gray-200 mb-6">
            Your one-time payment is complete! You now have lifetime access to all AR features.
          </p>
          
          <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-300 space-y-1">
              <p>✅ Plan: BookfoldAR Pro (Lifetime)</p>
              <p>✅ AR camera system unlocked</p>
              <p>✅ Voice control enabled</p>
              <p>✅ PDF pattern import ready</p>
              <p>✅ All future updates included</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/app")}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-semibold text-lg text-white transition-colors w-full mb-4"
          >
            Launch BookfoldAR Pro 🚀
          </button>
          
          <p className="text-xs text-gray-400">
            🎯 Ready to create amazing book folding art!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-16 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">
          {expired ? "Trial Expired - Upgrade to Pro" : "Upgrade to BookfoldAR Pro"}
        </h1>
        <p className="text-gray-300 text-lg">
          {expired 
            ? "Your 7-day free trial has ended. Get lifetime access with a one-time payment!"
            : "Unlock all AR features with lifetime access — no monthly fees!"
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

      {/* Email input */}
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
          This will be used for your BookfoldAR account and receipts
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-md mx-auto mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      {/* Single plan card */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-white/6 backdrop-blur-lg border-2 border-blue-500 bg-blue-500/20 rounded-2xl p-8 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <div className="text-5xl font-bold mb-2 text-blue-400">{plan.price}</div>
            <div className="text-gray-400 text-sm mb-4">{plan.period}</div>
            
            <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-purple-500/20 text-purple-400 border border-purple-400/30">
              🎉 Limited Time - Pay Once, Use Forever
            </div>
            
            <p className="text-gray-300 text-sm mb-6">{plan.description}</p>
          </div>

          {/* Features list */}
          <ul className="text-sm text-gray-300 space-y-3 mb-8">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-400 mr-3 text-lg">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            disabled={!email.trim() || loading}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              email.trim() && !loading
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-600 cursor-not-allowed text-gray-400'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block mr-2"></div>
                Creating checkout...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Get Lifetime Access - {plan.price}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment info */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-6 text-sm text-gray-400 space-y-2">
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">🔒</span>
            Secure payment via Stripe
          </p>
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">💳</span>
            One-time payment • No subscriptions • No hidden fees
          </p>
          <p className="flex items-center justify-center">
            <span className="text-green-400 mr-2">⚡</span>
            Instant access after payment
          </p>
        </div>

        {/* How it works */}
        <div className="p-6 bg-blue-500/10 rounded-lg border border-blue-400/20 backdrop-blur-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-300">💡 How it works</h3>
          <div className="text-sm text-blue-200 space-y-2">
            <p>1. Click "Get Lifetime Access" to go to Stripe's secure checkout</p>
            <p>2. Complete your one-time ${plan.price.replace('$', '')} payment</p>
            <p>3. Return here with instant lifetime access</p>
            <p>4. Start creating amazing book folding art immediately!</p>
          </div>
        </div>

        {/* Trial messaging */}
        {expired && (
          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-400/20 backdrop-blur-lg mb-6">
            <p className="text-sm text-yellow-200">
              <span className="font-semibold">Thank you for trying BookfoldAR!</span><br />
              Your trial showed you our powerful AR features. 
              Get lifetime access now with no monthly fees!
            </p>
          </div>
        )}

        {/* Legal text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>By purchasing, you agree to our Terms of Service and Privacy Policy.</p>
          <p>One-time payment for lifetime access. No recurring charges.</p>
          <p>All payments processed securely by Stripe. No card details stored on our servers.</p>
        </div>
      </div>
    </main>
  );
}