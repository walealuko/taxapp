export interface PAYEBracket { range: string; rate: string; description: string; }
export interface PAYERelief { name: string; value: string; }
export interface VATCategory { name: string; rate: string; items: string; }
export interface WHTCategory { id: string; name: string; rate: string; description: string; legalRef?: string; }
export interface CGTExemption { name: string; description: string; }

export interface TaxInfo {
  title: string;
  subtitle: string;
  description: string;
  rates: string;
  law: string;
  brackets?: PAYEBracket[];
  reliefs?: PAYERelief[];
  categories?: (VATCategory | WHTCategory | { name: string; description: string })[];
  exemptions?: CGTExemption[];
  calculationNote?: string;
}

export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  secondary: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFB74D',
  info: '#29B6F6',
  white: '#FFFFFF',
  light: '#F8F9FE',
  gray: '#9E9E9E',
  dark: '#2D3436',
  lightGray: '#E8E8E8',
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
};

export const TAX_TYPES = [
  { id: 'paye', name: 'PAYE', description: 'Pay As You Earn', icon: '💼', color: '#FF6B6B', bg: '#FFF5F5' },
  { id: 'vat', name: 'VAT', description: 'Value Added Tax', icon: '🧾', color: '#4CAF50', bg: '#F0FFF4' },
  { id: 'wht', name: 'WHT', description: 'Withholding Tax', icon: '✂️', color: '#FFB74D', bg: '#FFF8E1' },
  { id: 'cgt', name: 'CGT', description: 'Capital Gains', icon: '📈', color: '#29B6F6', bg: '#E1F5FE' },
];

export const TAX_INFO = {
  paye: {
    title: 'PAYE Tax',
    subtitle: 'Pay As You Earn (PITA 2007)',
    description: 'PAYE is a progressive personal income tax deducted at source by employers from employees\' salaries. Based on the Personal Income Tax (Amendment) Act 2020, Nigeria\'s consolidated relief allowance is ₦200,000 plus 20% of gross income.',
    rates: '0% - 24% | Progressive brackets from ₦0 to above ₦3.1M annually',
    law: 'Personal Income Tax (Amendment) Act 2020',
    brackets: [
      { range: '₦0 - ₦300,000', rate: '0%', description: 'Tax-free threshold' },
      { range: '₦300,001 - ₦600,000', rate: '7%', description: 'On the amount above ₦300,000' },
      { range: '₦600,001 - ₦1,100,000', rate: '11%', description: '+ ₦21,000 fixed on first ₦600,000' },
      { range: '₦1,100,001 - ₦1,600,000', rate: '15%', description: '+ ₦76,000 fixed on first ₦1,100,000' },
      { range: '₦1,600,001 - ₦2,100,000', rate: '19%', description: '+ ₦151,000 fixed on first ₦1,600,000' },
      { range: '₦2,100,001 - ₦2,600,000', rate: '21%', description: '+ ₦246,000 fixed on first ₦2,100,000' },
      { range: '₦2,600,001 - ₦3,100,000', rate: '24%', description: '+ ₦351,000 fixed on first ₦2,600,000' },
      { range: 'Above ₦3,100,000', rate: '24%', description: '+ ₦471,000 fixed on first ₦3,100,000' },
    ],
    reliefs: [
      { name: 'Consolidated Relief Allowance', value: '₦200,000 + 20% of gross income' },
      { name: 'National Housing Fund', value: '2.5% of basic salary' },
      { name: 'Pension Contributions', value: 'Up to 20% of gross income (subject to ₦500,000 cap)' },
      { name: 'Life Assurance Premium', value: 'Actual premium paid (max ₦1,000,000)' },
      { name: 'National Health Insurance', value: 'Actual premium paid' },
    ],
  },
  vat: {
    title: 'VAT',
    subtitle: 'Value Added Tax (VAT Act 2004)',
    description: 'VAT is a consumption tax levied on the supply of goods and services in Nigeria. Under the VAT (Amendment) Act 2022, the standard rate is 7.5%. Registered businesses collect VAT on behalf of the Federal Inland Revenue Service (FIRS).',
    rates: '7.5% standard | 0% zero-rated | 10% or 20% specific items',
    law: 'VAT (Amendment) Act 2022, FIRS Public Notice',
    categories: [
      { name: 'Standard Rate', rate: '7.5%', items: 'General goods and services' },
      { name: 'Zero-Rated', rate: '0%', items: 'Agricultural products, medical equipment, fertilizers, books, newspapers, educational items, honey' },
      { name: 'Exempt', rate: '0%', items: 'Medical services, educational services, hire/rental of goods, financial services, community transport, religious services' },
      { name: 'Special Rates', rate: '10%', items: ' Telecommunication services, gaming and lottery services' },
      { name: 'Special Rates', rate: '20%', items: 'Bottled water, wines and spirits, cigarettes, automotive vehicles, aircraft' },
    ],
  },
  wht: {
    title: 'WHT',
    subtitle: 'Withholding Tax (PITA 2007 / Finance Act)',
    description: 'WHT is an advance income tax deducted at source from payments for goods, services, and property. It applies to both resident and non-resident payments. The deductible WHT can be credited against the payee\'s final tax liability.',
    rates: '2% - 15% depending on category',
    law: 'PITA 2007, Finance Act 2020-2024, FIRS Administrative Guidelines',
    categories: [
      { id: 'contractor', name: 'Contractor Payments', rate: '5%', description: 'Payments to contractors for services rendered. Deducted from gross payment before VAT.', legalRef: 'Section 70, PITA 2007' },
      { id: 'dividend', name: 'Dividends', rate: '10%', description: 'Dividends, interest, and other investment income paid to shareholders and investors.', legalRef: 'Section 71, PITA 2007' },
      { id: 'rent', name: 'Rent', rate: '10%', description: 'Rent payments for land, buildings, or other property located in Nigeria.', legalRef: 'Section 71, PITA 2007' },
      { id: 'interest', name: 'Interest', rate: '10%', description: 'Interest payments on loans, debentures, and other debt instruments.', legalRef: 'Section 71, PITA 2007' },
      { id: 'royalty', name: 'Royalties', rate: '15%', description: 'Royalties for the use of intellectual property, patents, trademarks, copyrights.', legalRef: 'Section 71, PITA 2007' },
      { id: 'professional', name: 'Professional Services', rate: '5%', description: 'Fees paid to lawyers, accountants, engineers, medical practitioners, and other professionals.', legalRef: 'Finance Act 2020' },
      { id: 'director', name: 'Directors\' Fees', rate: '10%', description: 'Fees and emoluments paid to company directors in their capacity as directors.', legalRef: 'Section 71, PITA 2007' },
    ],
  },
  cgt: {
    title: 'CGT',
    subtitle: 'Capital Gains Tax (CGT Act 1967)',
    description: 'CGT is charged on the disposal of chargeable assets. Under the Capital Gains Tax (Amendment) Act 2019, the rate is 10% for individuals and 10% for companies on chargeable gains. Assets include property, shares, and business interests.',
    rates: '10% on chargeable gains | Exemptions apply',
    law: 'Capital Gains Tax Act 1967 (as amended 2019), FIRS Guidelines',
    exemptions: [
      { name: 'Primary Residence', description: 'Gain from disposal of one\'s only or main residence (conditions apply)' },
      { name: 'Charitable Donations', description: 'Gains donated to registered charities in Nigeria' },
      { name: 'Life Insurance', description: 'Proceeds from life insurance policies (not gain from disposal)' },
      { name: 'Currency Disposal', description: 'Disposal of personal-use assets (cars, household effects below ₦5,000,000)' },
      { name: 'Government Bonds', description: 'Gains from certain government securities may qualify for exemption' },
      { name: 'Replacement of Business Assets', description: 'Roll-over relief available for reinvestment in qualifying business assets' },
    ],
    calculationNote: 'Chargeable Gain = Disposal Proceeds - Cost Base - Allowable Expenses. CGT = Chargeable Gain × 10%. Losses can be carried forward to offset future gains.',
  },
};

