/**
 * Seed script to populate Firestore with initial questions
 * Uses Firebase Client SDK with Anonymous Auth
 * 
 * NEW FORMAT: Emoji-first questions with no question text
 * 
 * Usage: npx ts-node --transpile-only scripts/seed.ts
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  query,
  limit,
  serverTimestamp,
} = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
if (!firebaseConfig.projectId) {
  console.error('❌ Firebase Project ID not found!');
  console.error('Please set EXPO_PUBLIC_FIREBASE_PROJECT_ID in your .env file');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ═══════════════════════════════════════════════════════════════
// 50 EMOJI-FIRST QUESTIONS - Pure visual cocaine
// Format: { optionA, emojiA, optionB, emojiB, spicyContext }
// ═══════════════════════════════════════════════════════════════
const seedQuestions = [
  // TIME & LIFESTYLE
  { optionA: "MORNING", emojiA: "🌅", optionB: "NIGHT", emojiB: "🌙", spicyContext: "shower thoughts" },
  { optionA: "EARLY", emojiA: "⏰", optionB: "LATE", emojiB: "🦉", spicyContext: "sleep schedule" },
  { optionA: "WEEKDAY", emojiA: "💼", optionB: "WEEKEND", emojiB: "🎉", spicyContext: "vibes" },
  { optionA: "SUMMER", emojiA: "☀️", optionB: "WINTER", emojiB: "❄️", spicyContext: "seasons" },
  { optionA: "CITY", emojiA: "🏙️", optionB: "NATURE", emojiB: "🏕️", spicyContext: "escape" },
  
  // FOOD WARS
  { optionA: "COFFEE", emojiA: "☕", optionB: "TEA", emojiB: "🍵", spicyContext: "energy source" },
  { optionA: "PIZZA", emojiA: "🍕", optionB: "TACOS", emojiB: "🌮", spicyContext: "food fight" },
  { optionA: "SWEET", emojiA: "🍩", optionB: "SALTY", emojiB: "🍟", spicyContext: "snack attack" },
  { optionA: "BREAKFAST", emojiA: "🥞", optionB: "DINNER", emojiB: "🍝", spicyContext: "best meal" },
  { optionA: "SUSHI", emojiA: "🍣", optionB: "BURGER", emojiB: "🍔", spicyContext: "date night" },
  { optionA: "COOK", emojiA: "👨‍🍳", optionB: "ORDER", emojiB: "📱", spicyContext: "hungry vibes" },
  { optionA: "SPICY", emojiA: "🌶️", optionB: "MILD", emojiB: "🥛", spicyContext: "heat check" },
  
  // TECH TRIBES
  { optionA: "iPHONE", emojiA: "🍎", optionB: "ANDROID", emojiB: "🤖", spicyContext: "phone wars" },
  { optionA: "PC", emojiA: "🖥️", optionB: "CONSOLE", emojiB: "🎮", spicyContext: "gaming" },
  { optionA: "NETFLIX", emojiA: "📺", optionB: "YOUTUBE", emojiB: "▶️", spicyContext: "binge time" },
  { optionA: "SPOTIFY", emojiA: "🎵", optionB: "APPLE", emojiB: "🎧", spicyContext: "music" },
  { optionA: "INSTA", emojiA: "📸", optionB: "TIKTOK", emojiB: "🎬", spicyContext: "scroll life" },
  { optionA: "TEXT", emojiA: "💬", optionB: "CALL", emojiB: "📞", spicyContext: "contact" },
  
  // SOCIAL BEHAVIOR
  { optionA: "REPLY", emojiA: "⚡", optionB: "MARINATE", emojiB: "⏳", spicyContext: "texting style" },
  { optionA: "POST", emojiA: "📤", optionB: "LURK", emojiB: "👀", spicyContext: "social mode" },
  { optionA: "PARTY", emojiA: "🎊", optionB: "COUCH", emojiB: "🛋️", spicyContext: "friday night" },
  { optionA: "EARLY", emojiA: "🏃", optionB: "FASHIONABLY", emojiB: "💅", spicyContext: "arrival style" },
  { optionA: "OVERSHARE", emojiA: "🗣️", optionB: "MYSTERIOUS", emojiB: "🤫", spicyContext: "personality" },
  { optionA: "LEADER", emojiA: "👑", optionB: "VIBE", emojiB: "✌️", spicyContext: "group role" },
  
  // PHILOSOPHY & LIFE
  { optionA: "MONEY", emojiA: "💰", optionB: "TIME", emojiB: "⏰", spicyContext: "priorities" },
  { optionA: "FAME", emojiA: "⭐", optionB: "PRIVACY", emojiB: "🔒", spicyContext: "life goals" },
  { optionA: "RISK", emojiA: "🎲", optionB: "SAFE", emojiB: "🛡️", spicyContext: "life choices" },
  { optionA: "PAST", emojiA: "⏪", optionB: "FUTURE", emojiB: "⏩", spicyContext: "time travel" },
  { optionA: "HEAD", emojiA: "🧠", optionB: "HEART", emojiB: "❤️", spicyContext: "decisions" },
  { optionA: "OPTIMIST", emojiA: "😊", optionB: "REALIST", emojiB: "🤔", spicyContext: "outlook" },
  
  // HOT TAKES
  { optionA: "PINEAPPLE", emojiA: "🍍", optionB: "NO", emojiB: "🚫", spicyContext: "on pizza" },
  { optionA: "OVER", emojiA: "✅", optionB: "UNDER", emojiB: "❌", spicyContext: "toilet paper" },
  { optionA: "GIF", emojiA: "🎞️", optionB: "JIF", emojiB: "🥜", spicyContext: "pronunciation" },
  { optionA: "WATER", emojiA: "💧", optionB: "NOT", emojiB: "🔥", spicyContext: "is wet?" },
  { optionA: "HOTDOG", emojiA: "🌭", optionB: "NOPE", emojiB: "🙅", spicyContext: "is sandwich?" },
  
  // ACTIVITIES
  { optionA: "GYM", emojiA: "💪", optionB: "NAP", emojiB: "😴", spicyContext: "self care" },
  { optionA: "BEACH", emojiA: "🏖️", optionB: "MOUNTAIN", emojiB: "⛰️", spicyContext: "vacation" },
  { optionA: "READ", emojiA: "📚", optionB: "WATCH", emojiB: "🎬", spicyContext: "story time" },
  { optionA: "ROAD TRIP", emojiA: "🚗", optionB: "FLY", emojiB: "✈️", spicyContext: "travel" },
  { optionA: "PLAN", emojiA: "📋", optionB: "WING IT", emojiB: "🦅", spicyContext: "approach" },
  
  // ENTERTAINMENT
  { optionA: "MARVEL", emojiA: "🦸", optionB: "DC", emojiB: "🦇", spicyContext: "heroes" },
  { optionA: "DOGS", emojiA: "🐕", optionB: "CATS", emojiB: "🐈", spicyContext: "pets" },
  { optionA: "HORROR", emojiA: "👻", optionB: "COMEDY", emojiB: "😂", spicyContext: "movie night" },
  { optionA: "FICTION", emojiA: "🧙", optionB: "REALITY", emojiB: "📰", spicyContext: "content" },
  { optionA: "LIVE", emojiA: "🎤", optionB: "STUDIO", emojiB: "🎚️", spicyContext: "music" },
  
  // MODERN LIFE
  { optionA: "WFH", emojiA: "🏠", optionB: "OFFICE", emojiB: "🏢", spicyContext: "work life" },
  { optionA: "ELECTRIC", emojiA: "⚡", optionB: "GAS", emojiB: "⛽", spicyContext: "cars" },
  { optionA: "SAVE", emojiA: "🐷", optionB: "SPEND", emojiB: "💸", spicyContext: "money moves" },
  { optionA: "RAIN", emojiA: "🌧️", optionB: "SUN", emojiB: "☀️", spicyContext: "weather" },
  { optionA: "NIGHT OWL", emojiA: "🦉", optionB: "EARLY BIRD", emojiB: "🐦", spicyContext: "schedule" },
];

// Generate random vote counts for seeding (makes it interesting from the start)
function randomVotes(): { votes_a: number; votes_b: number } {
  const total = Math.floor(Math.random() * 150) + 30; // 30-180 total votes
  const ratio = 0.3 + Math.random() * 0.4; // 30-70% split to make it competitive
  const votes_a = Math.floor(total * ratio);
  return {
    votes_a,
    votes_b: total - votes_a,
  };
}

async function seed() {
  console.log('🌱 Starting seed process...\n');
  console.log(`📊 Project: ${firebaseConfig.projectId}`);
  console.log(`📊 Target: ${seedQuestions.length} emoji-first questions\n`);
  
  // Sign in anonymously
  console.log('🔐 Signing in anonymously...');
  try {
    await signInAnonymously(auth);
    console.log('   ✅ Authenticated!\n');
  } catch (authError: any) {
    console.error('❌ Auth failed:', authError.message);
    console.error('\n⚠️  Make sure Anonymous Auth is enabled in Firebase Console:');
    console.error('   1. Go to Firebase Console → Authentication → Sign-in method');
    console.error('   2. Enable "Anonymous" provider\n');
    process.exit(1);
  }
  
  const questionsRef = collection(db, 'questions');
  
  // Check existing questions
  console.log('📂 Checking existing questions...');
  const existingQuery = query(questionsRef, limit(100));
  const existingDocs = await getDocs(existingQuery);
  const existingOptions = new Set(
    existingDocs.docs.map((d: any) => {
      const data = d.data();
      // Check both old format (option_a) and new format (optionA)
      return `${data.optionA || data.option_a}_${data.optionB || data.option_b}`;
    })
  );
  
  if (existingDocs.size > 0) {
    console.log(`   Found ${existingDocs.size} existing questions.`);
    console.log('   Will skip duplicates...\n');
  } else {
    console.log('   No existing questions found.\n');
  }
  
  let added = 0;
  let skipped = 0;
  
  console.log('📝 Adding emoji-first questions...\n');
  
  for (const question of seedQuestions) {
    const key = `${question.optionA}_${question.optionB}`;
    if (existingOptions.has(key)) {
      skipped++;
      continue;
    }
    
    const votes = randomVotes();
    
    try {
      await addDoc(questionsRef, {
        ...question,
        ...votes,
        created_at: serverTimestamp(),
      });
      
      added++;
      const pct_a = Math.round((votes.votes_a / (votes.votes_a + votes.votes_b)) * 100);
      console.log(`   ✅ [${added}] ${question.emojiA} ${question.optionA} vs ${question.emojiB} ${question.optionB} (${pct_a}% vs ${100-pct_a}%)`);
    } catch (writeError: any) {
      console.error(`   ❌ Failed: "${question.optionA} vs ${question.optionB}" - ${writeError.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETE!\n');
  console.log(`   ✅ Added: ${added} emoji-first questions`);
  if (skipped > 0) {
    console.log(`   ⏭️  Skipped: ${skipped} duplicates`);
  }
  console.log(`   📊 Total in DB: ${existingDocs.size + added} questions`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}

seed().catch((error: any) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
