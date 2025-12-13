import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { useCompliance } from '../hooks/useCompliance';
import { usePlaytime } from '../hooks/usePlaytime';
import { updateUserCompliance } from '../lib/firestore';
import { AgeGate } from './AgeGate';
import { BreakReminder } from './BreakReminder';
import { PlaytimeLimitModal } from './PlaytimeLimitModal';
import { DailyVoteLimitModal } from './DailyVoteLimitModal';
import type { User } from '../types';

interface ComplianceContextValue {
  isMinor: boolean;
  canVote: boolean;
  remainingVotes: number;
  showDailyVoteLimitModal: () => void;
}

const ComplianceContext = createContext<ComplianceContextValue>({
  isMinor: true,
  canVote: true,
  remainingVotes: 50,
  showDailyVoteLimitModal: () => {},
});

export const useComplianceContext = () => useContext(ComplianceContext);

interface ComplianceProviderProps {
  children: React.ReactNode;
  uid: string | null;
  user: User | null;
}

export function ComplianceProvider({ children, uid, user }: ComplianceProviderProps) {
  const {
    loading: complianceLoading,
    ageGateCompleted,
    isMinor,
    currentSessionMinutes,
    showBreakReminder,
    completeAgeGate,
    dismissBreakReminder,
    getRemainingVotes,
  } = useCompliance();

  const {
    loading: playtimeLoading,
    weeklyMinutes,
    limitReached,
    dismissWarning,
  } = usePlaytime(uid, isMinor);

  const [showVoteLimitModal, setShowVoteLimitModal] = useState(false);
  
  // Calculate remaining votes from user data
  const votesToday = user?.votes_today ?? 0;
  const lastVoteDate = user?.last_vote_date;
  const today = new Date().toISOString().split('T')[0];
  const actualVotesToday = lastVoteDate === today ? votesToday : 0;
  const remainingVotes = isMinor ? Math.max(0, 50 - actualVotesToday) : Infinity;
  const canVote = remainingVotes > 0;

  // Handle age gate completion
  const handleAgeGateComplete = useCallback(async (birthDate: string) => {
    const result = await completeAgeGate(birthDate);
    
    // Save to Firestore if we have a uid
    if (uid) {
      await updateUserCompliance(uid, birthDate, result.isMinor);
    }
  }, [completeAgeGate, uid]);

  // Handle break reminder dismissal
  const handleDismissBreakReminder = useCallback(() => {
    dismissBreakReminder();
  }, [dismissBreakReminder]);

  // Handle taking a break (could minimize app or show break screen)
  const handleTakeBreak = useCallback(() => {
    dismissBreakReminder();
    // Optionally: BackHandler.exitApp() or navigate to break screen
  }, [dismissBreakReminder]);

  // Handle playtime limit close (could exit app)
  const handlePlaytimeLimitClose = useCallback(() => {
    // For now, just dismiss - in production might exit app
    BackHandler.exitApp();
  }, []);

  // Show daily vote limit modal
  const showDailyVoteLimitModal = useCallback(() => {
    setShowVoteLimitModal(true);
  }, []);

  const contextValue: ComplianceContextValue = {
    isMinor,
    canVote,
    remainingVotes,
    showDailyVoteLimitModal,
  };

  // Show loading state briefly while compliance state loads
  // This should resolve quickly with the timeout in useCompliance
  if (complianceLoading) {
    // Return children anyway to prevent blank screen on web
    // The age gate will show once loading completes if needed
    return (
      <ComplianceContext.Provider value={contextValue}>
        {children}
      </ComplianceContext.Provider>
    );
  }

  return (
    <ComplianceContext.Provider value={contextValue}>
      {/* Main app content */}
      {children}

      {/* Age Gate Modal - Shows on first launch */}
      <AgeGate
        visible={!ageGateCompleted}
        onComplete={handleAgeGateComplete}
      />

      {/* Break Reminder Modal - Shows every 45 minutes for minors */}
      {isMinor && (
        <BreakReminder
          visible={showBreakReminder}
          sessionMinutes={currentSessionMinutes}
          onDismiss={handleDismissBreakReminder}
          onTakeBreak={handleTakeBreak}
        />
      )}

      {/* Playtime Limit Modal - Shows when weekly cap reached for minors */}
      {isMinor && (
        <PlaytimeLimitModal
          visible={limitReached}
          weeklyMinutes={weeklyMinutes}
          onClose={handlePlaytimeLimitClose}
        />
      )}

      {/* Daily Vote Limit Modal - Shows when daily votes exhausted for minors */}
      {isMinor && (
        <DailyVoteLimitModal
          visible={showVoteLimitModal}
          votesToday={actualVotesToday}
          onClose={() => setShowVoteLimitModal(false)}
        />
      )}
    </ComplianceContext.Provider>
  );
}

