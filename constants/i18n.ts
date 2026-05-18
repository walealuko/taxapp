export const translations = {
  en: {
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email Address',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    loginSuccess: 'Welcome back!',
    registrationSuccess: 'Account created!',
    logout: 'Logout',

    // Dashboard
    dashboard: 'Dashboard',
    hello: 'Hello!',
    whatToCalculate: 'What would you like to calculate today?',
    viewTaxSummary: 'View Tax Summary',
    didYouKnow: 'Did you know?',

    // Tax types
    paye: 'PAYE',
    payeTitle: 'PAYE Tax',
    payeSubtitle: 'Pay As You Earn',
    vat: 'VAT',
    vatTitle: 'VAT',
    vatSubtitle: 'Value Added Tax',
    wht: 'WHT',
    whtTitle: 'Withholding Tax',
    whtSubtitle: 'Withholding Tax',
    cgt: 'CGT',
    cgtTitle: 'Capital Gains Tax',
    cgtSubtitle: 'Capital Gains Tax',

    // Inputs
    grossIncome: 'Gross Income',
    revenue: 'Revenue',
    amount: 'Amount',
    disposalProceeds: 'Disposal Proceeds',
    costBase: 'Cost Base',
    allowableExpenses: 'Allowable Expenses',
    frequency: 'Frequency',
    category: 'Category',
    monthly: 'Monthly',
    annual: 'Annual',

    // Results
    calculate: 'Calculate',
    calculationComplete: 'Calculation Complete!',
    annualIncome: 'Annual Income',
    annualTax: 'Annual Tax',
    monthlyTax: 'Monthly Tax',
    effectiveRate: 'Effective Rate',
    youEntered: 'You Entered',

    // History
    history: 'History',
    noHistory: 'No History Yet',
    noHistoryDesc: 'Your tax calculations will appear here once you start calculating.',

    // News
    news: 'News',
    taxNews: 'Tax News & Updates',
    noNews: 'No updates yet',

    // Estimated Tax
    estimatedTax: 'Estimated Tax',
    quarterlyEstimate: 'Quarterly Estimate',
    taxDue: 'Tax Due',
    daysRemaining: 'days remaining',
    filingDeadline: 'Filing Deadline',

    // Common
    cancel: 'Cancel',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    retry: 'Retry',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',

    // Notifications
    deadlineReminder: 'Tax Filing Reminder',
    deadlineBody: 'Your quarterly tax filing is due in {days} days. Keep your records up to date.',
    newRateAlert: 'Tax Rate Update',
  },
};

export type Language = keyof typeof translations;
export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const t = (key: string, lang: Language = 'en', params?: Record<string, string | number>): string => {
  let text = translations[lang]?.[key as keyof typeof translations['en']] || translations.en[key as keyof typeof translations['en']] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
};
