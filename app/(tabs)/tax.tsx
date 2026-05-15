import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import TaxCalculatorScreen from '../../components/TaxCalculatorScreen';
import EstimatedTaxScreen from '../../components/EstimatedTaxScreen';
import TaxSummaryScreen from '../../components/TaxSummaryScreen';
import { useThemeColors } from '../../hooks/useThemeColors';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt' | 'estimated' | 'summary';

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState<TaxType>('paye');
  const colors = useThemeColors();

  const tabs: { id: TaxType; label: string; emoji: string }[] = [
    { id: 'paye', label: 'PAYE', emoji: '💰' },
    { id: 'vat', label: 'VAT', emoji: '💵' },
    { id: 'wht', label: 'WHT', emoji: '📁' },
    { id: 'cgt', label: 'CGT', emoji: '🏷️' },
    { id: 'estimated', label: 'Est.', emoji: '📅' },
    { id: 'summary', label: 'Sum.', emoji: '📊' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header(colors)}>
        <Text style={styles.headerTitle(colors)}>Tax Calculator 🇳🇬</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer(colors)}
        contentContainerStyle={styles.tabContainer(colors)}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn(colors), activeTab === tab.id && styles.tabActive(colors)]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText(colors), activeTab === tab.id && styles.tabTextActive(colors)]}>
              {tab.emoji} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {activeTab === 'estimated' ? (
        <EstimatedTaxScreen />
      ) : activeTab === 'summary' ? (
        <TaxSummaryScreen />
      ) : (
        <TaxCalculatorScreen type={activeTab} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: (colors) => ({
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginBottom: 8,
  }),
  headerTitle: (colors) => ({
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white || '#fff',
  }),
  tabScrollContainer: (colors) => ({
    backgroundColor: colors.background,
  }),
  tabContainer: (colors) => ({
    flexDirection: 'row',
    padding: 16,
    paddingTop: 16,
    gap: 8,
    backgroundColor: colors.background,
  }),
  tabBtn: (colors) => ({
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  }),
  tabActive: (colors) => ({
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  }),
  tabText: (colors) => ({
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  }),
  tabTextActive: (colors) => ({
    color: colors.white || '#fff',
  }),
});
