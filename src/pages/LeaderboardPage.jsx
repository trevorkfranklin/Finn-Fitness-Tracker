import { useState, useEffect } from 'react';
import { getLeaderboard, getPlayerId } from '../utils/db.js';
import { getLevelInfo } from '../utils/points.js';

export default function LeaderboardPage({ profile }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const myId = getPlayerId();

  useEffect(() => {
    getLeaderboard()
      .then(setPlayers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="font-display text-3xl text-white">LEADERBOARD</h2>
        <p className="text-slate-400 text-sm mt-1">Top athletes ranked by total XP</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="card border-red-500/40">
          <p className="text-red-400 text-sm">Failed to load leaderboard: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {players.map((player, i) => (
            <PlayerRow
              key={player.id}
              player={player}
              rank={i + 1}
              isMe={player.id === myId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, rank, isMe }) {
  const levelInfo = getLevelInfo(player.totalXP);

  return (
    <div
      className={`rounded-2xl p-4 border flex items-center gap-3 transition-all ${
        isMe
          ? 'bg-emerald-950/30 border-emerald-500/50'
          : 'bg-slate-800 border-slate-700/50'
      }`}
    >
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-bold truncate ${isMe ? 'text-emerald-300' : 'text-white'}`}>
            {player.name}
            {isMe && <span className="text-emerald-500 font-semibold text-xs ml-1">(you)</span>}
          </p>
        </div>
        <p className="text-slate-400 text-xs">{levelInfo.name}</p>
      </div>

      <div className="text-right flex-shrink-0 space-y-0.5">
        <p className={`font-black text-lg ${isMe ? 'text-emerald-400' : 'text-amber-400'}`}>
          {player.totalXP.toLocaleString()} XP
        </p>
        <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
          {player.currentStreak > 0 && (
            <span className="text-orange-400 font-semibold">{player.currentStreak}d streak</span>
          )}
          <span>{player.workoutsCompleted} workouts</span>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
        <span className="font-black text-slate-900 text-sm">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
        <span className="font-black text-slate-900 text-sm">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center flex-shrink-0">
        <span className="font-black text-white text-sm">3</span>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="font-bold text-slate-400 text-sm">{rank}</span>
    </div>
  );
}
