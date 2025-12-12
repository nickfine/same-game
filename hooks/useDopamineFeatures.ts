import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { POWER_UP_COSTS } from '../lib/constants';
import { getTodayDate } from '../lib/dateUtils';
import { HYPER, getStreakFreezeCapacity } from '../lib/hyperstreakLogic';
import {
  usePowerUpSecure,
  claimRewardSecure,
  skipQuestionSecure,
  useStreakFreezeSecure,
  clientToApiDopamineState,
  apiToClientDopamineState,
} from '../lib/cloudFunctions';
import type { Reward } from '../lib/rewards';

const STORAGE_KEY = '@same_dopamine';

/**
 * PRODUCTION TOGGLE: Cloud Functions vs Local State
 * 
 * When false (development): All dopamine state is stored locally in AsyncStorage.
 *   - Faster for development/testing
 *   - NOT secure - users can cheat by modifying local storage
 * 
 * When true (production): Economy operations use Cloud Functions for server-side validation.
 *   - Anti-cheat protection
 *   - Requires deploying Cloud Functions first: `cd functions && npm run deploy`
 * 
 * TODO: Set to true before production deployment!
 */
const USE_CLOUD_FUNCTIONS = false;

// Power-up type for type safety
type PowerUpType = 'streak_freeze' | 'peek' | 'skip' | 'double_down';

interface DopamineState {
  // Daily spin
  lastSpinDate: string | null;
  canSpin: boolean;
  
  // Mystery chest
  votesUntilChest: number;
  lastChestVoteCount: number;
  
  // Power-ups inventory
  powerUps: {
    streak_freeze: number;
    peek: number;
    skip: number;
    double_down: number;
  };
  
  // Active effects
  activeMultiplier: number;
  multiplierVotesRemaining: number;
  doubleDownActive: boolean;
}

const DEFAULT_STATE: DopamineState = {
  lastSpinDate: null,
  canSpin: true,
  votesUntilChest: 10, // First chest after 10 votes (matches new 8-15 range)
  lastChestVoteCount: 0,
  powerUps: {
    streak_freeze: 0,
    peek: 0,
    skip: 0,
    double_down: 0,
  },
  activeMultiplier: 1,
  multiplierVotesRemaining: 0,
  doubleDownActive: false,
};

// Chest appears every 8-15 votes (randomized) - less frequent to feel more special
const MIN_VOTES_BETWEEN_CHESTS = 8;
const MAX_VOTES_BETWEEN_CHESTS = 15;

function getRandomChestInterval(): number {
  return Math.floor(
    Math.random() * (MAX_VOTES_BETWEEN_CHESTS - MIN_VOTES_BETWEEN_CHESTS + 1) + MIN_VOTES_BETWEEN_CHESTS
  );
}

