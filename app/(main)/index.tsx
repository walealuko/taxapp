import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, Href } from 'expo-router';
import { APP_SUMMARY } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();

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

  const NavCard = ({ icon, label, route, color }: { icon: string, label: string, route: string, color: string }) => (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() => router.push(route as Href)}
    >
      <AppCard variant="default" style={styles.card}>
        <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.cardLabel, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{label}</Text>
      </AppCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={[styles.logoEmoji, { color: colors.text }]}>🇳🇬</Text>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoText, { color: '#2E7D32', ...TYPOGRAPHY.heading, fontWeight: '900' }]}>TAX</Text>
              <Text style={[styles.logoText, { color: '#2E7D32', ...TYPOGRAPHY.heading, fontWeight: '900' }]}>APP</Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{today}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero */}
        <View style={styles.heroSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text, ...TYPOGRAPHY.display }]}>Stop Fearing Tax Season 👋</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Simplify your compliance, automate your calculations, and keep your business FIRS-ready.
            We help Nigerian entrepreneurs move from confusion to complete tax confidence.
          </Text>
        </View>

        {/* App Guide */}
        <AppCard variant="default" style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
            <Text style={[styles.guideTitle, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '700' }]}>Your Compliance Assistant</Text>
          </View>
          <Text style={[styles.guideText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
            No more mixing personal and business funds or missing deadlines. Use our automated tools to
            track liabilities and ensure you're always FIRS-compliant.
          </Text>
        </AppCard>

        {/* Primary Navigation Hub */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Your Tax Suite</Text>
          <View style={styles.actionGrid}>
            <NavCard icon="calculator" label="Tax Calculator" route="/tax" color={colors.primary} />
            <NavCard icon="newspaper" label="Tax News" route="/news" color="#1565C0" />
            <NavCard icon="history" label="Tax History" route="/history" color="#FF6B6B" />
            <NavCard icon="cog" label="Settings" route="/settings" color="#607D8B" />
          </View>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoText: {
    lineHeight: 14,
    letterSpacing: 1,
  },
  dateText: { marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  heroSection: { marginBottom: 32, marginTop: 10 },
  welcomeTitle: { marginBottom: 8 },
  welcomeText: { lineHeight: 22 },
  guideCard: {
    marginBottom: 32,
    padding: 16,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  guideTitle: { },
  guideText: { lineHeight: 18 },
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 16 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: { textAlign: 'center' },
});
