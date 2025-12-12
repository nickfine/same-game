/**
 * Seed script to populate Firestore with initial questions
 * Uses Firebase Client SDK with Anonymous Auth
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

// 50 diverse, engaging questions for the SAME game
// Mix of original questions + spicy group-chat voice rewrites
const seedQuestions = [
  // ═══════════════════════════════════════════════════════════════
  // SPICY QUESTIONS - Cocky group-chat energy
  // ═══════════════════════════════════════════════════════════════
  { text: "Rot on the couch or big-screen flex?", option_a: "Streaming", option_b: "Cinema" },
  { text: "Sugar goblin or salt demon?", option_a: "Sweet", option_b: "Savory" },
  { text: "Cat overlord or dog simp?", option_a: "Cats", option_b: "Dogs" },
  { text: "IV drip espresso or leaf water?", option_a: "Coffee", option_b: "Tea" },
  { text: "Pineapple on pizza: crime or cuisine?", option_a: "Crime", option_b: "Cuisine" },
  
  { text: "Sunrise supremacy or midnight menace?", option_a: "Morning", option_b: "Night" },
  { text: "5am gym bro or 2am gremlin?", option_a: "Early Bird", option_b: "Night Owl" },
  
  { text: "Fruit phone cult or green bubble peasant?", option_a: "iPhone", option_b: "Android" },
  { text: "PC master race or console casual?", option_a: "PC", option_b: "Console" },
  { text: "Touch grass or touch screen?", option_a: "Go Outside", option_b: "Stay Online" },
  
  { text: "Crust is just bread handles. Fight me.", option_a: "Eat it", option_b: "Trash it" },
  { text: "Cereal is soup. Prove me wrong.", option_a: "Facts", option_b: "Unhinged" },
  { text: "Hot dog is a taco. There, I said it.", option_a: "Based", option_b: "Seek help" },
  { text: "Boneless wings are just nuggets for adults", option_a: "Real talk", option_b: "Blasphemy" },
  
  { text: "Reply instantly or let them marinate?", option_a: "Instant", option_b: "Let em wait" },
  { text: "Read receipts: power move or psycho behavior?", option_a: "Power move", option_b: "Psycho" },
  { text: "Voice messages: efficient or unhinged?", option_a: "Efficient", option_b: "Unhinged" },
  { text: "Double text: confident or desperate?", option_a: "Confident", option_b: "Desperate" },
  
  { text: "Fly around or disappear on command?", option_a: "Flight", option_b: "Invisibility" },
  { text: "Read minds or erase memories?", option_a: "Read minds", option_b: "Erase" },
  { text: "Stop time or travel through it?", option_a: "Stop time", option_b: "Time travel" },
  
  { text: "Die Hard is a Christmas movie. PERIOD.", option_a: "Obviously", option_b: "Never" },
  { text: "The remake was better", option_a: "Sometimes", option_b: "Literally never" },
  { text: "Spoilers ruin movies or build hype?", option_a: "Ruin", option_b: "Build hype" },
  
  { text: "Main character energy or side character peace?", option_a: "Main", option_b: "Side" },
  { text: "Overshare or bottle it up?", option_a: "Overshare", option_b: "Bottle it" },
  { text: "Apologize first or die on that hill?", option_a: "Apologize", option_b: "Die on hill" },
  
  { text: "Water is wet", option_a: "Facts", option_b: "Water makes things wet" },
  { text: "GIF or JIF? Choose wisely.", option_a: "GIF (hard G)", option_b: "JIF" },
  { text: "Toilet paper: over or under?", option_a: "Over", option_b: "Under (psycho)" },
  
  { text: "WFH forever or office comeback arc?", option_a: "WFH", option_b: "Office" },
  { text: "Electric cars or gas guzzler loyalty?", option_a: "Electric", option_b: "Gas" },
  { text: "AI will save us or doom us all", option_a: "Save", option_b: "Doom" },
  
  { text: "More money or more time?", option_a: "Money", option_b: "Time" },
  { text: "Know when you'll die or how?", option_a: "When", option_b: "How" },
  { text: "Never eat pizza again or never drink coffee?", option_a: "No pizza", option_b: "No coffee" },
  
  { text: "Aliens definitely exist, right?", option_a: "Obviously", option_b: "We're alone" },
  { text: "Shower thoughts: morning clarity or night therapy?", option_a: "Morning", option_b: "Night" },
  { text: "Make your bed or embrace the chaos?", option_a: "Make it", option_b: "Chaos" },
  
  { text: "Avocado toast is overrated", option_a: "Agree", option_b: "Blocked" },
  { text: "Oat milk supremacy", option_a: "Yes king", option_b: "Regular milk forever" },
  { text: "Standing desk: game changer or try-hard?", option_a: "Game changer", option_b: "Try-hard" },
  
  { text: "Post the thirst trap or save for the archives?", option_a: "Post it", option_b: "Save it" },
  { text: "Finsta or keep it real on main?", option_a: "Finsta", option_b: "Main only" },
  { text: "Stories or posts?", option_a: "Stories", option_b: "Posts" },
  
  { text: "First move: you or them?", option_a: "Me", option_b: "Them" },
  { text: "Date idea: fancy dinner or chaos activity?", option_a: "Fancy", option_b: "Chaos" },
  { text: "Check their socials before the date?", option_a: "Always", option_b: "Never" },
  
  // ═══════════════════════════════════════════════════════════════
  // CLASSIC QUESTIONS
  // ═══════════════════════════════════════════════════════════════
  { text: "Star Wars or Star Trek?", option_a: "Star Wars", option_b: "Star Trek" },
  { text: "Marvel or DC?", option_a: "Marvel", option_b: "DC" },
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
  console.log(`📊 Target: ${seedQuestions.length} questions\n`);
  
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
  const existingTexts = new Set(existingDocs.docs.map((d: any) => d.data().text));
  
  if (existingDocs.size > 0) {
    console.log(`   Found ${existingDocs.size} existing questions.`);
    console.log('   Will skip duplicates...\n');
  } else {
    console.log('   No existing questions found.\n');
  }
  
  let added = 0;
  let skipped = 0;
  
  console.log('📝 Adding questions...\n');
  
  for (const question of seedQuestions) {
    if (existingTexts.has(question.text)) {
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
      console.log(`   ✅ [${added}] "${question.text}" (${pct_a}% vs ${100-pct_a}%)`);
    } catch (writeError: any) {
      console.error(`   ❌ Failed: "${question.text}" - ${writeError.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETE!\n');
  console.log(`   ✅ Added: ${added} questions`);
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
