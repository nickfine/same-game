import { useState, useEffect, useCallback } from 'react';
import { getVoteHistory } from '../lib/firestore';
import type { VoteHistoryItem } from '../types';

interface VoteHistoryState {
  history: VoteHistoryItem[];
  loading: boolean;
  error: string | null;
}

export function useVoteHistory(uid: string | null) {
  const [state, setState] = useState<VoteHistoryState>({
    history: [],
    loading: true,
    error: null,
  });

  const fetchHistory = useCallback(async () => {
    if (!uid) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const history = await getVoteHistory(uid, 50);
      setState({ history, loading: false, error: null });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load history',
      }));
    }
  }, [uid]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    ...state,
    refresh: fetchHistory,
  };
}

