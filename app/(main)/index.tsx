import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { router, Href } from 'expo-router';
import { APP_SUMMARY } from '@/constants/tax';
import { formatCurrency } from '@/utils/taxCalculations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '@/constants/typography';
import { AppCard } from '@/components/ui/AppCard';
import HorizontalCardScroller from '@/components/ui/HorizontalCardScroller';
import { supabase } from '@/lib/supabase';

interface HistoryItem {
  _id: string;
  taxType: string;
  input: Record<string, any>;
  result: Record<string, any>;
  createdAt: string;
}

export default function WelcomeScreen() {
  const colors = useThemeColors();
  const { user, logout, refreshAccessToken } = useAuth();
  const [recentActivity, setRecentActivity] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchRecentActivity = async () => {
    try {
      if (!user) return;

      const tables = [
        { name: 'tax_paye', type: 'paye' },
        { name: 'tax_vat', type: 'vat' },
        { name: 'tax_wht', type: 'wht' },
        { name: 'tax_cgt', type: 'cgt' },
        { name: 'tax_cit', type: 'cit' },
      ];

      const allResults: any[] = [];

      await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (error) throw error;
          if (data) {
            data.forEach(row => {
              allResults.push({
                _id: row.id,
                taxType: table.type,
                createdAt: row.created_at,
                result: row
              });
            });
          }
        })
      );

      const sorted = allResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentActivity(sorted.slice(0, 3));
    } catch (e) {
      console.error('Failed to fetch recent activity', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

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

  const NavCard = ({ icon, label, route, color, isExternal = false }: { icon: string, label: string, route: string, color: string, isExternal?: boolean }) => (
    <Pressable
      onPress={() => {
        if (isExternal) {
          Linking.openURL(route);
        } else {
          router.push(route as Href);
        }
      }}
      style={({ pressed }) => [
        styles.tileWrapper,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <AppCard variant="default" style={styles.tile}>
        <View style={[styles.tileIconBlock, { backgroundColor: color + '22' }]}>
          <View style={[styles.tileIconBubble, { backgroundColor: color + '33' }]}>
            <MaterialCommunityIcons name={icon as any} size={32} color={color} />
          </View>
        </View>
        <View style={styles.tileLabelWrap}>
          <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={2}>
            {label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={colors.textSecondary}
            style={styles.tileChevron}
          />
        </View>
      </AppCard>
    </Pressable>
  );

  const StretchedFlag = () => (
    <View style={styles.memeFlagContainer}>
      <View style={[styles.flagStrip, { backgroundColor: '#008751', flex: 1.2 }]} />
      <View style={[styles.flagStrip, { backgroundColor: '#FFFFFF', flex: 0.6 }]} />
      <View style={[styles.flagStrip, { backgroundColor: '#008751', flex: 1.2 }]} />
    </View>
  );

  const TAX_TYPE_NAMES: Record<string, string> = {
    paye: 'PAYE',
    vat: 'VAT',
    wht: 'WHT',
    cgt: 'CGT',
  };

  const TAX_TYPE_COLORS: Record<string, string> = {
    paye: '#FF6B6B',
    vat: '#4CAF50',
    wht: '#FFB74D',
    cgt: '#29B6F6',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={styles.heroSection}>
          <StretchedFlag />
          <Text style={[styles.welcomeTitle, { color: colors.text, ...TYPOGRAPHY.display }]}>
            Hello, {user?.firstName ? (user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)) : 'User'}! 👋
          </Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Stay compliant with Nigeria's tax laws. Here is your current overview.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={[styles.viewAllText, { color: colors.primary, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : recentActivity.length > 0 ? (
            <HorizontalCardScroller cardWidth={Math.round(Dimensions.get('window').width * 0.55)}>
              {recentActivity.map((item) => {
                const color = TAX_TYPE_COLORS[item.taxType] || colors.primary;
                let summaryValue = '';
                if (item.taxType === 'paye') summaryValue = formatCurrency(item.result?.annual_tax || 0);
                else if (item.taxType === 'vat') summaryValue = formatCurrency(item.result?.vat_amount || 0);
                else if (item.taxType === 'wht') summaryValue = formatCurrency(item.result?.withholding_tax || 0);
                else if (item.taxType === 'cgt') summaryValue = formatCurrency(item.result?.capital_gains_tax || 0);
                else if (item.taxType === 'cit') summaryValue = formatCurrency(item.result?.cit_tax || 0);

                return (
                  <AppCard key={item._id} variant="default" style={styles.recentCard}>
                    <View style={styles.recentRow}>
                      <View style={[styles.recentBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.recentBadgeText, { color, ...TYPOGRAPHY.caption, fontWeight: '700' }]}>
                          {TAX_TYPE_NAMES[item.taxType] || item.taxType.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.recentValue, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>
                        {summaryValue}
                      </Text>
                      <Text style={[styles.recentDate, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                        {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </AppCard>
                );
              })}
            </HorizontalCardScroller>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>No recent calculations.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Quick Tools</Text>
          <HorizontalCardScroller>
            <NavCard icon="calculator" label="Tax Calculator" route="/tax" color={colors.primary} />
            <NavCard icon="newspaper" label="Tax News" route="/news" color="#1565C0" />
            <NavCard icon="history" label="Tax History" route="/history" color="#FF6B6B" />
            <NavCard icon="cog" label="Settings" route="/settings" color="#607D8B" />
            <NavCard
              icon="credit-card-outline"
              label="Pay Your Tax"
              route="https://www.nrs.gov.ng/taxpayer-services/self-service-portal"
              color="#059669"
              isExternal
            />
          </HorizontalCardScroller>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Why Use TaxApp?</Text>
          <AppCard variant="default" style={styles.advantageCard}>
            <View style={styles.advantageRow}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.advantageTitle, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '700' }]}>
                Do I need to file if I don't owe any tax?
              </Text>
            </View>
            <Text style={[styles.advantageText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
              If your income is below ₦800,000 annually, you technically don't owe tax. However, filing a nil return can help you maintain a tax compliance record and obtain tax clearance certificates when needed.
            </Text>
            <TouchableOpacity
              style={[styles.nilBtn, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL('https://taxid.nrs.gov.ng')}
            >
              <Text style={[styles.nilBtnText, { color: '#fff', ...TYPOGRAPHY.caption, fontWeight: '700' }]}>File Nil Return on NRS</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </AppCard>
        </View>

        <AppCard variant="default" style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
            <Text style={[styles.guideTitle, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '700' }]}>NRS Compliance Guide</Text>
          </View>
          <Text style={[styles.guideText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
            Use the automated tools to track liabilities and ensure you're always FIRS-compliant.
          </Text>
        </AppCard>
        <View style={styles.bottomPadding} />
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
  memeFlagContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    transform: [{ scaleX: 1.5 }, { skewX: '-10deg' }],
  },
  flagStrip: {
    flex: 1,
    height: '100%',
  },
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { marginBottom: 16 },
  viewAllText: { fontSize: 14 },
  recentCard: { padding: 0 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  recentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recentBadgeText: { fontSize: 12 },
  recentValue: { flex: 1, textAlign: 'left' },
  recentDate: { textAlign: 'right' },
  tileWrapper: {
    width: '100%',
  },
  tile: {
    aspectRatio: 1,
    padding: 0,
    overflow: 'hidden',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  tileIconBlock: {
    flex: 1.4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconBubble: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabelWrap: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tileLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  tileChevron: {
    opacity: 0.6,
  },
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
  centered: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center' },
  bottomPadding: { height: 40 },
  advantageCard: {
    padding: 16,
  },
  advantageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  advantageTitle: {
    fontSize: 14,
  },
  advantageText: {
    lineHeight: 20,
  },
  nilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  nilBtnText: {
    textAlign: 'center',
  },
});
