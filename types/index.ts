import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  display_name: string | null; // Player nickname
  score: number;
  questions_created: number;
  questions_created_today: number;
  last_question_date: string | null; // ISO date string for daily limit tracking
  votes_cast: number;
  votes_won: number;
  current_streak: number;
  best_streak: number;
  last_active: Timestamp | null;
}

// Leaderboard entry (public user data)
export interface LeaderboardEntry {
  uid: string;
  display_name: string;
  score: number;
  votes_won: number;
  votes_cast: number;
  win_rate: number;
  best_streak: number;
  rank: number;
}

export interface UserStats {
  score: number;
  votes_cast: number;
  votes_won: number;
  win_rate: number; // Calculated: votes_won / votes_cast * 100
  questions_created: number;
  current_streak: number;
  best_streak: number;
}

export interface Question {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  votes_a: number;
  votes_b: number;
  created_at: Timestamp;
  creator_uid?: string;
}

export interface Vote {
  id: string; // Composite key: `uid_questionId`
  uid: string;
  question_id: string;
  choice: 'a' | 'b';
  won: boolean;
  created_at: Timestamp;
}

export interface VoteHistoryItem {
  vote: Vote;
  question: Question;
}

export type VoteChoice = 'a' | 'b';

export interface VoteResult {
  won: boolean;
  choice: VoteChoice;
  votes_a: number;
  votes_b: number;
  percentage_a: number;
  percentage_b: number;
}

export interface CreateQuestionInput {
  text: string;
  option_a: string;
  option_b: string;
  initial_vote: VoteChoice;
}

// Achievement System
export type AchievementId = 
  | 'first_vote'
  | 'first_win'
  | 'first_question'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'votes_10'
  | 'votes_50'
  | 'votes_100'
  | 'wins_10'
  | 'wins_25'
  | 'wins_50'
  | 'questions_5'
  | 'questions_10'
  | 'score_10'
  | 'score_25'
  | 'score_50'
  | 'score_100';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'voting' | 'winning' | 'creating' | 'streak' | 'score';
}

export interface UserAchievement {
  id: AchievementId;
  unlocked_at: Timestamp;
}
