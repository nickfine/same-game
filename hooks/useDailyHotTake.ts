import { useState, useEffect, useCallback } from 'react';
import { 
  getTodaysHotTake, 
  getTodayDate, 
  getDailyHotTakeFromPool,
  didWinHotTake,
  type DailyHotTake,
} from '../lib/dailyHotTake';
import type { Question, VoteResult, VoteChoice } from '../types';

// ═══════════════════════════════════════════════════════════════
// DAILY HOT TAKE HOOK
// Manages hot take state and share prompts
// ═══════════════════════════════════════════════════════════════

interface UseDailyHotTakeReturn {
  // Today's hot take data
  hotTakeQuestion: typeof getDailyHotTakeFromPool extends () => infer R ? R : never;
  hotTakeQuestionId: string | null;
  
  // State checks
  isHotTake: (questionId: string) => boolean;
  loading: boolean;
  
  // After vote
  hotTakeResult: HotTakeVoteResult | null;
  showHotTakeShareModal: boolean;
  
  // Actions
  checkHotTakeResult: (result: VoteResult, userChoice: VoteChoice, questionId: string) => void;
  dismissShareModal: () => void;
  generateShareMessage: () => string;
}

interface HotTakeVoteResult {
  won: boolean;
  userChoice: VoteChoice;
  percentage_a: number;
  percentage_b: number;
  userPercent: number;
  optionA: string;
  optionB: string;
}

export function useDailyHotTake(): UseDailyHotTakeReturn {
  const [hotTakeQuestionId, setHotTakeQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotTakeResult, setHotTakeResult] = useState<HotTakeVoteResult | null>(null);
  const [showHotTakeShareModal, setShowHotTakeShareModal] = useState(false);
  
  // Get today's hot take from pool (deterministic)
  const hotTakeQuestion = getDailyHotTakeFromPool();
  
  // Fetch today's hot take ID from Firestore (if it exists)
  useEffect(() => {
    async function fetchHotTake() {
      try {
        const hotTake = await getTodaysHotTake();
        if (hotTake) {
          setHotTakeQuestionId(hotTake.question_id);
        }
      } catch (error) {
        console.error('Failed to fetch hot take:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHotTake();
  }, []);
  
  // Check if a question is today's hot take
  const isHotTake = useCallback((questionId: string): boolean => {
    return hotTakeQuestionId === questionId;
  }, [hotTakeQuestionId]);
  
  // Check the result of a hot take vote
  const checkHotTakeResult = useCallback((
    result: VoteResult,
    userChoice: VoteChoice,
    questionId: string
  ) => {
    // Only process if this is the hot take
    if (questionId !== hotTakeQuestionId) return;
    
    const won = didWinHotTake(userChoice, result.votes_a, result.votes_b);
    const userPercent = userChoice === 'a' ? result.percentage_a : result.percentage_b;
    
    setHotTakeResult({
      won,
      userChoice,
      percentage_a: result.percentage_a,
      percentage_b: result.percentage_b,
      userPercent,
      optionA: hotTakeQuestion.optionA,
      optionB: hotTakeQuestion.optionB,
    });
    
    // Show share modal if won
    if (won) {
      // Delay to let the reveal animation play
      setTimeout(() => {
        setShowHotTakeShareModal(true);
      }, 2500);
    }
  }, [hotTakeQuestionId, hotTakeQuestion]);
  
  // Dismiss share modal
  const dismissShareModal = useCallback(() => {
    setShowHotTakeShareModal(false);
    setHotTakeResult(null);
  }, []);
  
  // Generate share message
  const generateShareMessage = useCallback((): string => {
    if (!hotTakeResult) return '';
    
    const chosenOption = hotTakeResult.userChoice === 'a' 
      ? hotTakeQuestion.optionA 
      : hotTakeQuestion.optionB;
    
    const messages = [
      `I knew I was right! 🔥 ${hotTakeResult.userPercent}% of people agree: ${chosenOption} is the way. #same`,
      `Hot take confirmed ✅ ${hotTakeResult.userPercent}% picked ${chosenOption}. I'm literally psychic.`,
      `Called it! ${chosenOption} for life. ${hotTakeResult.userPercent}% of the world agrees with me 👑`,
      `Today's hot take: ${hotTakeQuestion.optionA} vs ${hotTakeQuestion.optionB}. I picked ${chosenOption} and WON 🏆`,
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }, [hotTakeResult, hotTakeQuestion]);
  
  return {
    hotTakeQuestion,
    hotTakeQuestionId,
    isHotTake,
    loading,
    hotTakeResult,
    showHotTakeShareModal,
    checkHotTakeResult,
    dismissShareModal,
    generateShareMessage,
  };
}


