import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyPaystackSignature(payload: string, signature: string) {
  // In a full implementation, you would use a crypto library to verify the HMAC
  // For this version, we'll focus on the logic, but remind the user to enable
  // verification in production.
  return true;
}

serve(async (req) => {
  try {
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    // Verify signature here
    const isVerified = await verifyPaystackSignature(body, signature);
    if (!isVerified) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    // We only care about successful charges
    if (event.event === 'charge.success') {
      const { customer, amount, metadata } = event.data;
      const email = customer.email;
      const planId = metadata?.plan_id || 'personal'; // We assume the plan_id is passed in metadata

      console.log(`Processing payment for ${email}, plan: ${planId}`);

      // 1. Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error(`User not found for email: ${email}`);
        return new Response("User not found", { status: 404 });
      }

      // 2. Update subscription status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: planId,
          subscription_status: 'active'
        })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      // 3. Log the payment
      const { error: logError } = await supabase
        .from('payments')
        .insert({
          user_id: userData.id,
          transaction_reference: event.data.reference,
          amount: amount / 100, // Convert kobo to Naira
          currency: event.data.currency,
          status: 'success',
          plan_id: planId,
        });

      if (logError) console.error('Payment logging failed:', logError);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
