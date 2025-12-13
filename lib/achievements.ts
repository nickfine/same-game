import type { Achievement, AchievementId, User } from '../types';

// All available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // First-time achievements
  {
    id: 'first_vote',
    name: 'First Vote',
    description: 'Cast your first vote',
    icon: '🗳️',
    requirement: 1,
    category: 'voting',
  },
  {
    id: 'first_win',
    name: 'Mind Reader',
    description: 'Win your first vote',
    icon: '🔮',
    requirement: 1,
    category: 'winning',
  },
  {
    id: 'first_question',
    name: 'Curious Mind',
    description: 'Create your first question',
    icon: '❓',
    requirement: 1,
    category: 'creating',
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Hot Streak',
    description: 'Win 3 votes in a row',
    icon: '🔥',
    requirement: 3,
    category: 'streak',
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Win 5 votes in a row',
    icon: '💥',
    requirement: 5,
    category: 'streak',
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Win 10 votes in a row',
    icon: '⚡',
    requirement: 10,
    category: 'streak',
  },

  // Voting milestones
  {
    id: 'votes_10',
    name: 'Getting Started',
    description: 'Cast 10 votes',
    icon: '📊',
    requirement: 10,
    category: 'voting',
  },
  {
    id: 'votes_50',
    name: 'Regular Voter',
    description: 'Cast 50 votes',
    icon: '📈',
    requirement: 50,
    category: 'voting',
  },
  {
    id: 'votes_100',
    name: 'Vote Master',
    description: 'Cast 100 votes',
    icon: '🏆',
    requirement: 100,
    category: 'voting',
  },

  // Winning milestones
  {
    id: 'wins_10',
    name: 'Crowd Whisperer',
    description: 'Win 10 votes',
    icon: '🎯',
    requirement: 10,
    category: 'winning',
  },
  {
    id: 'wins_25',
    name: 'Trend Spotter',
    description: 'Win 25 votes',
    icon: '👁️',
    requirement: 25,
    category: 'winning',
  },
  {
    id: 'wins_50',
    name: 'Hive Mind',
    description: 'Win 50 votes',
    icon: '🧠',
    requirement: 50,
    category: 'winning',
  },

  // Question creation milestones
  {
    id: 'questions_5',
    name: 'Question Maker',
    description: 'Create 5 questions',
    icon: '✍️',
    requirement: 5,
    category: 'creating',
  },
  {
    id: 'questions_10',
    name: 'Prolific Asker',
    description: 'Create 10 questions',
    icon: '📝',
    requirement: 10,
    category: 'creating',
  },

  // Score milestones
  {
    id: 'score_10',
    name: 'Double Digits',
    description: 'Reach 10 points',
    icon: '🌟',
    requirement: 10,
    category: 'score',
  },
  {
    id: 'score_25',
    name: 'Rising Star',
    description: 'Reach 25 points',
    icon: '⭐',
    requirement: 25,
    category: 'score',
  },
  {
    id: 'score_50',
    name: 'High Roller',
    description: 'Reach 50 points',
    icon: '💫',
    requirement: 50,
    category: 'score',
  },
  {
    id: 'score_100',
    name: 'Century Club',
    description: 'Reach 100 points',
    icon: '🌠',
    requirement: 100,
    category: 'score',
  },
  
  // Secret badges
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Rise from the ashes - first successful streak revive',
    icon: '🔥',
    requirement: 1,
    category: 'secret',
    isSecret: true,
  },
];

// Get achievement by ID
export function getAchievement(id: AchievementId): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Check which achievements a user has earned based on their stats
export function checkAchievements(user: User, unlockedIds: Set<AchievementId>): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (unlockedIds.has(achievement.id)) continue;

    let earned = false;

    switch (achievement.id) {
      // First-time
      case 'first_vote':
        earned = user.votes_cast >= 1;
        break;
      case 'first_win':
        earned = user.votes_won >= 1;
        break;
      case 'first_question':
        earned = user.questions_created >= 1;
        break;

      // Streaks (use best_streak for permanent achievements)
      case 'streak_3':
        earned = user.best_streak >= 3;
        break;
      case 'streak_5':
        earned = user.best_streak >= 5;
        break;
      case 'streak_10':
        earned = user.best_streak >= 10;
        break;

      // Voting
      case 'votes_10':
        earned = user.votes_cast >= 10;
        break;
      case 'votes_50':
        earned = user.votes_cast >= 50;
        break;
      case 'votes_100':
        earned = user.votes_cast >= 100;
        break;

      // Winning
      case 'wins_10':
        earned = user.votes_won >= 10;
        break;
      case 'wins_25':
        earned = user.votes_won >= 25;
        break;
      case 'wins_50':
        earned = user.votes_won >= 50;
        break;

      // Creating
      case 'questions_5':
        earned = user.questions_created >= 5;
        break;
      case 'questions_10':
        earned = user.questions_created >= 10;
        break;

      // Score
      case 'score_10':
        earned = user.score >= 10;
        break;
      case 'score_25':
        earned = user.score >= 25;
        break;
      case 'score_50':
        earned = user.score >= 50;
        break;
      case 'score_100':
        earned = user.score >= 100;
        break;
        
      // Secret badges
      case 'phoenix':
        // Phoenix badge is granted manually when user first revives
        // Don't auto-unlock here - handled by streak manager
        earned = (user.total_revives ?? 0) >= 1;
        break;
    }

    if (earned) {
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}

// Get progress towards next achievement in each category
export function getAchievementProgress(user: User, unlockedIds: Set<AchievementId>) {
  const categories = ['voting', 'winning', 'creating', 'streak', 'score'] as const;
  const progress: Record<string, { current: number; next: Achievement | null; progress: number }> = {};

  for (const category of categories) {
    const categoryAchievements = ACHIEVEMENTS
      .filter(a => a.category === category)
      .sort((a, b) => a.requirement - b.requirement);

    // Find the next locked achievement
    const nextAchievement = categoryAchievements.find(a => !unlockedIds.has(a.id));

    let currentValue = 0;
    switch (category) {
      case 'voting':
        currentValue = user.votes_cast;
        break;
      case 'winning':
        currentValue = user.votes_won;
        break;
      case 'creating':
        currentValue = user.questions_created;
        break;
      case 'streak':
        currentValue = user.best_streak;
        break;
      case 'score':
        currentValue = user.score;
        break;
    }

    progress[category] = {
      current: currentValue,
      next: nextAchievement ?? null,
      progress: nextAchievement 
        ? Math.min(100, Math.round((currentValue / nextAchievement.requirement) * 100))
        : 100,
    };
  }

  return progress;
}

