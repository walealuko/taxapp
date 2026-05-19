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
  Image,
} from 'react-native';
import { COLORS as TaxColors } from '../../constants/tax';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Form } from '../../components/ui/Form';

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Oops! 😅', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Redirection is handled automatically by the RootLayoutNav guard
    } catch (err: any) {
      const message = err.message || 'Please check your credentials';
      const isConfirmationError = message.toLowerCase().includes('confirm');

      if (isConfirmationError) {
        router.replace('/auth/verify');
      } else {
        Alert.alert('Login Failed 😔', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeader}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../assets/images/firs-logo.png')}
                style={styles.firsLogo}
                resizeMode="contain"
              />
              <Text style={styles.authTitle}>TaxApp</Text>
            </View>
            <View style={styles.mapContainer}>
              <Image
                source={require('../../assets/images/nigeria-map.png')}
                style={styles.nigeriaMap}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.authSubtitle}>Nigeria Tax Calculator</Text>
            <Text style={styles.authTagline}>Calculate your taxes with ease</Text>
          </View>

          <Form style={styles.authCard}>
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
  authHeader: { alignItems: 'flex-start', marginBottom: 32 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  firsLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  mapContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  nigeriaMap: {
    width: 120,
    height: 120,
    opacity: 0.6,
  },
  authTitle: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'left' },
  authSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'left' },
  authTagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'left' },
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
  inputLabel: { fontSize: 14, color: TaxColors.dark, fontWeight: '500', marginBottom: 8, textAlign: 'left' },
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
  eyeBtn: { padding: 8 },
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
  authDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: TaxColors.border },
  dividerText: { marginHorizontal: 12, color: TaxColors.muted, fontSize: 12 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: TaxColors.gray, fontSize: 14 },
  registerHighlight: { color: TaxColors.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  legalText: { fontSize: 11, color: TaxColors.gray },
  legalLink: { fontSize: 11, color: TaxColors.primary, textDecorationLine: 'underline' },
});
