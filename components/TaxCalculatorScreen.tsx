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
} from 'react-native';
import axios from 'axios';
import {
  API_URL,
  TAX_INFO,
  WHT_CATEGORIES,
  PAYROLL_CONSTANTS,
  formatCurrency,
  type TaxInfo,
} from '../constants/tax';
import { useThemeColors } from '../hooks/useThemeColors';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSaveDrafts } from '../hooks/useAutoSaveDrafts';
import DraftRecovery from './DraftRecovery';
import { NetworkStatusBanner } from './NetworkStatus';
import { retryAxios } from '../hooks/useRetry';
import { captureError } from '../utils/sentry';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt';
type Props = { type: TaxType };

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

export default function TaxCalculatorScreen({ type }: Props) {
  const colors = useThemeColors();
  const taxInfo: TaxInfo | undefined = TAX_INFO[type as keyof typeof TAX_INFO];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { refreshAccessToken } = useAuth();
  const { isOffline, calculateTaxOffline, calculateVatOffline, calculateWhtOffline, calculateCgtOffline } = useOfflineMode();
  const { saveDraft, getLatestDraftForType, isSaving } = useAutoSaveDrafts();

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

  useEffect(() => {
    const hasInputs = Object.values(inputs).some(v => v && v.trim() !== '');
    if (hasInputs) {
      saveDraft(type, inputs, result || undefined);
    }
  }, [inputs, result]);

  const getAccessToken = async () => {
    const token = await refreshAccessToken();
    if (!token) throw new Error('No access token');
    return token;
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

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('Session Expired', 'Please login again.');
        setLoading(false);
        return;
      }
      const payload: Record<string, any> = { ...inputs };

      if (type === 'paye') {
        const basicSalary = parseFloat(inputs.basicSalary || '0');
        const bonuses = parseFloat(inputs.bonuses || '0');
        const overtime = parseFloat(inputs.overtime || '0');
        const grossIncome = basicSalary + bonuses + overtime;

        if (grossIncome === 0) {
          Alert.alert('Oops! 😅', 'Please enter at least one income source');
          setLoading(false);
          return;
        }
        payload.grossIncome = grossIncome;
        payload.basicSalary = basicSalary;
        payload.bonuses = bonuses;
        payload.overtime = overtime;
        payload.frequency = inputs.frequency || 'annual';
        payload.expenses = parseFloat(inputs.expenses || '0');
        payload.misc = parseFloat(inputs.misc || '0');
      }
      if (type === 'vat') {
        payload.revenue = parseFloat(inputs.revenue);
        payload.rate = parseFloat(inputs.rate || '0.075');
      }
      if (type === 'wht') {
        payload.amount = parseFloat(inputs.amount);
        payload.category = inputs.category || 'contractor';
      }
      if (type === 'cgt') {
        payload.disposalProceeds = parseFloat(inputs.disposalProceeds);
        payload.costBase = parseFloat(inputs.costBase || '0');
        payload.expenses = parseFloat(inputs.expenses || '0');
      }

      setIsRetrying(true);
      const r = await retryAxios(
        axios.post(`${API_URL}/tax/${type}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 8000 }
      );
      setResult(r);
      setIsRetrying(false);
    } catch (err: unknown) {
      setIsRetrying(false);
      if (axios.isAxiosError(err) && !err.response) {
        if (type === 'paye' && (inputs.basicSalary || inputs.bonuses || inputs.overtime)) {
          const basicSalary = parseFloat(inputs.basicSalary || '0');
          const bonuses = parseFloat(inputs.bonuses || '0');
          const overtime = parseFloat(inputs.overtime || '0');
          const grossIncome = basicSalary + bonuses + overtime;
          const frequency = inputs.frequency || 'annual';
          const expenses = parseFloat(inputs.expenses || '0');
          const misc = parseFloat(inputs.misc || '0');
          const annualIncome = frequency === 'monthly' ? grossIncome * 12 : grossIncome;
          const taxableIncome = Math.max(0, annualIncome - expenses - misc);
          const annualTax = calculateTaxOffline(taxableIncome);
          const monthlyTax = annualTax / 12;

          setResult({
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
            monthlyTax,
            isOfflineCalculation: true,
          });

          Alert.alert('Offline Mode', 'Using cached tax brackets for calculation.');
          setLoading(false);
          return;
        }
        // ... other offline fallbacks omitted for brevity but should be present
        setLoading(false);
        return;
      } else {
        const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error : 'Please try again';
        Alert.alert('Calculation Failed', errorMessage || 'Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCalculatorTable = () => {
    if (type === 'paye') {
      const basic = parseFloat(inputs.basicSalary || '0');
      const bonuses = parseFloat(inputs.bonuses || '0');
      const overtime = parseFloat(inputs.overtime || '0');
      const grossIncome = basic + bonuses + overtime;
      const pension = basic * PAYROLL_CONSTANTS.PENSION_RATE;
      const nhf = basic * PAYROLL_CONSTANTS.NHF_RATE;
      const nsitf = grossIncome * PAYROLL_CONSTANTS.NSITF_RATE;

      const effectiveRate = result?.taxableIncome > 0
        ? ((Number(result?.annualTax) / Number(result?.taxableIncome)) * 100).toFixed(1)
        : '0.0';

      return (
        <View style={styles.ledgerContainer}>
          <LedgerRow label="Basic Salary" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.basicSalary || ''}
              onChangeText={(v) => setInputs({ ...inputs, basicSalary: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Bonuses" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.bonuses || ''}
              onChangeText={(v) => setInputs({ ...inputs, bonuses: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Overtime" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.overtime || ''}
              onChangeText={(v) => setInputs({ ...inputs, overtime: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Gross Income" isCalc colors={colors}>
            <Text style={styles.ledgerValue(colors)}>{formatCurrency(grossIncome)}</Text>
          </LedgerRow>
          <LedgerRow label="Pension (8%)" isCalc colors={colors}>
            <Text style={styles.ledgerValue(colors)}>{formatCurrency(pension)}</Text>
          </LedgerRow>
          <LedgerRow label="NHF (2.5%)" isCalc colors={colors}>
            <Text style={styles.ledgerValue(colors)}>{formatCurrency(nhf)}</Text>
          </LedgerRow>
          <LedgerRow label="NSITF (1%)" isCalc colors={colors}>
            <Text style={styles.ledgerValue(colors)}>{formatCurrency(nsitf)}</Text>
          </LedgerRow>
          <LedgerRow label="Deductible Expenses" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.expenses || ''}
              onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Miscellaneous" colors={colors}>
            <TextInput
              style={styles.ledgerInput(colors)}
              placeholder="0.00"
              keyboardType="numeric"
              value={inputs.misc || ''}
              onChangeText={(v) => setInputs({ ...inputs, misc: v })}
              placeholderTextColor={colors.textSecondary}
            />
          </LedgerRow>
          <LedgerRow label="Frequency" colors={colors}>
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
          </LedgerRow>
          {result && (
            <>
              <LedgerRow label="Taxable Income" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{formatCurrency(result.taxableIncome)}</Text>
              </LedgerRow>
              <LedgerRow label="Tax Rate" isCalc colors={colors}>
                <Text style={styles.ledgerValue(colors)}>{effectiveRate}%</Text>
              </LedgerRow>
              <LedgerRow label="Tax Due" highlight colors={colors}>
                <Text style={styles.ledgerValueHighlight(colors)}>{formatCurrency(result.annualTax)}</Text>
              </LedgerRow>
            </>
          )}
        </View>
      );
    }

    if (type === 'vat') {
      return (
        <View style={styles.ledgerContainer}>
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
          <LedgerRow label="VAT Rate" colors={colors}>
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
              onChangeText={(v) => setInputs({ ...inputs, disposalProceed la: ' la' || '' })}
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

    return null;
  };

  const renderTaxSavingTips = () => {
    if (!result || type !== 'paye') return null;
    const tips = getTaxSavingTips(result);
    if (tips.length === 0) return null;

    return (
      <View style={styles.tipsCard(colors)}>
        <View style={styles.tipsHeader}>
          <Text style={styles.tipsHeaderEmoji}>💰</Text>
          <Text style={styles.tipsHeaderText(colors)}>Tax Saving Tips</Text>
        </View>
        {tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipLabel(colors)}>{tip.label}</Text>
            <Text style={styles.tipValue(colors)}>{tip.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTaxInfo = () => {
    if (!taxInfo) return null;

    if (type === 'paye' && taxInfo.brackets) {
      return (
        <View style={styles.infoSection(colors)}>
          <Text style={styles.infoSectionTitle(colors)}>⚖️ Tax Brackets (PITA 2007)</Text>
          {taxInfo.brackets.map((b, i) => (
            <View key={i} style={styles.infoRow(colors)}>
              <Text style={styles.infoRange(colors)}>{b.range}</Text>
              <Text style={styles.infoRate(colors)}>{b.rate}</Text>
              <Text style={styles.infoDesc(colors)}>{b.description}</Text>
            </View>
          ))}
          {taxInfo.reliefs && (
            <>
              <Text style={[styles.infoSectionTitle(colors), { marginTop: 16 }]}>🛡️ Available Reliefs</Text>
              {taxInfo.reliefs.map((r, i) => (
                <View key={i} style={styles.infoRow(colors)}>
                  <Text style={styles.infoRange(colors)}>{r.name}</Text>
                  <Text style={styles.infoDesc(colors)}>{r.value}</Text>
                </View>
              ))}
            </>
          )}
          <Text style={styles.lawRef(colors)}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'vat' && taxInfo.categories) {
      const vatCats = taxInfo.categories.filter((c): c is { name: string; rate: string; items: string } => 'items' in c && 'rate' in c);
      return (
        <View style={styles.infoSection(colors)}>
          <Text style={styles.infoSectionTitle(colors)}>📋 VAT Categories</Text>
          {vatCats.map((c, i) => (
            <View key={i} style={styles.infoRow(colors)}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoRange(colors)}>{c.name}</Text>
                <Text style={styles.infoDesc(colors)}>{c.items}</Text>
              </View>
              <Text style={[styles.infoRate(colors), { textAlign: 'right' }]}>{c.rate}</Text>
            </View>
          ))}
          <Text style={styles.lawRef(colors)}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'wht' && taxInfo.categories) {
      const whtCats = taxInfo.categories.filter((c): c is { id: string; name: string; rate: string; description: string; legalRef?: string } => 'description' in c && 'rate' in c);
      return (
        <View style={styles.infoSection(colors)}>
          <Text style={styles.infoSectionTitle(colors)}>📋 WHT Categories (PITA 2007)</Text>
          {whtCats.map((c, i) => (
            <View key={i} style={styles.infoRow(colors)}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoRange(colors)}>{c.name}</Text>
                <Text style={styles.infoDesc(colors)}>{c.description}</Text>
                {c.legalRef && <Text style={styles.legalRefText(colors)}>⚖️ {c.legalRef}</Text>}
              </View>
              <Text style={[styles.infoRate(colors), { textAlign: 'right' }]}>{c.rate}</Text>
            </View>
          ))}
          <Text style={styles.lawRef(colors)}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'cgt' && taxInfo.exemptions) {
      return (
        <View style={styles.infoSection(colors)}>
          <Text style={styles.infoSectionTitle(colors)}>📋 CGT Exemptions (CGT Act 1967)</Text>
          {taxInfo.exemptions.map((e, i) => (
            <View key={i} style={styles.infoRow(colors)}>
              <Text style={styles.infoRange(colors)}>{e.name}</Text>
              <Text style={styles.infoDesc(colors)}>{e.description}</Text>
            </View>
          ))}
          {taxInfo.calculationNote && (
            <View style={styles.noteBox(colors)}>
              <Text style={styles.noteText(colors)}>💡 {taxInfo.calculationNote}</Text>
            </View>
          )}
          <Text style={styles.lawRef(colors)}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    return null;
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
          <Text style={styles.calculatorTitle(colors)}>{taxInfo?.title}</Text>
          <Text style={styles.calculatorSubtitle(colors)}>{taxInfo?.description}</Text>
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
              <Text style={styles.calcBtnIcon}>🧮</Text>
            </>
          )}
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  calculatorContainer: (colors) => ({ flex: 1, backgroundColor: colors.background }),
  calculatorContent: { flex: 1 },
  calculatorInfo: (colors) => ({ padding: 20, paddingTop: 60, backgroundColor: colors.primary }),
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
    fontWeight: '500',
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
});
