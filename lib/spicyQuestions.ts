// ═══════════════════════════════════════════════════════════════
// SAME APP - Spicy Question Bank
// Cocky, group-chat energy questions
// ═══════════════════════════════════════════════════════════════

export interface SpicyQuestion {
  text: string;
  option_a: string;
  option_b: string;
  isHotTake?: boolean; // Daily controversial question
}

export const SPICY_QUESTIONS: SpicyQuestion[] = [
  // Classic debates with spicy rewrites
  { text: "Rot on the couch or big-screen flex?", option_a: "Streaming", option_b: "Cinema" },
  { text: "Sugar goblin or salt demon?", option_a: "Sweet", option_b: "Savory" },
  { text: "Cat overlord or dog simp?", option_a: "Cats", option_b: "Dogs" },
  { text: "IV drip espresso or leaf water?", option_a: "Coffee", option_b: "Tea" },
  { text: "Pineapple on pizza: crime or cuisine?", option_a: "Crime", option_b: "Cuisine", isHotTake: true },
  
  // Morning vs Night
  { text: "Sunrise supremacy or midnight menace?", option_a: "Morning", option_b: "Night" },
  { text: "5am gym bro or 2am gremlin?", option_a: "Early Bird", option_b: "Night Owl" },
  
  // Tech wars
  { text: "Fruit phone cult or green bubble peasant?", option_a: "iPhone", option_b: "Android" },
  { text: "PC master race or console casual?", option_a: "PC", option_b: "Console" },
  { text: "Touch grass or touch screen?", option_a: "Go Outside", option_b: "Stay Online" },
  
  // Food takes
  { text: "Crust is just bread handles. Fight me.", option_a: "Eat it", option_b: "Trash it", isHotTake: true },
  { text: "Cereal is soup. Prove me wrong.", option_a: "Facts", option_b: "Unhinged", isHotTake: true },
  { text: "Hot dog is a taco. There, I said it.", option_a: "Based", option_b: "Seek help", isHotTake: true },
  { text: "Boneless wings are just nuggets for adults", option_a: "Real talk", option_b: "Blasphemy" },
  
  // Lifestyle
  { text: "Reply instantly or let them marinate?", option_a: "Instant", option_b: "Let em wait" },
  { text: "Read receipts: power move or psycho behavior?", option_a: "Power move", option_b: "Psycho" },
  { text: "Voice messages: efficient or unhinged?", option_a: "Efficient", option_b: "Unhinged" },
  { text: "Double text: confident or desperate?", option_a: "Confident", option_b: "Desperate" },
  
  // Superpowers
  { text: "Fly around or disappear on command?", option_a: "Flight", option_b: "Invisibility" },
  { text: "Read minds or erase memories?", option_a: "Read minds", option_b: "Erase" },
  { text: "Stop time or travel through it?", option_a: "Stop time", option_b: "Time travel" },
  
  // Pop culture spice
  { text: "Die Hard is a Christmas movie. PERIOD.", option_a: "Obviously", option_b: "Never", isHotTake: true },
  { text: "The remake was better", option_a: "Sometimes", option_b: "Literally never" },
  { text: "Spoilers ruin movies or build hype?", option_a: "Ruin", option_b: "Build hype" },
  
  // Social
  { text: "Main character energy or side character peace?", option_a: "Main", option_b: "Side" },
  { text: "Overshare or bottle it up?", option_a: "Overshare", option_b: "Bottle it" },
  { text: "Apologize first or die on that hill?", option_a: "Apologize", option_b: "Die on hill" },
  
  // Controversial takes
  { text: "Water is wet", option_a: "Facts", option_b: "Water makes things wet", isHotTake: true },
  { text: "GIF or JIF? Choose wisely.", option_a: "GIF (hard G)", option_b: "JIF", isHotTake: true },
  { text: "Toilet paper: over or under?", option_a: "Over", option_b: "Under (psycho)" },
  
  // Modern debates
  { text: "WFH forever or office comeback arc?", option_a: "WFH", option_b: "Office" },
  { text: "Electric cars or gas guzzler loyalty?", option_a: "Electric", option_b: "Gas" },
  { text: "AI will save us or doom us all", option_a: "Save", option_b: "Doom", isHotTake: true },
  
  // Life choices
  { text: "More money or more time?", option_a: "Money", option_b: "Time" },
  { text: "Know when you'll die or how?", option_a: "When", option_b: "How" },
  { text: "Never eat pizza again or never drink coffee?", option_a: "No pizza", option_b: "No coffee" },
  
  // Random chaos
  { text: "Aliens definitely exist, right?", option_a: "Obviously", option_b: "We're alone" },
  { text: "Shower thoughts: morning clarity or night therapy?", option_a: "Morning", option_b: "Night" },
  { text: "Make your bed or embrace the chaos?", option_a: "Make it", option_b: "Chaos" },
  
  // Hot takes
  { text: "Avocado toast is overrated", option_a: "Agree", option_b: "Blocked", isHotTake: true },
  { text: "Oat milk supremacy", option_a: "Yes king", option_b: "Regular milk forever" },
  { text: "Standing desk: game changer or try-hard?", option_a: "Game changer", option_b: "Try-hard" },
  
  // Social media
  { text: "Post the thirst trap or save for the archives?", option_a: "Post it", option_b: "Save it" },
  { text: "Finsta or keep it real on main?", option_a: "Finsta", option_b: "Main only" },
  { text: "Stories or posts?", option_a: "Stories", option_b: "Posts" },
  
  // Dating chaos
  { text: "First move: you or them?", option_a: "Me", option_b: "Them" },
  { text: "Date idea: fancy dinner or chaos activity?", option_a: "Fancy", option_b: "Chaos" },
  { text: "Check their socials before the date?", option_a: "Always", option_b: "Never" },
];

// Get a random hot take question for daily challenge
export function getDailyHotTake(): SpicyQuestion {
  const hotTakes = SPICY_QUESTIONS.filter(q => q.isHotTake);
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return hotTakes[dayOfYear % hotTakes.length];
}

// Get all questions (for seeding)
export function getAllSpicyQuestions(): SpicyQuestion[] {
  return SPICY_QUESTIONS;
}

// Get random sassy commentary based on percentage
export function getSassyCommentary(winningOption: string, percentage: number): string {
  if (percentage >= 80) {
    const landslide = [
      `${percentage}% chose ${winningOption}... not even close`,
      `${percentage}% agreement. The people have spoken.`,
      `${winningOption} by a LANDSLIDE (${percentage}%)`,
    ];
    return landslide[Math.floor(Math.random() * landslide.length)];
  }
  
  if (percentage >= 60) {
    const majority = [
      `${percentage}% chose ${winningOption}... you monsters`,
      `${winningOption} wins with ${percentage}%. Classic.`,
      `${percentage}% went with ${winningOption}. Peak hivemind.`,
    ];
    return majority[Math.floor(Math.random() * majority.length)];
  }
  
  // Close call (50-60%)
  const close = [
    `${percentage}% vs ${100 - percentage}%. Society is DIVIDED.`,
    `${winningOption} barely won (${percentage}%). Chaos.`,
    `A ${percentage}% squeaker. The discourse continues.`,
  ];
  return close[Math.floor(Math.random() * close.length)];
}


