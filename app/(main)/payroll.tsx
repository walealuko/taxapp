import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { formatCurrency, calculatePAYE } from '../../constants/tax';
import { generateRemittanceSchedulePDF, PayrollEmployee } from '../../utils/payroll-utils';

export default function PayrollDashboard() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const processPayroll = () => {
    return employees.map(emp => {
      const basic = emp.basic_salary || 0;
      const bonuses = emp.bonuses || 0;
      const overtime = emp.overtime || 0;
      const grossAnnual = basic + bonuses + overtime;

      // 2026 CRA: 200k + 20% of gross
      const cra = 200000 + (0.2 * grossAnnual);
      const taxableIncome = Math.max(0, grossAnnual - cra);
      const taxDue = calculatePAYE(taxableIncome);

      return {
        name: emp.name,
        tin: emp.tin,
        grossAnnual,
        taxableIncome,
        taxDue
      } as PayrollEmployee;
    });
  };

  const payrollData = processPayroll();
  const totalGross = payrollData.reduce((sum, emp) => sum + emp.grossAnnual, 0);
  const totalRemittance = payrollData.reduce((sum, emp) => sum + emp.taxDue, 0);

  const handleGeneratePDF = async () => {
    if (employees.length === 0) {
      Alert.alert('No Employees', 'Please add employees first.');
      return;
    }

    setProcessing(true);
    try {
      const month = new Date().toLocaleString('default', { month: 'long' });
      const year = new Date().getFullYear().toString();
      await generateRemittanceSchedulePDF(user?.firstName || 'Employer', month, year, payrollData);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Payroll Dashboard</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
          Monthly PAYE Remittance Overview
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <AppCard variant="default" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Workforce</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{employees.length} Staff</Text>
          </AppCard>

          <AppCard variant="default" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={colors.success} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Gross Payroll</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrency(totalGross)}</Text>
          </AppCard>

          <AppCard variant="default" style={[styles.metricCard, { borderColor: colors.primary, borderWidth: 1 }]}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="bank" size={24} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Tax Remittance</Text>
            </View>
            <Text style={[styles.metricValueHighlight, { color: colors.primary }]}>{formatCurrency(totalRemittance)}</Text>
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Employee Tax Breakdown</Text>
          {employees.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>No employees found. Add some to calculate payroll.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {payrollData.map((emp, i) => (
                <AppCard key={i} variant="default" style={styles.empRowCard}>
                  <View style={styles.empInfo}>
                    <Text style={[styles.empName, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{emp.name}</Text>
                    <Text style={[styles.empTin, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>TIN: {emp.tin}</Text>
                  </View>
                  <View style={styles.empTax}>
                    <Text style={[styles.taxValue, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>
                      {formatCurrency(emp.taxDue)}
                    </Text>
                  </View>
                </AppCard>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.primary }]}
          onPress={handleGeneratePDF}
          disabled={processing || employees.length === 0}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
              <Text style={styles.generateBtnText}>Generate Remittance Schedule</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { marginTop: 4 },
  content: { flex: 1, padding: 16 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '31%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: { fontSize: 11, fontWeight: '500' },
  metricValue: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  metricValueHighlight: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 16 },
  list: { gap: 10 },
  empRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: 14 },
  empTin: { fontSize: 12 },
  empTax: { alignItems: 'flex-end' },
  taxValue: { fontSize: 14 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  bottomPadding: { height: 40 },
});
