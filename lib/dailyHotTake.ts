import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Question } from '../types';

// ═══════════════════════════════════════════════════════════════
// DAILY HOT TAKE SYSTEM
// One controversial question per day, same for all users
// ═══════════════════════════════════════════════════════════════

export interface DailyHotTake {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  question_id: string;
  question: Question;
  created_at: Timestamp;
}

// Collection reference
const dailyHotTakesCollection = collection(db, 'daily_hot_takes');

// Get today's date as ISO string
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════
// GET TODAY'S HOT TAKE
// ═══════════════════════════════════════════════════════════════
export async function getTodaysHotTake(): Promise<DailyHotTake | null> {
  const today = getTodayDate();
  const hotTakeRef = doc(dailyHotTakesCollection, today);
  
  const snapshot = await getDoc(hotTakeRef);
  
  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data() as Omit<DailyHotTake, 'id'>,
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// CHECK IF QUESTION IS TODAY'S HOT TAKE
// ═══════════════════════════════════════════════════════════════
export async function isHotTakeQuestion(questionId: string): Promise<boolean> {
  const hotTake = await getTodaysHotTake();
  return hotTake?.question_id === questionId;
}

// ═══════════════════════════════════════════════════════════════
// SEED HOT TAKE (Admin function - would normally be Cloud Function)
// ═══════════════════════════════════════════════════════════════
export async function seedDailyHotTake(question: Question): Promise<void> {
  const today = getTodayDate();
  const hotTakeRef = doc(dailyHotTakesCollection, today);
  
  await setDoc(hotTakeRef, {
    date: today,
    question_id: question.id,
    question: {
      id: question.id,
      optionA: question.optionA,
      optionB: question.optionB,
      emojiA: question.emojiA,
      emojiB: question.emojiB,
      spicyContext: question.spicyContext || 'Hot take of the day',
      votes_a: question.votes_a,
      votes_b: question.votes_b,
      created_at: question.created_at,
    },
    created_at: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════
// PRE-SEEDED HOT TAKES - Controversial questions to rotate
// In production, this would be managed via admin panel / Cloud Function
// ═══════════════════════════════════════════════════════════════
export const HOT_TAKE_POOL = [
  {
    optionA: 'MORNING',
    emojiA: '🌅',
    optionB: 'NIGHT',
    emojiB: '🌙',
    spicyContext: "The eternal battle",
  },
  {
    optionA: 'CATS',
    emojiA: '🐱',
    optionB: 'DOGS',
    emojiB: '🐕',
    spicyContext: "Choose your fighter",
  },
  {
    optionA: 'PINEAPPLE',
    emojiA: '🍕',
    optionB: 'NO PINEAPPLE',
    emojiB: '🚫',
    spicyContext: "On pizza",
  },
  {
    optionA: 'FOLD',
    emojiA: '📄',
    optionB: 'CRUMPLE',
    emojiB: '🧻',
    spicyContext: "Toilet paper debate",
  },
  {
    optionA: 'REPLY ALL',
    emojiA: '📧',
    optionB: 'NEVER REPLY',
    emojiB: '🔇',
    spicyContext: "Email etiquette",
  },
  {
    optionA: 'HOT COFFEE',
    emojiA: '☕',
    optionB: 'ICED COFFEE',
    emojiB: '🧊',
    spicyContext: "Year round debate",
  },
  {
    optionA: 'TEXT FIRST',
    emojiA: '📱',
    optionB: 'WAIT FOR THEM',
    emojiB: '⏳',
    spicyContext: "Crushing vibes",
  },
  {
    optionA: 'GIF',
    emojiA: '🖼️',
    optionB: 'JIF',
    emojiB: '🥜',
    spicyContext: "How do you say it?",
  },
  {
    optionA: 'CEREAL FIRST',
    emojiA: '🥣',
    optionB: 'MILK FIRST',
    emojiB: '🥛',
    spicyContext: "Breakfast order",
  },
  {
    optionA: 'WINDOWS',
    emojiA: '🪟',
    optionB: 'MAC',
    emojiB: '🍎',
    spicyContext: "Tech war",
  },
];

// ═══════════════════════════════════════════════════════════════
// GET A RANDOM HOT TAKE FROM POOL
// Deterministic based on date (same question for everyone on same day)
// ═══════════════════════════════════════════════════════════════
export function getDailyHotTakeFromPool(): typeof HOT_TAKE_POOL[0] {
  const today = getTodayDate();
  // Use date as seed for deterministic "random"
  const dateNum = parseInt(today.replace(/-/g, ''), 10);
  const index = dateNum % HOT_TAKE_POOL.length;
  return HOT_TAKE_POOL[index];
}

// ═══════════════════════════════════════════════════════════════
// CHECK IF USER WON THE HOT TAKE
// ═══════════════════════════════════════════════════════════════
export function didWinHotTake(
  userChoice: 'a' | 'b',
  votes_a: number,
  votes_b: number
): boolean {
  const majorityIsA = votes_a >= votes_b;
  return (majorityIsA && userChoice === 'a') || (!majorityIsA && userChoice === 'b');
}


