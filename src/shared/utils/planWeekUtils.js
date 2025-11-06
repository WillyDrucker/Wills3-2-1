/* ==========================================================================
   PLAN WEEK UTILITIES - Sunday-based week calculations for plan tracking

   Purpose: Calculate current week number, remaining weeks, and week dates
            for training plan tracking. Uses SUNDAY as start of week
            (different from My Data calendar which uses Monday).

   Week Advancement Rules:
   - Week starts on Sunday (day 0)
   - If plan starts on Saturday, next Sunday advances to Week 2
   - Weeks advance automatically when day turns Sunday

   Dependencies: None (pure date calculations)
   Used by: My Plan page, workout services, rep target calculations
   ========================================================================== */

/**
 * Get the Sunday for any given date
 * @param {Date} date - Any date to find the Sunday for
 * @returns {Date} - Sunday of that week (00:00:00 local time)
 */
export function getSundayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Set to Sunday of this week (subtract day number to get to Sunday)
  d.setDate(d.getDate() - day);

  // Set to start of day (00:00:00)
  d.setHours(0, 0, 0, 0);

  return d;
}

/**
 * Calculate current week number from Sunday-based start date
 * @param {string|Date} startDate - Plan start date (ISO string or Date object)
 * @returns {number} - Current week number (1-indexed)
 */
export function getCurrentWeekNumber(startDate) {
  if (!startDate) return null;

  const start = new Date(startDate);
  const today = new Date();

  // Get Sunday of the week when plan started
  const startSunday = getSundayOfWeek(start);

  // Get Sunday of current week
  const currentSunday = getSundayOfWeek(today);

  // Calculate weeks elapsed (difference in Sundays)
  const diffTime = currentSunday - startSunday;
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));

  // Week number is 1-indexed (Week 1 starts at 0 elapsed weeks)
  return diffWeeks + 1;
}

/**
 * Get the Sunday date for a specific week number
 * @param {string|Date} startDate - Plan start date
 * @param {number} weekNumber - Week number (1-indexed)
 * @returns {Date} - Sunday date for that week
 */
export function getWeekStartDate(startDate, weekNumber) {
  if (!startDate || !weekNumber) return null;

  const start = new Date(startDate);
  const startSunday = getSundayOfWeek(start);

  // Calculate Sunday for the specified week
  const targetSunday = new Date(startSunday);
  targetSunday.setDate(startSunday.getDate() + (weekNumber - 1) * 7);

  return targetSunday;
}

/**
 * Calculate remaining weeks in plan from current week
 * @param {string|Date} startDate - Plan start date
 * @param {number} totalWeeks - Total duration of plan
 * @returns {number} - Weeks remaining (0 if plan complete)
 */
export function getRemainingWeeks(startDate, totalWeeks) {
  if (!startDate || !totalWeeks) return totalWeeks || 0;

  const currentWeek = getCurrentWeekNumber(startDate);

  if (currentWeek === null) return totalWeeks;

  // Calculate remaining (ensure non-negative)
  const remaining = totalWeeks - currentWeek + 1;
  return Math.max(0, remaining);
}

/**
 * Get weeks remaining in plan based on current week number
 * Uses manually tracked week number from state, not calculated from date
 * @param {string} activePlanId - ID of active plan
 * @param {number} currentWeekNumber - Current week number from state
 * @param {Array} plans - Array of plan objects from appState.plan.plans
 * @returns {number} - Weeks remaining including current week
 */
export function getWeeksRemaining(activePlanId, currentWeekNumber, plans) {
  if (!activePlanId || !plans || plans.length === 0) {
    return null;
  }

  // Find the active plan
  const activePlan = plans.find((p) => p.id === activePlanId);
  if (!activePlan) return null;

  const totalWeeks = activePlan.totalWeeks || 15;

  // If no current week set, return total weeks (plan not started)
  if (!currentWeekNumber) return totalWeeks;

  // Calculate remaining weeks (includes current week)
  const remaining = totalWeeks - currentWeekNumber + 1;
  return Math.max(0, remaining);
}

/**
 * Check if today is the first day (Sunday) of a new week since last check
 * Used for automatic week advancement detection
 * @param {string|Date} lastCheckDate - Last time we checked
 * @returns {boolean} - True if a new Sunday has arrived
 */
export function hasNewWeekStarted(lastCheckDate) {
  if (!lastCheckDate) return false;

  const lastCheck = new Date(lastCheckDate);
  const today = new Date();

  const lastSunday = getSundayOfWeek(lastCheck);
  const currentSunday = getSundayOfWeek(today);

  // New week has started if current Sunday is after last Sunday
  return currentSunday > lastSunday;
}

/**
 * Determine which week range box should have the glowing border
 * @param {object} phases - Phase object from plan (e.g., {"week1-3": "Phase", "week4-6": "Phase"})
 * @param {number} currentWeekNumber - Current week number
 * @returns {string|null} - Week range key that contains current week (e.g., "week1-3")
 */
export function getCurrentWeekRange(phases, currentWeekNumber) {
  if (!phases || !currentWeekNumber) return null;

  // Find the range that contains the current week number
  for (const rangeKey of Object.keys(phases)) {
    const match = rangeKey.match(/week(\d+)-(\d+)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);

      if (currentWeekNumber >= start && currentWeekNumber <= end) {
        return rangeKey;
      }
    }
  }

  return null;
}
