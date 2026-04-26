import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getUpcomingDeadlines, formatDeadlineDate, getDeadlineColor, TaxDeadline } from '@/utils/taxDeadlines';

const TAX_TYPE_COLORS: Record<string, string> = {
  PAYE: '#FF6B6B',
  VAT: '#4CAF50',
  WHT: '#FFB74D',
  CGT: '#29B6F6',
};

const TAX_TYPE_ICONS: Record<string, string> = {
  PAYE: '💼',
  VAT: '🧾',
  WHT: '✂️',
  CGT: '📈',
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading deadlines...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={styles.headerTitle}>📅 Tax Deadlines</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Upcoming filing due dates
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Upcoming Deadlines</Text>
          <Text style={styles.summaryCount}>
            {deadlines.filter(d => d.status !== 'overdue').length}
          </Text>
          <Text style={styles.summarySubtext}>in the next 90 days</Text>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFB74D' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Due Soon</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Overdue</Text>
          </View>
        </View>

        {/* Deadlines List */}
        <View style={styles.deadlinesList}>
          {deadlines.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBg }]}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No upcoming deadlines!
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                You're all caught up
              </Text>
            </View>
          ) : (
            deadlines.map((deadline) => (
              <TouchableOpacity
                key={deadline.id}
                style={[styles.deadlineCard, { backgroundColor: colors.cardBg }]}
                onPress={() => handleDeadlinePress(deadline)}
                activeOpacity={0.7}
              >
                <View style={[styles.deadlineIcon, { backgroundColor: TAX_TYPE_COLORS[deadline.taxType] + '20' }]}>
                  <Text style={styles.deadlineIconText}>{TAX_TYPE_ICONS[deadline.taxType]}</Text>
                </View>
                <View style={styles.deadlineContent}>
                  <View style={styles.deadlineHeader}>
                    <Text style={[styles.deadlineTitle, { color: colors.text }]}>{deadline.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getDeadlineColor(deadline.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getDeadlineColor(deadline.status) }]}>
                        {deadline.status === 'due-soon' ? 'Due Soon' : deadline.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.deadlineDescription, { color: colors.textSecondary }]}>
                    {deadline.description}
                  </Text>
                  <View style={styles.deadlineFooter}>
                    <Text style={[styles.deadlineDate, { color: colors.textSecondary }]}>
                      📅 {formatDeadlineDate(deadline.dueDate)}
                    </Text>
                    {deadline.daysRemaining > 0 && (
                      <Text style={[styles.deadlineDays, { color: getDeadlineColor(deadline.status) }]}>
                        ⏳ {deadline.daysRemaining} days
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: colors.infoCardBg }]}>
          <Text style={styles.infoNoteEmoji}>💡</Text>
          <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
            Deadlines shown are based on Nigerian tax law. PAYE filings are due monthly by the 10th.
            VAT and WHT quarterly filings are due by the last day of the following quarter.
            Contact your tax advisor for specific circumstances.
          </Text>
        </View>
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
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3436' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14 },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  deadlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineIconText: { fontSize: 24 },
  deadlineContent: { flex: 1 },
  deadlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  deadlineTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  deadlineDescription: { fontSize: 13, lineHeight: 18 },
  deadlineFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  deadlineDate: { fontSize: 12 },
  deadlineDays: { fontSize: 12, fontWeight: '600' },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { fontSize: 14 },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoNoteEmoji: { fontSize: 18, marginRight: 12 },
  infoNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
