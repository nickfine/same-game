// ═══════════════════════════════════════════════════════════════
// HYPERSTREAK LOGIC - Pure dopamine engineering
// "10 corrects → HYPERSTREAK (2x coins/XP/powerups)"
// ═══════════════════════════════════════════════════════════════

export const HYPER = {
  BAR_MAX: 5,               // 5 correct answers to trigger hyperstreak
  DURATION_QUESTIONS: 5,    // Hyperstreak lasts for 5 questions
  MULTIPLIER: 2,            // 2x all rewards during hyperstreak
  FREEZE_CAPACITY_BONUS: 1, // +1 streak freeze capacity during hyper
  
  // Visual thresholds
  PULSE_THRESHOLD: 4,       // Start pulsing animation at 4+ bar (80% of max)
  
  // Animation timing (ms)
  ACTIVATION_DURATION: 1200,
  CRASH_DURATION: 1000,
  
  // Colors
  COLOR_CHARGING: '#6E0CFF',  // Violet while filling
  COLOR_ACTIVE: '#00FFBD',    // Emerald when active
  COLOR_CRASH: '#FF3B6E',     // Coral on crash
} as const;

export interface HyperstreakState {
  hyper_bar: number;
  in_hyperstreak: boolean;
  questions_in_hyper: number;
  hyperstreak_count: number;
}

export const DEFAULT_HYPERSTREAK_STATE: HyperstreakState = {
  hyper_bar: 0,
  in_hyperstreak: false,
  questions_in_hyper: 0,
  hyperstreak_count: 0,
};

/**
 * Calculate progress percentage for the hyper bar ring
 * @returns 0-1 float representing fill percentage
 */
export function calculateHyperProgress(hyper_bar: number): number {
  return Math.min(1, Math.max(0, hyper_bar / HYPER.BAR_MAX));
}

/**
 * Check if hyperstreak should activate
 * Triggers when bar reaches max AND not already in hyperstreak
 */
export function shouldActivateHyperstreak(
  hyper_bar: number,
  in_hyperstreak: boolean
): boolean {
  return hyper_bar >= HYPER.BAR_MAX && !in_hyperstreak;
}

/**
 * Check if hyperstreak should end
 * Ends after DURATION_QUESTIONS correct answers OR on wrong answer
 */
export function shouldEndHyperstreak(
  questions_in_hyper: number,
  wasCorrect: boolean
): boolean {
  if (!wasCorrect) return true;
  return questions_in_hyper >= HYPER.DURATION_QUESTIONS;
}

/**
 * Calculate state after a correct answer
 */
export function onCorrectAnswer(state: HyperstreakState): {
  newState: HyperstreakState;
  shouldActivate: boolean;
  shouldEnd: boolean;
} {
  if (state.in_hyperstreak) {
    // In hyperstreak - tick question count
    const newQuestionsInHyper = state.questions_in_hyper + 1;
    const shouldEnd = newQuestionsInHyper >= HYPER.DURATION_QUESTIONS;
    
    return {
      newState: {
        ...state,
        questions_in_hyper: newQuestionsInHyper,
        // If ending naturally (5 questions), reset bar to 0
        hyper_bar: shouldEnd ? 0 : state.hyper_bar,
        in_hyperstreak: shouldEnd ? false : true,
      },
      shouldActivate: false,
      shouldEnd,
    };
  } else {
    // Not in hyperstreak - increment bar
    const newBar = Math.min(HYPER.BAR_MAX, state.hyper_bar + 1);
    const shouldActivate = newBar >= HYPER.BAR_MAX;
    
    return {
      newState: {
        ...state,
        hyper_bar: shouldActivate ? 0 : newBar, // Reset to 0 when activating
        in_hyperstreak: shouldActivate,
        questions_in_hyper: shouldActivate ? 0 : 0,
        hyperstreak_count: shouldActivate 
          ? state.hyperstreak_count + 1 
          : state.hyperstreak_count,
      },
      shouldActivate,
      shouldEnd: false,
    };
  }
}

/**
 * Calculate state after a wrong answer
 */
export function onWrongAnswer(state: HyperstreakState): {
  newState: HyperstreakState;
  wasCrash: boolean;
} {
  const wasCrash = state.in_hyperstreak;
  
  return {
    newState: {
      ...state,
      hyper_bar: 0, // Always reset bar on wrong
      in_hyperstreak: false,
      questions_in_hyper: 0,
    },
    wasCrash,
  };
}

/**
 * Get effective multiplier for rewards
 */
export function getHyperMultiplier(in_hyperstreak: boolean): number {
  return in_hyperstreak ? HYPER.MULTIPLIER : 1;
}

/**
 * Get effective streak freeze capacity
 */
export function getStreakFreezeCapacity(in_hyperstreak: boolean): number {
  return in_hyperstreak ? 1 + HYPER.FREEZE_CAPACITY_BONUS : 1;
}

/**
 * Check if bar should pulse (visual threshold)
 */
export function shouldPulse(hyper_bar: number, in_hyperstreak: boolean): boolean {
  return !in_hyperstreak && hyper_bar >= HYPER.PULSE_THRESHOLD;
}

/**
 * Get ring color based on state
 */
export function getRingColor(in_hyperstreak: boolean): string {
  return in_hyperstreak ? HYPER.COLOR_ACTIVE : HYPER.COLOR_CHARGING;
}

