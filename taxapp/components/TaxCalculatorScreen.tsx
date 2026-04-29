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
  COLORS,
  TAX_INFO,
  WHT_CATEGORIES,
  formatCurrency,
  type TaxInfo,
} from '../constants/tax';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSaveDrafts } from '../hooks/useAutoSaveDrafts';
import DraftRecovery from './DraftRecovery';
import { NetworkStatusBanner } from './NetworkStatus';
import { retryAxios } from '../hooks/useRetry';
import { captureError } from '../utils/sentry';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt';
type Props = { type: TaxType };

export default function TaxCalculatorScreen({ type }: Props) {
  const taxInfo: TaxInfo | undefined = TAX_INFO[type as keyof typeof TAX_INFO];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { refreshAccessToken } = useAuth();
  const { isOffline, calculateTaxOffline, calculateVatOffline, calculateWhtOffline, calculateCgtOffline } = useOfflineMode();
  const { saveDraft, getLatestDraftForType, isSaving } = useAutoSaveDrafts();

  // Check for existing draft on mount
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

  // Auto-save on input change
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
    if (type === 'paye' && !inputs.grossIncome) {
      Alert.alert('Oops! 😅', 'Please enter your gross income');
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
        payload.grossIncome = parseFloat(inputs.grossIncome);
        payload.frequency = inputs.frequency || 'annual';
        payload.expenses = parseFloat(inputs.expenses || '0');
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
        // Offline or network error - use offline calculation
        if (type === 'paye' && inputs.grossIncome) {
          const grossIncome = parseFloat(inputs.grossIncome);
          const frequency = inputs.frequency || 'annual';
          const expenses = parseFloat(inputs.expenses || '0');
          const annualIncome = frequency === 'monthly' ? grossIncome * 12 : grossIncome;
          const taxableIncome = Math.max(0, annualIncome - expenses);
          const annualTax = calculateTaxOffline(taxableIncome);
          const monthlyTax = annualTax / 12;

          setResult({
            grossIncome,
            frequency,
            expenses,
            taxableIncome,
            annualIncome,
            annualTax,
            monthlyTax,
            isOfflineCalculation: true,
          });

          Alert.alert(
            'Offline Mode',
            'Using cached tax brackets for calculation. Results may differ from server.'
          );
          setLoading(false);
          return;
        }
        if (type === 'vat' && inputs.revenue) {
          const revenue = parseFloat(inputs.revenue);
          const rate = parseFloat(inputs.rate || '0.075');
          const { vatAmount, netAmount } = calculateVatOffline(revenue, rate);

          setResult({
            revenue,
            vatRate: rate,
            vatAmount,
            netAmount,
            isOfflineCalculation: true,
          });

          Alert.alert(
            'Offline Mode',
            'Using cached VAT rate for calculation. Results may differ from server.'
          );
          setLoading(false);
          return;
        }
        if (type === 'wht' && inputs.amount) {
          const amount = parseFloat(inputs.amount);
          const category = inputs.category || 'contractor';
          const { withholdingTax, netPayment } = calculateWhtOffline(amount, category);
          const whtRate = category === 'contractor' || category === 'professional' ? 0.05 :
                         category === 'dividend' || category === 'rent' || category === 'interest' || category === 'director' ? 0.10 : 0.15;

          setResult({
            grossAmount: amount,
            category,
            whtRate,
            withholdingTax,
            netPayment,
            isOfflineCalculation: true,
          });

          Alert.alert(
            'Offline Mode',
            'Using cached WHT rates for calculation. Results may differ from server.'
          );
          setLoading(false);
          return;
        }
        if (type === 'cgt' && inputs.disposalProceeds) {
          const disposalProceeds = parseFloat(inputs.disposalProceeds);
          const costBase = parseFloat(inputs.costBase || '0');
          const expenses = parseFloat(inputs.expenses || '0');
          const { chargeableGain, capitalGainsTax } = calculateCgtOffline(disposalProceeds, costBase, expenses);

          setResult({
            disposalProceeds,
            costBase,
            allowableExpenses: expenses,
            chargeableGain,
            cgtRate: 0.10,
            capitalGainsTax,
            isOfflineCalculation: true,
          });

          Alert.alert(
            'Offline Mode',
            'Using cached CGT rates for calculation. Results may differ from server.'
          );
          setLoading(false);
          return;
        }
        Alert.alert('Connection Error', 'Unable to reach the server. Please check your internet connection.');
      } else {
        const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error : 'Please try again';
        Alert.alert('Calculation Failed', errorMessage || 'Please try again');
        if (err instanceof Error) {
          captureError(err, { taxType: type, inputs: Object.keys(inputs) });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = () => {
    switch (type) {
      case 'paye':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💰 Gross Income</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.grossIncome || ''}
                  onChangeText={(v) => setInputs({ ...inputs, grossIncome: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📅 Frequency</Text>
              <View style={styles.toggleContainer}>
                {['monthly', 'annual'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.toggleBtn, inputs.frequency === f && styles.toggleActive]}
                    onPress={() => setInputs({ ...inputs, frequency: f })}
                  >
                    <Text style={[styles.toggleText, inputs.frequency === f && styles.toggleTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📋 Deductible Expenses (Optional)</Text>
              <Text style={styles.inputHint}>Pension contributions, insurance premiums, etc.</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.expenses || ''}
                  onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
          </>
        );

      case 'vat':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Revenue</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.revenue || ''}
                  onChangeText={(v) => setInputs({ ...inputs, revenue: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📊 VAT Rate</Text>
              <View style={styles.toggleContainer}>
                {['0.075', '0.10', '0.20'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.toggleBtn, inputs.rate === r && styles.toggleActive]}
                    onPress={() => setInputs({ ...inputs, rate: r })}
                  >
                    <Text style={[styles.toggleText, inputs.rate === r && styles.toggleTextActive]}>
                      {(parseFloat(r) * 100).toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case 'wht':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Amount</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={inputs.amount || ''}
                  onChangeText={(v) => setInputs({ ...inputs, amount: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📁 Category</Text>
              <View style={styles.categoryGrid}>
                {WHT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      { borderColor: cat.color },
                      inputs.category === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setInputs({ ...inputs, category: cat.id })}
                  >
                    <Text
                      style={[
                        styles.categoryName,
                        inputs.category === cat.id && styles.categoryNameActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      style={[
                        styles.categoryRate,
                        inputs.category === cat.id && styles.categoryRateActive,
                      ]}
                    >
                      {cat.rate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case 'cgt':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Disposal Proceeds</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Amount realized"
                  keyboardType="numeric"
                  value={inputs.disposalProceeds || ''}
                  onChangeText={(v) => setInputs({ ...inputs, disposalProceeds: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏷️ Cost Base</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Original cost"
                  keyboardType="numeric"
                  value={inputs.costBase || ''}
                  onChangeText={(v) => setInputs({ ...inputs, costBase: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📋 Allowable Expenses</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₦</Text>
                <TextInput
                  style={styles.inputWithPrefix}
                  placeholder="Selling expenses"
                  keyboardType="numeric"
                  value={inputs.expenses || ''}
                  onChangeText={(v) => setInputs({ ...inputs, expenses: v })}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!result) return null;

    let rows: { label: string; value: string; highlight?: boolean }[] = [];
    if (type === 'paye') {
      const effectiveRate = result.taxableIncome > 0
        ? ((Number(result.annualTax) / Number(result.taxableIncome)) * 100).toFixed(1)
        : '0.0';
      rows = [
        { label: 'Gross Income', value: formatCurrency(result.grossIncome), highlight: false },
        { label: 'Frequency', value: result.frequency === 'monthly' ? 'Monthly' : 'Annual', highlight: false },
        { label: 'Annual Gross', value: formatCurrency(result.annualIncome), highlight: true },
        { label: 'Deductible Expenses', value: formatCurrency(result.expenses), highlight: false },
        { label: 'Taxable Income', value: formatCurrency(result.taxableIncome), highlight: true },
        { label: 'Annual Tax', value: formatCurrency(result.annualTax), highlight: true },
        { label: 'Monthly Tax', value: formatCurrency(result.monthlyTax) },
        { label: 'Effective Rate', value: `${effectiveRate}%` },
      ];
      if (result.isOfflineCalculation) {
        rows.push({ label: 'Mode', value: 'Offline (cached brackets)', highlight: false });
      }
    } else if (type === 'vat') {
      rows = [
        { label: 'Revenue', value: formatCurrency(result.revenue) },
        { label: 'VAT Rate', value: `${result.vatRate * 100}%` },
        { label: 'VAT Amount', value: formatCurrency(result.vatAmount), highlight: true },
        { label: 'Net Amount', value: formatCurrency(result.netAmount) },
      ];
    } else if (type === 'wht') {
      rows = [
        { label: 'Category', value: result.category },
        { label: 'Gross Amount', value: formatCurrency(result.grossAmount) },
        { label: 'WHT Rate', value: `${result.whtRate * 100}%` },
        { label: 'Withholding Tax', value: formatCurrency(result.withholdingTax), highlight: true },
        { label: 'Net Payment', value: formatCurrency(result.netPayment) },
      ];
    } else if (type === 'cgt') {
      rows = [
        { label: 'Disposal Proceeds', value: formatCurrency(result.disposalProceeds) },
        { label: 'Cost Base', value: formatCurrency(result.costBase) },
        { label: 'Allowable Expenses', value: formatCurrency(result.allowableExpenses) },
        { label: 'Chargeable Gain', value: formatCurrency(result.chargeableGain) },
        { label: 'CGT Rate', value: `${result.cgtRate * 100}%` },
        { label: 'Capital Gains Tax', value: formatCurrency(result.capitalGainsTax), highlight: true },
      ];
    }

    // Generate tax saving tips for PAYE
    if (type === 'paye' && result.annualIncome) {
      const tips = getTaxSavingTips(result);
      if (tips.length > 0) {
        taxTipsRows = tips;
      }
    }

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultHeaderEmoji}>🎉</Text>
          <Text style={styles.resultHeaderText}>Calculation Complete!</Text>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.resultRow, row.highlight && styles.resultRowHighlight]}>
            <Text style={styles.resultLabel}>{row.label}</Text>
            <Text style={[styles.resultValue, row.highlight && styles.resultValueHighlight]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const getTaxSavingTips = (result: Record<string, any>): { label: string; value: string }[] => {
    const tips: { label: string; value: string }[] = [];
    const annualIncome = Number(result.annualIncome) || 0;
    const annualExpenses = Number(result.expenses) || 0;
    const taxableIncome = Number(result.taxableIncome) || 0;

    // Pension tip
    if (annualIncome > 0) {
      const potentialPensionContrib = Math.min(annualIncome * 0.2, 500000);
      if (potentialPensionContrib > annualExpenses) {
        tips.push({
          label: '💡 Pension Contribution',
          value: `You could deduct up to ₦${(potentialPensionContrib).toLocaleString()} (20% of income, max ₦500K) to reduce your tax`
        });
      }
    }

    // NHIS tip
    if (annualIncome > 0) {
      tips.push({
        label: '🏥 NHIS Premium',
        value: 'Health insurance premiums are deductible. Ensure your NHIS contribution is documented.'
      });
    }

    // CRA tip
    if (annualIncome > 200000) {
      tips.push({
        label: '🛡️ Consolidated Relief',
        value: `Your CRA is ₦200,000 + 20% of gross income (₦${Math.min(annualIncome * 0.2, Infinity).toLocaleString()})`
      });
    }

    // Life assurance tip
    if (annualIncome > 0) {
      tips.push({
        label: '📋 Life Assurance',
        value: 'Life assurance premiums up to ₦1,000,000 are deductible. Keep your policy documents.'
      });
    }

    return tips;
  };

  let taxTipsRows: { label: string; value: string }[] = [];

  const renderTaxSavingTips = () => {
    if (!result || type !== 'paye' || taxTipsRows.length === 0) return null;

    return (
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Text style={styles.tipsHeaderEmoji}>💰</Text>
          <Text style={styles.tipsHeaderText}>Tax Saving Tips</Text>
        </View>
        {taxTipsRows.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipLabel}>{tip.label}</Text>
            <Text style={styles.tipValue}>{tip.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTaxInfo = () => {
    if (!taxInfo) return null;

    if (type === 'paye' && taxInfo.brackets) {
      return (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>⚖️ Tax Brackets (PITA 2007)</Text>
          {taxInfo.brackets.map((b, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoRange}>{b.range}</Text>
              <Text style={styles.infoRate}>{b.rate}</Text>
              <Text style={styles.infoDesc}>{b.description}</Text>
            </View>
          ))}
          {taxInfo.reliefs && (
            <>
              <Text style={[styles.infoSectionTitle, { marginTop: 16 }]}>🛡️ Available Reliefs</Text>
              {taxInfo.reliefs.map((r, i) => (
                <View key={i} style={styles.infoRow}>
                  <Text style={styles.infoRange}>{r.name}</Text>
                  <Text style={styles.infoDesc}>{r.value}</Text>
                </View>
              ))}
            </>
          )}
          <Text style={styles.lawRef}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'vat' && taxInfo.categories) {
      const vatCats = taxInfo.categories.filter((c): c is { name: string; rate: string; items: string } => 'items' in c && 'rate' in c);
      return (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>📋 VAT Categories</Text>
          {vatCats.map((c, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoRange}>{c.name}</Text>
                <Text style={styles.infoDesc}>{c.items}</Text>
              </View>
              <Text style={[styles.infoRate, { textAlign: 'right' }]}>{c.rate}</Text>
            </View>
          ))}
          <Text style={styles.lawRef}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'wht' && taxInfo.categories) {
      const whtCats = taxInfo.categories.filter((c): c is { id: string; name: string; rate: string; description: string; legalRef?: string } => 'description' in c && 'rate' in c);
      return (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>📋 WHT Categories (PITA 2007)</Text>
          {whtCats.map((c, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoRange}>{c.name}</Text>
                <Text style={styles.infoDesc}>{c.description}</Text>
                {c.legalRef && <Text style={styles.legalRefText}>⚖️ {c.legalRef}</Text>}
              </View>
              <Text style={[styles.infoRate, { textAlign: 'right' }]}>{c.rate}</Text>
            </View>
          ))}
          <Text style={styles.lawRef}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    if (type === 'cgt' && taxInfo.exemptions) {
      return (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>📋 CGT Exemptions (CGT Act 1967)</Text>
          {taxInfo.exemptions.map((e, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoRange}>{e.name}</Text>
              <Text style={styles.infoDesc}>{e.description}</Text>
            </View>
          ))}
          {taxInfo.calculationNote && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>💡 {taxInfo.calculationNote}</Text>
            </View>
          )}
          <Text style={styles.lawRef}>📜 {taxInfo.law}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.calculatorContainer}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo}>
          <Text style={styles.calculatorTitle}>{taxInfo?.title}</Text>
          <Text style={styles.calculatorSubtitle}>{taxInfo?.description}</Text>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>📈 {taxInfo?.rates}</Text>
          </View>
        </View>

        <View style={styles.calculatorCard}>{renderInputs()}</View>

        <TouchableOpacity
          style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
          onPress={handleCalculate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.calcBtnText}>Calculate</Text>
              <Text style={styles.calcBtnIcon}>🧮</Text>
            </>
          )}
        </TouchableOpacity>

        {renderResults()}

        {renderTaxSavingTips()}

        {renderTaxInfo()}

        {isSaving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText}>💾 Auto-saving...</Text>
          </View>
        )}

        {isRetrying && (
          <View style={styles.retryingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.retryingText}>Retrying connection...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => setShowDraftRecovery(true)}
        >
          <Text style={styles.draftBtnText}>📄 View Drafts</Text>
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
  calculatorContainer: { flex: 1, backgroundColor: COLORS.light },
  calculatorContent: { flex: 1 },
  calculatorInfo: { padding: 20, paddingTop: 60, backgroundColor: COLORS.primary },
  calculatorTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  calculatorSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  rateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  rateBadgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  calculatorCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    margin: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: COLORS.dark, fontWeight: '500', marginBottom: 8 },
  inputHint: { fontSize: 12, color: COLORS.gray, marginTop: -4, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 12,
  },
  inputPrefix: { fontSize: 16, color: COLORS.gray },
  inputWithPrefix: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.dark },
  toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.light, borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, fontWeight: '500', color: COLORS.gray },
  toggleTextActive: { color: '#fff' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryName: { fontSize: 13, color: COLORS.dark },
  categoryNameActive: { color: '#fff', fontWeight: '500' },
  categoryRate: { fontSize: 11, color: COLORS.gray, marginLeft: 6 },
  categoryRateActive: { color: 'rgba(255,255,255,0.8)' },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
  },
  calcBtnDisabled: { backgroundColor: COLORS.gray },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  calcBtnIcon: { fontSize: 18, marginLeft: 8 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 16,
    marginTop: 0,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultHeaderEmoji: { fontSize: 24, marginRight: 8 },
  resultHeaderText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  resultRowHighlight: {
    backgroundColor: '#F0FFF4',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  resultLabel: { fontSize: 14, color: COLORS.gray },
  resultValue: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  resultValueHighlight: { fontSize: 18, color: COLORS.success, fontWeight: 'bold' },
  bottomPadding: { height: 40 },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  infoSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    gap: 8,
  },
  infoLeft: { flex: 1 },
  infoRange: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  infoRate: { fontSize: 13, fontWeight: '700', color: COLORS.primary, minWidth: 50 },
  infoDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  legalRefText: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic', marginTop: 2 },
  lawRef: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic', marginTop: 12 },
  noteBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  noteText: { fontSize: 12, color: COLORS.dark, lineHeight: 18 },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipsHeaderEmoji: { fontSize: 20, marginRight: 8 },
  tipsHeaderText: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  tipRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tipLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 2 },
  tipValue: { fontSize: 12, color: COLORS.gray, lineHeight: 16 },
  savingIndicator: {
    textAlign: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
  },
  savingText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  retryingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  retryingText: {
    fontSize: 12,
    color: COLORS.warning,
    textAlign: 'center',
  },
  draftBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  draftBtnText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
