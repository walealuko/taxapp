import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { StandardInput } from '../../components/ui/StandardInput';
import { NigerianFlag } from '../../components/ui/NigerianFlag';
import { NigeriaMap } from '../../components/ui/NigeriaMap';
import { NrsLogo } from '../../components/ui/NrsLogo';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CustomerType = 'individual' | 'sme' | 'company';

interface CustomerTypeOption {
  id: CustomerType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}

const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { id: 'individual', label: 'Individual', icon: 'account-outline', description: 'Personal tax & freelance' },
  { id: 'sme', label: 'SME', icon: 'store-outline', description: 'Small & medium business' },
  { id: 'company', label: 'Company', icon: 'office-building', description: 'Corporate organization' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const colors = useThemeColors();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerType: 'individual' as CustomerType,
    firstName: '',
    lastName: '',
    companyName: '',
    staffCount: '',
    tin: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.customerType) newErrors.customerType = 'Please select a type';
    } else if (step === 1) {
      const isCompany = formData.customerType === 'sme' || formData.customerType === 'company';
      if (isCompany) {
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.staffCount) newErrors.staffCount = 'Number of staff is required';
      } else {
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
      }
      if (!formData.tin) newErrors.tin = 'TIN is required';
    } else if (step === 2) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be 8+ characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => s + 1);
    }
  };

  const handleRegister = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const isCompany = formData.customerType === 'sme' || formData.customerType === 'company';
      await register({
        firstName: isCompany ? formData.companyName : formData.firstName,
        lastName: isCompany ? '' : formData.lastName,
        email: formData.email,
        password: formData.password,
        customerType: formData.customerType,
        tin: formData.tin,
        // Note: Adding staffCount to registration data
        // We expect the register function in AuthContext to handle this additional field
        staffCount: isCompany ? parseInt(formData.staffCount) : null,
      } as any);
      router.replace('/auth/verify');
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <AppCard title="Step 1: Who are you?" variant="default">
            <Text style={[styles.desc, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
              Select your taxpayer category to personalize your experience.
            </Text>
            <View style={styles.typeGrid}>
              {CUSTOMER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outline },
                    formData.customerType === type.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => setFormData({ ...formData, customerType: type.id })}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={32}
                    color={formData.customerType === type.id ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.typeLabel, { color: formData.customerType === type.id ? colors.primary : colors.text, ...TYPOGRAPHY.heading }]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.typeDesc, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>
        );
      case 1:
        return (
          <AppCard title="Step 2: Professional Identity" variant="default">
            <StandardInput
              label="Tax Identity Number (TIN)"
              icon="numeric"
              value={formData.tin}
              onChangeText={(v) => setFormData({ ...formData, tin: v })}
              placeholder="Enter your TIN"
              error={errors.tin}
            />
            {formData.customerType === 'individual' ? (
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <StandardInput
                    label="First Name"
                    icon="account"
                    value={formData.firstName}
                    onChangeText={(v) => setFormData({ ...formData, firstName: v })}
                    placeholder="First name"
                    error={errors.firstName}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <StandardInput
                    label="Last Name"
                    icon="account"
                    value={formData.lastName}
                    onChangeText={(v) => setFormData({ ...formData, lastName: v })}
                    placeholder="Last name"
                    error={errors.lastName}
                  />
                </View>
              </View>
            ) : (
              <>
                <StandardInput
                  label="Company Name"
                  icon="office-building"
                  value={formData.companyName}
                  onChangeText={(v) => setFormData({ ...formData, companyName: v })}
                  placeholder="Registered business name"
                  error={errors.companyName}
                />
                <StandardInput
                  label="Number of Staff"
                  icon="account-group"
                  value={formData.staffCount}
                  onChangeText={(v) => setFormData({ ...formData, staffCount: v })}
                  placeholder="Enter total number of employees"
                  keyboardType="numeric"
                  error={errors.staffCount}
                />
              </>
            )}
          </AppCard>
        );
      case 2:
        return (
          <AppCard title="Step 3: Secure Your Account" variant="default">
            <StandardInput
              label="Email Address"
              icon="email-outline"
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              placeholder="email@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <StandardInput
              label="Password"
              icon="lock-outline"
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              placeholder="Create a password (8+ chars)"
              secureTextEntry
              error={errors.password}
            />
            <StandardInput
              label="Confirm Password"
              icon="lock-check-outline"
              value={formData.confirmPassword}
              onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
              placeholder="Repeat password"
              secureTextEntry
              error={errors.confirmPassword}
            />
          </AppCard>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <NigerianFlag />
              <Text style={[styles.title, { color: colors.text, ...TYPOGRAPHY.display }]}>Create Account</Text>
            </View>
            <View style={styles.mapContainer}>
              <NigeriaMap />
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
              Join the NRS digital tax ecosystem for a seamless experience.
            </Text>
          </View same
          <View style={styles.progressRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i <= step ? colors.primary : colors.outline }]} />
            ))}
          </View>

          {renderStep()}

          <View style={styles.actions}>
            {step > 0 && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.outline }]}
                onPress={() => setStep(s => s - 1)}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={step === 2 ? handleRegister : handleNext}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={[styles.primaryBtnText, { color: colors.onPrimary, ...TYPOGRAPHY.body, fontWeight: 'bold' }]}>
                  {step === 2 ? 'Complete Setup' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <NrsLogo />
            <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
              <Text style={[styles.loginText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                Already have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { marginLeft: 12, fontWeight: 'bold' },
  mapContainer: { width: 100, height: 100, opacity: 0.5, marginBottom: 16 },
  subtitle: { textAlign: 'center', paddingHorizontal: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeLabel: { marginTop: 8, textAlign: 'center' },
  typeDesc: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  desc: { marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  primaryBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtnText: { fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  secondaryBtnText: { fontSize: 16 },
  footer: { alignItems: 'center', marginTop: 40, gap: 16 },
  loginLink: { alignItems: 'center' },
  loginText: { textAlign: 'center' },
});
