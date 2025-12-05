import { useState, useCallback } from 'react';
import { voteOnQuestion } from '../lib/firestore';
import { castVoteSecure } from '../lib/cloudFunctions';
import type { VoteChoice, VoteResult } from '../types';
import * as Haptics from 'expo-haptics';

/**
 * PRODUCTION TOGGLE: Cloud Functions vs Direct Firestore
 * 
 * When false (development): Votes are cast directly to Firestore.
 *   - Faster for development/testing
 *   - NOT secure - vote counts and scores can be manipulated client-side
 * 
 * When true (production): Votes use Cloud Functions for server-side validation.
 *   - Anti-cheat protection - server validates all vote logic
 *   - Multipliers and power-ups are verified server-side
 *   - Requires deploying Cloud Functions first: `cd functions && npm run deploy`
 * 
 * TODO: Set to true before production deployment!
 */
const USE_CLOUD_FUNCTIONS = false;

interface VoteState {
  loading: boolean;
  error: string | null;
  result: VoteResult | null;
}

interface VoteOptions {
  doubleDownActive?: boolean;
  activeMultiplier?: number;
}

export function useVote() {
  const [state, setState] = useState<VoteState>({
    loading: false,
    error: null,
    result: null,
  });

  const vote = useCallback(async (
    uid: string,
    questionId: string,
    choice: VoteChoice,
    options?: VoteOptions
  ): Promise<VoteResult | null> => {
    setState({ loading: true, error: null, result: null });
    
    try {
      let result: VoteResult;
      
      if (USE_CLOUD_FUNCTIONS) {
        // Use secure Cloud Function (anti-cheat)
        const response = await castVoteSecure(questionId, choice, {
          doubleDownActive: options?.doubleDownActive,
          activeMultiplier: options?.activeMultiplier,
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Vote failed');
        }
        
        result = {
          won: response.won,
          choice,
          votes_a: response.votes_a,
          votes_b: response.votes_b,
          percentage_a: response.percentage_a,
          percentage_b: response.percentage_b,
          previousStreak: response.previousStreak,
          newStreak: response.newStreak,
        };
      } else {
        // Use direct Firestore (development mode)
        result = await voteOnQuestion(uid, questionId, choice);
      }
      
      // Haptic feedback based on result
      if (result.won) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      setState({ loading: false, error: null, result });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setState({ loading: false, error: errorMessage, result: null });
      
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return {
    ...state,
    vote,
    reset,
  };
}

