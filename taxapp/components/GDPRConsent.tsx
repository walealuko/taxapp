import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../constants/tax';

export default function GDPRConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const consent = await SecureStore.getItemAsync('gdpr_consent');
      if (!consent) setVisible(true);
    };
    checkConsent();
  }, []);

  const handleAccept = async () => {
    await SecureStore.setItemAsync('gdpr_consent', 'true');
    setVisible(false);
  };

  const handleDecline = async () => {
    await SecureStore.setItemAsync('gdpr_consent', 'false');
    setVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.banner}>
          <View style={styles.iconRow}>
            <Text style={styles.icon}>🛡️</Text>
          </View>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.text}>
            TaxApp uses minimal cookies to function and stores your data securely.
            We do not sell your data or use tracking for advertising.
          </Text>
          <Text style={styles.text}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('/legal/privacy')}
            >
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('/legal/terms')}
            >
              Terms of Service
            </Text>
            .
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.declineBtnText}>Manage Preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptBtnText}>Accept & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxWidth: 380,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconRow: { alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 12 },
  text: { fontSize: 14, color: COLORS.dark, lineHeight: 20, marginBottom: 12, opacity: 0.85 },
  link: { color: COLORS.primary, textDecorationLine: 'underline' },
  buttons: { flexDirection: 'column', gap: 10, marginTop: 8 },
  acceptBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  declineBtn: { backgroundColor: COLORS.light, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray },
  declineBtnText: { color: COLORS.gray, fontSize: 14 },
});
