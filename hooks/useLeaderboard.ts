import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, getUserRank } from '../lib/firestore';
import type { LeaderboardEntry } from '../types';

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeaderboard(uid: string | null): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [entries, rank] = await Promise.all([
        getLeaderboard(50),
        getUserRank(uid),
      ]);
      
      setLeaderboard(entries);
      setUserRank(rank);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const refresh = useCallback(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    loading,
    error,
    refresh,
  };
}

