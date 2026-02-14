import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY, STRIPE_PRICES } from '../constants';
import { supabase, userService } from './supabaseService';
import { SubscriptionTier } from '../types';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async checkout(priceId: string) {
    if (!supabase) throw new Error("Supabase not initialized");

    // --- CRITICAL VALIDATION ---
    if (priceId.startsWith('prod_')) {
        alert("Configuration Error: You are using a Product ID. Please use a Price ID (starts with 'price_').");
        return;
    }

    try {
        console.log("Initiating checkout with Price ID:", priceId);
        
        // Try to invoke the backend function
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, returnUrl: window.location.origin }
        });

        if (error) {
            throw error; // Throw to catch block for fallback
        }

        if (!data?.sessionId) {
            throw new Error("Invalid response from payment server.");
        }

        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe SDK failed to load.");

        const { error: stripeError } = await (stripe as any).redirectToCheckout({
            sessionId: data.sessionId
        });

        if (stripeError) throw stripeError;

    } catch (err: any) {
        console.error("Payment Server Error:", err);
        
        // --- DEMO MODE FALLBACK ---
        // If the backend fails (likely 401/500 because Edge Functions aren't deployed),
        // offer the user a way to test the features anyway.
        const shouldSimulate = window.confirm(
            "Connection to Payment Server failed (Backend not deployed).\n\n" + 
            "Would you like to simulate a successful payment to test the Pro features (AI Scanning & Meal Plans)?"
        );

        if (shouldSimulate) {
            let targetTier = SubscriptionTier.Standard;
            if (priceId === STRIPE_PRICES.PRO) targetTier = SubscriptionTier.Pro;
            if (priceId === STRIPE_PRICES.PRO_MAX) targetTier = SubscriptionTier.ProMax;

            await userService.upgradeDemoTier(targetTier);
            alert(`Success! You have been upgraded to ${targetTier} (Demo Mode).`);
            window.location.reload();
        }
    }
  }
};