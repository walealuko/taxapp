# Security & Compliance Standard Operating Procedure (SOP)

This document outlines the security implementation for the "Store only" architecture of TaxApp Nigeria.

## 1. Database Security (Supabase RLS)

To ensure users can only access their own tax records, Row Level Security (RLS) must be enabled on all tax tables.

### SQL Setup Script
Run the following SQL in the Supabase SQL Editor to secure the tables:

```sql
-- Enable RLS for all tax tables
ALTER TABLE tax_paye ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_vat ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_wht ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_cgt ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_cit ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only view/insert/update their own data
-- This assumes the table has a 'user_id' column that matches the auth.uid()
CREATE POLICY "Users can manage their own PAYE records" 
ON tax_paye FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own VAT records" 
ON tax_vat FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own WHT records" 
ON tax_wht FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own CGT records" 
ON tax_cgt FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own CIT records" 
ON tax_cit FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile" 
ON profiles FOR ALL 
USING (auth.uid() = id);
```

## 2. Secret Management (Edge Functions)

Storing secret keys (like `PAYSTACK_SECRET_KEY`) in the frontend code is a security risk. 

### Recommended Migration:
1. **Create a Supabase Edge Function**: Create a function called `paystack-payment`.
2. **Move Logic**: Move the `initiatePaystackPayment` logic from `utils/paystack.ts` to this function.
3. **Store Secrets**: Add the `PAYSTACK_SECRET_KEY` to Supabase Secrets via the dashboard:
   `supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...`
4. **Frontend Call**: Replace the direct Paystack API call in the app with a call to the Edge Function:
   ```typescript
   const { data, error } = await supabase.functions.invoke('paystack-payment', {
     body: { email, plan },
   });
   ```

## 3. Input Validation (Zod)
All inputs are now validated on the client side using **Zod** before calculation and database insertion to prevent data corruption and unexpected app behavior.
