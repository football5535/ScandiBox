// @ts-nocheck
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

console.info('create-checkout-session function starting');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
// Using the provided secret key directly. 
// Note: If 'mk_' (Managed Key) is invalid, ensure you provide the 'sk_live_' token from Stripe Dashboard.
const STRIPE_SECRET = 'mk_1SeivkRrZfGBUlV6TjsYIinO';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createCheckoutSession(priceId: string, returnUrl: string) {
  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('mode', 'subscription');
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  // Use session_id={CHECKOUT_SESSION_ID} so the frontend can retrieve the session later if needed
  params.append('success_url', `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', returnUrl);

  const resp = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Stripe Error:", text);
    // Explicitly mentioning key issues to help debugging
    if (resp.status === 401) {
         throw new Error(`Stripe Authentication Failed. The provided secret key (${STRIPE_SECRET.substring(0, 7)}...) might be invalid or a Managed Key ID.`);
    }
    throw new Error(`Stripe API error: ${resp.status} ${text}`);
  }

  return await resp.json();
}

(Deno as any).serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!STRIPE_SECRET) {
        console.error("STRIPE_SECRET_KEY is missing/empty.");
        return new Response(JSON.stringify({ error: 'Stripe secret not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const { priceId, returnUrl } = await req.json();
    if (!priceId || !returnUrl) {
        return new Response(JSON.stringify({ error: 'Missing priceId or returnUrl' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const session = await createCheckoutSession(priceId, returnUrl);
    
    return new Response(JSON.stringify({ sessionId: session.id }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });
  } catch (err: any) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});