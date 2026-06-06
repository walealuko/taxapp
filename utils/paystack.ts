import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export interface PaystackPlan {
  id: string;
  amount: number; // Amount in kobo (Naira * 100)
  currency: string;
}

export const initiatePaystackPayment = async (email: string, plan: PaystackPlan) => {
  try {
    console.log('Initializing Paystack payment for:', email, 'Plan:', plan);

    // Call Supabase Edge Function to initialize transaction and keep secret key secure
    const { data, error } = await supabase.functions.invoke('paystack-payment', {
      body: { email, plan },
    });

    if (error) {
      console.error('Supabase Function Error:', error);
      throw new Error(`Server error: ${error.message}`);
    }

    console.log('Paystack response data:', data);

    if (data && data.status === true) {
      const authorizationUrl = data.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error('Paystack did not return an authorization URL');
      }

      const canOpen = await Linking.canOpenURL(authorizationUrl);
      if (canOpen) {
        await Linking.openURL(authorizationUrl);
        return { success: true };
      } else {
        // Try opening anyway as some platforms return false for canOpenURL but still open
        try {
          await Linking.openURL(authorizationUrl);
          return { success: true };
        } catch (e) {
          throw new Error('Cannot open payment gateway');
        }
      }
    } else {
      throw new Error(data?.message || 'Payment initialization failed');
    }
  } catch (error: any) {
    console.error('Paystack Flow Error:', error);
    throw error;
  }
};

export const getPlanDetails = (planId: string): PaystackPlan => {
  const plans: Record<string, PaystackPlan> = {
    personal: { id: 'plan_personal', amount: 500000, currency: 'NGN' },
    sme: { id: 'plan_sme', amount: 2000000, currency: 'NGN' },
    company: { id: 'plan_company', amount: 10000000, currency: 'NGN' },
  };
  return plans[planId] || plans.personal;
};
