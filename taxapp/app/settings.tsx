import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { I18nProvider, useI18n } from '@/contexts/I18nContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { LANGUAGES, Language } from '@/constants/i18n';

function SettingsContent() {
  const colors = useThemeColors();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const {
    isBiometricAvailable,
    biometricType,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useBiometricAuth();

  const handleLanguageChange = async (languageCode: Language) => {
    await setLang(languageCode);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert('Failed', 'Could not enable biometric authentication');
      }
    } else {
      Alert.alert(
        'Disable Biometric',
        'Are you sure you want to disable biometric login?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => disableBiometric() },
        ]
      );
    }
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === lang);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Language Selection
        </Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.languageInfo}>
            <Text style={[styles.languageLabel, { color: colors.text }]}>
              Current Language
            </Text>
            <Text style={[styles.languageValue, { color: colors.primary }]}>
              {currentLanguage?.name || 'English'}
            </Text>
          </View>
          <View style={styles.languageOptions}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  { borderColor: colors.border },
                  lang === language.code && {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => handleLanguageChange(language.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }]}>
                  {language.nativeName}
                </Text>
                <Text style={[styles.languageCodeText, { color: colors.textSecondary }]}>
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {isBiometricAvailable && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Security
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.cardBg }]}>
            <View style={styles.infoRow}>
              <View style={styles.biometricInfo}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  {biometricType === 'facial' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {isBiometricEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={isBiometricEnabled ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.securityNote, { color: colors.textSecondary }]}>
              {biometricType === 'facial'
                ? 'Use Face ID to quickly and securely access your tax data.'
                : biometricType === 'fingerprint'
                ? 'Use your fingerprint to quickly and securely access your tax data.'
                : 'Use biometric authentication to secure your app.'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          App Information
        </Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>App Version</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Build</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>2024.1</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          About
        </Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            TaxApp Nigeria helps you calculate various Nigerian taxes including PAYE, VAT,
            Withholding Tax, and Capital Gains Tax in compliance with FIRS regulations.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function SettingsScreen() {
  return (
    <I18nProvider>
      <SettingsContent />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  languageInfo: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  languageValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageCodeText: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  divider: {
    height: 1,
  },
  biometricInfo: {
    flex: 1,
  },
  securityNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
});