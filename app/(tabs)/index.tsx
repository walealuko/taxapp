import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { router, Href } from 'expo-router';
import { COLORS, TAX_TYPES } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (e) {
              console.error('Logout failed', e);
            }
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleTaxPress = (taxId: string) => {
    router.push(`/${taxId}` as Href);
  };

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.dashboardContainer(colors)}>
      <View style={styles.dashboardHeader(colors)}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText(colors)}>TAXAPP</Text>
          </View>
          <Text style={styles.dashboardSubtext}>{today}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleSettings} style={styles.iconBtn(colors)}>
            <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn(colors)}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle(colors)}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard(colors)}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="chart-pie" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.quickActionTitle(colors)}>Tax Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard(colors)}
              onPress={() => router.push('/(tabs)/deadlines')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color="#EF6C00" />
              </View>
              <Text style={styles.quickActionTitle(colors)}>Deadlines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard(colors)}
              onPress={() => router.push('/(tabs)/news')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="newspaper" size={24} color="#1565C0" />
              </View>
              <Text style={styles.quickActionTitle(colors)}>Tax News</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.yearlyReportSection}>
          <Text style={styles.sectionTitle(colors)}>Annual Performance</Text>
          <TouchableOpacity
            style={styles.yearlyReportCard(colors)}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <View style={styles.reportContent}>
              <View>
                <Text style={styles.reportLabel(colors)}>Estimated Yearly Tax Liability</Text>
                <Text style={styles.reportAmount(colors)}>₦ 0.00</Text>
              </View>
              <MaterialCommunityIcons name="trending-up" size={32} color={colors.primary} />
            </View>
            <Text style={styles.reportLink(colors)}>View Full Report →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taxTypesSection}>
          <Text style={styles.sectionTitle(colors)}>Tax Calculator</Text>
          <Text style={styles.sectionSubtitle(colors)}>Select a tax type to calculate</Text>

          {TAX_TYPES.map((tax) => (
            <TouchableOpacity
              key={tax.id}
              style={[styles.taxCard(colors), { backgroundColor: colors.cardBg }]}
              onPress={() => handleTaxPress(tax.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.taxIconContainer, { backgroundColor: tax.bg }]}>
                <Text style={styles.taxIcon}>{tax.icon}</Text>
              </View>
              <View style={styles.taxContent}>
                <View style={styles.taxHeader}>
                  <Text style={[styles.taxName(colors), { color: colors.text }]}>{tax.name}</Text>
                  <View style={[styles.taxBadge, { backgroundColor: tax.color + '20' }]}>
                    <Text style={[styles.taxBadgeText, { color: tax.color }]}>{tax.id.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.taxDescription(colors)}>{tax.description}</Text>
                <View style={styles.taxInfoRow}>
                  <Text style={[styles.taxInfoLabel(colors), { color: colors.textSecondary }]}>Rate: </Text>
                  <Text style={[styles.taxInfoValue(colors), { color: tax.color }]}>
                    {tax.id === 'paye' ? '7% - 24%' :
                     tax.id === 'vat' ? '7.5%' :
                     tax.id === 'wht' ? '2% - 15%' :
                     tax.id === 'cgt' ? '10%' : '-'}
                  </Text>
                </View>
              </View>
              <View style={[styles.taxArrowContainer, { backgroundColor: tax.color }]}>
                <Text style={styles.taxArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.taxSummarySection}>
          <Text style={styles.sectionTitle(colors)}>Tax Overview</Text>

          <View style={styles.summaryCard(colors)}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel(colors)}>PAYE</Text>
                <Text style={styles.summaryDesc(colors)}>Pay As You Earn - Employee income tax deducted by employer</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.primary }]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel(colors)}>VAT</Text>
                <Text style={styles.summaryDesc(colors)}>Value Added Tax - 7.5% on goods and services</Text>
              </View>
            </View>
            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel(colors)}>WHT</Text>
                <Text style={styles.summaryDesc(colors)}>Withholding Tax - Advance tax on payments</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.warning }]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel(colors)}>CGT</Text>
                <Text style={styles.summaryDesc(colors)}>Capital Gains Tax - 10% on asset disposal</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard(colors)}>
          <Text style={styles.infoTitle(colors)}>💡 Tax Tip</Text>
          <Text style={styles.infoText(colors)}>
            Keep records of all business expenses - they can be deducted from your taxable income to reduce your tax liability.
          </Text>
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
            <Text style={styles.legalLinkText(colors)}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot(colors)}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legalLinkText(colors)}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: (colors) => ({ flex: 1, backgroundColor: colors.background }),
  dashboardHeader: (colors) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  }),
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: (colors) => ({ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: 1 }),
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  dashboardSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  iconBtn: (colors) => ({ padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 }),
  iconBtnText: { fontSize: 18 },
  dashboardContent: { flex: 1, padding: 16 },

  sectionTitle: (colors) => ({ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }),
  sectionSubtitle: (colors) => ({ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }),

  quickActionsSection: { marginBottom: 24 },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionCard: (colors) => ({
    width: (width - 48) / 3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }),
  quickActionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionEmoji: { fontSize: 22 },
  quickActionTitle: (colors) => ({ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }),

  yearlyReportSection: { marginBottom: 24 },
  yearlyReportCard: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }),
  reportContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportLabel: (colors) => ({ fontSize: 14, color: colors.textSecondary }),
  reportAmount: (colors) => ({ fontSize: 22, fontWeight: 'bold', color: colors.text }),
  reportLink: (colors) => ({ fontSize: 12, color: colors.primary, marginTop: 12, textAlign: 'right', fontWeight: '600' }),

  taxTypesSection: { marginBottom: 24 },
  taxCard: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }),
  taxIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taxIcon: { fontSize: 28 },
  taxContent: { flex: 1 },
  taxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  taxName: (colors) => ({ fontSize: 17, fontWeight: '700', marginRight: 8 }),
  taxBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  taxBadgeText: { fontSize: 10, fontWeight: '700' },
  taxDescription: (colors) => ({ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }),
  taxInfoRow: { flexDirection: 'row', alignItems: 'center' },
  taxInfoLabel: (colors) => ({ fontSize: 11, fontWeight: '500' }),
  taxInfoValue: (colors) => ({ fontSize: 11, fontWeight: '700' }),
  taxArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  taxArrowText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  taxSummarySection: { marginBottom: 24 },
  summaryCard: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }),
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, paddingHorizontal: 8 },
  summaryDivider: { width: 1, height: 40, marginHorizontal: 12 },
  summaryLabel: (colors) => ({ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 4 }),
  summaryDesc: (colors) => ({ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }),

  infoCard: (colors) => ({
    backgroundColor: colors.infoCardBg,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  }),
  infoTitle: (colors) => ({ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }),
  infoText: (colors) => ({ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }),

  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  legalLinkText: (colors) => ({ fontSize: 12, color: colors.primary }),
  legalDot: (colors) => ({ marginHorizontal: 8, color: colors.textSecondary, fontSize: 12 }),
});