export const WHT_CATEGORIES = [
  { id: 'contractor', name: 'Contractor', rate: '5%', color: '#FF6B6B' },
  { id: 'dividend', name: 'Dividend', rate: '10%', color: '#4CAF50' },
  { id: 'rent', name: 'Rent', rate: '10%', color: '#FFB74D' },
  { id: 'interest', name: 'Interest', rate: '10%', color: '#29B6F6' },
  { id: 'royalty', name: 'Royalty', rate: '15%', color: '#9C27B0' },
  { id: 'professional', name: 'Professional', rate: '5%', color: '#E91E63' },
  { id: 'director', name: 'Director', rate: '10%', color: '#00BCD4' },
];

export const PAYE_BRACKETS = [
  { min: 0, max: 300000, rate: 0, fixed: 0 },
  { min: 300001, max: 600000, rate: 0.07, fixed: 0 },
  { min: 600001, max: 1100000, rate: 0.11, fixed: 21000 },
  { min: 1100001, max: 1600000, rate: 0.15, fixed: 76000 },
  { min: 1600001, max: 2100000, rate: 0.19, fixed: 151000 },
  { min: 2100001, max: 2600000, rate: 0.21, fixed: 246000 },
  { min: 2600001, max: 3100000, rate: 0.24, fixed: 351000 },
  { min: 3100001, max: Infinity, rate: 0.24, fixed: 471000 },
];

export const calculatePAYE = (annualIncome: number) => {
  for (const bracket of PAYE_BRACKETS) {
    if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
      return (annualIncome - bracket.min) * bracket.rate + bracket.fixed;
    }
  }
  return 0;
};

export const formatCurrency = (amount: number | string) =>
  `₦${parseFloat(String(amount)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const API_URL = process.env.API_URL || "https://taxapp-production-349b.up.railway.app/api/v1";
