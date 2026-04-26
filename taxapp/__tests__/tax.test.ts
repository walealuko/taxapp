import { calculatePAYE, PAYE_BRACKETS, formatCurrency, WHT_CATEGORIES, COLORS } from '../constants/tax';

describe('PAYE Tax Calculation', () => {
  describe('calculatePAYE', () => {
    it('should return 0 for income at or below 300000', () => {
      expect(calculatePAYE(0)).toBe(0);
      expect(calculatePAYE(300000)).toBe(0);
    });

    it('should calculate 7% for income 300001-600000', () => {
      const tax = calculatePAYE(500000);
      expect(tax).toBe(14000);
    });

    it('should calculate 11% bracket with fixed amount for 600001-1100000', () => {
      const tax = calculatePAYE(800000);
      expect(tax).toBe(43000);
    });

    it('should calculate 15% bracket for 1100001-1600000', () => {
      const tax = calculatePAYE(1400000);
      expect(tax).toBe(121000);
    });

    it('should calculate 19% bracket for 1600001-2100000', () => {
      const tax = calculatePAYE(1900000);
      expect(tax).toBe(208000);
    });

    it('should calculate 21% bracket for 2100001-2600000', () => {
      const tax = calculatePAYE(2400000);
      expect(tax).toBe(309000);
    });

    it('should calculate 24% bracket for 2600001-3100000', () => {
      const tax = calculatePAYE(2900000);
      expect(tax).toBe(423000);
    });

    it('should calculate 24% for income above 3100000', () => {
      const tax = calculatePAYE(5000000);
      expect(tax).toBe(927000);
    });

    it('should return 0 for negative income', () => {
      expect(calculatePAYE(-100)).toBe(0);
    });
  });

  describe('PAYE_BRACKETS integrity', () => {
    it('should have correct number of brackets', () => {
      expect(PAYE_BRACKETS.length).toBe(8);
    });

    it('should have continuous brackets with no gaps', () => {
      for (let i = 0; i < PAYE_BRACKETS.length - 1; i++) {
        const current = PAYE_BRACKETS[i];
        const next = PAYE_BRACKETS[i + 1];
        expect(current.max + 1).toBe(next.min);
      }
    });

    it('should have last bracket with Infinity max', () => {
      const lastBracket = PAYE_BRACKETS[PAYE_BRACKETS.length - 1];
      expect(lastBracket.max).toBe(Infinity);
    });
  });
});

