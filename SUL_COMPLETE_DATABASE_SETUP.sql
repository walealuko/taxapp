-- COMPLETE DATABASE SETUP FOR TAXAPP NIGERIA
-- Run this entire script in your Supabase SQL Editor to initialize the project

-- 1. Create a profiles table to extend Supabase Auth
-- This table stores user-specific data and subscription status
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    customer_type TEXT DEFAULT 'individual',
    subscription_plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy: Users can view and edit their own profile
CREATE POLICY "Users can manage their own profiles"
ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- 2. Create a payments table to track all transactions
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_reference TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    plan_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create a policy: Users can only see their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

-- 3. TRIGGER: Automatically create a profile when a new user signs up
-- This ensures that every user in auth.users has a corresponding row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, customer_type)
  VALUES (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'first_name'),
    (new.raw_user_meta_data->>'last_name'),
    COALESCE((new.raw_user_meta_data->>'customer_type'), 'individual')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Indices for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

COMMENT ON COLUMN public.profiles.subscription_plan IS 'One of: personal, sme, company';
COMMENT ON COLUMN public.profiles.subscription_status IS 'One of: active, inactive, expired';
