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
import { useThemeColors } from '../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { initiatePaystackPayment, getPlanDetails } from '../../utils/paystack';

interface Plan {
  id: 'personal' | 'sme' | 'company';
  title: string;
  price: string;
  description: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'personal',
    title: 'Personal',
    price: '₦5,000',
    description: 'Perfect for individuals and freelancers',
    features: ['Annual Tax Calculation', 'Basic Tax Advice', 'History Tracking', 'Email Support'],
  },
  {
    id: 'sme',
    title: 'SME',
    price: '₦50,000',
    description: 'Designed for small and medium businesses',
    features: ['Multi-employee Calculation', 'VAT & WHT Support', 'Priority Support', 'Quarterly Reports'],
  },
  {
    id: 'company',
    title: 'Corporate',
    price: '₦100,000',
    description: 'Enterprise solution for large organizations',
    features: ['Unlimited Users', 'Full Compliance Audit', 'Dedicated Account Manager', 'Custom API Integration'],
  },
];

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Please select a plan', 'Choose one of the pricing tiers to continue.');
      return;
    }

    if (!user?.email) {
      Alert.alert('Auth Error', 'You must be signed in to subscribe.');
      return;
    }

    const plan = PLANS.find(p => p.id === selectedPlan);

    Alert.alert(
      'Proceed to Payment',
      `You have selected the ${plan?.title} plan for ${plan?.price}/year. Would you like to proceed to Paystack?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setLoading(true);
            try {
              const planDetails = getPlanDetails(selectedPlan);
              await initiatePaystackPayment(user.email, planDetails);
            } catch (err: any) {
              Alert.alert('Payment Error', err.message || 'Something went wrong while initializing payment.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.display }]}>Choose Your Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Select the best plan for your tax needs
          </Text>
        </View>

        {user?.subscriptionStatus === 'active' && (
          <AppCard variant="default" style={styles.activePlanCard}>
            <View style={styles.activePlanRow}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.success} />
              <View>
                <Text style={[styles.activePlanLabel, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>Current Subscription</Text>
                <Text style={[styles.activePlanValue, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '700' }]}>
                  {user.subscriptionPlan?.toUpperCase()} Plan - <Text style={{ color: colors.success }}>Active</Text>
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planWrapper,
                selectedPlan === plan.id && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.9}
            >
              <AppCard
                title={plan.title}
                variant="default"
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
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: colors.primary }, !selectedPlan && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={!selectedPlan || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.subscribeBtnText}>Continue to Payment</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </>
          )}
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
  activePlanCard: {
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePlanLabel: {
    fontSize: 12,
  },
  activePlanValue: {
    fontSize: 15,
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
    gap: 20,
    marginBottom: 40,
  },
  planWrapper: {
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
});
