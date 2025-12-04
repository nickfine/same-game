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
const seedQuestions = [
  // Classic debates
  { text: "Cats or Dogs?", option_a: "Cats", option_b: "Dogs" },
  { text: "Pineapple on Pizza?", option_a: "Yes please!", option_b: "Absolutely not" },
  { text: "Toilet Paper: Over or Under?", option_a: "Over", option_b: "Under" },
  { text: "Is a hotdog a sandwich?", option_a: "Yes", option_b: "No" },
  { text: "GIF pronunciation?", option_a: "Jif", option_b: "Gif (hard G)" },
  
  // Lifestyle & Personality
  { text: "Morning or Night Person?", option_a: "Early Bird", option_b: "Night Owl" },
  { text: "Coffee or Tea?", option_a: "Coffee", option_b: "Tea" },
  { text: "Friday Night Plans?", option_a: "Go Out", option_b: "Stay In" },
  { text: "Vacation Style?", option_a: "Beach", option_b: "Mountains" },
  { text: "How do you recharge?", option_a: "Alone Time", option_b: "With Friends" },
  
  // Tech & Gaming
  { text: "Smartphone Preference?", option_a: "iPhone", option_b: "Android" },
  { text: "Gaming Platform?", option_a: "Console", option_b: "PC" },
  { text: "Favorite Social Media?", option_a: "TikTok", option_b: "Instagram" },
  { text: "Music Streaming?", option_a: "Spotify", option_b: "Apple Music" },
  { text: "Default Browser?", option_a: "Chrome", option_b: "Safari" },
  
  // Superpowers
  { text: "Which superpower?", option_a: "Invisibility", option_b: "Flight" },
  { text: "Which would you choose?", option_a: "Read Minds", option_b: "Time Travel" },
  { text: "Better ability?", option_a: "Super Speed", option_b: "Super Strength" },
  { text: "Would you rather have?", option_a: "Teleportation", option_b: "Telekinesis" },
  { text: "Pick one:", option_a: "Talk to Animals", option_b: "Speak All Languages" },
  
  // Food & Drink
  { text: "Pizza Crust Style?", option_a: "Thin & Crispy", option_b: "Thick & Fluffy" },
  { text: "Chocolate Type?", option_a: "Milk Chocolate", option_b: "Dark Chocolate" },
  { text: "Breakfast Preference?", option_a: "Sweet", option_b: "Savory" },
  { text: "Sushi Opinion?", option_a: "Love it", option_b: "Not for me" },
  { text: "Cereal First or Milk First?", option_a: "Cereal First", option_b: "Milk First" },
  
  // Pop Culture
  { text: "Star Wars or Star Trek?", option_a: "Star Wars", option_b: "Star Trek" },
  { text: "Marvel or DC?", option_a: "Marvel", option_b: "DC" },
  { text: "The Office Version?", option_a: "US", option_b: "UK" },
  { text: "Better Hogwarts House?", option_a: "Gryffindor", option_b: "Slytherin" },
  { text: "Zombie Apocalypse Weapon?", option_a: "Sword", option_b: "Gun" },
  
  // This or That
  { text: "Summer or Winter?", option_a: "Summer", option_b: "Winter" },
  { text: "Books or Movies?", option_a: "Books", option_b: "Movies" },
  { text: "City or Countryside?", option_a: "City Life", option_b: "Countryside" },
  { text: "Text or Call?", option_a: "Text", option_b: "Call" },
  { text: "Sweet or Salty Snacks?", option_a: "Sweet", option_b: "Salty" },
  
  // Life Choices
  { text: "What matters more?", option_a: "More Money", option_b: "More Time" },
  { text: "Would you rather?", option_a: "Know the Future", option_b: "Change the Past" },
  { text: "Better problem?", option_a: "Too Hot", option_b: "Too Cold" },
  { text: "Worse to lose?", option_a: "Phone for a Week", option_b: "Wallet for a Day" },
  { text: "Pick your poison:", option_a: "No Music Ever", option_b: "No Movies Ever" },
  
  // Random Fun
  { text: "Aliens exist?", option_a: "Definitely", option_b: "No way" },
  { text: "Shower timing?", option_a: "Morning", option_b: "Night" },
  { text: "Sleep position?", option_a: "Side", option_b: "Back" },
  { text: "Burgers or Tacos?", option_a: "Burgers", option_b: "Tacos" },
  { text: "Ice cream cone or cup?", option_a: "Cone", option_b: "Cup" },
  
  // Modern Debates
  { text: "Remote work or Office?", option_a: "Remote", option_b: "Office" },
  { text: "Electric or Gas Car?", option_a: "Electric", option_b: "Gas" },
  { text: "Cash or Card?", option_a: "Cash", option_b: "Card" },
  { text: "Streaming or Cinema?", option_a: "Streaming", option_b: "Cinema" },
  { text: "Ebook or Physical Book?", option_a: "Ebook", option_b: "Physical" },
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
