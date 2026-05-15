import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/tax';

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: April 22, 2026</Text>

        <Text style={styles.section}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          TaxApp Nigeria collects information you provide directly, including your name, email address,
          and tax calculation data. We also collect usage data such as app interactions and device
          information to improve our services.
        </Text>

        <Text style={styles.section}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to provide tax calculation services, maintain your account,
          communicate about our services, and comply with legal obligations. Your tax calculation
          history is stored securely and is only accessible by you.
        </Text>

        <Text style={styles.section}>3. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          Your personal data is stored on secure MongoDB Atlas servers with industry-standard encryption.
          We implement appropriate technical and organizational measures to protect your data against
          unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text style={styles.section}>4. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or rent your personal information to third parties. We may share
          anonymized, aggregated data with service providers who assist in operating our application,
          subject to confidentiality obligations.
        </Text>

        <Text style={styles.section}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, correct, or delete your personal data. You may also request
          data portability or object to certain processing activities. Contact us at the email below
          to exercise these rights.
        </Text>

        <Text style={styles.section}>6. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          We use minimal cookies and similar technologies to maintain app functionality and analyze
          usage patterns. We do not use tracking for advertising purposes.
        </Text>

        <Text style={styles.section}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          TaxApp is not intended for use by children under the age of 13. We do not knowingly collect
          personal information from children under 13.
        </Text>

        <Text style={styles.section}>8. International Transfers</Text>
        <Text style={styles.paragraph}>
          Your data may be transferred to and processed in countries outside of your residence.
          We ensure appropriate safeguards are in place for such transfers in accordance with
          applicable data protection laws.
        </Text>

        <Text style={styles.section}>9. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by posting the new policy on this page and updating the "Last Updated" date.
        </Text>

        <Text style={styles.section}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy or wish to exercise your data rights,
          please contact us at: privacy@taxapp.com
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
