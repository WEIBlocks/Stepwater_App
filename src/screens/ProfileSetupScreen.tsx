import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { UserProfile } from '../types';
import { COLORS } from '../utils/constants';
import { wp, hp, rf, rs, rp, rm, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';
import { Header } from '../components';
import { Svg, Circle, Path } from 'react-native-svg';

interface ProfileSetupScreenProps {
  gender: string | null;
  onComplete: (profile: UserProfile) => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  gender: propGender,
  onComplete,
}) => {
  // Get existing profile from route params if editing
  const route = useRoute();
  const navigation = useNavigation<any>();
  const routeParams = route.params as any;
  const existingProfile = routeParams?.existingProfile;
  const isEditing = routeParams?.isEditing || false;
  // Allow gender to be edited - use state for editing mode
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'other' | null>(() => {
    return existingProfile?.gender || propGender || null;
  });
  const gender = selectedGender;

  // Initialize with existing profile data if editing, otherwise defaults
  const [unit, setUnit] = useState<'imperial' | 'metric'>(() => {
    if (existingProfile?.height?.centimeters || existingProfile?.weight?.kilograms) {
      return 'metric';
    }
    return 'imperial';
  });
  const [heightFeet, setHeightFeet] = useState<number>(() => {
    return existingProfile?.height?.feet || 5;
  });
  const [heightInches, setHeightInches] = useState<number>(() => {
    return existingProfile?.height?.inches || 7;
  });
  const [heightCm, setHeightCm] = useState<number>(() => {
    return existingProfile?.height?.centimeters || 170;
  });
  const [weightLbs, setWeightLbs] = useState<number>(() => {
    return existingProfile?.weight?.pounds || 154.3;
  });
  const [weightKg, setWeightKg] = useState<number>(() => {
    return existingProfile?.weight?.kilograms || 70;
  });
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [heightPickerType, setHeightPickerType] = useState<'feet' | 'inches' | 'cm'>(
    'feet'
  );
  const [weightPickerType, setWeightPickerType] = useState<'lbs' | 'kg'>('lbs');

  // Track previous unit to only sync when unit changes, not on every value change
  const prevUnitRef = useRef<'imperial' | 'metric' | null>(null);
  // Use refs to access current values without causing re-renders
  const heightFeetRef = useRef(heightFeet);
  const heightInchesRef = useRef(heightInches);
  const heightCmRef = useRef(heightCm);
  const weightLbsRef = useRef(weightLbs);
  const weightKgRef = useRef(weightKg);

  // Update refs when values change
  useEffect(() => {
    heightFeetRef.current = heightFeet;
    heightInchesRef.current = heightInches;
    heightCmRef.current = heightCm;
    weightLbsRef.current = weightLbs;
    weightKgRef.current = weightKg;
  }, [heightFeet, heightInches, heightCm, weightLbs, weightKg]);

  // Only sync values when unit changes, not on every value change (prevents infinite loop)
  useEffect(() => {
    // Skip on initial render
    if (prevUnitRef.current === null) {
      prevUnitRef.current = unit;
      return;
    }

    if (prevUnitRef.current !== unit) {
      // Unit changed - sync values using refs to get current values
      if (unit === 'imperial') {
        // Converting from metric to imperial
        const totalInches = Math.round(heightCmRef.current / 2.54);
        setHeightFeet(Math.floor(totalInches / 12));
        setHeightInches(totalInches % 12);
        setWeightLbs(Math.round((weightKgRef.current * 2.20462) * 10) / 10);
      } else {
        // Converting from imperial to metric
        const totalInches = heightFeetRef.current * 12 + heightInchesRef.current;
        setHeightCm(Math.round(totalInches * 2.54));
        setWeightKg(Math.round((weightLbsRef.current / 2.20462) * 10) / 10);
      }
      prevUnitRef.current = unit;
    }
  }, [unit]); // Only depend on unit to prevent infinite loop

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const profile: UserProfile = {
      gender: gender as 'male' | 'female' | 'other' | null,
      hasCompletedProfile: true,
    };

    if (unit === 'imperial') {
      profile.height = {
        feet: heightFeet,
        inches: heightInches,
      };
      profile.weight = {
        pounds: weightLbs,
      };
    } else {
      profile.height = {
        centimeters: heightCm,
      };
      profile.weight = {
        kilograms: weightKg,
      };
    }

    // Save profile - navigation is handled by AppNavigator
    await onComplete(profile);
  };

  const formatHeight = () => {
    if (unit === 'imperial') {
      return `${heightFeet} ft ${heightInches} in`;
    } else {
      return `${heightCm} cm`;
    }
  };

  const formatWeight = () => {
    if (unit === 'imperial') {
      return `${Math.round(weightLbs)} lbs`;
    } else {
      return `${Math.round(weightKg)} kg`;
    }
  };

  // Refs for picker scroll views
  const heightFeetListRef = useRef<FlatList>(null);
  const heightInchesListRef = useRef<FlatList>(null);
  const heightCmListRef = useRef<FlatList>(null);
  const weightLbsListRef = useRef<FlatList>(null);
  const weightKgListRef = useRef<FlatList>(null);
  
  // Track if user has interacted with pickers to prevent auto-scroll
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Reset interaction flag when picker closes
  useEffect(() => {
    if (!showHeightPicker && !showWeightPicker) {
      setHasUserInteracted(false);
    }
  }, [showHeightPicker, showWeightPicker]);

  const renderPicker = (
    type: 'height' | 'weight',
    pickerType: 'feet' | 'inches' | 'cm' | 'lbs' | 'kg',
    values: number[],
    onSelect: (value: number) => void,
    listRef?: React.RefObject<FlatList>
  ) => {
    // Find current value index for initial scroll position
    const getCurrentIndex = () => {
      if (type === 'height') {
        if (pickerType === 'feet') return heightFeet - 1;
        if (pickerType === 'inches') return heightInches;
        return cmOptions.indexOf(heightCm);
      } else {
        if (pickerType === 'lbs') {
          const rounded = Math.round(weightLbs);
          return values.indexOf(rounded);
        }
        const rounded = Math.round(weightKg);
        return values.indexOf(rounded);
      }
    };

    const currentIndex = getCurrentIndex();
    const data = values.map((value) => ({
      value,
      key: `${pickerType}-${value}`,
    }));

    return (
      <FlatList
        ref={listRef}
        data={data}
        style={styles.pickerScrollView}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        // initialScrollIndex={currentIndex >= 0 ? currentIndex : 0}
        getItemLayout={(data, index) => ({
          length: 56,
          offset: 56 * index,
          index,
        })}
        onScrollBeginDrag={() => {
          // Mark that user has started interacting with the picker
          setHasUserInteracted(true);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(item.value);
              if (type === 'height') {
                setShowHeightPicker(false);
              } else {
                setShowWeightPicker(false);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.pickerItemText}>
              {item.value}
              {pickerType === 'feet' && ' ft'}
              {pickerType === 'inches' && ' in'}
              {pickerType === 'cm' && ' cm'}
              {pickerType === 'lbs' && ' lbs'}
              {pickerType === 'kg' && ' kg'}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        onScrollToIndexFailed={(info) => {
          // Fallback if scroll fails - only if user hasn't interacted
          if (!hasUserInteracted) {
            setTimeout(() => {
              listRef?.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            }, 100);
          }
        }}
      />
    );
  };

  const feetOptions = Array.from({ length: 8 }, (_, i) => i + 1);
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i);
  const cmOptions = Array.from({ length: 150 }, (_, i) => i + 50);
  // Weight options: 50-350 lbs (in 1 lb increments for better performance)
  const lbsOptions = Array.from({ length: 301 }, (_, i) => 50 + i);
  // Weight options: 20-120 kg (in 1 kg increments for better performance)
  const kgOptions = Array.from({ length: 101 }, (_, i) => 20 + i);

  // Handle back button navigation - during setup, go back to GenderSelection
  const handleBackPress = () => {
    if (isEditing) {
      // When editing, use normal back navigation
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      // During setup, reset gender selection state and navigate to GenderSelection
      // This ensures the GenderSelection screen is available in the stack
      const resetGenderSelection = (global as any).__appNavigatorResetGenderSelection;
      if (resetGenderSelection) {
        resetGenderSelection();
      } else {
        // Fallback: try to navigate (might fail if screen not in stack)
        try {
          navigation.navigate('GenderSelection');
        } catch (error) {
          console.warn('Failed to navigate to GenderSelection:', error);
          // If navigation fails, try reset
          navigation.reset({
            index: 0,
            routes: [{ name: 'GenderSelection' }],
          });
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="My Profile"
        subtitle="Set up your profile information"
        onBackPress={handleBackPress}
      />
      <Animated.View style={styles.content}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <View style={styles.avatarIconContainer}>
                <Svg width={rs(70)} height={rs(70)} viewBox="0 0 60 60">
                  {selectedGender === 'female' && (
                    <>
                      <Circle cx="30" cy="20" r="6" fill={COLORS.primary} />
                      <Path
                        d="M 30 26 L 30 44"
                        stroke={COLORS.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 22 32 L 30 26 L 38 32"
                        stroke={COLORS.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </>
                  )}
                  {selectedGender === 'male' && (
                    <>
                      <Circle cx="30" cy="20" r="6" fill={COLORS.primary} />
                      <Path
                        d="M 30 26 L 30 40"
                        stroke={COLORS.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 26 28 L 30 24 L 34 28"
                        stroke={COLORS.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </>
                  )}
                  {(selectedGender === 'other' || selectedGender === null) && (
                    <>
                      <Circle cx="30" cy="20" r="8" fill="none" stroke={COLORS.primary} strokeWidth="2.5" />
                      <Path
                        d="M 30 28 L 30 42"
                        stroke={COLORS.primary}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <Circle cx="30" cy="46" r="3" fill={COLORS.primary} />
                    </>
                  )}
                </Svg>
              </View>
            </View>
          </View>
        </View>

        {/* Gender Selection (only show when editing) */}
        {isEditing && (
          <View style={styles.genderSection}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  selectedGender === 'male' && styles.genderOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender('male');
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    selectedGender === 'male' && styles.genderOptionTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  selectedGender === 'female' && styles.genderOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender('female');
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    selectedGender === 'female' && styles.genderOptionTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  selectedGender === 'other' && styles.genderOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender('other');
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    selectedGender === 'other' && styles.genderOptionTextActive,
                  ]}
                >
                  Other
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  selectedGender === null && styles.genderOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender(null);
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    selectedGender === null && styles.genderOptionTextActive,
                  ]}
                >
                  Prefer not to say
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[
              styles.unitButton,
              unit === 'imperial' && styles.unitButtonActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setUnit('imperial');
            }}
          >
            <Text
              style={[
                styles.unitButtonText,
                unit === 'imperial' && styles.unitButtonTextActive,
              ]}
            >
              Imperial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.unitButton,
              unit === 'metric' && styles.unitButtonActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setUnit('metric');
            }}
          >
            <Text
              style={[
                styles.unitButtonText,
                unit === 'metric' && styles.unitButtonTextActive,
              ]}
            >
              Metric
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.inputsContainer}>
          {/* Height Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height</Text>
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (unit === 'imperial') {
                  setHeightPickerType('feet');
                } else {
                  setHeightPickerType('cm');
                }
                setShowHeightPicker(true);
              }}
            >
              <Text style={styles.inputValue}>{formatHeight()}</Text>
              <Text style={styles.inputArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Weight Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <TouchableOpacity
              style={styles.inputField}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (unit === 'imperial') {
                  setWeightPickerType('lbs');
                } else {
                  setWeightPickerType('kg');
                }
                setShowWeightPicker(true);
              }}
            >
              <Text style={styles.inputValue}>{formatWeight()}</Text>
              <Text style={styles.inputArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>
              {isEditing ? 'SAVE' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Height Picker Modal */}
      <Modal
        visible={showHeightPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHeightPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowHeightPicker(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Height</Text>
              <TouchableOpacity
                onPress={() => setShowHeightPicker(false)}
                style={styles.modalDoneButton}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            {unit === 'imperial' ? (
              <View style={styles.imperialPickerRow}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerColumnLabel}>Feet</Text>
                  {renderPicker('height', 'feet', feetOptions, setHeightFeet, heightFeetListRef)}
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerColumnLabel}>Inches</Text>
                  {renderPicker('height', 'inches', inchesOptions, setHeightInches, heightInchesListRef)}
                </View>
              </View>
            ) : (
              renderPicker('height', 'cm', cmOptions, setHeightCm, heightCmListRef)
            )}
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal
        visible={showWeightPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowWeightPicker(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Weight</Text>
              <TouchableOpacity
                onPress={() => setShowWeightPicker(false)}
                style={styles.modalDoneButton}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            {renderPicker(
              'weight',
              weightPickerType,
              weightPickerType === 'lbs' ? lbsOptions : kgOptions,
              weightPickerType === 'lbs' ? setWeightLbs : setWeightKg,
              weightPickerType === 'lbs' ? weightLbsListRef : weightKgListRef
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: rp(20),
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.15,
    shadowRadius: rs(8),
    elevation: 4,
  },
  avatarIconContainer: {
    width: rs(70),
    height: rs(70),
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderSection: {
    marginBottom: rm(28),
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(12),
    marginTop: rm(12),
    justifyContent: 'center',
  },
  genderOption: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(14),
    paddingVertical: rp(18),
    paddingHorizontal: rp(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
    minHeight: rs(56),
  },
  genderOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  genderOptionText: {
    fontSize: rf(15),
    fontWeight: '600',
    color: COLORS.light.text,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: rf(15),
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(14),
    padding: rp(4),
    marginBottom: rm(32),
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.05,
    shadowRadius: rs(4),
    elevation: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: rp(12),
    alignItems: 'center',
    borderRadius: rs(10),
  },
  unitButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.2,
    shadowRadius: rs(4),
    elevation: 3,
  },
  unitButtonText: {
    fontSize: rf(15),
    fontWeight: '600',
    color: COLORS.light.textSecondary,
    letterSpacing: 0.3,
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputsContainer: {
    flex: 1,
    gap: rm(24),
  },
  inputGroup: {
    marginBottom: rm(12),
  },
  inputLabel: {
    fontSize: rf(12),
    color: COLORS.light.textSecondary,
    marginBottom: rm(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.surface,
    borderRadius: rs(18),
    paddingHorizontal: rp(20),
    paddingVertical: rp(18),
    borderWidth: 1,
    borderColor: COLORS.light.border + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.06,
    shadowRadius: rs(4),
    elevation: 2,
  },
  inputValue: {
    fontSize: rf(20),
    fontWeight: '700',
    color: COLORS.light.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  inputArrow: {
    fontSize: rf(12),
    color: COLORS.light.textSecondary,
    marginLeft: rm(8),
  },
  buttonContainer: {
    paddingBottom: rp(32),
    paddingTop: rp(20),
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: rs(16),
    paddingVertical: rp(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.3,
    shadowRadius: rs(8),
    elevation: 4,
  },
  startButtonText: {
    fontSize: rf(15),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    maxHeight: '65%',
    paddingBottom: rp(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: rs(-4) },
    shadowOpacity: 0.1,
    shadowRadius: rs(12),
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(20),
    paddingVertical: rp(18),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border + '40',
  },
  modalCancelButton: {
    padding: rp(8),
    minWidth: rs(60),
  },
  modalCancelText: {
    fontSize: rf(15),
    color: COLORS.light.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalTitle: {
    fontSize: rf(17),
    fontWeight: '700',
    color: COLORS.light.text,
    letterSpacing: -0.3,
  },
  modalDoneButton: {
    padding: rp(8),
    minWidth: rs(60),
    alignItems: 'flex-end',
  },
  modalDoneText: {
    fontSize: rf(15),
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  imperialPickerRow: {
    flexDirection: 'row',
    height: rs(320),
    paddingHorizontal: rp(8),
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: rp(8),
  },
  pickerColumnLabel: {
    fontSize: rf(12),
    color: COLORS.light.textSecondary,
    marginBottom: rm(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerScrollView: {
    maxHeight: rs(320),
  },
  pickerItem: {
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    alignItems: 'center',
    borderRadius: rs(12),
    marginVertical: rm(2),
  },
  pickerItemText: {
    fontSize: rf(17),
    color: COLORS.light.text,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default ProfileSetupScreen;

