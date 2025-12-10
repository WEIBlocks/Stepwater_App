import { Pedometer } from 'expo-sensors';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PedometerResult } from '../types';

export class PedometerService {
  private static isAvailable: boolean | null = null;
  private static subscription: any = null;
  private static isAndroid: boolean = Platform.OS === 'android';
  private static androidStartSteps: number = 0; // Steps when app started (Android)
  private static androidWatchSubscription: any = null;
  private static isInitializing: boolean = false;

  /**
   * Request pedometer permissions explicitly
   * This is important for Android devices
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (this.isAndroid) {
        // Android 10+ requires ACTIVITY_RECOGNITION permission
        if (Platform.Version >= 29) {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
              {
                title: 'Activity Recognition Permission',
                message: 'This app needs access to your activity to count steps.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              console.log('✅ Activity Recognition permission granted');
              return true;
            } else {
              console.warn('⚠️ Activity Recognition permission denied');
              return false;
            }
          } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
          }
        }
        // Android < 10 doesn't need explicit permission
        return true;
      } else {
        // iOS permissions are handled automatically by the system
        return true;
      }
    } catch (error) {
      console.error('Error in requestPermissions:', error);
      return false;
    }
  }

  static async checkAvailability(): Promise<boolean> {
    try {
      // First request permissions if needed
      await this.requestPermissions();
      
      if (this.isAvailable === null) {
        this.isAvailable = await Pedometer.isAvailableAsync();
        console.log('📱 Pedometer available:', this.isAvailable);
        
        if (!this.isAvailable) {
          console.warn('⚠️ Pedometer is not available on this device');
          console.warn('   This could be because:');
          console.warn('   1. Device does not have a step counter sensor');
          console.warn('   2. Running in simulator/emulator');
          console.warn('   3. Permissions not granted');
        }
      }
      return this.isAvailable;
    } catch (error) {
      console.error('Error checking pedometer availability:', error);
      return false;
    }
  }

  static async getStepCountAsync(startDate: Date, endDate: Date): Promise<number> {
    try {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        return 0;
      }

      // Android doesn't support getStepCountAsync with date ranges
      // This will throw an error, so we catch it and return 0
      if (this.isAndroid) {
        // Android limitation - date range queries not supported
        // Steps are tracked via watchStepCount instead
        return 0;
      }

      // iOS supports date range queries
      const result = await Pedometer.getStepCountAsync(startDate, endDate);
      return result.steps || 0;
    } catch (error: any) {
      // Silently handle Android limitation - this is expected behavior
      if (this.isAndroid && error?.message?.includes('not supported on Android')) {
        return 0;
      }
      // Only log non-Android errors
      if (!this.isAndroid) {
        console.error('Error getting step count:', error);
      }
      return 0;
    }
  }

  static watchStepCount(
    callback: (result: PedometerResult) => void,
    updateInterval: number = 5000,
    initialSteps: number = 0
  ): () => void {
    // Prevent multiple subscriptions - if one exists, return its cleanup
    if (this.subscription && !this.isInitializing) {
      return () => {
        if (this.subscription) {
          try {
            this.subscription.remove();
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      };
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      return () => {}; // Return empty cleanup function
    }

    // Clean up existing subscription if any
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.subscription = null;
    }

    // Clean up Android subscription if any
    if (this.androidWatchSubscription) {
      try {
        this.androidWatchSubscription.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.androidWatchSubscription = null;
    }

    this.isInitializing = true;
    let isRunning = true;

    // Safety timeout: reset isInitializing flag after 10 seconds if it gets stuck
    const safetyTimeout = setTimeout(() => {
      if (this.isInitializing) {
        console.warn('Pedometer initialization timeout - resetting flag');
        this.isInitializing = false;
      }
    }, 10000);

    const initializeAndroidPedometer = async () => {
      if (this.androidWatchSubscription) {
        return; // Already initialized
      }

      try {
        console.log('📱 Initializing Android pedometer...');
        
        // Check if it's a new day
        const now = new Date();
        const today = now.toDateString();
        const lastCheck = await this.getLastCheckDate().catch(() => '');
        
        // Baseline: first pedometer reading of the day
        // If new day, baseline will be set from first callback
        // If same day, restore baseline from storage
        let baseline: number | null = null;
        let hasReceivedFirstCallback = false;
        let lastReportedSteps = initialSteps; // Track last reported value to prevent duplicate updates
        
        if (lastCheck !== today) {
          // New day - reset baseline
          baseline = null;
          this.androidStartSteps = 0;
          await this.setLastCheckDate(today).catch(() => {});
          await this.setAndroidStepsAtStart(0).catch(() => {});
          console.log('🔄 New day detected - baseline will be set from first pedometer reading');
        } else {
          // Same day - restore baseline from storage
          const storedBaseline = await this.getAndroidStepsAtStart().catch(() => 0);
          baseline = storedBaseline;
          this.androidStartSteps = storedBaseline;
          console.log('📊 Restored baseline for today:', baseline);
          
          // Send initial update with current steps from store
          if (isRunning && initialSteps >= 0) {
            callback({ steps: initialSteps, isAvailable: true });
            lastReportedSteps = initialSteps;
          }
        }

        // Start watching steps on Android
        // Simple logic: baseline = first reading of the day, currentSteps = pedometerSteps - baseline
        this.androidWatchSubscription = Pedometer.watchStepCount(async (result) => {
          if (!isRunning) {
            return;
          }
          
          try {
            const pedometerSteps = result.steps || 0;
            
            // First callback of the day - set baseline
            if (!hasReceivedFirstCallback) {
              hasReceivedFirstCallback = true;
              
              // Baseline = first pedometer reading of the day
              if (baseline === null) {
                baseline = pedometerSteps;
                this.androidStartSteps = baseline;
                await this.setAndroidStepsAtStart(baseline).catch(() => {});
                console.log('📌 First callback - baseline set to:', baseline);
              }
            }
            
            // Ensure baseline is set (should not be null at this point)
            if (baseline === null) {
              baseline = pedometerSteps;
              this.androidStartSteps = baseline;
              await this.setAndroidStepsAtStart(baseline).catch(() => {});
            }
            
            // Calculate current steps: pedometerSteps - baseline
            const calculatedSteps = Math.max(0, pedometerSteps - baseline);
            
            // Always update callback - let the store/hook handle deduplication
            // This ensures instant updates on every pedometer reading change
            callback({ steps: calculatedSteps, isAvailable: true });
            
            // Update last reported for logging only
            if (calculatedSteps !== lastReportedSteps) {
              lastReportedSteps = calculatedSteps;
              console.log('📈 Steps updated:', calculatedSteps, '(pedometer:', pedometerSteps, ', baseline:', baseline, ')');
            }
          } catch (error) {
            console.error('❌ Error in Android step watch callback:', error);
          }
        });

        // Verify subscription was created
        if (!this.androidWatchSubscription) {
          console.error('❌ FAILED to create Android pedometer subscription');
          if (isRunning) {
            callback({ steps: 0, isAvailable: false });
          }
          this.isInitializing = false;
          return;
        }
        
        console.log('✅ Android pedometer watchStepCount started successfully!');
        console.log('📱 Subscription created and active');
        console.log('🚶 Start walking - steps will update automatically!');
      } catch (error) {
        console.error('Error initializing Android pedometer:', error);
        if (isRunning) {
          callback({ steps: 0, isAvailable: false });
        }
      }
    };

    const checkSteps = async () => {
      if (!isRunning) return;
      
      try {
        const isAvailable = await this.checkAvailability();
        if (!isAvailable) {
          console.warn('Pedometer is not available');
          callback({ steps: 0, isAvailable: false });
          return;
        }

        if (this.isAndroid) {
          // Android: Initialize watchStepCount immediately
          await initializeAndroidPedometer();
        } else {
          // iOS: Use date range query (supported on iOS)
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const pedometerSteps = await this.getStepCountAsync(startOfDay, now);
          
          // Use the maximum of pedometer steps and initial steps (from store)
          const finalSteps = Math.max(pedometerSteps, initialSteps || 0);
          
          if (isRunning) {
            console.log('iOS step count:', finalSteps, '(pedometer:', pedometerSteps, ', initial:', initialSteps, ')');
            callback({ steps: finalSteps, isAvailable: true });
          }
        }
      } catch (error: any) {
        // Silently handle Android-specific errors (expected behavior)
        if (this.isAndroid && error?.message?.includes('not supported on Android')) {
          // Expected on Android - steps are tracked via watchStepCount
          return;
        }
        // Only log unexpected errors
        console.error('Error in checkSteps:', error);
        if (isRunning) {
          callback({ steps: initialSteps || 0, isAvailable: false });
        }
      }
    };

    // For iOS: use interval-based checking with date range
    // For Android: watchStepCount handles updates automatically
    if (!this.isAndroid) {
      // Initialize immediately for iOS
      checkSteps()
        .then(() => {
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
        })
        .catch((error) => {
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
          console.error('Failed to initialize iOS pedometer:', error);
          if (isRunning) {
            callback({ steps: 0, isAvailable: false });
          }
        });
      
      // Use very fast interval for instant updates (250ms for iOS)
      const fastInterval = Math.min(updateInterval, 250);
      const interval = setInterval(() => {
        checkSteps().catch(() => {}); // Suppress errors in interval
      }, fastInterval);

      this.subscription = {
        remove: () => {
          isRunning = false;
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
          clearInterval(interval);
          this.subscription = null;
        },
      };
    } else {
      // Android: Initialize immediately to start tracking right away
      checkSteps()
        .then(() => {
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
          console.log('Android pedometer initialization complete');
        })
        .catch((error) => {
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
          console.error('Failed to initialize Android pedometer:', error);
          if (isRunning) {
            callback({ steps: 0, isAvailable: false });
          }
        });
      
      this.subscription = {
        remove: () => {
          isRunning = false;
          clearTimeout(safetyTimeout);
          this.isInitializing = false;
          
          if (this.androidWatchSubscription) {
            try {
              this.androidWatchSubscription.remove();
              console.log('Android pedometer subscription removed');
            } catch (error) {
              console.warn('Error removing Android pedometer subscription:', error);
            }
            this.androidWatchSubscription = null;
          }
          this.subscription = null;
        },
      };
    }

    return () => {
      if (this.subscription) {
        this.subscription.remove();
      }
    };
  }

  // Helper methods for Android daily reset
  private static lastCheckDateKey = '@stepwater:last_check_date';
  private static androidStepsAtStartKey = '@stepwater:android_steps_at_start';
  
  private static async getLastCheckDate(): Promise<string> {
    try {
      return await AsyncStorage.getItem(this.lastCheckDateKey) || '';
    } catch {
      return '';
    }
  }

  private static async setLastCheckDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.lastCheckDateKey, date);
    } catch (error) {
      // Ignore storage errors
    }
  }

  private static async getAndroidStepsAtStart(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(this.androidStepsAtStartKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private static async setAndroidStepsAtStart(steps: number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.androidStepsAtStartKey, steps.toString());
    } catch (error) {
      // Ignore storage errors
    }
  }
}