export function useDopamineFeatures(inHyperstreak: boolean = false) {
  const [state, setState] = useState<DopamineState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  
  // Modal visibility states
  const [showChest, setShowChest] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  
  // Active power-up states (not persisted - per-session only)
  const [peekActive, setPeekActive] = useState(false);
  
  // Hyperstreak freeze capacity bonus (2x during hyperstreak)
  const streakFreezeCapacity = useMemo(() => 
    getStreakFreezeCapacity(inHyperstreak),
    [inHyperstreak]
  );

  // Load state from storage
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DopamineState;
        
        // Check if daily spin is available
        const today = getTodayDate();
        const canSpin = parsed.lastSpinDate !== today;
        
        setState({
          ...parsed,
          canSpin,
        });
      }
    } catch (error) {
      console.error('Failed to load dopamine state:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newState: DopamineState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save dopamine state:', error);
    }
  };

  // Called after each vote to check if chest should appear
  // Options:
  // - suppressChest: if true, don't show chest even if eligible (e.g., streak death is showing)
  // - won: if user won the vote (chest only appears on wins to not pile on after losses)
  interface VoteCompleteOptions {
    suppressChest?: boolean;
    lostStreak?: boolean;
  }
  
  const onVoteComplete = useCallback((voteCount: number, won: boolean, options?: VoteCompleteOptions): boolean => {
    const { suppressChest = false, lostStreak = false } = options || {};
    
    // Don't show chest if:
    // 1. Another important event is happening (suppressed)
    // 2. User just lost (chest on loss feels bad)
    // 3. User just lost their streak (streak death modal takes priority)
    if (suppressChest || !won || lostStreak) {
      return false;
    }
    
    const votesSinceLastChest = voteCount - state.lastChestVoteCount;
    const shouldShowChest = votesSinceLastChest >= state.votesUntilChest;
    
    if (shouldShowChest) {
      setShowChest(true);
      return true;
    }
    
    return false;
  }, [state.votesUntilChest, state.lastChestVoteCount]);

  // Called when chest is opened and reward claimed
  const onChestClaimed = useCallback(async (reward: Reward, currentVoteCount: number) => {
    const newState = { ...state };
    
    // Update chest timing
    newState.lastChestVoteCount = currentVoteCount;
    newState.votesUntilChest = getRandomChestInterval();
    
    // Apply reward
    switch (reward.type) {
      case 'points':
        // Points are added directly to user score (handled externally)
        break;
      case 'multiplier':
        newState.activeMultiplier = reward.value;
        newState.multiplierVotesRemaining = 3; // Lasts 3 votes
        break;
      case 'streak_freeze':
        newState.powerUps.streak_freeze += reward.value;
        break;
      case 'peek':
        newState.powerUps.peek += reward.value;
        break;
      case 'skip':
        newState.powerUps.skip += reward.value;
        break;
      case 'double_down':
        newState.powerUps.double_down += reward.value;
        break;
    }
    
    await saveState(newState);
    setShowChest(false);
  }, [state]);

  // Open daily spin wheel
  const openDailySpin = useCallback(() => {
    if (state.canSpin) {
      setShowSpin(true);
    }
  }, [state.canSpin]);

  // Called when spin is complete and reward claimed
  const onSpinClaimed = useCallback(async (reward: Reward) => {
    const newState = { ...state };
    
    // Mark spin as used for today
    newState.lastSpinDate = getTodayDate();
    newState.canSpin = false;
    
    // Apply reward (same as chest)
    switch (reward.type) {
      case 'multiplier':
        newState.activeMultiplier = reward.value;
        newState.multiplierVotesRemaining = 3;
        break;
      case 'streak_freeze':
        newState.powerUps.streak_freeze += reward.value;
        break;
      case 'peek':
        newState.powerUps.peek += reward.value;
        break;
      case 'skip':
        newState.powerUps.skip += reward.value;
        break;
      case 'double_down':
        newState.powerUps.double_down += reward.value;
        break;
    }
    
    await saveState(newState);
    setShowSpin(false);
  }, [state]);

  // Use a power-up from inventory
  const usePowerUp = useCallback(async (type: keyof DopamineState['powerUps']): Promise<boolean> => {
    if (state.powerUps[type] <= 0) return false;
    
    const newState = { ...state };
    newState.powerUps[type] -= 1;
    
    if (type === 'double_down') {
      newState.doubleDownActive = true;
    }
    
    await saveState(newState);
    return true;
  }, [state]);

  // Check if user can afford a power-up (has inventory OR enough points)
  const canAffordPowerUp = useCallback((type: PowerUpType, userScore: number): boolean => {
    // If they have one in inventory, they can use it
    if (state.powerUps[type] > 0) return true;
    
    // Otherwise, check if they can afford to buy it
    const cost = type === 'peek' ? POWER_UP_COSTS.PEEK
      : type === 'skip' ? POWER_UP_COSTS.SKIP
      : type === 'double_down' ? POWER_UP_COSTS.DOUBLE_DOWN
      : 0;
    
    return userScore >= cost;
  }, [state.powerUps]);

  // Get the cost of a power-up (0 if user has inventory)
  const getPowerUpCost = useCallback((type: PowerUpType): number => {
    if (state.powerUps[type] > 0) return 0;
    
    switch (type) {
      case 'peek': return POWER_UP_COSTS.PEEK;
      case 'skip': return POWER_UP_COSTS.SKIP;
      case 'double_down': return POWER_UP_COSTS.DOUBLE_DOWN;
      default: return 0;
    }
  }, [state.powerUps]);

  // Activate peek power-up
  const activatePeek = useCallback(async (): Promise<{ success: boolean; cost: number }> => {
    if (peekActive) return { success: false, cost: 0 };
    
    // Use from inventory if available
    if (state.powerUps.peek > 0) {
      const newState = { ...state };
      newState.powerUps.peek -= 1;
      await saveState(newState);
      setPeekActive(true);
      return { success: true, cost: 0 };
    }
    
    // Otherwise, return cost to deduct from user score
    setPeekActive(true);
    return { success: true, cost: POWER_UP_COSTS.PEEK };
  }, [state, peekActive]);

  // Deactivate peek (after voting)
  const deactivatePeek = useCallback(() => {
    setPeekActive(false);
  }, []);

  // Activate double down power-up
  const activateDoubleDown = useCallback(async (): Promise<{ success: boolean; cost: number }> => {
    if (state.doubleDownActive) return { success: false, cost: 0 };
    
    // Use from inventory if available
    if (state.powerUps.double_down > 0) {
      const newState = { ...state };
      newState.powerUps.double_down -= 1;
      newState.doubleDownActive = true;
      await saveState(newState);
      return { success: true, cost: 0 };
    }
    
    // Otherwise, return cost to deduct from user score
    const newState = { ...state, doubleDownActive: true };
    await saveState(newState);
    return { success: true, cost: POWER_UP_COSTS.DOUBLE_DOWN };
  }, [state]);

  // Use skip power-up (returns cost if no inventory)
  const activateSkip = useCallback(async (): Promise<{ success: boolean; cost: number }> => {
    // Use from inventory if available
    if (state.powerUps.skip > 0) {
      const newState = { ...state };
      newState.powerUps.skip -= 1;
      await saveState(newState);
      return { success: true, cost: 0 };
    }
    
    // Otherwise, return cost to deduct from user score
    return { success: true, cost: POWER_UP_COSTS.SKIP };
  }, [state]);

  // Clear active power-ups after vote (call after vote is processed)
  const clearActiveEffects = useCallback(async () => {
    setPeekActive(false);
    
    if (state.doubleDownActive) {
      const newState = { ...state, doubleDownActive: false };
      await saveState(newState);
    }
  }, [state]);

  // Consume multiplier after a vote
  const consumeMultiplier = useCallback(async () => {
    if (state.multiplierVotesRemaining <= 0) return;
    
    const newState = { ...state };
    newState.multiplierVotesRemaining -= 1;
    
    if (newState.multiplierVotesRemaining === 0) {
      newState.activeMultiplier = 1;
    }
    
    // Clear double down after use
    if (newState.doubleDownActive) {
      newState.doubleDownActive = false;
    }
    
    await saveState(newState);
  }, [state]);

  // Get effective multiplier for current vote
  const getEffectiveMultiplier = useCallback((): number => {
    let multiplier = state.activeMultiplier;
    if (state.doubleDownActive) {
      multiplier *= 2;
    }
    return multiplier;
  }, [state.activeMultiplier, state.doubleDownActive]);

  // Close modals
  const closeChest = useCallback(() => setShowChest(false), []);
  const closeSpin = useCallback(() => setShowSpin(false), []);

  // Convenience function for using streak freeze
  const useStreakFreezeItem = useCallback(async (): Promise<boolean> => {
    return usePowerUp('streak_freeze');
  }, [usePowerUp]);

  return {
    // State
    loading,
    canSpin: state.canSpin,
    powerUps: {
      streakFreeze: state.powerUps.streak_freeze,
      peek: state.powerUps.peek,
      skip: state.powerUps.skip,
      doubleDown: state.powerUps.double_down,
    },
    activeMultiplier: state.activeMultiplier,
    multiplierVotesRemaining: state.multiplierVotesRemaining,
    doubleDownActive: state.doubleDownActive,
    peekActive,
    
    // Hyperstreak bonus
    streakFreezeCapacity, // 1 normally, 2 during hyperstreak
    hyperstreakFreezeBonus: inHyperstreak ? HYPER.FREEZE_CAPACITY_BONUS : 0,
    
    // Modal visibility
    showChest,
    showSpin,
    
    // Actions
    onVoteComplete,
    onChestClaimed,
    openDailySpin,
    onSpinClaimed,
    usePowerUp,
    consumeMultiplier,
    getEffectiveMultiplier,
    useStreakFreezeItem,
    
    // Power-up activation
    canAffordPowerUp,
    getPowerUpCost,
    activatePeek,
    deactivatePeek,
    activateDoubleDown,
    activateSkip,
    clearActiveEffects,
    
    // Modal controls
    closeChest,
    closeSpin,
  };
}

