import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TYPOGRAPHY } from '@/constants/typography';
import { calculatePAYE, formatCurrency } from '@/utils/taxCalculations';
import { AppCard } from '@/components/ui/AppCard';

interface EmployeeData {
  name: string;
  salary: number;
  tax: number;
  net: number;
}

export default function BulkPayeScreen() {
  const colors = useThemeColors();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      if (result.canceled || !result.assets[0].uri) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data.map((row: any) => ({
            name: row['Name'] || row['Employee Name'] || 'Unknown',
            salary: parseFloat(row['Salary'] || row['Annual Salary'] || '0'),
          }));

          if (parsedData.length === 0) {
            Alert.alert('No Data', 'No valid employee data found in the CSV.');
            return;
          }

          setEmployees(parsedData.map(e => ({ ...e, tax: 0, net: 0 })));
        },
        error: (err) => {
          Alert.alert('Parsing Error', err.message);
        },
      });
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    }
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    const updatedEmployees = employees.map(emp => {
      const annualTax = calculatePAYE(emp.salary);
      return {
        ...emp,
        tax: annualTax,
        net: emp.salary - annualTax,
      };
    });

    setEmployees(updatedEmployees);
    setIsCalculating(false);
  };

  const totals = employees.reduce(
    (acc, emp) => ({
      gross: acc.gross + emp.salary,
      tax: acc.tax + emp.tax,
      net: acc.net + emp.net,
    }),
    { gross: 0, tax: 0, net: 0 }
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.heading }]}>
            Bulk PAYE Calculator
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Upload a CSV file with 'Name' and 'Salary' columns to calculate payroll tax for your entire team.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
          onPress={handleUpload}
        >
          <MaterialCommunityIcons name="file-upload" size={24} color="#fff" />
          <Text style={styles.uploadBtnText}>Upload Employee CSV</Text>
        </TouchableOpacity>

        {employees.length > 0 && (
          <View style={{ marginTop: 24, gap: 20 }}>
            <AppCard title="Payroll Summary" variant="default">
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Gross</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totals.gross)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Tax</Text>
                  <Text style={[styles.summaryValue, { color: colors.error || '#ef4444' }]}>{formatCurrency(totals.tax)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Net</Text>
                  <Text style={[styles.summaryValue, { color: colors.success || '#22c55e' }]}>{formatCurrency(totals.net)}</Text>
                </View>
              </View>
            </AppCard>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.calcBtn, { backgroundColor: colors.primary }]}
                onPress={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.calcBtnText}>Calculate Group Tax</Text>
                    <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <AppCard title="Employee Breakdown" variant="default">
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Employee</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Salary</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Tax</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Net</Text>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {employees.map((emp, i) => (
                  <View key={i} style={[styles.tableRow, { borderBottomColor: colors.outline }]}>
                    <Text style={[styles.tableCell, { color: colors.text }]}>{emp.name}</Text>
                    <Text style={[styles.tableCell, { color: colors.text }]}>{formatCurrency(emp.salary)}</Text>
                    <Text style={[styles.tableCell, { color: colors.error || '#ef4444' }]}>{formatCurrency(emp.tax)}</Text>
                    <Text style={[styles.tableCell, { color: colors.success || '#22c55e' }]}>{formatCurrency(emp.net)}</Text>
                  </View>
                ))}
              </ScrollView>
            </AppCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  uploadBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: { fontSize: 16, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  calcBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },
});
