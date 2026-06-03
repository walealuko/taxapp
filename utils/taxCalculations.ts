import { PAYE_BRACKETS } from '../constants/tax';

export const calculatePAYE = (annualIncome: number) => {
  for (const bracket of PAYE_BRACKETS) {
    if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
      const tax = (annualIncome - bracket.min) * bracket.rate + bracket.fixed;
      return Math.round(tax * 100) / 100;
    }
  }
  return 0;
};

export const calculateVat = (revenue: number, rate: number = 0.075) => {
  const vatAmount = revenue * rate;
  const netAmount = revenue - vatAmount;
  return {
    vatAmount: Math.round(vatAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
};

export const calculateWht = (amount: number, category: string) => {
  const WHT_RATES_MAP: Record<string, number> = {
    contractor: 0.05,
    dividend: 0.10,
    rent: 0.10,
    interest: 0.10,
    royalty: 0.15,
    professional: 0.05,
    director: 0.10,
  };
  const whtRate = WHT_RATES_MAP[category] || 0.05;
  const withholdingTax = amount * whtRate;
  const netPayment = amount - withholdingTax;
  return {
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    netPayment: Math.round(netPayment * 100) / 100,
  };
};

export const calculateCgt = (disposalProceeds: number, costBase: number, expenses: number = 0) => {
  const gain = disposalProceeds - costBase - expenses;
  const chargeableGain = Math.max(0, gain);
  const capitalGainsTax = Math.round(chargeableGain * 0.10 * 100) / 100;
  return { chargeableGain, capitalGainsTax };
};

export const calculateCit = (revenue: number, expenses: number, salaries: number = 0, depreciation: number = 0) => {
  const taxableProfit = Math.max(0, revenue - expenses - salaries - depreciation);
  let rate = 0;
  let category = 'Small';

  if (revenue > 100000000) {
    rate = 0.30;
    category = 'Large';
  } else if (revenue >= 25000000) {
    rate = 0.20;
    category = 'Medium';
  } else {
    rate = 0;
    category = 'Small';
  }

  const citTax = Math.round(taxableProfit * rate * 100) / 100;
  return {
    taxableProfit,
    category,
    taxRate: rate * 100,
    citTax,
  };
};

export const formatCurrency = (amount: number | string) =>
  `₦${parseFloat(String(amount)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
