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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oops! 😅', "Passwords don't match. Try again!");
      return;
    }
    if (password.length < 6) {
      Alert.alert('Oops! 😅', 'Password should be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ firstName, lastName, email, password });
      Alert.alert('Success! 🎉', "Your account has been created. Let's login!", [
        { text: 'OK', onPress: () => router.push('/auth/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed 😔', err.response?.data?.error || 'Please try again');
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

          <View style={styles.authCard}>
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
                placeholder="Create a password"
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
  authTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  authSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
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
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  nameField: { width: '48%' },
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
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  registerText: { color: COLORS.gray, fontSize: 14 },
  registerHighlight: { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
});
