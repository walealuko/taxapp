// Nigerian Tax Deadlines

export interface TaxDeadline {
  id: string;
  taxType: 'PAYE' | 'VAT' | 'WHT' | 'CGT';
  title: string;
  description: string;
  dueDate: Date;
  quarter?: string;
  isPast: boolean;
  daysRemaining: number;
  status: 'upcoming' | 'due-soon' | 'overdue';
}

const getQuarterForDate = (date: Date): string => {
  const month = date.getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

const getTaxTypeLabel = (taxType: string): string => {
  const labels: Record<string, string> = {
    PAYE: 'Pay As You Earn',
    VAT: 'Value Added Tax',
    WHT: 'Withholding Tax',
    CGT: 'Capital Gains Tax',
  };
  return labels[taxType] || taxType;
};

const calculateDaysRemaining = (deadline: Date): number => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const calculateStatus = (daysRemaining: number, isPast: boolean): 'upcoming' | 'due-soon' | 'overdue' => {
  if (isPast || daysRemaining <= 0) return 'overdue';
  if (daysRemaining <= 30) return 'due-soon';
  return 'upcoming';
};

export const getTaxDeadlines = (): TaxDeadline[] => {
  const now = new Date();
  const currentYear = now.getFullYear();

  // PAYE Monthly deadlines - 10th of each month
  const payeDeadlines: TaxDeadline[] = [];
  for (let month = 0; month < 12; month++) {
    const dueDate = new Date(currentYear, month, 10, 23, 59, 59);
    const isPast = dueDate < now;
    const daysRemaining = calculateDaysRemaining(dueDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    payeDeadlines.push({
      id: `paye-${month}`,
      taxType: 'PAYE',
      title: `PAYE Filing - ${monthNames[month]}`,
      description: `Monthly PAYE remittance due by the 10th of ${monthNames[month]}`,
      dueDate,
      quarter: getQuarterForDate(dueDate),
      isPast,
      daysRemaining,
      status: calculateStatus(daysRemaining, isPast),
    });
  }

  // VAT Quarterly deadlines
  const vatQuarterlyDeadlines: TaxDeadline[] = [
    { quarter: 'Q1', month: 3, day: 30, description: 'Q1 VAT return and remittance' },
    { quarter: 'Q2', month: 6, day: 30, description: 'Q2 VAT return and remittance' },
    { quarter: 'Q3', month: 9, day: 31, description: 'Q3 VAT return and remittance' },
    { quarter: 'Q4', month: 0, day: 31, description: 'Q4 VAT return and remittance (following year)' },
  ];

  const vatDeadlines: TaxDeadline[] = vatQuarterlyDeadlines.map((d, i) => {
    const year = d.month === 0 ? currentYear + 1 : currentYear;
    const dueDate = new Date(year, d.month, d.day, 23, 59, 59);
    const isPast = dueDate < now;
    const daysRemaining = calculateDaysRemaining(dueDate);

    return {
      id: `vat-${i}`,
      taxType: 'VAT' as const,
      title: `VAT ${d.quarter} Filing`,
      description: d.description,
      dueDate,
      quarter: d.quarter,
      isPast,
      daysRemaining,
      status: calculateStatus(daysRemaining, isPast),
    };
  });

  // WHT Quarterly deadlines (same as VAT)
  const whtDeadlines: TaxDeadline[] = vatQuarterlyDeadlines.map((d, i) => {
    const year = d.month === 0 ? currentYear + 1 : currentYear;
    const dueDate = new Date(year, d.month, d.day, 23, 59, 59);
    const isPast = dueDate < now;
    const daysRemaining = calculateDaysRemaining(dueDate);

    return {
      id: `wht-${i}`,
      taxType: 'WHT' as const,
      title: `WHT ${d.quarter} Filing`,
      description: `Quarterly WHT return and remittance${d.quarter === 'Q4' ? ' (previous year)' : ''}`,
      dueDate,
      quarter: d.quarter,
      isPast,
      daysRemaining,
      status: calculateStatus(daysRemaining, isPast),
    };
  });

  // CGT - No specific quarterly deadline, but estimated annually
  const cgtDeadline = {
    id: 'cgt-annual',
    taxType: 'CGT' as const,
    title: 'Annual CGT Assessment',
    description: 'Capital Gains Tax annual assessment due date',
    dueDate: new Date(currentYear, 11, 31, 23, 59, 59),
    isPast: new Date(currentYear, 11, 31) < now,
    daysRemaining: calculateDaysRemaining(new Date(currentYear, 11, 31)),
    status: calculateStatus(calculateDaysRemaining(new Date(currentYear, 11, 31)), new Date(currentYear, 11, 31) < now),
  };

  return [...payeDeadlines, ...vatDeadlines, ...whtDeadlines, cgtDeadline]
    .filter(d => !d.isPast || d.daysRemaining >= -7) // Show past week deadlines as "just passed"
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

export const getUpcomingDeadlines = (limit: number = 5): TaxDeadline[] => {
  return getTaxDeadlines()
    .filter(d => d.daysRemaining >= 0)
    .slice(0, limit);
};

export const formatDeadlineDate = (date: Date): string => {
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getDeadlineColor = (status: 'upcoming' | 'due-soon' | 'overdue'): string => {
  const colors = {
    upcoming: '#4CAF50',
    'due-soon': '#FFB74D',
    overdue: '#FF6B6B',
  };
  return colors[status];
};
