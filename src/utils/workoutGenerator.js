import { WEEKLY_SCHEDULES, WORKOUT_TEMPLATES } from '../data/program.js';

export const PROGRAM_START = new Date('2026-05-27');
export const PROGRAM_END = new Date('2026-07-31');
export const TOTAL_WEEKS = 9;

export function getProgramProgress(date = new Date()) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceStart = Math.floor((date - PROGRAM_START) / msPerDay);

  if (daysSinceStart < 0) {
    return { started: false, completed: false, weekNumber: 0, phase: 0, daysIntoProgram: daysSinceStart };
  }
  if (date > PROGRAM_END) {
    return { started: true, completed: true, weekNumber: TOTAL_WEEKS, phase: 3, daysIntoProgram: daysSinceStart };
  }

  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  const phase = weekNumber <= 3 ? 1 : weekNumber <= 6 ? 2 : 3;
  const daysRemaining = Math.ceil((PROGRAM_END - date) / msPerDay);
  const totalDays = Math.ceil((PROGRAM_END - PROGRAM_START) / msPerDay);
  const progressPct = Math.round((daysSinceStart / totalDays) * 100);

  return {
    started: true,
    completed: false,
    weekNumber: Math.min(weekNumber, TOTAL_WEEKS),
    phase,
    daysIntoProgram: daysSinceStart,
    daysRemaining,
    totalDays,
    progressPct,
  };
}

export function getWorkoutForDate(date = new Date()) {
  const progress = getProgramProgress(date);
  const dayOfWeek = date.getDay();
  const weekIndex = Math.min(Math.max((progress.weekNumber || 1) - 1, 0), WEEKLY_SCHEDULES.length - 1);
  const workoutType = WEEKLY_SCHEDULES[weekIndex][dayOfWeek] || 'rest';
  const phase = progress.phase || 1;

  const template = WORKOUT_TEMPLATES[workoutType];
  if (!template) return WORKOUT_TEMPLATES['rest']();

  return {
    ...template(phase),
    phase,
    weekNumber: progress.weekNumber,
    dateStr: date.toISOString().split('T')[0],
  };
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function getPhaseLabel(phase) {
  if (phase === 1) return 'Foundation Phase';
  if (phase === 2) return 'Build Phase';
  return 'Power Phase';
}
