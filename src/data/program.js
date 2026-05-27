// Per-week workout schedule — each week has a different rotation so no two weeks feel the same.
// Index: [weekIndex 0-8][dayOfWeek 0-6]  (0=Sun always rest, 6=Sat always active-recovery)
export const WEEKLY_SCHEDULES = [
  // Wk 1 — Foundation
  ['rest', 'lower-body',     'upper-push',      'conditioning',    'upper-pull',      'full-body-power', 'active-recovery'],
  // Wk 2 — Foundation
  ['rest', 'upper-push',     'conditioning',    'lower-body',      'full-body-power', 'upper-pull',      'active-recovery'],
  // Wk 3 — Foundation
  ['rest', 'upper-pull',     'full-body-power', 'upper-push',      'conditioning',    'lower-body',      'active-recovery'],
  // Wk 4 — Build
  ['rest', 'conditioning',   'lower-body',      'full-body-power', 'upper-push',      'upper-pull',      'active-recovery'],
  // Wk 5 — Build
  ['rest', 'full-body-power','upper-pull',      'lower-body',      'upper-push',      'conditioning',    'active-recovery'],
  // Wk 6 — Build
  ['rest', 'lower-body',     'conditioning',    'upper-pull',      'full-body-power', 'upper-push',      'active-recovery'],
  // Wk 7 — Power
  ['rest', 'upper-push',     'lower-body',      'full-body-power', 'conditioning',    'upper-pull',      'active-recovery'],
  // Wk 8 — Power
  ['rest', 'full-body-power','upper-push',      'upper-pull',      'lower-body',      'conditioning',    'active-recovery'],
  // Wk 9 — Power
  ['rest', 'conditioning',   'full-body-power', 'lower-body',      'upper-pull',      'upper-push',      'active-recovery'],
];

// phase: 1=Foundation(wks1-3), 2=Build(wks4-6), 3=Power(wks7-9)
const getSets = (phase, base) => base + (phase >= 2 ? 1 : 0);
const getReps = (phase, foundation, build, power) =>
  phase === 1 ? foundation : phase === 2 ? build : power;

