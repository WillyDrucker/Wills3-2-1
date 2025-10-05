/* ==========================================================================
   EXERCISE CLIENT - API Client for Exercise Database

   Fetches exercise data from remote JSON database. Handles network errors
   and returns null on failure to prevent app crashes.

   Dependencies: config (EXERCISE_DATABASE_URL)
   Used by: appInitializerService.js (initialization)
   ========================================================================== */

import { EXERCISE_DATABASE_URL } from "config";

export async function fetchExercises() {
  try {
    const response = await fetch(EXERCISE_DATABASE_URL);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load or process exercise database:", error);
    return null;
  }
}
