import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useThemeColors } from '../hooks/useThemeColors';
import { TYPOGRAPHY } from '../constants/typography';
import { formatCurrency } from '../constants/tax';

interface TaxChartProps {
  result: Record<string, number | string>;
  type: string;
}

/** A slice in any of the chart datasets. */
interface PieSlice {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
}

export function TaxChart({ result, type }: TaxChartProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get('window').width;

  // -- Data extraction & normalization ---------------------------------------

  const annualTax = Number(
    result.annualTax ||
      result.citTax ||
      result.vatAmount ||
      result.withholdingTax ||
      result.capitalGainsTax ||
      0
  );

  let totalIncome = 0;
  if (type === 'paye') totalIncome = Number(result.grossIncome || 0);
  else if (type === 'vat') totalIncome = Number(result.revenue || 0);
  else if (type === 'wht') totalIncome = Number(result.amount || 0);
  else if (type === 'cgt') totalIncome = Number(result.disposalProceeds || 0);
  else if (type === 'cit') totalIncome = Number(result.revenue || 0);

  const netIncome = Math.max(0, totalIncome - annualTax);

  // -- Chart 1: Tax vs Net ---------------------------------------------------

  const taxVsNetData: PieSlice[] = [
    { name: 'Tax', population: annualTax, color: '#EF4444', legendFontColor: colors.text },
    { name: 'Net', population: netIncome, color: colors.success, legendFontColor: colors.text },
  ];

  // -- Chart 2: Income Breakdown --------------------------------------------
  // This was previously computed but never rendered. Now it becomes the main
  // "Income Breakdown" chart with a richer per-slice legend.

  let breakdownData: PieSlice[] = [];

  if (type === 'paye') {
    const taxable = Number(result.taxableIncome || 0);
    const deductions = Math.max(0, totalIncome - taxable);
    breakdownData = [
      { name: 'Taxable Income', population: taxable, color: colors.primary, legendFontColor: colors.text },
      { name: 'Deductions (CRA, Pension, etc.)', population: deductions, color: colors.warning, legendFontColor: colors.text },
    ];
  } else if (type === 'vat') {
    breakdownData = [
      { name: 'Net Sales', population: Number(result.netAmount || 0), color: colors.primary, legendFontColor: colors.text },
      { name: 'VAT (7.5%)', population: Number(result.vatAmount || 0), color: colors.warning, legendFontColor: colors.text },
    ];
  } else if (type === 'wht') {
    breakdownData = [
      { name: 'Net Payment', population: Number(result.netPayment || 0), color: colors.primary, legendFontColor: colors.text },
      { name: 'Withholding Tax', population: Number(result.withholdingTax || 0), color: colors.warning, legendFontColor: colors.text },
    ];
  } else if (type === 'cgt') {
    const costAndExp = Number(result.costBase || 0) + Number(result.expenses || 0);
    breakdownData = [
      { name: 'Chargeable Gain', population: Number(result.chargeableGain || 0), color: colors.primary, legendFontColor: colors.text },
      { name: 'Cost Base & Expenses', population: costAndExp, color: colors.warning, legendFontColor: colors.text },
    ];
  } else if (type === 'cit') {
    breakdownData = [
      { name: 'Taxable Profit', population: Number(result.taxableProfit || 0), color: colors.primary, legendFontColor: colors.text },
      { name: 'Operating Expenses', population: Number(result.operatingExpenses || 0), color: colors.warning, legendFontColor: colors.text },
      { name: 'Salaries', population: Number(result.salaries || 0), color: colors.info, legendFontColor: colors.text },
      { name: 'Depreciation', population: Number(result.depreciation || 0), color: colors.textSecondary, legendFontColor: colors.text },
    ];
  }

  // Drop zero-value slices so the pie doesn't show empty wedges
  breakdownData = breakdownData.filter((s) => s.population > 0);

  // -- Chart 3: Gross vs Taxable (kept from prior version) ------------------

  const taxableIncome = Number(result.taxableIncome || result.taxableProfit || totalIncome);
  const nonTaxable = Math.max(0, totalIncome - taxableIncome);

  const comparisonPieData: PieSlice[] = [
    { name: 'Taxable', population: taxableIncome, color: colors.primary, legendFontColor: colors.text },
    { name: 'Deductions', population: nonTaxable, color: colors.warning, legendFontColor: colors.text },
  ];

  // -- Helpers --------------------------------------------------------------

  /**
   * Build a richer legend row: colored swatch + label + amount + percentage.
   * Returns null if data is empty so the chart section hides gracefully.
   */
  const renderEnrichedLegend = (data: PieSlice[]) => {
    const total = data.reduce((sum, s) => sum + s.population, 0);
    if (total === 0) return null;
    return (
      <View style={styles.legendContainer}>
        {data.map((item, i) => {
          const pct = (item.population / total) * 100;
          return (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.legendAmount, { color: colors.text }]}>
                {formatCurrency(item.population)}
              </Text>
              <Text style={[styles.legendPercent, { color: colors.primary }]}>
                {pct.toFixed(1)}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  /**
   * Render a donut chart with a center label. react-native-chart-kit doesn't
   * support native center text, so we overlay an absolutely-positioned label
   * sitting inside the chart's center.
   */
  const renderDonut = (
    data: PieSlice[],
    centerLabel: string,
    centerValue: string,
    height = 220
  ) => {
    if (data.length === 0 || data.every((d) => d.population === 0)) return null;
    return (
      <View style={styles.donutContainer}>
        <PieChart
          data={data}
          width={screenWidth - 32}
          height={height}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          hasLegend={false}
          absolute
        />
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={[styles.donutCenterLabel, { color: colors.textSecondary }]}>{centerLabel}</Text>
          <Text style={[styles.donutCenterValue, { color: colors.text }]} numberOfLines={1}>
            {centerValue}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* INCOME BREAKDOWN — featured first since it's the most informative */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Income Breakdown</Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {breakdownData.length} {breakdownData.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {breakdownData.length > 0 ? (
          <>
            {renderDonut(
              breakdownData,
              'Total',
              formatCurrency(breakdownData.reduce((s, x) => s + x.population, 0))
            )}
            {renderEnrichedLegend(breakdownData)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No breakdown data available for this calculation.
            </Text>
          </View>
        )}
      </View>

      {/* TAX vs NET — secondary chart */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Tax vs Net Income</Text>
        {renderDonut(
          taxVsNetData.filter((d) => d.population > 0),
          'Gross',
          formatCurrency(totalIncome)
        )}
        {renderEnrichedLegend(taxVsNetData.filter((d) => d.population > 0))}
      </View>

      {/* GROSS vs TAXABLE — tertiary */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Gross vs Taxable Comparison</Text>
        {renderDonut(
          comparisonPieData.filter((d) => d.population > 0),
          'Total',
          formatCurrency(comparisonPieData.reduce((s, x) => s + x.population, 0))
        )}
        {renderEnrichedLegend(comparisonPieData.filter((d) => d.population > 0))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    ...TYPOGRAPHY.heading,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    top: '32%',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  donutCenterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutCenterValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});