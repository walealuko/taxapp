import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { calculatePAYE, formatCurrency } from '../../constants/tax';
import * as SecureStore from 'expo-secure-store';

interface TaxEstimate {
  annualTax: number;
  quarterlyEstimate: number;
  nextDeadline: Date;
  daysRemaining: number;
}

const calculateDaysRemaining = (deadline: Date): number => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function EstimatedTaxScreen() {
  const colors = useThemeColors();
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEstimate = async () => {
      try {
        const incomeStr = await SecureStore.getItemAsync('last_annual_income');
        const income = incomeStr ? parseFloat(incomeStr) : 5000000;

        const annualTax = calculatePAYE(income);
        const quarterlyEstimate = annualTax / 4;

        // Hardcoded deadline: 3 months from now + specific date (June 30, 2024 -> adjusted to nearest valid date)
        const now = new Date();
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        nextQuarter.setDate(30);
        nextQuarter.setHours(23, 59, 59, 0);

        // Adjust to the next quarter boundary
        const currentMonth = now.getMonth();
        let targetMonth: number;
        if (currentMonth < 3) targetMonth = 3; // Q2: April 30
        else if (currentMonth < 6) targetMonth = 6; // Q3: July 31
        else if (currentMonth < 9) targetMonth = 9; // Q4: October 31
        else targetMonth = 0; // Next year Q1: January 31

        const targetYear = currentMonth >= 9 ? now.getFullYear() + 1 : now.getFullYear();
        const targetDay = targetMonth === 0 ? 31 : targetMonth === 3 ? 30 : 31;

        const deadline = new Date(targetYear, targetMonth, targetDay, 23, 59, 59);

        setEstimate({
          annualTax,
          quarterlyEstimate,
          nextDeadline: deadline,
          daysRemaining: calculateDaysRemaining(deadline),
        });
      } catch (error) {
        // Fallback values
        const annualTax = calculatePAYE(5000000);
        const deadline = new Date();
        deadline.setDate(30);
        deadline.setMonth((deadline.getMonth() + 3) % 12);

        setEstimate({
          annualTax,
          quarterlyEstimate: annualTax / 4,
          nextDeadline: deadline,
          daysRemaining: calculateDaysRemaining(deadline),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEstimate();
  }, []);

  const formatDeadline = (date: Date): string => {
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getQuarterLabel = (): string => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Calculating estimate...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={styles.headerTitle}>Estimated Tax</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Quarterly tax obligations
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Annual Tax Summary Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.mainCardLabel}>Annual Tax Estimate</Text>
          <Text style={styles.mainCardAmount}>
            {estimate ? formatCurrency(estimate.annualTax) : '--'}
          </Text>
          <Text style={styles.mainCardSubtext}>Based on your annual income</Text>
        </View>

        {/* Quarterly Estimate */}
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📅</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Next Quarterly Payment</Text>
          </View>
          <View style={styles.quarterlyRow}>
            <View style={styles.quarterlyItem}>
              <Text style={[styles.quarterlyLabel, { color: colors.textSecondary }]}>
                {getQuarterLabel()} Estimate
              </Text>
              <Text style={[styles.quarterlyValue, { color: colors.text }]}>
                {estimate ? formatCurrency(estimate.quarterlyEstimate) : '--'}
              </Text>
            </View>
            <View style={styles.quarterlyDivider} />
            <View style={styles.quarterlyItem}>
              <Text style={[styles.quarterlyLabel, { color: colors.textSecondary }]}>Due Date</Text>
              <Text style={[styles.quarterlyValue, { color: colors.text }]}>
                {estimate ? formatDeadline(estimate.nextDeadline) : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Countdown Card */}
        <View style={[styles.countdownCard, { backgroundColor: colors.infoCardBg }]}>
          <View style={styles.countdownHeader}>
            <Text style={styles.countdownEmoji}>⏳</Text>
            <Text style={[styles.countdownTitle, { color: colors.text }]}>Days Remaining</Text>
          </View>
          <View style={styles.countdownBody}>
            <Text style={[styles.countdownNumber, { color: colors.primary }]}>
              {estimate?.daysRemaining ?? '--'}
            </Text>
            <Text style={[styles.countdownUnit, { color: colors.textSecondary }]}>days until deadline</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, (estimate?.daysRemaining ?? 0) / 90 * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressNote, { color: colors.textSecondary }]}>
            Based on 90-day quarter
          </Text>
        </View>

        {/* Payment Schedule */}
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📋</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Schedule</Text>
          </View>
          <View style={styles.scheduleList}>
            {['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'].map((quarter, index) => {
              const isPast = index < new Date().getMonth() / 3;
              const isCurrent = index === Math.floor(new Date().getMonth() / 3);
              return (
                <View key={quarter} style={styles.scheduleItem}>
                  <View style={[styles.scheduleDot, { backgroundColor: isPast ? colors.success : colors.primary }]} />
                  <Text style={[styles.scheduleQuarter, { color: colors.text }]}>{quarter}</Text>
                  <Text style={[styles.scheduleStatus, { color: colors.textSecondary }]}>
                    {isPast ? 'Paid' : isCurrent ? 'Due Soon' : 'Upcoming'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/paye')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Recalculate PAYE</Text>
        </TouchableOpacity>

        <View style={styles.infoNote}>
          <Text style={styles.infoNoteEmoji}>💡</Text>
          <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
            Quarterly estimates are calculated as annual tax divided by 4. Final tax obligations may vary based on your actual filing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  mainCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  mainCardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  mainCardAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainCardSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quarterlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterlyItem: {
    flex: 1,
    alignItems: 'center',
  },
  quarterlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 16,
  },
  quarterlyLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  quarterlyValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  countdownCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  countdownUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressNote: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  scheduleQuarter: {
    flex: 1,
    fontSize: 14,
  },
  scheduleStatus: {
    fontSize: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 24,
  },
  infoNoteEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});