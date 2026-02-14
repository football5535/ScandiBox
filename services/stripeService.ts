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
            console.warn("Supabase Function Error Details:", error);
            throw error; // Throw to catch block for fallback
        }

        if (!data?.sessionId) {
            throw new Error("Invalid response from payment server.");
        }

        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe SDK failed to load.");

        // Type assertion to 'any' to avoid strict type checking on redirectToCheckout which is sometimes deprecated but valid
        const { error: stripeError } = await (stripe as any).redirectToCheckout({
            sessionId: data.sessionId
        });

        if (stripeError) throw stripeError;

    } catch (err: any) {
        console.error("Payment Server Error:", err);
        
        // --- DEMO MODE FALLBACK ---
        // If the backend fails (likely 401/500 because Edge Functions aren't deployed or secrets missing),
        // offer the user a way to test the features anyway.
        
        // Specific check for the user's reported error (Status 400 usually means Missing Secret or Bad Request)
        const errorMessage = typeof err === 'object' ? JSON.stringify(err) : String(err);
        const isBackendConfigError = errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('500');

        let message = "Connection to Payment Server failed.\n\n";
        if (isBackendConfigError) {
            message += "It looks like the Backend Edge Function is not deployed or missing the STRIPE_SECRET_KEY.\n\n";
        }
        message += "Would you like to simulate a successful payment to test the Pro features (AI Scanning & Meal Plans)?";

        const shouldSimulate = window.confirm(message);

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