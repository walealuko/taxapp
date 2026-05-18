import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Form } from '../../components/ui/Form';
import { COLORS as TaxColors } from '../../constants/tax';

type CustomerType = 'individual' | 'sme' | 'company';

interface CustomerTypeOption {
  id: CustomerType;
  label: string;
  icon: string;
  description: string;
}

const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { id: 'individual', label: 'Individual', icon: '👤', description: 'Personal tax & freelance' },
  { id: 'sme', label: 'SME', icon: '🏪', description: 'Small & medium business' },
  { id: 'company', label: 'Company', icon: '🏢', description: 'Corporate organization' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('individual');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const isCompany = customerType === 'sme' || customerType === 'company';
    if (isCompany ? !companyName : (!firstName || !lastName)) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      return;
    }
    if (!email || !password) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Oops! 😅', 'Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Oops! 😅', "Passwords don't match. Try again!");
      return;
    }
    if (password.length < 8) {
      Alert.alert('Oops! 😅', 'Password should be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: isCompany ? companyName : firstName,
        lastName: isCompany ? '' : lastName,
        email,
        password,
        customerType
      });
      router.replace('/auth/verify');
    } catch (err: any) {
      console.error('Registration error detail:', err);
      const message = err?.message || 'Please try again';

      let userFriendlyMessage = message;
      if (message.toLowerCase().includes('rate limit exceeded')) {
        userFriendlyMessage = 'Too many attempts. Please wait a while or try a different email address.';
      } else if (message.toLowerCase().includes('already registered')) {
        userFriendlyMessage = 'This email is already in use. Try logging in instead.';
      }

      Alert.alert('Registration Failed 😔', userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>Create Account</Text>
            <Text style={styles.authSubtitle}>Join TaxApp today</Text>
          </View>

          <Form style={styles.authCard} onSubmit={handleRegister}>
            <Text style={styles.sectionLabel}>I am a...</Text>
            <View style={styles.customerTypeContainer}>
              {CUSTOMER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.customerTypeBtn,
                    customerType === type.id && styles.customerTypeBtnActive,
                  ]}
                  onPress={() => setCustomerType(type.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customerTypeIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.customerTypeLabel,
                      customerType === type.id && styles.customerTypeLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={styles.customerTypeDesc}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {customerType === 'individual' ? (
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholderTextColor="#B0B0B0"
                    />
                  </View>
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholderTextColor="#B0B0B0"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Company Name</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🏢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter company name"
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password (8+ chars)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#B0B0B0"
              />
            </View>

            <TouchableOpacity style={styles.authBtn} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.authBtnText}>Create Account</Text>
                  <Text style={styles.authBtnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.registerLink}>
              <Text style={styles.registerText}>Already have an account?</Text>
              <Text style={styles.registerHighlight}>Sign in</Text>
            </TouchableOpacity>
          </Form>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: TaxColors.primary },
  authWrapper: { flex: 1 },
  authScroll: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 60 },
  authHeader: { alignItems: 'flex-start', marginBottom: 24 },
  authTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'left' },
  authSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'left' },
  authCard: {
    backgroundColor: TaxColors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: TaxColors.dark, marginBottom: 12, textAlign: 'left' },
  customerTypeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  customerTypeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TaxColors.border,
    marginHorizontal: 4,
  },
  customerTypeBtnActive: { borderColor: TaxColors.primary, backgroundColor: TaxColors.primary + '10' },
  customerTypeIcon: { fontSize: 24, marginBottom: 6 },
  customerTypeLabel: { fontSize: 12, fontWeight: '600', color: TaxColors.gray, marginBottom: 2 },
  customerTypeLabelActive: { color: TaxColors.primary },
  customerTypeDesc: { fontSize: 9, color: TaxColors.gray, textAlign: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  nameField: { width: '48%' },
  inputLabel: { fontSize: 13, color: TaxColors.dark, fontWeight: '500', marginBottom: 8, textAlign: 'left' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TaxColors.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TaxColors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: TaxColors.dark },
  authBtn: {
    backgroundColor: TaxColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
    minWidth: 160,
  },
  authBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  authBtnArrow: { color: '#fff', fontSize: 16, marginLeft: 8 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  registerText: { color: TaxColors.gray, fontSize: 14 },
  registerHighlight: { color: TaxColors.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
});