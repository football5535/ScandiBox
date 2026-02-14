import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { supabase } from './supabaseService';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  async checkout(priceId: string) {
    if (!supabase) throw new Error("Supabase not initialized");

    if (!priceId) {
        alert("Price ID is missing.");
        return;
    }

    try {
        // 1. Refresh Session to ensure we have a valid Token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error("Session Error:", sessionError);
            alert("Your session has expired. Please log in again.");
            return;
        }

        console.log("Contacting payment server with Price ID:", priceId);
        
        // 2. Invoke Function with Explicit Auth Header
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, returnUrl: window.location.origin },
            headers: {
                Authorization: `Bearer ${session.access_token}` // Explicitly pass the token
            }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            
            let errorMsg = error.message || "Unknown error";
            
            // Handle 401 specifically
            if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
                alert("Payment Error (401): The server rejected your request. \n\nTroubleshooting:\n1. Check if the Edge Function is deployed.\n2. Ensure 'STRIPE_SECRET_KEY' is set in Supabase Secrets.");
                return;
            }

            throw error;
        }

        if (!data?.sessionId) {
            throw new Error("Invalid response from payment server: No Session ID returned.");
        }

        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe SDK failed to load.");

        // 3. Redirect to Stripe
        const { error: stripeError } = await (stripe as any).redirectToCheckout({
            sessionId: data.sessionId
        });

        if (stripeError) throw stripeError;

    } catch (err: any) {
        console.error("Checkout Failed:", err);
        alert(`Payment Error: ${err.message || "Unknown error occurred"}`);
    }
  }
};