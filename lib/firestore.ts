import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  increment,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { STARTING_SCORE, QUESTION_CREATION_COST, DAILY_QUESTION_LIMIT, COMPLIANCE } from './constants';
import { getTodayDate } from './dateUtils';
import type { User, Question, Vote, VoteChoice, CreateQuestionInput, VoteResult, VoteHistoryItem, UserStats, LeaderboardEntry } from '../types';

// Collection references
export const usersCollection = collection(db, 'users');
export const questionsCollection = collection(db, 'questions');
export const votesCollection = collection(db, 'votes');

// User helpers
export const getUserRef = (uid: string) => doc(usersCollection, uid);
export const getQuestionRef = (id: string) => doc(questionsCollection, id);
export const getVoteRef = (uid: string, questionId: string) => doc(votesCollection, `${uid}_${questionId}`);

// Generate a random player name
function generatePlayerName(): string {
  const adjectives = ['Swift', 'Clever', 'Lucky', 'Bold', 'Wise', 'Quick', 'Sharp', 'Keen', 'Bright', 'Cool'];
  const nouns = ['Fox', 'Owl', 'Wolf', 'Bear', 'Eagle', 'Tiger', 'Hawk', 'Lion', 'Raven', 'Falcon'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

// Create or get user document
export async function getOrCreateUser(uid: string): Promise<User> {
  const userRef = getUserRef(uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return { 
      uid, 
      display_name: data.display_name ?? null,
      score: data.score ?? STARTING_SCORE,
      questions_created: data.questions_created ?? 0,
      questions_created_today: data.questions_created_today ?? 0,
      last_question_date: data.last_question_date ?? null,
      votes_cast: data.votes_cast ?? 0,
      votes_won: data.votes_won ?? 0,
      current_streak: data.current_streak ?? 0,
      best_streak: data.best_streak ?? 0,
      last_active: data.last_active ?? null,
      // Compliance fields
      birth_date: data.birth_date ?? null,
      is_minor: data.is_minor ?? true,
      age_verified_at: data.age_verified_at ?? null,
      votes_today: data.votes_today ?? 0,
      last_vote_date: data.last_vote_date ?? null,
      // Streak death tracking
      last_dead_streak: data.last_dead_streak ?? null,
      streak_death_date: data.streak_death_date ?? null,
    } as User;
  }
  
  // Create new user with starting points and random name
  const newUser: Omit<User, 'uid'> = {
    display_name: generatePlayerName(),
    score: STARTING_SCORE,
    questions_created: 0,
    questions_created_today: 0,
    last_question_date: null,
    votes_cast: 0,
    votes_won: 0,
    current_streak: 0,
    best_streak: 0,
    last_active: null,
    // Compliance fields - defaults
    birth_date: null,
    is_minor: true, // Assume minor until verified
    age_verified_at: null,
    votes_today: 0,
    last_vote_date: null,
    // Streak death tracking - defaults
    last_dead_streak: null,
    streak_death_date: null,
  };
  
  await setDoc(userRef, newUser);
  return { uid, ...newUser };
}

// Subscribe to user document for real-time score updates
export function subscribeToUser(uid: string, callback: (user: User | null) => void) {
  const userRef = getUserRef(uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({ 
        uid, 
        display_name: data.display_name ?? null,
        score: data.score ?? STARTING_SCORE,
        questions_created: data.questions_created ?? 0,
        questions_created_today: data.questions_created_today ?? 0,
        last_question_date: data.last_question_date ?? null,
        votes_cast: data.votes_cast ?? 0,
        votes_won: data.votes_won ?? 0,
        current_streak: data.current_streak ?? 0,
        best_streak: data.best_streak ?? 0,
        last_active: data.last_active ?? null,
        // Compliance fields
        birth_date: data.birth_date ?? null,
        is_minor: data.is_minor ?? true,
        age_verified_at: data.age_verified_at ?? null,
        votes_today: data.votes_today ?? 0,
        last_vote_date: data.last_vote_date ?? null,
        // Streak death tracking
        last_dead_streak: data.last_dead_streak ?? null,
        streak_death_date: data.streak_death_date ?? null,
      } as User);
    } else {
      callback(null);
    }
  });
}

