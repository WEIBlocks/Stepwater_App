/**
 * Foreground Notification Service
 * Manages persistent Android foreground notification with live step and water progress
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { generateNotificationBody } from '../utils/progressBar';
import { colors } from '../utils/theme';

const NOTIFICATION_ID = 'stepwater_foreground';
const NOTIFICATION_CHANNEL_ID = 'step-water-foreground-channel';

/**
 * Foreground Notification Service Class
 * Handles creation, updates, and management of persistent foreground notification
 */
export class ForegroundNotificationService {
  private static isInitialized: boolean = false;
  private static notificationChannelCreated: boolean = false;
  private static notificationCreated: boolean = false; // Track if notification was actually created

  /**
   * Initialize the notification channel (Android only)
   */
  static async initializeChannel(): Promise<void> {
    if (Platform.OS !== 'android' || this.notificationChannelCreated) {
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Step & Water Tracker',
        description: 'Live progress tracking for steps and water intake',
        importance: Notifications.AndroidImportance.LOW, // LOW = persistent, non-intrusive, but still visible
        enableVibrate: false,
        showBadge: false,
        // Make it visible on lock screen
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      this.notificationChannelCreated = true;
      console.log('✅ Foreground notification channel created');
    } catch (error) {
      console.error('❌ Error creating notification channel:', error);
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Start the foreground notification service
   * Creates a persistent, ongoing notification that will be updated in place
   * @param stepsCurrent - Current step count
   * @param stepsGoal - Daily step goal
   * @param waterCurrent - Current water intake
   * @param waterGoal - Daily water goal
   * @param waterUnit - Unit for water display
   */
  static async startForegroundService(
    stepsCurrent: number,
    stepsGoal: number,
    waterCurrent: number,
    waterGoal: number,
    waterUnit: string = 'ml'
  ): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Foreground service is Android-only');
      return;
    }

    // CRITICAL: If notification was already created, only update it
    // Never create a duplicate notification
    if (this.notificationCreated) {
      // Notification already exists - just update it
      await this.updateForegroundService(stepsCurrent, stepsGoal, waterCurrent, waterGoal, waterUnit);
      return;
    }

    try {
      // Initialize channel first
      await this.initializeChannel();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted');
        return;
      }

      // Generate notification body
      const body = generateNotificationBody(
        stepsCurrent,
        stepsGoal,
        waterCurrent,
        waterGoal,
        waterUnit
      );

      // Create persistent foreground notification
      // This creates ONE notification that will be updated in place
      // Uses scheduleNotificationAsync with identifier 'stepwater_foreground'
      // All subsequent updates use the SAME identifier to overwrite, not duplicate
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID, // Fixed ID - all updates use this same ID
        content: {
          title: 'Step & Water Tracker',
          body: body,
          data: {
            type: 'foreground-service',
            stepsCurrent,
            stepsGoal,
            waterCurrent,
            waterGoal,
          },
          // Android-specific options for foreground service
          android: {
            channelId: NOTIFICATION_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.LOW, // LOW = persistent, non-intrusive
            ongoing: true, // Makes it non-dismissible (key property for foreground service)
            autoCancel: false, // Prevents auto-dismissal
            color: colors.primary, // Modern accent color for notification
          },
          // iOS doesn't support foreground services
          ios: {
            sound: false,
          },
        },
        trigger: null, // null = show immediately
      } as any); // Type assertion needed due to Expo Notifications type definitions

      this.isInitialized = true;
      this.notificationCreated = true; // Mark that notification was created
      console.log('✅ Foreground notification service started (notification created)');
    } catch (error) {
      console.error('❌ Error starting foreground service:', error);
    }
  }

  /**
   * Update the foreground notification with new values
   * Uses scheduleNotificationAsync() with the SAME identifier to update in place
   * This behaves like a real fitness app - single persistent notification that refreshes smoothly
   * The global notification handler suppresses alerts/sounds/badges for silent updates
   * @param stepsCurrent - Current step count
   * @param stepsGoal - Daily step goal
   * @param waterCurrent - Current water intake
   * @param waterGoal - Daily water goal
   * @param waterUnit - Unit for water display
   */
  static async updateForegroundService(
    stepsCurrent: number,
    stepsGoal: number,
    waterCurrent: number,
    waterGoal: number,
    waterUnit: string = 'ml'
  ): Promise<void> {
    // CRITICAL: Only update if notification was already created
    // Never create a new notification here - that's only done in startForegroundService
    if (Platform.OS !== 'android' || !this.isInitialized || !this.notificationCreated) {
      // If notification wasn't created yet, don't try to update
      // Let startForegroundService handle the initial creation
      return;
    }

    try {
      // Generate updated notification body
      const body = generateNotificationBody(
        stepsCurrent,
        stepsGoal,
        waterCurrent,
        waterGoal,
        waterUnit
      );

      // Use scheduleNotificationAsync with the SAME identifier to update the notification in place
      // This is the proper way to update a persistent notification - using the same identifier
      // ensures the notification is overwritten, not duplicated
      // The global notification handler will suppress alerts/sounds/badges for silent updates
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID, // SAME ID = updates existing notification, doesn't create new one
        content: {
          title: 'Step & Water Tracker',
          body: body,
          data: {
            type: 'foreground-service',
            stepsCurrent,
            stepsGoal,
            waterCurrent,
            waterGoal,
          },
          sound: false,
        },
        trigger: null, // null = show immediately (updates existing notification)
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          priority: Notifications.AndroidNotificationPriority.LOW, // Silent, no alerts
          ongoing: true, // Keep it ongoing (required for foreground service)
          autoCancel: false, // Don't auto-cancel
          color: colors.primary, // Modern accent color for notification
        },
      } as any); // Type assertion needed due to Expo Notifications type definitions

      // Silent update - no console log to avoid spam
    } catch (error) {
      console.error('❌ Error updating foreground service:', error);
    }
  }

  /**
   * Stop the foreground notification service
   */
  static async stopForegroundService(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
      await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
      this.isInitialized = false;
      this.notificationCreated = false; // Reset creation flag
      console.log('🛑 Foreground notification service stopped');
    } catch (error) {
      console.error('❌ Error stopping foreground service:', error);
    }
  }

  /**
   * Check if the foreground service is running
   */
  static isRunning(): boolean {
    return this.isInitialized;
  }
}

