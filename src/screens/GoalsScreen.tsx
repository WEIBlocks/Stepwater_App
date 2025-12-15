import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../state/store';
import { COLORS } from '../utils/constants';
import { theme } from '../utils/theme';
import { formatWater } from '../utils/formatting';
import { wp, hp, rf, rs, rp, rm } from '../utils/responsive';
import { Header } from '../components';

const GoalsScreen: React.FC = () => {
  const {
    stepGoal,
    waterGoal,
    setStepGoal,
    setWaterGoal,
    saveGoals,
    settings,
  } = useStore();

  const [localStepGoal, setLocalStepGoal] = useState(stepGoal.toString());
  const [localWaterGoal, setLocalWaterGoal] = useState(
    settings.unit === 'metric'
      ? waterGoal.toString()
      : (waterGoal / 29.5735).toFixed(1)
  );

  useEffect(() => {
    setLocalStepGoal(stepGoal.toString());
    setLocalWaterGoal(
      settings.unit === 'metric'
        ? waterGoal.toString()
        : (waterGoal / 29.5735).toFixed(1)
    );
  }, [stepGoal, waterGoal, settings.unit]);

  const handleSave = async () => {
    const steps = parseInt(localStepGoal, 10);
    const water = parseFloat(localWaterGoal);

    if (isNaN(steps) || steps <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Input', 'Please enter a valid step goal.');
      return;
    }

    if (isNaN(water) || water <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Input', 'Please enter a valid water goal.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStepGoal(steps);
    const waterMl = settings.unit === 'imperial' ? water * 29.5735 : water;
    setWaterGoal(waterMl);
    await saveGoals();

    Alert.alert('Success', 'Goals updated successfully!');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header
        title="Goals"
        subtitle="Set your daily targets"
        rightIcon="flag"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Daily Step Goal</Text>
          <Text style={styles.description}>
            Set how many steps you want to achieve each day
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={localStepGoal}
              onChangeText={setLocalStepGoal}
              keyboardType="number-pad"
              placeholder="10000"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={styles.unit}>steps</Text>
          </View>

          <View style={styles.quickButtons}>
            {[5000, 10000, 15000, 20000].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickButton,
                  parseInt(localStepGoal, 10) === value && styles.quickButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalStepGoal(value.toString());
                }}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    parseInt(localStepGoal, 10) === value && styles.quickButtonTextActive,
                  ]}
                >
                  {String(value)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Daily Water Goal</Text>
          <Text style={styles.description}>
            Set how much water you want to drink each day
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={localWaterGoal}
              onChangeText={setLocalWaterGoal}
              keyboardType="decimal-pad"
              placeholder={settings.unit === 'metric' ? '2000' : '67.6'}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={styles.unit}>
              {settings.unit === 'metric' ? 'ml' : 'oz'}
            </Text>
          </View>

          <View style={styles.quickButtons}>
            {(
              settings.unit === 'metric'
                ? [1500, 2000, 2500, 3000]
                : [50, 67, 84, 101]
            ).map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickButton,
                  parseFloat(localWaterGoal) === value && styles.quickButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalWaterGoal(value.toString());
                }}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    parseFloat(localWaterGoal) === value && styles.quickButtonTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Goals</Text>
        </TouchableOpacity>
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
    padding: theme.spacing.md,
    paddingTop: rm(32),
    paddingBottom: rp(32),
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: rp(20),
    marginBottom: rm(24),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  label: {
    fontSize: theme.typography.fontSize.sectionHeader,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: rm(8),
  },
  description: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: rm(16),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.button,
    paddingHorizontal: rp(16),
    marginBottom: rm(16),
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.valueMedium,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    paddingVertical: rp(12),
  },
  unit: {
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
    marginLeft: rm(8),
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: rp(12),
    paddingHorizontal: rp(8),
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  quickButtonText: {
    fontSize: theme.typography.fontSize.bodySmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  quickButtonTextActive: {
    color: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.card,
    paddingVertical: rp(16),
    alignItems: 'center',
    marginTop: rm(8),
    ...theme.shadows.button,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.sectionHeaderSmall,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#ffffff',
  },
});

export default GoalsScreen;

