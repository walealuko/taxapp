import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return new Response('No signature', { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const { email, metadata } = event.data;
      const planId = metadata.plan_id;

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);

      if (userError || !user) {
        return new Response('User not found', { status: 404 });
      }

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: planId.replace('plan_', '')
        })
        .eq('id', user.user.id);
    }

    return new Response('Webhook received', { status: 200 });

  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});
