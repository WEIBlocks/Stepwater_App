export const formatSteps = (steps: number): string => {
  // Return exact number without compact notation (e.g., 1000 stays 1000, not 1.0K)
  return String(steps);
};

export const formatWater = (ml: number, unit: 'metric' | 'imperial'): string => {
  if (unit === 'imperial') {
    // Convert to ounces for imperial unit, but show exact number
    const oz = Math.round(ml / 29.5735);
    return `${String(oz)} oz`;
  }
  // Return exact number in ml without compact notation (e.g., 1000 stays 1000 ml, not 1.0L)
  return `${String(Math.round(ml))} ml`;
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

