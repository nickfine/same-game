// Reward System for Dopamine Mechanics
// Mystery Chests, Daily Spin, Combo Multipliers

export type RewardType = 
  | 'points'      // Direct point rewards
  | 'multiplier'  // Temporary score multiplier
  | 'streak_freeze' // Protect streak from loss
  | 'peek'        // Preview majority before voting
  | 'skip'        // Skip a question without penalty
  | 'double_down' // Double points on next vote
  | 'nothing';    // Empty (for tension)

export interface Reward {
  type: RewardType;
  value: number;
  displayName: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color: string;
}

// All possible rewards
export const REWARDS: Record<RewardType, Omit<Reward, 'value'>> = {
  points: {
    type: 'points',
    displayName: 'Bonus Points',
    description: 'Free points added to your score!',
    icon: '⭐',
    rarity: 'common',
    color: '#F59E0B', // Amber
  },
  multiplier: {
    type: 'multiplier',
    displayName: 'Score Multiplier',
    description: 'Multiply your next wins!',
    icon: '🚀',
    rarity: 'rare',
    color: '#8B5CF6', // Purple
  },
  streak_freeze: {
    type: 'streak_freeze',
    displayName: 'Streak Freeze',
    description: 'Protect your streak from one loss',
    icon: '🧊',
    rarity: 'epic',
    color: '#06B6D4', // Cyan
  },
  peek: {
    type: 'peek',
    displayName: 'Peek Power',
    description: 'See the majority before voting',
    icon: '👁️',
    rarity: 'uncommon',
    color: '#10B981', // Emerald
  },
  skip: {
    type: 'skip',
    displayName: 'Skip Token',
    description: 'Skip any question for free',
    icon: '⏭️',
    rarity: 'common',
    color: '#6366F1', // Indigo
  },
  double_down: {
    type: 'double_down',
    displayName: 'Double Down',
    description: 'Double your next win (or loss!)',
    icon: '🎲',
    rarity: 'rare',
    color: '#EC4899', // Pink
  },
  nothing: {
    type: 'nothing',
    displayName: 'Empty',
    description: 'Better luck next time!',
    icon: '💨',
    rarity: 'common',
    color: '#9CA3AF', // Gray
  },
};

// Mystery Chest reward probabilities
export const CHEST_PROBABILITIES: { type: RewardType; weight: number; minValue: number; maxValue: number }[] = [
  { type: 'points', weight: 35, minValue: 1, maxValue: 3 },
  { type: 'skip', weight: 20, minValue: 1, maxValue: 1 },
  { type: 'peek', weight: 15, minValue: 1, maxValue: 1 },
  { type: 'nothing', weight: 10, minValue: 0, maxValue: 0 },
  { type: 'double_down', weight: 10, minValue: 1, maxValue: 1 },
  { type: 'multiplier', weight: 7, minValue: 2, maxValue: 3 },
  { type: 'streak_freeze', weight: 3, minValue: 1, maxValue: 1 },
];

// Daily Spin wheel segments
export const SPIN_SEGMENTS: { type: RewardType; value: number; angle: number }[] = [
  { type: 'points', value: 1, angle: 0 },
  { type: 'skip', value: 1, angle: 45 },
  { type: 'points', value: 2, angle: 90 },
  { type: 'peek', value: 1, angle: 135 },
  { type: 'points', value: 5, angle: 180 },     // "Big win" segment
  { type: 'nothing', value: 0, angle: 225 },
  { type: 'double_down', value: 1, angle: 270 },
  { type: 'multiplier', value: 2, angle: 315 }, // Rare segment
];

// Generate a random reward from chest
export function generateChestReward(): Reward {
  const totalWeight = CHEST_PROBABILITIES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const prob of CHEST_PROBABILITIES) {
    random -= prob.weight;
    if (random <= 0) {
      const value = Math.floor(
        Math.random() * (prob.maxValue - prob.minValue + 1) + prob.minValue
      );
      return {
        ...REWARDS[prob.type],
        value,
      };
    }
  }
  
  // Fallback
  return { ...REWARDS.points, value: 1 };
}

