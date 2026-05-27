import { useState, useEffect, useRef } from 'react';
import ExerciseCard from '../components/ExerciseCard.jsx';
import { getWorkoutForDate } from '../utils/workoutGenerator.js';
import { generateAIWorkout, clearCachedWorkout } from '../utils/aiWorkoutGenerator.js';
import {
  getWorkoutLog,
  saveWorkoutLog,
  saveProfile,
  getPersonalBests,
  getRecentWorkouts,
  updatePersonalBest,
  getUnlockedAchievements,
  saveUnlockedAchievements,
} from '../utils/db.js';
import {
  XP,
  getRandomEncouragement,
  checkNewAchievements,
  calculateStreakBonus,
} from '../utils/points.js';

export default function WorkoutPage({ profile, onProfileUpdate, onNavigate }) {
  const today = useRef(new Date()).current;
  const todayStr = today.toISOString().split('T')[0];

  const [workout, setWorkout] = useState(null);
  const [loadingState, setLoadingState] = useState('loading');
  const [aiError, setAiError] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [personalBests, setPersonalBests] = useState({});
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [sessionData, setSessionData] = useState({});
  const [sessionXP, setSessionXP] = useState(0);
  const [flashXP, setFlashXP] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [newPBs, setNewPBs] = useState([]);
  const flashTimeout = useRef(null);

  // Load personal bests + recent history on mount
  useEffect(() => {
    Promise.all([getPersonalBests(), getRecentWorkouts(7)])
      .then(([pbs, recent]) => {
        setPersonalBests(pbs);
        setRecentWorkouts(recent);
      })
      .catch(() => {});
  }, []);

  const loadWorkout = async (force = false) => {
    setLoadingState('loading');
    setAiError(null);
    try {
      const profileWithData = { ...profile, _personalBests: personalBests, _recentWorkouts: recentWorkouts };
      const w = await generateAIWorkout(today, profileWithData, { force });
      setWorkout(w);
      setLoadingState('ready');
    } catch (err) {
      setAiError(err.message);
      setWorkout(getWorkoutForDate(today));
      setLoadingState('error');
    }
  };

  useEffect(() => {
    loadWorkout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Init session sets whenever workout loads
  useEffect(() => {
    if (!workout?.exercises) return;
    const data = {};
    workout.exercises.forEach((ex) => {
      const pb = personalBests[ex.exerciseId] || {};
      const defaultW = ex.defaultWeight
        ? String(ex.defaultWeight)
        : ex.suggestedWeight
        ? String(ex.suggestedWeight).split('-')[0]
        : pb.maxWeight
        ? String(pb.maxWeight)
        : '';
      data[ex.exerciseId] = Array.from({ length: ex.sets }, () => ({
        reps: '',
        weight: defaultW,
        completed: false,
      }));
    });
    setSessionData(data);
    if (workout.exercises.length > 0) setExpandedExercise(workout.exercises[0].exerciseId);
  }, [workout]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    clearCachedWorkout(today);
    setSessionXP(0);
    setNewPBs([]);
    await loadWorkout(true);
    setIsRegenerating(false);
  };

  if (loadingState === 'loading') return <WorkoutLoadingScreen />;

  if (workout?.type === 'rest') return <RestDayView onNavigate={onNavigate} />;

  const existingLog = null; // checked async below — handled by WorkoutAlreadyDoneGuard

  const allExercisesComplete =
    workout?.exercises?.length > 0 &&
    workout.exercises.every((ex) => {
      const sets = sessionData[ex.exerciseId];
      return sets && sets.length === ex.sets && sets.every((s) => s.completed);
    });

  const completedSetCount = Object.values(sessionData).reduce(
    (acc, sets) => acc + (sets?.filter((s) => s.completed).length || 0), 0
  );
  const totalSetCount = workout?.exercises?.reduce((a, ex) => a + ex.sets, 0) || 0;

  const showFlash = (xp, message) => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    setFlashXP(xp);
    setFlashMessage(message);
    flashTimeout.current = setTimeout(() => { setFlashXP(null); setFlashMessage(null); }, 2200);
  };

  const handleSetComplete = (exerciseId, setIndex, reps, weight) => {
    const pb = personalBests[exerciseId] || {};
    let xpEarned = XP.PER_SET;
    let isPBWeight = false;
    let isPBReps = false;
    let message = getRandomEncouragement('setComplete');

    const repsNum = parseInt(reps) || 0;
    const weightNum = parseFloat(weight) || 0;

    if (weightNum > 0 && weightNum > (pb.maxWeight || 0)) {
      xpEarned += XP.PERSONAL_BEST_WEIGHT;
      isPBWeight = true;
      message = getRandomEncouragement('personalBest');
      const updated = { ...pb, maxWeight: weightNum, maxReps: Math.max(repsNum, pb.maxReps || 0) };
      setPersonalBests((prev) => ({ ...prev, [exerciseId]: updated }));
      updatePersonalBest(exerciseId, { maxWeight: weightNum, maxReps: repsNum }, pb).catch(console.error);
      setNewPBs((prev) => [...prev, { exerciseId, type: 'weight', value: weightNum }]);
    } else if (repsNum > 0 && !weightNum && repsNum > (pb.maxReps || 0)) {
      xpEarned += XP.PERSONAL_BEST_REPS;
      isPBReps = true;
      message = getRandomEncouragement('personalBest');
      setPersonalBests((prev) => ({ ...prev, [exerciseId]: { ...pb, maxReps: repsNum } }));
      updatePersonalBest(exerciseId, { maxReps: repsNum }, pb).catch(console.error);
    }

    const workoutEx = workout?.exercises?.find((e) => e.exerciseId === exerciseId);
    const targetReps = workoutEx
      ? Array.isArray(workoutEx.targetReps) ? workoutEx.targetReps[setIndex] : workoutEx.targetReps
      : 0;
    if (repsNum > targetReps) {
      xpEarned += Math.min(repsNum - targetReps, XP.MAX_BONUS_REPS) * XP.BONUS_PER_EXTRA_REP;
    }

    setSessionData((prev) => {
      const updated = { ...prev };
      const exSets = [...(updated[exerciseId] || [])];
      exSets[setIndex] = { reps, weight, completed: true, isPBWeight, isPBReps };
      updated[exerciseId] = exSets;

      if (exSets.length === workoutEx?.sets && exSets.every((s) => s.completed)) {
        xpEarned += XP.EXERCISE_COMPLETE;
        const exercises = workout?.exercises || [];
        const nextEx = exercises.find((e, i) =>
          i > exercises.findIndex((x) => x.exerciseId === exerciseId) &&
          !(updated[e.exerciseId]?.every((s) => s.completed))
        );
        if (nextEx) setTimeout(() => setExpandedExercise(nextEx.exerciseId), 200);
      }
      return updated;
    });

    setSessionXP((prev) => prev + xpEarned);
    showFlash(xpEarned, message);
  };

  const handleCompleteWorkout = async () => {
    const bonusXP = XP.WORKOUT_COMPLETE;
    const streakBonusXP = calculateStreakBonus((profile?.currentStreak || 0) + 1);
    const totalXP = sessionXP + bonusXP + streakBonusXP;

    const todayDate = new Date();
    const lastDate = profile?.lastWorkoutDate ? new Date(profile.lastWorkoutDate) : null;
    let newStreak = 1;
    if (lastDate) {
      const diff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (diff === 1 || (diff === 2 && lastDate.getDay() === 6)) newStreak = (profile.currentStreak || 0) + 1;
    }

    const updatedProfile = {
      ...profile,
      totalXP: (profile?.totalXP || 0) + totalXP,
      currentStreak: newStreak,
      longestStreak: Math.max(profile?.longestStreak || 0, newStreak),
      lastWorkoutDate: todayStr,
      workoutsCompleted: (profile?.workoutsCompleted || 0) + 1,
      totalPersonalBests: (profile?.totalPersonalBests || 0) + newPBs.length,
    };

    // Update UI immediately
    onProfileUpdate(updatedProfile);
    const alreadyUnlocked = await getUnlockedAchievements();
    const newAchievements = checkNewAchievements(updatedProfile, alreadyUnlocked);
    setCompletionData({ totalXP, bonusXP, streakBonusXP, newAchievements, newStreak });
    setShowCompletion(true);

    // Persist to Supabase in background
    const log = {
      date: todayStr,
      workoutType: workout.type,
      workoutName: workout.name,
      exercises: sessionData,
      xpEarned: totalXP,
      completedAt: Date.now(),
      completed: true,
      newPBs,
      aiGenerated: !!workout.aiGenerated,
    };
    saveWorkoutLog(log).catch(console.error);
    saveProfile(updatedProfile).catch(console.error);
    if (newAchievements.length > 0) {
      saveUnlockedAchievements([...alreadyUnlocked, ...newAchievements.map((a) => a.id)]).catch(console.error);
    }
  };

  if (showCompletion && completionData) {
    return (
      <CompletionScreen
        data={completionData}
        sessionXP={sessionXP}
        workout={workout}
        newPBs={newPBs}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className={`bg-gradient-to-br ${workout.colorClass} px-4 pt-6 pb-5`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Week {workout.weekNumber} · Phase {workout.phase}
            </p>
            <h1 className="font-display text-3xl text-white mt-1">{workout.name}</h1>
            <p className="text-white/80 text-sm mt-1">{workout.tagline}</p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Generate a new workout"
            className="flex-shrink-0 mt-1 bg-black/20 hover:bg-black/30 active:scale-95 text-white/80 hover:text-white rounded-xl p-2 transition-all disabled:opacity-40"
          >
            <svg className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="mt-2">
          {workout.aiGenerated ? (
            <span className="inline-flex items-center gap-1 bg-black/20 text-white/70 text-xs font-semibold px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI-Generated
            </span>
          ) : aiError ? (
            <span className="inline-flex items-center gap-1 bg-black/20 text-amber-300/80 text-xs font-semibold px-2 py-0.5 rounded-full">
              Using backup plan
            </span>
          ) : null}
        </div>
      </div>

      {/* Live XP + progress bar */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-black text-xl">+{sessionXP}</span>
          <span className="text-slate-400 text-sm font-semibold">XP earned</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">{completedSetCount}/{totalSetCount} sets</span>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: totalSetCount > 0 ? `${(completedSetCount / totalSetCount) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Flash XP popup */}
      {flashXP !== null && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center">
          <div className="animate-xp-pop">
            <span className="bg-amber-400 text-slate-900 font-black text-xl px-4 py-2 rounded-xl shadow-lg">
              +{flashXP} XP
            </span>
          </div>
          {flashMessage && (
            <p className="text-white font-bold text-sm mt-2 bg-slate-800/90 px-3 py-1 rounded-lg">
              {flashMessage}
            </p>
          )}
        </div>
      )}

      {workout.coachNote && (
        <div className="mx-4 mt-4 bg-amber-950/30 border border-amber-700/30 rounded-xl p-3">
          <p className="text-amber-300 text-sm">
            <span className="font-bold">Coach: </span>{workout.coachNote}
          </p>
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {workout.exercises?.map((ex) => (
          <ExerciseCard
            key={ex.exerciseId}
            workoutExercise={ex}
            sessionSets={sessionData[ex.exerciseId]}
            pb={personalBests[ex.exerciseId] || {}}
            onSetComplete={handleSetComplete}
            isExpanded={expandedExercise === ex.exerciseId}
            onToggle={() => setExpandedExercise(expandedExercise === ex.exerciseId ? null : ex.exerciseId)}
          />
        ))}
      </div>

      <div className="px-4 mt-6">
        {allExercisesComplete ? (
          <button onClick={handleCompleteWorkout} className="btn-gold w-full text-center animate-pulse-once">
            COMPLETE WORKOUT! +{XP.WORKOUT_COMPLETE} BONUS XP
          </button>
        ) : (
          <p className="text-center text-slate-500 text-sm">Complete all sets to finish the workout</p>
        )}
      </div>
    </div>
  );
}

// ── Sub-screens ────────────────────────────────────────────────────────────

function WorkoutLoadingScreen() {
  const msgs = ['Calling Coach AI...', 'Dialing up your perfect workout...', 'Building the game plan...', 'Loading the playbook...'];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400 fill-emerald-400" viewBox="0 0 24 24">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
        </div>
      </div>
      <div>
        <h2 className="font-display text-4xl text-white">COACH AI</h2>
        <p className="text-slate-400 mt-2 text-base">{msg}</p>
      </div>
    </div>
  );
}

function RestDayView({ onNavigate }) {
  return (
    <div className="pb-nav px-4 pt-8 max-w-lg mx-auto text-center space-y-6">
      <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
        <h2 className="font-display text-4xl text-slate-300">REST DAY</h2>
        <p className="text-slate-400 mt-3 text-base leading-relaxed">
          Sunday is your recovery day. Your muscles are growing and repairing right now. Rest up, eat well, and come back Monday ready to DOMINATE!
        </p>
        <div className="mt-6 bg-amber-950/30 border border-amber-700/30 rounded-xl p-4">
          <p className="text-amber-400 font-bold text-sm mb-1">Recovery Tip</p>
          <p className="text-slate-300 text-sm">Aim for 9-10 hours of sleep tonight. Most muscle growth happens while you sleep!</p>
        </div>
      </div>
      <button onClick={() => onNavigate('dashboard')} className="btn-secondary w-full">Back to Home</button>
    </div>
  );
}

function CompletionScreen({ data, sessionXP, workout, newPBs, onNavigate }) {
  const { totalXP, bonusXP, streakBonusXP, newAchievements, newStreak } = data;
  const messages = [
    'You just got better than you were yesterday. That\'s what winners do!',
    'Champions are made in the summer. You\'re becoming one right now!',
    'Every great lineman put in this exact work. You\'re on the path!',
    'The grind is paying off. Keep showing up and you\'ll be unstoppable!',
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className={`bg-gradient-to-br ${workout.colorClass} rounded-3xl p-6 text-center`}>
        <p className="text-white/70 font-semibold uppercase tracking-widest text-sm">Workout Complete!</p>
        <h1 className="font-display text-5xl text-white mt-2">{workout.name}</h1>
        <div className="mt-4 bg-black/20 rounded-2xl p-4">
          <p className="text-white/70 text-sm">Total XP Earned</p>
          <p className="text-amber-400 font-black text-5xl">{totalXP}</p>
        </div>
      </div>

      <div className="card space-y-2">
        <h3 className="text-white font-bold text-lg mb-3">XP Breakdown</h3>
        <XPRow label="Sets completed" value={sessionXP} />
        <XPRow label="Workout completion bonus" value={bonusXP} highlight />
        {streakBonusXP > 0 && <XPRow label={`${newStreak}-day streak bonus`} value={streakBonusXP} highlight />}
        {newPBs.length > 0 && <XPRow label={`${newPBs.length} personal best${newPBs.length > 1 ? 's' : ''}!`} value="included" isPB />}
        <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
          <span className="text-white font-bold">Total</span>
          <span className="text-amber-400 font-black text-xl">{totalXP} XP</span>
        </div>
      </div>

      {newPBs.length > 0 && (
        <div className="card border-amber-500/40 bg-amber-950/20">
          <h3 className="text-amber-400 font-bold text-lg mb-2">Personal Bests!</h3>
          {newPBs.map((pb, i) => (
            <p key={i} className="text-white text-sm">
              {pb.exerciseId.replace(/-/g, ' ')} — new {pb.type}: {pb.value}{pb.type === 'weight' ? ' lbs' : ' reps'}
            </p>
          ))}
        </div>
      )}

      {newAchievements?.length > 0 && (
        <div className="card border-emerald-500/40 bg-emerald-950/20 space-y-2">
          <h3 className="text-emerald-400 font-bold text-lg">Achievement Unlocked!</h3>
          {newAchievements.map((a) => (
            <div key={a.id} className="flex justify-between items-center">
              <div>
                <p className="text-white font-bold">{a.name}</p>
                <p className="text-slate-400 text-sm">{a.desc}</p>
              </div>
              <span className="text-amber-400 font-bold">+{a.xpBonus} XP</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
        <p className="text-slate-300 text-base italic">"{msg}"</p>
      </div>

      {newStreak > 1 && (
        <div className="card text-center border-orange-500/40 bg-orange-950/20">
          <p className="text-orange-400 font-black text-3xl">{newStreak}</p>
          <p className="text-white font-bold">Day Streak!</p>
          <p className="text-slate-400 text-sm">Keep it going — tomorrow is another day to level up!</p>
        </div>
      )}

      <button onClick={() => onNavigate('dashboard')} className="btn-gold w-full text-center">BACK TO HOME</button>
    </div>
  );
}

function XPRow({ label, value, highlight, isPB }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={isPB ? 'text-amber-300' : 'text-slate-300'}>{label}</span>
      <span className={`font-bold ${highlight || isPB ? 'text-amber-400' : 'text-white'}`}>
        {typeof value === 'number' ? `+${value} XP` : value}
      </span>
    </div>
  );
}
