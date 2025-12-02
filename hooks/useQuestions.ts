import { useState, useCallback, useEffect } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { getQuestions } from '../lib/firestore';
import type { Question } from '../types';

interface QuestionsState {
  questions: Question[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentIndex: number;
}

export function useQuestions(uid: string | null) {
  const [state, setState] = useState<QuestionsState>({
    questions: [],
    loading: true,
    error: null,
    hasMore: true,
    currentIndex: 0,
  });
  
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const fetchQuestions = useCallback(async (reset: boolean = false) => {
    if (!uid) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await getQuestions(uid, 20, reset ? undefined : lastDoc ?? undefined);
      
      setState(prev => ({
        ...prev,
        questions: reset 
          ? result.questions 
          : [...prev.questions, ...result.questions],
        loading: false,
        hasMore: result.questions.length > 0,
        currentIndex: reset ? 0 : prev.currentIndex,
      }));
      
      setLastDoc(result.lastDoc);
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load questions',
      }));
    }
  }, [uid, lastDoc]);

  // Initial fetch - only runs when uid changes, not on every fetchQuestions change
  useEffect(() => {
    if (uid) {
      fetchQuestions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      const newIndex = prev.currentIndex + 1;
      
      // Fetch more if running low
      if (newIndex >= prev.questions.length - 3 && prev.hasMore && !prev.loading) {
        fetchQuestions(false);
      }
      
      return {
        ...prev,
        currentIndex: newIndex,
      };
    });
  }, [fetchQuestions]);

  const removeCurrentQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== prev.currentIndex),
    }));
  }, []);

  const refresh = useCallback(() => {
    setLastDoc(null);
    fetchQuestions(true);
  }, [fetchQuestions]);

  const currentQuestion = state.questions[state.currentIndex] ?? null;
  const hasMoreQuestions = state.currentIndex < state.questions.length - 1 || state.hasMore;

  return {
    ...state,
    currentQuestion,
    hasMoreQuestions,
    nextQuestion,
    removeCurrentQuestion,
    refresh,
    fetchMore: () => fetchQuestions(false),
  };
}

