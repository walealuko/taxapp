import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getUpcomingDeadlines, formatDeadlineDate, getDeadlineColor, TaxDeadline } from '@/utils/taxDeadlines';
import { TYPOGRAPHY } from '@/constants/typography';
import { AppCard } from '@/components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NotificationService } from '@/services/NotificationService';

const TAX_TYPE_COLORS: Record<string, string> = {
  PAYE: '#FF6B6B',
  VAT: '#4CAF50',
  WHT: '#FFB74D',
  CGT: '#29B6F6',
};


const TAX_TYPE_ICONS: Record<string, string> = {
  PAYE: 'briefcase-outline',
  VAT: 'receipt-outline',
  WHT: 'content-cut-outline',
  CGT: 'chart-line',
};

export default function DeadlinesScreen() {
  const colors = useThemeColors();
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeadlines = async () => {
      try {
        const upcoming = getUpcomingDeadlines(10);
        setDeadlines(upcoming);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeadlines();
  }, []);

  const handleDeadlinePress = (deadline: TaxDeadline) => {
    const routeMap: Record<string, string> = {
      PAYE: '/(tabs)/paye',
      VAT: '/(tabs)/vat',
      WHT: '/(tabs)/wht',
      CGT: '/(tabs)/cgt',
    };
    router.push(routeMap[deadline.taxType] as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Loading deadlines...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>📅 Compliance Calendar</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Stay ahead of the FIRS. Never miss a filing date.
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Key Deadlines 2026 Summary */}
        <AppCard title="Key Tax Deadlines 2026" variant="default" style={styles.keyDeadlinesCard}>
          <View style={styles.keyDeadlineSection}>
            <View style={styles.keyDeadlineRow}>
              <View style={styles.keyDeadlineLabel}>
                <Text style={[styles.criticalLabel, { color: '#FF6B6B' }]}>Critical</Text>
                <Text style={[styles.keyDate, { color: colors.text }]}>March 31, 2026</Text>
              </View>
              <Text style={[styles.keyDeadlineDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                Annual tax return deadline for individuals (for 2025 income)
              </Text>
            </View>

            <View style={[styles.keyDeadlineRow, { marginTop: 12 }]}>
              <View style={styles.keyDeadlineLabel}>
                <Text style={[styles.monthlyLabel, { color: colors.primary }]}>Monthly</Text>
                <Text style={[styles.keyDate, { color: colors.text }]}>10th of Each Month</Text>
              </View>
              <Text style={[styles.keyDeadlineDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                PAYE remittance deadline (for employers)
              </Text>
            </View>

            <View style={[styles.keyDeadlineRow, { marginTop: 12 }]}>
              <View style={styles.keyDeadlineLabel}>
                <Text style={[styles.quarterlyLabel, { color: '#4CAF50' }]}>Quarterly</Text>
                <Text style={[styles.keyDate, { color: colors.text }]}>21st of Following Month</Text>
              </View>
              <Text style={[styles.keyDeadlineDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                VAT returns deadline (for VAT-registered businesses)
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Summary Card */}
        <AppCard
          variant="default"
          style={styles.summaryCard}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Upcoming Deadlines</Text>
            <Text style={styles.summaryCount}>
              {deadlines.filter(d => d.status !== 'overdue').length}
            </Text>
            <Text style={styles.summarySubtext}>in the next 90 days</Text>
          </View>
        </AppCard>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>Upcoming</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFB74D' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>Due Soon</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>Overdue</Text>
          </View>
        </View>

        {/* Deadlines List */}
        <View style={styles.deadlinesList}>
          {deadlines.length === 0 ? (
            <AppCard variant="default" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialCommunityIcons name="party-popper" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text, ...TYPOGRAPHY.heading }]}>
                  No upcoming deadlines!
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
                  You're all caught up
                </Text>
              </View>
            </AppCard>
          ) : (
            deadlines.map((deadline) => (
              <TouchableOpacity
                key={deadline.id}
                onPress={() => handleDeadlinePress(deadline)}
                activeOpacity={0.7}
              >
                <AppCard variant="default" style={styles.deadlineCard}>
                  <View style={styles.cardBody}>
                    <View style={[styles.deadlineIcon, { backgroundColor: TAX_TYPE_COLORS[deadline.taxType] + '20' }]}>
                      <MaterialCommunityIcons
                        name={(TAX_TYPE_ICONS[deadline.taxType] || 'calendar-clock') as any}
                        size={24}
                        color={TAX_TYPE_COLORS[deadline.taxType]}
                      />
                    </View>
                    <View style={styles.deadlineContent}>
                      <View style={styles.deadlineHeader}>
                        <Text style={[styles.deadlineTitle, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{deadline.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getDeadlineColor(deadline.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getDeadlineColor(deadline.status), ...TYPOGRAPHY.caption }]}>
                            {deadline.status === 'due-soon' ? 'Due Soon' : deadline.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.deadlineDescription, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                        {deadline.description}
                      </Text>
                    <View style={styles.deadlineFooter}>
                      <Text style={[styles.deadlineDate, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                        📅 {formatDeadlineDate(deadline.dueDate)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {deadline.daysRemaining > 0 && (
                          <Text style={[styles.deadlineDays, { color: getDeadlineColor(deadline.status), ...TYPOGRAPHY.caption, fontWeight: '600' }]}>
                            ⏳ {deadline.daysRemaining} days
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={async () => {
                            const success = await NotificationService.scheduleNotificationForDeadline(deadline.dueDate, deadline.title);
                            if (success) {
                              Alert.alert('Reminder Set', `You will be notified on ${formatDeadlineDate(deadline.dueDate)}`);
                            }
                          }}
                          style={[styles.remindBtn, { backgroundColor: colors.primary + '15' }]}
                        >
                          <MaterialCommunityIcons name="bell-outline" size={14} color={colors.primary} />
                          <Text style={[styles.remindText, { color: colors.primary }]}>Remind Me</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info Note */}
        <AppCard variant="default" style={styles.infoNote}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoNoteText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
              Deadlines shown are based on Nigerian tax law. PAYE filings are due monthly by the 10th.
              VAT and WHT quarterly filings are due by the last day of the following quarter.
              Contact your tax advisor for specific circumstances.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.payNowBtn, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openURL('https://www.nrs.gov.ng/taxpayer-services/self-service-portal')}
          >
            <Text style={[styles.payNowText, { color: '#fff', ...TYPOGRAPHY.caption, fontWeight: 'bold' }]}>
              Pay Your Tax Online
            </Text>
            <MaterialCommunityIcons name="credit-card-outline" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14 },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryCount: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  summarySubtext: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12 },
  deadlinesList: { gap: 12 },
  deadlineCard: {
    marginBottom: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deadlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineContent: { flex: 1 },
  deadlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  deadlineTitle: { flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: { fontWeight: '600' },
  deadlineDescription: { lineHeight: 18 },
  deadlineFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  deadlineDate: { fontSize: 12 },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  remindText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineDays: { fontSize: 12 },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { textAlign: 'center' },
  emptySubtext: { textAlign: 'center' },
  infoNote: {
    marginTop: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoNoteText: { flex: 1, lineHeight: 18 },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  payNowText: {
    fontSize: 13,
  },
  keyDeadlinesCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0f172a',
  },
  keyDeadlineSection: {
    paddingVertical: 4,
  },
  keyDeadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  keyDeadlineLabel: {
    flex: 1,
  },
  criticalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  monthlyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  quarterlyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  keyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  keyDeadlineDesc: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 16,
  },
});
