// ═══════════════════════════════════════════════════════════════
// SAME APP - Production Question Bank
// 100 screenshot-gold, personality-loaded questions
// Zero-text, emoji-first format locked in forever
// ═══════════════════════════════════════════════════════════════

export interface SpicyQuestion {
  optionA: string;
  emojiA: string;
  optionB: string;
  emojiB: string;
  category?: string;
  isHotTake?: boolean;
}

export const SPICY_QUESTIONS: SpicyQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // PERSONALITY CALLOUTS (20)
  // ═══════════════════════════════════════════════════════════════
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
  { optionA: "GASLIGHT", emojiA: "🔦", optionB: "GATEKEEP", emojiB: "🚪", category: "personality", isHotTake: true },
  { optionA: "NPC", emojiA: "🤖", optionB: "PROTAGONIST", emojiB: "⭐", category: "personality" },
  { optionA: "VILLAIN ERA", emojiA: "🦹", optionB: "HEALING ERA", emojiB: "🌸", category: "personality" },
  { optionA: "FERAL", emojiA: "🐺", optionB: "CIVILIZED", emojiB: "🎩", category: "personality" },
  { optionA: "BASED", emojiA: "💯", optionB: "CRINGE", emojiB: "😬", category: "personality" },
  { optionA: "SLAY", emojiA: "⚔️", optionB: "SURVIVE", emojiB: "🏃", category: "personality" },
  { optionA: "ICONIC", emojiA: "🏆", optionB: "FORGETTABLE", emojiB: "👻", category: "personality" },
  { optionA: "BOLD", emojiA: "🦁", optionB: "CAUTIOUS", emojiB: "🐢", category: "personality" },
  { optionA: "REAL", emojiA: "💎", optionB: "FAKE", emojiB: "🎭", category: "personality" },

  // ═══════════════════════════════════════════════════════════════
  // LIFESTYLE CHOICES (20)
  // ═══════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL & DATING (15)
  // ═══════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════
  // FOOD WARS (10)
  // ═══════════════════════════════════════════════════════════════
  { optionA: "SWEET", emojiA: "🍩", optionB: "SALTY", emojiB: "🍟", category: "food" },
  { optionA: "BRUNCH", emojiA: "🥞", optionB: "DINNER", emojiB: "🍝", category: "food" },
  { optionA: "MATCHA", emojiA: "🍵", optionB: "COFFEE", emojiB: "☕", category: "food" },
  { optionA: "SUSHI", emojiA: "🍣", optionB: "PIZZA", emojiB: "🍕", category: "food" },
  { optionA: "COOK", emojiA: "👨‍🍳", optionB: "ORDER", emojiB: "🛵", category: "food" },
  { optionA: "SPICY", emojiA: "🌶️", optionB: "MILD", emojiB: "🥛", category: "food" },
  { optionA: "PINEAPPLE", emojiA: "🍍", optionB: "NO WAY", emojiB: "🙅", category: "food", isHotTake: true },
  { optionA: "WELL DONE", emojiA: "🔥", optionB: "RARE", emojiB: "🩸", category: "food", isHotTake: true },
  { optionA: "BONE IN", emojiA: "🦴", optionB: "BONELESS", emojiB: "🍗", category: "food" },
  { optionA: "RANCH", emojiA: "🥛", optionB: "NO RANCH", emojiB: "❌", category: "food" },

  // ═══════════════════════════════════════════════════════════════
  // TECH & CULTURE (15)
  // ═══════════════════════════════════════════════════════════════
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
  { optionA: "AI", emojiA: "🤖", optionB: "HUMAN", emojiB: "👤", category: "tech", isHotTake: true },
  { optionA: "VIRAL", emojiA: "📈", optionB: "AUTHENTIC", emojiB: "💚", category: "tech" },
  { optionA: "MAIN", emojiA: "👤", optionB: "FINSTA", emojiB: "🥷", category: "tech" },

  // ═══════════════════════════════════════════════════════════════
  // HOT TAKES & CHAOS (20)
  // ═══════════════════════════════════════════════════════════════
  { optionA: "GIF", emojiA: "🎞️", optionB: "JIF", emojiB: "🥜", category: "hottake", isHotTake: true },
  { optionA: "WATER WET", emojiA: "💧", optionB: "WATER NOT", emojiB: "🔥", category: "hottake", isHotTake: true },
  { optionA: "HOTDOG SANDWICH", emojiA: "🌭", optionB: "HOTDOG NOT", emojiB: "🙅", category: "hottake", isHotTake: true },
  { optionA: "TOILET OVER", emojiA: "✅", optionB: "TOILET UNDER", emojiB: "❌", category: "hottake", isHotTake: true },
  { optionA: "CEREAL FIRST", emojiA: "🥣", optionB: "MILK FIRST", emojiB: "🥛", category: "hottake", isHotTake: true },
  { optionA: "SHOWER AM", emojiA: "🌅", optionB: "SHOWER PM", emojiB: "🌙", category: "hottake" },
  { optionA: "SOCKS BED", emojiA: "🧦", optionB: "NO SOCKS", emojiB: "🦶", category: "hottake" },
  { optionA: "PHONE FACE UP", emojiA: "📱", optionB: "FACE DOWN", emojiB: "🔻", category: "hottake" },
  { optionA: "REPLY ALL", emojiA: "📧", optionB: "NEVER", emojiB: "🚫", category: "hottake" },
  { optionA: "LOUD CHEWER", emojiA: "😤", optionB: "FORGIVABLE", emojiB: "🤷", category: "hottake", isHotTake: true },
  { optionA: "OPEN MOUTH", emojiA: "😮", optionB: "CHEW CLOSED", emojiB: "😶", category: "hottake" },
  { optionA: "RECLINER", emojiA: "💺", optionB: "RESPECT SPACE", emojiB: "🧘", category: "hottake", isHotTake: true },
  { optionA: "STEAL FRIES", emojiA: "🍟", optionB: "ASK FIRST", emojiB: "🙋", category: "hottake" },
  { optionA: "CROCS VALID", emojiA: "🐊", optionB: "CROCS NO", emojiB: "❌", category: "hottake", isHotTake: true },
  { optionA: "CARGO PANTS", emojiA: "👖", optionB: "FASHION CRIME", emojiB: "🚨", category: "hottake" },
  { optionA: "AISLE", emojiA: "🚶", optionB: "WINDOW", emojiB: "🪟", category: "hottake" },
  { optionA: "FRONT SEAT", emojiA: "🚗", optionB: "BACK SEAT", emojiB: "🔙", category: "hottake" },
  { optionA: "QUEUE JUMPER", emojiA: "😈", optionB: "WAIT", emojiB: "😇", category: "hottake", isHotTake: true },
  { optionA: "READ RECEIPTS", emojiA: "✓✓", optionB: "CHAOS", emojiB: "❓", category: "hottake" },
  { optionA: "FOLD", emojiA: "📂", optionB: "SCRUNCH", emojiB: "🧻", category: "hottake", isHotTake: true },
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

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

