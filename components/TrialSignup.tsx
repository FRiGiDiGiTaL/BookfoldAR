// components/TrialSignup.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export const TrialSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        // Store trial info locally with more robust data
        const trialData = {
          email: email.trim(),
          startDate: Date.now(),
          expiryDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          trialDays: 7,
          status: 'active'
        };
        
        localStorage.setItem('bookfoldar_trial', JSON.stringify(trialData));
        
        // Show success state briefly before redirect
        setSuccess(true);
        
        // Delay redirect for better UX
        setTimeout(() => {
          router.push('/app');
        }, 1500);
        
      } else {
        // Handle different error responses
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Please enter a valid email address');
      }
    } catch (err) {
      console.error('Trial signup error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state - show confirmation before redirect
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-xl font-semibold text-green-400 mb-2">Welcome to BookfoldAR!</p>
        <p className="text-sm text-gray-300 mb-4">Your 7-day trial has started successfully</p>
        
        <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
          <div className="flex items-center justify-center mb-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-400 border-t-transparent mr-3"></div>
            <span className="text-green-400 font-medium">Redirecting to app...</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>✅ Trial activated for {email}</p>
            <p>✅ Full access to all AR features</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="w-full px-4 py-3 rounded-lg text-gray-900 bg-white border-2 border-transparent focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 placeholder-gray-500"
        />
        {error && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-400/30 rounded text-red-400 text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Starting Trial...
          </>
        ) : (
          <>
            <span className="mr-2">🚀</span>
            Start Free 7-Day Trial
          </>
        )}
      </button>
      
      <div className="text-xs text-gray-400 space-y-1">
        <p className="flex items-center justify-center">
          <span className="text-green-400 mr-2">✅</span>
          No credit card required
        </p>
        <p className="flex items-center justify-center">
          <span className="text-green-400 mr-2">✅</span>
          Full access to all AR features
        </p>
        <p className="flex items-center justify-center">
          <span className="text-green-400 mr-2">✅</span>
          Cancel anytime during trial
        </p>
      </div>
    </form>
  );
};