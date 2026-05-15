import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function scheduleQuarterlyReminder(): Promise<string | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;
    const now = new Date();
    const quarterlyDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Quarterly Tax Reminder',
        body: 'Time to review your quarterly tax obligations! Check your PAYE, VAT, and WHT calculations.',
        data: { type: 'quarterly-reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quarterlyDate },
    });
    return identifier;
  } catch {
    return null;
  }
}

async function scheduleDeadlineReminder(deadlineDate: Date, title: string, body: string): Promise<string | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;
    const identifier = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'deadline-reminder', deadline: deadlineDate.toISOString() } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: deadlineDate },
    });
    return identifier;
  } catch {
    return null;
  }
}

async function showTaxRateUpdate(): Promise<void> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    // Schedule an immediate notification (1 second from now)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tax Rate Update Available',
        body: 'New tax brackets have been loaded in the app.',
        data: { type: 'tax-rate-update' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + 1000) },
    });
  } catch {
    // Silent failure for non-critical notification
  }
}

async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silent
  }
}

export const NotificationService = {
  requestPermissions,
  scheduleQuarterlyReminder,
  scheduleDeadlineReminder,
  showTaxRateUpdate,
  cancelAllNotifications,
};

export default NotificationService;

