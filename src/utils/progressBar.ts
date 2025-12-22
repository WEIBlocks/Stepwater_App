/**
 * Progress Bar Utility Functions
 * Generates simple notification format with icons and values
 */

// Icons matching the image design
const STEP_ICON = '🚶'; // Walking person icon
const WATER_ICON = '💧'; // Blue water droplet icon

/**
 * Formats a progress notification line - simple format with icon and values
 * @param icon - Icon emoji for the metric
 * @param current - Current value for today
 * @param goal - Daily goal value
 * @param unit - Optional unit string
 * @returns Formatted string
 */
export function formatProgressNotification(
  icon: string,
  current: number,
  goal: number,
  unit: string = ''
): string {
  // Format numbers with commas for thousands
  const formattedCurrent = current.toLocaleString();
  const formattedGoal = goal.toLocaleString();

  const unitText = unit ? ` ${unit}` : '';

  // Simple format: icon + current / goal
  // Example: "🚶 0 / 100" or "💧 1,000 / 2,000 ml"
  return `${icon} ${formattedCurrent} / ${formattedGoal}${unitText}`;
}

/**
 * Generates a complete progress notification body - compact format to fit both on screen
 * @param stepsCurrent - Current step count
 * @param stepsGoal - Daily step goal
 * @param waterCurrent - Current water intake (in ml or cups)
 * @param waterGoal - Daily water goal (in ml or cups)
 * @param waterUnit - Unit for water display (e.g., "ml", "cups", "oz")
 * @returns Complete notification body string
 */
export function generateNotificationBody(
  stepsCurrent: number,
  stepsGoal: number,
  waterCurrent: number,
  waterGoal: number,
  waterUnit: string = 'ml'
): string {
  // Format numbers with commas for thousands
  const formattedStepsCurrent = stepsCurrent.toLocaleString();
  const formattedStepsGoal = stepsGoal.toLocaleString();
  const formattedWaterCurrent = waterCurrent.toLocaleString();
  const formattedWaterGoal = waterGoal.toLocaleString();
  
  const unitText = waterUnit ? ` ${waterUnit}` : '';
  
  // Compact format: both on same line separated by a divider
  // This ensures both are visible even when notification is collapsed
  // Format: "🚶 595 / 10,000  |  💧 500 / 2,000 ml"
  return `${STEP_ICON} ${formattedStepsCurrent} / ${formattedStepsGoal}  |  ${WATER_ICON} ${formattedWaterCurrent} / ${formattedWaterGoal}${unitText}`;
}

