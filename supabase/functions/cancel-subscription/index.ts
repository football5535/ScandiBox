// @ts-nocheck
console.info('cancel-subscription function starting');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function cancelStripeSubscription(email: string) {
    // 1. Find Customer by Email
    const searchParams = new URLSearchParams();
    searchParams.append('query', `email:'${email}'`);
    
    const searchResp = await fetch(`${STRIPE_API_BASE}/customers/search?${searchParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` }
    });
    const searchData = await searchResp.json();
    
    if (!searchData.data || searchData.data.length === 0) {
        throw new Error("No Stripe customer found for this email.");
    }
    const customerId = searchData.data[0].id;

    // 2. Find Active Subscriptions for Customer
    const subResp = await fetch(`${STRIPE_API_BASE}/subscriptions?customer=${customerId}&status=active`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` }
    });
    const subData = await subResp.json();

    if (!subData.data || subData.data.length === 0) {
        // No active subscription, maybe already canceled?
        return true; 
    }

    // 3. Cancel the first active subscription found
    const subscriptionId = subData.data[0].id;
    const cancelResp = await fetch(`${STRIPE_API_BASE}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` }
    });
    
    if (!cancelResp.ok) {
        throw new Error("Failed to cancel subscription with Stripe provider.");
    }
    
    return true;
}

(Deno as any).serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get User from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Invalid user token');

    if (!STRIPE_SECRET) throw new Error('Server Config Error: Missing Stripe Key');

    // Perform Cancellation
    await cancelStripeSubscription(user.email);

    // Downgrade Profile in DB immediately
    const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ subscription_tier: 'Free' })
        .eq('id', user.id);

    if (dbError) throw new Error('Database update failed');

    return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });
  } catch (err: any) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});