/**
 * SAME Game Cloud Functions
 * Anti-cheat server-side economy operations
 * 
 * All point/power-up/reward operations go through these functions
 * to prevent client-side manipulation.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// ============================================================================
// HYPERSTREAK ANTI-CHEAT TRIGGERS
// Import and re-export hyperstreak validation functions
// ============================================================================
export {
  onHyperstreakUpdate,
  onHyperstreakActivation,
  onHyperQuestionsUpdate,
} from "./hyperstreak.validate";

const db = admin.firestore();

// ============================================================================
// CONSTANTS (must match client-side constants)
// ============================================================================

const POWER_UP_COSTS = {
  PEEK: 4,
  SKIP: 1,
  DOUBLE_DOWN: 3,
} as const;

const COMPLIANCE = {
  DAILY_VOTE_CAP_MINOR: 50,
  DAILY_VOTE_CAP_ADULT: 999999,
} as const;

// Combo multiplier thresholds
const COMBO_THRESHOLDS = [
  { streak: 3, multiplier: 1.5 },
  { streak: 5, multiplier: 2.0 },
  { streak: 7, multiplier: 2.5 },
  { streak: 10, multiplier: 3.0 },
];

// ============================================================================
// TYPES
// ============================================================================

type VoteChoice = "a" | "b";
type PowerUpType = "peek" | "skip" | "double_down" | "streak_freeze";
type RewardType = "points" | "multiplier" | "streak_freeze" | "peek" | 
                  "skip" | "double_down" | "nothing";

interface Reward {
  type: RewardType;
  value: number;
}

interface UserData {
  score: number;
  votes_cast: number;
  votes_won: number;
  current_streak: number;
  best_streak: number;
  is_minor: boolean;
  votes_today: number;
  last_vote_date: string | null;
  last_dead_streak: number | null;
  streak_death_date: string | null;
}

interface QuestionData {
  votes_a: number;
  votes_b: number;
}

interface DopamineState {
  powerUps: {
    streak_freeze: number;
    peek: number;
    skip: number;
    double_down: number;
  };
  activeMultiplier: number;
  multiplierVotesRemaining: number;
  doubleDownActive: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getComboMultiplier(streak: number): number {
  let multiplier = 1;
  for (const threshold of COMBO_THRESHOLDS) {
    if (streak >= threshold.streak) {
      multiplier = threshold.multiplier;
    }
  }
  return multiplier;
}

// ============================================================================
// VOTE FUNCTION
// ============================================================================

interface CastVoteRequest {
  questionId: string;
  choice: VoteChoice;
  doubleDownActive?: boolean;
  activeMultiplier?: number;
}

interface CastVoteResponse {
  success: boolean;
  won: boolean;
  votes_a: number;
  votes_b: number;
  percentage_a: number;
  percentage_b: number;
  previousStreak: number;
  newStreak: number;
  pointsEarned: number;
  error?: string;
}

export const castVote = functions.https.onCall(
  async (request): Promise<CastVoteResponse> => {
    const { auth, data } = request;
    
    // Verify authentication
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = auth.uid;
    const { questionId, choice, doubleDownActive, activeMultiplier } = 
      data as CastVoteRequest;

    // Validate input
    if (!questionId || !choice || !["a", "b"].includes(choice)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid question ID or choice"
      );
    }

    const userRef = db.collection("users").doc(uid);
    const questionRef = db.collection("questions").doc(questionId);
    const voteRef = db.collection("votes").doc(`${uid}_${questionId}`);

    try {
      const result = await db.runTransaction(async (transaction) => {
        // Read all documents
        const [userDoc, questionDoc, voteDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(questionRef),
          transaction.get(voteRef),
        ]);

        // Check if already voted
        if (voteDoc.exists) {
          throw new functions.https.HttpsError(
            "already-exists",
            "Already voted on this question"
          );
        }

        if (!questionDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Question not found"
          );
        }

        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "User not found"
          );
        }

        const userData = userDoc.data() as UserData;
        const questionData = questionDoc.data() as QuestionData;

        // Check daily vote limit
        const today = getTodayDate();
        const isNewDay = userData.last_vote_date !== today;
        const currentVotesToday = isNewDay ? 0 : (userData.votes_today ?? 0);
        const dailyCap = userData.is_minor
          ? COMPLIANCE.DAILY_VOTE_CAP_MINOR
          : COMPLIANCE.DAILY_VOTE_CAP_ADULT;

        if (currentVotesToday >= dailyCap) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "Daily vote limit reached"
          );
        }

        // Calculate win/loss
        const currentA = questionData.votes_a;
        const currentB = questionData.votes_b;
        let userWins: boolean;
        if (choice === "a") {
          userWins = currentA + 1 > currentB;
        } else {
          userWins = currentB + 1 > currentA;
        }

        // Calculate new vote counts
        const newVotesA = choice === "a" ? currentA + 1 : currentA;
        const newVotesB = choice === "b" ? currentB + 1 : currentB;
        const totalVotes = newVotesA + newVotesB;

        // Calculate streak
        const currentStreak = userData.current_streak ?? 0;
        const bestStreak = userData.best_streak ?? 0;
        const newStreak = userWins ? currentStreak + 1 : 0;
        const newBestStreak = Math.max(bestStreak, newStreak);

        // Calculate points with multipliers
        let pointsEarned = 0;
        if (userWins) {
          pointsEarned = 1;

          // Apply combo multiplier from streak
          const comboMultiplier = getComboMultiplier(newStreak);
          pointsEarned = Math.floor(pointsEarned * comboMultiplier);

          // Apply active multiplier (from spin/chest rewards)
          if (activeMultiplier && activeMultiplier > 1) {
            pointsEarned = Math.floor(pointsEarned * activeMultiplier);
          }

          // Apply double down (2x)
          if (doubleDownActive) {
            pointsEarned *= 2;
          }
        } else if (doubleDownActive) {
          // Double down on a loss = lose points (but minimum 0)
          pointsEarned = -2;
        }

        // Update question
        transaction.update(questionRef, {
          [choice === "a" ? "votes_a" : "votes_b"]: 
            admin.firestore.FieldValue.increment(1),
        });

        // Update user
        const userUpdate: Record<string, unknown> = {
          votes_cast: admin.firestore.FieldValue.increment(1),
          current_streak: newStreak,
          best_streak: newBestStreak,
          last_active: admin.firestore.FieldValue.serverTimestamp(),
          votes_today: isNewDay ? 1 : admin.firestore.FieldValue.increment(1),
          last_vote_date: today,
        };

        if (pointsEarned !== 0) {
          userUpdate.score = admin.firestore.FieldValue.increment(pointsEarned);
        }
        if (userWins) {
          userUpdate.votes_won = admin.firestore.FieldValue.increment(1);
        }

        transaction.update(userRef, userUpdate);

        // Create vote document
        transaction.set(voteRef, {
          uid,
          question_id: questionId,
          choice,
          won: userWins,
          points_earned: pointsEarned,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          won: userWins,
          votes_a: newVotesA,
          votes_b: newVotesB,
          percentage_a: Math.round((newVotesA / totalVotes) * 100),
          percentage_b: Math.round((newVotesB / totalVotes) * 100),
          previousStreak: currentStreak,
          newStreak,
          pointsEarned,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Vote error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to process vote"
      );
    }
  }
);

// ============================================================================
// POWER-UP FUNCTIONS
// ============================================================================

interface UsePowerUpRequest {
  powerUpType: PowerUpType;
  dopamineState: DopamineState;
}

interface UsePowerUpResponse {
  success: boolean;
  cost: number;
  newScore?: number;
  newDopamineState: DopamineState;
  error?: string;
}

export const usePowerUp = functions.https.onCall(
  async (request): Promise<UsePowerUpResponse> => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = auth.uid;
    const { powerUpType, dopamineState } = data as UsePowerUpRequest;

    if (!powerUpType || !dopamineState) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing power-up type or state"
      );
    }

    const userRef = db.collection("users").doc(uid);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new functions.https.HttpsError("not-found", "User not found");
        }

        const userData = userDoc.data() as UserData;
        const newDopamineState = { ...dopamineState };
        let cost = 0;

        // Check inventory first
        const inventoryKey = powerUpType as keyof DopamineState["powerUps"];
        const hasInInventory = dopamineState.powerUps[inventoryKey] > 0;

        if (hasInInventory) {
          // Use from inventory (free)
          newDopamineState.powerUps = {
            ...dopamineState.powerUps,
            [inventoryKey]: dopamineState.powerUps[inventoryKey] - 1,
          };
        } else {
          // Calculate cost for purchasable power-ups
          // NOTE: streak_freeze is NOT purchasable with points - it can only be
          // obtained from Mystery Chests or Daily Spin rewards. If a user tries
          // to use streak_freeze without inventory, they should use the dedicated
          // useStreakFreeze function instead.
          switch (powerUpType) {
            case "peek":
              cost = POWER_UP_COSTS.PEEK;
              break;
            case "skip":
              cost = POWER_UP_COSTS.SKIP;
              break;
            case "double_down":
              cost = POWER_UP_COSTS.DOUBLE_DOWN;
              break;
            case "streak_freeze":
              // Streak freeze cannot be purchased - only obtained from rewards
              throw new functions.https.HttpsError(
                "failed-precondition",
                "Streak freeze must be earned from rewards, not purchased"
              );
            default:
              throw new functions.https.HttpsError(
                "invalid-argument",
                "Invalid power-up type"
              );
          }

          // Check if user can afford
          if (userData.score < cost) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              "Insufficient points"
            );
          }

          // Deduct points
          transaction.update(userRef, {
            score: admin.firestore.FieldValue.increment(-cost),
            last_active: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Apply power-up effect
        if (powerUpType === "double_down") {
          newDopamineState.doubleDownActive = true;
        }

        return {
          success: true,
          cost,
          newScore: hasInInventory ? userData.score : userData.score - cost,
          newDopamineState,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Power-up error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to use power-up"
      );
    }
  }
);

// ============================================================================
// REWARD CLAIMING FUNCTION
// ============================================================================

interface ClaimRewardRequest {
  reward: Reward;
  source: "chest" | "spin";
  dopamineState: DopamineState;
  currentVoteCount?: number;
}

interface ClaimRewardResponse {
  success: boolean;
  newScore?: number;
  newDopamineState: DopamineState;
}

export const claimReward = functions.https.onCall(
  async (request): Promise<ClaimRewardResponse> => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = auth.uid;
    const { reward, source, dopamineState, currentVoteCount } = 
      data as ClaimRewardRequest;

    if (!reward || !source || !dopamineState) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing reward data"
      );
    }

    const userRef = db.collection("users").doc(uid);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new functions.https.HttpsError("not-found", "User not found");
        }

        const userData = userDoc.data() as UserData;
        const newDopamineState = { ...dopamineState };
        let newScore = userData.score;

        // Apply reward based on type
        switch (reward.type) {
          case "points":
            newScore += reward.value;
            transaction.update(userRef, {
              score: admin.firestore.FieldValue.increment(reward.value),
              last_active: admin.firestore.FieldValue.serverTimestamp(),
            });
            break;

          case "multiplier":
            newDopamineState.activeMultiplier = reward.value;
            newDopamineState.multiplierVotesRemaining = 3;
            break;

          case "streak_freeze":
            newDopamineState.powerUps = {
              ...newDopamineState.powerUps,
              streak_freeze: newDopamineState.powerUps.streak_freeze + 
                             reward.value,
            };
            break;

          case "peek":
            newDopamineState.powerUps = {
              ...newDopamineState.powerUps,
              peek: newDopamineState.powerUps.peek + reward.value,
            };
            break;

          case "skip":
            newDopamineState.powerUps = {
              ...newDopamineState.powerUps,
              skip: newDopamineState.powerUps.skip + reward.value,
            };
            break;

          case "double_down":
            newDopamineState.powerUps = {
              ...newDopamineState.powerUps,
              double_down: newDopamineState.powerUps.double_down + reward.value,
            };
            break;

          case "nothing":
            // No reward
            break;
        }

        // Log the reward claim for analytics
        const rewardLogRef = db.collection("reward_logs").doc();
        transaction.set(rewardLogRef, {
          uid,
          reward_type: reward.type,
          reward_value: reward.value,
          source,
          vote_count: currentVoteCount,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          newScore,
          newDopamineState,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Reward claim error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to claim reward"
      );
    }
  }
);

// ============================================================================
// STREAK FREEZE FUNCTION
// ============================================================================

interface UseStreakFreezeRequest {
  deadStreak: number;
  dopamineState: DopamineState;
}

interface UseStreakFreezeResponse {
  success: boolean;
  restoredStreak: number;
  newDopamineState: DopamineState;
}

export const useStreakFreeze = functions.https.onCall(
  async (request): Promise<UseStreakFreezeResponse> => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = auth.uid;
    const { deadStreak, dopamineState } = data as UseStreakFreezeRequest;

    if (deadStreak === undefined || !dopamineState) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing streak data"
      );
    }

    // Check if user has a streak freeze
    if (dopamineState.powerUps.streak_freeze <= 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "No streak freeze available"
      );
    }

    const userRef = db.collection("users").doc(uid);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new functions.https.HttpsError("not-found", "User not found");
        }

        // Restore the streak
        transaction.update(userRef, {
          current_streak: deadStreak,
          last_active: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Consume the streak freeze
        const newDopamineState = {
          ...dopamineState,
          powerUps: {
            ...dopamineState.powerUps,
            streak_freeze: dopamineState.powerUps.streak_freeze - 1,
          },
        };

        // Log the usage
        const logRef = db.collection("streak_freeze_logs").doc();
        transaction.set(logRef, {
          uid,
          restored_streak: deadStreak,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          restoredStreak: deadStreak,
          newDopamineState,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Streak freeze error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to use streak freeze"
      );
    }
  }
);

// ============================================================================
// SKIP QUESTION FUNCTION (specific handling for skip)
// ============================================================================

interface SkipQuestionRequest {
  questionId: string;
  dopamineState: DopamineState;
}

interface SkipQuestionResponse {
  success: boolean;
  cost: number;
  newDopamineState: DopamineState;
}

export const skipQuestion = functions.https.onCall(
  async (request): Promise<SkipQuestionResponse> => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = auth.uid;
    const { questionId, dopamineState } = data as SkipQuestionRequest;

    if (!questionId || !dopamineState) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing question ID or state"
      );
    }

    const userRef = db.collection("users").doc(uid);
    const skipRef = db.collection("skips").doc(`${uid}_${questionId}`);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const [userDoc, skipDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(skipRef),
        ]);

        if (!userDoc.exists) {
          throw new functions.https.HttpsError("not-found", "User not found");
        }

        // Check if already skipped
        if (skipDoc.exists) {
          throw new functions.https.HttpsError(
            "already-exists",
            "Already skipped this question"
          );
        }

        const userData = userDoc.data() as UserData;
        const newDopamineState = { ...dopamineState };
        let cost = 0;

        // Check inventory first
        const hasSkipInInventory = dopamineState.powerUps.skip > 0;

        if (hasSkipInInventory) {
          newDopamineState.powerUps = {
            ...dopamineState.powerUps,
            skip: dopamineState.powerUps.skip - 1,
          };
        } else {
          cost = POWER_UP_COSTS.SKIP;

          if (userData.score < cost) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              "Insufficient points"
            );
          }

          transaction.update(userRef, {
            score: admin.firestore.FieldValue.increment(-cost),
            last_active: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Record the skip (so user can't vote on it later either)
        transaction.set(skipRef, {
          uid,
          question_id: questionId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          cost,
          newDopamineState,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Skip error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to skip question"
      );
    }
  }
);

// ============================================================================
// DAILY SPIN VALIDATION
// ============================================================================

interface ValidateSpinRequest {
  lastSpinDate: string | null;
}

interface ValidateSpinResponse {
  canSpin: boolean;
  today: string;
}

export const validateDailySpin = functions.https.onCall(
  async (request): Promise<ValidateSpinResponse> => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { lastSpinDate } = data as ValidateSpinRequest;
    const today = getTodayDate();

    return {
      canSpin: lastSpinDate !== today,
      today,
    };
  }
);




