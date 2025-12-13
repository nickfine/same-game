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

// ═══════════════════════════════════════════════════════════════
// BRAND COLORS - Dark Mode Palette
// ═══════════════════════════════════════════════════════════════
export const COLORS = {
  // Primary brand colors
  primary: '#6E0CFF',           // Electric violet
  primaryForeground: '#FFFFFF',
  secondary: '#FF3B6E',         // Hot coral
  accent: '#00FFBD',            // Emerald (correct answer)
  destructive: '#FF3B6E',
  
  // Backgrounds
  background: '#0F0F1A',        // Deep space
  surface: '#1A0F33',           // Surface violet
  muted: '#2A1A4D',
  
  // Text
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textDim: 'rgba(255, 255, 255, 0.4)',
  
  // UI Elements
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackground: 'rgba(26, 15, 51, 0.8)',
  cardBackground: '#FFFFFF',
  
  // Gradient endpoints (for LinearGradient arrays)
  gradientPurpleStart: '#8B5CF6',
  gradientPurpleEnd: '#D946EF',
  gradientCoralStart: '#FF6B6B',
  gradientCoralEnd: '#FF8E53',
  
  // Legacy aliases (for compatibility)
  success: '#00FFBD',
  fail: '#FF3B6E',
  optionA: '#8B5CF6',           // Purple gradient start
  optionB: '#FF6B6B',           // Coral gradient start
  border: 'rgba(255, 255, 255, 0.1)',
  white: '#FFFFFF',
  warning: '#F59E0B',
  danger: '#DC2626',
  mutedLight: 'rgba(255, 255, 255, 0.4)',
} as const;

// ═══════════════════════════════════════════════════════════════
// GRADIENTS - For LinearGradient components
// ═══════════════════════════════════════════════════════════════
export const GRADIENTS = {
  purple: ['#8B5CF6', '#D946EF'] as const,    // Top button
  coral: ['#FF6B6B', '#FF8E53'] as const,     // Bottom button
  violet: ['#6E0CFF', '#8B5CF6'] as const,    // Primary violet
  background: ['#0F0F1A', '#1A0F33'] as const, // Radial background
  gold: ['#FFD700', '#FFA500'] as const,      // Celebration
  success: ['#00FFBD', '#10B981'] as const,   // Correct answer
} as const;

// ═══════════════════════════════════════════════════════════════
// STREAK MILESTONES - Celebration data
// ═══════════════════════════════════════════════════════════════
export const STREAK_MILESTONES: Record<number, {
  title: string;
  emoji: string;
  color: string;
  description: string;
}> = {
  3: {
    title: 'TRIFECTA BABY',
    emoji: '🔥',
    color: '#FF6B6B',
    description: '3 days of fire predictions!',
  },
  7: {
    title: 'WEEK GOD',
    emoji: '⚡',
    color: '#8B5CF6',
    description: 'A whole week of dominance!',
  },
  14: {
    title: 'TWO WEEK TYRANT',
    emoji: '👑',
    color: '#FFD700',
    description: 'Unstoppable for 14 days!',
  },
  30: {
    title: 'LITERALLY PSYCHIC',
    emoji: '🔮',
    color: '#D946EF',
    description: 'You can see the future!',
  },
};

// Animation Durations (ms)
export const ANIMATION = {
  fast: 100,
  normal: 200,
  slow: 300,
  resultDisplay: 1500, // How long to show vote result
  easeOutExpo: 600,    // For flash animations
} as const;

// Level System Constants
export const LEVELS = {
  XP_PER_WIN: 10,           // Base XP for winning a vote
  XP_PER_LOSS: 3,           // Consolation XP for participating
  XP_PER_QUESTION: 25,      // XP for creating a question
  XP_STREAK_BONUS: 5,       // Additional XP per streak level when winning
  MILESTONE_INTERVAL: 5,    // Power-up reward every 5 levels
  POINTS_PER_LEVEL_UP: 2,   // Level × this = bonus points on level up
} as const;

// XP thresholds for each level (index = level - 1, value = XP required)
export const LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1: 0 XP
  50,     // Level 2: 50 XP
  125,    // Level 3: 125 XP
  225,    // Level 4: 225 XP
  400,    // Level 5: 400 XP (milestone)
  600,    // Level 6: 600 XP
  900,    // Level 7: 900 XP
  1300,   // Level 8: 1,300 XP
  1800,   // Level 9: 1,800 XP
  2500,   // Level 10: 2,500 XP (milestone)
  3400,   // Level 11
  4500,   // Level 12
  5800,   // Level 13
  7300,   // Level 14
  9000,   // Level 15 (milestone)
  11000,  // Level 16
  13500,  // Level 17
  16500,  // Level 18
  20000,  // Level 19
  24000,  // Level 20 (milestone)
  29000,  // Level 21
  35000,  // Level 22
  42000,  // Level 23
  50000,  // Level 24
  60000,  // Level 25 (milestone)
  72000,  // Level 26
  86000,  // Level 27
  102000, // Level 28
  120000, // Level 29
  140000, // Level 30 (milestone)
  165000, // Level 31
  195000, // Level 32
  230000, // Level 33
  270000, // Level 34
  315000, // Level 35 (milestone)
  365000, // Level 36
  420000, // Level 37
  480000, // Level 38
  550000, // Level 39
  630000, // Level 40 (milestone)
  720000, // Level 41
  820000, // Level 42
  930000, // Level 43
  1050000, // Level 44
  1200000, // Level 45 (milestone)
  1370000, // Level 46
  1560000, // Level 47
  1780000, // Level 48
  2030000, // Level 49
  2310000, // Level 50 (milestone)
];

