import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { getRecentWorkouts, getCompletedDates } from '../utils/db.js';
import { getProgramProgress } from '../utils/workoutGenerator.js';
import XPBar from '../components/XPBar.jsx';

const WORKOUT_TYPE_COLORS = {
  'lower-body': '#10b981',
  'upper-push': '#3b82f6',
  'conditioning': '#f97316',
  'upper-pull': '#a855f7',
  'full-body-power': '#f59e0b',
  'active-recovery': '#14b8a6',
};

export default function HistoryPage({ profile }) {
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [completedDates, setCompletedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  const progress = useMemo(() => getProgramProgress(), []);

  useEffect(() => {
    Promise.all([getRecentWorkouts(20), getCompletedDates()])
      .then(([workouts, dates]) => {
        setRecentWorkouts(workouts);
        setCompletedDates(dates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const w = i + 1;
      const weekStart = new Date('2026-05-27');
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const count = completedDates.filter((d) => {
        const date = new Date(d + 'T12:00:00');
        return date >= weekStart && date <= weekEnd;
      }).length;
      return {
        week: `W${w}`,
        count,
        isCurrent: w === progress.weekNumber,
        isPast: w < progress.weekNumber,
      };
    });
  }, [completedDates, progress]);

  const xpByDay = useMemo(() => {
    return recentWorkouts.slice(0, 10).reverse().map((log) => ({
      date: new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      xp: log.xpEarned || 0,
    }));
  }, [recentWorkouts]);

  if (loading) {
    return (
      <div className="pb-nav px-4 pt-8 max-w-lg mx-auto">
        <h2 className="font-display text-3xl text-white mb-6">YOUR PROGRESS</h2>
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (recentWorkouts.length === 0) {
    return (
      <div className="pb-nav px-4 pt-8 max-w-lg mx-auto text-center space-y-4">
        <h2 className="font-display text-3xl text-white">YOUR PROGRESS</h2>
        <div className="card py-12">
          <p className="text-slate-400 text-lg">No workouts yet!</p>
          <p className="text-slate-500 text-sm mt-2">Complete your first workout to see your progress here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto space-y-5">
      <h2 className="font-display text-3xl text-white">YOUR PROGRESS</h2>

      <XPBar totalXP={profile?.totalXP || 0} />

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Total Workouts" value={profile?.workoutsCompleted || 0} color="text-emerald-400" />
        <MiniStat label="Best Streak" value={`${profile?.longestStreak || 0}d`} color="text-orange-400" />
        <MiniStat label="Personal Bests" value={profile?.totalPersonalBests || 0} color="text-amber-400" />
      </div>

      <div className="card">
        <h3 className="text-white font-bold mb-1">Weekly Workouts</h3>
        <p className="text-slate-400 text-xs mb-4">Completed per week (max 6)</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyData} barSize={24} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 6]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} ticks={[0, 2, 4, 6]} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#fff' }}
              formatter={(v) => [`${v} workouts`, '']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isCurrent ? '#22c55e' :
                    entry.isPast ? (entry.count >= 4 ? '#10b981' : entry.count >= 2 ? '#f59e0b' : '#ef4444') :
                    '#334155'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 flex-wrap">
          <Legend color="bg-emerald-500" label="Current week" />
          <Legend color="bg-emerald-700" label="4-6 workouts" />
          <Legend color="bg-amber-500" label="2-3 workouts" />
          <Legend color="bg-red-500" label="0-1 workouts" />
        </div>
      </div>

      {xpByDay.length > 1 && (
        <div className="card">
          <h3 className="text-white font-bold mb-1">XP Per Workout</h3>
          <p className="text-slate-400 text-xs mb-4">Last {xpByDay.length} workouts</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={xpByDay} barSize={20} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#fff' }}
                formatter={(v) => [`${v} XP`, '']}
              />
              <Bar dataKey="xp" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="text-white font-bold mb-3">Recent Workouts</h3>
        <div className="space-y-2">
          {recentWorkouts.map((log) => (
            <WorkoutHistoryItem key={log.date} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkoutHistoryItem({ log }) {
  const color = WORKOUT_TYPE_COLORS[log.workoutType] || '#94a3b8';
  const date = new Date(log.date + 'T12:00:00');
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const setCount = Object.values(log.exercises || {}).reduce(
    (a, sets) => a + (Array.isArray(sets) ? sets.filter((s) => s.completed).length : 0), 0
  );
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: color + '22', border: `2px solid ${color}44` }}>
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm truncate">{log.workoutName}</p>
          {log.aiGenerated && (
            <span className="text-slate-500 text-xs flex-shrink-0">AI</span>
          )}
        </div>
        <p className="text-slate-400 text-xs">{dateStr} · {setCount} sets</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-amber-400 font-bold text-sm">+{log.xpEarned}</p>
        <p className="text-slate-500 text-xs">XP</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="card text-center py-3">
      <p className={`font-black text-2xl ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  );
}
