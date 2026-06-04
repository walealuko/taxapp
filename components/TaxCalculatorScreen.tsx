import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import {
  TAX_INFO,
  WHT_CATEGORIES,
  PAYROLL_CONSTANTS,
  formatCurrency,
  VAT_RATE_MAP,
  type TaxInfo,
} from '../constants/tax';
import { TYPOGRAPHY } from '../constants/typography';
import { useThemeColors } from '../hooks/useThemeColors';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSaveDrafts } from '../hooks/useAutoSaveDrafts';
import DraftRecovery from './DraftRecovery';
import { NetworkStatusBanner } from './NetworkStatus';
import { captureError } from '../utils/sentry';
import { AppCard } from './ui/AppCard';
import { StandardInput } from './ui/StandardInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUpcomingDeadlines, getDeadlineColor, type TaxDeadline } from '../utils/taxDeadlines';
import { TaxChart } from './TaxChart';
import { supabase } from '../lib/supabase';
import {
  calculatePAYE,
  calculateVat,
  calculateWht,
  calculateCgt,
  calculateCit
} from '../utils/taxCalculations';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt' | 'cit';
type Props = { type: TaxType; user?: any; initialBasicSalary?: string; employeeName?: string };

const LedgerRow = ({ label, children, highlight, colors, isCalc = false }: any) => (
  <View style={[
    styles.ledgerRow,
    highlight && styles.ledgerRowHighlight(colors),
    isCalc && styles.ledgerRowCalc(colors)
  ]}>
    <Text style={[
      styles.ledgerLabel(colors),
      highlight && styles.ledgerLabelHighlight(colors),
      isCalc && styles.ledgerLabelCalc(colors)
    ]}>
      {label}
    </Text>
    <View style={styles.ledgerValueContainer}>
      {children}
    </View>
  </View>
);

const parseAmount = (val: string) => {
  return parseFloat(val.replace(/,/g, '')) || 0;
};

