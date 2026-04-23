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
import { COLORS } from '../../constants/tax';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops! 😅', 'Please fill in all fields to continue');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed 😔', err.response?.data?.error || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🏛️</Text>
            </View>
            <Text style={styles.authTitle}>TaxApp</Text>
            <Text style={styles.authSubtitle}>Nigeria Tax Calculator</Text>
            <Text style={styles.authTagline}>Calculate your taxes with ease</Text>
          </View>

          <View style={styles.authCard}>
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
                placeholder="Enter your password"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                <Text>{secureText ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.authBtn}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Sign in to your account"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" accessibilityLabel="Signing in" />
              ) : (
                <>
                  <Text style={styles.authBtnText}>Sign In</Text>
                  <Text style={styles.authBtnArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.authDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              style={styles.registerLink}
              accessibilityLabel="Create a new account"
              accessibilityRole="link"
            >
              <Text style={styles.registerText}>Don't have an account?</Text>
              <Text style={styles.registerHighlight}>Create one</Text>
            </TouchableOpacity>

            <View style={styles.legalRow}>
              <Text style={styles.legalText}>By signing in, you agree to our </Text>
              <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalText}> and </Text>
              <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: COLORS.primary },
  authWrapper: { flex: 1 },
  authScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authHeader: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  authTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  authSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  authTagline: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
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
  inputLabel: { fontSize: 14, color: COLORS.dark, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.dark },
  eyeBtn: { padding: 8 },
  authBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  authBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  authBtnArrow: { color: '#fff', fontSize: 18, marginLeft: 8 },
  authDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.lightGray },
  dividerText: { marginHorizontal: 12, color: COLORS.gray, fontSize: 12 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: COLORS.gray, fontSize: 14 },
  registerHighlight: { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  legalText: { fontSize: 11, color: COLORS.gray },
  legalLink: { fontSize: 11, color: COLORS.primary, textDecorationLine: 'underline' },
});
