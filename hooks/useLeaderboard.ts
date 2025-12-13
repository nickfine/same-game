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
  documentId,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateLevel } from '../lib/levels';
import type { LeaderboardEntry } from '../types';

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD HOOK - Global + REAL Friends Support
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
  hasFriends: boolean;
}

export function useLeaderboard(uid: string | null): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [hasFriends, setHasFriends] = useState(false);

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
      
      // ═══════════════════════════════════════════════════════════════
      // REAL FRIENDS LEADERBOARD - Pull from Firestore
      // ═══════════════════════════════════════════════════════════════
      
      // Get current user's friends list
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
      const friendUids: string[] = userData?.friends ?? [];
      
      setHasFriends(friendUids.length > 0);
      
      if (friendUids.length > 0) {
        // Fetch friends data from Firestore
        // Note: Firestore 'in' queries support up to 30 items, so we batch if needed
        const friendChunks = chunkArray(friendUids, 30);
        const friendEntries: LeaderboardEntry[] = [];
        
        for (const chunk of friendChunks) {
          const friendsQuery = query(
            collection(db, 'users'),
            where(documentId(), 'in', chunk)
          );
          
          const friendsSnapshot = await getDocs(friendsQuery);
          
          friendsSnapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const votesCast = data.votes_cast ?? 0;
            const votesWon = data.votes_won ?? 0;
            const winRate = votesCast > 0 ? Math.round((votesWon / votesCast) * 100) : 0;
            const xp = data.xp ?? 0;
            
            friendEntries.push({
              uid: docSnap.id,
              display_name: data.display_name || `Player${docSnap.id.slice(-4)}`,
              score: data.score ?? 0,
              votes_won: votesWon,
              votes_cast: votesCast,
              win_rate: winRate,
              best_streak: data.best_streak ?? 0,
              current_streak: data.current_streak ?? 0,
              rank: 0, // Will be assigned after sorting
              level: data.level ?? calculateLevel(xp),
              in_hyperstreak: data.in_hyperstreak ?? false,
              hyperstreak_count: data.hyperstreak_count ?? 0,
              avatar_emoji: data.avatar_emoji ?? '👤',
            });
          });
        }
        
        // Add current user to friends list
        if (userSnap.exists()) {
          const data = userSnap.data();
          const votesCast = data.votes_cast ?? 0;
          const votesWon = data.votes_won ?? 0;
          const winRate = votesCast > 0 ? Math.round((votesWon / votesCast) * 100) : 0;
          const xp = data.xp ?? 0;
          
          friendEntries.push({
            uid: uid,
            display_name: data.display_name || 'You',
            score: data.score ?? 0,
            votes_won: votesWon,
            votes_cast: votesCast,
            win_rate: winRate,
            best_streak: data.best_streak ?? 0,
            current_streak: data.current_streak ?? 0,
            rank: 0,
            level: data.level ?? calculateLevel(xp),
            in_hyperstreak: data.in_hyperstreak ?? false,
            hyperstreak_count: data.hyperstreak_count ?? 0,
            avatar_emoji: '👤',
          });
        }
        
        // Sort by score and assign ranks
        const sortedFriends = friendEntries
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));
        
        setFriendsLeaderboard(sortedFriends);
      } else {
        // No friends yet - show placeholder with mock data
        const placeholderFriends = generatePlaceholderFriends(globalEntries, uid);
        setFriendsLeaderboard(placeholderFriends);
      }
      
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
    hasFriends,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Chunk array for Firestore 'in' query limits
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Generate placeholder friends when user has no friends yet
// Shows "Add friends to compete!" message + some inviting mock data
function generatePlaceholderFriends(
  globalEntries: LeaderboardEntry[], 
  currentUid: string
): LeaderboardEntry[] {
  // Find current user in global if exists
  const currentUserEntry = globalEntries.find(e => e.uid === currentUid);
  
  // Create inviting placeholder entries to encourage friend invites
  const placeholders: LeaderboardEntry[] = [
    {
      uid: 'placeholder_1',
      display_name: '??? (Invite a friend!)',
      score: Math.floor(Math.random() * 50) + 100,
      votes_won: 0,
      votes_cast: 0,
      win_rate: 0,
      best_streak: Math.floor(Math.random() * 20) + 10,
      current_streak: Math.floor(Math.random() * 15) + 5,
      rank: 0,
      level: Math.floor(Math.random() * 10) + 5,
      in_hyperstreak: Math.random() > 0.5,
      hyperstreak_count: Math.floor(Math.random() * 3),
      avatar_emoji: '👻',
    },
    {
      uid: 'placeholder_2',
      display_name: '??? (Share to unlock!)',
      score: Math.floor(Math.random() * 80) + 50,
      votes_won: 0,
      votes_cast: 0,
      win_rate: 0,
      best_streak: Math.floor(Math.random() * 15) + 5,
      current_streak: Math.floor(Math.random() * 10),
      rank: 0,
      level: Math.floor(Math.random() * 8) + 3,
      in_hyperstreak: false,
      hyperstreak_count: 0,
      avatar_emoji: '🔒',
    },
  ];
  
  // Add current user
  const combined = currentUserEntry 
    ? [...placeholders, { ...currentUserEntry, avatar_emoji: '👤' }]
    : placeholders;
  
  // Sort by score and assign ranks
  return combined
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
