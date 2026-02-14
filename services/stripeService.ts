import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseService';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async checkout(priceId: string) {
    if (!priceId) {
        console.error("Price ID is missing.");
        alert("Configuration Error: Price ID is missing.");
        return;
    }

    try {
        const returnUrl = window.location.origin;
        
        // We use a direct fetch here to ensure we get the JSON error body from the Edge Function
        // if it fails (e.g. 500 Internal Server Error due to missing environment variables).
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
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // If JSON parse fails, try text
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

    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        alert(`Payment Failed: ${error.message}`);
    }
  }
};