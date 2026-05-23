import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import TaxCalculatorScreen from '../../components/TaxCalculatorScreen';
import EstimatedTaxScreen from '../../components/EstimatedTaxScreen';
import TaxSummaryScreen from '../../components/TaxSummaryScreen';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';

type TaxType = 'paye' | 'vat' | 'wht' | 'cgt' | 'estimated' | 'summary';

export default function TaxPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const customerType = user?.customerType || 'individual';
  const [activeTab, setActiveTab] = useState<TaxType>('paye');

  const roleConfig: Record<string, TaxType[]> = {
    individual: ['paye', 'estimated', 'summary'],
    sme: ['paye', 'vat', 'wht', 'estimated', 'summary'],
    company: ['paye', 'vat', 'wht', 'cgt', 'estimated', 'summary'],
  };

  const availableTabs = roleConfig[customerType] || roleConfig['individual'];

  // Ensure we start on a valid tab for the role
  React.useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [customerType, availableTabs, activeTab]);

  const tabDetails: Record<string, { label: string; icon: string; color: string }> = {
    paye: { label: 'PAYE', icon: 'cash-multiple', color: '#FF6B6B' },
    vat: { label: 'VAT', icon: 'receipt', color: '#4CAF50' },
    wht: { label: 'WHT', icon: 'file-document', color: '#FFB74D' },
    cgt: { label: 'CGT', icon: 'chart-line', color: '#29B6F6' },
    estimated: { label: 'Est.', icon: 'calendar-clock', color: colors.primary },
    summary: { label: 'Sum.', icon: 'chart-box', color: colors.primary },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Tax Calculator</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
          Calculations for {customerType} profile
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabScroll, { backgroundColor: colors.background }]}
        >
          {availableTabs.map((tabId) => {
            const detail = tabDetails[tabId];
            const isActive = activeTab === tabId;
            return (
              <TouchableOpacity
                key={tabId}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.outline
                  }
                ]}
                onPress={() => setActiveTab(tabId)}
              >
                <View style={styles.tabContent}>
                  <MaterialCommunityIcons
                    name={detail.icon}
                    size={16}
                    color={isActive ? '#fff' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.tabText,
                    { color: isActive ? '#fff' : colors.textSecondary, ...TYPOGRAPHY.caption }
                  ]}>
                    {detail.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.screenContainer}>
        {activeTab === 'estimated' ? (
          <EstimatedTaxScreen />
        ) : activeTab === 'summary' ? (
          <TaxSummaryScreen />
        ) : (
          <TaxCalculatorScreen type={activeTab} user={user} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { marginTop: 4 },
  tabContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
  },
});
