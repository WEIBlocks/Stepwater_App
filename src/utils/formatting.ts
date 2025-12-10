export const formatSteps = (steps: number): string => {
  if (steps >= 1000000) {
    return `${(steps / 1000000).toFixed(1)}M`;
  }
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}K`;
  }
  return steps.toString();
};

export const formatWater = (ml: number, unit: 'metric' | 'imperial'): string => {
  if (unit === 'imperial') {
    const oz = ml / 29.5735;
    return `${Math.round(oz)} oz`;
  }
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${Math.round(ml)} ml`;
};

export const formatDistance = (meters: number, unit: 'metric' | 'imperial'): string => {
  if (unit === 'imperial') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
};

export const formatCalories = (calories: number): string => {
  return `${Math.round(calories)} cal`;
};

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getCurrentTimeString = (): string => {
  return new Date().toISOString();
};

export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDateString();
};