// Get user stats
export function getUserStats(user: User): UserStats {
  const winRate = user.votes_cast > 0 
    ? Math.round((user.votes_won / user.votes_cast) * 100) 
    : 0;
  
  return {
    score: user.score,
    votes_cast: user.votes_cast,
    votes_won: user.votes_won,
    win_rate: winRate,
    questions_created: user.questions_created,
    current_streak: user.current_streak,
    best_streak: user.best_streak,
  };
}

// Get questions with pagination (cursor-based)
export async function getQuestions(
  uid: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ questions: Question[]; lastDoc: QueryDocumentSnapshot | null }> {
  // Get user's votes to filter out already voted questions
  const votesQuery = query(votesCollection, where('uid', '==', uid));
  const votesSnap = await getDocs(votesQuery);
  const votedQuestionIds = new Set(
    votesSnap.docs.map(d => d.data().question_id)
  );
  
  // Build questions query with pagination
  let questionsQuery = query(
    questionsCollection,
    orderBy('created_at', 'desc'),
    limit(pageSize * 2) // Fetch more to account for filtering
  );
  
  if (lastDoc) {
    questionsQuery = query(
      questionsCollection,
      orderBy('created_at', 'desc'),
      startAfter(lastDoc),
      limit(pageSize * 2)
    );
  }
  
  const questionsSnap = await getDocs(questionsQuery);
  
  // Filter out voted questions
  const questions: Question[] = [];
  let newLastDoc: QueryDocumentSnapshot | null = null;
  
  for (const docSnap of questionsSnap.docs) {
    if (!votedQuestionIds.has(docSnap.id) && questions.length < pageSize) {
      questions.push({ id: docSnap.id, ...docSnap.data() } as Question);
    }
    newLastDoc = docSnap;
  }
  
  return { questions, lastDoc: newLastDoc };
}

// Vote on a question with transaction (prevents cheating)
export async function voteOnQuestion(
  uid: string,
  questionId: string,
  choice: VoteChoice
): Promise<VoteResult> {
  const userRef = getUserRef(uid);
  const questionRef = getQuestionRef(questionId);
  const voteRef = getVoteRef(uid, questionId);
  
  return await runTransaction(db, async (transaction) => {
    // Read all documents first
    const [userDoc, questionDoc, voteDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(questionRef),
      transaction.get(voteRef),
    ]);
    
    // Check if already voted
    if (voteDoc.exists()) {
      throw new Error('Already voted on this question');
    }
    
    if (!questionDoc.exists()) {
      throw new Error('Question not found');
    }
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const question = questionDoc.data() as Omit<Question, 'id'>;
    const userData = userDoc.data() as Omit<User, 'uid'>;
    
    // Check daily vote limit for minors
    const today = getTodayDate();
    const isNewDay = userData.last_vote_date !== today;
    const currentVotesToday = isNewDay ? 0 : (userData.votes_today ?? 0);
    const dailyVoteCap = userData.is_minor ? COMPLIANCE.DAILY_VOTE_CAP_MINOR : COMPLIANCE.DAILY_VOTE_CAP_ADULT;
    
    if (currentVotesToday >= dailyVoteCap) {
      throw new Error('DAILY_LIMIT_REACHED');
    }
    
    const currentA = question.votes_a;
    const currentB = question.votes_b;
    
    // Calculate win/loss based on what counts WILL be after vote
    // Using strict > (not >=) to handle ties correctly - "first to break tie wins"
    let userWins: boolean;
    if (choice === 'a') {
      userWins = (currentA + 1) > currentB;
    } else {
      userWins = (currentB + 1) > currentA;
    }
    
    // Calculate new vote counts
    const newVotesA = choice === 'a' ? currentA + 1 : currentA;
    const newVotesB = choice === 'b' ? currentB + 1 : currentB;
    const totalVotes = newVotesA + newVotesB;
    
    // Update question vote count
    transaction.update(questionRef, {
      [choice === 'a' ? 'votes_a' : 'votes_b']: increment(1),
    });
    
    // Calculate new streak
    const currentStreak = userData.current_streak ?? 0;
    const bestStreak = userData.best_streak ?? 0;
    const newStreak = userWins ? currentStreak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    
    // Update user stats
    const userUpdate: Record<string, any> = {
      votes_cast: increment(1),
      current_streak: newStreak,
      best_streak: newBestStreak,
      last_active: serverTimestamp(),
      // Daily vote tracking
      votes_today: isNewDay ? 1 : increment(1),
      last_vote_date: today,
    };
    
    if (userWins) {
      userUpdate.score = increment(1);
      userUpdate.votes_won = increment(1);
    }
    
    transaction.update(userRef, userUpdate);
    
    // Create vote document to prevent duplicate voting
    const vote: Omit<Vote, 'id'> = {
      uid,
      question_id: questionId,
      choice,
      won: userWins,
      created_at: serverTimestamp() as Timestamp,
    };
    transaction.set(voteRef, vote);
    
    return {
      won: userWins,
      choice,
      votes_a: newVotesA,
      votes_b: newVotesB,
      percentage_a: Math.round((newVotesA / totalVotes) * 100),
      percentage_b: Math.round((newVotesB / totalVotes) * 100),
      // Streak tracking for loss aversion UI
      previousStreak: currentStreak,
      newStreak: newStreak,
    };
  });
}

