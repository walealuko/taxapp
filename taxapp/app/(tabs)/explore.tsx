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
import { API_URL, COLORS, formatCurrency } from '../../constants/tax';
import { useAuth } from '../../contexts/AuthContext';

export default function SummaryScreen() {
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
    <View style={styles.calculatorContainer}>
      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calculatorInfo}>
          <Text style={styles.calculatorTitle}>📊 Tax Summary</Text>
          <Text style={styles.calculatorSubtitle}>Get an overview of your estimated tax liabilities</Text>
        </View>

        <View style={styles.calculatorCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💼 Annual Gross Income (PAYE)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix}
                placeholder="0.00"
                keyboardType="numeric"
                value={grossIncome}
                onChangeText={setGrossIncome}
                placeholderTextColor="#B0B0B0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💰 Annual Revenue (VAT)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₦</Text>
              <TextInput
                style={styles.inputWithPrefix}
                placeholder="0.00"
                keyboardType="numeric"
                value={revenue}
                onChangeText={setRevenue}
                placeholderTextColor="#B0B0B0"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
            onPress={getSummary}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.calcBtnText}>Get Summary</Text>
                <Text style={styles.calcBtnIcon}>📊</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderEmoji}>📋</Text>
              <Text style={styles.resultHeaderText}>Your Tax Breakdown</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>PAYE Tax</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.paye || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>VAT</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.vat || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Withholding Tax</Text>
              <Text style={styles.resultValue}>{formatCurrency(result.breakdown?.wht || 0)}</Text>
            </View>
            <View style={[styles.resultRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Estimated Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(result.totalEstimatedTax)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calculatorContainer: { flex: 1, backgroundColor: COLORS.light },
  calculatorContent: { flex: 1 },
  calculatorInfo: { padding: 20, paddingTop: 60, backgroundColor: COLORS.primary },
  calculatorTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  calculatorSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
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
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
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
  resultLabel: { fontSize: 14, color: COLORS.gray },
  resultValue: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.success },
  bottomPadding: { height: 40 },
});
