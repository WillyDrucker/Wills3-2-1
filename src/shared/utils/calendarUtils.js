/* ==========================================================================
   CALENDAR UTILITIES - Week & Date Calculations

   Pure utility functions for calendar calculations and week range formatting.
   Used primarily by the My Data page for workout history calendar display.

   🔒 CEMENT: Week calculation logic
   - Week starts on Sunday (Sunday-Saturday format)
   - getStartOfWeek returns Sunday of the week
   - Week offset for navigating previous weeks
   - Date formatting matches app standards

   Dependencies: None
   Used by: My Data page components, history display
   ========================================================================== */

/**
 * CEMENTED
 * A pure utility for calculating the start of the week for the My Data calendar.
 * Week starts on Sunday (Sunday-Saturday format).
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const diff = -day; // Go back to Sunday of this week
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + diff);
  return sunday;
}

/**
 * CEMENTED
 * A pure utility for generating the week range string for the My Data calendar.
 */
export function getWeekRange(offset) {
  const now = new Date();
  now.setDate(now.getDate() - offset * 7);
  const start = getStartOfWeek(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = start.toLocaleString("default", { month: "short" });
  const endMonth = end.toLocaleString("default", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * CEMENTED
 * A pure utility for getting an array of day objects for the My Data calendar.
 * Returns days in Sunday-Saturday order.
 */
export function getDaysInWeek(offset) {
  const now = new Date();
  now.setDate(now.getDate() - offset * 7);
  const start = getStartOfWeek(now);
  const days = [];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      dayName: dayNames[i],
      dateString: `${d.toLocaleString("default", {
        month: "short",
      })} ${d.getDate()}`,
    });
  }
  return days;
}

/**
 * CEMENTED
 * A simple, pure utility to check if a date is in the future.
 */
export function isDateInFuture(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Calculate which weeks have been reached based on plan start date
 * Used for Plan Results page to determine which week numbers to display
 * @param {string|Date} startDate - Plan start date (ISO string or Date object)
 * @param {number} maxWeeks - Maximum weeks in plan (e.g., 15 for "Will's 3-2-1: 15 Weeks")
 * @returns {number[]} Array of week numbers that have been reached (e.g., [1, 2, 3])
 */
export function getPlanWeeksReached(startDate, maxWeeks) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate days since plan started
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  // Calculate which week we're in (1-indexed)
  // Week 1 = days 0-6, Week 2 = days 7-13, etc.
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;

  // Cap at maxWeeks
  const weeksReached = Math.min(Math.max(currentWeek, 1), maxWeeks);

  // Return array [1, 2, 3, ..., weeksReached]
  return Array.from({ length: weeksReached }, (_, i) => i + 1);
}