// Create question with transaction (check score >= 3, deduct, create, auto-vote)
export async function createQuestion(
  uid: string,
  input: CreateQuestionInput
): Promise<Question> {
  const userRef = getUserRef(uid);
  const newQuestionRef = doc(questionsCollection);
  const voteRef = getVoteRef(uid, newQuestionRef.id);
  
  const today = new Date().toISOString().split('T')[0];
  
  return await runTransaction(db, async (transaction) => {
    // Read user document
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as Omit<User, 'uid'>;
    
    // Check score
    if (userData.score < QUESTION_CREATION_COST) {
      throw new Error(`Need ${QUESTION_CREATION_COST} points to ask a question`);
    }
    
    // Check daily limit
    let questionsToday = userData.questions_created_today ?? 0;
    if (userData.last_question_date !== today) {
      // Reset daily counter
      questionsToday = 0;
    }
    
    if (questionsToday >= DAILY_QUESTION_LIMIT) {
      throw new Error(`Daily limit reached. You can only create ${DAILY_QUESTION_LIMIT} questions per day.`);
    }
    
    // Create the question with initial vote
    const question: Omit<Question, 'id'> = {
      text: input.text,
      option_a: input.option_a,
      option_b: input.option_b,
      votes_a: input.initial_vote === 'a' ? 1 : 0,
      votes_b: input.initial_vote === 'b' ? 1 : 0,
      created_at: serverTimestamp() as Timestamp,
      creator_uid: uid,
    };
    
    transaction.set(newQuestionRef, question);
    
    // Create vote document for creator (doesn't count as win/loss)
    const vote: Omit<Vote, 'id'> = {
      uid,
      question_id: newQuestionRef.id,
      choice: input.initial_vote,
      won: true, // Creator always "wins" their own question's first vote
      created_at: serverTimestamp() as Timestamp,
    };
    transaction.set(voteRef, vote);
    
    // Deduct points and update counters
    transaction.update(userRef, {
      score: increment(-QUESTION_CREATION_COST),
      questions_created: increment(1),
      questions_created_today: questionsToday + 1,
      last_question_date: today,
      last_active: serverTimestamp(),
    });
    
    return {
      id: newQuestionRef.id,
      ...question,
    };
  });
}

