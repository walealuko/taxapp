import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { initiatePaystackPayment, getPlanDetails } from '../../utils/paystack';
import { useLocalSearchParams, router } from 'expo-router';
import { TAX_INFO } from '../../constants/tax';

interface TaxPlan {
  price: string;
  amount: number;
  description: string;
  features: string[];
}

const TAX_PLANS: Record<string, TaxPlan> = {
  paye: {
    price: '₦2,000',
    amount: 200000,
    description: 'Annual access to PAYE calculations and summaries',
    features: ['Full PAYE Engine', 'Tax Saving Tips', 'PDF Reports', 'History Tracking'],
  },
  vat: {
    price: '₦5,000',
    amount: 500000,
    description: 'Annual access to VAT calculations for businesses',
    features: ['VAT Rate Table', 'Revenue Breakdown', 'PDF Reports', 'Compliance Guide'],
  },
  wht: {
    price: '₦5,000',
    amount: 500000,
    description: 'Annual access to Withholding Tax calculations',
    features: ['All WHT Categories', 'Net Payment Calc', 'PDF Reports', 'Audit Trail'],
  },
  cgt: {
    price: '₦3,000',
    amount: 300000,
    description: 'Annual access to Capital Gains Tax calculations',
    features: ['Chargeable Gain Calc', 'Exemption Guide', 'PDF Reports', 'History Tracking'],
  },
  cit: {
    price: '₦15,000',
    amount: 1500000,
    description: 'Comprehensive Corporate Income Tax engine',
    features: ['Detailed Op. Exp.', 'Company Category Logic', 'PDF Reports', 'Priority Support'],
  },
};

export default function TaxTypeSubscriptionScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();
  const { user } = useAuth();

  const plan = TAX_PLANS[type as string] || TAX_PLANS.paye;
  const taxInfo = TAX_INFO[type as keyof typeof TAX_INFO] || TAX_INFO.paye;

  const handleSubscribe = async () => {
    if (!user?.email) {
      Alert.alert('Auth Error', 'You must be signed in to subscribe.');
      return;
    }

    setLoading(true);
    try {
      // Using a specific plan ID for the tax type
      const planDetails = {
        id: `plan_${type}`,
        amount: plan.amount,
        currency: 'NGN',
      };
      await initiatePaystackPayment(user.email, planDetails);
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Something went wrong while initializing payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.display }]}>
            {taxInfo.title} Access
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Unlock full calculation capabilities for {taxInfo.title}
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <AppCard
            title={`Annual Access`}
            variant="default"
            style={styles.planCard}
          >
            <Text style={[styles.planPrice, { color: colors.primary, ...TYPOGRAPHY.heading }]}>
              {plan.price}
            </Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
              {plan.description}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.outline }]} />

            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                <Text style={[styles.featureItem, { color: colors.text, ...TYPOGRAPHY.body }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </AppCard>
        </View>

        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: colors.primary }, loading && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.subscribeBtnText}>Get Access Now</Text>
              <MaterialCommunityIcons name="lock-open" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/subscription')}
          style={styles.allPlansLink}
        >
          <Text style={[styles.allPlansText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
            Want full access to all tax types? <Text style={{ color: colors.primary, fontWeight: '600' }}>View All Plans</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 40,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 0,
  },
  planPrice: {
    fontWeight: '800',
    marginBottom: 8,
  },
  planDescription: {
    marginBottom: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureItem: {
    fontWeight: '500',
  },
  subscribeBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  allPlansLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  allPlansText: {
    textAlign: 'center',
  },
});
