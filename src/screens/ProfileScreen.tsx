import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/storage';
import { ExportService } from '../services/exportService';
import { PedometerService } from '../services/pedometerService';
import { useStore } from '../state/store';
import { COLORS } from '../utils/constants';
import type { UserProfile } from '../types';
import { wp, hp, rf, rs, rp, rm } from '../utils/responsive';
import { Header } from '../components';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const stored = await StorageService.getProfile();
      setProfile(stored);
    };
    loadProfile();
  }, []);

  // Reload profile when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const loadProfile = async () => {
        const stored = await StorageService.getProfile();
        setProfile(stored);
      };
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const heightText = () => {
    if (!profile?.height) {
      return '172 cm';
    }

    if (profile.height.centimeters != null) {
      return `${profile.height.centimeters} cm`;
    }

    if (profile.height.feet != null && profile.height.inches != null) {
      return `${profile.height.feet} ft ${profile.height.inches} in`;
    }

    return '172 cm';
  };

  const weightText = () => {
    if (!profile?.weight) {
      return '70 kg';
    }

    if (profile.weight.kilograms != null) {
      return `${profile.weight.kilograms} kg`;
    }

    if (profile.weight.pounds != null) {
      return `${profile.weight.pounds} lbs`;
    }

    return '70 kg';
  };

  const genderText = () => {
    if (!profile?.gender) {
      return 'Not set';
    }
    return profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
  };

  const handleEditProfile = () => {
    // Navigate to ProfileSetupScreen with existing profile for editing
    if (profile) {
      navigation.navigate('ProfileSetup', {
        isEditing: true,
        existingProfile: profile,
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will delete all your steps, water history, profile, goals, reminders, streaks, and settings. This action cannot be undone. You will be taken back to the onboarding screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Create backup before deletion
              await StorageService.createBackup();
              
              // Stop pedometer first
              PedometerService.stopPedometer();
              
              // Clear all Supabase data (if configured) - do this before clearing local storage
              try {
                const { SupabaseStorageService } = await import('../services/supabaseStorage');
                await SupabaseStorageService.deleteAllData();
              } catch (supabaseError) {
                // Ignore Supabase errors - local data will still be cleared
                console.warn('Supabase cleanup error (non-critical):', supabaseError);
              }
              
              // Get backup before clearing (to restore it after)
              const backup = await StorageService.getBackup();
              
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              
              // Restore backup immediately after clearing (so it's available for restore later)
              if (backup) {
                await AsyncStorage.setItem('@stepwater:backup_data', JSON.stringify(backup));
              }
              
              // Reset all store state to initial/zero values
              const store = useStore.getState();
              
              // Reset steps to 0
              store.setCurrentSteps(0);
              
              // Reset goals to defaults
              store.setStepGoal(10000);
              store.setWaterGoal(2000);
              
              // Reset achievements
              store.resetAchievements();
              
              // Reset pedometer and loading state
              store.setPedometerAvailable(false);
              store.setLoading(false);
              
              // Manually reset all state values to zero/defaults
              useStore.setState({
                currentSteps: 0,
                waterConsumed: 0,
                waterLogs: [],
                todaySummary: null,
                reminders: [],
                settings: {
                  unit: 'metric',
                  theme: 'auto',
                  accentColor: '#6366f1',
                  notificationsEnabled: true,
                  hasCompletedOnboarding: false,
                },
                isStepTrackingPaused: false,
                lastAchievementStep: false,
                lastAchievementWater: false,
              });
              
              // Save default goals to storage
              await StorageService.saveGoals({
                dailySteps: 10000,
                dailyWaterMl: 2000,
              });
              
              // Save default settings
              await StorageService.saveSettings({
                unit: 'metric',
                theme: 'auto',
                accentColor: '#6366f1',
                notificationsEnabled: true,
                hasCompletedOnboarding: false,
              });
              
              // Save reset achievements
              await StorageService.saveAchievements({
                lastAchievementStep: false,
                lastAchievementWater: false,
              });
              
              // Reset profile state
              setProfile(null);
              
              Alert.alert(
                'Account Deleted',
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
                'Failed to delete account data. Please try again.'
              );
              console.error('Error deleting account data:', error);
            }
          },
        },
      ]
    );
  };

  const handleExportStepsCsv = async () => {
    try {
      await ExportService.shareStepsCsv();
      Alert.alert('Success', 'Steps log exported successfully!');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to export steps log. Please try again.'
      );
    }
  };

  const handleExportWaterCsv = async () => {
    try {
      await ExportService.shareWaterCsv();
      Alert.alert('Success', 'Water log exported successfully!');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to export water log. Please try again.'
      );
    }
  };

  const getAvatarIcon = () => {
    if (!profile?.gender) return '👤';
    if (profile.gender === 'male') return '♂';
    if (profile.gender === 'female') return '♀';
    return '👤';
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="Profile"
        rightIcon="person"
      />
      
      {/* Profile Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarIcon()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{heightText()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{weightText()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Gender</Text>
            <Text style={styles.statValue}>{genderText()}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleEditProfile}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>

          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExportStepsCsv}
          >
            <Text style={styles.exportLabel}>Steps Log</Text>
            <Text style={styles.exportAction}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExportWaterCsv}
          >
            <Text style={styles.exportLabel}>Water Log</Text>
            <Text style={styles.exportAction}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: rm(20),
    paddingBottom: rm(16),
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: COLORS.primary + '15',
    borderWidth: 3,
    borderColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(8),
    elevation: 4,
  },
  avatarText: {
    fontSize: rf(36),
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: rp(20),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(16),
    paddingVertical: rp(24),
    paddingHorizontal: rp(20),
    marginBottom: rm(32),
    marginTop: rm(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.08,
    shadowRadius: rs(8),
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: rf(11),
    color: COLORS.light.textSecondary,
    marginBottom: rm(10),
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: rf(17),
    color: COLORS.light.text,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rm(32),
  },
  actionButton: {
    flex: 1,
    paddingVertical: rp(14),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: rm(6),
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: rf(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dangerButton: {
    backgroundColor: COLORS.light.surface,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(4),
    elevation: 3,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: rf(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  section: {
    marginTop: rm(20),
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: COLORS.light.text,
    marginBottom: rm(16),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(14),
    paddingVertical: rp(16),
    paddingHorizontal: rp(18),
    marginBottom: rm(10),
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.05,
    shadowRadius: rs(4),
    elevation: 2,
  },
  exportLabel: {
    fontSize: rf(15),
    color: COLORS.light.text,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  exportAction: {
    fontSize: rf(13),
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
});

export default ProfileScreen;


