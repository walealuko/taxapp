import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, Href } from 'expo-router';
import { TAX_TYPES, APP_SUMMARY } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useTaxConfig } from '../../contexts/TaxConfigContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();
  const { configs, isLoading: configLoading } = useTaxConfig();
  const customerType = user?.customerType || 'individual';

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/register');
    } catch (e) {
      console.error('Logout failed', e);
      router.replace('/auth/register');
    }
  };

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const QuickAction = ({ icon, label, route, color }: { icon: string, label: string, route: string, color: string }) => (
    <TouchableOpacity
      style={styles.actionWrapper}
      onPress={() => router.push(route as Href)}
    >
      <AppCard variant="default" style={styles.actionCard}>
        <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text, ...TYPOGRAPHY.caption }]}>{label}</Text>
      </AppCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.brandText, { color: colors.text, ...TYPOGRAPHY.heading }]}>NRS Dashboard</Text>
          <Text style={[styles.dateText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{today}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text, ...TYPOGRAPHY.display }]}>Hello, {user?.name || 'User'} 👋</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>{APP_SUMMARY}</Text>
        </View>

        {/* Primary Metric Card */}
        <AppCard variant="primary" style={styles.mainMetricCard}>
          <View style={styles.metricContent}>
            <View>
              <Text style={styles.metricLabel}>Estimated Annual Tax</Text>
              <Text style={styles.metricAmount}>₦ 0.00</Text>
            </View>
            <MaterialCommunityIcons name="trending-up" size={40} color="#fff" />
          </View>
          <TouchableOpacity
            style={styles.metricCta}
            onPress={() => router.push('/tax')}
          >
            <Text style={styles.metricCtaText}>View Full Report</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </AppCard>

        {/* Quick Access Hub */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Tax Hub</Text>
          <View style={styles.actionGrid}>
            <QuickAction icon="calculator" label="Calculator" route="/tax" color={colors.primary} />
            <QuickAction icon="newspaper" label="Tax News" route="/news" color="#1565C0" />
            <QuickAction icon="history" label="History" route="/history" color="#FF6B6B" />
            <QuickAction icon="calendar-clock" label="Deadlines" route="/deadlines" color="#EF6C00" />
            <QuickAction icon="file-pdf-box" label="WHT Vault" route="/wht-certificates" color="#4CAF50" />
            <QuickAction icon="account-group" label="Employees" route="/employees" color="#673AB7" />
          </View>
        </View>

        {/* Relevant Laws Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Relevant Laws</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
            Based on your {customerType} profile
          </Text>

          {configLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.lawsGrid}>
              {(configs[customerType as keyof typeof configs] || []).map((law, index) => (
                <AppCard key={index} variant="default" style={styles.lawCard}>
                  <Text style={[styles.lawTitle, { color: colors.primary, ...TYPOGRAPHY.caption, fontWeight: '700' }]}>{law.title}</Text>
                  <Text style={[styles.lawRef, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>{law.law}</Text>
                  <Text style={[styles.lawDesc, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>{law.description}</Text>
                </AppCard>
              ))}
            </View>
          )}
        </View>

        {/* Calculator Quick-Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Quick Calculation</Text>
          <View style={styles.calcList}>
            {TAX_TYPES.map((tax) => (
              <TouchableOpacity
                key={tax.id}
                style={styles.calcItemWrapper}
                onPress={() => router.push(`/${tax.id}` as Href)}
              >
                <AppCard variant="default" style={styles.calcCard}>
                  <View style={styles.calcRow}>
                    <View style={[styles.calcIcon, { backgroundColor: tax.color + '20' }]}>
                      <MaterialCommunityIcons name="calculator" size={20} color={tax.color} />
                    </View>
                    <View style={styles.calcInfo}>
                      <Text style={[styles.calcName, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{tax.name}</Text>
                      <Text style={[styles.calcBadgeText, { color: tax.color, ...TYPOGRAPHY.caption }]}>{tax.id.toUpperCase()} • {tax.id === 'paye' ? '7-24%' : tax.id === 'vat' ? '7.5%' : 'Variable'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </View>
                </AppCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.footer, { marginBottom: 40 }]}>
          <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.footerDot, { color: colors.outline }]}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/terms')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 12 },
  brandText: { textAlign: 'left' },
  dateText: { marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  welcomeSection: { marginBottom: 24, marginTop: 10 },
  welcomeTitle: { marginBottom: 4 },
  welcomeText: { lineHeight: 20 },
  mainMetricCard: {
    marginBottom: 24,
    paddingVertical: 24,
  },
  metricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, ...TYPOGRAPHY.body },
  metricAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  metricCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  metricCtaText: { color: '#fff', fontWeight: '600', ...TYPOGRAPHY.body },
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 4 },
  sectionSubtitle: { marginBottom: 16 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionWrapper: {
    width: '30%',
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { textAlign: 'center', fontWeight: '500' },
  lawsGrid: { gap: 12 },
  lawCard: { padding: 16 },
  lawTitle: { marginBottom: 4 },
  lawRef: { marginBottom: 4 },
  lawDesc: { lineHeight: 18 },
  calcList: { gap: 12 },
  calcItemWrapper: { width: '100%' },
  calcCard: { padding: 12 },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calcIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcInfo: { flex: 1 },
  calcName: { marginBottom: 2 },
  calcBadgeText: { opacity: 0.8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: { fontSize: 12, fontWeight: '500' },
  footerDot: { fontSize: 12 },
});
