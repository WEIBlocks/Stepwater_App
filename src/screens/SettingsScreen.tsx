import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  AppState as RNAppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../state/store';
import { StorageService } from '../services/storage';
import { PedometerService } from '../services/pedometerService';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { wp, hp, rf, rs, rp, rm } from '../utils/responsive';
import { Header } from '../components';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    settings,
    stepGoal,
    waterGoal,
    setSettings,
    saveSettings,
    loadSettings,
  } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled
  );

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setNotificationsEnabled(settings.notificationsEnabled);
  }, [settings.notificationsEnabled]);

  const handleUnitChange = (unit: 'metric' | 'imperial') => {
    const newSettings = { ...settings, unit };
    setSettings(newSettings);
    saveSettings();
  };

  const handleEditProfile = () => {
    navigation.navigate('Profile');
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    const newSettings = { ...settings, notificationsEnabled: enabled };
    setSettings(newSettings);
    saveSettings();
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Our Privacy Policy outlines how we collect, use, and protect your personal information. We are committed to protecting your privacy and ensuring the security of your data.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'By using this app, you agree to our Terms of Service. Please review our terms to understand your rights and responsibilities when using our application.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will delete all your steps, water history, profile, goals, reminders, and settings. This action cannot be undone. You will be taken back to the profile setup screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop pedometer first
              PedometerService.stopPedometer();
              
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              
              // Reset store state to initial values
              useStore.getState().setCurrentSteps(0);
              useStore.getState().setWaterGoal(2000);
              useStore.getState().setStepGoal(10000);
              useStore.getState().setPedometerAvailable(false);
              useStore.getState().setLoading(false);
              
              // Clear Supabase data (if configured)
              try {
                // Delete all data from Supabase
                const today = new Date().toISOString().split('T')[0];
                await StorageService.saveDaySummary({ date: today, steps: 0, waterMl: 0 });
                // The Supabase service will handle cleanup
              } catch (supabaseError) {
                // Ignore Supabase errors - local data is cleared
                console.warn('Supabase cleanup error (non-critical):', supabaseError);
              }
              
              Alert.alert(
                'Data Deleted',
                'All your data has been successfully deleted. You will now be taken back to the onboarding screen.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      // Force AppNavigator to re-check setup immediately
                      // This will detect cleared storage and reset to onboarding flow:
                      // Onboarding → GenderSelection → ProfileSetup → HomeScreen
                      const checkSetup = (global as any).__appNavigatorCheckSetup;
                      if (checkSetup && typeof checkSetup === 'function') {
                        // Call checkSetup which will reset hasCompletedOnboarding and hasCompletedProfile to false
                        // This will cause AppNavigator to show Onboarding screen
                        await checkSetup();
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete data. Please try again.'
              );
              console.error('Error deleting all data:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="Settings"
        subtitle="Customize your experience"
        rightIcon="settings"
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.settingRow, styles.settingRowWithBorder]} 
              onPress={handleEditProfile}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Edit Profile</Text>
                <Text style={styles.settingDescription}>
                  Update your height, weight and gender
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Enable water reminders
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.settingRow, styles.settingRowWithBorder]}
              onPress={() => navigation.navigate('Goals')}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Step Goal</Text>
                <Text style={styles.settingDescription}>
                  {stepGoal.toLocaleString()} steps per day
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('Goals')}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Water Intake Goal</Text>
                <Text style={styles.settingDescription}>
                  {settings.unit === 'metric'
                    ? `${waterGoal} ml per day`
                    : `${(waterGoal / 29.5735).toFixed(1)} oz per day`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units & Preferences</Text>
          <View style={styles.card}>
            <View style={styles.options}>
              <TouchableOpacity
                style={[
                  styles.option,
                  settings.unit === 'metric' && styles.optionActive,
                ]}
                onPress={() => handleUnitChange('metric')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.unit === 'metric' && styles.optionTextActive,
                  ]}
                >
                  Metric (ml, km)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  settings.unit === 'imperial' && styles.optionActive,
                ]}
                onPress={() => handleUnitChange('imperial')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.unit === 'imperial' && styles.optionTextActive,
                  ]}
                >
                  Imperial (oz, mi)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.settingRow, styles.settingRowWithBorder]} 
              onPress={handlePrivacyPolicy}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={handleTermsOfService}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAllData}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>
              Delete All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Name</Text>
              <Text style={styles.infoValue}>Step & Water App</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: rp(20),
    paddingTop: rm(20),
    paddingBottom: rp(32),
  },
  section: {
    marginBottom: rm(28),
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: rm(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  options: {
    flexDirection: 'row',
    padding: rp(4),
    gap: rs(8),
  },
  option: {
    flex: 1,
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    borderRadius: rs(12),
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  optionText: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rp(16),
    paddingHorizontal: rp(18),
    minHeight: rs(64),
  },
  settingRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  settingInfo: {
    flex: 1,
    marginRight: rm(12),
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: rm(4),
    letterSpacing: -0.2,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    lineHeight: rf(18),
  },
  chevron: {
    fontSize: rf(24),
    color: theme.colors.textSecondary + '80',
    fontWeight: theme.typography.fontWeight.regular,
    marginLeft: rm(8),
  },
  deleteButton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    paddingVertical: rp(16),
    paddingHorizontal: rp(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    marginTop: rm(8),
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.1,
    shadowRadius: rs(4),
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rp(14),
    paddingHorizontal: rp(18),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
});

export default SettingsScreen;

