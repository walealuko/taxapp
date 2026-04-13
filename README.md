# TaxApp - Nigeria Tax Calculator

A mobile tax application for Nigeria with backend API for calculating various Nigerian taxes.

## Features

- **PAYE (Pay As You Earn)** - Calculate income tax based on Nigeria's graduated tax brackets
- **VAT (Value Added Tax)** - Standard 7.5% VAT calculation with configurable rates
- **WHT (Withholding Tax)** - Contractor, dividend, rent, interest, and royalty categories
- **CGT (Capital Gains Tax)** - 10% rate on chargeable gains from asset disposal
- **Tax Summary** - Combined view of all tax liabilities

## Tech Stack

- **Mobile**: React Native (Expo)
- **Backend**: Node.js + Express
- **Auth**: JWT + bcrypt
- **API**: RESTful JSON

## Setup

### Backend

```bash
cd taxapp
npm install
npm run server   # Runs on port 5000
```

### Mobile

```bash
cd taxapp
npm install
npx expo start
```

Update `API_URL` in `App.js` with your backend IP address before running on a device.

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Tax Calculations (protected)
- `POST /api/tax/paye` - PAYE tax
- `POST /api/tax/vat` - VAT
- `POST /api/tax/wht` - Withholding tax
- `POST /api/tax/cgt` - Capital gains tax
- `POST /api/tax/summary` - Combined summary

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
