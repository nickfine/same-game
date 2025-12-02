import { useState, useCallback } from 'react';
import { createQuestion } from '../lib/firestore';
import type { CreateQuestionInput, Question } from '../types';
import * as Haptics from 'expo-haptics';

interface CreateQuestionState {
  loading: boolean;
  error: string | null;
  createdQuestion: Question | null;
}

export function useCreateQuestion() {
  const [state, setState] = useState<CreateQuestionState>({
    loading: false,
    error: null,
    createdQuestion: null,
  });

  const create = useCallback(async (
    uid: string,
    input: CreateQuestionInput
  ): Promise<Question | null> => {
    setState({ loading: true, error: null, createdQuestion: null });
    
    try {
      const question = await createQuestion(uid, input);
      
      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setState({ loading: false, error: null, createdQuestion: question });
      return question;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create question';
      
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setState({ loading: false, error: errorMessage, createdQuestion: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, createdQuestion: null });
  }, []);

  return {
    ...state,
    create,
    reset,
  };
}

