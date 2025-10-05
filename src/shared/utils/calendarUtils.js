/* ==========================================================================
   CALENDAR UTILITIES - Week & Date Calculations

   Pure utility functions for calendar calculations and week range formatting.
   Used primarily by the My Data page for workout history calendar display.

   🔒 CEMENT: Week calculation logic
   - Week starts on Monday (ISO 8601 standard)
   - getStartOfWeek handles Sunday edge case
   - Week offset for navigating previous weeks
   - Date formatting matches app standards

   Dependencies: None
   Used by: My Data page components, history display
   ========================================================================== */

/**
 * CEMENTED
 * A pure utility for calculating the start of the week for the My Data calendar.
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
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
 */
export function getDaysInWeek(offset) {
  const now = new Date();
  now.setDate(now.getDate() - offset * 7);
  const start = getStartOfWeek(now);
  const days = [];
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
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
