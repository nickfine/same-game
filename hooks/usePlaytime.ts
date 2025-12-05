import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COMPLIANCE } from '../lib/constants';
import { getWeekStart } from '../lib/dateUtils';
import type { PlaytimeRecord, PlaytimeSession } from '../types';

// Get playtime record reference (subcollection under users for cleaner security rules)
const getPlaytimeRef = (uid: string, weekStart: string) => 
  doc(db, 'users', uid, 'playtime', weekStart);

export function usePlaytime(uid: string | null, isMinor: boolean) {
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  
  const sessionStartRef = useRef<Date | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  
  // Use refs to avoid stale closures in interval callbacks
  const weeklyMinutesRef = useRef(weeklyMinutes);
  const warningShownRef = useRef(warningShown);
  
  // Keep refs in sync with state
  useEffect(() => {
    weeklyMinutesRef.current = weeklyMinutes;
  }, [weeklyMinutes]);
  
  useEffect(() => {
    warningShownRef.current = warningShown;
  }, [warningShown]);

  // Only track playtime for minors
  const shouldTrack = isMinor && uid;

  useEffect(() => {
    if (!shouldTrack) {
      setLoading(false);
      return;
    }

    loadWeeklyPlaytime();
    startSession();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      endSession();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [uid, isMinor]);

  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    if (!shouldTrack) return;

    if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
      // App going to background - end session
      endSession();
    } else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
      // App coming to foreground - start new session
      loadWeeklyPlaytime();
      startSession();
    }
    
    appStateRef.current = nextState;
  }, [shouldTrack]);

  const loadWeeklyPlaytime = async () => {
    if (!uid) return;
    
    try {
      const weekStart = getWeekStart();
      const playtimeRef = getPlaytimeRef(uid, weekStart);
      const playtimeDoc = await getDoc(playtimeRef);
      
      if (playtimeDoc.exists()) {
        const data = playtimeDoc.data() as PlaytimeRecord;
        setWeeklyMinutes(data.total_minutes);
        
        // Check if limit already reached
        if (data.total_minutes >= COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR) {
          setLimitReached(true);
        }
        
        // Check if we should show warning
        if (data.total_minutes >= COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR * COMPLIANCE.PLAYTIME_WARNING_THRESHOLD) {
          setWarningShown(true);
        }
      }
    } catch (error) {
      console.error('Failed to load playtime:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = useCallback(() => {
    if (!shouldTrack) return;
    
    sessionStartRef.current = new Date();
    
    // Update playtime every minute
    updateIntervalRef.current = setInterval(() => {
      updatePlaytime(1);
    }, 60000);
  }, [shouldTrack]);

  const endSession = useCallback(async () => {
    if (!uid || !sessionStartRef.current) return;
    
    // Clear the interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Calculate final session duration
    const sessionEnd = new Date();
    const durationMinutes = Math.round(
      (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 60000
    );
    
    sessionStartRef.current = null;
    
    // Save to Firestore (only if there's meaningful playtime)
    if (durationMinutes > 0) {
      await saveSessionToFirestore(durationMinutes);
    }
  }, [uid]);

  const updatePlaytime = useCallback(async (additionalMinutes: number) => {
    if (!uid) return;
    
    // Use refs to get current values (avoiding stale closure from setInterval)
    const newTotal = weeklyMinutesRef.current + additionalMinutes;
    setWeeklyMinutes(newTotal);
    
    // Check limits
    if (newTotal >= COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR) {
      setLimitReached(true);
    } else if (
      !warningShownRef.current && 
      newTotal >= COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR * COMPLIANCE.PLAYTIME_WARNING_THRESHOLD
    ) {
      setWarningShown(true);
    }
    
    // Persist to Firestore every 5 minutes to reduce writes
    if (newTotal % 5 === 0) {
      await saveSessionToFirestore(5);
    }
  }, [uid]); // Removed weeklyMinutes and warningShown from deps - using refs instead

  const saveSessionToFirestore = async (minutesToAdd: number) => {
    if (!uid) return;
    
    try {
      const weekStart = getWeekStart();
      const playtimeRef = getPlaytimeRef(uid, weekStart);
      const playtimeDoc = await getDoc(playtimeRef);
      
      if (playtimeDoc.exists()) {
        // Update existing record
        const data = playtimeDoc.data() as PlaytimeRecord;
        await updateDoc(playtimeRef, {
          total_minutes: data.total_minutes + minutesToAdd,
          last_updated: serverTimestamp(),
        });
      } else {
        // Create new record for this week
        const newRecord: Omit<PlaytimeRecord, 'last_updated'> & { last_updated: ReturnType<typeof serverTimestamp> } = {
          uid,
          week_start: weekStart,
          total_minutes: minutesToAdd,
          sessions: [],
          last_updated: serverTimestamp(),
        };
        await setDoc(playtimeRef, newRecord);
      }
    } catch (error) {
      console.error('Failed to save playtime:', error);
    }
  };

  // Get remaining playtime for the week
  const getRemainingMinutes = useCallback((): number => {
    if (!isMinor) return Infinity;
    return Math.max(0, COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR - weeklyMinutes);
  }, [isMinor, weeklyMinutes]);

  // Format minutes as hours and minutes
  const formatPlaytime = useCallback((minutes: number): string => {
    if (minutes === Infinity) return 'Unlimited';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }, []);

  // Dismiss warning (user acknowledged approaching limit)
  const dismissWarning = useCallback(() => {
    setWarningShown(false);
  }, []);

  return {
    loading,
    weeklyMinutes,
    limitReached,
    warningShown,
    
    getRemainingMinutes,
    formatPlaytime,
    dismissWarning,
    
    // Constants for display
    weeklyCapMinutes: COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR,
    warningThreshold: COMPLIANCE.PLAYTIME_WARNING_THRESHOLD,
  };
}

