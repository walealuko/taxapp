export const API_URL = 'http://localhost:5000/api/v1';

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
  primary: '#0F172A',
  primaryDark: '#0F172A',
  secondary: '#2563EB',
  success: '#059669',
  warning: '#D97706',
  info: '#0891B2',
  white: '#FFFFFF',
  light: '#F8FAFC',
  gray: '#64748B',
  muted: '#94A3B8',
  dark: '#0F172A',
  lightGray: '#E2E8F0',
  border: '#CBD5E1',
  surface: '#FFFFFF',
  gradientStart: '#0F172A',
  gradientEnd: '#1E293B',
};

export const TAX_TYPES = [
  { id: 'paye', name: 'PAYE', description: 'Pay As You Earn', icon: '💼', color: '#475569', bg: '#F1F5F9' },
  { id: 'vat', name: 'VAT', description: 'Value Added Tax', icon: '🧾', color: '#0D9488', bg: '#F0FDFA' },
  { id: 'wht', name: 'WHT', description: 'Withholding Tax', icon: '✂️', color: '#B45309', bg: '#FFFBEB' },
  { id: 'cgt', name: 'CGT', description: 'Capital Gains', icon: '📈', color: '#0284C7', bg: '#F0F9FF' },
  { id: 'cit', name: 'CIT', description: 'Company Income Tax', icon: '🏢', color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'stamp', name: 'Stamp Duty', description: 'Legal Documents', icon: '📜', color: '#C026D3', bg: '#FDF2F8' },
];

