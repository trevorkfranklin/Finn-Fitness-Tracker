import { useState, useEffect, useMemo } from 'react';
import XPBar from '../components/XPBar.jsx';
import { getWorkoutForDate, getProgramProgress, formatDate, getPhaseLabel } from '../utils/workoutGenerator.js';
import { getWorkoutLog, getCompletedDates } from '../utils/db.js';
import { EXERCISES } from '../data/exercises.js';

export default function Dashboard({ profile, onNavigate }) {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split('T')[0];
  const workout = useMemo(() => getWorkoutForDate(today), [today]);
  const progress = useMemo(() => getProgramProgress(today), [today]);

  const [todayLog, setTodayLog] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    Promise.all([getWorkoutLog(todayStr), getCompletedDates()]).then(([log, dates]) => {
      setTodayLog(log);
      setCompletedCount(dates.length);
    }).catch(() => {});
  }, [todayStr]);

  const isRestDay = workout.type === 'rest';

  const accentColors = {
    emerald: { border: 'border-emerald-500/50' },
    blue: { border: 'border-blue-500/50' },
    orange: { border: 'border-orange-500/50' },
    purple: { border: 'border-purple-500/50' },
    amber: { border: 'border-amber-500/50' },
    teal: { border: 'border-teal-500/50' },
    slate: { border: 'border-slate-500/50' },
  };
  const colors = accentColors[workout.accentColor] || accentColors.emerald;

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl text-white leading-none tracking-wide">GRIDIRON</h1>
          <h1 className="font-display text-4xl text-emerald-400 leading-none tracking-wide">GAINS</h1>
          <p className="text-slate-400 text-sm mt-1">{formatDate(today)}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-black text-2xl">{profile?.name || 'Athlete'}</p>
          {(profile?.currentStreak || 0) > 0 && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-orange-400 font-black">{profile.currentStreak}</span>
              <span className="text-orange-400 text-sm font-semibold">day streak</span>
              <svg className="w-4 h-4 text-orange-400 fill-orange-400" viewBox="0 0 24 24">
                <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <XPBar totalXP={profile?.totalXP || 0} />

      {/* Program progress bar */}
      {progress.started && !progress.completed && (
        <div className="card flex items-center gap-4">
          <div className="flex-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Summer Program</p>
            <p className="text-white font-bold">
              Week {progress.weekNumber} of 9 —{' '}
              <span className="text-emerald-400">{getPhaseLabel(progress.phase)}</span>
            </p>
            <div className="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <span className="text-white font-black text-2xl">{completedCount}</span>
            <p className="text-slate-400 text-xs">workouts done</p>
          </div>
        </div>
      )}

      {progress.completed && (
        <div className="card bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-amber-500/50">
          <p className="font-display text-3xl text-amber-400">SUMMER CHAMPION!</p>
          <p className="text-slate-300 text-sm mt-1">You completed the full 9-week program. Season ready!</p>
        </div>
      )}

      {/* Today's workout card */}
      {isRestDay ? (
        <RestDayCard />
      ) : todayLog?.completed ? (
        <CompletedTodayCard log={todayLog} onNavigate={onNavigate} />
      ) : (
        <TodayWorkoutCard workout={workout} colors={colors} onNavigate={onNavigate} />
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Workouts" value={profile?.workoutsCompleted || 0} color="text-emerald-400" />
        <StatCard label="Best Streak" value={`${profile?.longestStreak || 0}d`} color="text-orange-400" />
        <StatCard label="Personal Bests" value={profile?.totalPersonalBests || 0} color="text-amber-400" />
      </div>
    </div>
  );
}

function TodayWorkoutCard({ workout, colors, onNavigate }) {
  const preview = workout.exercises?.slice(0, 4) || [];
  return (
    <div className={`rounded-2xl overflow-hidden border ${colors.border}`}>
      <div className={`bg-gradient-to-br ${workout.colorClass} p-4`}>
        <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Today's Workout</p>
        <h2 className="font-display text-3xl text-white mt-1 leading-tight">{workout.name}</h2>
        <p className="text-white/80 text-sm mt-1">{workout.tagline}</p>
        {workout.coachNote && (
          <div className="mt-3 bg-black/20 rounded-xl p-3">
            <p className="text-white/90 text-sm"><span className="font-bold">Coach: </span>{workout.coachNote}</p>
          </div>
        )}
      </div>
      <div className="bg-slate-800 p-4 space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">
          <span>Week {workout.weekNumber} · {workout.exercises?.length || 0} exercises</span>
          <span>~55 min</span>
        </div>
        {preview.map((ex) => {
          const def = EXERCISES[ex.exerciseId];
          if (!def) return null;
          return (
            <div key={ex.exerciseId} className="flex justify-between items-center text-sm">
              <span className="text-slate-300">{def.name}</span>
              <span className="text-slate-500">
                {ex.sets}×{Array.isArray(ex.targetReps) ? ex.targetReps[0] : ex.targetReps}
              </span>
            </div>
          );
        })}
        {workout.exercises?.length > 4 && (
          <p className="text-slate-500 text-sm">+{workout.exercises.length - 4} more exercises...</p>
        )}
        <button onClick={() => onNavigate('workout')} className="btn-gold w-full mt-4 text-center">
          LET'S GET IT!
        </button>
      </div>
    </div>
  );
}

function CompletedTodayCard({ log, onNavigate }) {
  return (
    <div className="card border-emerald-500/50 bg-emerald-950/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-bold">Today's workout complete!</h3>
          <p className="text-emerald-400 font-semibold text-sm">+{log.xpEarned} XP earned</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm">You crushed it today. Come back tomorrow for the next workout!</p>
      <button onClick={() => onNavigate('history')} className="btn-secondary w-full mt-3 text-sm">
        View Progress
      </button>
    </div>
  );
}

function RestDayCard() {
  const tips = [
    'Eat plenty of protein — chicken, eggs, and milk help your muscles grow!',
    'Drink lots of water today, especially in the summer heat.',
    'Sleep 8-10 hours tonight. That\'s when you actually get stronger!',
    'Light walk or stretch. Keep your body moving but rest those muscles.',
  ];
  const tip = tips[new Date().getDay() % tips.length];
  return (
    <div className="card border-slate-600">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-bold">Rest Day — You Earned It!</h3>
          <p className="text-slate-400 text-sm">Sunday recovery</p>
        </div>
      </div>
      <div className="bg-slate-900/60 rounded-xl p-3">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-1">Recovery Tip</p>
        <p className="text-slate-300 text-sm">{tip}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card text-center">
      <p className={`font-black text-2xl ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}
