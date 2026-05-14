import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import TaxCalculatorScreen from '../../components/TaxCalculatorScreen';
import { useThemeColors } from '../../hooks/useThemeColors';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt';

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState<TaxType>('paye');
  const colors = useThemeColors();

  const tabs: { id: TaxType; label: string; emoji: string }[] = [
    { id: 'paye', label: 'PAYE', emoji: '💰' },
    { id: 'vat', label: 'VAT', emoji: '💵' },
    { id: 'wht', label: 'WHT', emoji: '📁' },
    { id: 'cgt', label: 'CGT', emoji: '🏷️' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.tabContainer(colors)}>
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
      </View>
      <TaxCalculatorScreen type={activeTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: (colors) => ({
    flexDirection: 'row',
    padding: 16,
    paddingTop: 60,
    gap: 8,
    backgroundColor: colors.background,
  }),
  tabBtn: (colors) => ({
    flex: 1,
    paddingVertical: 8,
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
