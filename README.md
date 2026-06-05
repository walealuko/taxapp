# TaxApp - Nigeria Tax Calculator

A mobile tax application for Nigeria, built with a modern serverless architecture using Supabase for authentication and data storage. All tax calculations are performed on the client side for maximum performance and reliability.

## Features

- **PAYE (Pay As You Earn)** - Calculate income tax based on Nigeria's graduated tax brackets
- **VAT (Value Added Tax)** - Standard 7.5% VAT calculation with configurable rates
- **WHT (Withholding Tax)** - Contractor, dividend, rent, interest, and royalty categories
- **CGT (Capital Gains Tax)** - 10% rate on chargeable gains from asset disposal
- **CIT (Company Income Tax)** - Corporate tax calculations based on taxable profit
- **Tax Summary** - Combined view of all tax liabilities
- **Export Reports** - Generate PDF reports of calculations and email them directly

## Tech Stack

- **Frontend**: React Native (Expo)
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Supabase (BaaS)
  - **Auth**: Supabase Auth
  - **Database**: PostgreSQL with Row Level Security (RLS)
- **Validation**: Zod
- **Charts**: react-native-chart-kit

## Setup

### Prerequisites
- **Node.js**: Version 22 is recommended.

### Mobile
```bash
npm install
npx expo start
```

## Architecture: Store-Only
The app follows a "Store-Only" architecture. This means there is no dedicated API server.
- **Client-Side Logic**: All tax calculations are handled via pure functions in `utils/taxCalculations.ts`.
- **Direct Database Access**: The app interacts directly with Supabase tables using the Supabase JS client.
- **Security**: Data is protected using Supabase Row Level Security (RLS) policies, ensuring users can only access their own records.

## Nigeria Tax Brackets (PAYE)

| Annual Income | Rate |
|---------------|------|
| ₦0 - ₦300,000 | 0% |
| ₦300,001 - ₦600,000 | 7% |
| ₦600,001 - ₦1,100,000 | 11% |
| ₦1,100,001 - ₦1,600,000 | 15% |
| ₦1,600,001 - ₦2,100,000 | 19% |
| ₦2,100,001 - ₦2,600,000 | 21% |
| ₦2,600,001 - ₦3,100,000 | 24% |
| Above ₦3,100,001 | 24% |

## Tax Rates

- VAT: 7.5% (standard), 10%, 20% (special rates)
- WHT: 5% (contractor), 10% (dividend/rent/interest), 15% (royalty)
- CGT: 10% on chargeable gains
- CIT: 30% standard corporate rate
