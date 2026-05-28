import { supabase } from '../lib/supabase.js';

const PLAYER_ID_KEY = 'gg_player_id';

export function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

// ── Transform helpers ──────────────────────────────────────────────────────

function rowToProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    totalXP: row.total_xp ?? 0,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    workoutsCompleted: row.workouts_completed ?? 0,
    totalPersonalBests: row.total_personal_bests ?? 0,
    lastWorkoutDate: row.last_workout_date ?? null,
    createdAt: row.created_at,
  };
}

function profileToRow(profile) {
  return {
    id: getPlayerId(),
    name: profile.name,
    total_xp: profile.totalXP ?? 0,
    current_streak: profile.currentStreak ?? 0,
    longest_streak: profile.longestStreak ?? 0,
    workouts_completed: profile.workoutsCompleted ?? 0,
    total_personal_bests: profile.totalPersonalBests ?? 0,
    last_workout_date: profile.lastWorkoutDate ?? null,
  };
}

function rowToLog(row) {
  if (!row) return null;
  return {
    date: row.date,
    workoutType: row.workout_type,
    workoutName: row.workout_name,
    exercises: row.exercises ?? {},
    xpEarned: row.xp_earned ?? 0,
    completed: row.completed,
    aiGenerated: row.ai_generated,
    newPBs: row.new_pbs ?? [],
    completedAt: row.completed_at,
  };
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', getPlayerId())
    .maybeSingle();
  if (error) throw error;
  return rowToProfile(data);
}

export async function createProfile(name) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: getPlayerId(), name }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data);
}

export async function saveProfile(profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert(profileToRow(profile), { onConflict: 'id' });
  if (error) throw error;
}

// ── Workout logs ───────────────────────────────────────────────────────────

export async function getWorkoutLog(date) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('profile_id', getPlayerId())
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return rowToLog(data);
}

export async function saveWorkoutLog(log) {
  const { error } = await supabase
    .from('workout_logs')
    .upsert(
      {
        profile_id: getPlayerId(),
        date: log.date,
        workout_type: log.workoutType,
        workout_name: log.workoutName,
        exercises: log.exercises ?? {},
        xp_earned: log.xpEarned ?? 0,
        completed: log.completed ?? false,
        ai_generated: log.aiGenerated ?? false,
        new_pbs: log.newPBs ?? [],
        completed_at: log.completedAt ?? null,
      },
      { onConflict: 'profile_id,date' }
    );
  if (error) throw error;
}

export async function getCompletedDates() {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('date')
    .eq('profile_id', getPlayerId())
    .eq('completed', true);
  if (error) return [];
  return (data ?? []).map((r) => r.date);
}

export async function getRecentWorkouts(limit = 20) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('profile_id', getPlayerId())
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(rowToLog);
}

// ── Personal bests ─────────────────────────────────────────────────────────

export async function getPersonalBests() {
  const { data, error } = await supabase
    .from('personal_bests')
    .select('*')
    .eq('profile_id', getPlayerId());
  if (error) return {};
  return (data ?? []).reduce((acc, row) => {
    acc[row.exercise_id] = {
      maxWeight: row.max_weight,
      maxReps: row.max_reps,
      maxWeightDate: row.max_weight_date,
      maxRepsDate: row.max_reps_date,
    };
    return acc;
  }, {});
}

// currentPB is passed in to avoid an extra read during an active workout
export async function updatePersonalBest(exerciseId, { maxWeight, maxReps }, currentPB = {}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const row = {
    profile_id: getPlayerId(),
    exercise_id: exerciseId,
    max_weight: currentPB.maxWeight ?? null,
    max_reps: currentPB.maxReps ?? null,
    max_weight_date: currentPB.maxWeightDate ?? null,
    max_reps_date: currentPB.maxRepsDate ?? null,
  };

  if (maxWeight != null) { row.max_weight = maxWeight; row.max_weight_date = todayStr; }
  if (maxReps != null) { row.max_reps = maxReps; row.max_reps_date = todayStr; }

  const { error } = await supabase
    .from('personal_bests')
    .upsert(row, { onConflict: 'profile_id,exercise_id' });
  if (error) console.error('updatePersonalBest:', error);
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, total_xp, current_streak, workouts_completed')
    .order('total_xp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    totalXP: row.total_xp ?? 0,
    currentStreak: row.current_streak ?? 0,
    workoutsCompleted: row.workouts_completed ?? 0,
  }));
}

// ── Achievements ───────────────────────────────────────────────────────────

export async function getUnlockedAchievements() {
  const { data, error } = await supabase
    .from('unlocked_achievements')
    .select('achievement_id')
    .eq('profile_id', getPlayerId());
  if (error) return [];
  return (data ?? []).map((r) => r.achievement_id);
}

export async function saveUnlockedAchievements(achievementIds) {
  const existing = await getUnlockedAchievements();
  const newOnes = achievementIds.filter((id) => !existing.includes(id));
  if (newOnes.length === 0) return;
  const { error } = await supabase.from('unlocked_achievements').insert(
    newOnes.map((achievement_id) => ({ profile_id: getPlayerId(), achievement_id }))
  );
  if (error) console.error('saveUnlockedAchievements:', error);
}
