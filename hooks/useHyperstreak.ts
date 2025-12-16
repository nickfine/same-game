// ═══════════════════════════════════════════════════════════════
// HYPERSTREAK HOOK - Zustand store synced to Firebase
// Optimistic updates for buttery smooth UX
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  HYPER,
  HyperstreakState,
  DEFAULT_HYPERSTREAK_STATE,
  onCorrectAnswer,
  onWrongAnswer,
  calculateHyperProgress,
  shouldPulse,
  getRingColor,
  getHyperMultiplier,
} from '../lib/hyperstreakLogic';
import type { User } from '../types';

// ═══════════════════════════════════════════════════════════════
// Zustand Store
// ═══════════════════════════════════════════════════════════════

interface HyperstreakStore extends HyperstreakState {
  // UI Animation states
  showActivation: boolean;
  showCrash: boolean;
  
  // Sync state
  uid: string | null;
  syncing: boolean;
  
  // Actions
  setFromUser: (user: User | null) => void;
  setUid: (uid: string | null) => void;
  
  // Animation triggers
  triggerActivation: () => void;
  dismissActivation: () => void;
  triggerCrash: () => void;
  dismissCrash: () => void;
  
  // Internal state updates (called after Firebase sync)
  _updateState: (state: Partial<HyperstreakState>) => void;
  _setSyncing: (syncing: boolean) => void;
}

export const useHyperstreakStore = create<HyperstreakStore>((set) => ({
  // Initial state (offline fallback)
  ...DEFAULT_HYPERSTREAK_STATE,
  
  // UI states
  showActivation: false,
  showCrash: false,
  
  // Sync state
  uid: null,
  syncing: false,
  
  // Sync from Firebase user snapshot
  setFromUser: (user) => {
    if (user) {
      set({
        hyper_bar: user.hyper_bar ?? 0,
        in_hyperstreak: user.in_hyperstreak ?? false,
        questions_in_hyper: user.questions_in_hyper ?? 0,
        hyperstreak_count: user.hyperstreak_count ?? 0,
      });
    } else {
      // Offline fallback - reset to defaults
      set(DEFAULT_HYPERSTREAK_STATE);
    }
  },
  
  setUid: (uid) => set({ uid }),
  
  // Animation triggers
  triggerActivation: () => set({ showActivation: true }),
  dismissActivation: () => set({ showActivation: false }),
  triggerCrash: () => set({ showCrash: true }),
  dismissCrash: () => set({ showCrash: false }),
  
  // Internal updates
  _updateState: (state) => set(state),
  _setSyncing: (syncing) => set({ syncing }),
}));

// ═══════════════════════════════════════════════════════════════
// Main Hook - Syncs with Firebase + provides actions
// ═══════════════════════════════════════════════════════════════

