import { useEffect } from 'react';
import { useStore } from '../state/store';
import { NotificationService } from '../services/notifications';
import { Reminder } from '../types';

export const useReminders = () => {
  const { reminders, loadReminders, saveReminders, settings } = useStore();

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    if (!settings.notificationsEnabled) {
      NotificationService.cancelAllReminders();
      return;
    }

    // Schedule all enabled reminders
    const scheduleAll = async () => {
      for (const reminder of reminders) {
        if (reminder.enabled) {
          await NotificationService.scheduleReminder(reminder);
        } else {
          await NotificationService.cancelReminder(reminder.id);
        }
      }
    };

    scheduleAll();
  }, [reminders, settings.notificationsEnabled]);

  const addReminder = async (reminder: Reminder) => {
    const newReminders = [...reminders, reminder];
    useStore.setState({ reminders: newReminders });
    await saveReminders();
    
    if (settings.notificationsEnabled && reminder.enabled) {
      await NotificationService.scheduleReminder(reminder);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    const newReminders = reminders.map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    useStore.setState({ reminders: newReminders });
    await saveReminders();

    const reminder = newReminders.find(r => r.id === id);
    if (reminder) {
      if (reminder.enabled && settings.notificationsEnabled) {
        await NotificationService.scheduleReminder(reminder);
      } else {
        await NotificationService.cancelReminder(id);
      }
    }
  };

  const deleteReminder = async (id: string) => {
    const newReminders = reminders.filter(r => r.id !== id);
    useStore.setState({ reminders: newReminders });
    await saveReminders();
    await NotificationService.cancelReminder(id);
  };

  return {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
  };
};

