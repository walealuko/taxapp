import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'urgent' | 'info' | 'success';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'VAT Filing Deadline', message: 'Your monthly VAT return is due in 5 days. Please review your ledger.', date: '2026-05-23', type: 'urgent' },
  { id: '2', title: 'CIT Reminder', message: 'Annual CIT return for 2025 is now open for filing.', date: '2026-05-20', type: 'info' },
  { id: '3', title: 'Document Verified', message: 'Your CAC Certificate has been successfully stored in the Vault.', date: '2026-05-15', type: 'success' },
  { id: '4', title: 'WHT Credit Update', message: 'New WHT certificate detected. Your total credits have increased.', date: '2026-05-10', type: 'info' },
];

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Notifications</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Stay updated with your compliance requirements.
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>All caught up!</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>No new notifications at this time.</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <AppCard key={notif.id} variant="default" style={styles.notifCard}>
              <View style={styles.notifRow}>
                <View style={[styles.typeIcon, { backgroundColor: getTyeColor(notif.type, colors) }]}>
                  <MaterialCommunityIcons
                    name={notif.type === 'urgent' ? 'alert-circle' : notif.type === 'success' ? 'check-circle' : 'information'}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.notifDetails}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '700' }]}>{notif.title}</Text>
                    <Text style={[styles.notifDate, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{notif.date}</Text>
                  </View>
                  <Text style={[styles.notifMessage, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{notif.message}</Text>
                </View>
                <TouchableOpacity onPress={() => markAsRead(notif.id)} style={styles.readBtn}>
                  <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getTyeColor(type: string, colors: any) {
  switch (type) {
    case 'urgent': return '#EF4444';
    case 'success': return '#10B981';
    default: return colors.primary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  notifCard: {
    marginBottom: 12,
    padding: 12,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDetails: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: { },
  notifDate: { },
  notifMessage: { lineHeight: 16 },
  readBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20
  },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 12 },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 4 },
});
