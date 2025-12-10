import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useReminders } from '../hooks/useReminders';
import { Reminder } from '../types';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { generateUUIDSecure } from '../utils/uuid';
import { NotificationService } from '../services/notifications';
import { wp, hp, rf, rs, rp, rm } from '../utils/responsive';
import { Header } from '../components';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RemindersScreen: React.FC = () => {
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const [newReminder, setNewReminder] = useState({
    time: '09:00',
    enabled: true,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday by default
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const handleToggleDay = (day: number) => {
    const currentDays = newReminder.daysOfWeek;
    if (currentDays.includes(day)) {
      setNewReminder({
        ...newReminder,
        daysOfWeek: currentDays.filter(d => d !== day),
      });
    } else {
      setNewReminder({
        ...newReminder,
        daysOfWeek: [...currentDays, day].sort(),
      });
    }
  };

  const handleTimePress = () => {
    // Parse current time
    const [hour, minute] = newReminder.time.split(':').map(Number);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    setNewReminder({
      ...newReminder,
      time: timeString,
    });
    setShowTimePicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleAddReminder = async () => {
    if (newReminder.daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    const reminder: Reminder = {
      id: generateUUIDSecure(),
      ...newReminder,
    };

    await addReminder(reminder);
    
    // Format days of week for display
    const selectedDays = newReminder.daysOfWeek
      .map(d => DAYS_OF_WEEK[d])
      .join(', ');

    // Show confirmation with reminder details
    Alert.alert(
      '✅ Reminder Active!',
      `Your reminder is now active at ${newReminder.time} on ${selectedDays}.\n\nYou will receive notifications at this time.`,
      [
        {
          text: 'Test Notification',
          onPress: async () => {
            // Send a test notification immediately to confirm it's working
            await NotificationService.showTestNotification();
          },
        },
        { text: 'OK' },
      ]
    );

    // Reset form
    setNewReminder({
      time: '09:00',
      enabled: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReminder(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="Reminders"
        subtitle="Stay hydrated throughout the day"
        rightIcon="notifications"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Add New Reminder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Reminder</Text>
          
          <View style={styles.timeContainer}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.timeInput}
              onPress={handleTimePress}
              activeOpacity={0.7}
            >
              <Text style={styles.timeInputText}>{newReminder.time}</Text>
              <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysContainer}>
            <Text style={styles.label}>Repeat</Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    newReminder.daysOfWeek.includes(index) && styles.dayButtonActive,
                  ]}
                  onPress={() => handleToggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      newReminder.daysOfWeek.includes(index) && styles.dayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddReminder}>
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Reminders */}
        <Text style={styles.sectionTitle}>Active Reminders</Text>
        {reminders.length === 0 ? (
          <Text style={styles.emptyText}>No reminders set</Text>
        ) : (
          reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onToggle={(enabled) => updateReminder(reminder.id, { enabled })}
              onDelete={() => handleDelete(reminder.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              {/* Hours Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedHour === hour && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minutes Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMinute === minute && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleTimeConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ReminderItem: React.FC<{
  reminder: Reminder;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}> = ({ reminder, onToggle, onDelete }) => {
  const daysText = reminder.daysOfWeek
    .map(d => DAYS_OF_WEEK[d])
    .join(', ');

  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTime}>{reminder.time}</Text>
        <Text style={styles.reminderDays}>{daysText}</Text>
      </View>
      <View style={styles.reminderActions}>
        <Switch
          value={reminder.enabled}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        />
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: rm(32),
    paddingBottom: rp(32),
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(20),
    marginBottom: rm(32),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: rm(20),
  },
  label: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: rm(8),
  },
  timeContainer: {
    marginBottom: rm(20),
  },
  timeInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.button,
    padding: rp(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: theme.typography.fontSize.valueMedium,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  daysContainer: {
    marginBottom: rm(20),
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
  },
  dayButton: {
    flex: 1,
    minWidth: '13%',
    paddingVertical: rp(12),
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.captionSmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  dayButtonTextActive: {
    color: theme.colors.primary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: rp(16),
    alignItems: 'center',
    ...theme.shadows.button,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: rm(8),
    marginBottom: rm(20),
  },
  emptyText: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: rm(32),
  },
  reminderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.button,
    padding: rp(16),
    marginBottom: rm(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTime: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: rm(4),
  },
  reminderDays: {
    fontSize: theme.typography.fontSize.captionSmall,
    color: theme.colors.textSecondary,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  deleteButton: {
    padding: rp(8),
  },
  deleteText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    padding: rp(20),
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rm(20),
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalCloseButton: {
    padding: rp(4),
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: rm(20),
    height: rs(200),
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: rm(8),
  },
  pickerScrollView: {
    flex: 1,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: rp(12),
    paddingHorizontal: rp(16),
    borderRadius: rs(8),
    marginVertical: rm(2),
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  pickerItemText: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  pickerItemTextSelected: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  timeSeparator: {
    fontSize: theme.typography.fontSize.valueMedium,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginHorizontal: rm(16),
    marginTop: rm(20),
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: rp(16),
    alignItems: 'center',
    marginTop: rm(20),
    ...theme.shadows.button,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#ffffff',
  },
});

export default RemindersScreen;

