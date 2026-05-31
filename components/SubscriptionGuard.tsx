import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../constants/typography';

type PlanLevel = 'free' | 'personal' | 'sme' | 'company';

const PLAN_WEIGHTS: Record<PlanLevel, number> = {
  free: 0,
  personal: 1,
  sme: 2,
  company: 3,
};

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan: PlanLevel;
}

export default function SubscriptionGuard({ children, requiredPlan }: SubscriptionGuardProps) {
  const { user } = useAuth();

  const userPlan = (user?.subscriptionPlan as PlanLevel) || 'free';
  const userStatus = user?.subscriptionStatus || 'inactive';

  const hasAccess =
    userStatus === 'active' &&
    PLAN_WEIGHTS[userPlan] >= PLAN_WEIGHTS[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.lockCard}>
        <MaterialCommunityIcons name="lock-outline" size={64} color="#64748b" />
        <Text style={[styles.title, { fontWeight: 'bold' }]}>Feature Locked</Text>
        <Text style={[styles.subtitle, { color: '#64748b' }]}>
          This feature requires the {requiredPlan.toUpperCase()} plan or higher.
        </Text>
        <Text style={[styles.description, { color: '#94a3b8' }]}>
          Upgrade your subscription to unlock professional payroll and bulk tax tools.
        </Text>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/subscription')}
        >
          <Text style={styles.upgradeText}>Upgrade Now</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginVertical: 16,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
