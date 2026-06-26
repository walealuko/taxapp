import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { TYPOGRAPHY } from '@/constants/typography';
import { AppCard } from '@/components/ui/AppCard';
import { StandardInput } from '@/components/ui/StandardInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VatDashboardScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [vatData, setVatData] = useState({ collected: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVatData();
  }, [user]);

  const fetchVatData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vat_records')
        .select('collected, paid')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setVatData({ collected: data.collected, paid: data.paid });
    } catch (err: any) {
      console.error('VAT Data Load Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVatData = async (field: 'collected' | 'paid', value: string) => {
    const numValue = parseFloat(value.replace(/,/g, '')) || 0;
    setVatData(prev => ({ ...prev, [field]: numValue }));

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vat_records')
        .upsert({
          user_id: user?.id,
          collected: field === 'collected' ? numValue : vatData.collected,
          paid: field === 'paid' ? numValue : vatData.paid,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Save Failed', 'Could not save VAT data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const vatOwed = vatData.collected - vatData.paid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>VAT Filing Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Track your output and input tax for seamless filing.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <AppCard variant="default" style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Net VAT Position</Text>
                <Text style={[styles.summaryCount, { color: vatOwed >= 0 ? '#fff' : '#ffcdd2' }]}>
                  ₦{vatOwed.toLocaleString()}
                </Text>
                <Text style={styles.summarySubtext}>
                  {vatOwed >= 0 ? 'Amount to be remitted to NRS' : 'VAT Credit Available'}
                </Text>
              </View>
            </AppCard>

            <AppCard title="VAT Ledger" variant="default">
              <StandardInput
                label="VAT Collected (Output Tax)"
                icon="arrow-down-circle"
                value={vatData.collected.toLocaleString()}
                onChangeText={(v) => updateVatData('collected', v)}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <StandardInput
                label="VAT Paid on Purchases (Input Tax)"
                icon="arrow-up-circle"
                value={vatData.paid.toLocaleString()}
                onChangeText={(v) => updateVatData('paid', v)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </AppCard>

            <View style={styles.infoNote}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                VAT Owed = VAT Collected (on sales) - VAT Paid (on purchases).
                Ensure you keep all valid VAT invoices as evidence for la.
              </Text>
            </View>

            {saving && (
              <Text style={[styles.savingText, { color: colors.textSecondary, ...TYPOGRAPHY.caption, textAlign: 'center' }]}>
                Saving changes...
              </Text>
            )}
          </ScrollView>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  summaryCard: {
    marginBottom: 20,
  },
  summaryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryCount: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  summarySubtext: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  infoText: { flex: 1, lineHeight: 18 },
  savingText: { marginTop: 10 },
});