export default function TaxCalculatorScreen({ type, user, initialBasicSalary, employeeName }: Props) {
  const colors = useThemeColors();
  const taxInfo: TaxInfo | undefined = TAX_INFO[type as keyof typeof TAX_INFO];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [citExpenses, setCitExpenses] = useState<{ category: string; amount: string }[]>(
    [{ category: '', amount: '' }]
  );
  const [result, setResult] = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [isVatTableExpanded, setIsVatTableExpanded] = useState(false);
  const [vatCategory, setVatCategory] = useState<'goods' | 'services'>('goods');
  const [closestDeadline, setClosestDeadline] = useState<TaxDeadline | null>(null);
  const { user: authUser } = useAuth();
  const { saveDraft, getLatestDraftForType, isSaving } = useAutoSaveDrafts();

  useEffect(() => {
    const deadline = getUpcomingDeadlines(1)[0];
    setClosestDeadline(deadline || null);
  }, []);

  useEffect(() => {
    if (type === 'paye' && initialBasicSalary) {
      setInputs(prev => ({
        ...prev,
        basicSalary: initialBasicSalary,
      }));
    }
  }, [initialBasicSalary, type]);

  useEffect(() => {
    const latestDraft = getLatestDraftForType(type);
    if (latestDraft) {
      Alert.alert(
        '📄 Draft Found',
        'You have an unsaved calculation from before. Would you like to recover it?',
        [
          { text: 'Start Fresh', style: 'cancel' },
          {
            text: 'Recover Draft',
            onPress: () => {
              setInputs(latestDraft.inputs);
              if (latestDraft.lastResult) {
                setResult(latestDraft.lastResult as Record<string, number | string>);
              }
            },
          },
        ]
      );
    }
  }, [type, getLatestDraftForType]);

  const addExpenseRow = () => {
    setCitExpenses([...citExpenses, { category: '', amount: '' }]);
  };

  const removeExpenseRow = (index: number) => {
    setCitExpenses(citExpenses.filter((_, i) => i !== index));
  };

  const updateExpenseRow = (index: number, field: 'category' | 'amount', value: string) => {
    const newExpenses = [...citExpenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setCitExpenses(newExpenses);
  };

  useEffect(() => {
    const hasInputs = Object.values(inputs).some(v => v && v.trim() !== '');
    if (hasInputs) {
      saveDraft(type, inputs, result || undefined);
    }
  }, [inputs, result]);

  const handlePrintResult = async () => {
    if (!result) return;

    const html = `
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .report-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0f172a; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 5px; }
            .title { font-size: 22px; font-weight: bold; color: #334155; text-transform: uppercase; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 6px; }
            .meta-item { font-size: 13px; }
            .meta-label { color: #64748b; font-weight: 500; margin-right: 5px; }
            .meta-value { color: #0f172a; font-weight: 600; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .label { font-size: 14px; color: #475569; }
            .value { font-size: 14px; font-weight: 600; text-align: right; color: #0f172a; }
            .highlight-row { background: #f1f5f9; font-weight: bold; color: #0f172a; border-radius: 4px; padding: 12px 10px; margin-top: 10px; }
            .highlight-label { font-size: 16px; font-weight: bold; color: #0f172a; }
            .highlight-value { font-size: 18px; font-weight: 800; text-align: right; color: #2563eb; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .disclaimer { font-style: italic; margin-top: 20px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="logo">🇳🇬 TAXAPP</div>
              <div class="title">Official Tax Calculation Report</div>
              <div class="subtitle">Generated for compliance and record-keeping purposes</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Tax Type:</span> <span class="meta-value">${taxInfo?.title || type.toUpperCase()}</span></div>
              <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-value">${new Date().toLocaleString()}</span></div>
              <div class="meta-item"><span class="meta-label">User Profile:</span> <span class="meta-value">${user?.customerType || 'Individual'}</span></div>
              <div class="meta-item"><span class="meta-label">Report ID:</span> <span class="meta-value">TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Calculation Breakdown</div>
              ${Object.entries(result).map(([key, value]) => {
                if (key === 'isOfflineCalculation') return '';
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formattedValue = typeof value === 'number' ? formatCurrency(value) : value;
                const isTotal = key.toLowerCase().includes('tax') && (key.toLowerCase().includes('annual') || key.toLowerCase().includes('total') || key.toLowerCase().includes('amount'));

                return isTotal ?
                  `<div class="row highlight-row">
                    <span class="highlight-label">${label}</span>
                    <span class="highlight-value">${formattedValue}</span>
                  </div>` :
                  `<div class="row">
                    <span class="label">${label}</span>
                    <span class="value">${formattedValue}</span>
                  </div>`;
              }).join('')}
            </div>

            <div class="disclaimer">
              Note: This report is an automated estimate based on current tax laws provided in the application.
              Please verify with a certified tax professional or the NRS for official filings.
            </div>

            <div class="footer">
              &copy; ${new Date().getFullYear()} TaxApp Nigeria. All rights reserved.<br/>
              Designed for simplicity, transparency, and compliance.
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (err: any) {
      Alert.alert('Export Failed', 'Could not generate PDF: ' + err.message);
      return null;
    }
  };

  const handleEmailResult = async () => {
    const uri = await handlePrintResult();
    if (!uri) return;

    const isComposed = await MailComposer.composeAsync({
      recipients: [''],
      subject: `Tax Calculation Report - ${taxInfo?.title || type.toUpperCase()}`,
      body: `Hello,\n\nPlease find attached the tax calculation report generated via NRS Tax App Nigeria.\n\nTax Type: ${taxInfo?.title || type.toUpperCase()}\nDate: ${new Date().toLocaleDateString()}\n\nBest regards.`,
      attachments: [uri],
    });

    if (isComposed) {
      Alert.alert('Email Sent', 'Your tax report has been sent successfully.');
    }
  };

  const showCalculationLogic = () => {
    const explanations: Record<string, string> = {
      paye: 'Personal Income Tax (PAYE) is calculated using a progressive bracket system. We deduct your statutory contributions (Pension, NHF, NSITF) and consolidated relief allowance from your gross income to find the taxable income, then apply the PITA brackets.',
      vat: 'Value Added Tax (VAT) is calculated as a flat percentage (currently 7.5%) of your taxable revenue. It is a consumption tax added to the price of goods and services.',
      wht: 'Withholding Tax (WHT) is an advance payment of income tax. The rate depends on the category of service (e.g., 5% for contractors). The payer deducts this and remits it to the tax authority on your behalf.',
      cgt: 'Capital Gains Tax (CGT) is applied to the profit made from selling an asset. We subtract the cost base and allowable expenses from the disposal proceeds to determine the chargeable gain, then apply the tax rate (usually 10%).'
    };

    Alert.alert(
      'How this is calculated',
      explanations[type] || 'Calculation is based on the current Nigerian tax laws and regulations.',
      [{ text: 'Got it' }]
    );
  };

  const handleCalculate = async () => {
    if (type === 'paye' && !inputs.basicSalary && !inputs.bonuses && !inputs.overtime) {
      Alert.alert('Oops! 😅', 'Please enter your basic salary or other income');
      return;
    }
    if (type === 'vat' && !inputs.revenue) {
      Alert.alert('Oops! 😅', 'Please enter your revenue');
      return;
    }
    if (type === 'wht' && !inputs.amount) {
      Alert.alert('Oops! 😅', 'Please enter an amount');
      return;
    }
    if (type === 'cgt' && !inputs.disposalProceeds) {
      Alert.alert('Oops! 😅', 'Please enter disposal proceeds');
      return;
    }
    if (type === 'cit' && !inputs.revenue) {
      Alert.alert('Oops! 😅', 'Please enter company revenue');
      return;
    }

    setLoading(true);
    try {
      if (!authUser) {
        Alert.alert('Session Expired', 'Please login again.');
        setLoading(false);
        return;
      }

      const salaryDeduction = parseAmount(inputs.salary || '0');
      let calcResult: Record<string, any> = {};
      let dbPayload: Record<string, any> = { user_id: authUser.id };

      if (type === 'paye') {
        const basicSalary = parseAmount(inputs.basicSalary || '0');
        const bonuses = parseAmount(inputs.bonuses || '0');
        const overtime = parseAmount(inputs.overtime || '0');
        const grossIncome = basicSalary + bonuses + overtime;

        if (grossIncome === 0) {
          Alert.alert('Oops! 😅', 'Please enter at least one income source');
          setLoading(false);
          return;
        }

        const frequency = inputs.frequency || 'annual';
        const expenses = parseAmount(inputs.expenses || '0');
        const misc = parseAmount(inputs.misc || '0');
        const annualIncome = frequency === 'monthly' ? grossIncome * 12 : grossIncome;
        const annualExpenses = frequency === 'monthly' ? expenses * 12 : expenses;
        const taxableIncome = Math.max(0, annualIncome - annualExpenses - misc - salaryDeduction);

        const annualTax = calculatePAYE(taxableIncome);
        const monthlyTax = annualTax / 12;

        calcResult = {
          grossIncome,
          basicSalary,
          bonuses,
          overtime,
          frequency,
          expenses,
          misc,
          taxableIncome,
          annualIncome,
          annualTax,
          monthlyTax: Math.round(monthlyTax * 100) / 100,
        };

        dbPayload = {
          ...dbPayload,
          gross_income: grossIncome,
          frequency,
          expenses: annualExpenses,
          taxable_income: taxableIncome,
          annual_income: annualIncome,
          annual_tax: Math.round(annualTax * 100) / 100,
          monthly_tax: Math.round(monthlyTax * 100) / 100,
        };
      } else if (type === 'vat') {
        const revenue = Math.max(0, parseAmount(inputs.revenue || '0') - salaryDeduction);
        const rate = parseAmount(inputs.rate || '0.075');
        const { vatAmount, netAmount } = calculateVat(revenue, rate);

        calcResult = { revenue, rate, vatAmount, netAmount };
        dbPayload = {
          ...dbPayload,
          revenue,
          rate,
          vat_amount: vatAmount,
          net_amount: netAmount,
        };
      } else if (type === 'wht') {
        const amount = Math.max(0, parseAmount(inputs.amount || '0') - salaryDeduction);
        const category = inputs.category || 'contractor';
        const { withholdingTax, netPayment } = calculateWht(amount, category);

        calcResult = { amount, category, withholdingTax, netPayment, whtRate: (withholdingTax/amount) || 0 };
        dbPayload = {
          ...dbPayload,
          amount,
          category,
          wht_rate: (withholdingTax/amount) || 0,
          withholding_tax: withholdingTax,
          net_payment: netPayment,
        };
      } else if (type === 'cgt') {
        const disposalProceeds = Math.max(0, parseAmount(inputs.disposalProceeds || '0') - salaryDeduction);
        const costBase = parseAmount(inputs.costBase || '0');
        const expenses = parseAmount(inputs.expenses || '0');
        const { chargeableGain, capitalGainsTax } = calculateCgt(disposalProceeds, costBase, expenses);

        calcResult = { disposalProceeds, costBase, expenses, chargeableGain, capitalGainsTax, cgtRate: 0.10 };
        dbPayload = {
          ...dbPayload,
          disposal_proceeds: disposalProceeds,
          cost_base: costBase,
          expenses,
          chargeable_gain: chargeableGain,
          cgt_rate: 0.10,
          capital_gains_tax: capitalGainsTax,
        };
      } else if (type === 'cit') {
        const revenue = Math.max(0, parseAmount(inputs.revenue || '0') - salaryDeduction);
        const operatingExpenses = citExpenses.reduce((sum, row) => sum + parseAmount(row.amount), 0);
        const salaries = parseAmount(inputs.salaries || '0');
        const depreciation = parseAmount(inputs.depreciation || '0');
        const { taxableProfit, category, taxRate, citTax } = calculateCit(revenue, operatingExpenses, salaries, depreciation);

        calcResult = { revenue, operatingExpenses, salaries, depreciation, taxableProfit, category, taxRate, citTax };
        dbPayload = {
          ...dbPayload,
          revenue,
          operating_expenses: operatingExpenses,
          salaries,
          depreciation,
          taxable_profit: taxableProfit,
          category,
          tax_rate: taxRate / 100,
          cit_tax: citTax,
        };
      }

      // Save to Supabase
      const { error: dbError } = await supabase
        .from(`tax_${type}`)
        .insert([dbPayload]);

      if (dbError) throw dbError;

      setResult(calcResult);
    } catch (err: any) {
      Alert.alert('Calculation Error', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const renderCalculatorTable = () => {
    if (type === 'paye') {
      const basic = parseAmount(inputs.basicSalary || '0');
      const bonuses = parseAmount(inputs.bonuses || '0');
      const overtime = parseAmount(inputs.overtime || '0');
      const grossIncome = basic + bonuses + overtime;
      const pension = basic * PAYROLL_CONSTANTS.PENSION_RATE;
      const nhf = basic * PAYROLL_CONSTANTS.NHF_RATE;
      const nsitf = grossIncome * PAYROLL_CONSTANTS.NSITF_RATE;

      const effectiveRate = result?.taxableIncome > 0
        ? ((Number(result?.annualTax) / Number(result?.taxableIncome)) * 100).toFixed(1)
        : '0.0';

      return (
        <View style={styles.ledgerContainer}>
          <AppCard title="Primary Income" variant="default">
            <StandardInput
              label={user?.customerType === 'individual' ? "Basic Salary" : "Total Income"}
              icon="cash"
              value={inputs.basicSalary || ''}
              onChangeText={(v) => setInputs({ ...inputs, basicSalary: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Bonuses"
              icon="gift"
              value={inputs.bonuses || ''}
              onChangeText={(v) => setInputs({ ...inputs, bonuses: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Overtime"
              icon="clock-outline"
              value={inputs.overtime || ''}
              onChangeText={(v) => setInputs({ ...inputs, overtime: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <View style={[styles.calcRow, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Gross Income</Text>
              <Text style={[styles.calcValue, { color: colors.text, fontWeight: 'bold' }]}>{formatCurrency(grossIncome)}</Text>
            </View>
          </AppCard>

          <AppCard title="Statutory Deductions" variant="default">
            <View style={[styles.calcRow, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Pension (8%)</Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>{formatCurrency(pension)}</Text>
            </View>
            <View style={[styles.calcRow, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>NHF (2.5%)</Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>{formatCurrency(nhf)}</Text>
            </View>
            <View style={[styles.calcRow, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>NSITF (1%)</Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>{formatCurrency(nsitf)}</Text>
            </View>
          </AppCard>

          <AppCard title="Adjustments" variant="default">
            <StandardInput
              label="Salary Deduction"
              icon="account-cash"
              value={inputs.salary || ''}
              onChangeText={(v) => setInputs({ ...inputs, salary: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Deductible Expenses"
              icon="minus-circle-outline"
              value={inputs.expenses || ''}
              onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Miscellaneous"
              icon="dots-horizontal"
              value={inputs.misc || ''}
              onChangeText={(v) => setInputs({ ...inputs, miscS: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <View style={styles.configRow}>
              <Text style={[styles.configLabel, { color: colors.text }]}>Calculation Frequency</Text>
              <View style={styles.ledgerToggle(colors)}>
                {['monthly', 'annual'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.ledgerToggleBtn, inputs.frequency === f && styles.ledgerToggleActive(colors)]}
                    onPress={() => setInputs({ ...inputs, frequency: f })}
                  >
                    <Text style={[styles.ledgerToggleText(colors), inputs.frequency === f && styles.ledgerToggleTextActive(colors)]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AppCard>

          {result && (
            <AppCard title="Tax Summary" variant="default" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxable Income</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(result.taxableIncome)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Effective Rate</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{effectiveRate}%</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.outline }]}>
                <Text style={[styles.summaryLabelHighlight, { color: colors.text, fontWeight: 'bold' }]}>Total Tax Due</Text>
                <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>{formatCurrency(result.annualTax)}</Text>
              </View>
              <TaxChart result={result} type={type} />
            </AppCard>
          )}
        </View>
      );
    }

    if (type === 'vat') {
      const isBusinessUser = user?.customerType === 'sme' || user?.customerType === 'company';
      return (
        <View style={styles.ledgerContainer}>
          {isVatTableExpanded && isBusinessUser && (
            <View style={styles.vatExpandableTable(colors)}>
              <View style={styles.vatTableHeader(colors)}>
                <TouchableOpacity
                  style={[styles.vatTabBtn, vatCategory === 'goods' && styles.vatTabBtnActive(colors)]}
                  onPress={() => setVatCategory('goods')}
                >
                  <Text style={[styles.vatTabText(colors), vatCategory === 'goods' && styles.vatTabTextActive(colors)]}>Goods</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.vatTabBtn, vatCategory === 'services' && styles.vatTabBtnActive(colors)]}
                  onPress={() => setVatCategory('services')}
                >
                  <Text style={[styles.vatTabText(colors), vatCategory === 'services' && styles.vatTabTextActive(colors)]}>Services</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {VAT_RATE_MAP[vatCategory].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.vatTableRow(colors)}
                    onPress={() => {
                      setInputs({ ...inputs, rate: item.rate.toString() });
                      setIsVatTableExpanded(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vatRowName(colors), inputs.rate === item.rate.toString() && styles.vatRowNameActive(colors)]}>
                        {item.name}
                      </Text>
                      <Text style={styles.vatRowDesc(colors)}>{item.description}</Text>
                    </View>
                    <Text style={[styles.vatRowRate(colors), inputs.rate === item.rate.toString() && styles.vatRowRateActive(colors)]}>
                      {(item.rate * 100).toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <LedgerRow label="Revenue" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.revenue || ''}
              onChangeText={(v) => setInputs({ ...inputs, revenue: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Salary Deduction" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.salary || ''}
              onChangeText={(v) => setInputs({ ...inputs, salary: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="VAT Rate" colors={colors}>
            <View style={styles.ledgerSmeContainer}>
              <View style={styles.ledgerToggle(colors)}>
                {['0.075', '0.10', '0.20'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.ledgerToggleBtn, inputs.rate === r && styles.ledgerToggleActive(colors)]}
                    onPress={() => setInputs({ ...inputs, rate: r })}
                  >
                    <Text style={[styles.ledgerToggleText(colors), inputs.rate === r && styles.ledgerToggleTextActive(colors)]}>
                      {(parseFloat(r) * 100).toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {isBusinessUser && (
                <TouchableOpacity
                  style={styles.rateTableBtn(colors)}
                  onPress={() => setIsVatTableExpanded(!isVatTableExpanded)}
                >
                  <Text style={styles.rateTableBtnText(colors)}>
                    {isVatTableExpanded ? 'Close Table' : '🔍 View Rates'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </LedgerRow>

          {result && (
            <>
              <LedgerRow label="VAT Amount" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{formatCurrency(result.vatAmount)}</Text>
              </LedgerRow>
              <LedgerRow label="Net Amount" highlight colors={colors}>
                <Text style={styles.ledgerValueHighlight(colors)}>{formatCurrency(result.netAmount)}</Text>
              </LedgerRow>
            </>
          )}
        </View>
      );
    }

    if (type === 'wht') {
      return (
        <View style={styles.ledgerContainer}>
          <LedgerRow label="Amount" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.amount || ''}
              onChangeText={(v) => setInputs({ ...inputs, amount: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Salary Deduction" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.salary || ''}
              onChangeText={(v) => setInputs({ ...inputs, salary: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Category" colors={colors}>
            <View style={styles.ledgerCategoryGrid}>
              {WHT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.ledgerCategoryBtn(colors),
                    { borderColor: cat.color },
                    inputs.category === cat.id && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setInputs({ ...inputs, category: cat.id })}
                >
                  <Text style={[styles.ledgerCategoryName(colors), inputs.category === cat.id && styles.ledgerCategoryNameActive(colors)]}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.ledgerCategoryRate(colors), inputs.category === cat.id && styles.ledgerCategoryRateActive(colors)]}>
                    {cat.rate}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LedgerRow>
          {result && (
            <>
              <LedgerRow label="WHT Rate" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{`${(result.whtRate * 100).toFixed(1)}%`}</Text>
              </LedgerRow>
              <LedgerRow label="Withholding Tax" highlight colors={colors}>
                <Text style={styles.ledgerValueHighlight(colors)}>{formatCurrency(result.withholdingTax)}</Text>
              </LedgerRow>
              <LedgerRow label="Net Payment" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{formatCurrency(result.netPayment)}</Text>
              </LedgerRow>
            </>
          )}
        </View>
      );
    }

    if (type === 'cgt') {
      return (
        <View style={styles.ledgerContainer}>
          <LedgerRow label="Disposal Proceeds" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.disposalProceeds || ''}
              onChangeText={(v) => setInputs({ ...inputs, disposalProceeds: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Cost Base" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.costBase || ''}
              onChangeText={(v) => setInputs({ ...inputs, costBase: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Allowable Expenses" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.expenses || ''}
              onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Salary Deduction" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.salary || ''}
              onChangeText={(v) => setInputs({ ...inputs, salary: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          {result && (
            <>
              <LedgerRow label="Chargeable Gain" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{formatCurrency(result.chargeableGain)}</Text>
              </LedgerRow>
              <LedgerRow label="CGT Rate" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{`${(result.cgtRate * 100).toFixed(1)}%`}</Text>
              </LedgerRow>
              <LedgerRow label="Capital Gains Tax" highlight colors={colors}>
                <Text style={styles.ledgerValueHighlight(colors)}>{formatCurrency(result.capitalGainsTax)}</Text>
              </LedgerRow>
            </>
          )}
        </View>
      );
    }

    if (type === 'cit') {
      return (
        <View style={styles.ledgerContainer}>
          <AppCard title="Revenue & Income" variant="default">
            <StandardInput
              label="Annual Turnover (Revenue)"
              icon="cash-multiple"
              value={inputs.revenue || ''}
              onChangeText={(v) => setInputs({ ...inputs, revenue: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </AppCard>

          <AppCard title="Operating Expenses" variant="default">
            <View style={{ gap: 12, marginBottom: 16 }}>
              {citExpenses.map((row, index) => (
                <View key={index} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.ledgerInput(colors), { flex: 2, textAlign: 'left' }]}
                    placeholder="Category (e.g. Rent)"
                    value={row.category}
                    onChangeText={(v) => updateExpenseRow(index, 'category', v)}
                  />
                  <TextInput
                    style={[styles.ledgerInput(colors), { flex: 1, textAlign: 'right' }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={row.amount}
                    onChangeText={(v) => updateExpenseRow(index, 'amount', v)}
                  />
                  <TouchableOpacity
                    onPress={() => removeExpenseRow(index)}
                    style={{ padding: 4 }}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error || '#ef4444'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.outline,
                borderRadius: 8,
                borderStyle: 'dashed',
                marginBottom: 16
              }}
              onPress={addExpenseRow}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Add Expense Category</Text>
            </TouchableOpacity>

            <View style={[styles.calcRow, { backgroundColor: colors.surfaceVariant, marginBottom: 16 }]}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Total Operating Expenses</Text>
              <Text style={[styles.calcValue, { color: colors.text, fontWeight: 'bold' }]}>
                {formatCurrency(citExpenses.reduce((sum, row) => sum + parseAmount(row.amount), 0))}
              </Text>
            </View>

            <StandardInput
              label="Staff Salaries"
              icon="account-group"
              value={inputs.salaries || ''}
              onChangeText={(v) => setInputs({ ...inputs, salaries: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Depreciation"
              icon="chart-cascade-down"
              value={inputs.depreciation || ''}
              onChangeText={(v) => setInputs({ ...inputs, depreciation: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <StandardInput
              label="Salary Deduction"
              icon="account-cash"
              value={inputs.salary || ''}
              onChangeText={(v) => setInputs({ ...inputs, salary: v })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </AppCard>

          {result && (
            <AppCard title="CIT Summary" variant="default" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxable Profit</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(result.taxableProfit)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Company Category</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{result.category}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Applicable Rate</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{result.taxRate}%</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.outline }]}>
                <Text style={[styles.summaryLabelHighlight, { color: colors.text, fontWeight: 'bold' }]}>Estimated CIT</Text>
                <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>{formatCurrency(result.citTax)}</Text>
              </View>
            </AppCard>
          )}
        </View>
      );
    }

    return null;
  };

  const renderTaxSavingTips = () => {
    if (!result || type !== 'paye') return null;
    const tips = getTaxSavingTips(result);
    if (tips.length === 0) return null;

    return (
      <AppCard title="Tax Saving Tips" variant="variant">
        {tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={[styles.tipLabel, { color: colors.text, fontWeight: '600' }]}>{tip.label}</Text>
            <Text style={[styles.tipValue, { color: colors.textSecondary }]}>{tip.value}</Text>
          </View>
        ))}
      </AppCard>
    );
  };

  const renderTaxInfo = () => {
    if (!taxInfo) return null;

    return (
      <AppCard title="Legal Reference" variant="default">
        <View>
          {type === 'paye' && taxInfo.brackets && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.infoSectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>⚖️ Tax Brackets (PITA 2007)</Text>
              {taxInfo.brackets.map((b, i) => (
                <View key={i} style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
                  <Text style={[styles.infoRange, { color: colors.text, ...TYPOGRAPHY.body }]}>{b.range}</Text>
                  <Text style={[styles.infoRate, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>{b.rate}</Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{b.description}</Text>
                </View>
              ))}
              {taxInfo.reliefs && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>🛡️ Available Reliefs</Text>
                  {taxInfo.reliefs.map((r, i) => (
                    <View key={i} style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
                      <Text style={[styles.infoRange, { color: colors.text, ...TYPOGRAPHY.body }]}>{r.name}</Text>
                      <Text style={[styles.infoDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {type === 'vat' && taxInfo.categories && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.infoSectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>📋 VAT Categories</Text>
              {taxInfo.categories.filter((c): c is { name: string; rate: string; items: string } => 'items' in c && 'rate' in c).map((c, i) => (
                <View key={i} style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
                  <View style={styles.infoLeft}>
                    <Text style={[styles.infoRange, { color: colors.text, ...TYPOGRAPHY.body }]}>{c.name}</Text>
                    <Text style={[styles.infoDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{c.items}</Text>
                  </View>
                  <Text style={[styles.infoRate, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>{c.rate}</Text>
                </View>
              ))}
            </View>
          )}

          {type === 'wht' && taxInfo.categories && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.infoSectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>📋 WHT Categories (PITA 2007)</Text>
              {taxInfo.categories.filter((c): c is { id: string; name: string; rate: string; description: string; legalRef?: string } => 'description' in c && 'rate' in c).map((c, i) => (
                <View key={i} style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
                  <View style={styles.infoLeft}>
                    <Text style={[styles.infoRange, { color: colors.text, ...TYPOGRAPHY.body }]}>{c.name}</Text>
                    <Text style={[styles.infoDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{c.description}</Text>
                    {c.legalRef && <Text style={[styles.legalRefText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>⚖️ {c.legalRef}</Text>}
                  </View>
                  <Text style={[styles.infoRate, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>{c.rate}</Text>
                </View>
              ))}
            </View>
          )}

          {type === 'cgt' && taxInfo.exemptions && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.infoSectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>📋 CGT Exemptions (CGT Act 1967)</Text>
              {taxInfo.exemptions.map((e, i) => (
                <View key={i} style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
                  <MaterialCommunityIcons name="minus-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.exemptionText, { color: colors.text, ...TYPOGRAPHY.body }]}>{e.name}: {e.description}</Text>
                </View>
              ))}
              {taxInfo.calculationNote && (
                <View style={[styles.noteBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary }]}>
                  <Text style={[styles.noteText, { color: colors.text, ...TYPOGRAPHY.body }]}>💡 {taxInfo.calculationNote}</Text>
                </View>
              )}
            </View>
          )}

          <Link href={`/tax-info/${type}`} style={[styles.lawRef, { color: colors.primary, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>
            📜 {taxInfo.law} (View Detailed Guide)
          </Link>
        </View>
      </AppCard>
    );
  };

  const getTaxSavingTips = (result: Record<string, any>): { label: string; value: string }[] => {
    const tips: { label: string; value: string }[] = [];
    const annualIncome = Number(result.annualIncome) || 0;
    const annualExpenses = Number(result.expenses) || 0;
    const taxableIncome = Number(result.taxableIncome) || 0;

    if (annualIncome > 0) {
      const potentialPensionContrib = Math.min(annualIncome * 0.2, 500000);
      if (potentialPensionContrib > annualExpenses) {
        tips.push({
          label: '💡 Pension Contribution',
          value: `You could deduct up to ₦${(potentialPensionContrib).toLocaleString()} (20% of income, max ₦500K) to reduce your tax`
        });
      }
    }

    if (annualIncome > 0) {
      tips.push({
        label: '🏥 NHIS Premium',
        value: 'Health insurance premiums are deductible. Ensure your NHIS contribution is documented.'
      });
    }

    if (annualIncome > 200000) {
      tips.push({
        label: '🛡️ Consolidated Relief',
        value: `Your CRA is ₦200,000 + 20% of gross income (₦${Math.min(annualIncome * 0.2, Infinity).toLocaleString()})`
      });
    }

    if (annualIncome > 0) {
      tips.push({
        label: '📋 Life Assurance',
        value: 'Life assurance premiums up to ₦1,000,000 are deductible. Keep your policy documents.'
      });
    }

    return tips;
  };

  return (
    <View style={styles.calculatorContainer(colors)}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo(colors)}>
          <View style={styles.infoHeaderRow}>
            <View>
              <Text style={styles.calculatorTitle(colors)}>{taxInfo?.title}</Text>
              <Text style={styles.calculatorSubtitle(colors)}>{taxInfo?.description}</Text>
            </View>
            {closestDeadline && (
              <View style={[styles.deadlineCountdown, { backgroundColor: getDeadlineColor(closestDeadline.status) + '30' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={getDeadlineColor(closestDeadline.status)} />
                <Text style={[styles.deadlineCountdownText, { color: getDeadlineColor(closestDeadline.status) }]}>
                  {closestDeadline.daysRemaining}d left
                </Text>
              </View>
            )}
          </View>
          <View style={styles.rateBadge(colors)}>
            <Text style={styles.rateBadgeText(colors)}>📈 {taxInfo?.rates}</Text>
          </View>
        </View>

        <View style={styles.calculatorCard(colors)}>{renderCalculatorTable()}</View>

        <TouchableOpacity
          style={[styles.calcBtn(colors), loading && styles.calcBtnDisabled(colors)]}
          onPress={handleCalculate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white || '#fff'} />
          ) : (
            <>
              <Text style={styles.calcBtnText(colors)}>Calculate</Text>
              <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={{ gap: 12, marginHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.calcBtn(colors), { backgroundColor: colors.primary }]}
              onPress={async () => {
                const uri = await handlePrintResult();
                if (uri) await Sharing.shareAsync(uri);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.calcBtnText(colors)}>Download PDF Report</Text>
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.calcBtn(colors), { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline }]}
                onPress={handleEmailResult}
                activeOpacity={0.8}
              >
                <Text style={[styles.calcBtnText(colors), { color: colors.text }]}>Email Report</Text>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.text} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calcBtn(colors), { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline }]}
                onPress={showCalculationLogic}
                activeOpacity={0.8}
              >
                <Text style={[styles.calcBtnText(colors), { color: colors.text }]}>Why this?</Text>
                <MaterialCommunityIcons name="help-circle" size={20} color={colors.text} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.calcBtn(colors), { backgroundColor: colors.success }]}
              onPress={() => Linking.openURL('https://www.nrs.gov.ng/taxpayer-services/self-service-portal')}
              activeOpacity={0.8}
            >
              <Text style={styles.calcBtnText(colors)}>Pay Your Tax Online</Text>
              <MaterialCommunityIcons name="credit-card-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {renderTaxSavingTips()}
        {renderTaxInfo()}

        {isSaving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText(colors)}>💾 Auto-saving...</Text>
          </View>
        )}

        {isRetrying && (
          <View style={styles.retryingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.retryingText(colors)}>Retrying connection...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.draftBtn(colors)}
          onPress={() => setShowDraftRecovery(true)}
        >
          <Text style={styles.draftBtnText(colors)}>📄 View Drafts</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <NetworkStatusBanner />

      <DraftRecovery
        taxType={type}
        visible={showDraftRecovery}
        onClose={() => setShowDraftRecovery(false)}
        onRecover={(draft) => {
          setInputs(draft.inputs);
          if (draft.lastResult) setResult(draft.lastResult as any);
        }}
      />
    </View>
  );
}

const styles = {
  calculatorContainer: (colors) => ({ flex: 1, backgroundColor: colors.background }),
  calculatorContent: { flex: 1 },
  calculatorInfo: (colors) => ({
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary,
    position: 'relative',
  }),
  infoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deadlineCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  deadlineCountdownText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  calculatorTitle: (colors) => ({ fontSize: 24, fontWeight: 'bold', color: colors.white || '#fff' }),
  calculatorSubtitle: (colors) => ({ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }),
  rateBadge: (colors) => ({
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  }),
  rateBadgeText: (colors) => ({ color: colors.white || '#fff', fontSize: 12, fontWeight: '500' }),
  calculatorCard: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 0,
    margin: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  }),
  calcBtn: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
  }),
  calcBtnDisabled: (colors) => ({ backgroundColor: colors.textSecondary }),
  calcBtnText: (colors) => ({ color: colors.white || '#fff', fontSize: 16, fontWeight: '600' }),
  calcBtnIcon: { fontSize: 18, marginLeft: 8 },
  infoSection: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  infoSectionTitle: (colors) => ({ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }),
  infoRow: (colors) => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  }),
  infoLeft: { flex: 1 },
  infoRange: (colors) => ({ fontSize: 13, fontWeight: '600', color: colors.text }),
  infoRate: (colors) => ({ fontSize: 13, fontWeight: '700', color: colors.primary, minWidth: 50 }),
  infoDesc: (colors) => ({ fontSize: 12, color: colors.textSecondary, marginTop: 2 }),
  legalRefText: (colors) => ({ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 }),
  lawRef: (colors) => ({ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', marginTop: 12 }),
  noteBox: (colors) => ({
    backgroundColor: colors.infoCardBg,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  }),
  noteText: (colors) => ({ fontSize: 12, color: colors.text, lineHeight: 18 }),
  tipsCard: (colors) => ({
    backgroundColor: colors.infoCardBg,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.warning,
  }),
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipsHeaderEmoji: { fontSize: 20, marginRight: 8 },
  tipsHeaderText: (colors) => ({ fontSize: 16, fontWeight: 'bold', color: colors.text }),
  tipRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tipLabel: (colors) => ({ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 }),
  tipValue: (colors) => ({ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }),
  savingIndicator: {
    textAlign: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
  },
  savingText: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  }),
  retryingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  retryingText: (colors) => ({
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
  }),
  draftBtn: (colors) => ({
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  }),
  draftBtnText: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
  }),
  bottomPadding: { height: 40 },

  // Ledger Styles
  ledgerContainer: { padding: 16 },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  ledgerRowCalc: (colors) => ({
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    borderRadius: 4,
  }),
  ledgerRowHighlight: (colors) => ({
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  }),
  ledgerLabel: (colors) => ({
    fontSize: 14,
    color: colors.text,
    fontWeights: '500',
  }),
  ledgerLabelCalc: (colors) => ({
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  }),
  ledgerLabelHighlight: (colors) => ({
    fontSize: 16,
    color: colors.white || '#fff',
    fontWeight: 'bold',
  }),
  ledgerValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerInput: (colors) => ({
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    width: 120,
    textAlign: 'right',
  }),
  ledgerValue: (colors) => ({
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  }),
  ledgerValueHighlight: (colors) => ({
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white || '#fff',
    textAlign: 'right',
  }),
  ledgerToggle: (colors) => ({
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  ledgerToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ledgerToggleActive: (colors) => ({
    backgroundColor: colors.primary,
  }),
  ledgerToggleText: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
  }),
  ledgerToggleTextActive: (colors) => ({
    color: colors.white || '#fff',
  }),
  ledgerSmeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rateTableBtn: (colors) => ({
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  }),
  rateTableBtnText: (colors) => ({
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  }),
  vatExpandableTable: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
  }),
  vatTableHeader: (colors) => ({
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }),
  vatTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vatTabBtnActive: (colors) => ({
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  }),
  vatTabText: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
  vatTabTextActive: (colors) => ({
    color: colors.primary,
    fontWeight: '700',
  }),
  vatTableRow: (colors) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  }),
  vatRowName: (colors) => ({
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  }),
  vatRowNameActive: (colors) => ({
    color: colors.primary,
    fontWeight: '700',
  }),
  vatRowDesc: (colors) => ({
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  }),
  vatRowRate: (colors) => ({
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  }),
  vatRowRateActive: (colors) => ({
    color: colors.primary,
    fontWeight: '700',
  }),
  ledgerCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  ledgerCategoryBtn: (colors) => ({
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  }),
  ledgerCategoryName: (colors) => ({
    fontSize: 11,
    color: colors.text,
  }),
  ledgerCategoryNameActive: (colors) => ({
    color: '#fff',
    fontWeight: '600',
  }),
  ledgerCategoryRate: (colors) => ({
    fontSize: 10,
    color: colors.textSecondary,
  }),
  ledgerCategoryRateActive: (colors) => ({
    color: 'rgba(255,255,255,0.8)',
  }),
};
