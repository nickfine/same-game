// Game Constants
export const STARTING_SCORE = 3;
export const QUESTION_CREATION_COST = 3;
export const DAILY_QUESTION_LIMIT = 5;
export const QUESTIONS_PAGE_SIZE = 20;
export const HISTORY_PAGE_SIZE = 50;

// Power-Up Costs (points required to use)
export const POWER_UP_COSTS = {
  PEEK: 4,        // See majority before voting
  SKIP: 1,        // Skip question without streak penalty
  DOUBLE_DOWN: 3, // Double points on next vote (win or lose)
} as const;

// Compliance Constants
export const COMPLIANCE = {
  // Age restrictions
  MIN_AGE: 13, // Minimum age to use the app
  ADULT_AGE: 18, // Age threshold for full access
  
  // Playtime limits (in minutes)
  WEEKLY_PLAYTIME_CAP_MINOR: 180, // 3 hours per week for under-18
  BREAK_REMINDER_INTERVAL: 45, // Suggest break every 45 minutes
  BREAK_REMINDER_COOLDOWN: 5, // Don't show another reminder for 5 min after dismissal
  
  // Vote limits
  DAILY_VOTE_CAP_MINOR: 50, // Max votes per day for under-18
  DAILY_VOTE_CAP_ADULT: 999999, // Effectively unlimited for adults
  
  // Warning thresholds
  PLAYTIME_WARNING_THRESHOLD: 0.9, // Show warning at 90% of cap
} as const;

// Colors (matching tailwind.config.js)
export const COLORS = {
  background: '#f4f4f5',
  text: '#18181b',
  success: '#00E054',
  fail: '#FF0055',
  optionA: '#6366F1', // Indigo
  optionB: '#F59E0B', // Amber
  muted: '#71717a',
  mutedLight: '#a1a1aa',
  border: '#e4e4e7',
  white: '#ffffff',
  warning: '#F59E0B', // Amber for warnings
  danger: '#DC2626', // Red for limit reached
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  fast: 100,
  normal: 200,
  slow: 300,
  resultDisplay: 1500, // How long to show vote result
} as const;

