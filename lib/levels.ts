// Level System Utilities
// XP calculation, level progression, and milestone rewards

import { LEVEL_THRESHOLDS, LEVEL_TIERS, MILESTONE_REWARDS, LEVELS } from './constants';
import type { RewardType } from './rewards';

export interface LevelProgress {
  level: number;
  currentXP: number;
  levelStartXP: number;
  nextLevelXP: number;
  progress: number; // 0-1 progress to next level
  xpToNextLevel: number;
  isMaxLevel: boolean;
}

export interface LevelTier {
  name: string;
  color: string;
  bgColor: string;
  glowColor: string;
  emoji: string;
}

export interface XPGain {
  baseXP: number;
  streakBonus: number;
  totalXP: number;
}

/**
 * Calculate the level from total XP
 * Uses binary search for efficiency with large threshold arrays
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  
  // Binary search through thresholds
  let left = 0;
  let right = LEVEL_THRESHOLDS.length - 1;
  
  while (left < right) {
    const mid = Math.ceil((left + right + 1) / 2);
    if (LEVEL_THRESHOLDS[mid] <= xp) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }
  
  // Level is index + 1 (thresholds are 0-indexed, levels are 1-indexed)
  return left + 1;
}

/**
 * Get the XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  if (level < 1) return 0;
  if (level > LEVEL_THRESHOLDS.length) {
    // Beyond defined thresholds, extrapolate
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const growthRate = 1.15; // 15% increase per level
    const extraLevels = level - LEVEL_THRESHOLDS.length;
    return Math.floor(lastThreshold * Math.pow(growthRate, extraLevels));
  }
  return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Get detailed level progress information for UI
 */
export function getLevelProgress(xp: number): LevelProgress {
  const level = calculateLevel(xp);
  const levelStartXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;
  
  const xpInLevel = xp - levelStartXP;
  const xpNeededForLevel = nextLevelXP - levelStartXP;
  const progress = isMaxLevel ? 1 : Math.min(1, xpInLevel / xpNeededForLevel);
  const xpToNextLevel = isMaxLevel ? 0 : nextLevelXP - xp;
  
  return {
    level,
    currentXP: xp,
    levelStartXP,
    nextLevelXP,
    progress,
    xpToNextLevel,
    isMaxLevel,
  };
}

/**
 * Get the tier information for a level with premium visual properties
 */
export function getLevelTier(level: number): LevelTier {
  if (level >= LEVEL_TIERS.LEGEND.min) {
    return { 
      name: LEVEL_TIERS.LEGEND.name, 
      color: '#FF3D00', // Vibrant flame orange-red
      bgColor: 'rgba(255, 61, 0, 0.15)',
      glowColor: 'rgba(255, 61, 0, 0.6)',
      emoji: '🔥',
    };
  }
  if (level >= LEVEL_TIERS.DIAMOND.min) {
    return { 
      name: LEVEL_TIERS.DIAMOND.name, 
      color: '#00E5FF', // Electric cyan
      bgColor: 'rgba(0, 229, 255, 0.12)',
      glowColor: 'rgba(0, 229, 255, 0.5)',
      emoji: '💎',
    };
  }
  if (level >= LEVEL_TIERS.PLATINUM.min) {
    return { 
      name: LEVEL_TIERS.PLATINUM.name, 
      color: '#E0E7FF', // Cool platinum
      bgColor: 'rgba(224, 231, 255, 0.15)',
      glowColor: 'rgba(224, 231, 255, 0.4)',
      emoji: '⚡',
    };
  }
  if (level >= LEVEL_TIERS.GOLD.min) {
    return { 
      name: LEVEL_TIERS.GOLD.name, 
      color: '#FFB800', // Rich gold
      bgColor: 'rgba(255, 184, 0, 0.15)',
      glowColor: 'rgba(255, 184, 0, 0.5)',
      emoji: '👑',
    };
  }
  if (level >= LEVEL_TIERS.SILVER.min) {
    return { 
      name: LEVEL_TIERS.SILVER.name, 
      color: '#94A3B8', // Sophisticated silver
      bgColor: 'rgba(148, 163, 184, 0.15)',
      glowColor: 'rgba(148, 163, 184, 0.4)',
      emoji: '✨',
    };
  }
  // Bronze - warm, inviting
  return { 
    name: LEVEL_TIERS.BRONZE.name, 
    color: '#F97316', // Vibrant orange (brand color)
    bgColor: 'rgba(249, 115, 22, 0.12)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    emoji: '🌟',
  };
}

/**
 * Get premium gradient colors for level badge
 */
export function getLevelGradient(level: number): { start: string; middle: string; end: string } {
  const tier = getLevelTier(level);
  
  switch (tier.name) {
    case 'Legend':
      return { start: '#FF3D00', middle: '#FF6D00', end: '#FFAB00' };
    case 'Diamond':
      return { start: '#00E5FF', middle: '#00B8D4', end: '#0097A7' };
    case 'Platinum':
      return { start: '#E0E7FF', middle: '#C7D2FE', end: '#A5B4FC' };
    case 'Gold':
      return { start: '#FFB800', middle: '#FFA000', end: '#FF8F00' };
    case 'Silver':
      return { start: '#94A3B8', middle: '#64748B', end: '#475569' };
    default: // Bronze
      return { start: '#F97316', middle: '#EA580C', end: '#C2410C' };
  }
}

/**
 * Check if a level is a milestone level (gets power-up reward)
 */
export function isMilestoneLevel(level: number): boolean {
  return level % LEVELS.MILESTONE_INTERVAL === 0;
}

/**
 * Get the milestone reward for a level (if any)
 */
export function getMilestoneReward(level: number): RewardType | null {
  if (!isMilestoneLevel(level)) return null;
  return MILESTONE_REWARDS[level] || null;
}

/**
 * Calculate XP gain from a vote
 */
export function calculateXPGain(won: boolean, streak: number): XPGain {
  const baseXP = won ? LEVELS.XP_PER_WIN : LEVELS.XP_PER_LOSS;
  const streakBonus = won ? streak * LEVELS.XP_STREAK_BONUS : 0;
  
  return {
    baseXP,
    streakBonus,
    totalXP: baseXP + streakBonus,
  };
}

/**
 * Calculate XP gain from creating a question
 */
export function calculateQuestionXP(): number {
  return LEVELS.XP_PER_QUESTION;
}

/**
 * Calculate bonus points awarded on level up
 */
export function calculateLevelUpBonus(newLevel: number): number {
  return newLevel * LEVELS.POINTS_PER_LEVEL_UP;
}

/**
 * Check if adding XP would cause a level up
 */
export function checkLevelUp(currentXP: number, xpToAdd: number): {
  willLevelUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
} {
  const oldLevel = calculateLevel(currentXP);
  const newLevel = calculateLevel(currentXP + xpToAdd);
  const levelsGained = newLevel - oldLevel;
  
  return {
    willLevelUp: levelsGained > 0,
    oldLevel,
    newLevel,
    levelsGained,
  };
}

/**
 * Get the next milestone level from current level
 */
export function getNextMilestoneLevel(currentLevel: number): number {
  const nextMilestone = Math.ceil((currentLevel + 1) / LEVELS.MILESTONE_INTERVAL) * LEVELS.MILESTONE_INTERVAL;
  return nextMilestone;
}

/**
 * Format XP for display (e.g., 1500 -> "1.5K")
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}