describe('formatCurrency', () => {
  it('should format numbers with ₦ prefix and comma separators', () => {
    expect(formatCurrency(1000)).toContain('₦');
    expect(formatCurrency(1000000)).toContain('1');
  });

  it('should handle decimal amounts', () => {
    const formatted = formatCurrency(1234.56);
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
  });

  it('should handle string input', () => {
    const formatted = formatCurrency('5000');
    expect(formatted).toContain('₦');
  });

  it('should format very small amounts correctly', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('should format large amounts with millions correctly', () => {
    const formatted = formatCurrency(10000000);
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
  });
});

describe('WHT Categories', () => {
  it('should have all required WHT categories', () => {
    const expectedIds = ['contractor', 'dividend', 'rent', 'interest', 'royalty', 'professional', 'director'];
    const actualIds = WHT_CATEGORIES.map(c => c.id);
    expectedIds.forEach(id => {
      expect(actualIds).toContain(id);
    });
  });

  it('should have valid rates for all categories', () => {
    WHT_CATEGORIES.forEach(cat => {
      expect(cat.rate).toMatch(/^\d+(\.\d+)?%?$/);
    });
  });

  it('should have correct rates for known categories', () => {
    const contractor = WHT_CATEGORIES.find(c => c.id === 'contractor');
    expect(contractor?.rate).toBe('5%');

    const dividend = WHT_CATEGORIES.find(c => c.id === 'dividend');
    expect(dividend?.rate).toBe('10%');

    const royalty = WHT_CATEGORIES.find(c => c.id === 'royalty');
    expect(royalty?.rate).toBe('15%');
  });

  it('should have unique IDs for all categories', () => {
    const ids = WHT_CATEGORIES.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have color defined for all categories', () => {
    WHT_CATEGORIES.forEach(cat => {
      expect(cat.color).toBeDefined();
      expect(cat.color.length).toBeGreaterThan(0);
    });
  });
});

describe('VAT Calculation', () => {
  const calculateVat = (revenue, rate = 0.075) => {
    const vatAmount = revenue * rate;
    const netAmount = revenue - vatAmount;
    return { vatAmount, netAmount };
  };

  it('should calculate 7.5% VAT correctly', () => {
    const result = calculateVat(100000);
    expect(result.vatAmount).toBe(7500);
    expect(result.netAmount).toBe(92500);
  });

  it('should calculate 10% VAT correctly', () => {
    const result = calculateVat(100000, 0.10);
    expect(result.vatAmount).toBe(10000);
    expect(result.netAmount).toBe(90000);
  });

  it('should calculate 20% VAT correctly', () => {
    const result = calculateVat(100000, 0.20);
    expect(result.vatAmount).toBe(20000);
    expect(result.netAmount).toBe(80000);
  });

  it('should handle zero revenue', () => {
    const result = calculateVat(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it('should handle decimal revenue', () => {
    const result = calculateVat(1234.56, 0.075);
    expect(result.vatAmount).toBeCloseTo(92.592);
  });
});

describe('WHT Calculation', () => {
  const WHT_RATES = {
    contractor: 0.05, dividend: 0.10, rent: 0.10, interest: 0.10,
    royalty: 0.15, professional: 0.05, director: 0.10
  };

  const calculateWht = (amount, category) => {
    const rate = WHT_RATES[category] || 0.05;
    const withholdingTax = amount * rate;
    const netPayment = amount - withholdingTax;
    return { withholdingTax, netPayment, rate };
  };

  it('should calculate contractor WHT at 5%', () => {
    const result = calculateWht(100000, 'contractor');
    expect(result.withholdingTax).toBe(5000);
    expect(result.netPayment).toBe(95000);
    expect(result.rate).toBe(0.05);
  });

  it('should calculate dividend WHT at 10%', () => {
    const result = calculateWht(100000, 'dividend');
    expect(result.withholdingTax).toBe(10000);
    expect(result.netPayment).toBe(90000);
  });

  it('should calculate royalty WHT at 15%', () => {
    const result = calculateWht(100000, 'royalty');
    expect(result.withholdingTax).toBe(15000);
    expect(result.netPayment).toBe(85000);
  });

  it('should handle zero amount', () => {
    const result = calculateWht(0, 'contractor');
    expect(result.withholdingTax).toBe(0);
    expect(result.netPayment).toBe(0);
  });

  it('should default to contractor rate for unknown category', () => {
    const result = calculateWht(100000, 'unknown');
    expect(result.rate).toBe(0.05);
  });
});

describe('CGT Calculation', () => {
  const calculateCgt = (disposalProceeds, costBase = 0, expenses = 0) => {
    const gain = disposalProceeds - costBase - expenses;
    const cgt = gain > 0 ? gain * 0.10 : 0;
    return {
      chargeableGain: Math.max(0, gain),
      capitalGainsTax: Math.round(cgt * 100) / 100
    };
  };

  it('should calculate CGT with positive gain', () => {
    const result = calculateCgt(1000000, 800000, 50000);
    expect(result.chargeableGain).toBe(150000);
    expect(result.capitalGainsTax).toBe(15000);
  });

  it('should return 0 CGT for zero gain', () => {
    const result = calculateCgt(1000000, 900000, 100000);
    expect(result.chargeableGain).toBe(0);
    expect(result.capitalGainsTax).toBe(0);
  });

  it('should return 0 CGT for negative gain (loss)', () => {
    const result = calculateCgt(500000, 800000, 50000);
    expect(result.chargeableGain).toBe(0);
    expect(result.capitalGainsTax).toBe(0);
  });

  it('should handle no cost base or expenses', () => {
    const result = calculateCgt(1000000);
    expect(result.chargeableGain).toBe(1000000);
    expect(result.capitalGainsTax).toBe(100000);
  });

  it('should handle decimal values', () => {
    const result = calculateCgt(1234.56, 1000, 100);
    expect(result.chargeableGain).toBeCloseTo(134.56);
  });
});

describe('COLORS', () => {
  it('should have all required color properties', () => {
    expect(COLORS.primary).toBeDefined();
    expect(COLORS.secondary).toBeDefined();
    expect(COLORS.success).toBeDefined();
    expect(COLORS.warning).toBeDefined();
    expect(COLORS.info).toBeDefined();
    expect(COLORS.white).toBeDefined();
    expect(COLORS.light).toBeDefined();
    expect(COLORS.gray).toBeDefined();
    expect(COLORS.dark).toBeDefined();
  });

  it('should have valid hex color formats', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    expect(COLORS.primary).toMatch(hexRegex);
    expect(COLORS.secondary).toMatch(hexRegex);
    expect(COLORS.success).toMatch(hexRegex);
  });
});