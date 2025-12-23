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
  let newSize = size * scale;
  
  // Limit scaling to prevent too large/small text
  // Minimum: 0.85x (for very small devices)
  // Maximum: 1.3x (for tablets/large devices)
  const minScale = 0.85;
  const maxScale = 1.3;
  const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
  newSize = size * clampedScale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(newSize);
};

// Responsive size (for icons, circles, etc.)
export const rs = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  let newSize = size * scale;
  
  // Limit scaling for better small/large device handling
  // Minimum: 0.8x (for very small devices)
  // Maximum: 1.4x (for tablets/large devices)
  const minScale = 0.8;
  const maxScale = 1.4;
  const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
  newSize = size * clampedScale;
  
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


