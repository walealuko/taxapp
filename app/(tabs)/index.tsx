import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, Href } from 'expo-router';
import { APP_SUMMARY } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();
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

  const renderHubActions = () => {
    // Map user type to specific tax calculations and tools
    const hubConfig: Record<string, any> = {
      individual: [
        { icon: 'calculator', label: 'PAYE Calculator', route: '/tax', color: colors.primary },
        { icon: 'calendar-clock', label: 'Deadlines', route: '/deadlines', color: '#EF6C00' },
      ],
      sme: [
        { icon: 'calculator', label: 'VAT Calculator', route: '/tax', color: '#4CAF50' },
        { icon: 'calculator', label: 'WHT Calculator', route: '/tax', color: '#FFB74D' },
        { icon: 'calendar-clock', label: 'Deadlines', route: '/deadlines', color: '#EF6C00' },
        { icon: 'account-group', label: 'Employees', route: '/employees', color: '#673AB7' },
      ],
      company: [
        { icon: 'calculator', label: 'Corporate Tax', route: '/tax', color: colors.primary },
        { icon: 'calculator', label: 'VAT Calculator', route: '/tax', color: '#4CAF50' },
        { icon: 'calculator', label: 'WHT Calculator', route: '/tax', color: '#FFB74D' },
        { icon: 'calculator', label: 'CGT Calculator', route: '/tax', color: '#29B6F6' },
        { icon: 'account-group', label: 'Employees', route: '/employees', color: '#673AB7' },
        { icon: 'file-pdf-box', label: 'WHT Vault', route: '/wht-certificates', color: '#4CAF50' },
        { icon: 'calendar-clock', label: 'Deadlines', route: '/deadlines', color: '#EF6C00' },
      ],
    };

    const actions = hubConfig[customerType] || hubConfig['individual'];

    return (
      <View style={styles.actionGrid}>
        {actions.map((action, idx) => (
          <QuickAction
            key={idx}
            icon={action.icon}
            label={action.label}
            route={action.route}
            color={action.color}
          />
        ))}
      </View>
    );
  };

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

        {/* Quick Access Hub */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Tax Hub</Text>
          {renderHubActions()}
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
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 4 },
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
});
