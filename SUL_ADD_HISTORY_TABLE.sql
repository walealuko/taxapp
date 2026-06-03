-- Add tax_history table to store user calculations
CREATE TABLE IF NOT EXISTS public.tax_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tax_type TEXT NOT NULL,
    input JSONB NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_history ENABLE ROW LEVEL SECURITY;

-- Create a policy: Users can only see and manage their own tax history
CREATE POLICY "Users can manage their own tax history"
ON public.tax_history
FOR ALL
USING (auth.uid() = user_id);

-- Add an index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_tax_history_user_id ON public.tax_history(user_id);
