/**
 * Cloud Functions API Client
 * 
 * All economy operations go through these functions for anti-cheat protection.
 * These call Firebase Cloud Functions instead of writing directly to Firestore.
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { app } from './firebase';
import type { VoteChoice } from '../types';
import type { Reward } from './rewards';

// Initialize Cloud Functions
const functions = getFunctions(app);

// ============================================================================
// TYPES
// ============================================================================

interface DopamineState {
  powerUps: {
    streak_freeze: number;
    peek: number;
    skip: number;
    double_down: number;
  };
  activeMultiplier: number;
  multiplierVotesRemaining: number;
  doubleDownActive: boolean;
}

// Vote
interface CastVoteRequest {
  questionId: string;
  choice: VoteChoice;
  doubleDownActive?: boolean;
  activeMultiplier?: number;
}

interface CastVoteResponse {
  success: boolean;
  won: boolean;
  votes_a: number;
  votes_b: number;
  percentage_a: number;
  percentage_b: number;
  previousStreak: number;
  newStreak: number;
  pointsEarned: number;
  error?: string;
}

// Power-up
interface UsePowerUpRequest {
  powerUpType: 'peek' | 'skip' | 'double_down' | 'streak_freeze';
  dopamineState: DopamineState;
}

interface UsePowerUpResponse {
  success: boolean;
  cost: number;
  newScore?: number;
  newDopamineState: DopamineState;
  error?: string;
}

// Reward
interface ClaimRewardRequest {
  reward: Reward;
  source: 'chest' | 'spin';
  dopamineState: DopamineState;
  currentVoteCount?: number;
}

interface ClaimRewardResponse {
  success: boolean;
  newScore?: number;
  newDopamineState: DopamineState;
}

// Streak Freeze
interface UseStreakFreezeRequest {
  deadStreak: number;
  dopamineState: DopamineState;
}

interface UseStreakFreezeResponse {
  success: boolean;
  restoredStreak: number;
  newDopamineState: DopamineState;
}

// Skip
interface SkipQuestionRequest {
  questionId: string;
  dopamineState: DopamineState;
}

interface SkipQuestionResponse {
  success: boolean;
  cost: number;
  newDopamineState: DopamineState;
}

// Daily Spin
interface ValidateSpinResponse {
  canSpin: boolean;
  today: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Cast a vote on a question (server-validated)
 */
export async function castVoteSecure(
  questionId: string,
  choice: VoteChoice,
  options?: {
    doubleDownActive?: boolean;
    activeMultiplier?: number;
  }
): Promise<CastVoteResponse> {
  const castVoteFn = httpsCallable<CastVoteRequest, CastVoteResponse>(
    functions, 
    'castVote'
  );
  
  const result = await castVoteFn({
    questionId,
    choice,
    doubleDownActive: options?.doubleDownActive,
    activeMultiplier: options?.activeMultiplier,
  });
  
  return result.data;
}

/**
 * Use a power-up (server-validated)
 */
export async function usePowerUpSecure(
  powerUpType: UsePowerUpRequest['powerUpType'],
  dopamineState: DopamineState
): Promise<UsePowerUpResponse> {
  const usePowerUpFn = httpsCallable<UsePowerUpRequest, UsePowerUpResponse>(
    functions,
    'usePowerUp'
  );
  
  const result = await usePowerUpFn({
    powerUpType,
    dopamineState,
  });
  
  return result.data;
}

/**
 * Claim a reward from chest or spin (server-validated)
 */
export async function claimRewardSecure(
  reward: Reward,
  source: 'chest' | 'spin',
  dopamineState: DopamineState,
  currentVoteCount?: number
): Promise<ClaimRewardResponse> {
  const claimRewardFn = httpsCallable<ClaimRewardRequest, ClaimRewardResponse>(
    functions,
    'claimReward'
  );
  
  const result = await claimRewardFn({
    reward,
    source,
    dopamineState,
    currentVoteCount,
  });
  
  return result.data;
}

/**
 * Use a streak freeze (server-validated)
 */
export async function useStreakFreezeSecure(
  deadStreak: number,
  dopamineState: DopamineState
): Promise<UseStreakFreezeResponse> {
  const useStreakFreezeFn = httpsCallable<UseStreakFreezeRequest, UseStreakFreezeResponse>(
    functions,
    'useStreakFreeze'
  );
  
  const result = await useStreakFreezeFn({
    deadStreak,
    dopamineState,
  });
  
  return result.data;
}

/**
 * Skip a question (server-validated)
 */
export async function skipQuestionSecure(
  questionId: string,
  dopamineState: DopamineState
): Promise<SkipQuestionResponse> {
  const skipQuestionFn = httpsCallable<SkipQuestionRequest, SkipQuestionResponse>(
    functions,
    'skipQuestion'
  );
  
  const result = await skipQuestionFn({
    questionId,
    dopamineState,
  });
  
  return result.data;
}

/**
 * Validate if user can do daily spin (server-validated)
 */
export async function validateDailySpinSecure(
  lastSpinDate: string | null
): Promise<ValidateSpinResponse> {
  const validateSpinFn = httpsCallable<{ lastSpinDate: string | null }, ValidateSpinResponse>(
    functions,
    'validateDailySpin'
  );
  
  const result = await validateSpinFn({ lastSpinDate });
  
  return result.data;
}

// ============================================================================
// HELPER: Convert client state to API format
// ============================================================================

export function clientToApiDopamineState(clientState: {
  powerUps: {
    streakFreeze: number;
    peek: number;
    skip: number;
    doubleDown: number;
  };
  activeMultiplier: number;
  multiplierVotesRemaining: number;
  doubleDownActive: boolean;
}): DopamineState {
  return {
    powerUps: {
      streak_freeze: clientState.powerUps.streakFreeze,
      peek: clientState.powerUps.peek,
      skip: clientState.powerUps.skip,
      double_down: clientState.powerUps.doubleDown,
    },
    activeMultiplier: clientState.activeMultiplier,
    multiplierVotesRemaining: clientState.multiplierVotesRemaining,
    doubleDownActive: clientState.doubleDownActive,
  };
}

export function apiToClientDopamineState(apiState: DopamineState): {
  powerUps: {
    streakFreeze: number;
    peek: number;
    skip: number;
    doubleDown: number;
  };
  activeMultiplier: number;
  multiplierVotesRemaining: number;
  doubleDownActive: boolean;
} {
  return {
    powerUps: {
      streakFreeze: apiState.powerUps.streak_freeze,
      peek: apiState.powerUps.peek,
      skip: apiState.powerUps.skip,
      doubleDown: apiState.powerUps.double_down,
    },
    activeMultiplier: apiState.activeMultiplier,
    multiplierVotesRemaining: apiState.multiplierVotesRemaining,
    doubleDownActive: apiState.doubleDownActive,
  };
}




