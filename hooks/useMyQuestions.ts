import { useState, useEffect, useCallback } from 'react';
import { getUserQuestions } from '../lib/firestore';
import type { Question } from '../types';

interface MyQuestionsState {
  questions: Question[];
  loading: boolean;
  error: string | null;
}

export function useMyQuestions(uid: string | null) {
  const [state, setState] = useState<MyQuestionsState>({
    questions: [],
    loading: true,
    error: null,
  });

  const fetchQuestions = useCallback(async () => {
    if (!uid) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const questions = await getUserQuestions(uid, 50);
      setState({ questions, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load questions',
      }));
    }
  }, [uid]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    ...state,
    refresh: fetchQuestions,
  };
}

