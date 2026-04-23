import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/tax';

export default function TermsOfService() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: April 22, 2026</Text>

        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using TaxApp Nigeria, you agree to be bound by these Terms of Service. If you do not
          agree to these terms, please do not use our application.
        </Text>

        <Text style={styles.section}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          TaxApp Nigeria provides tax calculation tools for informational purposes only. Our
          calculators are built based on official Nigerian Federal Inland Revenue Service (fIRS)
          tax brackets and rates. However, we do not guarantee that calculations will be accurate
          for every individual circumstance.
        </Text>

        <Text style={styles.section}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account credentials.
          You agree to accept responsibility for all activities that occur under your account.
          You must notify us immediately of any unauthorized use of your account.
        </Text>

        <Text style={styles.section}>4. Acceptable Use</Text>
        <Text style={styles.paragraph}>
          You agree to use TaxApp only for lawful purposes and in accordance with these Terms.
          You agree not to use the app in any way that violates applicable laws or regulations,
          or in any manner that could damage, disable, or impair the service.
        </Text>

        <Text style={styles.section}>5. Tax Disclaimer</Text>
        <Text style={styles.paragraph}>
          TaxApp calculations are provided for informational and educational purposes only.
          They should not be considered as professional tax advice. Always consult a qualified
          tax professional or accountant for advice specific to your situation. We are not
          liable for any decisions made based on calculations from this app.
        </Text>

        <Text style={styles.section}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, trademarks, and other intellectual property in TaxApp are owned by us or
          our licensors. You may not copy, modify, or distribute our content without permission.
        </Text>

        <Text style={styles.section}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, TaxApp and its operators shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages arising
          from your use of the application.
        </Text>

        <Text style={styles.section}>8. Modifications to Service</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify or discontinue the service at any time, with or without
          notice. We shall not be liable to you or any third party for any modification or
          discontinuation of the service.
        </Text>

        <Text style={styles.section}>9. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of the
          Federal Republic of Nigeria, without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.section}>10. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, please contact us at: legal@taxapp.com
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 12, color: COLORS.gray, marginBottom: 16, fontStyle: 'italic' },
  section: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, color: COLORS.dark, lineHeight: 22, opacity: 0.85 },
  spacer: { height: 40 },
});
