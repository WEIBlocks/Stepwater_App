import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Gender } from '../types';
import { COLORS } from '../utils/constants';
import { Svg, Circle, Path } from 'react-native-svg';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';
import { StorageService } from '../services/storage';
import { useStore } from '../state/store';
import { SupabaseStorageService } from '../services/supabaseStorage';

interface GenderSelectionScreenProps {
  onSelect: (gender: Gender) => void;
  onSkip: () => void;
}

const GenderSelectionScreen: React.FC<GenderSelectionScreenProps> = ({
  onSelect,
  onSkip,
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showMergeReplaceModal, setShowMergeReplaceModal] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const store = useStore();
  const loadTodayData = store.loadTodayData;
  const loadGoals = store.loadGoals;
  const loadReminders = store.loadReminders;
  const loadSettings = store.loadSettings;

  const handleSelect = (gender: Gender) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGender(gender);
  };

  const handleNext = () => {
    if (selectedGender) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(selectedGender);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  // Check if backup exists on mount
  React.useEffect(() => {
    const checkBackup = async () => {
      const backupExists = await StorageService.hasBackup();
      setHasBackup(backupExists);
    };
    checkBackup();
  }, []);

  const handleRestoreData = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Check if backup exists
      const backupExists = await StorageService.hasBackup();
      if (!backupExists) {
        Alert.alert(
          'No Previous Data Found',
          'No previous data was found to restore.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show merge/replace dialog
      setShowMergeReplaceModal(true);
    } catch (error) {
      console.error('Error checking backup:', error);
      Alert.alert(
        'Error',
        'Failed to check for backup data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestoreConfirm = async (shouldRestore: boolean) => {
    try {
      setIsRestoring(true);
      setShowMergeReplaceModal(false);

      if (shouldRestore) {
        // Merge with Current Data - Restore the data
        await StorageService.restoreFromBackup();
        
        // Sync restored data to Supabase if user is logged in
        try {
          const { supabase } = await import('../services/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            const backup = await StorageService.getBackup();
            if (backup) {
              // Sync day summaries
              if (backup.daySummaries && backup.daySummaries.length > 0) {
                for (const summary of backup.daySummaries) {
                  await SupabaseStorageService.saveDaySummary(summary).catch(() => {});
                }
              }
              
              // Sync water logs
              if (backup.waterLogs && backup.waterLogs.length > 0) {
                for (const log of backup.waterLogs) {
                  await SupabaseStorageService.addWaterLog(log).catch(() => {});
                }
              }
              
              // Sync goals
              if (backup.goals) {
                await SupabaseStorageService.saveGoals(backup.goals).catch(() => {});
              }
              
              // Sync reminders
              if (backup.reminders && backup.reminders.length > 0) {
                await SupabaseStorageService.saveReminders(backup.reminders).catch(() => {});
              }
            }
          }
        } catch (supabaseError) {
          console.warn('Supabase sync after restore failed:', supabaseError);
        }
        
        // Reload store data
        await Promise.all([
          loadTodayData(),
          loadGoals(),
          loadReminders(),
          loadSettings(),
        ]);
        
        // Restore achievements to store
        const achievements = await StorageService.getAchievements();
        if (achievements) {
          useStore.setState({
            lastAchievementStep: achievements.lastAchievementStep || false,
            lastAchievementWater: achievements.lastAchievementWater || false,
          });
        }
        
        // Check if profile exists and is completed after restore
        const hasCompletedProfile = await StorageService.hasCompletedProfile();
        if (hasCompletedProfile) {
          // Profile exists - mark onboarding as completed and navigate to home
          await StorageService.setOnboardingCompleted();
          
          // Trigger checkSetup in AppNavigator to update state and navigate
          const checkSetup = (global as any).__appNavigatorCheckSetup;
          if (checkSetup) {
            await checkSetup();
          }
        }
        
        // Clear backup after successful restore
        await StorageService.clearBackup();
        setHasBackup(false);
        
        Alert.alert(
          'Data Restored',
          'Your previous data has been successfully restored!',
          [{ text: 'OK' }]
        );
      } else {
        // Replace Current Data - Just clear the backup and hide the button
        // User will continue with setup (gender and profile)
        await StorageService.clearBackup();
        setHasBackup(false);
        
        Alert.alert(
          'Backup Cleared',
          'The backup has been cleared. You can continue with a fresh start.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error handling restore:', error);
      Alert.alert(
        'Error',
        'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const GenderOption = ({
    gender,
    label,
    symbol,
    color,
  }: {
    gender: Gender;
    label: string;
    symbol: string;
    color: string;
  }) => {
    const isSelected = selectedGender === gender;
    const optionScale = useSharedValue(1);

    const handlePress = () => {
      handleSelect(gender);
      optionScale.value = withSpring(0.95, {}, () => {
        optionScale.value = withSpring(1);
      });
    };

    const optionAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: optionScale.value }],
    }));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.genderOption,
          isSelected && styles.genderOptionSelected,
          { borderColor: isSelected ? color : COLORS.light.border },
        ]}
      >
        <Animated.View style={optionAnimatedStyle}>
          <View
            style={[
              styles.genderCircle,
              { backgroundColor: isSelected ? color + '20' : 'transparent' },
            ]}
          >
            <View style={styles.genderSymbolContainer}>
              <Svg width={60} height={60} viewBox="0 0 60 60">
                <Circle
                  cx="30"
                  cy="30"
                  r="25"
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                />
                {gender === 'female' && (
                  <>
                    {/* Female symbol - circle with cross */}
                    <Circle cx="30" cy="20" r="6" fill={color} />
                    <Path
                      d="M 30 26 L 30 44"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 22 32 L 30 26 L 38 32"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                )}
                {gender === 'male' && (
                  <>
                    {/* Male symbol - circle with arrow */}
                    <Circle cx="30" cy="20" r="6" fill={color} />
                    <Path
                      d="M 30 26 L 30 40"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M 26 28 L 30 24 L 34 28"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                )}
                {gender === 'other' && (
                  <>
                    <Circle cx="30" cy="20" r="8" fill="none" stroke={color} strokeWidth="2.5" />
                    <Path
                      d="M 30 28 L 30 42"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <Circle cx="30" cy="46" r="3" fill={color} />
                  </>
                )}
              </Svg>
            </View>
          </View>
          <Text style={[styles.genderLabel, isSelected && { color }]}>
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, animatedOpacity]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Gender</Text>
          <Text style={styles.subtitle}>
            Calories & stride length calculation needs it.
          </Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.row}>
            <GenderOption
              gender="female"
              label="Female"
              symbol="♀"
              color="#EC4899"
            />
            <GenderOption
              gender="male"
              label="Male"
              symbol="♂"
              color="#3B82F6"
            />
          </View>

          <GenderOption
            gender="other"
            label="Others / I'd rather not say"
            symbol="?"
            color="#6366F1"
          />
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedGender && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedGender}
          >
            <Text style={styles.nextButtonText}>NEXT</Text>
          </TouchableOpacity>
          {hasBackup && (
            <TouchableOpacity 
              onPress={handleRestoreData} 
              style={styles.restoreButton}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#94A3B8" />
              ) : (
                <Text style={styles.restoreText}>Restore Data</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Merge/Replace Modal */}
      <Modal
        visible={showMergeReplaceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMergeReplaceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restore Data</Text>
            <Text style={styles.modalMessage}>
              How would you like to restore your data?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.mergeButton]}
                onPress={() => handleRestoreConfirm(true)}
                disabled={isRestoring}
              >
                <Text style={styles.modalButtonText}>Merge with Current Data</Text>
                <Text style={styles.modalButtonSubtext}>
                  Restore your last deleted data (steps, goals, water, reminders, etc.)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.replaceButton]}
                onPress={() => handleRestoreConfirm(false)}
                disabled={isRestoring}
              >
                <Text style={styles.modalButtonText}>Replace Current Data</Text>
                <Text style={styles.modalButtonSubtext}>
                  Don't restore and clear the backup
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMergeReplaceModal(false);
                }}
                disabled={isRestoring}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark blue background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  titleSection: {
    marginTop: 40,
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: rm(12),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: rf(16),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: rf(22),
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: rm(32),
    gap: rm(20),
  },
  genderOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: rp(24),
    borderRadius: rs(20),
    borderWidth: 2,
    backgroundColor: '#1E293B',
    minWidth: rs(140),
  },
  genderOptionSelected: {
    borderWidth: 2.5,
  },
  genderCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rm(16),
  },
  genderLabel: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: rp(40),
    gap: rm(16),
  },
  nextButton: {
    backgroundColor: '#10B981',
    borderRadius: rs(30),
    paddingVertical: rp(18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  restoreButton: {
    padding: rp(12),
    alignItems: 'center',
  },
  restoreText: {
    fontSize: rf(14),
    color: '#94A3B8',
  },
  genderSymbolContainer: {
    width: rs(60),
    height: rs(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: rp(24),
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: rs(20),
    padding: rp(24),
    width: '100%',
    maxWidth: rs(400),
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: rm(8),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: rf(16),
    color: '#94A3B8',
    marginBottom: rm(24),
    textAlign: 'center',
    lineHeight: rf(22),
  },
  modalButtons: {
    gap: rm(12),
  },
  modalButton: {
    padding: rp(16),
    borderRadius: rs(12),
    borderWidth: 2,
    backgroundColor: '#0F172A',
  },
  mergeButton: {
    borderColor: '#3B82F6',
  },
  replaceButton: {
    borderColor: '#10B981',
  },
  cancelButton: {
    borderColor: '#475569',
    marginTop: rm(8),
  },
  modalButtonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: rm(4),
  },
  modalButtonSubtext: {
    fontSize: rf(12),
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '400',
  },
  cancelButtonText: {
    color: '#94A3B8',
  },
});

export default GenderSelectionScreen;

