import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateLevel } from '../lib/levels';
import type { LeaderboardEntry } from '../types';

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD HOOK - Global + Friends Support
// ═══════════════════════════════════════════════════════════════

type LeaderboardTab = 'global' | 'friends';

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  friendsLeaderboard: LeaderboardEntry[];
  userRank: number | null;
  loading: boolean;
  error: string | null;
  activeTab: LeaderboardTab;
  setActiveTab: (tab: LeaderboardTab) => void;
  refresh: () => void;
}

// Mock friends data (in production, this would come from a friends system)
const MOCK_FRIEND_UIDS: string[] = [];

export function useLeaderboard(uid: string | null): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');

  const fetchLeaderboard = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch global leaderboard (top 100)
      const globalQuery = query(
        collection(db, 'users'),
        orderBy('score', 'desc'),
        limit(100)
      );
      
      const globalSnapshot = await getDocs(globalQuery);
      
      const globalEntries: LeaderboardEntry[] = globalSnapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        const votesCast = data.votes_cast ?? 0;
        const votesWon = data.votes_won ?? 0;
        const winRate = votesCast > 0 ? Math.round((votesWon / votesCast) * 100) : 0;
        const xp = data.xp ?? 0;
        
        return {
          uid: docSnap.id,
          display_name: data.display_name || `Player${docSnap.id.slice(-4)}`,
          score: data.score ?? 0,
          votes_won: votesWon,
          votes_cast: votesCast,
          win_rate: winRate,
          best_streak: data.best_streak ?? 0,
          current_streak: data.current_streak ?? 0,
          rank: index + 1,
          level: data.level ?? calculateLevel(xp),
          in_hyperstreak: data.in_hyperstreak ?? false,
          hyperstreak_count: data.hyperstreak_count ?? 0,
        };
      });
      
      setLeaderboard(globalEntries);
      
      // Calculate user rank
      const userEntry = globalEntries.find(e => e.uid === uid);
      if (userEntry) {
        setUserRank(userEntry.rank);
      } else {
        // User not in top 100, calculate actual rank
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userScore = userSnap.data().score ?? 0;
          const higherScoreQuery = query(
            collection(db, 'users'),
            where('score', '>', userScore)
          );
          const higherSnap = await getDocs(higherScoreQuery);
          setUserRank(higherSnap.size + 1);
        }
      }
      
      // Generate friends leaderboard (mock data for now)
      // In production, you'd query actual friends from a friends collection
      const friendsEntries = generateMockFriendsLeaderboard(globalEntries, uid);
      setFriendsLeaderboard(friendsEntries);
      
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
    friendsLeaderboard,
    userRank,
    loading,
    error,
    activeTab,
    setActiveTab,
    refresh,
  };
}

// ═══════════════════════════════════════════════════════════════
// MOCK FRIENDS DATA - Makes the social features feel alive
// ═══════════════════════════════════════════════════════════════
function generateMockFriendsLeaderboard(
  globalEntries: LeaderboardEntry[], 
  currentUid: string
): LeaderboardEntry[] {
  // Take some random entries from global + add mock data
  const mockFriends: LeaderboardEntry[] = [
    {
      uid: 'friend_1',
      display_name: 'Alex',
      score: Math.floor(Math.random() * 200) + 50,
      votes_won: Math.floor(Math.random() * 100) + 20,
      votes_cast: Math.floor(Math.random() * 150) + 40,
      win_rate: Math.floor(Math.random() * 30) + 50,
      best_streak: Math.floor(Math.random() * 20) + 5,
      current_streak: Math.floor(Math.random() * 15),
      rank: 0,
      level: Math.floor(Math.random() * 15) + 3,
      in_hyperstreak: Math.random() > 0.7,
      hyperstreak_count: Math.floor(Math.random() * 5),
      avatar_emoji: '😎',
    },
    {
      uid: 'friend_2',
      display_name: 'Sam',
      score: Math.floor(Math.random() * 180) + 30,
      votes_won: Math.floor(Math.random() * 80) + 15,
      votes_cast: Math.floor(Math.random() * 120) + 30,
      win_rate: Math.floor(Math.random() * 25) + 55,
      best_streak: Math.floor(Math.random() * 25) + 3,
      current_streak: Math.floor(Math.random() * 18) + 2,
      rank: 0,
      level: Math.floor(Math.random() * 12) + 2,
      in_hyperstreak: Math.random() > 0.8,
      hyperstreak_count: Math.floor(Math.random() * 3),
      avatar_emoji: '🔥',
    },
    {
      uid: 'friend_3',
      display_name: 'Jordan',
      score: Math.floor(Math.random() * 150) + 20,
      votes_won: Math.floor(Math.random() * 60) + 10,
      votes_cast: Math.floor(Math.random() * 100) + 25,
      win_rate: Math.floor(Math.random() * 20) + 45,
      best_streak: Math.floor(Math.random() * 15) + 2,
      current_streak: Math.floor(Math.random() * 10),
      rank: 0,
      level: Math.floor(Math.random() * 10) + 1,
      in_hyperstreak: false,
      hyperstreak_count: Math.floor(Math.random() * 2),
      avatar_emoji: '⚡',
    },
    {
      uid: 'friend_4',
      display_name: 'Riley',
      score: Math.floor(Math.random() * 120) + 40,
      votes_won: Math.floor(Math.random() * 50) + 12,
      votes_cast: Math.floor(Math.random() * 80) + 20,
      win_rate: Math.floor(Math.random() * 30) + 40,
      best_streak: Math.floor(Math.random() * 12) + 1,
      current_streak: Math.floor(Math.random() * 8),
      rank: 0,
      level: Math.floor(Math.random() * 8) + 1,
      in_hyperstreak: Math.random() > 0.85,
      hyperstreak_count: Math.floor(Math.random() * 4),
      avatar_emoji: '🎮',
    },
  ];
  
  // Find current user in global if exists
  const currentUserEntry = globalEntries.find(e => e.uid === currentUid);
  
  // Combine and sort by score
  const combined = currentUserEntry 
    ? [...mockFriends, { ...currentUserEntry, avatar_emoji: '👤' }]
    : mockFriends;
  
  // Sort by score descending and assign ranks
  return combined
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
