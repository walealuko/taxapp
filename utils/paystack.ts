import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export interface PaystackPlan {
  id: string;
  amount: number; // Amount in kobo (Naira * 100)
  currency: string;
}

export const initiatePaystackPayment = async (email: string, plan: PaystackPlan) => {
  try {
    // Call Supabase Edge Function to initialize transaction and keep secret key secure
    const { data, error } = await supabase.functions.invoke('paystack-payment', {
      body: { email, plan },
    });

    if (error) throw error;

    if (data && data.status) {
      const authorizationUrl = data.data.authorization_url;

      const canOpen = await Linking.canOpenURL(authorizationUrl);
      if (canOpen) {
        await Linking.openURL(authorizationUrl);
        return { success: true };
      } else {
        throw new Error('Cannot open payment gateway');
      }
    } else {
      throw new Error(data?.message || 'Payment initialization failed');
    }
  } catch (error: any) {
    console.error('Paystack Error:', error);
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
