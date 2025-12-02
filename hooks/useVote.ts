import { useState, useCallback } from 'react';
import { voteOnQuestion } from '../lib/firestore';
import type { VoteChoice, VoteResult } from '../types';
import * as Haptics from 'expo-haptics';

interface VoteState {
  loading: boolean;
  error: string | null;
  result: VoteResult | null;
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
    choice: VoteChoice
  ): Promise<VoteResult | null> => {
    setState({ loading: true, error: null, result: null });
    
    try {
      const result = await voteOnQuestion(uid, questionId, choice);
      
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

