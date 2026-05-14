import React, { useState } from 'react';
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
import { useThemeColors } from '../../hooks/useThemeColors';
import { API_URL, formatCurrency } from '../../constants/tax';
import { useAuth } from '../../contexts/AuthContext';
import NigeriaMap from '../../components/NigeriaMap';

export default function SummaryScreen() {
  const colors = useThemeColors();
  const { refreshAccessToken } = useAuth();
  const [grossIncome, setGrossIncome] = useState('');
  const [revenue, setRevenue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getSummary = async () => {
    if (!grossIncome && !revenue) {
      Alert.alert('Oops! 😅', 'Please enter at least one value');
      return;
    }
    setLoading(true);
    try {
      const token = await refreshAccessToken();
      const r = await axios.post(
        `${API_URL}/tax/summary`,
        { grossIncome: parseFloat(grossIncome) || 0, revenue: parseFloat(revenue) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err: any) {
      Alert.alert('Error 😔', err.response?.data?.error || 'Summary failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.calculatorContainer(colors)}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo(colors)}>
          <Text style={styles.calculatorTitle(colors)}>📊 Tax Summary</Text>
          <Text style={styles.calculatorSubtitle(colors)}>Get an overview of your estimated tax liabilities</Text>
        </View>

        {/* Nigeria Map Section */}
        <View style={styles.mapSection(colors)}>
          <NigeriaMap showRegions={true} />
        </View>

        <View style={styles.calculatorCard(colors)}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel(colors)}>💼 Annual Gross Income (PAYE)</Text>
            <View style={styles.inputWrapper(colors)}>
              <Text style={styles.inputPrefix(colors)}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix(colors)}
                placeholder="0.00"
                keyboardType="numeric"
                value={grossIncome}
                onChangeText={setGrossIncome}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel(colors)}>💰 Annual Revenue (VAT)</Text>
            <View style={styles.inputWrapper(colors)}>
              <Text style={styles.inputPrefix(colors)}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix(colors)}
                placeholder="0.00"
                keyboardType="numeric"
                value={revenue}
                onChangeText={setRevenue}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calcBtn(colors), loading && styles.calcBtnDisabled(colors)]}
            onPress={getSummary}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Text style={styles.calcBtnText(colors)}>Get Summary</Text>
                <Text style={styles.calcBtnIcon}>📊</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard(colors)}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderEmoji}>📋</Text>
              <Text style={styles.resultHeaderText(colors)}>Your Tax Breakdown</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel(colors)}>PAYE Tax</Text>
              <Text style={styles.resultValue(colors)}>{formatCurrency(result.breakdown?.paye || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel(colors)}>VAT</Text>
              <Text style={styles.resultValue(colors)}>{formatCurrency(result.breakdown?.vat || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel(colors)}>Withholding Tax</Text>
              <Text style={styles.resultValue(colors)}>{formatCurrency(result.breakdown?.wht || 0)}</Text>
            </View>
            <View style={[styles.resultRow, styles.totalRow(colors)]}>
              <Text style={styles.totalLabel(colors)}>Total Estimated Tax</Text>
              <Text style={styles.totalValue(colors)}>{formatCurrency(result.totalEstimatedTax)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calculatorContainer: (colors) => ({ flex: 1, backgroundColor: colors.background }),
  calculatorContent: { flex: 1 },
  calculatorInfo: (colors) => ({ padding: 20, paddingTop: 60, backgroundColor: colors.primary }),
  calculatorTitle: (colors) => ({ fontSize: 24, fontWeight: 'bold', color: colors.white || '#fff' }),
  calculatorSubtitle: (colors) => ({ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }),
  mapSection: (colors) => ({
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  }),
  calculatorCard: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    margin: 16,
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  }),
  inputGroup: { marginBottom: 16 },
  inputLabel: (colors) => ({ fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 8 }),
  inputWrapper: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  }),
  inputPrefix: (colors) => ({ fontSize: 16, color: colors.textSecondary }),
  inputWithPrefix: (colors) => ({ flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text }),
  calcBtn: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  }),
  calcBtnDisabled: (colors) => ({ backgroundColor: colors.textSecondary }),
  calcBtnText: (colors) => ({ color: colors.white || '#fff', fontSize: 16, fontWeight: '600' }),
  calcBtnIcon: { fontSize: 18, marginLeft: 8 },
  resultCard: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    margin: 16,
    marginTop: 0,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.success + '20',
  }),
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultHeaderEmoji: { fontSize: 24, marginRight: 8 },
  resultHeaderText: (colors) => ({ fontSize: 18, fontWeight: 'bold', color: colors.text }),
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Avoid issues with colors.background as border
  },
  resultLabel: (colors) => ({ fontSize: 14, color: colors.textSecondary }),
  resultValue: (colors) => ({ fontSize: 14, fontWeight: '600', color: colors.text }),
  totalRow: (colors) => ({
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: colors.success + '20',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 12,
  }),
  totalLabel: (colors) => ({ fontSize: 16, fontWeight: 'bold', color: colors.text }),
  totalValue: (colors) => ({ fontSize: 20, fontWeight: 'bold', color: colors.success }),
  bottomPadding: { height: 40 },
});