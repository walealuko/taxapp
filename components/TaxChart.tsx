import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useThemeColors } from '../hooks/useThemeColors';
import { TYPOGRAPHY } from '../constants/typography';
import { formatCurrency } from '../constants/tax';

interface TaxChartProps {
  result: Record<string, number | string>;
  type: string;
}

export function TaxChart({ result, type }: TaxChartProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get('window').width;

  // Data extraction and normalization
  const annualTax = Number(result.annualTax || result.citTax || result.vatAmount || result.withholdingTax || result.capitalGainsTax || 0);
  let totalIncome = 0;

  if (type === 'paye') totalIncome = Number(result.grossIncome || 0);
  else if (type === 'vat') totalIncome = Number(result.revenue || 0);
  else if (type === 'wht') totalIncome = Number(result.amount || 0);
  else if (type === 'cgt') totalIncome = Number(result.disposalProceeds || 0);
  else if (type === 'cit') totalIncome = Number(result.revenue || 0);

  const netIncome = Math.max(0, totalIncome - annualTax);

  // Pie Chart 1: Tax vs Net
  const pieData = [
    { name: 'Tax', population: annualTax, color: '#FF6384', legendFontColor: colors.text },
    { name: 'Net', population: netIncome, color: '#4BC0C0', legendFontColor: colors.text },
  ];

  // Pie Chart 2: Income Breakdown
  let breakdownData: { name: string; population: number; color: string; legendFontColor: string }[] = [];

  if (type === 'paye') {
    const taxable = Number(result.taxableIncome || 0);
    const deductions = Math.max(0, totalIncome - taxable);
    breakdownData = [
      { name: 'Taxable', population: taxable, color: '#4BC0C0', legendFontColor: colors.text },
      { name: 'Deductions', population: deductions, color: '#FF9F40', legendFontColor: colors.text },
    ];
  } else if (type === 'vat') {
    breakdownData = [
      { name: 'Net', population: Number(result.netAmount || 0), color: '#4BC0C0', legendFontColor: colors.text },
      { name: 'VAT', population: Number(result.vatAmount || 0), color: '#FF6384', legendFontColor: colors.text },
    ];
  } else if (type === 'wht') {
    breakdownData = [
      { name: 'Net', population: Number(result.netPayment || 0), color: '#4BC0C0', legendFontColor: colors.text },
      { name: 'WHT', population: Number(result.withholdingTax || 0), color: '#FF6384', legendFontColor: colors.text },
    ];
  } else if (type === 'cgt') {
    const costAndExp = Number(result.costBase || 0) + Number(result.expenses || 0);
    breakdownData = [
      { name: 'Gain', population: Number(result.chargeableGain || 0), color: '#4BC0C0', legendFontColor: colors.text },
      { name: 'Cost/Exp', population: costAndExp, color: '#FF9F40', legendFontColor: colors.text },
    ];
  } else if (type === 'cit') {
    breakdownData = [
      { name: 'Profit', population: Number(result.taxableProfit || 0), color: '#4BC0C0', legendFontColor: colors.text },
      { name: 'Op. Exp', population: Number(result.operatingExpenses || 0), color: '#FFCE56', legendFontColor: colors.text },
      { name: 'Salaries', population: Number(result.salaries || 0), color: '#36A2EB', legendFontColor: colors.text },
      { name: 'Deprec.', population: Number(result.depreciation || 0), color: '#C71585', legendFontColor: colors.text },
    ];
  }

  // Bar Chart Data: Gross vs Taxable
  const taxableIncome = Number(result.taxableIncome || result.taxableProfit || totalIncome);
  const nonTaxable = Math.max(0, totalIncome - taxableIncome);

  const comparisonPieData = [
    { name: 'Taxable', population: taxableIncome, color: '#4BC0C0', legendFontColor: colors.text },
    { name: 'Deductions', population: nonTaxable, color: '#FF9F40', legendFontColor: colors.text },
  ];

  return (
    <View style={{ gap: 24, paddingVertical: 10 }}>
      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Tax vs Net Income</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            color: (background) => background,
          }}
          accessor="population"
          backgroundColor="transparent"
          arcClipped={false}
          centerXOffset={0}
          center={[0, 0]}
          radius={80}
          paddingLeft={0}
          absoluteDataLabel
        />
      </View>

      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Gross vs Taxable Comparison</Text>
        <PieChart
          data={comparisonPieData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            color: (background) => background,
          }}
          accessor="population"
          backgroundColor="transparent"
          arcClipped={false}
          centerXOffset={0}
          center={[0, 0]}
          radius={80}
          paddingLeft={0}
          absoluteDataLabel
        />
        <View style={styles.legendContainer}>
          {comparisonPieData.map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {item.name}: {formatCurrency(item.population)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    ...TYPOGRAPHY.body,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    ...TYPOGRAPHY.caption,
  },
});
