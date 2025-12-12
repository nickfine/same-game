// ═══════════════════════════════════════════════════════════════
// SAME APP - Emoji-First Question Bank
// Visual cocaine for the prediction game
// ═══════════════════════════════════════════════════════════════

export interface SpicyQuestion {
  optionA: string;
  emojiA: string;
  optionB: string;
  emojiB: string;
  spicyContext?: string;
  isHotTake?: boolean;
}

export const SPICY_QUESTIONS: SpicyQuestion[] = [
  // Time & Lifestyle
  { optionA: "MORNING", emojiA: "🌅", optionB: "NIGHT", emojiB: "🌙", spicyContext: "shower thoughts" },
  { optionA: "EARLY", emojiA: "⏰", optionB: "LATE", emojiB: "🦉", spicyContext: "sleep schedule" },
  { optionA: "WEEKDAY", emojiA: "💼", optionB: "WEEKEND", emojiB: "🎉", spicyContext: "vibes" },
  { optionA: "SUMMER", emojiA: "☀️", optionB: "WINTER", emojiB: "❄️", spicyContext: "seasons" },
  { optionA: "CITY", emojiA: "🏙️", optionB: "NATURE", emojiB: "🏕️", spicyContext: "escape" },
  
  // Food Wars
  { optionA: "COFFEE", emojiA: "☕", optionB: "TEA", emojiB: "🍵", spicyContext: "energy source" },
  { optionA: "PIZZA", emojiA: "🍕", optionB: "TACOS", emojiB: "🌮", spicyContext: "food fight" },
  { optionA: "SWEET", emojiA: "🍩", optionB: "SALTY", emojiB: "🍟", spicyContext: "snack attack" },
  { optionA: "BREAKFAST", emojiA: "🥞", optionB: "DINNER", emojiB: "🍝", spicyContext: "best meal" },
  { optionA: "SUSHI", emojiA: "🍣", optionB: "BURGER", emojiB: "🍔", spicyContext: "date night" },
  { optionA: "COOK", emojiA: "👨‍🍳", optionB: "ORDER", emojiB: "📱", spicyContext: "hungry vibes" },
  { optionA: "SPICY", emojiA: "🌶️", optionB: "MILD", emojiB: "🥛", spicyContext: "heat check" },
  { optionA: "PINEAPPLE", emojiA: "🍍", optionB: "NO", emojiB: "🚫", spicyContext: "on pizza", isHotTake: true },
  
  // Tech Tribes
  { optionA: "iPHONE", emojiA: "🍎", optionB: "ANDROID", emojiB: "🤖", spicyContext: "phone wars" },
  { optionA: "PC", emojiA: "🖥️", optionB: "CONSOLE", emojiB: "🎮", spicyContext: "gaming" },
  { optionA: "NETFLIX", emojiA: "📺", optionB: "YOUTUBE", emojiB: "▶️", spicyContext: "binge time" },
  { optionA: "SPOTIFY", emojiA: "🎵", optionB: "APPLE", emojiB: "🎧", spicyContext: "music" },
  { optionA: "INSTA", emojiA: "📸", optionB: "TIKTOK", emojiB: "🎬", spicyContext: "scroll life" },
  { optionA: "TEXT", emojiA: "💬", optionB: "CALL", emojiB: "📞", spicyContext: "contact" },
  
  // Social Behavior
  { optionA: "REPLY", emojiA: "⚡", optionB: "MARINATE", emojiB: "⏳", spicyContext: "texting style" },
  { optionA: "POST", emojiA: "📤", optionB: "LURK", emojiB: "👀", spicyContext: "social mode" },
  { optionA: "PARTY", emojiA: "🎊", optionB: "COUCH", emojiB: "🛋️", spicyContext: "friday night" },
  { optionA: "EARLY", emojiA: "🏃", optionB: "FASHIONABLY", emojiB: "💅", spicyContext: "arrival style" },
  { optionA: "OVERSHARE", emojiA: "🗣️", optionB: "MYSTERIOUS", emojiB: "🤫", spicyContext: "personality" },
  { optionA: "LEADER", emojiA: "👑", optionB: "VIBE", emojiB: "✌️", spicyContext: "group role" },
  
  // Philosophy & Life
  { optionA: "MONEY", emojiA: "💰", optionB: "TIME", emojiB: "⏰", spicyContext: "priorities" },
  { optionA: "FAME", emojiA: "⭐", optionB: "PRIVACY", emojiB: "🔒", spicyContext: "life goals" },
  { optionA: "RISK", emojiA: "🎲", optionB: "SAFE", emojiB: "🛡️", spicyContext: "life choices" },
  { optionA: "PAST", emojiA: "⏪", optionB: "FUTURE", emojiB: "⏩", spicyContext: "time travel" },
  { optionA: "HEAD", emojiA: "🧠", optionB: "HEART", emojiB: "❤️", spicyContext: "decisions" },
  { optionA: "OPTIMIST", emojiA: "😊", optionB: "REALIST", emojiB: "🤔", spicyContext: "outlook" },
  
  // Hot Takes
  { optionA: "OVER", emojiA: "✅", optionB: "UNDER", emojiB: "❌", spicyContext: "toilet paper", isHotTake: true },
  { optionA: "GIF", emojiA: "🎞️", optionB: "JIF", emojiB: "🥜", spicyContext: "pronunciation", isHotTake: true },
  { optionA: "WATER", emojiA: "💧", optionB: "NOT", emojiB: "🔥", spicyContext: "is wet?", isHotTake: true },
  { optionA: "HOTDOG", emojiA: "🌭", optionB: "NOPE", emojiB: "🙅", spicyContext: "is sandwich?", isHotTake: true },
  
  // Activities
  { optionA: "GYM", emojiA: "💪", optionB: "NAP", emojiB: "😴", spicyContext: "self care" },
  { optionA: "BEACH", emojiA: "🏖️", optionB: "MOUNTAIN", emojiB: "⛰️", spicyContext: "vacation" },
  { optionA: "READ", emojiA: "📚", optionB: "WATCH", emojiB: "🎬", spicyContext: "story time" },
  { optionA: "ROAD TRIP", emojiA: "🚗", optionB: "FLY", emojiB: "✈️", spicyContext: "travel" },
  { optionA: "PLAN", emojiA: "📋", optionB: "WING IT", emojiB: "🦅", spicyContext: "approach" },
  
  // Entertainment
  { optionA: "MARVEL", emojiA: "🦸", optionB: "DC", emojiB: "🦇", spicyContext: "heroes" },
  { optionA: "DOGS", emojiA: "🐕", optionB: "CATS", emojiB: "🐈", spicyContext: "pets" },
  { optionA: "HORROR", emojiA: "👻", optionB: "COMEDY", emojiB: "😂", spicyContext: "movie night" },
  { optionA: "FICTION", emojiA: "🧙", optionB: "REALITY", emojiB: "📰", spicyContext: "content" },
  { optionA: "LIVE", emojiA: "🎤", optionB: "STUDIO", emojiB: "🎚️", spicyContext: "music" },
  
  // Modern Life
  { optionA: "WFH", emojiA: "🏠", optionB: "OFFICE", emojiB: "🏢", spicyContext: "work life" },
  { optionA: "ELECTRIC", emojiA: "⚡", optionB: "GAS", emojiB: "⛽", spicyContext: "cars" },
  { optionA: "SAVE", emojiA: "🐷", optionB: "SPEND", emojiB: "💸", spicyContext: "money moves" },
  { optionA: "RAIN", emojiA: "🌧️", optionB: "SUN", emojiB: "☀️", spicyContext: "weather" },
  { optionA: "AI", emojiA: "🤖", optionB: "HUMAN", emojiB: "👤", spicyContext: "future", isHotTake: true },
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