export const WORKOUT_TEMPLATES = {
  'lower-body': (phase) => ({
    type: 'lower-body',
    name: 'Lower Body Power',
    tagline: 'Strong legs drive every play. Let\'s build that foundation!',
    colorClass: 'from-emerald-600 to-emerald-800',
    accentColor: 'emerald',
    coachNote:
      phase === 1
        ? 'Week 1-3: Focus on FORM over weight. Get the movements perfect first!'
        : phase === 2
        ? 'Week 4-6: Now we load it up. Add weight each session when it feels right!'
        : 'Week 7-9: Power phase — explode on every rep like the snap just happened!',
    exercises: [
      { exerciseId: 'dynamic-warmup', sets: 1, targetReps: 5, isTimed: true, notes: '5 min full body warm-up' },
      {
        exerciseId: 'smith-squat',
        sets: getSets(phase, 3),
        targetReps: getReps(phase, 12, 10, 8),
        suggestedWeight: phase === 1 ? '45' : phase === 2 ? '65' : '85',
      },
      {
        exerciseId: 'barbell-rdl',
        sets: getSets(phase, 3),
        targetReps: getReps(phase, 12, 10, 8),
        suggestedWeight: phase === 1 ? '45' : phase === 2 ? '65' : '75',
      },
      {
        exerciseId: 'kb-goblet-squat',
        sets: 3,
        targetReps: getReps(phase, 12, 12, 10),
        defaultWeight: phase < 3 ? 30 : 30,
      },
      {
        exerciseId: 'db-lunges',
        sets: 3,
        targetReps: getReps(phase, 10, 10, 8),
        suggestedWeight: phase === 1 ? '15' : phase === 2 ? '20' : '25',
        perSide: true,
        notes: 'Reps per leg',
      },
      { exerciseId: 'plank', sets: 3, targetReps: getReps(phase, 30, 45, 60), isTimed: true },
      { exerciseId: 'dead-bug', sets: 3, targetReps: getReps(phase, 8, 10, 12) },
    ],
  }),

  'upper-push': (phase) => ({
    type: 'upper-push',
    name: 'Upper Body Push + Agility',
    tagline: 'Build that chest and drive defenders off the ball!',
    colorClass: 'from-blue-600 to-blue-800',
    accentColor: 'blue',
    coachNote:
      phase === 1
        ? 'Week 1-3: Control every rep. Slow on the way down, powerful on the way up!'
        : phase === 2
        ? 'Week 4-6: Chest up, add plates, dominate that bench!'
        : 'Week 7-9: Full explosiveness! Drive that bar like you\'re finishing a block!',
    exercises: [
      { exerciseId: 'dynamic-warmup', sets: 1, targetReps: 5, isTimed: true, notes: 'Focus on shoulder circles + arm swings' },
      {
        exerciseId: 'smith-bench',
        sets: getSets(phase, 3),
        targetReps: getReps(phase, 12, 10, 8),
        suggestedWeight: phase === 1 ? '45' : phase === 2 ? '65' : '85',
      },
      {
        exerciseId: 'db-shoulder-press',
        sets: 3,
        targetReps: getReps(phase, 12, 10, 10),
        suggestedWeight: phase === 1 ? '15' : phase === 2 ? '20' : '25',
      },
      {
        exerciseId: 'landmine-press',
        sets: 3,
        targetReps: getReps(phase, 10, 10, 8),
        suggestedWeight: phase === 1 ? '25' : phase === 2 ? '35' : '45',
        perSide: true,
        notes: 'Reps per arm',
      },
      {
        exerciseId: 'db-lateral-raise',
        sets: 3,
        targetReps: 12,
        suggestedWeight: phase === 1 ? '8' : '10',
      },
      { exerciseId: 'ladder-inout', sets: 3, targetReps: 2, notes: '2 passes each set' },
      { exerciseId: 'cone-5105', sets: 5, targetReps: 1, notes: 'Rest 45 sec between reps' },
    ],
  }),

  'conditioning': (phase) => ({
    type: 'conditioning',
    name: 'Conditioning Circuit',
    tagline: 'Champions last all 4 quarters. Let\'s build your engine!',
    colorClass: 'from-orange-500 to-red-700',
    accentColor: 'orange',
    coachNote:
      phase === 1
        ? 'Week 1-3: Build your base. Pace yourself — finish every interval!'
        : phase === 2
        ? 'Week 4-6: Push harder now! More volume, less rest, more gas!'
        : 'Week 7-9: You\'re nearly game-ready. Maximum effort every single interval!',
    exercises: [
      { exerciseId: 'treadmill-jog', sets: 1, targetReps: 5, isTimed: true, notes: 'Easy warm-up pace' },
      {
        exerciseId: 'rowing-intervals',
        sets: phase === 1 ? 5 : phase === 2 ? 6 : 8,
        targetReps: 250,
        notes: 'Hard 250m, then 1 min rest',
      },
      {
        exerciseId: 'mountain-climbers',
        sets: 3,
        targetReps: phase === 1 ? 15 : phase === 2 ? 20 : 25,
      },
      {
        exerciseId: 'bear-crawls',
        sets: phase === 1 ? 3 : 4,
        targetReps: 20,
        notes: '20 yards forward, walk back',
      },
      {
        exerciseId: 'cone-tdrill',
        sets: phase === 1 ? 5 : phase === 2 ? 6 : 8,
        targetReps: 1,
        notes: 'Rest 30 sec between reps',
      },
      {
        exerciseId: 'treadmill-sprint',
        sets: phase === 1 ? 6 : phase === 2 ? 8 : 10,
        targetReps: 20,
        isTimed: true,
        notes: '20 sec ALL-OUT, 40 sec walk',
      },
    ],
  }),

  'upper-pull': (phase) => ({
    type: 'upper-pull',
    name: 'Upper Body Pull + Core',
    tagline: 'Pull hard, hold strong. Your back is your armor!',
    colorClass: 'from-purple-600 to-purple-800',
    accentColor: 'purple',
    coachNote:
      phase === 1
        ? 'Week 1-3: Feel your back doing the work. Leave your ego at the door — form wins!'
        : phase === 2
        ? 'Week 4-6: Heavier rows = bigger back = better blocker. Let\'s get it!'
        : 'Week 7-9: Pull like you\'re ripping a defender off you. THAT\'S the energy!',
    exercises: [
      { exerciseId: 'dynamic-warmup', sets: 1, targetReps: 5, isTimed: true },
      {
        exerciseId: 'db-row',
        sets: getSets(phase, 3),
        targetReps: getReps(phase, 12, 12, 10),
        suggestedWeight: phase === 1 ? '20' : phase === 2 ? '30' : '35',
        perSide: true,
        notes: 'Reps per arm',
      },
      {
        exerciseId: 'smith-row',
        sets: getSets(phase, 3),
        targetReps: getReps(phase, 12, 10, 8),
        suggestedWeight: phase === 1 ? '45' : phase === 2 ? '65' : '75',
      },
      {
        exerciseId: 'db-curl',
        sets: 3,
        targetReps: 12,
        suggestedWeight: phase === 1 ? '15' : '20',
      },
      {
        exerciseId: 'db-tricep-ext',
        sets: 3,
        targetReps: 12,
        suggestedWeight: phase === 1 ? '15' : '20',
      },
      {
        exerciseId: 'russian-twist',
        sets: 3,
        targetReps: getReps(phase, 12, 15, 20),
        defaultWeight: 10,
      },
      {
        exerciseId: 'plank',
        sets: 3,
        targetReps: getReps(phase, 40, 50, 60),
        isTimed: true,
      },
      { exerciseId: 'dead-bug', sets: 3, targetReps: getReps(phase, 8, 10, 12) },
    ],
  }),

  'full-body-power': (phase) => ({
    type: 'full-body-power',
    name: 'Full Body Power + Footwork',
    tagline: 'GAME DAY ENERGY! Explode off the line every rep!',
    colorClass: 'from-amber-500 to-yellow-600',
    accentColor: 'amber',
    coachNote:
      phase === 1
        ? 'Week 1-3: Learn the explosive movements. Every rep should feel like a snap!'
        : phase === 2
        ? 'Week 4-6: More load, more power. Each rep is a tackle or a block — COMMIT!'
        : 'Week 7-9: Maximum power mode! You\'re almost game-ready. Give it everything!',
    exercises: [
      { exerciseId: 'dynamic-warmup', sets: 1, targetReps: 5, isTimed: true },
      {
        exerciseId: 'kb-swing',
        sets: phase === 1 ? 3 : 4,
        targetReps: getReps(phase, 12, 12, 15),
        defaultWeight: 30,
      },
      {
        exerciseId: 'landmine-squat-press',
        sets: 3,
        targetReps: getReps(phase, 8, 8, 6),
        suggestedWeight: phase === 1 ? '25' : phase === 2 ? '35' : '45',
        perSide: true,
        notes: 'Reps per side',
      },
      {
        exerciseId: 'db-jump-squat',
        sets: 3,
        targetReps: 10,
        defaultWeight: phase === 1 ? 10 : 15,
      },
      { exerciseId: 'ladder-highknees', sets: 4, targetReps: 2, notes: '2 passes each' },
      { exerciseId: 'hurdle-steps', sets: 3, targetReps: 2, notes: '2 passes each' },
      {
        exerciseId: 'cone-5105',
        sets: phase === 1 ? 5 : phase === 2 ? 6 : 8,
        targetReps: 1,
        notes: 'Max effort — go fast!',
      },
    ],
  }),

  'active-recovery': (phase) => ({
    type: 'active-recovery',
    name: 'Active Recovery',
    tagline: 'Rest is training! Your muscles grow during recovery.',
    colorClass: 'from-teal-600 to-cyan-700',
    accentColor: 'teal',
    coachNote: 'Keep it easy today. Light movement, stretch, recover. You earned it this week!',
    exercises: [
      {
        exerciseId: 'treadmill-jog',
        sets: 1,
        targetReps: 20,
        isTimed: true,
        notes: 'Easy jog or walk outside if it\'s nice!',
      },
      {
        exerciseId: 'dynamic-warmup',
        sets: 1,
        targetReps: 10,
        isTimed: true,
        notes: 'Full body mobility — really stretch it out',
      },
      {
        exerciseId: 'kb-swing',
        sets: 2,
        targetReps: 15,
        defaultWeight: 10,
        notes: 'Light! Focus 100% on perfect form.',
      },
      { exerciseId: 'ladder-lateral', sets: 3, targetReps: 2, notes: 'Slow and controlled today' },
    ],
  }),

  rest: () => ({
    type: 'rest',
    name: 'Rest Day',
    tagline: 'Champions rest too. Your body is building muscle RIGHT NOW!',
    colorClass: 'from-slate-600 to-slate-700',
    accentColor: 'slate',
    coachNote: 'Eat well, hydrate, sleep 8+ hours. You\'re growing stronger every minute you rest.',
    exercises: [],
  }),
};
