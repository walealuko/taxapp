import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for notifications was denied');
      return false;
    }

    return true;
  }

  static async scheduleTaxReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Monthly PAYE Reminder (10th of each month)
    await Notifications.scheduleRepeatingAsync({
      trigger: {
        day: 10,
        hour: 9,
        minute: 0,
      },
      content: {
        title: '📅 PAYE Remittance Due',
        body: 'Reminder: Your monthly PAYE tax remittance is due by the 10th. Ensure your payroll is updated!',
        sound: true,
      },
    });

    // 2. Quarterly VAT/WHT Reminders
    // Due dates: March 31, June 30, Sept 30, Dec 31
    const quarterlyDeadlines = [
      { month: 2, day: 25, label: 'Q1' }, // Reminder 5 days before March 30 (Feb 25)
      { month: 5, day: 25, label: 'Q2' }, // Reminder 5 days before June 30 (May 25)
      { month: 8, day: 25, label: 'Q3' }, // Reminder 5 days before Sept 30 (Aug 25)
      { month: 11, day: 25, label: 'Q4' }, // Reminder 5 days before Dec 31 (Nov 25)
    ];

    for (const deadline of quarterlyDeadlines) {
      await Notifications.scheduleNotificationAsync({
        trigger: {
          month: deadline.month + 1, // JS months are 0-indexed
          day: deadline.day,
          hour: 9,
          minute: 0,
        },
        content: {
          title: `📅 ${deadline.label} Tax Deadline`,
          body: 'Reminder: Quarterly VAT and WHT returns are due soon. Avoid penalties and file now!',
          sound: true,
        },
      });
    }
  }

  static async init() {
    const granted = await this.requestPermissions();
    if (granted) {
      await this.scheduleTaxReminders();
    }
  }
}
