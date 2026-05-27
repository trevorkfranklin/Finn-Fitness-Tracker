export const LEVELS = [
  { level: 1, name: 'Rookie', minXP: 0 },
  { level: 2, name: 'Scout Team', minXP: 300 },
  { level: 3, name: 'Practice Squad', minXP: 800 },
  { level: 4, name: 'Second String', minXP: 1600 },
  { level: 5, name: 'Starting Lineup', minXP: 2800 },
  { level: 6, name: 'Team Captain', minXP: 4500 },
  { level: 7, name: 'All-Star', minXP: 6500 },
  { level: 8, name: 'Hall of Famer', minXP: 9000 },
];

export function getLevelInfo(totalXP) {
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }

  if (!next) {
    return { ...current, progress: 100, xpInLevel: totalXP - current.minXP, xpToNext: 0, isMaxLevel: true };
  }

  const xpInLevel = totalXP - current.minXP;
  const xpForLevel = next.minXP - current.minXP;
  const progress = Math.min(100, Math.round((xpInLevel / xpForLevel) * 100));

  return { ...current, next, progress, xpInLevel, xpToNext: next.minXP - totalXP, isMaxLevel: false };
}

export const XP = {
  PER_SET: 5,
  EXERCISE_COMPLETE: 15,
  WORKOUT_COMPLETE: 75,
  PERSONAL_BEST_WEIGHT: 25,
  PERSONAL_BEST_REPS: 10,
  BONUS_PER_EXTRA_REP: 2, // capped
  MAX_BONUS_REPS: 5,
  STREAK_3: 25,
  STREAK_7: 75,
  STREAK_14: 150,
};

export const ACHIEVEMENT_DEFS = [
  {
    id: 'first-snap',
    name: 'First Snap',
    desc: 'Complete your very first workout',
    xpBonus: 50,
    check: (profile) => profile.workoutsCompleted >= 1,
  },
  {
    id: 'hat-trick',
    name: 'Hat Trick',
    desc: 'Complete 3 workouts in a row',
    xpBonus: 75,
    check: (profile) => profile.currentStreak >= 3,
  },
  {
    id: 'first-down',
    name: 'First Down',
    desc: 'Complete 10 total workouts',
    xpBonus: 100,
    check: (profile) => profile.workoutsCompleted >= 10,
  },
  {
    id: 'iron-man',
    name: 'Iron Man',
    desc: '7 workouts in a row — no days off!',
    xpBonus: 150,
    check: (profile) => profile.currentStreak >= 7,
  },
  {
    id: 'beast-mode',
    name: 'Beast Mode',
    desc: 'Complete 20 total workouts',
    xpBonus: 200,
    check: (profile) => profile.workoutsCompleted >= 20,
  },
  {
    id: 'record-setter',
    name: 'Record Setter',
    desc: 'Set your first personal best',
    xpBonus: 50,
    check: (profile) => profile.totalPersonalBests >= 1,
  },
  {
    id: 'record-breaker',
    name: 'Record Breaker',
    desc: 'Set 10 personal bests',
    xpBonus: 150,
    check: (profile) => profile.totalPersonalBests >= 10,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    desc: '14 workouts in a row — that\'s dedication!',
    xpBonus: 300,
    check: (profile) => profile.currentStreak >= 14,
  },
  {
    id: 'halfway',
    name: 'Halfway There',
    desc: 'Complete 30 total workouts',
    xpBonus: 250,
    check: (profile) => profile.workoutsCompleted >= 30,
  },
  {
    id: 'summer-champ',
    name: 'Summer Champion',
    desc: 'Complete the full 9-week program!',
    xpBonus: 500,
    check: (profile) => profile.workoutsCompleted >= 45,
  },
];

export function checkNewAchievements(profile, alreadyUnlocked) {
  const newOnes = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!alreadyUnlocked.includes(def.id) && def.check(profile)) {
      newOnes.push(def);
    }
  }
  return newOnes;
}

export const ENCOURAGEMENT = {
  setComplete: [
    'First down! Keep the drive going!',
    'That\'s what linemen are made of!',
    'Strong work! Hit the next one!',
    'Every rep builds a better blocker!',
    'Coach would give you 5 stars for that!',
    'Linemen are made in the off-season!',
    'That\'s championship effort right there!',
    'Your future teammates will thank you!',
    'Grind time! No stopping now!',
    'Beast! Keep that energy up!',
  ],
  personalBest: [
    'NEW PERSONAL RECORD! You just leveled up for real!',
    'RECORD SMASHED! The grind is paying off!',
    'STRONGER THAN YESTERDAY! That\'s the growth!',
    'NEW PERSONAL BEST! That\'s how champions are made!',
  ],
  workoutComplete: [
    'WORKOUT COMPLETE! You\'re built different!',
    'MISSION ACCOMPLISHED! The trenches would be proud!',
    'Full workout done! Champions are built in the summer!',
    'That\'s a wrap! You just got better than yesterday!',
    'ALL DONE! That\'s what separates starters from the bench!',
  ],
  restDay: [
    'Rest is part of training. Your muscles are growing!',
    'Recovery day well earned. Come back stronger tomorrow!',
    'Even the best linemen rest. Sleep, eat, grow.',
  ],
};

export function getRandomEncouragement(type) {
  const list = ENCOURAGEMENT[type] || ENCOURAGEMENT.setComplete;
  return list[Math.floor(Math.random() * list.length)];
}

export function calculateStreakBonus(streak) {
  if (streak >= 14) return XP.STREAK_14;
  if (streak >= 7) return XP.STREAK_7;
  if (streak >= 3) return XP.STREAK_3;
  return 0;
}