// Get user's vote history with questions
export async function getVoteHistory(
  uid: string,
  pageSize: number = 20
): Promise<VoteHistoryItem[]> {
  const votesQuery = query(
    votesCollection,
    where('uid', '==', uid),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );
  
  const votesSnap = await getDocs(votesQuery);
  const history: VoteHistoryItem[] = [];
  
  for (const voteDoc of votesSnap.docs) {
    const voteData = voteDoc.data();
    const questionRef = getQuestionRef(voteData.question_id);
    const questionSnap = await getDoc(questionRef);
    
    if (questionSnap.exists()) {
      history.push({
        vote: { id: voteDoc.id, ...voteData } as Vote,
        question: { id: questionSnap.id, ...questionSnap.data() } as Question,
      });
    }
  }
  
  return history;
}

// Get questions created by user
export async function getUserQuestions(
  uid: string,
  pageSize: number = 20
): Promise<Question[]> {
  const questionsQuery = query(
    questionsCollection,
    where('creator_uid', '==', uid),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );
  
  const questionsSnap = await getDocs(questionsQuery);
  return questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
}

// Check if user has voted on a question
export async function hasVoted(uid: string, questionId: string): Promise<boolean> {
  const voteRef = getVoteRef(uid, questionId);
  const voteSnap = await getDoc(voteRef);
  return voteSnap.exists();
}

// Get leaderboard (top users by score)
export async function getLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
  const leaderboardQuery = query(
    usersCollection,
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(leaderboardQuery);
  
  return snapshot.docs.map((doc, index) => {
    const data = doc.data();
    const votesCast = data.votes_cast ?? 0;
    const votesWon = data.votes_won ?? 0;
    const winRate = votesCast > 0 ? Math.round((votesWon / votesCast) * 100) : 0;
    
    return {
      uid: doc.id,
      display_name: data.display_name || `Player${doc.id.slice(-4)}`,
      score: data.score ?? 0,
      votes_won: votesWon,
      votes_cast: votesCast,
      win_rate: winRate,
      best_streak: data.best_streak ?? 0,
      rank: index + 1,
    };
  });
}

// Get user's rank on leaderboard
export async function getUserRank(uid: string): Promise<number | null> {
  const userRef = getUserRef(uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  
  const userScore = userSnap.data().score ?? 0;
  
  // Count users with higher score
  const higherScoreQuery = query(
    usersCollection,
    where('score', '>', userScore)
  );
  
  const higherSnap = await getDocs(higherScoreQuery);
  return higherSnap.size + 1;
}

// Update user's display name
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const userRef = getUserRef(uid);
  await setDoc(userRef, { display_name: displayName }, { merge: true });
}

// Update user's compliance/age verification info
export async function updateUserCompliance(
  uid: string, 
  birthDate: string, 
  isMinor: boolean
): Promise<void> {
  const userRef = getUserRef(uid);
  await setDoc(userRef, { 
    birth_date: birthDate,
    is_minor: isMinor,
    age_verified_at: serverTimestamp(),
  }, { merge: true });
}

// Get user's remaining daily votes
export function getUserRemainingVotes(user: User): number {
  const today = getTodayDate();
  const isNewDay = user.last_vote_date !== today;
  const votesToday = isNewDay ? 0 : (user.votes_today ?? 0);
  const dailyCap = user.is_minor ? COMPLIANCE.DAILY_VOTE_CAP_MINOR : COMPLIANCE.DAILY_VOTE_CAP_ADULT;
  return Math.max(0, dailyCap - votesToday);
}

// Check if user can vote (hasn't hit daily limit)
export function canUserVote(user: User): boolean {
  return getUserRemainingVotes(user) > 0;
}

// Deduct points from user score (for power-up purchases)
export async function deductUserScore(uid: string, amount: number): Promise<void> {
  const userRef = getUserRef(uid);
  
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentScore = userData.score ?? 0;
    
    if (currentScore < amount) {
      throw new Error('Insufficient points');
    }
    
    transaction.update(userRef, {
      score: increment(-amount),
      last_active: serverTimestamp(),
    });
  });
}

// Add points to user score (for rewards from chests/spin)
export async function addUserScore(uid: string, amount: number): Promise<void> {
  const userRef = getUserRef(uid);
  
  await setDoc(userRef, {
    score: increment(amount),
    last_active: serverTimestamp(),
  }, { merge: true });
}
