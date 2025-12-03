import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reward } from '../lib/rewards';

const STORAGE_KEY = '@same_dopamine';

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
  votesUntilChest: 5, // First chest after 5 votes
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

// Chest appears every 5-10 votes (randomized)
const MIN_VOTES_BETWEEN_CHESTS = 5;
const MAX_VOTES_BETWEEN_CHESTS = 10;

function getRandomChestInterval(): number {
  return Math.floor(
    Math.random() * (MAX_VOTES_BETWEEN_CHESTS - MIN_VOTES_BETWEEN_CHESTS + 1) + MIN_VOTES_BETWEEN_CHESTS
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function useDopamineFeatures() {
  const [state, setState] = useState<DopamineState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  
  // Modal visibility states
  const [showChest, setShowChest] = useState(false);
  const [showSpin, setShowSpin] = useState(false);

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
  const onVoteComplete = useCallback((voteCount: number, won: boolean): boolean => {
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

  // Use a power-up
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
    
    // Modal controls
    closeChest,
    closeSpin,
  };
}

