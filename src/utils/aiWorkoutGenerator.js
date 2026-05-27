import { supabase } from '../lib/supabase.js';
import { EXERCISES } from '../data/exercises.js';
import { getWorkoutForDate, getProgramProgress } from './workoutGenerator.js';

export const AI_MODEL = 'deepseek/deepseek-v4-flash';

function buildSystemPrompt() {
  const exerciseList = Object.values(EXERCISES).map((ex) => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    muscles: ex.muscles,
    equipment: ex.equipment,
    hasWeight: ex.hasWeight,
    isTimed: !!ex.isTimed,
    perSide: !!ex.perSide,
    unit: ex.unit,
  }));

  return `You are Coach T — an intense, high-energy youth football strength coach who genuinely loves building up young athletes. You're creating a workout for a 12-year-old boy named Finn who is training hard for his FIRST tackle football season as a lineman. This is a big deal for him. Your job is to make him feel like a champion every single session.

ATHLETE PROFILE:
- Name: Finn, age 12, entering 7th grade
- Position: Lineman (offensive or defensive line)
- Goal: Build strength, conditioning, footwork, and confidence for his first tackle season
- Program: 9-week summer training (May 27 – July 31, 2026)
- This is his first season of tackle football — every workout is building toward something huge

AVAILABLE EQUIPMENT:
Smith machine (with landmine attachment), barbell + weight plates, dumbbells (various), 10 lb and 30 lb kettlebells, rowing machine, treadmill, agility ladder, cones, hurdles.

SAFETY RULES — NON-NEGOTIABLE:
- No 1-rep maxes or max-effort testing
- Form over weight, always
- No Olympic barbell lifts (no clean, snatch, jerk)
- Rest 60-90 sec between strength sets, 30-60 sec between conditioning sets
- Reps stay well within the athlete's capability

TONE — CRITICAL:
- Talk directly to Finn like a fired-up coach who believes in him
- Be specific, hype, and warm — like a great coach, not a robot
- Reference football: the snap, blocking, the line, first season, dominating on the field
- The coachNote should feel personal, not generic — tie it to where he is in the program
- Make him WANT to hit every single rep

EXERCISE LIBRARY — use ONLY these exercise IDs (do not invent new ones):
${JSON.stringify(exerciseList, null, 2)}

WORKOUT LENGTH: ~55 minutes. Include 6–9 exercises.

RESPONSE: Return ONLY valid JSON, no markdown fences, no extra text. Use this exact schema:
{
  "name": "Short punchy workout name (2-4 words, football-flavored)",
  "tagline": "One fired-up sentence addressed to Finn — football-themed, makes him want to crush it",
  "coachNote": "1-2 sentences from Coach T directly to Finn — specific to this week and phase, encouraging and personal",
  "exercises": [
    {
      "exerciseId": "id-from-library",
      "sets": 3,
      "targetReps": 10,
      "suggestedWeight": "45",
      "defaultWeight": null,
      "perSide": false,
      "isTimed": false,
      "notes": "Optional short motivating note shown under the exercise"
    }
  ]
}

Schema notes:
- targetReps: number OR array like [12,10,8] for descending-rep sets
- suggestedWeight: string in lbs, e.g. "45" or "65-75" — omit key if no weight
- isTimed: true → reps field = seconds
- perSide: true → reps are per side/leg/arm
- Always include dynamic-warmup as the first exercise`;
}

