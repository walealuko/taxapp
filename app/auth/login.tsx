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
import { COLORS as TaxColors } from '@/constants/tax';
import { TYPOGRAPHY } from '@/constants/typography';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AppCard } from '@/components/ui/AppCard';
import { StandardInput } from '@/components/ui/StandardInput';
import { NrsLogo } from '@/components/ui/NrsLogo';
import { NigeriaMap } from '@/components/ui/NigeriaMap';
import { NigerianFlag } from '@/components/ui/NigerianFlag';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const message = err.message || 'Please check your credentials';
      const isConfirmationError = message.toLowerCase().includes('confirm');

      if (isConfirmationError) {
        router.replace('/auth/verify');
      } else {
        Alert.alert('Login Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.authContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <View style={styles.logoRow}>
              <NigerianFlag />
              <Text style={[styles.authTitle, { color: colors.text, ...TYPOGRAPHY.display }]}>TaxApp</Text>
            </View>
            <View style={styles.mapContainer}>
              <NigeriaMap />
            </View>
            <Text style={[styles.authSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
              Nigeria Tax Calculator
            </Text>
            <Text style={[styles.authTagline, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
              Calculate your taxes with ease
            </Text>
          </View>

          <AppCard title="Who Must Register?" variant="default" style={{ marginBottom: 24 }}>
            <View style={styles.tipList}>
              {[
                'All individuals earning above ₦800,000 annually',
                'Self-employed professionals and freelancers',
                'Business owners and sole proprietors',
                'Employees with additional income sources',
                'Anyone claiming tax refunds or rent relief',
                'Property owners with rental income',
                'Individuals with investment income',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.tipText, { color: colors.text, ...TYPOGRAPHY.caption }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard variant="default">
            <StandardInput
              label="Email Address"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              id="login-email"
              name="email"
            />
            <View style={styles.passwordContainer}>
              <StandardInput
                label="Password"
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={secureText}
                error={errors.password}
                id="login-password"
                name="password"
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={[styles.eyeBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <MaterialCommunityIcons
                  name={secureText ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={[styles.authBtnText, { color: colors.onPrimary, ...TYPOGRAPHY.body, fontWeight: 'bold' }]}>Sign In</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <NrsLogo />

            <View style={[styles.authDivider, { alignItems: 'center' }]}>
              <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              style={styles.registerLink}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                Don't have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Create one</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.legalRow}>
              <Text style={[styles.legalText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                By signing in, you agree to our
              </Text>
              <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                <Text style={[styles.legalLink, { color: colors.primary, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={[styles.legalText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}> and </Text>
              <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                <Text style={[styles.legalLink, { color: colors.primary, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1 },
  authWrapper: { flex: 1 },
  authScroll: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 60 },
  authHeader: { alignItems: 'center', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mapContainer: { width: 100, height: 100, opacity: 0.5, marginBottom: 16 },
  authTitle: { marginLeft: 12, fontWeight: 'bold' },
  authSubtitle: { textAlign: 'center', fontWeight: '600', marginBottom: 4 },
  authTagline: { textAlign: 'center' },
  passwordContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  authBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  authBtnText: { fontSize: 16 },
  authDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, },
  dividerText: { marginHorizontal: 12, fontSize: 12 },
  registerLink: { alignItems: 'center', marginTop: 16 },
  registerText: { textAlign: 'center' },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  legalText: { fontSize: 11 },
  legalLink: { fontSize: 11, textDecorationLine: 'underline' },
  eyeBtn: {
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipList: { gap: 8, marginTop: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center' },
  tipText: { lineHeight: 18 },
});
