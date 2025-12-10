import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Responsive width (percentage of screen width)
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height (percentage of screen height)
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font size (scales based on screen width)
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  // Limit scaling to prevent too large/small text
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(newSize);
};

// Responsive size (for icons, circles, etc.)
export const rs = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Get responsive dimensions
export const getResponsiveDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 360,
  isMediumDevice: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 768,
});

// Responsive padding
export const rp = (size: number): number => {
  return rs(size);
};

// Responsive margin
export const rm = (size: number): number => {
  return rs(size);
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };


