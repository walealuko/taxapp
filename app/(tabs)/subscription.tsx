import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS as TaxColors } from '../../constants/tax';

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

  const handleSubscribe = () => {
    if (!selectedPlan) {
      Alert.alert('Please select a plan', 'Choose one of the pricing tiers to continue.');
      return;
    }

    const plan = PLANS.find(p => p.id === selectedPlan);
    Alert.alert(
      'Proceed to Payment',
      `You have selected the ${plan?.title} plan for ${plan?.price}/year. Would you like to proceed to the payment gateway?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => Alert.alert('Payment Pending', 'Redirecting to secure payment gateway...') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Select the best plan for your tax needs</Text>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.9}
            >
              <Text style={[styles.planTitle, selectedPlan === plan.id && styles.textActive]}>
                {plan.title}
              </Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.divider} />

              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.featureItem}>
                  ✓ {feature}
                </Text>
              ))}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.subscribeBtn, !selectedPlan && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={!selectedPlan}
        >
          <Text style={styles.subscribeBtnText}>Continue to Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TaxColors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: TaxColors.gray,
    textAlign: 'center',
  },
  plansContainer: {
    gap: 20,
    marginBottom: 40,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  planCardActive: {
    borderColor: TaxColors.primary,
    backgroundColor: '#fff',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TaxColors.dark,
    marginBottom: 8,
  },
  textActive: {
    color: TaxColors.primary,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: TaxColors.primary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: TaxColors.gray,
    marginBottom: 20,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: TaxColors.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  subscribeBtn: {
    backgroundColor: TaxColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TaxColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
