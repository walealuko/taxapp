import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getUpcomingDeadlines, formatDeadlineDate, getDeadlineColor, TaxDeadline } from '@/utils/taxDeadlines';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    router.push(routeMap[deadline.taxType]);
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
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>📅 Tax Deadlines</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Upcoming filing due dates
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <AppCard
          variant="primary"
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
                        name={TAX_TYPE_ICONS[deadline.taxType] || 'calendar-clock'}
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
                        {deadline.daysRemaining > 0 && (
                          <Text style={[styles.deadlineDays, { color: getDeadlineColor(deadline.status), ...TYPOGRAPHY.caption, fontWeight: '600' }]}>
                            ⏳ {deadline.daysRemaining} days
                          </Text>
                        )}
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
});
