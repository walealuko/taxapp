-- Setup Tax Configuration Tables for TaxApp Nigeria
-- Run this script in your Supabase SQL Editor

-- 1. Create tax_configs table for general tax information
CREATE TABLE IF NOT EXISTS public.tax_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    law_reference TEXT,
    rate NUMERIC,
    rates_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create tax_brackets table for PAYE progressive taxation
CREATE TABLE IF NOT EXISTS public.tax_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL,
    min_income NUMERIC NOT NULL,
    max_income NUMERIC NOT NULL,
    rate NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Seed default tax configurations
INSERT INTO public.tax_configs (tax_type, title, description, law_reference, rates)
VALUES
('paye', 'Personal Income Tax', 'Progressive tax on individuals', 'PITA 2007', NULL),
('vat', 'Value Added Tax', 'Consumption tax on goods and services', 'VAT Act', 7.5),
('wht', 'Withholding Tax', 'Advance payment of income tax', 'PITA 2007', NULL),
('cgt', 'Capital Gains Tax', 'Tax on profit from asset disposal', 'CGT Act 1967', 10.0)
ON CONFLICT (tax_type) DO NOTHING;

-- 4. Seed default PAYE brackets (Current Nigerian PITA/Finance Act)
INSERT INTO public.tax_brackets ("order", min_income, max_income, rate, description)
VALUES
(1, 0, 300000, 0.07, 'First 300,000 at 7%'),
(2, 300001, 600000, 0.115, 'Next 300,000 at 11.5%'),
(3, 600001, 1100000, 0.15, 'Next 500,000 at 15%'),
(4, 1100001, 1600000, 0.19, 'Next 500,000 at 19%'),
(5, 1600001, SMAX_VAL, 0.21, 'Above 1.6M at 21%') -- Note: Use a very high number for max_income of the last bracket
ON CONFLICT DO NOTHING;
-- Correction for the last bracket:
DELETE FROM public.tax_brackets WHERE description = 'Above 1.6M at 21%';
INSERT INTO public.tax_brackets ("order", min_income, max_income, rate, description)
VALUES (5, 1600001, 999999999, 0.21, 'Above 1.6M at 21%');