// Power-up rewards at milestone levels
export const MILESTONE_REWARDS: Record<number, 'streak_freeze' | 'peek' | 'double_down' | 'skip'> = {
  5: 'streak_freeze',
  10: 'peek',
  15: 'double_down',
  20: 'streak_freeze',
  25: 'peek',
  30: 'double_down',
  35: 'streak_freeze',
  40: 'peek',
  45: 'double_down',
  50: 'streak_freeze',
};

// Level tier colors and names
export const LEVEL_TIERS = {
  BRONZE: { min: 1, max: 9, name: 'Bronze', emoji: '🥉', color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.12)', glowColor: 'rgba(249, 115, 22, 0.4)' },
  SILVER: { min: 10, max: 19, name: 'Silver', emoji: '🥈', color: '#94A3B8', bgColor: 'rgba(148, 163, 184, 0.15)', glowColor: 'rgba(148, 163, 184, 0.4)' },
  GOLD: { min: 20, max: 29, name: 'Gold', emoji: '🥇', color: '#FFB800', bgColor: 'rgba(255, 184, 0, 0.15)', glowColor: 'rgba(255, 184, 0, 0.4)' },
  PLATINUM: { min: 30, max: 39, name: 'Platinum', emoji: '💎', color: '#E0E7FF', bgColor: 'rgba(224, 231, 255, 0.15)', glowColor: 'rgba(224, 231, 255, 0.4)' },
  DIAMOND: { min: 40, max: 49, name: 'Diamond', emoji: '💠', color: '#00E5FF', bgColor: 'rgba(0, 229, 255, 0.12)', glowColor: 'rgba(0, 229, 255, 0.4)' },
  LEGEND: { min: 50, max: 999, name: 'Legend', emoji: '🔥', color: '#FF3D00', bgColor: 'rgba(255, 61, 0, 0.15)', glowColor: 'rgba(255, 61, 0, 0.4)' },
} as const;

// ═══════════════════════════════════════════════════════════════
// TEXT GLOW - Premium Multi-Layer Shadow Stack
// ═══════════════════════════════════════════════════════════════
export const TEXT_GLOW = {
  // Base white glow + black depth (shared by both buttons)
  BASE_SHADOW: '0px 0px 8px rgba(255,255,255,0.8), 0px 0px 16px rgba(255,255,255,0.6), 0px 4px 12px rgba(0,0,0,0.4)',
  
  // Button-specific colored outer glow
  PURPLE_GLOW: '0px 0px 24px rgba(110,12,255,0.4)',   // Top button violet #6E0CFF
  CORAL_GLOW: '0px 0px 24px rgba(255,59,110,0.4)',    // Bottom button coral #FF3B6E
  HYPER_GLOW: '0px 0px 32px rgba(0,255,189,0.6)',     // Hyperstreak emerald #00FFBD
  
  // Combined shadow stacks for each button variant
  get TOP_BUTTON() {
    return `${this.BASE_SHADOW}, ${this.PURPLE_GLOW}`;
  },
  get BOTTOM_BUTTON() {
    return `${this.BASE_SHADOW}, ${this.CORAL_GLOW}`;
  },
  get TOP_BUTTON_HYPER() {
    return `${this.BASE_SHADOW}, ${this.PURPLE_GLOW}, ${this.HYPER_GLOW}`;
  },
  get BOTTOM_BUTTON_HYPER() {
    return `${this.BASE_SHADOW}, ${this.CORAL_GLOW}, ${this.HYPER_GLOW}`;
  },
} as const;

// Orb/Emoji Animation Constants
export const ORB_ANIMATION = {
  // Entrance animation
  ENTRANCE_DURATION: 600,
  ENTRANCE_STAGGER: 100,
  ENTRANCE_OVERSHOOT: 1.3,
  
  // Idle breathe pulse
  BREATHE_DURATION: 3000,
  BREATHE_SCALE: 1.05,
  
  // Press interaction
  PRESS_SCALE: 1.2,
  SQUASH_SCALE_X: 1.15,
  STRETCH_SCALE_X: 0.95,
  SQUASH_DURATION: 200,
  
  // Hyperstreak orbit
  ORBIT_DURATION: 8000,
  ORBIT_RADIUS: 4,
  
  // Sizing
  SIZE_LARGE: 80,   // >375px screens
  SIZE_SMALL: 72,   // <=375px screens
  LEFT_OFFSET: 40,  // px from left edge
} as const;