export const TAX_INFO = {
  paye: {
    title: 'PAYE Tax',
    subtitle: 'Pay As You Earn (PITA 2007)',
    description: 'PAYE is a progressive personal income tax deducted at source by employers from employees\' salaries. Based on the Personal Income Tax (Amendment) Act 2020, Nigeria\'s consolidated relief allowance is ₦200,000 plus 20% of gross income.',
    rates: '0% - 24% | Progressive brackets from ₦0 to above ₦3.1M annually',
    law: 'Personal Income Tax (Amendment) Act 2020',
    brackets: [
      { range: '₦0 - ₦800,000', rate: '0%', description: 'Tax-free threshold' },
      { range: '₦800,001 - ₦3,000,000', rate: '15%', description: 'On the amount above ₦800,000' },
      { range: '₦3,000,001 - ₦12,000,000', rate: '18%', description: '+ ₦330,000 fixed on first ₦3,000,000' },
      { range: '₦12,000,001 - ₦25,000,000', rate: '21%', description: '+ ₦1,950,000 fixed on first ₦12,000,000' },
      { range: '₦25,000,001 - ₦50,000,000', rate: '23%', description: '+ ₦4,680,000 fixed on first ₦25,000,000' },
      { range: 'Above ₦50,000,000', rate: '25%', description: '+ ₦10,430,000 fixed on first ₦50,000,000' },
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
    description: 'VAT is a consumption tax levied on the supply of goods and services in Nigeria. Under the VAT (Amendment) Act 2022, the standard rate is 7.5%. Registered businesses collect VAT on behalf of the Nigerian Revenue Service (NRS).',
    rates: '7.5% standard | 0% zero-rated | 10% or 20% specific items',
    law: 'VAT (Amendment) Act 2022, NRS Public Notice',
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
    description: 'WHT is not a separate tax but an advance income tax deduction from payments for goods and services. The deductible amount can be credited against the payee\'s final tax liability.',
    rates: '2% - 15% depending on category',
    law: 'PITA 2007, Finance Act 2020-2024, NRS Administrative Guidelines',
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
    description: 'CGT is charged on the disposal of chargeable assets. Profits from the sale of assets, shares, and property are subject to this tax.',
    rates: '10% on chargeable gains | Exemptions apply',
    law: 'Capital Gains Tax Act 1967 (as amended 2019), NRS Guidelines',
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
  cit: {
    title: 'CIT',
    subtitle: 'Company Income Tax (CIT Act)',
    description: 'CIT is a tax on the profits of companies. The rate is based on annual turnover, providing significant relief for small companies to encourage growth.',
    rates: '0% (<₦25m) | 20% (₦25m-₦100m) | 30% (>₦100m)',
    law: 'Companies Income Tax Act, Finance Acts 2019-2024',
    calculationNote: 'Taxable Profit = Revenue - (Operating Expenses + Salaries + Depreciation). Tax is then applied based on the company size category.',
  },
  stamp: {
    title: 'Stamp Duty',
    subtitle: 'Stamp Duties Act',
    description: 'Stamp duties are taxes levied on legal documents, agreements, receipts, and electronic transfers to make them legally admissible in court.',
    rates: 'Varies by document type',
    law: 'Stamp Duties Act, NRS Guidelines',
    categories: [
      { id: 'agreement', name: 'Agreements', rate: '0.00S', description: 'Legal agreements and contracts' },
      { id: 'receipt', name: 'Receipts', rate: 'Fixed', description: 'Official receipts' },
      { id: 'legal', name: 'Legal Documents', rate: 'Fixed', description: 'Court documents and affidavits' },
      { id: 'transfer', name: 'Electronic Transfers', rate: '0.0075%', description: 'Electronic money transfers' },
    ],
  },
} as const;

export const VAT_RATE_MAP = {
  goods: [
    { name: 'General Merchandise', rate: 0.075, description: 'Electronics, apparel, household goods, etc.' },
    { name: 'Agricultural Produce', rate: 0, description: 'Fresh crops, livestock, raw agricultural products' },
    { name: 'Medical Equipment', rate: 0, description: 'Essential healthcare machinery and devices' },
    { name: 'Books & Education', rate: 0, description: 'Textbooks, newspapers, educational materials' },
    { name: 'Bottled Water/Soft Drinks', rate: 0.20, description: 'Luxury beverages and sweetened drinks' },
    { name: 'Luxury Vehicles', rate: 0.20, description: 'High-end automotive vehicles' },
  ],
  services: [
    { name: 'General Consulting', rate: 0.075, description: 'Business advisory, management services' },
    { name: 'Professional Services', rate: 0.075, description: 'Legal, accounting, engineering fees' },
    { name: 'Medical Services', rate: 0, description: 'Clinical treatments and healthcare' },
    { name: 'Educational Services', rate: 0, description: 'Tuition and formal schooling' },
    { name: 'Telecom Services', rate: 0.10, description: 'Internet and communication data services' },
    { name: 'Hospitality (Hotels)', rate: 0.075, description: 'Hotel accommodation and dining' },
  ],
};

export const WHT_CATEGORIES = [
  { id: 'contracts', name: 'Contracts', rate: '5%', color: '#FF6B6B' },
  { id: 'consultancy', name: 'Consultancy', rate: '5%', color: '#4CAF50' },
  { id: 'rent', name: 'Rent', rate: '10%', color: '#FFB74D' },
  { id: 'dividends', name: 'Dividends', rate: '10%', color: '#29B6F6' },
  { id: 'professional', name: 'Professional Services', rate: '5%', color: '#E91E63' },
];

export const PAYROLL_CONSTANTS = {
  PENSION_RATE: 0.08,
  NHF_RATE: 0.025,
  NSITF_RATE: 0.01,
};

export const PAYROLL_CATEGORIES = [
  'Staff Salary',
  'Pension',
  'Bonuses',
  'Overtime',
  'Tax Deductions',
];

export const PAYE_BRACKETS = [
  { min: 0, max: 800000, rate: 0, fixed: 0 },
  { min: 800000, max: 3000000, rate: 0.15, fixed: 0 },
  { min: 3000000, max: 12000000, rate: 0.18, fixed: 330000 },
  { min: 12000000, max: 25000000, rate: 0.21, fixed: 1950000 },
  { min: 25000000, max: 50000000, rate: 0.23, fixed: 4680000 },
  { min: 50000000, max: Infinity, rate: 0.25, fixed: 10430000 },
];

export { calculatePAYE, formatCurrency } from '../utils/taxCalculations';

export const USER_TYPE_LAWS = {
  individual: [
    { title: 'PAYE Tax', law: TAX_INFO.paye.law, description: TAX_INFO.paye.description },
  ],
  sme: [
    { title: 'VAT', law: TAX_INFO.vat.law, description: TAX_INFO.vat.description },
    { title: 'WHT', law: TAX_INFO.wht.law, description: TAX_INFO.wht.description },
    { title: 'CIT', law: TAX_INFO.cit.law, description: TAX_INFO.cit.description },
    { title: 'PAYE', law: TAX_INFO.paye.law, description: TAX_INFO.paye.description },
  ],
  company: [
    { title: 'CGT', law: TAX_INFO.cgt.law, description: TAX_INFO.cgt.description },
    { title: 'CIT', law: TAX_INFO.cit.law, description: TAX_INFO.cit.description },
    { title: 'VAT', law: TAX_INFO.vat.law, description: TAX_INFO.vat.description },
    { title: 'WHT', law: TAX_INFO.wht.law, description: TAX_INFO.wht.description },
    { title: 'PAYE', law: TAX_INFO.paye.law, description: TAX_INFO.paye.description },
  ],
};

export const APP_SUMMARY = `TaxApp is Nigeria's most intuitive tax assistant. Whether you're a freelancer, a growing SME, or a large corporate entity, we simplify the complexity of the NRS regulations, helping you calculate liabilities and stay compliant effortlessly.`;
