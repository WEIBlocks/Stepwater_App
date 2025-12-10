import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { rp, rm, rs } from '../utils/responsive';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightIcon,
  onRightIconPress,
  showBackButton = true,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left: Back Button */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={rs(24)}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right: Icon */}
        <View style={styles.rightSection}>
          {rightIcon ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightIconPress}
              activeOpacity={0.7}
              disabled={!onRightIconPress}
            >
              <Ionicons
                name={rightIcon}
                size={rs(24)}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(16),
    paddingVertical: rp(12),
    minHeight: rs(56),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  leftSection: {
    width: rs(56),
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backButton: {
    padding: rp(8),
    borderRadius: rs(8),
    backgroundColor: 'transparent',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rp(8),
  },
  title: {
    fontSize: theme.typography.fontSize.title,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
    marginTop: rm(4),
  },
  rightSection: {
    width: rs(56),
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconButton: {
    padding: rp(8),
    borderRadius: rs(8),
    backgroundColor: 'transparent',
  },
  iconPlaceholder: {
    width: rs(40),
  },
});

export default Header;
