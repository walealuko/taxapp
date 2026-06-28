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
import { useAuth } from '@/contexts/AuthContext';
import { Form } from '@/components/ui/Form';
import { COLORS as TaxColors } from '@/constants/tax';

export default function VerifyEmailScreen() {
  const { resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Oops! 😅', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Oops! 😅', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await resendVerification(email);
      Alert.alert(
        'Check Your Email! 📧',
        'A new confirmation link has been sent to your inbox.'
      );
    } catch (err: any) {
      console.error('Resend error:', err);
      const message = err?.message || 'Please try again';
      let userFriendlyMessage = message;
      if (message.toLowerCase().includes('rate limit exceeded')) {
        userFriendlyMessage = 'Too many attempts. Please wait a while before requesting again.';
      }
      Alert.alert('Error 😔', userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>Verify Email</Text>
            <Text style={styles.authSubtitle}>Complete your registration</Text>
          </View>

          <Form style={styles.authCard} onSubmit={handleResend}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                We've sent a confirmation link to your email. Please click the link to activate your account.
              </Text>
            </View>

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

            <TouchableOpacity style={styles.authBtn} onPress={handleResend} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.authBtnText}>Resend Link</Text>
                  <Text style={styles.authBtnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.footerLink}>
              <Text style={styles.footerText}>Already verified?</Text>
              <Text style={styles.footerHighlight}>Sign in instead</Text>
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
  authScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authHeader: { alignItems: 'center', marginBottom: 24 },
  authTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  authSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  infoBox: {
    backgroundColor: TaxColors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: TaxColors.secondary || '#2563EB',
  },
  infoText: {
    fontSize: 16,
    color: TaxColors.gray,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputLabel: { fontSize: 16, color: TaxColors.dark, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TaxColors.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TaxColors.lightGray,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: TaxColors.dark },
  authBtn: {
    backgroundColor: TaxColors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  authBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  authBtnArrow: { color: '#fff', fontSize: 18, marginLeft: 8 },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: TaxColors.gray, fontSize: 16 },
  footerHighlight: { color: TaxColors.primary, fontSize: 16, fontWeight: '600', marginLeft: 4 },
});
