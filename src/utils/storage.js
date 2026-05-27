const PREFIX = 'gg_';

const key = (name) => `${PREFIX}${name}`;

export function getProfile() {
  try {
    const raw = localStorage.getItem(key('profile'));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(key('profile'), JSON.stringify(profile));
}

export function getPersonalBests() {
  try {
    const raw = localStorage.getItem(key('pbs'));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePersonalBests(pbs) {
  localStorage.setItem(key('pbs'), JSON.stringify(pbs));
}

export function updatePersonalBest(exerciseId, data) {
  const pbs = getPersonalBests();
  const current = pbs[exerciseId] || {};
  let updated = false;
  const next = { ...current };

  if (data.maxWeight != null && data.maxWeight > (current.maxWeight || 0)) {
    next.maxWeight = data.maxWeight;
    next.maxWeightDate = new Date().toISOString().split('T')[0];
    updated = true;
  }
  if (data.maxReps != null && data.maxReps > (current.maxReps || 0)) {
    next.maxReps = data.maxReps;
    next.maxRepsDate = new Date().toISOString().split('T')[0];
    updated = true;
  }

  if (updated) {
    pbs[exerciseId] = next;
    savePersonalBests(pbs);
  }
  return updated;
}

export function getWorkoutLog(date) {
  try {
    const raw = localStorage.getItem(key(`log_${date}`));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWorkoutLog(log) {
  localStorage.setItem(key(`log_${log.date}`), JSON.stringify(log));
  // Also maintain index of completed dates
  const dates = getCompletedDates();
  if (!dates.includes(log.date)) {
    dates.push(log.date);
    localStorage.setItem(key('completed_dates'), JSON.stringify(dates));
  }
}

export function getCompletedDates() {
  try {
    const raw = localStorage.getItem(key('completed_dates'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getRecentWorkouts(limit = 14) {
  const dates = getCompletedDates()
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, limit);
  return dates.map((d) => getWorkoutLog(d)).filter(Boolean);
}

export function getUnlockedAchievements() {
  try {
    const raw = localStorage.getItem(key('achievements'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUnlockedAchievements(achievements) {
  localStorage.setItem(key('achievements'), JSON.stringify(achievements));
}
