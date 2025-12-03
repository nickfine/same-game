import { useState, useCallback, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types';

const CRACKED_BADGE_DAYS = 7;

interface StreakManagerState {
  showDeathModal: boolean;
  deadStreak: number;
  streakSaved: boolean;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function useStreakManager(user: User | null, hasStreakFreeze: boolean) {
  const [state, setState] = useState<StreakManagerState>({
    showDeathModal: false,
    deadStreak: 0,
    streakSaved: false,
  });

  // Calculate days since last streak death
  const daysSinceDeath = useMemo(() => {
    if (!user?.streak_death_date) return Infinity;
    return daysBetween(user.streak_death_date, getTodayDate());
  }, [user?.streak_death_date]);

  // Whether to show cracked badge
  const showCrackedBadge = useMemo(() => {
    return user?.last_dead_streak !== null && 
           user?.last_dead_streak !== undefined &&
           daysSinceDeath < CRACKED_BADGE_DAYS;
  }, [user?.last_dead_streak, daysSinceDeath]);

  // Called when a vote results in a loss (streak = 0)
  const handleStreakDeath = useCallback((deadStreakValue: number) => {
    if (deadStreakValue <= 0) return;
    
    setState({
      showDeathModal: true,
      deadStreak: deadStreakValue,
      streakSaved: false,
    });
  }, []);

  // Called when user chooses to use a streak freeze
  const useStreakFreeze = useCallback(async () => {
    if (!user || !hasStreakFreeze) return false;

    try {
      // Restore the streak (will be handled by dopamine hook for freeze consumption)
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        current_streak: state.deadStreak,
        last_active: serverTimestamp(),
      });

      setState(prev => ({
        ...prev,
        showDeathModal: false,
        streakSaved: true,
      }));

      return true;
    } catch (error) {
      console.error('Failed to use streak freeze:', error);
      return false;
    }
  }, [user, hasStreakFreeze, state.deadStreak]);

  // Called when user accepts the streak death
  const acceptStreakDeath = useCallback(async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        last_dead_streak: state.deadStreak,
        streak_death_date: getTodayDate(),
        last_active: serverTimestamp(),
      });

      setState(prev => ({
        ...prev,
        showDeathModal: false,
      }));
    } catch (error) {
      console.error('Failed to record streak death:', error);
    }
  }, [user, state.deadStreak]);

  // Close the death modal
  const closeDeathModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDeathModal: false,
    }));
  }, []);

  // Clear the cracked badge (called after 7 days or manually)
  const clearCrackedBadge = useCallback(async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        last_dead_streak: null,
        streak_death_date: null,
      });
    } catch (error) {
      console.error('Failed to clear cracked badge:', error);
    }
  }, [user]);

  return {
    // State
    showDeathModal: state.showDeathModal,
    deadStreak: state.deadStreak,
    streakSaved: state.streakSaved,
    
    // Computed
    daysSinceDeath,
    showCrackedBadge,
    lastDeadStreak: user?.last_dead_streak ?? null,
    
    // Actions
    handleStreakDeath,
    useStreakFreeze,
    acceptStreakDeath,
    closeDeathModal,
    clearCrackedBadge,
  };
}