// Calculate spin wheel result with near-miss psychology
// The wheel will often land JUST before or after the big prize
export function calculateSpinResult(): { 
  segmentIndex: number; 
  extraRotation: number;
  isNearMiss: boolean;
  reward: Reward;
} {
  // 15% chance of "near miss" - landing just before the big prize (5 points at index 4)
  const nearMissChance = 0.15;
  const isNearMiss = Math.random() < nearMissChance;
  
  let segmentIndex: number;
  let extraRotation: number;
  
  if (isNearMiss) {
    // Land on segment 3 (peek) or 5 (nothing), just missing the big prize at 4
    segmentIndex = Math.random() < 0.5 ? 3 : 5;
    // Position near the edge, almost hitting segment 4
    extraRotation = segmentIndex === 3 ? 40 : 5; // degrees within the segment
  } else {
    // Normal random selection
    segmentIndex = Math.floor(Math.random() * SPIN_SEGMENTS.length);
    extraRotation = Math.random() * 45; // Random position within segment
  }
  
  const segment = SPIN_SEGMENTS[segmentIndex];
  const reward: Reward = {
    ...REWARDS[segment.type],
    value: segment.value,
  };
  
  return {
    segmentIndex,
    extraRotation,
    isNearMiss,
    reward,
  };
}

// Combo multiplier thresholds
export const COMBO_THRESHOLDS = [
  { streak: 3, multiplier: 1.5, name: 'Hot!', color: '#F59E0B' },
  { streak: 5, multiplier: 2.0, name: 'On Fire!', color: '#EF4444' },
  { streak: 7, multiplier: 2.5, name: 'Blazing!', color: '#DC2626' },
  { streak: 10, multiplier: 3.0, name: 'UNSTOPPABLE!', color: '#B91C1C' },
];

// Get current combo info based on streak
export function getComboInfo(streak: number): {
  multiplier: number;
  name: string | null;
  color: string | null;
  progress: number; // 0-1 progress to next threshold
  nextThreshold: number | null;
} {
  let currentThreshold = null;
  let nextThreshold = COMBO_THRESHOLDS[0];
  
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streak >= COMBO_THRESHOLDS[i].streak) {
      currentThreshold = COMBO_THRESHOLDS[i];
      nextThreshold = COMBO_THRESHOLDS[i + 1] || null;
      break;
    }
  }
  
  if (!currentThreshold) {
    // Below first threshold
    return {
      multiplier: 1,
      name: null,
      color: null,
      progress: streak / COMBO_THRESHOLDS[0].streak,
      nextThreshold: COMBO_THRESHOLDS[0].streak,
    };
  }
  
  const progress = nextThreshold 
    ? (streak - currentThreshold.streak) / (nextThreshold.streak - currentThreshold.streak)
    : 1;
  
  return {
    multiplier: currentThreshold.multiplier,
    name: currentThreshold.name,
    color: currentThreshold.color,
    progress,
    nextThreshold: nextThreshold?.streak || null,
  };
}

// Timing constants for animations (psychological optimization)
export const ANIMATION_TIMING = {
  // Mystery chest: 1.8s is optimal for anticipation without frustration
  CHEST_REVEAL_DELAY: 1800,
  CHEST_SHAKE_DURATION: 400,
  CHEST_GLOW_PULSE: 200,
  
  // Spin wheel: Slower deceleration creates more suspense
  SPIN_DURATION: 4000,
  SPIN_INITIAL_SPEED: 720, // degrees per second
  
  // Combo: Drain bar timing
  COMBO_DRAIN_DURATION: 8000, // 8 seconds to maintain combo
  COMBO_FILL_ANIMATION: 300,
};

