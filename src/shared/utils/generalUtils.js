/* ==========================================================================
   GENERAL UTILITIES - Miscellaneous Helper Functions

   Pure utility functions for various tasks including YouTube URL parsing,
   exercise equipment checks, string pluralization, and workout day navigation.

   🔒 CEMENT: YouTube URL parsing
   - Handles standard youtube.com/watch?v= URLs
   - Handles youtu.be short URLs
   - Handles youtube.com/shorts/ URLs
   - Returns null for invalid URLs with error logging

   Dependencies: appState (for getNextWorkoutDay)
   Used by: Video player, active card, config templates, various features
   ========================================================================== */

import { appState } from "state";

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
 * A perfect, simple, pure utility for pluralizing strings based on a value.
 */
export function pluralize(value, singular, plural) {
  return Number(value) === 1 ? singular : plural;
}
