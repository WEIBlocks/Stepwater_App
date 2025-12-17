/**
 * Progress Bar Utility Functions
 * Generates modern styled progress bars for notifications matching the design inspiration
 * with goal-based states (normal vs. goal achieved)
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
  // Clamp percentage between 0 and 100 (never render > 100%)
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
 * @param label - Human-friendly label ("Steps" | "Water")
 * @param current - Current value for today
 * @param goal - Daily goal value
 * @param progressBar - Progress bar string
 * @param percentageRaw - Raw progress percentage (can be > 100, will be clamped)
 * @param unit - Optional unit string
 * @returns Formatted string
 */
export function formatProgressNotification(
  icon: string,
  label: 'Steps' | 'Water',
  current: number,
  goal: number,
  progressBar: string,
  percentageRaw: number,
  unit: string = ''
): string {
  // Format numbers with commas for thousands
  const formattedCurrent = current.toLocaleString();
  const formattedGoal = goal.toLocaleString();

  // Determine if goal is achieved (current >= goal and goal > 0)
  const goalAchieved = goal > 0 && current >= goal;

  // Clamp percentage between 0 and 100 and round (never show > 100)
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentageRaw)));
  const percentageToDisplay = goalAchieved ? 100 : clampedPercentage;
  const percentageText = `${percentageToDisplay}%`;

  const unitText = unit ? ` ${unit}` : '';

  // Extra amount beyond goal (only meaningful when goal is achieved)
  const extra = Math.max(0, current - goal);
  const formattedExtra = extra.toLocaleString();

  if (goalAchieved) {
    // Goal Achieved State (inspired by provided design)
    // Example:
    // "🚶 Steps Goal Achieved 🎉"
    // "6,200 steps today   (+1,200)"
    // "████████████ 100%"

    const goalLabel =
      label === 'Steps' ? 'Steps Goal Achieved 🎉' : 'Water Goal Achieved 🎉';

    const amountLabel =
      label === 'Steps'
        ? `${formattedCurrent} steps today`
        : `${formattedCurrent}${unitText} today`;

    const extraLabel =
      label === 'Steps'
        ? `(+${formattedExtra} steps)`
        : `(+${formattedExtra}${unitText})`;

    const headerLine = `${icon} ${goalLabel}`;
    // Small spacing between today and the extra amount to mimic the design
    const amountLine = `${amountLabel}   ${extraLabel}`;
    const progressLine = `${progressBar} ${percentageText}`;

    return `${headerLine}\n${amountLine}\n${progressLine}`;
  }
  
  // Normal (pre-goal) state
  // Example:
  // "🚶 5,234 / 10,000"
  // "██████▱▱▱▱ 52%"

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
  // Calculate raw percentages (may be > 100, will be clamped later)
  const stepsPercentage = stepsGoal > 0 ? (stepsCurrent / stepsGoal) * 100 : 0;
  const waterPercentage = waterGoal > 0 ? (waterCurrent / waterGoal) * 100 : 0;
  
  // Generate progress bars
  // If goal is achieved, force the bar to be full (100%)
  const stepsBar = generateProgressBar(
    stepsGoal > 0 && stepsCurrent >= stepsGoal ? 100 : stepsPercentage,
    12
  );
  const waterBar = generateProgressBar(
    waterGoal > 0 && waterCurrent >= waterGoal ? 100 : waterPercentage,
    12
  );
  
  // Format matching the design with icons and goal-aware states
  const stepsText = formatProgressNotification(
    STEP_ICON,
    'Steps',
    stepsCurrent,
    stepsGoal,
    stepsBar,
    stepsPercentage
  );
  
  const waterText = formatProgressNotification(
    WATER_ICON,
    'Water',
    waterCurrent,
    waterGoal,
    waterBar,
    waterPercentage,
    waterUnit
  );
  
  // Combine with blank line separator
  return `${stepsText}\n\n${waterText}`;
}

