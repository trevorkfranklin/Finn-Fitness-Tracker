import { useState } from 'react';
import { EXERCISES } from '../data/exercises.js';
import { XP } from '../utils/points.js';

function formatDuration(sec) {
  const s = Number(sec);
  if (s < 60) return `${s} sec`;
  if (s % 60 === 0) return `${s / 60} min`;
  return `${Math.floor(s / 60)} min ${s % 60} sec`;
}

export default function ExerciseCard({ workoutExercise, onSetComplete, sessionSets, isExpanded, onToggle, pb = {} }) {
  const exDef = EXERCISES[workoutExercise.exerciseId];
  if (!exDef) return null;
  const completedCount = sessionSets?.filter((s) => s.completed).length || 0;
  const allComplete = sessionSets && completedCount === workoutExercise.sets;

  const isTimed = exDef.isTimed || workoutExercise.isTimed;

  const targetReps = Array.isArray(workoutExercise.targetReps)
    ? workoutExercise.targetReps[0]
    : workoutExercise.targetReps;

  const categoryColors = {
    strength: 'text-blue-400',
    power: 'text-amber-400',
    core: 'text-purple-400',
    conditioning: 'text-orange-400',
    agility: 'text-emerald-400',
    warmup: 'text-teal-400',
  };
  const catColor = categoryColors[exDef.category] || 'text-slate-400';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        allComplete
          ? 'border-emerald-500/50 bg-emerald-950/30'
          : 'border-slate-700/50 bg-slate-800'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {allComplete && (
              <span className="bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <h3 className={`font-bold text-base leading-tight ${allComplete ? 'text-emerald-300' : 'text-white'}`}>
              {exDef.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wide ${catColor}`}>
              {exDef.category}
            </span>
            <span className="text-slate-400 text-sm">
              {workoutExercise.sets} sets ×{' '}
              {isTimed
                ? (Array.isArray(workoutExercise.targetReps)
                    ? workoutExercise.targetReps.map(formatDuration).join('/')
                    : formatDuration(workoutExercise.targetReps))
                : `${Array.isArray(workoutExercise.targetReps) ? workoutExercise.targetReps.join('/') : workoutExercise.targetReps} ${exDef.unit === 'reps' ? 'reps' : exDef.unit}`
              }
              {workoutExercise.perSide ? ' per side' : ''}
            </span>
            {exDef.hasWeight && workoutExercise.suggestedWeight && (
              <span className="text-slate-500 text-xs">~{workoutExercise.suggestedWeight} lbs</span>
            )}
          </div>
          {pb.maxWeight && (
            <span className="text-amber-400 text-xs font-semibold">
              PB: {pb.maxWeight} lbs × {pb.maxReps || '?'} reps
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {sessionSets && (
            <span className={`text-sm font-bold ${allComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
              {completedCount}/{workoutExercise.sets}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
          {/* Coach tip */}
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-amber-400 font-bold">Coach says: </span>
              {exDef.tip}
            </p>
            {workoutExercise.notes && (
              <p className="text-slate-400 text-xs mt-1 italic">{workoutExercise.notes}</p>
            )}
            {exDef.videoUrl && (
              <a
                href={exDef.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
              >
                <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.4 19 12 19 12 19s4.8 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.8 14.5V9l5.4 2.8-5.4 2.7z"/>
                </svg>
                Watch how to do this
              </a>
            )}
          </div>

          {/* Set rows */}
          {sessionSets && (
            <div className="space-y-2">
              {sessionSets.map((set, i) => (
                <SetRow
                  key={i}
                  setNumber={i + 1}
                  targetReps={
                    Array.isArray(workoutExercise.targetReps)
                      ? workoutExercise.targetReps[i] || targetReps
                      : targetReps
                  }
                  set={set}
                  exDef={exDef}
                  workoutExercise={workoutExercise}
                  pb={pb}
                  onComplete={(reps, weight) =>
                    onSetComplete(workoutExercise.exerciseId, i, reps, weight)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SetRow({ setNumber, targetReps, set, exDef, workoutExercise, pb, onComplete }) {
  const isTimed = exDef.isTimed || workoutExercise.isTimed;
  const hasWeight = exDef.hasWeight;

  const defaultWeight =
    workoutExercise.defaultWeight
      ? String(workoutExercise.defaultWeight)
      : workoutExercise.suggestedWeight
      ? workoutExercise.suggestedWeight.toString().split('-')[0]
      : pb.maxWeight
      ? String(pb.maxWeight)
      : '';

  const [reps, setReps] = useState(set.reps !== undefined && set.reps !== '' ? String(set.reps) : '');
  const [weight, setWeight] = useState(
    set.weight !== undefined && set.weight !== '' ? String(set.weight) : defaultWeight
  );

  if (set.completed) {
    const isNewPB =
      (set.isPBWeight && hasWeight) || set.isPBReps;
    return (
      <div className="flex items-center gap-3 bg-emerald-900/30 rounded-xl px-3 py-2 border border-emerald-700/30">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-slate-300 font-semibold text-sm">Set {setNumber}</span>
        <span className="text-white font-bold">
          {isTimed ? formatDuration(set.reps) : `${set.reps} ${exDef.unit || 'reps'}`}
          {hasWeight && set.weight ? ` × ${set.weight} lbs` : ''}
        </span>
        {isNewPB && (
          <span className="ml-auto text-amber-400 text-xs font-black uppercase tracking-wide animate-pulse-once">
            NEW PB!
          </span>
        )}
      </div>
    );
  }

  const handleDone = () => {
    const r = reps.trim() || String(targetReps);
    const w = hasWeight ? (weight.trim() || defaultWeight) : '';
    onComplete(r, w);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-sm font-semibold w-12 flex-shrink-0">Set {setNumber}</span>
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          className="input-field"
          placeholder={isTimed ? formatDuration(targetReps) : `${targetReps} ${exDef.unit || 'reps'}`}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
      {hasWeight && (
        <div className="flex-1">
          <input
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="lbs"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
      <button
        onClick={handleDone}
        className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-4 py-2 rounded-xl transition-all duration-150 text-sm flex-shrink-0"
      >
        Done
      </button>
    </div>
  );
}
