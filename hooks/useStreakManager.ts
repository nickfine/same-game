import { useState, useCallback, useMemo } from 'react';
import { doc, updateDoc, serverTimestamp, increment, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getTodayDate, daysBetween } from '../lib/dateUtils';
import { playReviveSound } from '../lib/sounds';
import type { User } from '../types';

const CRACKED_BADGE_DAYS = 7;

// Revival methods
export type ReviveMethod = 'freeze' | 'ad' | 'share';

// ═══════════════════════════════════════════════════════════════
// 🔥 PHOENIX BADGE - Secret badge for first successful revive
// ═══════════════════════════════════════════════════════════════
async function grantPhoenixBadge(uid: string): Promise<void> {
  try {
    const achievementRef = doc(db, 'users', uid, 'achievements', 'phoenix');
    await setDoc(achievementRef, {
      unlocked_at: serverTimestamp(),
    });
    console.log('🔥 Phoenix badge granted to user:', uid);
  } catch (error) {
    console.error('Failed to grant Phoenix badge:', error);
  }
}

interface StreakManagerState {
  showDeathModal: boolean;
  deadStreak: number;
  streakSaved: boolean;
  reviveMethod: ReviveMethod | null;
}

export function useStreakManager(user: User | null, hasStreakFreeze: boolean) {
  const [state, setState] = useState<StreakManagerState>({
    showDeathModal: false,
    deadStreak: 0,
    streakSaved: false,
    reviveMethod: null,
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
      reviveMethod: null,
    });
  }, []);

  // Called when user chooses to use a streak freeze
  const useStreakFreeze = useCallback(async () => {
    if (!user || !hasStreakFreeze) return false;

    try {
      // Restore the streak (will be handled by dopamine hook for freeze consumption)
      const userRef = doc(db, 'users', user.uid);
      const isFirstRevive = (user.total_revives ?? 0) === 0;
      
      await updateDoc(userRef, {
        current_streak: state.deadStreak,
        last_active: serverTimestamp(),
        freeze_revives: increment(1),
        total_revives: increment(1), // Track for Phoenix badge
      });
      
      // 🔥 PHOENIX BADGE - Grant on first successful revive!
      if (isFirstRevive) {
        await grantPhoenixBadge(user.uid);
      }
      
      // Play triumphant revive sound!
      playReviveSound();

      setState(prev => ({
        ...prev,
        showDeathModal: false,
        streakSaved: true,
        reviveMethod: 'freeze',
      }));

      return true;
    } catch (error) {
      console.error('Failed to use streak freeze:', error);
      return false;
    }
  }, [user, hasStreakFreeze, state.deadStreak]);

  // Called when user watches an ad to revive
  const reviveWithAd = useCallback(async () => {
    if (!user) return false;

    try {
      // Restore the streak without consuming a freeze
      const userRef = doc(db, 'users', user.uid);
      const isFirstRevive = (user.total_revives ?? 0) === 0;
      
      await updateDoc(userRef, {
        current_streak: state.deadStreak,
        last_active: serverTimestamp(),
        // Track ad revives for analytics
        ad_revives: increment(1),
        total_revives: increment(1), // Track for Phoenix badge
      });
      
      // 🔥 PHOENIX BADGE - Grant on first successful revive!
      if (isFirstRevive) {
        await grantPhoenixBadge(user.uid);
      }
      
      // Play triumphant revive sound!
      playReviveSound();

      setState(prev => ({
        ...prev,
        showDeathModal: false,
        streakSaved: true,
        reviveMethod: 'ad',
      }));

      return true;
    } catch (error) {
      console.error('Failed to revive with ad:', error);
      return false;
    }
  }, [user, state.deadStreak]);

  // Called when user shares to friends to revive
  const reviveWithShare = useCallback(async () => {
    if (!user) return false;

    try {
      // Restore the streak
      const userRef = doc(db, 'users', user.uid);
      const isFirstRevive = (user.total_revives ?? 0) === 0;
      
      await updateDoc(userRef, {
        current_streak: state.deadStreak,
        last_active: serverTimestamp(),
        // Track share revives for analytics
        share_revives: increment(1),
        total_revives: increment(1), // Track for Phoenix badge
      });
      
      // 🔥 PHOENIX BADGE - Grant on first successful revive!
      if (isFirstRevive) {
        await grantPhoenixBadge(user.uid);
      }
      
      // Play triumphant revive sound!
      playReviveSound();

      setState(prev => ({
        ...prev,
        showDeathModal: false,
        streakSaved: true,
        reviveMethod: 'share',
      }));

      return true;
    } catch (error) {
      console.error('Failed to revive with share:', error);
      return false;
    }
  }, [user, state.deadStreak]);

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
        reviveMethod: null,
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
    reviveMethod: state.reviveMethod,
    
    // Computed
    daysSinceDeath,
    showCrackedBadge,
    lastDeadStreak: user?.last_dead_streak ?? null,
    
    // Actions
    handleStreakDeath,
    useStreakFreeze,
    reviveWithAd,
    reviveWithShare,
    acceptStreakDeath,
    closeDeathModal,
    clearCrackedBadge,
  };
}

