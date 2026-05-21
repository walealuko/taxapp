import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Link, router } from 'expo-router';
import { TAX_INFO, formatCurrency } from '../../../constants/tax';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TaxInfoScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const colors = useThemeColors();

  const taxType = (type || 'paye').toLowerCase();
  const info = TAX_INFO[taxType as keyof typeof TAX_INFO];

  if (!info) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Tax law information not found for this category.</Text>
        <Link href="/tax" style={{ color: colors.primary, marginTop: 20, fontWeight: '600' }}>
          Back to Calculator
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroTitle}>{info.title}</Text>
        <Text style={styles.heroSubtitle}>{info.subtitle}</Text>
        <View style={styles.rateBadge}>
          <Text style={styles.rateBadgeText}>📈 {info.rates}</Text>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <Section label="Overview" icon="book-open-variant" colors={colors}>
          <Text style={[styles.sectionText, { color: colors.text }]}>{info.description}</Text>
        </Section>

        {info.brackets && (
          <Section label="Tax Brackets" icon="table-chart" colors={colors}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Range</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text, textAlign: 'right' }]}>Rate</Text>
              </View>
              {info.brackets.map((b, i) => (
                <View key={i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableCell, { color: colors.text }]}>{b.range}</Text>
                  <Text style={[styles.tableCell, { color: colors.primary, fontWeight: '700', textAlign: 'right' }]}>{b.rate}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.detailNote, { color: colors.textSecondary }]}>
              * Rates are applied progressively based on taxable income.
            </Text>
          </Section>
        )}

        {info.reliefs && (
          <Section label="Available Reliefs" icon="shield-check" colors={colors}>
            {info.reliefs.map((r, i) => (
              <View key={i} style={[styles.reliefRow, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.reliefText, { color: colors.text }]}>{r.name}: <Text style={{ fontWeight: '600' }}>{r.value}</Text></Text>
              </View>
            ))}
          </Section>
        )}

        {info.categories && (
          <Section label="Categories & Rates" icon="list-bullet" colors={colors}>
            {info.categories.map((c, i) => {
              const isWHT = c.id && 'legalRef' in c; // Simple check for WHT structure
              return (
                <View key={i} style={[styles.catRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.catLeft}>
                    <Text style={[styles.catName, { color: colors.text }]}>{c.name}</Text>
                    {isWHT && 'legalRef' in c && (
                      <Text style={styles.legalRefText}>⚖️ {c.legalRef}</Text>
                    )}
                  </View>
                  <Text style={[styles.catRate, { color: colors.primary }]}>{c.rate}</Text>
                </View>
              );
            })}
          </Section>
        )}

        {info.exemptions && (
          <Section label="Tax Exemptions" icon="certificate" colors={colors}>
            {info.exemptions.map((e, i) => (
              <View key={i} style={[styles.exemptionRow, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="minus-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.exemptionText, { color: colors.text }]}>{e.name}: {e.description}</Text>
              </View>
            ))}
          </Section>
        )}

        {info.calculationNote && (
          <View style={[styles.noteBox, { backgroundColor: colors.infoCardBg || '#f0f9ff' }]}>
            <View style={styles.noteHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
              <Text style={[styles.noteHeaderText, { color: colors.text }]}>Calculation Logic</Text>
            </View>
            <Text style={[styles.noteText, { color: colors.text }]}>{info.calculationNote}</Text>
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
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Return to Previous Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ label, icon, children, colors }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        <Text style={[styles.sectionLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {children}
    </View>
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
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },
  rateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  rateBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 18, fontWeight: 'bold' },
  sectionText: { fontSize: 14, lineHeight: 20 },
  table: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: { flex: 1, fontSize: 13, fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  tableCell: { flex: 1, fontSize: 13 },
  detailNote: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  reliefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reliefText: { fontSize: 14 },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catLeft: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600' },
  legalRefText: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 2 },
  catRate: { fontSize: 14, fontWeight: '700' },
  exemptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  exemptionText: { fontSize: 14 },
  noteBox: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0F172A',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteHeaderText: { fontSize: 15, fontWeight: 'bold' },
  noteText: { fontSize: 13, lineHeight: 18 },
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
