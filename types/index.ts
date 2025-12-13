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
  
  // Compliance fields
  birth_date: string | null; // ISO date string (YYYY-MM-DD)
  is_minor: boolean; // Calculated from birth_date
  age_verified_at: Timestamp | null; // When age was verified
  
  // Daily vote tracking (for minors)
  votes_today: number;
  last_vote_date: string | null; // ISO date for daily vote limit tracking
  
  // Streak death tracking (for loss aversion)
  last_dead_streak: number | null; // The streak value when it died
  streak_death_date: string | null; // ISO date when streak died (for cracked badge)
  
  // Revival tracking (for analytics)
  ad_revives?: number; // How many times revived via ad
  share_revives?: number; // How many times revived via sharing
  
  // Hyperstreak tracking
  hyper_bar: number; // 0-10 progress toward hyperstreak
  in_hyperstreak: boolean; // Currently in hyperstreak mode
  questions_in_hyper: number; // Count of questions answered during hyperstreak (max 5)
  hyperstreak_count: number; // Total hyperstreaks achieved (analytics)
  
  // Level system
  level?: number; // Player level (calculated from XP)
  xp?: number; // Experience points
  
  // Anti-cheat flag
  cheat_flag?: boolean; // Set by Cloud Function if cheating detected
}

// Compliance/Playtime tracking (separate collection for weekly resets)
export interface PlaytimeRecord {
  uid: string;
  week_start: string; // ISO date of week start (Monday)
  total_minutes: number; // Total playtime this week
  sessions: PlaytimeSession[];
  last_updated: Timestamp;
}

export interface PlaytimeSession {
  start: Timestamp;
  end: Timestamp | null; // null if session is active
  duration_minutes: number;
}

// Local compliance state (stored in AsyncStorage, not Firestore)
export interface ComplianceState {
  ageGateCompleted: boolean;
  birthDate: string | null;
  isMinor: boolean;
  lastBreakReminderTime: number | null; // timestamp
  sessionStartTime: number | null; // timestamp
  currentSessionMinutes: number;
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
  current_streak: number;
  rank: number;
  level?: number;
  // Hyperstreak fields
  in_hyperstreak?: boolean;
  hyperstreak_count?: number;
  // Optional avatar
  avatar_emoji?: string;
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
  optionA: string;       // e.g. "MORNING"
  emojiA: string;        // e.g. "🌅"
  optionB: string;       // e.g. "NIGHT"
  emojiB: string;        // e.g. "🌙"
  spicyContext?: string; // e.g. "shower thoughts" - only shown in ShareCard
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
  // Streak tracking for loss aversion UI
  previousStreak: number; // The streak before this vote
  newStreak: number; // The streak after this vote
}

export interface CreateQuestionInput {
  optionA: string;
  emojiA: string;
  optionB: string;
  emojiB: string;
  spicyContext?: string;
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
