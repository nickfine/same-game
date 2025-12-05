import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ACHIEVEMENTS, checkAchievements, getAchievement } from '../lib/achievements';
import type { User, AchievementId, Achievement, UserAchievement } from '../types';

interface AchievementsState {
  unlocked: Set<AchievementId>;
  loading: boolean;
  error: string | null;
  newlyUnlocked: Achievement[];
}

export function useAchievements(uid: string | null, user: User | null) {
  const [state, setState] = useState<AchievementsState>({
    unlocked: new Set(),
    loading: true,
    error: null,
    newlyUnlocked: [],
  });

  // Fetch user's unlocked achievements
  const fetchAchievements = useCallback(async () => {
    if (!uid) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const achievementsRef = collection(db, 'users', uid, 'achievements');
      const snapshot = await getDocs(achievementsRef);
      
      const unlocked = new Set<AchievementId>();
      snapshot.docs.forEach(doc => {
        unlocked.add(doc.id as AchievementId);
      });

      setState(prev => ({ 
        ...prev, 
        unlocked, 
        loading: false, 
        error: null 
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load achievements',
      }));
    }
  }, [uid]);

  // Check and unlock new achievements when user stats change
  const checkAndUnlock = useCallback(async () => {
    if (!uid || !user) return;

    const newlyUnlockedIds = checkAchievements(user, state.unlocked);
    
    if (newlyUnlockedIds.length === 0) return;

    // Save new achievements to Firestore
    const achievementsRef = collection(db, 'users', uid, 'achievements');
    const newAchievements: Achievement[] = [];

    for (const id of newlyUnlockedIds) {
      const achievement = getAchievement(id);
      if (achievement) {
        newAchievements.push(achievement);
        
        // Save to Firestore
        await setDoc(doc(achievementsRef, id), {
          unlocked_at: serverTimestamp(),
        });
      }
    }

    // Update state
    setState(prev => ({
      ...prev,
      unlocked: new Set([...prev.unlocked, ...newlyUnlockedIds]),
      newlyUnlocked: newAchievements,
    }));
  }, [uid, user, state.unlocked]);

  // Clear the newly unlocked notification
  const clearNewlyUnlocked = useCallback(() => {
    setState(prev => ({ ...prev, newlyUnlocked: [] }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Check for new achievements when user stats change
  // Only run AFTER initial fetch completes to avoid showing already-unlocked achievements
  useEffect(() => {
    if (!state.loading && user && state.unlocked.size >= 0) {
      checkAndUnlock();
    }
    // Include checkAndUnlock in deps to avoid stale closure with empty unlocked set
  }, [state.loading, checkAndUnlock]);

  // Get all achievements with unlock status
  const allAchievements = ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: state.unlocked.has(achievement.id),
  }));

  const unlockedCount = state.unlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  return {
    achievements: allAchievements,
    unlocked: state.unlocked,
    unlockedCount,
    totalCount,
    loading: state.loading,
    error: state.error,
    newlyUnlocked: state.newlyUnlocked,
    clearNewlyUnlocked,
    refresh: fetchAchievements,
  };
}

