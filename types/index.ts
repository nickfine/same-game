import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
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
