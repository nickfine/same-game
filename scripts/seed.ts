/**
 * Seed script to populate Firestore with initial questions
 * 
 * Usage: npm run seed
 * 
 * Make sure to set your Firebase config in environment variables before running:
 * - EXPO_PUBLIC_FIREBASE_API_KEY
 * - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - EXPO_PUBLIC_FIREBASE_PROJECT_ID
 * - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - EXPO_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';

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
  console.error('❌ Firebase config not found!');
  console.error('Please set the following environment variables:');
  console.error('  EXPO_PUBLIC_FIREBASE_API_KEY');
  console.error('  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('  EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('  EXPO_PUBLIC_FIREBASE_APP_ID');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed data - diverse questions for engagement
const seedQuestions = [
  // Classic debates
  { text: "Cats or Dogs?", option_a: "Cats", option_b: "Dogs" },
  { text: "Pineapple on Pizza?", option_a: "Yes", option_b: "No" },
  { text: "Toilet Paper: Over or Under?", option_a: "Over", option_b: "Under" },
  { text: "is a hotdog a sandwich?", option_a: "Yes", option_b: "No" },
  { text: "GIF pronunciation?", option_a: "Jif", option_b: "Gif" },
  
  // Lifestyle
  { text: "Morning or Night Person?", option_a: "Early Bird", option_b: "Night Owl" },
  { text: "Coffee or Tea?", option_a: "Coffee", option_b: "Tea" },
  { text: "Friday Night Plans?", option_a: "Go Out", option_b: "Stay In" },
  { text: "Vacation preference?", option_a: "Beach", option_b: "Mountains" },
  { text: "How do you recharge?", option_a: "Alone Time", option_b: "With Friends" },
  
  // Tech
  { text: "Smartphone?", option_a: "iPhone", option_b: "Android" },
  { text: "Gaming Platform?", option_a: "Console", option_b: "PC" },
  { text: "Social Media?", option_a: "TikTok", option_b: "Instagram" },
  { text: "Music streaming?", option_a: "Spotify", option_b: "Apple Music" },
  { text: "Browser?", option_a: "Chrome", option_b: "Safari" },
  
  // Would you rather
  { text: "Would you rather have...", option_a: "Invisibility", option_b: "Flight" },
  { text: "Would you rather have...", option_a: "More Money", option_b: "More Time" },
  { text: "Would you rather...", option_a: "Know Future", option_b: "Change Past" },
  { text: "Would you rather be...", option_a: "Too Hot", option_b: "Too Cold" },
  { text: "Would you rather...", option_a: "No Phone", option_b: "No Internet" },
  
  // Food
  { text: "Pizza crust?", option_a: "Thin", option_b: "Thick" },
  { text: "Chocolate?", option_a: "Milk", option_b: "Dark" },
  { text: "Breakfast food?", option_a: "Sweet", option_b: "Savory" },
  { text: "Sushi?", option_a: "Love it", option_b: "Hate it" },
  { text: "Cereal first?", option_a: "Cereal", option_b: "Milk" },
  
  // Pop culture
  { text: "Star Wars or Star Trek?", option_a: "Wars", option_b: "Trek" },
  { text: "Marvel or DC?", option_a: "Marvel", option_b: "DC" },
  { text: "The Office?", option_a: "US", option_b: "UK" },
  { text: "Hogwarts house?", option_a: "Gryffindor", option_b: "Slytherin" },
  { text: "Zombie apocalypse weapon?", option_a: "Sword", option_b: "Gun" },
];

// Generate random vote counts for seeding
function randomVotes(): { votes_a: number; votes_b: number } {
  const total = Math.floor(Math.random() * 100) + 20; // 20-120 total votes
  const votes_a = Math.floor(Math.random() * total);
  return {
    votes_a,
    votes_b: total - votes_a,
  };
}

async function seed() {
  console.log('🌱 Starting seed process...\n');
  
  const questionsRef = collection(db, 'questions');
  
  // Check if questions already exist
  const existingQuery = query(questionsRef, limit(1));
  const existingDocs = await getDocs(existingQuery);
  
  if (!existingDocs.empty) {
    console.log('⚠️  Questions collection already has data.');
    console.log('   Skipping seed to avoid duplicates.');
    console.log('   Delete the questions collection in Firebase Console to re-seed.\n');
    process.exit(0);
  }
  
  console.log(`📝 Creating ${seedQuestions.length} questions...\n`);
  
  for (const question of seedQuestions) {
    const votes = randomVotes();
    
    const docRef = await addDoc(questionsRef, {
      ...question,
      ...votes,
      created_at: serverTimestamp(),
    });
    
    console.log(`   ✅ "${question.text}"`);
    console.log(`      ID: ${docRef.id}`);
    console.log(`      Votes: ${votes.votes_a} vs ${votes.votes_b}\n`);
  }
  
  console.log('🎉 Seed complete!\n');
  console.log('Your SAME app now has starter questions.');
  console.log('Run `npm start` to launch the app.\n');
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

