// Takes an array of { completion_date: 'YYYY-MM-DD', status: 'complete'|'incomplete' }
// and returns { currentStreak, longestStreak, completionPercentage }

function calculateStreaks(logs, habitCreatedAt) {
  const completeDates = new Set(
    logs.filter(log => log.status === 'complete').map(log => log.completion_date)
  );

  // --- Longest streak: scan all complete dates in order, track consecutive runs ---
  const sortedDates = [...completeDates].sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    if (prevDate === null || isNextDay(prevDate, dateStr)) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    longestStreak = Math.max(longestStreak, currentRun);
    prevDate = dateStr;
  }

  // --- Current streak: walk backward from today until a missing/incomplete day ---
  let currentStreak = 0;
  let checkDate = todayDateString();

  while (completeDates.has(checkDate)) {
    currentStreak += 1;
    checkDate = shiftDate(checkDate, -1);
  }

  // --- Completion percentage: complete days / total days since habit creation ---
  const totalDaysSinceCreation = daysBetween(habitCreatedAt, todayDateString()) + 1;
  const completionPercentage = totalDaysSinceCreation > 0
    ? Math.round((completeDates.size / totalDaysSinceCreation) * 100)
    : 0;

  return { currentStreak, longestStreak, completionPercentage };
}

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isNextDay(dateStr, nextDateStr) {
  return shiftDate(dateStr, 1) === nextDateStr;
}

function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(dateStr1, dateStr2) {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((date2 - date1) / msPerDay);
}

module.exports = { calculateStreaks };