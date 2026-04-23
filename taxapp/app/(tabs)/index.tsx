import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { router, Href } from 'expo-router';
import { COLORS, TAX_TYPES } from '../../constants/tax';
import ReceiptCapture from '../../components/ReceiptCapture';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const [showReceiptCapture, setShowReceiptCapture] = useState(false);
  const colors = useThemeColors();
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Goodbye! 👋',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.dashboardGreeting}>Hello! 👋</Text>
          <Text style={styles.dashboardSubtext}>What would you like to calculate today?</Text>
        </View>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>🧮</Text>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeTitle}>Tax Calculator</Text>
            <Text style={styles.welcomeDesc}>Select a tax type below to get started</Text>
          </View>
        </View>

        <View style={styles.taxGrid}>
          {TAX_TYPES.map((tax) => (
            <TouchableOpacity
              key={tax.id}
              style={[styles.taxCard, { backgroundColor: tax.bg }]}
              onPress={() => router.push(`/${tax.id}` as Href)}
              activeOpacity={0.7}
            >
              <View style={[styles.taxIconContainer, { backgroundColor: tax.color + '20' }]}>
                <Text style={styles.taxIcon}>{tax.icon}</Text>
              </View>
              <Text style={[styles.taxName, { color: tax.color }]}>{tax.name}</Text>
              <Text style={styles.taxDesc}>{tax.description}</Text>
              <View style={[styles.taxArrow, { backgroundColor: tax.color }]}>
                <Text style={styles.taxArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.summaryBtn}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Text style={styles.summaryBtnEmoji}>📊</Text>
          <Text style={styles.summaryBtnText}>View Tax Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.receiptBtn}
          onPress={() => setShowReceiptCapture(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptBtnEmoji}>🧾</Text>
          <Text style={styles.receiptBtnText}>Capture Receipt</Text>
        </TouchableOpacity>

        <Modal
          visible={showReceiptCapture}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowReceiptCapture(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Receipt Capture</Text>
                <TouchableOpacity onPress={() => setShowReceiptCapture(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ReceiptCapture />
            </View>
          </View>
        </Modal>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Did you know?</Text>
          <Text style={styles.infoText}>
            Nigeria uses a progressive tax system for PAYE, with rates ranging from 7% to 24% based on annual income.
          </Text>
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: { flex: 1, backgroundColor: COLORS.light },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  dashboardGreeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  dashboardSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  logoutBtn: { padding: 8 },
  logoutBtnText: { color: '#fff', fontSize: 14 },
  settingsBtn: { padding: 8 },
  settingsBtnText: { fontSize: 20 },
  dashboardContent: { flex: 1, padding: 16 },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  welcomeEmoji: { fontSize: 40, marginRight: 16 },
  welcomeTextContainer: { flex: 1 },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  welcomeDesc: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  taxGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  taxCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  taxIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taxIcon: { fontSize: 24 },
  taxName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  taxDesc: { fontSize: 12, color: COLORS.gray },
  taxArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taxArrowText: { color: '#fff', fontSize: 12 },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  summaryBtnEmoji: { fontSize: 20, marginRight: 8 },
  summaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  receiptBtnEmoji: { fontSize: 20, marginRight: 8 },
  receiptBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 24,
    color: '#9E9E9E',
  },
  infoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  legalLinkText: { fontSize: 12, color: COLORS.primary, textDecorationLine: 'underline' },
  legalDot: { marginHorizontal: 8, color: COLORS.gray, fontSize: 12 },
});
