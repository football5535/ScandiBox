import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseService';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async checkout(priceId: string): Promise<void> {
    if (!priceId) {
        throw new Error("Price ID is missing.");
    }

    const returnUrl = window.location.origin;
    
    // We use a direct fetch here to ensure we get the JSON error body from the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ priceId, returnUrl })
    });

    if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error.replace(/mk_[a-zA-Z0-9]+/, '***');
                if (errorData.error.includes("Invalid API Key")) {
                    errorMessage = "Payment System Configuration Error (Invalid API Key)";
                }
            }
        } catch (e) {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.sessionId) {
        throw new Error("No session ID returned from server.");
    }

    const stripe = await stripePromise;
    if (!stripe) {
        throw new Error("Stripe.js failed to load.");
    }

    const { error } = await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
    if (error) {
        throw error;
    }
  },

  async cancelSubscription(): Promise<void> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        let msg = "Failed to cancel subscription.";
        try {
            const json = await response.json();
            if (json.error) msg = json.error;
        } catch(e) {}
        throw new Error(msg);
    }
  }
};