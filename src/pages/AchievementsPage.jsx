import { useState, useEffect, useMemo } from 'react';
import { ACHIEVEMENT_DEFS, getLevelInfo, LEVELS } from '../utils/points.js';
import { getUnlockedAchievements } from '../utils/db.js';

export default function AchievementsPage({ profile }) {
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    getUnlockedAchievements().then(setUnlocked).catch(() => {});
  }, []);

  const levelInfo = getLevelInfo(profile?.totalXP || 0);

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto space-y-5">
      <h2 className="font-display text-3xl text-white">ACHIEVEMENTS</h2>

      {/* Level showcase */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 border border-emerald-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500/30 border-2 border-emerald-400 rounded-2xl flex items-center justify-center">
            <span className="font-display text-3xl text-white">{levelInfo.level}</span>
          </div>
          <div>
            <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest">Current Rank</p>
            <h3 className="text-white font-black text-2xl">{levelInfo.name}</h3>
            {!levelInfo.isMaxLevel && (
              <p className="text-emerald-300 text-sm">{levelInfo.xpToNext.toLocaleString()} XP until {levelInfo.next?.name}</p>
            )}
          </div>
        </div>
        {!levelInfo.isMaxLevel && (
          <div className="mt-4 h-3 bg-emerald-900/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 rounded-full transition-all"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Level progression */}
      <div className="card">
        <h3 className="text-white font-bold mb-3">Level Progression</h3>
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const reached = (profile?.totalXP || 0) >= lvl.minXP;
            const isCurrent = lvl.level === levelInfo.level;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isCurrent ? 'bg-emerald-900/40 border border-emerald-500/40' :
                  reached ? 'bg-slate-700/30' : 'opacity-40'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${reached ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {lvl.level}
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${reached ? 'text-white' : 'text-slate-500'}`}>{lvl.name}</p>
                  <p className="text-slate-400 text-xs">{lvl.minXP.toLocaleString()} XP</p>
                </div>
                {isCurrent && <span className="text-emerald-400 text-xs font-bold uppercase">You are here</span>}
                {reached && !isCurrent && (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">Achievements</h3>
          <span className="text-slate-400 text-sm">{unlocked.length}/{ACHIEVEMENT_DEFS.length} unlocked</span>
        </div>
        <div className="space-y-2">
          {ACHIEVEMENT_DEFS.map((a) => (
            <AchievementCard key={a.id} achievement={a} isUnlocked={unlocked.includes(a.id)} profile={profile} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, isUnlocked, profile }) {
  const progressHint = getProgressHint(achievement, profile);
  return (
    <div className={`rounded-2xl p-4 border transition-all ${isUnlocked ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-800 border-slate-700/50 opacity-60'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isUnlocked ? 'bg-amber-500' : 'bg-slate-700'}`}>
          {isUnlocked ? <TrophySmall /> : <LockIcon />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-300'}`}>{achievement.name}</p>
          <p className="text-slate-400 text-sm">{achievement.desc}</p>
          {!isUnlocked && progressHint && <p className="text-slate-500 text-xs mt-1">{progressHint}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-sm ${isUnlocked ? 'text-amber-400' : 'text-slate-600'}`}>+{achievement.xpBonus} XP</p>
          {isUnlocked && <p className="text-emerald-400 text-xs font-semibold">Unlocked!</p>}
        </div>
      </div>
    </div>
  );
}

function getProgressHint(achievement, profile) {
  if (!profile) return null;
  const hints = {
    'first-snap': 'Complete your first workout!',
    'hat-trick': `${profile.currentStreak || 0}/3 day streak`,
    'first-down': `${profile.workoutsCompleted || 0}/10 workouts`,
    'iron-man': `${profile.currentStreak || 0}/7 day streak`,
    'beast-mode': `${profile.workoutsCompleted || 0}/20 workouts`,
    'record-setter': 'Set your first personal best!',
    'record-breaker': `${profile.totalPersonalBests || 0}/10 personal bests`,
    'unstoppable': `${profile.currentStreak || 0}/14 day streak`,
    'halfway': `${profile.workoutsCompleted || 0}/30 workouts`,
    'summer-champ': `${profile.workoutsCompleted || 0}/45 workouts — complete the full program!`,
  };
  return hints[achievement.id] ?? null;
}

function TrophySmall() {
  return (
    <svg className="w-6 h-6 text-white fill-white" viewBox="0 0 24 24">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5 text-slate-500 fill-slate-500" viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}