export function useHyperstreak(user: User | null) {
  const store = useHyperstreakStore();
  
  // Sync user data to store on change
  useEffect(() => {
    store.setFromUser(user);
    if (user) {
      store.setUid(user.uid);
    }
  }, [user?.hyper_bar, user?.in_hyperstreak, user?.questions_in_hyper, user?.hyperstreak_count, user?.uid]);
  
  // Offline fallback - set defaults until snapshot fires
  useEffect(() => {
    if (!user) {
      store._updateState(DEFAULT_HYPERSTREAK_STATE);
    }
  }, []);
  
  /**
   * Increment hyper bar on correct answer (when NOT in hyperstreak)
   * Returns whether hyperstreak should activate
   */
  const incrementHyperBar = useCallback(async (): Promise<{
    shouldActivate: boolean;
  }> => {
    if (!store.uid || store.in_hyperstreak) {
      return { shouldActivate: false };
    }
    
    // Optimistic update
    const currentState: HyperstreakState = {
      hyper_bar: store.hyper_bar,
      in_hyperstreak: store.in_hyperstreak,
      questions_in_hyper: store.questions_in_hyper,
      hyperstreak_count: store.hyperstreak_count,
    };
    
    const { newState, shouldActivate } = onCorrectAnswer(currentState);
    store._updateState(newState);
    store._setSyncing(true);
    
    try {
      const userRef = doc(db, 'users', store.uid);
      
      if (shouldActivate) {
        // Activating hyperstreak!
        await updateDoc(userRef, {
          hyper_bar: 0,
          in_hyperstreak: true,
          questions_in_hyper: 0,
          hyperstreak_count: increment(1),
          last_active: serverTimestamp(),
        });
        store.triggerActivation();
      } else {
        // Just incrementing bar
        await updateDoc(userRef, {
          hyper_bar: increment(1),
          last_active: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to increment hyper bar:', error);
      // Revert optimistic update on error
      store._updateState(currentState);
    } finally {
      store._setSyncing(false);
    }
    
    return { shouldActivate };
  }, [store.uid, store.hyper_bar, store.in_hyperstreak, store.questions_in_hyper, store.hyperstreak_count]);
  
  /**
   * Tick a question in hyperstreak mode
   * Returns whether hyperstreak should end naturally
   */
  const tickHyperQuestion = useCallback(async (): Promise<{
    shouldEnd: boolean;
  }> => {
    if (!store.uid || !store.in_hyperstreak) {
      return { shouldEnd: false };
    }
    
    // Optimistic update
    const currentState: HyperstreakState = {
      hyper_bar: store.hyper_bar,
      in_hyperstreak: store.in_hyperstreak,
      questions_in_hyper: store.questions_in_hyper,
      hyperstreak_count: store.hyperstreak_count,
    };
    
    const { newState, shouldEnd } = onCorrectAnswer(currentState);
    store._updateState(newState);
    store._setSyncing(true);
    
    try {
      const userRef = doc(db, 'users', store.uid);
      
      if (shouldEnd) {
        // Hyperstreak ending naturally (5 questions)
        await updateDoc(userRef, {
          hyper_bar: 0,
          in_hyperstreak: false,
          questions_in_hyper: 0,
          last_active: serverTimestamp(),
        });
      } else {
        // Still in hyperstreak
        await updateDoc(userRef, {
          questions_in_hyper: increment(1),
          last_active: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to tick hyper question:', error);
      store._updateState(currentState);
    } finally {
      store._setSyncing(false);
    }
    
    return { shouldEnd };
  }, [store.uid, store.hyper_bar, store.in_hyperstreak, store.questions_in_hyper, store.hyperstreak_count]);
  
  /**
   * Crash hyperstreak on wrong answer
   * Returns whether it was a crash (was in hyperstreak)
   */
  const crashHyperstreak = useCallback(async (): Promise<{
    wasCrash: boolean;
  }> => {
    if (!store.uid) {
      return { wasCrash: false };
    }
    
    const currentState: HyperstreakState = {
      hyper_bar: store.hyper_bar,
      in_hyperstreak: store.in_hyperstreak,
      questions_in_hyper: store.questions_in_hyper,
      hyperstreak_count: store.hyperstreak_count,
    };
    
    const { newState, wasCrash } = onWrongAnswer(currentState);
    
    // Optimistic update
    store._updateState(newState);
    store._setSyncing(true);
    
    if (wasCrash) {
      store.triggerCrash();
    }
    
    try {
      const userRef = doc(db, 'users', store.uid);
      await updateDoc(userRef, {
        hyper_bar: 0,
        in_hyperstreak: false,
        questions_in_hyper: 0,
        last_active: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to crash hyperstreak:', error);
      store._updateState(currentState);
    } finally {
      store._setSyncing(false);
    }
    
    return { wasCrash };
  }, [store.uid, store.hyper_bar, store.in_hyperstreak, store.questions_in_hyper, store.hyperstreak_count]);
  
  /**
   * Force activate hyperstreak (for testing/admin)
   */
  const activateHyperstreak = useCallback(async (): Promise<boolean> => {
    if (!store.uid || store.in_hyperstreak) return false;
    
    store._updateState({
      hyper_bar: 0,
      in_hyperstreak: true,
      questions_in_hyper: 0,
      hyperstreak_count: store.hyperstreak_count + 1,
    });
    store._setSyncing(true);
    
    try {
      const userRef = doc(db, 'users', store.uid);
      await updateDoc(userRef, {
        hyper_bar: 0,
        in_hyperstreak: true,
        questions_in_hyper: 0,
        hyperstreak_count: increment(1),
        last_active: serverTimestamp(),
      });
      store.triggerActivation();
      return true;
    } catch (error) {
      console.error('Failed to activate hyperstreak:', error);
      return false;
    } finally {
      store._setSyncing(false);
    }
  }, [store.uid, store.in_hyperstreak, store.hyperstreak_count]);
  
  return {
    // State
    hyperBar: store.hyper_bar,
    inHyperstreak: store.in_hyperstreak,
    questionsInHyper: store.questions_in_hyper,
    hyperstreakCount: store.hyperstreak_count,
    syncing: store.syncing,
    
    // Computed
    progress: calculateHyperProgress(store.hyper_bar),
    shouldPulse: shouldPulse(store.hyper_bar, store.in_hyperstreak),
    ringColor: getRingColor(store.in_hyperstreak),
    multiplier: getHyperMultiplier(store.in_hyperstreak),
    questionsRemaining: store.in_hyperstreak 
      ? HYPER.DURATION_QUESTIONS - store.questions_in_hyper 
      : 0,
    
    // Animation states
    showActivation: store.showActivation,
    showCrash: store.showCrash,
    
    // Actions
    incrementHyperBar,
    tickHyperQuestion,
    crashHyperstreak,
    activateHyperstreak,
    dismissActivation: store.dismissActivation,
    dismissCrash: store.dismissCrash,
    
    // Constants for UI
    HYPER,
  };
}

export type UseHyperstreakReturn = ReturnType<typeof useHyperstreak>;


