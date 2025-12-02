// Game Constants
export const STARTING_SCORE = 3;
export const QUESTION_CREATION_COST = 3;
export const DAILY_QUESTION_LIMIT = 5;
export const QUESTIONS_PAGE_SIZE = 20;
export const HISTORY_PAGE_SIZE = 50;

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
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  fast: 100,
  normal: 200,
  slow: 300,
  resultDisplay: 1500, // How long to show vote result
} as const;

