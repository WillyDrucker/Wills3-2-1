/* ==========================================================================
   TIME UTILITIES - Time & Date Formatting

   Pure utility functions for time and date formatting. Provides consistent
   time display formatting across the application.

   🔒 CEMENT: Time formatting standards
   - formatTime: M:SS timer display
   - formatTimestamp: Human-readable timestamps for history
   - formatTime12Hour: 12-hour clock display
   - calculateCompletionTime: Projected workout completion time

   Dependencies: None
   Used by: Timer services, config header, workout log, history
   ========================================================================== */

/**
 * CEMENTED
 * A pure, stable utility to get the string name of the current day.
 */
export function getTodayDayName() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
}

/**
 * CEMENTED
 * A pure, stable utility for pluralizing the duration unit.
 */
export function getDurationUnit(value) {
  return Number(value) === 1 ? "min" : "mins";
}

/**
 * CEMENTED
 * A pure, stable utility for formatting seconds into a M:SS display.
 */
export function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

/**
 * CEMENTED
 * A pure, stable utility for creating a human-readable timestamp.
 */
export function formatTimestamp(date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * CEMENTED
 * Formats a date object into a 12-hour "h:mm AM/PM" string.
 */
export function formatTime12Hour(date) {
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * CEMENTED
 * Calculates the projected completion time by adding a given number of minutes
 * to the current time and returns a formatted 12-hour string.
 */
export function calculateCompletionTime(minutesToAdd) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesToAdd);
  return formatTime12Hour(now);
}
