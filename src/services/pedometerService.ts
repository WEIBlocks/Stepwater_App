import { Pedometer } from 'expo-sensors';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASELINE_STORAGE_KEY = '@stepwater:pedometer_baseline';
const LAST_UPDATE_STORAGE_KEY = '@stepwater:pedometer_last_update';
const LAST_CHECK_DATE_KEY = '@stepwater:pedometer_last_check_date';

interface PedometerCallback {
  (steps: number, isAvailable: boolean): void;
}

export class PedometerService {
  private static subscription: any = null;
  private static isInitialized: boolean = false;
  private static isRunning: boolean = false;
  private static baseline: number = 0;
  private static lastReportedSteps: number = 0;
  private static lastUpdateTime: number = Date.now();
  private static frozenCheckInterval: NodeJS.Timeout | null = null;
  private static callback: PedometerCallback | null = null;
  private static isExpoGo: boolean = false;
  private static hasReceivedUpdate: boolean = false;
  private static restartCooldown: number = 0;
  private static restartCount: number = 0;

  /**
   * Check if running in Expo Go
   */
  private static checkExpoGo(): boolean {
    try {
      // Expo Go detection
      const isExpoGo = 
        Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo' ||
        (Constants.manifest && Constants.manifest.id === 'expo');
      
      this.isExpoGo = isExpoGo;
      
      if (isExpoGo) {
        console.warn('⚠️ Running in Expo Go - step tracking may be unreliable');
        console.warn('💡 Build a development build for proper step tracking');
      }
      
      return isExpoGo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request pedometer permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 29) {
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
        }
        return true;
      }
      return true; // iOS handles permissions automatically
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if pedometer is available
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      console.log('📱 Pedometer available:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('❌ Error checking pedometer availability:', error);
      return false;
    }
  }

  /**
   * Restore baseline from storage
   */
  private static async restoreBaseline(): Promise<number> {
    try {
      const now = new Date();
      const today = now.toDateString();
      const lastCheckDate = await AsyncStorage.getItem(LAST_CHECK_DATE_KEY);
      
      // Check if it's a new day
      if (lastCheckDate !== today) {
        console.log('🆕 New day detected - resetting baseline');
        await AsyncStorage.setItem(LAST_CHECK_DATE_KEY, today);
        await AsyncStorage.removeItem(BASELINE_STORAGE_KEY);
        await AsyncStorage.removeItem(LAST_UPDATE_STORAGE_KEY);
        this.baseline = 0;
        return 0;
      }
      
      // Restore baseline for same day
      const storedBaseline = await AsyncStorage.getItem(BASELINE_STORAGE_KEY);
      if (storedBaseline) {
        this.baseline = parseInt(storedBaseline, 10) || 0;
        console.log('📊 Restored baseline:', this.baseline);
        return this.baseline;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Error restoring baseline:', error);
      return 0;
    }
  }

  /**
   * Save baseline to storage
   */
  private static async saveBaseline(baseline: number): Promise<void> {
    try {
      this.baseline = baseline;
      await AsyncStorage.setItem(BASELINE_STORAGE_KEY, baseline.toString());
      console.log('💾 Saved baseline:', baseline);
    } catch (error) {
      console.error('❌ Error saving baseline:', error);
    }
  }

  /**
   * Handle step update from pedometer
   */
  private static handleStepUpdate(rawSteps: number): void {
    if (!this.isRunning || !this.callback) {
      return;
    }

    try {
      // Mark that we've received at least one update
      this.hasReceivedUpdate = true;
      
      // Reset restart count on successful update
      this.restartCount = 0;
      
      // Update last update time FIRST - this prevents false frozen detection
      this.lastUpdateTime = Date.now();
      
      // First reading - set baseline
      if (this.baseline === 0 && rawSteps > 0) {
        this.baseline = rawSteps;
        this.saveBaseline(this.baseline);
        console.log('📌 First reading - baseline set to:', this.baseline);
      }

      // Calculate current steps: rawSteps - baseline
      const calculatedSteps = Math.max(0, rawSteps - this.baseline);
      
      // Log for debugging - only log when steps actually change
      if (calculatedSteps !== this.lastReportedSteps) {
        console.log('📈 Step update:', {
          rawSteps,
          baseline: this.baseline,
          calculatedSteps,
          previous: this.lastReportedSteps,
        });
        this.lastReportedSteps = calculatedSteps;
      }
      // Don't log when steps don't change - reduces log spam
      
      // Always call callback - let store handle deduplication
      this.callback(calculatedSteps, true);
    } catch (error) {
      console.error('❌ Error handling step update:', error);
    }
  }

  /**
   * Check if sensor is frozen and restart if needed
   * 
   * IMPORTANT: On Android, the pedometer callback only fires when steps CHANGE.
   * If you're not moving, the callback won't fire - this is NORMAL behavior.
   * We should only restart if we suspect the sensor is truly broken, not just because
   * you're standing still.
   */
  private static checkFrozenSensor(): void {
    if (!this.isRunning) {
      return;
    }

    // Don't check if we're in cooldown period
    if (this.restartCooldown > Date.now()) {
      return; // Silent cooldown - don't spam logs
    }

    const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
    
    // Don't restart if we haven't received at least one update yet
    // Give the sensor time to "warm up" (30 seconds grace period)
    if (!this.hasReceivedUpdate) {
      if (timeSinceLastUpdate < 30000) {
        return; // Still in grace period, don't check yet
      } else {
        // After 30 seconds with no updates, this might indicate a problem
        // But don't restart - just log a warning and wait longer
        if (timeSinceLastUpdate < 120000) { // 2 minutes
          console.log(`⏳ Waiting for sensor to initialize (${Math.ceil(timeSinceLastUpdate / 1000)}s)`);
          return;
        }
        // After 2 minutes with no updates at all, something might be wrong
        // But still don't restart - some sensors take a very long time to initialize
        console.warn('⚠️ Sensor has not sent any updates after 2 minutes');
        console.warn('   This might be normal for some devices - sensor will start when you move');
        return;
      }
    }

    // IMPORTANT: The sensor callback only fires when steps CHANGE.
    // If you're standing still, no callbacks = normal behavior.
    // We should only restart if:
    // 1. We've received updates before (sensor was working)
    // 2. It's been a VERY long time (5+ minutes) with no updates
    // 3. AND we haven't restarted too many times already

    // Prevent infinite restart loops - max 1 restart per hour
    if (this.restartCount >= 1) {
      const COOLDOWN_PERIOD = 3600000; // 1 hour cooldown after 1 restart
      this.restartCooldown = Date.now() + COOLDOWN_PERIOD;
      this.restartCount = 0;
      console.log('⏳ Restart cooldown active (1 hour) - sensor will be monitored but not restarted');
      return;
    }

    // Only restart if it's been 5+ minutes with no updates
    // This is a very long time - only restart if sensor is truly broken
    const FROZEN_THRESHOLD = 300000; // 5 minutes (300 seconds)

    if (timeSinceLastUpdate > FROZEN_THRESHOLD) {
      // This is a last resort - sensor might be truly broken
      console.warn('⚠️ Sensor appears frozen - attempting restart (last resort)');
      console.warn(`   Last update: ${Math.ceil(timeSinceLastUpdate / 60)} minutes ago`);
      console.warn('   Note: If you are not moving, this is normal - sensor only updates when steps change');
      
      this.restartCount++;
      this.restartWatchIfFrozen();
    }
    // Don't log "sensor active" - it's normal for callbacks to not fire when not moving
  }

  /**
   * Restart watch if frozen
   */
  private static restartWatchIfFrozen(): void {
    if (!this.isRunning || !this.callback) {
      return;
    }

    console.log('🔄 Restarting pedometer watch...');
    
    // Reset update flag - we'll wait for new update
    this.hasReceivedUpdate = false;
    
    // Clean up existing subscription
    this.cleanupWatch();
    
    // Cooldown period before restart (2 seconds)
    this.restartCooldown = Date.now() + 2000;
    
    // Delay before restart to let sensor settle
    setTimeout(() => {
      if (this.isRunning && this.callback) {
        // Reset last update time to give sensor time to respond
        this.lastUpdateTime = Date.now();
        this.startStepWatch(this.callback);
      }
    }, 1000);
  }

  /**
   * Start step watch subscription
   */
  private static startStepWatch(callback: PedometerCallback): void {
    if (this.subscription) {
      console.warn('⚠️ Subscription already exists - cleaning up first');
      this.cleanupWatch();
    }

    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🚀 Starting pedometer watch...');
      
      this.subscription = Pedometer.watchStepCount((result) => {
        if (!this.isRunning) {
          return;
        }

        // Always update lastUpdateTime when callback fires (even if steps haven't changed)
        // This prevents false "frozen" detection
        this.lastUpdateTime = Date.now();

        const rawSteps = result.steps || 0;
        const isAvailable = result.isAvailable !== false;

        // Don't log every callback - only log in handleStepUpdate when steps change
        // The callback fires when steps change, which is what we want

        if (isAvailable) {
          this.handleStepUpdate(rawSteps);
        } else {
          console.warn('⚠️ Pedometer not available in callback');
          callback(0, false);
        }
      });

      if (!this.subscription) {
        console.error('❌ Failed to create pedometer subscription');
        callback(0, false);
        return;
      }

      console.log('✅ Pedometer watch started successfully');
      
      // Start frozen sensor detection
      this.startFrozenDetection();
    } catch (error) {
      console.error('❌ Error starting step watch:', error);
      callback(0, false);
    }
  }

  /**
   * Start frozen sensor detection
   */
  private static startFrozenDetection(): void {
    // Clear existing interval
    if (this.frozenCheckInterval) {
      clearInterval(this.frozenCheckInterval);
    }

    // Check every 30 seconds (much less frequent to avoid interference and reduce log spam)
    // The sensor callback only fires when steps change, so frequent checks are unnecessary
    this.frozenCheckInterval = setInterval(() => {
      this.checkFrozenSensor();
    }, 30000);
  }

  /**
   * Cleanup watch subscription
   */
  private static cleanupWatch(): void {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
        console.log('🧹 Cleaned up pedometer subscription');
      }

      if (this.frozenCheckInterval) {
        clearInterval(this.frozenCheckInterval);
        this.frozenCheckInterval = null;
      }
    } catch (error) {
      console.error('❌ Error cleaning up watch:', error);
    }
  }

  /**
   * Initialize pedometer
   */
  static async initPedometer(callback: PedometerCallback): Promise<boolean> {
    // Prevent multiple initializations
    if (this.isInitialized && this.isRunning) {
      console.warn('⚠️ Pedometer already initialized');
      return true;
    }

    this.isInitialized = true;
    this.isRunning = true;
    this.callback = callback;

    try {
      // Check Expo Go
      const isExpoGo = this.checkExpoGo();
      if (isExpoGo) {
        console.warn('⚠️ Expo Go detected - step tracking may be unreliable');
        // Still try to initialize, but warn user
      }

      // Request permissions
      console.log('🔐 Requesting permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ Permissions denied');
        callback(0, false);
        return false;
      }

      // Check availability
      console.log('🔍 Checking pedometer availability...');
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        console.error('❌ Pedometer not available');
        callback(0, false);
        return false;
      }

      // Restore baseline
      console.log('📊 Restoring baseline...');
      await this.restoreBaseline();

      // Reset state for new initialization
      this.hasReceivedUpdate = false;
      this.restartCount = 0;
      this.restartCooldown = 0;
      this.lastUpdateTime = Date.now(); // Set initial time
      this.lastReportedSteps = 0;

      // Start step watch
      this.startStepWatch(callback);

      console.log('✅ Pedometer initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing pedometer:', error);
      callback(0, false);
      return false;
    }
  }

  /**
   * Stop pedometer
   */
  static stopPedometer(): void {
    console.log('🛑 Stopping pedometer...');
    this.isRunning = false;
    this.cleanupWatch();
    this.isInitialized = false;
    this.callback = null;
    this.hasReceivedUpdate = false;
    this.restartCount = 0;
    this.restartCooldown = 0;
  }

  /**
   * Get current baseline
   */
  static getBaseline(): number {
    return this.baseline;
  }

  /**
   * Check if running in Expo Go
   */
  static isRunningInExpoGo(): boolean {
    return this.isExpoGo;
  }
}

// Default export for compatibility
export default PedometerService;
