// components/PaywallModal.tsx - Updated for Payment Links
import React, { useState } from 'react';

interface PaywallModalProps {
  onSubscribe: () => void;
  userEmail?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onSubscribe, userEmail }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [email, setEmail] = useState(userEmail || '');
  const [error, setError] = useState<string>('');

  const plans = {
    monthly: { 
      price: '$5.99', 
      period: 'per month', 
      savings: '',
      description: 'Full access to all AR features',
      // 👇 Replace these with your actual Stripe Payment Links
      paymentLink: 'https://buy.stripe.com/14A14mcn4bfLbRM7pqgbm00'
    },
    yearly: { 
      price: '$19.99', 
      period: 'per year', 
      savings: 'Save 67%',
      description: 'Best value - 2 months free',
      // 👇 Replace these with your actual Stripe Payment Links
      paymentLink: 'https://buy.stripe.com/7sY00i2MuerX094h00gbm01'
    },
    lifetime: { 
      price: '$59.99', 
      period: 'one-time', 
      savings: 'Best Deal',
      description: 'Pay once, use forever',
      // 👇 Replace these with your actual Stripe Payment Links
      paymentLink: 'https://buy.stripe.com/fZu9ASfzgabH2hc112gbm02'
    }
  };

  const handleSubscribe = () => {
    // Basic email validation (optional since Stripe will also validate)
    if (!userEmail && !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!userEmail && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    // Get the payment link for selected plan
    const selectedPaymentLink = plans[selectedPlan].paymentLink;
    const userEmailToUse = userEmail || email.trim();

    // Add email as URL parameter to pre-fill Stripe checkout
    let paymentUrl = selectedPaymentLink;
    if (userEmailToUse) {
      const url = new URL(selectedPaymentLink);
      url.searchParams.set('prefilled_email', userEmailToUse);
      paymentUrl = url.toString();
    }

    // Simply redirect to Stripe Payment Link
    window.location.href = paymentUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card p-8 rounded-xl max-w-4xl w-full text-white max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">🚀 Continue Your BookfoldAR Journey</h2>
          <p className="text-gray-300">
            Your trial has ended. Choose a plan to keep using all the amazing AR features!
          </p>
        </div>

        {/* Email input if not provided */}
        {!userEmail && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address (will pre-fill Stripe checkout)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(''); // Clear error when user types
              }}
              placeholder="Enter your email address"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>
        )}

        {/* Plan selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              onClick={() => setSelectedPlan(key as any)}
              className={`cursor-pointer p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedPlan === key
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : 'border-gray-600 hover:border-gray-400 bg-white/5'
              }`}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 capitalize">{key}</h3>
                <div className="text-3xl font-bold text-blue-400 mb-1">{plan.price}</div>
                <div className="text-gray-400 text-sm mb-3">{plan.period}</div>
                
                {plan.savings && (
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                    key === 'yearly' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {plan.savings}
                  </div>
                )}
                
                <p className="text-gray-300 text-sm">{plan.description}</p>
                
                {selectedPlan === key && (
                  <div className="mt-3 text-blue-400 text-sm font-semibold">
                    ✅ Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold mb-4 text-center">✨ What's Included</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              Complete AR camera system
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              Voice control navigation
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              PDF pattern import
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              Precision mark overlay
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              Grid alignment tools
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              All future updates
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <button
            onClick={handleSubscribe}
            className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center min-w-[200px] justify-center"
          >
            <span className="mr-2">🚀</span>
            Subscribe {plans[selectedPlan].price}
          </button>
          
          <div className="text-center text-sm text-gray-400">
            <p className="mb-1">✅ Secure payment via Stripe</p>
            <p>✅ Cancel anytime • ✅ No hidden fees</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
          <p className="text-xs text-blue-300 text-center">
            💡 <strong>How it works:</strong> Click "Subscribe" to go to Stripe's secure checkout. 
            After payment, you can return to this page and refresh to continue using BookfoldAR.
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
          <p className="mt-1">Your subscription will auto-renew unless canceled.</p>
        </div>
      </div>
    </div>
  );
};