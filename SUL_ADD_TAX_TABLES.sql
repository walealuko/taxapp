-- Create CIT tax calculation table
CREATE TABLE IF NOT EXISTS tax_cit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    revenue NUMERIC NOT NULL,
    operating_expenses NUMERIC DEFAULT 0,
    salaries NUMERIC DEFAULT 0,
    depreciation NUMERIC DEFAULT 0,
    taxable_profit NUMERIC,
    category TEXT,
    tax_rate NUMERIC,
    cit_tax NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tax_cit ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see and insert their own calculations
CREATE POLICY "Users can manage their own CIT calculations"
ON tax_cit FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Repeat for other tax types to ensure consistency with the new endpoint pattern
CREATE TABLE IF NOT EXISTS tax_paye (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gross_income NUMERIC NOT NULL,
    frequency TEXT,
    expenses NUMERIC DEFAULT 0,
    taxable_income NUMERIC,
    annual_income NUMERIC,
    annual_tax NUMERIC,
    monthly_tax NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tax_paye ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own PAYE calculations" ON tax_paye FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tax_vat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    revenue NUMERIC NOT NULL,
    rate NUMERIC,
    vat_amount NUMERIC,
    net_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tax_vat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own VAT calculations" ON tax_vat FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tax_wht (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    wht_rate NUMERIC,
    withholding_tax NUMERIC,
    net_payment NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tax_wht ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own WHT calculations" ON tax_wht FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tax_cgt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    disposal_proceeds NUMERIC NOT NULL,
    cost_base NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    chargeable_gain NUMERIC,
    cgt_rate NUMERIC,
    capital_gains_tax NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tax_cgt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own CGT calculations" ON tax_cgt FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
