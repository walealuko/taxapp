import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../../constants/typography';
import { calculatePAYE, formatCurrency } from '../../../utils/taxCalculations';
import { AppCard } from '../../../components/ui/AppCard';
import { useOfflineMode } from '../../../hooks/useOfflineMode';

interface Scenario {
  id: string;
  name: string;
  type: 'PAYE' | 'CIT';
  revenue: number;
  expenses: number;
  salary: number;
  taxResult: any;
}

export default function TaxPlanningScreen() {
  const colors = useThemeColors();
  const { calculateTaxOffline, calculateCitOffline } = useOfflineMode();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'PAYE' as 'PAYE' | 'CIT',
    revenue: '',
    expenses: '',
    salary: '',
  });

  const addScenario = () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please provide a scenario name');
      return;
    }

    const id = Date.now().toString();
    const newScenario: Scenario = {
      id,
      name: formData.name,
      type: formData.type,
      revenue: parseFloat(formData.revenue) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      salary: parseFloat(formData.salary) || 0,
      taxResult: null,
    };

    setScenarios([...scenarios, newScenario]);
    setFormData({ name: '', type: 'PAYE', revenue: '', expenses: '', salary: '' });
    setIsAdding(false);
    setActiveScenarioId(id);
  };

  const updateScenarioData = (id: string, field: keyof Scenario, value: any) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const runCalculation = async (scenario: Scenario) => {
    let result;
    if (scenario.type === 'PAYE') {
      result = calculatePAYE(scenario.salary);
    } else {
      result = await calculateCitOffline(scenario.revenue, scenario.expenses);
    }

    setScenarios(prev => prev.map(s => s.id === scenario.id ? { ...s, taxResult: result } : s));
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeScenarioId === id) setActiveScenarioId(null);
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.heading }]}>
            Tax Strategy Planner
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Simulate different financial scenarios to optimize your tax liability and plan your growth.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsAdding(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Create New Scenario</Text>
          </TouchableOpacity>
        </View>

        {isAdding && (
          <AppCard title="New Scenario Configuration" variant="default">
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Scenario Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.outline }]}
                value={formData.name}
                onChangeText={t => setFormData({ ...formData, name: t })}
                placeholder="e.g., 2027 Growth Plan"
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Tax Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, formData.type === 'PAYE' && { backgroundColor: colors.primary }]}
                  onPress={() => setFormData({ ...formData, type: 'PAYE' })}
                >
                  <Text style={[styles.typeBtnText, { color: formData.type === 'PAYE' ? '#fff' : colors.text }]}>PAYE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, formData.type === 'CIT' && { backgroundColor: colors.primary }]}
                  onPress={() => setFormData({ ...formData, type: 'CIT' })}
                >
                  <Text style={[styles.typeBtnText, { color: formData.type === 'CIT' ? '#fff' : colors.text }]}>CIT</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Annual Revenue / Salary (₦)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.outline }]}
                keyboardType="numeric"
                value={formData.revenue}
                onChangeText={t => setFormData({ ...formData, revenue: t })}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
              />

              {formData.type === 'CIT' && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Operating Expenses (₦)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.outline }]}
                    keyboardType="numeric"
                    value={formData.expenses}
                    onChangeText={t => setFormData({ ...formData, expenses: t })}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                  />
                </>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelBtn}>
                  <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addScenario}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveBtnText}>Save Scenario</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AppCard>
        )}

        <View style={{ marginTop: 20, gap: 16 }}>
          {scenarios.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-box-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No scenarios created yet. Start by adding one!</Text>
            </View>
          ) : (
            scenarios.map(scenario => (
              <AppCard key={scenario.id} title={scenario.name} variant="default">
                <View style={styles.scenarioHeader}>
                  <Text style={[styles.scenarioType, { color: colors.primary }]}>{scenario.type}</Text>
                  <TouchableOpacity onPress={() => deleteScenario(scenario.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error || '#ef4444'} />
                  </TouchableOpacity>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Revenue/Salary</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrency(scenario.revenue)}</Text>
                  </View>
                  {scenario.type === 'CIT' && (
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Expenses</Text>
                      <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrency(scenario.expenses)}</Text>
                    </View>
                  )}
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Estimated Tax</Text>
                    <Text style={[styles.metricValue, { color: colors.error || '#ef4444' }]}>
                      {scenario.taxResult ? formatCurrency(scenario.taxResult.annualTax || scenario.taxResult.taxLiability) : 'Not Calc.'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.calcBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                  onPress={() => runCalculation(scenario)}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
                  <Text style={[styles.calcBtnText, { color: colors.primary }]}>Recalculate</Text>
                </TouchableOpacity>
              </AppCard>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  actionRow: { marginBottom: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  form: { gap: 12, marginTop: 10 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnText: { fontWeight: '600', fontSize: 14 },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: { padding: 12 },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scenarioType: { fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: { flex: 1 },
  metricLabel: { fontSize: 11, marginBottom: 4 },
  metricValue: { fontSize: 15, fontWeight: 'bold' },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  calcBtnText: { fontWeight: '600', fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
    gap: 12,
  },
  emptyText: { textAlign: 'center', fontSize: 14 },
});
