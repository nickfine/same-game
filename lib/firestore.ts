import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
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
import type { User, Question, Vote, VoteChoice, CreateQuestionInput, VoteResult, VoteHistoryItem, UserStats } from '../types';

// Collection references
export const usersCollection = collection(db, 'users');
export const questionsCollection = collection(db, 'questions');
export const votesCollection = collection(db, 'votes');

// User helpers
export const getUserRef = (uid: string) => doc(usersCollection, uid);
export const getQuestionRef = (id: string) => doc(questionsCollection, id);
export const getVoteRef = (uid: string, questionId: string) => doc(votesCollection, `${uid}_${questionId}`);

// Create or get user document
export async function getOrCreateUser(uid: string): Promise<User> {
  const userRef = getUserRef(uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return { 
      uid, 
      score: data.score ?? 3,
      questions_created: data.questions_created ?? 0,
      questions_created_today: data.questions_created_today ?? 0,
      last_question_date: data.last_question_date ?? null,
      votes_cast: data.votes_cast ?? 0,
      votes_won: data.votes_won ?? 0,
      current_streak: data.current_streak ?? 0,
      best_streak: data.best_streak ?? 0,
      last_active: data.last_active ?? null,
    } as User;
  }
  
  // Create new user with 3 starting points
  const newUser: Omit<User, 'uid'> = {
    score: 3,
    questions_created: 0,
    questions_created_today: 0,
    last_question_date: null,
    votes_cast: 0,
    votes_won: 0,
    current_streak: 0,
    best_streak: 0,
    last_active: null,
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
        score: data.score ?? 3,
        questions_created: data.questions_created ?? 0,
        questions_created_today: data.questions_created_today ?? 0,
        last_question_date: data.last_question_date ?? null,
        votes_cast: data.votes_cast ?? 0,
        votes_won: data.votes_won ?? 0,
        current_streak: data.current_streak ?? 0,
        best_streak: data.best_streak ?? 0,
        last_active: data.last_active ?? null,
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
  const DAILY_LIMIT = 5;
  const CREATION_COST = 3;
  
  return await runTransaction(db, async (transaction) => {
    // Read user document
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as Omit<User, 'uid'>;
    
    // Check score
    if (userData.score < CREATION_COST) {
      throw new Error(`Need ${CREATION_COST} points to ask a question`);
    }
    
    // Check daily limit
    let questionsToday = userData.questions_created_today ?? 0;
    if (userData.last_question_date !== today) {
      // Reset daily counter
      questionsToday = 0;
    }
    
    if (questionsToday >= DAILY_LIMIT) {
      throw new Error(`Daily limit reached. You can only create ${DAILY_LIMIT} questions per day.`);
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
      score: increment(-CREATION_COST),
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