// Get questions by category
export function getQuestionsByCategory(category: string): SpicyQuestion[] {
  return SPICY_QUESTIONS.filter(q => q.category === category);
}

// Get random question
export function getRandomQuestion(): SpicyQuestion {
  return SPICY_QUESTIONS[Math.floor(Math.random() * SPICY_QUESTIONS.length)];
}

// Get random sassy commentary based on percentage
export function getSassyCommentary(winningOption: string, percentage: number): string {
  if (percentage >= 85) {
    const landslide = [
      `${percentage}% chose ${winningOption}... it's giving unanimous`,
      `${percentage}% agreement. no notes.`,
      `${winningOption} ATE (${percentage}%)`,
      `${percentage}%?? this is a MOVEMENT`,
    ];
    return landslide[Math.floor(Math.random() * landslide.length)];
  }
  
  if (percentage >= 70) {
    const strong = [
      `${percentage}% went ${winningOption}... the math is mathing`,
      `${winningOption} understood the assignment (${percentage}%)`,
      `${percentage}% chose violence... in a good way`,
    ];
    return strong[Math.floor(Math.random() * strong.length)];
  }
  
  if (percentage >= 60) {
    const majority = [
      `${percentage}% chose ${winningOption}... interesting`,
      `${winningOption} wins with ${percentage}%. era defined.`,
      `${percentage}% hivemind activated`,
    ];
    return majority[Math.floor(Math.random() * majority.length)];
  }
  
  // Close call (50-60%)
  const close = [
    `${percentage}% vs ${100 - percentage}%. DIVISION.`,
    `${winningOption} BARELY (${percentage}%). chaos.`,
    `${percentage}%?? we're SPLIT. discourse incoming.`,
    `a ${percentage}% squeaker. society is fracturing.`,
  ];
  return close[Math.floor(Math.random() * close.length)];
}
