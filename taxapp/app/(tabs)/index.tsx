import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { router, Href } from 'expo-router';
import { COLORS, TAX_TYPES } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Goodbye! 👋',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
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

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.dashboardGreeting}>Hello{user?.firstName ? `, ${user.firstName}` : ''}! 👋</Text>
          <Text style={styles.dashboardSubtext}>Manage your Nigeria taxes in one place</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleSettings} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.quickActionEmoji}>📊</Text>
              </View>
              <Text style={styles.quickActionTitle}>Tax Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/deadlines')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.quickActionEmoji}>📅</Text>
              </View>
              <Text style={styles.quickActionTitle}>Deadlines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/news')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.quickActionEmoji}>📰</Text>
              </View>
              <Text style={styles.quickActionTitle}>Tax News</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.taxTypesSection}>
          <Text style={styles.sectionTitle}>Tax Calculator</Text>
          <Text style={styles.sectionSubtitle}>Select a tax type to calculate</Text>

          {TAX_TYPES.map((tax) => (
            <TouchableOpacity
              key={tax.id}
              style={[styles.taxCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => handleTaxPress(tax.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.taxIconContainer, { backgroundColor: tax.bg }]}>
                <Text style={styles.taxIcon}>{tax.icon}</Text>
              </View>
              <View style={styles.taxContent}>
                <View style={styles.taxHeader}>
                  <Text style={[styles.taxName, { color: colors.text }]}>{tax.name}</Text>
                  <View style={[styles.taxBadge, { backgroundColor: tax.color + '20' }]}>
                    <Text style={[styles.taxBadgeText, { color: tax.color }]}>{tax.id.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.taxDescription}>{tax.description}</Text>
                <View style={styles.taxInfoRow}>
                  <Text style={[styles.taxInfoLabel, { color: colors.secondaryText }]}>Rate: </Text>
                  <Text style={[styles.taxInfoValue, { color: tax.color }]}>
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
          <Text style={styles.sectionTitle}>Tax Overview</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>PAYE</Text>
                <Text style={styles.summaryDesc}>Pay As You Earn - Employee income tax deducted by employer</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: COLORS.primary }]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>VAT</Text>
                <Text style={styles.summaryDesc}>Value Added Tax - 7.5% on goods and services</Text>
              </View>
            </View>
            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>WHT</Text>
                <Text style={styles.summaryDesc}>Withholding Tax - Advance tax on payments</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: COLORS.warning }]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>CGT</Text>
                <Text style={styles.summaryDesc}>Capital Gains Tax - 10% on asset disposal</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tax Tip</Text>
          <Text style={styles.infoText}>
            Keep records of all business expenses - they can be deducted from your taxable income to reduce your tax liability.
          </Text>
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: { flex: 1, backgroundColor: '#F8F9FE' },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  dashboardGreeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  dashboardSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  iconBtnText: { fontSize: 18 },
  dashboardContent: { flex: 1, padding: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 16 },

  quickActionsSection: { marginBottom: 24 },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionCard: {
    width: (width - 48) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionEmoji: { fontSize: 22 },
  quickActionTitle: { fontSize: 12, fontWeight: '600', color: COLORS.dark, textAlign: 'center' },

  taxTypesSection: { marginBottom: 24 },
  taxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taxIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taxIcon: { fontSize: 28 },
  taxContent: { flex: 1 },
  taxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  taxName: { fontSize: 17, fontWeight: '700', marginRight: 8 },
  taxBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  taxBadgeText: { fontSize: 10, fontWeight: '700' },
  taxDescription: { fontSize: 12, color: COLORS.gray, marginBottom: 6 },
  taxInfoRow: { flexDirection: 'row', alignItems: 'center' },
  taxInfoLabel: { fontSize: 11, fontWeight: '500' },
  taxInfoValue: { fontSize: 11, fontWeight: '700' },
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, paddingHorizontal: 8 },
  summaryDivider: { width: 1, height: 40, marginHorizontal: 12 },
  summaryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  summaryDesc: { fontSize: 11, color: COLORS.gray, lineHeight: 16 },

  infoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },

  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  legalLinkText: { fontSize: 12, color: COLORS.primary },
  legalDot: { marginHorizontal: 8, color: COLORS.gray, fontSize: 12 },
});