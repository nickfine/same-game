import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMPLIANCE } from '../lib/constants';
import { getTodayDate, getWeekStart } from '../lib/dateUtils';
import type { ComplianceState } from '../types';

const STORAGE_KEY = '@same_compliance';

// Expose reset function globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).resetComplianceForTesting = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[Compliance] Storage cleared! Reload the page to see the Age Gate.');
    window.location.reload();
  };
}

const DEFAULT_STATE: ComplianceState = {
  ageGateCompleted: false,
  birthDate: null,
  isMinor: true, // Assume minor until proven otherwise
  lastBreakReminderTime: null,
  sessionStartTime: null,
  currentSessionMinutes: 0,
};

// Calculate age from birth date
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Check if user is a minor based on birth date
export function isMinorByBirthDate(birthDate: string): boolean {
  return calculateAge(birthDate) < COMPLIANCE.ADULT_AGE;
}

// Check if user meets minimum age requirement
export function meetsMinimumAge(birthDate: string): boolean {
  return calculateAge(birthDate) >= COMPLIANCE.MIN_AGE;
}

// Re-export date utilities for backwards compatibility
export { getTodayDate, getWeekStart } from '../lib/dateUtils';

export function useCompliance() {
  const [state, setState] = useState<ComplianceState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load compliance state from storage
  useEffect(() => {
    // Check for reset param in URL (for testing)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset_compliance') === 'true') {
        console.log('[Compliance] Reset param detected, clearing storage...');
        AsyncStorage.removeItem(STORAGE_KEY).then(() => {
          // Remove the param and reload
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        });
        return;
      }
    }
    loadState();
  }, []);

  // Start session timer when app loads and age gate is completed
  useEffect(() => {
    if (state.ageGateCompleted && state.isMinor) {
      startSessionTracking();
    }
    
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [state.ageGateCompleted, state.isMinor]);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ComplianceState;
        // Start fresh session
        setState({
          ...parsed,
          sessionStartTime: Date.now(),
          currentSessionMinutes: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load compliance state:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newState: ComplianceState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save compliance state:', error);
    }
  };

  const startSessionTracking = useCallback(() => {
    const now = Date.now();
    
    setState(prev => ({
      ...prev,
      sessionStartTime: now,
      currentSessionMinutes: 0,
    }));

    // Clear any existing timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Update session time every minute
    sessionTimerRef.current = setInterval(() => {
      setState(prev => {
        const newMinutes = prev.currentSessionMinutes + 1;
        
        // Check if we should show break reminder
        const timeSinceLastReminder = prev.lastBreakReminderTime 
          ? (Date.now() - prev.lastBreakReminderTime) / 60000 
          : Infinity;
        
        if (
          newMinutes >= COMPLIANCE.BREAK_REMINDER_INTERVAL &&
          timeSinceLastReminder >= COMPLIANCE.BREAK_REMINDER_COOLDOWN &&
          newMinutes % COMPLIANCE.BREAK_REMINDER_INTERVAL < 1
        ) {
          setShowBreakReminder(true);
        }
        
        return {
          ...prev,
          currentSessionMinutes: newMinutes,
        };
      });
    }, 60000); // Every minute
  }, []);

  // Complete the age gate
  const completeAgeGate = useCallback(async (birthDate: string) => {
    const age = calculateAge(birthDate);
    
    if (age < COMPLIANCE.MIN_AGE) {
      throw new Error(`You must be at least ${COMPLIANCE.MIN_AGE} years old to use this app.`);
    }
    
    const isMinor = age < COMPLIANCE.ADULT_AGE;
    
    const newState: ComplianceState = {
      ...state,
      ageGateCompleted: true,
      birthDate,
      isMinor,
      sessionStartTime: Date.now(),
      currentSessionMinutes: 0,
    };
    
    await saveState(newState);
    
    return { isMinor, age };
  }, [state]);

  // Dismiss break reminder
  const dismissBreakReminder = useCallback(async () => {
    setShowBreakReminder(false);
    const newState = {
      ...state,
      lastBreakReminderTime: Date.now(),
    };
    await saveState(newState);
  }, [state]);

  // Check if user can vote (daily limit for minors)
  const canVote = useCallback((votesToday: number): boolean => {
    if (!state.isMinor) return true;
    return votesToday < COMPLIANCE.DAILY_VOTE_CAP_MINOR;
  }, [state.isMinor]);

  // Get remaining votes for today
  const getRemainingVotes = useCallback((votesToday: number): number => {
    if (!state.isMinor) return Infinity;
    return Math.max(0, COMPLIANCE.DAILY_VOTE_CAP_MINOR - votesToday);
  }, [state.isMinor]);

  // Reset compliance (for testing/development)
  const resetCompliance = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
  }, []);

  return {
    // State
    loading,
    ageGateCompleted: state.ageGateCompleted,
    isMinor: state.isMinor,
    birthDate: state.birthDate,
    currentSessionMinutes: state.currentSessionMinutes,
    showBreakReminder,
    
    // Actions
    completeAgeGate,
    dismissBreakReminder,
    canVote,
    getRemainingVotes,
    resetCompliance,
    
    // Constants (for UI display)
    dailyVoteCap: state.isMinor ? COMPLIANCE.DAILY_VOTE_CAP_MINOR : COMPLIANCE.DAILY_VOTE_CAP_ADULT,
    weeklyPlaytimeCap: state.isMinor ? COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR : Infinity,
    breakReminderInterval: COMPLIANCE.BREAK_REMINDER_INTERVAL,
  };
}

