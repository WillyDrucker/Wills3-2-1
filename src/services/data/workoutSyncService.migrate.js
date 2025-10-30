/* ==========================================================================
   WORKOUT SYNC SERVICE - Migration Operations

   Handles one-time migration of localStorage workouts to Supabase database.
   Called during app initialization for authenticated users.

   Migration Flow:
   1. Check if user has database workouts
   2. If none, check localStorage for workouts
   3. Migrate each localStorage workout to database
   4. Report success/errors

   Error Handling:
   - Continues migration even if individual workouts fail
   - Returns array of errors for failed migrations
   - Logs success count for completed migrations

   Dependencies: workoutSyncService.save, appState
   Used by: appInitializerService (initializeWorkoutSync)
   ========================================================================== */

import { appState } from "state";
import { saveWorkoutToDatabase } from "./workoutSyncService.save.js";
import { loadWorkoutsFromDatabase } from "./workoutSyncService.load.js";

/**
 * Migrate localStorage workouts to Supabase (one-time operation)
 * @param {Array} localWorkouts - Workout array from localStorage
 * @returns {Promise<{success: boolean, migrated: number, errors: Array}>}
 */
export async function migrateLocalWorkoutsToDatabase(localWorkouts) {
  const errors = [];
  let migrated = 0;

  for (const workout of localWorkouts) {
    const result = await saveWorkoutToDatabase(workout);
    if (result.success) {
      migrated++;
    } else {
      errors.push({ workoutId: workout.id, error: result.error });
    }
  }

  return {
    success: errors.length === 0,
    migrated,
    errors,
  };
}

/**
 * Initialize workout sync on app startup
 * - Checks if user has database workouts
 * - Migrates localStorage workouts if needed
 * - Loads workouts from database into appState
 */
export async function initializeWorkoutSync() {
  const userId = appState.auth?.user?.id;
  if (!userId) {
    console.log("User not authenticated, skipping workout sync");
    return;
  }

  // Load workouts from database
  const { workouts: dbWorkouts, error } = await loadWorkoutsFromDatabase();
  if (error) {
    console.error("Failed to load workouts from database:", error);
    return;
  }

  // If user has no database workouts but has localStorage workouts, migrate them
  if (dbWorkouts.length === 0 && appState.user.history.workouts.length > 0) {
    const result = await migrateLocalWorkoutsToDatabase(
      appState.user.history.workouts
    );
    if (result.errors.length > 0) {
      console.error("Migration errors:", result.errors);
    }
  } else if (dbWorkouts.length > 0) {
    // Load database workouts into appState (database is source of truth)
    appState.user.history.workouts = dbWorkouts;
  }
}
