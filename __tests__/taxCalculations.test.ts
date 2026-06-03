import {
  calculatePAYE,
  calculateVat,
  calculateWht,
  calculateCgt,
  calculateCit
} from '../utils/taxCalculations';

describe('Tax Calculation Engine', () => {
  describe('PAYE Calculation', () => {
    test('should return 0 for income below threshold (e.g., 500,000)', () => {
      expect(calculatePAYE(500000)).toBe(0);
    });

    test('should calculate tax for middle bracket (e.g., 2,000,000)', () => {
      // (2,000,000 - 800,000) * 0.15 = 1,200,000 * 0.15 = 180,000
      expect(calculatePAYE(2000000)).toBe(180000);
    });

    test('should calculate tax for upper bracket (e.g., 15,000,000)', () => {
      // (15,000,000 - 12,000,000) * 0.21 + 1,950,000 = 3,000,000 * 0.21 + 1,950,000 = 630,000 + 1,950,000 = 2,580,000
      expect(calculatePAYE(15000000)).toBe(2580000);
    });
  });

  describe('VAT Calculation', () => {
    test('should calculate standard VAT at 7.5%', () => {
      const result = calculateVat(1000000);
      expect(result.vatAmount).toBe(75000);
      expect(result.netAmount).toBe(925000);
    });

    test('should handle custom VAT rates', () => {
      const result = calculateVat(1000000, 0.20);
      expect(result.vatAmount).toBe(200000);
      expect(result.netAmount).toBe(800000);
    });
  });

  describe('WHT Calculation', () => {
    test('should calculate WHT for contractors (5%)', () => {
      const result = calculateWht(1000000, 'contractor');
      expect(result.withholdingTax).toBe(50000);
      expect(result.netPayment).toBe(950000);
    });

    test('should calculate WHT for rent (10%)', () => {
      const result = calculateWht(1000000, 'rent');
      expect(result.withholdingTax).toBe(100000);
      expect(result.netPayment).toBe(900000);
    });

    test('should use default rate for unknown categories', () => {
      const result = calculateWht(1000000, 'unknown');
      expect(result.withholdingTax).toBe(50000);
    });
  });

  describe('CGT Calculation', () => {
    test('should calculate CGT for profitable sale', () => {
      const result = calculateCgt(5000000, 3000000, 200000);
      // Gain = 5M - 3M - 0.2M = 1.8M. Tax = 1.8M * 10% = 180,000
      expect(result.chargeableGain).toBe(1800000);
      expect(result.capitalGainsTax).toBe(180000);
    });

    test('should return 0 tax for loss-making sale', () => {
      const result = calculateCgt(2000000, 3000000, 100000);
      expect(result.chargeableGain).toBe(0);
      expect(result.capitalGainsTax).toBe(0);
    });
  });

  describe('CIT Calculation', () => {
    test('should apply 0% rate for small companies (<25M)', () => {
      const result = calculateCit(20000000, 5000000);
      expect(result.category).toBe('Small');
      expect(result.taxRate).toBe(0);
      expect(result.citTax).toBe(0);
    });

    test('should apply 20% rate for medium companies (25M-100M)', () => {
      const result = calculateCit(50000000, 10000000);
      // Profit = 50M - 10M = 40M. Tax = 40M * 20% = 8,000,000
      expect(result.category).toBe('Medium');
      expect(result.taxRate).toBe(20);
      expect(result.citTax).toBe(8000000);
    });

    test('should apply 30% rate for large companies (>100M)', () => {
      const result = calculateCit(150000000, 20000000);
      // Profit = 150M - 20M = 130M. Tax = 130M * 30% = 39,000,000
      expect(result.category).toBe('Large');
      expect(result.taxRate).toBe(30);
      expect(result.citTax).toBe(39000000);
    });
  });
});