function buildUserPrompt(workoutType, phase, weekNumber, personalBests, playerName) {
  const typeDescriptions = {
    'lower-body': 'Lower Body Strength (squats, RDLs, lunges, goblet squats, core)',
    'upper-push': 'Upper Body Push + Agility (bench/shoulder pressing + ladder drills + shuttle runs)',
    'conditioning': 'Conditioning Circuit (rowing intervals, sprints, cone drills, bear crawls)',
    'upper-pull': 'Upper Body Pull + Core (rows, curls, triceps, planks, anti-rotation core)',
    'full-body-power': 'Full Body Power + Footwork (KB swings, landmine squat-press, jump squats, agility ladder, hurdles)',
    'active-recovery': 'Active Recovery (light cardio, mobility, low-intensity — 30-40 min only)',
  };

  const phaseDescriptions = {
    1: 'Foundation Phase (Weeks 1-3): Prioritize technique, lighter loads, higher reps (12-15). Build the movement patterns.',
    2: 'Build Phase (Weeks 4-6): Progressive overload, moderate loads, standard reps (8-12). Start challenging the athlete.',
    3: 'Power Phase (Weeks 7-9): Heavier loads, lower reps (5-8), explosive intent on every rep. Get game-ready.',
  };

  const pbLines = Object.entries(personalBests)
    .slice(0, 10)
    .map(([id, pb]) => {
      const ex = EXERCISES[id];
      if (!ex) return null;
      const parts = [];
      if (pb.maxWeight) parts.push(`${pb.maxWeight} lbs`);
      if (pb.maxReps) parts.push(`${pb.maxReps} reps`);
      return `  - ${ex.name}: ${parts.join(' × ')}`;
    })
    .filter(Boolean)
    .join('\n');

  return `Generate a ${typeDescriptions[workoutType] || workoutType} workout for Finn.

CONTEXT:
- Week ${weekNumber} of 9 — ${weekNumber <= 3 ? "he's just getting started, building the foundation" : weekNumber <= 6 ? "he's hitting his stride, time to push harder" : "final stretch, almost game-ready!"}
- ${phaseDescriptions[phase] ?? phaseDescriptions[1]}

${pbLines ? `FINN'S PERSONAL BESTS (use these to set weight suggestions slightly above what he's done before, when safe):\n${pbLines}` : "No personal bests recorded yet — use conservative beginner weights and tell him today is where his records start."}

Make Finn feel like the hardest-working lineman in the gym. Address him by name. Be specific about what this workout is building toward — his first season on the line.`;
}

// ── Cache (localStorage, keyed by date) ───────────────────────────────────

function cacheKey(date) {
  return `gg_ai_workout_${date.toISOString().split('T')[0]}`;
}

export function getCachedWorkout(date = new Date()) {
  try {
    const raw = localStorage.getItem(cacheKey(date));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCachedWorkout(date = new Date()) {
  localStorage.removeItem(cacheKey(date));
}

// ── Main generator ─────────────────────────────────────────────────────────

export async function generateAIWorkout(date = new Date(), profile = null, { force = false } = {}) {
  if (!force) {
    const cached = getCachedWorkout(date);
    if (cached) return cached;
  }

  const staticWorkout = getWorkoutForDate(date);
  const progress = getProgramProgress(date);
  const playerName = profile?.name ?? 'Athlete';

  // personalBests are passed in via profile augmentation by the caller,
  // or fetched here as a fallback (the caller should prefer passing them)
  const personalBests = profile?._personalBests ?? {};

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    staticWorkout.type,
    progress.phase ?? 1,
    progress.weekNumber ?? 1,
    personalBests,
    playerName
  );

  const { data, error } = await supabase.functions.invoke('generate-workout', {
    body: { messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] },
  });

  if (error) throw new Error(error.message ?? 'Edge Function error');

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from model');

  let generated;
  try {
    generated = JSON.parse(content);
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  const validExercises = (generated.exercises ?? []).filter((ex) => EXERCISES[ex.exerciseId]);

  const result = {
    ...staticWorkout,
    name: generated.name || staticWorkout.name,
    tagline: generated.tagline || staticWorkout.tagline,
    coachNote: generated.coachNote || staticWorkout.coachNote,
    exercises: validExercises.length >= 3 ? validExercises : staticWorkout.exercises,
    aiGenerated: true,
  };

  localStorage.setItem(cacheKey(date), JSON.stringify(result));
  return result;
}
