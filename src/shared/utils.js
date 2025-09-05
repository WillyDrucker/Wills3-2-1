import { appState } from "state";

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

/**
 * CEMENTED
 * A robust, pure utility for extracting a YouTube video ID from various
 * URL formats (standard, short, shorts).
 */
export function getYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has("v")) {
      return urlObj.searchParams.get("v");
    }
    const pathSegments = urlObj.pathname.split("/");
    if (urlObj.hostname === "youtu.be") {
      return pathSegments[1];
    }
    const shortsIndex = pathSegments.indexOf("shorts");
    if (shortsIndex > -1 && pathSegments[shortsIndex + 1]) {
      return pathSegments[shortsIndex + 1];
    }
  } catch (e) {
    console.error("Could not parse YouTube URL:", url, e);
    return null;
  }
  return null;
}

/**
 * CEMENTED
 * A simple, pure utility to check if an exercise uses dumbbells.
 */
export function isDumbbellExercise(exercise) {
  if (!exercise || !exercise.equipment_use) return false;
  return exercise.equipment_use.toLowerCase().includes("dumbbell");
}

/**
 * CEMENTED
 * The definitive, app-wide utility for smooth scrolling to an element.
 */
export function scrollToElement(
  target,
  options = { block: "start", inline: "nearest" }
) {
  requestAnimationFrame(() => {
    const element =
      typeof target === "string" ? document.querySelector(target) : target;
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        ...options,
      });
    }
  });
}

/**
 * CEMENTED
 * A standard, robust utility for lazily loading an external script only once.
 */
export function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * CEMENTED
 * A pure utility that reliably finds the next non-rest day in the weekly plan.
 */
export function getNextWorkoutDay(startDay) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let startIndex = days.indexOf(startDay);

  for (let i = 1; i < days.length; i++) {
    const nextIndex = (startIndex + i) % days.length;
    const nextDay = days[nextIndex];
    if (
      appState.weeklyPlan[nextDay]?.title !== "Rest" &&
      nextDay !== startDay
    ) {
      return nextDay;
    }
  }
  return startDay;
}

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

/**
 * CEMENTED
 * A perfect, simple, pure utility for pluralizing strings based on a value.
 */
export function pluralize(value, singular, plural) {
  return Number(value) === 1 ? singular : plural;
}
