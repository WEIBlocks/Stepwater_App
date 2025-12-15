/**
 * Progress Bar Utility Functions
 * Generates modern styled progress bars for notifications matching the design inspiration
 */

// Progress bar characters - using textured blocks for a modern look
const PROGRESS_FILLED = '▰'; // Filled block (darker, textured)
const PROGRESS_EMPTY = '▱'; // Empty block (lighter)

// Modern icons for steps and water
const STEP_ICON = '🚶'; // Walking person icon for steps
const WATER_ICON = '💧'; // Water droplet icon

/**
 * Generates a progress bar matching the design style
 * @param percentage - Progress percentage (0-100)
 * @param length - Total length of the progress bar (default: 12)
 * @returns Progress bar string
 */
export function generateProgressBar(
  percentage: number,
  length: number = 12
): string {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Calculate number of filled blocks
  const filledBlocks = Math.round((clampedPercentage / 100) * length);
  const emptyBlocks = length - filledBlocks;
  
  // Build the progress bar
  const filled = PROGRESS_FILLED.repeat(filledBlocks);
  const empty = PROGRESS_EMPTY.repeat(emptyBlocks);
  
  return `${filled}${empty}`;
}

/**
 * Formats a progress notification line matching the design with icons
 * @param icon - Icon emoji for the metric
 * @param current - Current value
 * @param goal - Goal value
 * @param progressBar - Progress bar string
 * @param percentage - Progress percentage
 * @param unit - Optional unit string
 * @returns Formatted string
 */
export function formatProgressNotification(
  icon: string,
  current: number,
  goal: number,
  progressBar: string,
  percentage: number,
  unit: string = ''
): string {
  // Format numbers with commas for thousands
  const formattedCurrent = current.toLocaleString();
  const formattedGoal = goal.toLocaleString();
  
  // Format percentage (rounded, no decimals)
  const percentageText = `${Math.round(percentage)}%`;
  
  // Build the formatted string matching the design with icons:
  // "👣 5,234 / 10,000"
  // "[progress bar] 52%"
  const unitText = unit ? ` ${unit}` : '';
  const valueLine = `${icon} ${formattedCurrent}${unitText} / ${formattedGoal}${unitText}`;
  const progressLine = `${progressBar} ${percentageText}`;
  
  return `${valueLine}\n${progressLine}`;
}

/**
 * Generates a complete progress notification body matching the design inspiration
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
  // Calculate percentages
  const stepsPercentage = stepsGoal > 0 ? (stepsCurrent / stepsGoal) * 100 : 0;
  const waterPercentage = waterGoal > 0 ? (waterCurrent / waterGoal) * 100 : 0;
  
  // Generate progress bars
  const stepsBar = generateProgressBar(stepsPercentage, 12);
  const waterBar = generateProgressBar(waterPercentage, 12);
  
  // Format matching the design with icons
  const stepsText = formatProgressNotification(
    STEP_ICON,
    stepsCurrent,
    stepsGoal,
    stepsBar,
    stepsPercentage
  );
  
  const waterText = formatProgressNotification(
    WATER_ICON,
    waterCurrent,
    waterGoal,
    waterBar,
    waterPercentage,
    waterUnit
  );
  
  // Combine with blank line separator
  return `${stepsText}\n\n${waterText}`;
}

