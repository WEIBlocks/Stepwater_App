import * as Notifications from 'expo-notifications';
import { Reminder } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleReminder(reminder: Reminder): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Cancel existing notification if any
      await Notifications.cancelScheduledNotificationAsync(reminder.id);

      if (!reminder.enabled) {
        return null;
      }

      const [hours, minutes] = reminder.time.split(':').map(Number);
      
      // Schedule for each day of week
      const notificationIds: string[] = [];
      
      for (const dayOfWeek of reminder.daysOfWeek) {
        const trigger: Notifications.NotificationTriggerInput = {
          hour: hours,
          minute: minutes,
          weekday: dayOfWeek + 1, // 1-7, Sunday-Saturday (iOS uses 1-7, Android uses 0-6)
          repeats: true,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Time to hydrate!',
            body: 'Remember to drink water and stay healthy!',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger,
          identifier: `${reminder.id}_${dayOfWeek}`,
        });

        notificationIds.push(notificationId);
      }

      // Return the first ID as main identifier
      return notificationIds[0] || null;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  static async cancelReminder(reminderId: string): Promise<void> {
    try {
      // Cancel all notifications for this reminder (across all days)
      for (let day = 0; day < 7; day++) {
        await Notifications.cancelScheduledNotificationAsync(`${reminderId}_${day}`);
      }
    } catch (error) {
      console.error('Error canceling reminder:', error);
    }
  }

  static async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all reminders:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async showTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'If you see this, notifications are working!',
          sound: true,
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error showing test notification:', error);
    }
  }
}

