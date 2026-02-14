import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { supabase } from './supabaseService';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async checkout(priceId: string) {
    if (!supabase) throw new Error("Supabase not initialized");

    // --- CRITICAL VALIDATION ---
    // Stripe Checkout requires a PRICE ID (starts with 'price_' or 'plan_').
    // It will fail if passed a PRODUCT ID (starts with 'prod_').
    if (priceId.startsWith('prod_')) {
        const msg = `Configuration Error:\n\nYou are using a Stripe PRODUCT ID ('${priceId}').\n\nStripe Checkout requires a PRICE ID (usually starts with 'price_').\n\n1. Go to Stripe Dashboard > Products > [Your Product]\n2. Scroll to 'Pricing' section.\n3. Copy the ID starting with 'price_'.\n4. Update constants.ts.`;
        console.error(msg);
        alert(msg);
        return;
    }

    if (priceId.includes('REPLACE')) {
        alert("Please configure your Stripe Price IDs in constants.ts first.");
        return;
    }

    try {
        console.log("Initiating checkout with Price ID:", priceId);
        
        // This invokes: https://[project-ref].supabase.co/functions/v1/create-checkout-session
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, returnUrl: window.location.origin }
        });

        if (error) {
            console.error("Supabase Edge Function Error:", error);
            throw new Error(error.message || "Failed to communicate with payment server.");
        }

        if (!data?.sessionId) {
            console.error("Missing session ID in response:", data);
            throw new Error("Invalid response from payment server.");
        }

        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe SDK failed to load.");

        const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId
        });

        if (stripeError) throw stripeError;

    } catch (err: any) {
        console.error("Checkout process failed:", err);
        alert(`Payment Error: ${err.message}\n\nCheck console for details.`);
    }
  }
};