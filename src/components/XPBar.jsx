import { getLevelInfo } from '../utils/points.js';

export default function XPBar({ totalXP, compact = false }) {
  const info = getLevelInfo(totalXP || 0);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
          Lvl {info.level}
        </span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-700"
            style={{ width: `${info.progress}%` }}
          />
        </div>
        <span className="text-amber-400 text-xs font-bold">{(totalXP || 0).toLocaleString()} XP</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white text-sm font-black px-3 py-1 rounded-full">
              LEVEL {info.level}
            </span>
            <span className="text-white font-bold text-lg">{info.name}</span>
          </div>
          {!info.isMaxLevel && (
            <p className="text-slate-400 text-sm mt-1">
              {info.xpToNext.toLocaleString()} XP to {info.next?.name}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-amber-400 font-black text-xl">{(totalXP || 0).toLocaleString()}</span>
          <p className="text-slate-400 text-xs">Total XP</p>
        </div>
      </div>
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 rounded-full transition-all duration-700 relative"
          style={{ width: `${info.progress}%` }}
        >
          {info.progress > 10 && (
            <span className="absolute right-2 top-0 bottom-0 flex items-center text-white text-xs font-bold">
              {info.progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
