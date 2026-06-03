import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { TAX_INFO, TaxInfo } from '../../../constants/tax';
import { formatCurrency } from '../../../utils/taxCalculations';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../../../components/ui/AppCard';

export default function TaxInfoScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const colors = useThemeColors();

  const taxType = (type || 'paye').toLowerCase();
  const info = TAX_INFO[taxType as keyof typeof TAX_INFO] as TaxInfo;

  if (!info) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Tax law information not found for this category.</Text>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.outline }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Back to Calculator</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.heroTitle, { color: colors.onPrimary }]}>{info.title}</Text>
        <Text style={[styles.heroSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>{info.subtitle}</Text>
        <View style={styles.rateBadge}>
          <Text style={styles.rateBadgeText}>📈 {info.rates}</Text>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <AppCard title="Overview" variant="default">
          <Text style={[styles.sectionText, { color: colors.text, ...TYPOGRAPHY.body }]}>
            {info.description}
          </Text>
        </AppCard>

        {info.brackets && (
          <AppCard title="Tax Brackets" variant="default">
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.tableHeaderCell, { color: colors.text, ...TYPOGRAPHY.caption }]}>Range</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text, textAlign: 'right', ...TYPOGRAPHY.caption }]}>Rate</Text>
              </View>
              {info.brackets.map((b, i) => (
                <View key={i} style={[styles.tableRow, { borderBottomColor: colors.outline }]}>
                  <Text style={[styles.tableCell, { color: colors.text, ...TYPOGRAPHY.body }]}>{b.range}</Text>
                  <Text style={[styles.tableCell, { color: colors.primary, fontWeight: '700', textAlign: 'right', ...TYPOGRAPHY.body }]}>{b.rate}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.detailNote, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
              * Rates are applied progressively based on taxable income.
            </Text>
          </AppCard>
        )}

        {info.reliefs && (
          <AppCard title="Available Reliefs" variant="default">
            {info.reliefs.map((r, i) => (
              <View key={i} style={[styles.reliefRow, { borderBottomColor: colors.outline }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.reliefText, { color: colors.text, ...TYPOGRAPHY.body }]}>
                  {r.name}: <Text style={{ fontWeight: '600' }}>{r.value}</Text>
                </Text>
              </View>
            ))}
          </AppCard>
        )}

        {info.categories && (
          <AppCard title="Categories & Rates" variant="default">
            {info.categories.map((c, i) => {
              const isWHT = c.id && 'legalRef' in c;
              return (
                <View key={i} style={[styles.catRow, { borderBottomColor: colors.outline }]}>
                  <View style={styles.catLeft}>
                    <Text style={[styles.catName, { color: colors.text, ...TYPOGRAPHY.body }]}>{c.name}</Text>
                    {isWHT && 'legalRef' in c && (
                      <Text style={[styles.legalRefText, { color: colors.textSecondary }]}>⚖️ {c.legalRef}</Text>
                    )}
                  </View>
                  <Text style={[styles.catRate, { color: colors.primary, ...TYPOGRAPHY.body, fontWeight: '700' }]}>{c.rate}</Text>
                </View>
              );
            })}
          </AppCard>
        )}

        {info.exemptions && (
          <AppCard title="Tax Exemptions" variant="default">
            {info.exemptions.map((e, i) => (
              <View key={i} style={[styles.exemptionRow, { borderBottomColor: colors.outline }]}>
                <MaterialCommunityIcons name="minus-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.exemptionText, { color: colors.text, ...TYPOGRAPHY.body }]}>{e.name}: {e.description}</Text>
              </View>
            ))}
          </AppCard>
        )}

        {info.calculationNote && (
          <View style={[styles.noteBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary }]}>
            <View style={styles.noteHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
              <Text style={[styles.noteHeaderText, { color: colors.text, ...TYPOGRAPHY.heading }]}>Calculation Logic</Text>
            </View>
            <Text style={[styles.noteText, { color: colors.text, ...TYPOGRAPHY.body }]}>{info.calculationNote}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/tax', params: { type } })}
          >
            <Text style={styles.ctaText}>Start Calculation</Text>
            <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.outline }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Return to Previous Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  hero: {
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  rateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rateBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  sectionText: { lineHeight: 20 },
  table: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: { flex: 1 },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  tableCell: { flex: 1 },
  detailNote: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  reliefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reliefText: { flex: 1 },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catLeft: { flex: 1 },
  catName: { fontWeight: '600' },
  legalRefText: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  catRate: { fontWeight: '700' },
  exemptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exemptionText: { flex: 1 },
  noteBox: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteHeaderText: { fontWeight: 'bold' },
  noteText: { lineHeight: 18 },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    gap: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '500' },
})
