/**
 * Seed script to populate Firestore with 100 production questions
 * Uses Firebase Client SDK with Anonymous Auth
 * 
 * FORMAT: Emoji-first, zero-text, screenshot-gold questions
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
// 100 PRODUCTION QUESTIONS - Screenshot Gold
// Short, judgmental, personality-loaded with perfect contrasting emojis
// ═══════════════════════════════════════════════════════════════
const seedQuestions = [
  // PERSONALITY CALLOUTS (20)
  { optionA: "MAIN CHARACTER", emojiA: "👑", optionB: "SIDE QUEST", emojiB: "🗺️", category: "personality" },
  { optionA: "DELULU", emojiA: "💊", optionB: "SOLULU", emojiB: "💚", category: "personality" },
  { optionA: "CHAOTIC", emojiA: "🔥", optionB: "CHILL", emojiB: "🧊", category: "personality" },
  { optionA: "UNHINGED", emojiA: "🤪", optionB: "COMPOSED", emojiB: "🧘", category: "personality" },
  { optionA: "DRAMA", emojiA: "🎭", optionB: "PEACE", emojiB: "☮️", category: "personality" },
  { optionA: "LOUD", emojiA: "📢", optionB: "QUIET", emojiB: "🤫", category: "personality" },
  { optionA: "OVERTHINKER", emojiA: "🧠", optionB: "VIBES ONLY", emojiB: "✨", category: "personality" },
  { optionA: "MENACE", emojiA: "😈", optionB: "ANGEL", emojiB: "😇", category: "personality" },
  { optionA: "YAPPER", emojiA: "🗣️", optionB: "LISTENER", emojiB: "👂", category: "personality" },
  { optionA: "PETTY", emojiA: "💅", optionB: "MATURE", emojiB: "🎓", category: "personality" },
  { optionA: "HOT MESS", emojiA: "🌋", optionB: "PUT TOGETHER", emojiB: "📦", category: "personality" },
  { optionA: "GASLIGHT", emojiA: "🔦", optionB: "GATEKEEP", emojiB: "🚪", category: "personality" },
  { optionA: "NPC", emojiA: "🤖", optionB: "PROTAGONIST", emojiB: "⭐", category: "personality" },
  { optionA: "VILLAIN ERA", emojiA: "🦹", optionB: "HEALING ERA", emojiB: "🌸", category: "personality" },
  { optionA: "FERAL", emojiA: "🐺", optionB: "CIVILIZED", emojiB: "🎩", category: "personality" },
  { optionA: "BASED", emojiA: "💯", optionB: "CRINGE", emojiB: "😬", category: "personality" },
  { optionA: "SLAY", emojiA: "⚔️", optionB: "SURVIVE", emojiB: "🏃", category: "personality" },
  { optionA: "ICONIC", emojiA: "🏆", optionB: "FORGETTABLE", emojiB: "👻", category: "personality" },
  { optionA: "BOLD", emojiA: "🦁", optionB: "CAUTIOUS", emojiB: "🐢", category: "personality" },
  { optionA: "REAL", emojiA: "💎", optionB: "FAKE", emojiB: "🎭", category: "personality" },

  // LIFESTYLE CHOICES (20)
  { optionA: "TOUCH GRASS", emojiA: "🌱", optionB: "TOUCH SCREEN", emojiB: "📱", category: "lifestyle" },
  { optionA: "MORNING", emojiA: "🌅", optionB: "NIGHT OWL", emojiB: "🦉", category: "lifestyle" },
  { optionA: "HYGGE", emojiA: "🕯️", optionB: "GRIND", emojiB: "💪", category: "lifestyle" },
  { optionA: "SOFT LIFE", emojiA: "☁️", optionB: "HARD LAUNCH", emojiB: "🚀", category: "lifestyle" },
  { optionA: "HOMEBODY", emojiA: "🏠", optionB: "OUT OUT", emojiB: "🪩", category: "lifestyle" },
  { optionA: "HOT GIRL WALK", emojiA: "🚶‍♀️", optionB: "ROT", emojiB: "🛋️", category: "lifestyle" },
  { optionA: "5AM CLUB", emojiA: "⏰", optionB: "SLEEP IN", emojiB: "😴", category: "lifestyle" },
  { optionA: "CLEAN GIRL", emojiA: "🧴", optionB: "GOBLIN MODE", emojiB: "👺", category: "lifestyle" },
  { optionA: "GYM RAT", emojiA: "🏋️", optionB: "COUCH KING", emojiB: "👑", category: "lifestyle" },
  { optionA: "MEAL PREP", emojiA: "🥗", optionB: "UBER EATS", emojiB: "🛵", category: "lifestyle" },
  { optionA: "MINIMALIST", emojiA: "⬜", optionB: "MAXIMALIST", emojiB: "🌈", category: "lifestyle" },
  { optionA: "CITY GIRL", emojiA: "🏙️", optionB: "COUNTRY", emojiB: "🌾", category: "lifestyle" },
  { optionA: "BEACH", emojiA: "🏖️", optionB: "MOUNTAINS", emojiB: "⛰️", category: "lifestyle" },
  { optionA: "SOBER", emojiA: "🧃", optionB: "SPICY MARG", emojiB: "🍹", category: "lifestyle" },
  { optionA: "PLAN", emojiA: "📋", optionB: "WING IT", emojiB: "🦅", category: "lifestyle" },
  { optionA: "EARLY", emojiA: "🏃", optionB: "FASHIONABLY LATE", emojiB: "💅", category: "lifestyle" },
  { optionA: "SAVE", emojiA: "🐷", optionB: "TREAT YOURSELF", emojiB: "💸", category: "lifestyle" },
  { optionA: "ROAD TRIP", emojiA: "🚗", optionB: "FLY", emojiB: "✈️", category: "lifestyle" },
  { optionA: "CAMPING", emojiA: "⛺", optionB: "HOTEL", emojiB: "🏨", category: "lifestyle" },
  { optionA: "ADOPT", emojiA: "🐶", optionB: "SHOP", emojiB: "🏪", category: "lifestyle" },

  // SOCIAL & DATING (15)
  { optionA: "TEXT FIRST", emojiA: "📱", optionB: "WAIT", emojiB: "⏳", category: "social" },
  { optionA: "SITUATIONSHIP", emojiA: "🤷", optionB: "LABEL IT", emojiB: "💍", category: "social" },
  { optionA: "REPLY FAST", emojiA: "⚡", optionB: "MARINATE", emojiB: "🥩", category: "social" },
  { optionA: "HARD LAUNCH", emojiA: "🚀", optionB: "SOFT LAUNCH", emojiB: "🌙", category: "social" },
  { optionA: "DOUBLE TEXT", emojiA: "📱📱", optionB: "DIGNITY", emojiB: "🎭", category: "social" },
  { optionA: "GHOST", emojiA: "👻", optionB: "CLOSURE", emojiB: "📬", category: "social" },
  { optionA: "JEALOUS", emojiA: "👀", optionB: "SECURE", emojiB: "🔒", category: "social" },
  { optionA: "ATTACH", emojiA: "🧲", optionB: "AVOIDANT", emojiB: "🏃‍♂️", category: "social" },
  { optionA: "OVERSHARE", emojiA: "🗣️", optionB: "MYSTERIOUS", emojiB: "🎭", category: "social" },
  { optionA: "BIG WEDDING", emojiA: "💒", optionB: "ELOPE", emojiB: "🌴", category: "social" },
  { optionA: "STALK", emojiA: "🔍", optionB: "BLOCK", emojiB: "🚫", category: "social" },
  { optionA: "EX", emojiA: "⏮️", optionB: "NEXT", emojiB: "⏭️", category: "social" },
  { optionA: "CUFF", emojiA: "🍂", optionB: "HOT GIRL SUMMER", emojiB: "☀️", category: "social" },
  { optionA: "RIZZ", emojiA: "😏", optionB: "NO GAME", emojiB: "😶", category: "social" },
  { optionA: "FRIEND ZONE", emojiA: "🤝", optionB: "SHOOT SHOT", emojiB: "🏀", category: "social" },

  // FOOD WARS (10)
  { optionA: "SWEET", emojiA: "🍩", optionB: "SALTY", emojiB: "🍟", category: "food" },
  { optionA: "BRUNCH", emojiA: "🥞", optionB: "DINNER", emojiB: "🍝", category: "food" },
  { optionA: "MATCHA", emojiA: "🍵", optionB: "COFFEE", emojiB: "☕", category: "food" },
  { optionA: "SUSHI", emojiA: "🍣", optionB: "PIZZA", emojiB: "🍕", category: "food" },
  { optionA: "COOK", emojiA: "👨‍🍳", optionB: "ORDER", emojiB: "🛵", category: "food" },
  { optionA: "SPICY", emojiA: "🌶️", optionB: "MILD", emojiB: "🥛", category: "food" },
  { optionA: "PINEAPPLE", emojiA: "🍍", optionB: "NO WAY", emojiB: "🙅", category: "food" },
  { optionA: "WELL DONE", emojiA: "🔥", optionB: "RARE", emojiB: "🩸", category: "food" },
  { optionA: "BONE IN", emojiA: "🦴", optionB: "BONELESS", emojiB: "🍗", category: "food" },
  { optionA: "RANCH", emojiA: "🥛", optionB: "NO RANCH", emojiB: "❌", category: "food" },

  // TECH & CULTURE (15)
  { optionA: "iPHONE", emojiA: "🍎", optionB: "ANDROID", emojiB: "🤖", category: "tech" },
  { optionA: "DARK MODE", emojiA: "🌙", optionB: "LIGHT MODE", emojiB: "☀️", category: "tech" },
  { optionA: "AIRPODS", emojiA: "🎧", optionB: "WIRED", emojiB: "🔌", category: "tech" },
  { optionA: "SCROLL", emojiA: "📱", optionB: "TOUCH GRASS", emojiB: "🌿", category: "tech" },
  { optionA: "POST", emojiA: "📤", optionB: "LURK", emojiB: "👀", category: "tech" },
  { optionA: "BEREAL", emojiA: "📸", optionB: "CURATED", emojiB: "✨", category: "tech" },
  { optionA: "FACETIME", emojiA: "📹", optionB: "VOICE NOTE", emojiB: "🎤", category: "tech" },
  { optionA: "PODCAST", emojiA: "🎙️", optionB: "MUSIC", emojiB: "🎵", category: "tech" },
  { optionA: "BINGE", emojiA: "📺", optionB: "ONE EP", emojiB: "1️⃣", category: "tech" },
  { optionA: "SUBTITLES", emojiA: "💬", optionB: "RAW", emojiB: "🔇", category: "tech" },
  { optionA: "SPOILERS", emojiA: "🗣️", optionB: "PURE", emojiB: "🙈", category: "tech" },
  { optionA: "PC", emojiA: "🖥️", optionB: "CONSOLE", emojiB: "🎮", category: "tech" },
  { optionA: "AI", emojiA: "🤖", optionB: "HUMAN", emojiB: "👤", category: "tech" },
  { optionA: "VIRAL", emojiA: "📈", optionB: "AUTHENTIC", emojiB: "💚", category: "tech" },
  { optionA: "MAIN", emojiA: "👤", optionB: "FINSTA", emojiB: "🥷", category: "tech" },

  // HOT TAKES & CHAOS (20)
  { optionA: "GIF", emojiA: "🎞️", optionB: "JIF", emojiB: "🥜", category: "hottake" },
  { optionA: "WATER WET", emojiA: "💧", optionB: "WATER NOT", emojiB: "🔥", category: "hottake" },
  { optionA: "HOTDOG SANDWICH", emojiA: "🌭", optionB: "HOTDOG NOT", emojiB: "🙅", category: "hottake" },
  { optionA: "TOILET OVER", emojiA: "✅", optionB: "TOILET UNDER", emojiB: "❌", category: "hottake" },
  { optionA: "CEREAL FIRST", emojiA: "🥣", optionB: "MILK FIRST", emojiB: "🥛", category: "hottake" },
  { optionA: "SHOWER AM", emojiA: "🌅", optionB: "SHOWER PM", emojiB: "🌙", category: "hottake" },
  { optionA: "SOCKS BED", emojiA: "🧦", optionB: "NO SOCKS", emojiB: "🦶", category: "hottake" },
  { optionA: "PHONE FACE UP", emojiA: "📱", optionB: "FACE DOWN", emojiB: "🔻", category: "hottake" },
  { optionA: "REPLY ALL", emojiA: "📧", optionB: "NEVER", emojiB: "🚫", category: "hottake" },
  { optionA: "LOUD CHEWER", emojiA: "😤", optionB: "FORGIVABLE", emojiB: "🤷", category: "hottake" },
  { optionA: "OPEN MOUTH", emojiA: "😮", optionB: "CHEW CLOSED", emojiB: "😶", category: "hottake" },
  { optionA: "RECLINER", emojiA: "💺", optionB: "RESPECT SPACE", emojiB: "🧘", category: "hottake" },
  { optionA: "STEAL FRIES", emojiA: "🍟", optionB: "ASK FIRST", emojiB: "🙋", category: "hottake" },
  { optionA: "CROCS VALID", emojiA: "🐊", optionB: "CROCS NO", emojiB: "❌", category: "hottake" },
  { optionA: "CARGO PANTS", emojiA: "👖", optionB: "FASHION CRIME", emojiB: "🚨", category: "hottake" },
  { optionA: "AISLE", emojiA: "🚶", optionB: "WINDOW", emojiB: "🪟", category: "hottake" },
  { optionA: "FRONT SEAT", emojiA: "🚗", optionB: "BACK SEAT", emojiB: "🔙", category: "hottake" },
  { optionA: "QUEUE JUMPER", emojiA: "😈", optionB: "WAIT", emojiB: "😇", category: "hottake" },
  { optionA: "READ RECEIPTS", emojiA: "✓✓", optionB: "CHAOS", emojiB: "❓", category: "hottake" },
  { optionA: "FOLD", emojiA: "📂", optionB: "SCRUNCH", emojiB: "🧻", category: "hottake" },
];

// Generate random vote counts for seeding (makes it interesting from the start)
function randomVotes(): { votes_a: number; votes_b: number } {
  const total = Math.floor(Math.random() * 200) + 50; // 50-250 total votes
  const ratio = 0.3 + Math.random() * 0.4; // 30-70% split to make it competitive
  const votes_a = Math.floor(total * ratio);
  return {
    votes_a,
    votes_b: total - votes_a,
  };
}

async function seed() {
  console.log('\n' + '═'.repeat(60));
  console.log('🎰 SAME - Production Question Seed');
  console.log('═'.repeat(60) + '\n');
  
  console.log(`📊 Project: ${firebaseConfig.projectId}`);
  console.log(`📊 Target: ${seedQuestions.length} screenshot-gold questions\n`);
  
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
  const existingQuery = query(questionsRef, limit(200));
  const existingDocs = await getDocs(existingQuery);
  const existingOptions = new Set(
    existingDocs.docs.map((d: any) => {
      const data = d.data();
      return `${data.optionA || data.option_a}_${data.optionB || data.option_b}`;
    })
  );
  
  if (existingDocs.size > 0) {
    console.log(`   Found ${existingDocs.size} existing questions.`);
    console.log('   Will skip duplicates...\n');
  } else {
    console.log('   No existing questions found. Fresh start!\n');
  }
  
  let added = 0;
  let skipped = 0;
  
  console.log('📝 Adding production questions...\n');
  
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
      console.log(`   ✅ [${added}] ${question.emojiA} ${question.optionA} vs ${question.emojiB} ${question.optionB} (${pct_a}%-${100-pct_a}%)`);
    } catch (writeError: any) {
      console.error(`   ❌ Failed: "${question.optionA} vs ${question.optionB}" - ${writeError.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SEED COMPLETE!\n');
  console.log(`   ✅ Added: ${added} new questions`);
  if (skipped > 0) {
    console.log(`   ⏭️  Skipped: ${skipped} duplicates`);
  }
  console.log(`   📊 Total in DB: ${existingDocs.size + added} questions`);
  console.log('═'.repeat(60) + '\n');
  
  process.exit(0);
}

seed().catch((error: any) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
