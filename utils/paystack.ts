import { Linking } from 'react-native';

// Note: In a production app, these calls should happen on a backend/Edge Function
// to keep the Secret Key secure. For this implementation, we'll structure it
// so it can be easily moved to a backend.
const PAYSTACK_SECRET_KEY = 'sk_test_8f96d3e9c9856981524897e29fd2e6b142940061'; // Replace with env variable in production

export interface PaystackPlan {
  id: string;
  amount: number; // Amount in kobo (Naira * 100)
  currency: string;
}

export const initiatePaystackPayment = async (email: string, plan: PaystackPlan) => {
  try {
    // 1. Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: plan.amount,
        currency: plan.currency,
        callback_url: 'taxapp://payment-success', // Replace with your actual deep link
        metadata: {
          plan_id: plan.id,
        },
      }),
    });

    const data = await response.json();

    if (data.status) {
      const authorizationUrl = data.data.authorization_url;

      // 2. Open the Paystack checkout page in a browser
      const canOpen = await Linking.canOpenURL(authorizationUrl);
      if (canOpen) {
        await Linking.openURL(authorizationUrl);
        return { success: true };
      } else {
        throw new Error('Cannot open payment gateway');
      }
    } else {
      throw new Error(data.message || 'Payment initialization failed');
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
