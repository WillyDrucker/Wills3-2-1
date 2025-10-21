/* ==========================================================================
   WORKOUT SYNC SERVICE - Delete Operations

   Handles workout deletion from Supabase database.
   All delete operations scoped to current user_id for security.

   Delete Operations:
   - deleteWorkoutFromDatabase: Delete single workout + logs
   - clearTodaysWorkouts: Admin function to clear all workouts logged today

   Foreign Key Handling:
   Database enforces foreign key constraint (workout_logs.workout_id → workouts.id)
   Must delete logs BEFORE deleting workout to satisfy constraint.

   Use Cases:
   - deleteWorkoutFromDatabase: Called when last log is cleared via edit selector
     Prevents orphaned workout headers in My Data with "No sets logged"
   - clearTodaysWorkouts: Admin function for willy.drucker@gmail.com only
     Used to reset today's workout data during development/testing

   Dependencies: supabaseClient, appState
   Used by: historyService (removeLog), my-data (admin clear)
   ========================================================================== */

import { supabase } from "lib/supabaseClient.js";
import { appState } from "state";

/**
 * Delete a single workout from database by ID
 *
 * Purpose: Removes empty/zombie workouts when last log is cleared via edit selector.
 * When historyService.removeLog() clears the last logged set, it calls this function
 * to delete the entire workout from database instead of saving an empty workout.
 *
 * Why needed: Prevents orphaned workout headers appearing in My Data with "No sets logged"
 *
 * Foreign key handling: Deletes workout_logs first to satisfy ON DELETE CASCADE constraint,
 * then deletes workout record. Both operations scoped to current user_id for security.
 *
 * @param {number|string} workoutId - The workout ID to delete (session.id timestamp)
 * @returns {Promise<{success: boolean, error?: string}>} Result object with success status
 */
export async function deleteWorkoutFromDatabase(workoutId) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Delete workout logs first (foreign key constraint)
    const { error: logsError } = await supabase
      .from("workout_logs")
      .delete()
      .eq("workout_id", workoutId)
      .eq("user_id", userId);

    if (logsError) {
      console.error("Error deleting workout logs:", logsError);
      return { success: false, error: logsError.message };
    }

    // Delete workout
    const { error: workoutError } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId)
      .eq("user_id", userId);

    if (workoutError) {
      console.error("Error deleting workout:", workoutError);
      return { success: false, error: workoutError.message };
    }

    console.log(`Deleted workout ${workoutId} from database`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting workout:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all workouts logged today from database and appState
 * Admin-only function for willy.drucker@gmail.com
 * @returns {Promise<{success: boolean, deleted: number, error?: string}>}
 */
export async function clearTodaysWorkouts() {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, deleted: 0, error: "User not authenticated" };
    }

    // Get today's date range (start and end of day in ISO format)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Find workouts from today in database
    const { data: todaysWorkouts, error: fetchError } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId)
      .gte("timestamp", startOfDay.toISOString())
      .lt("timestamp", endOfDay.toISOString());

    if (fetchError) {
      console.error("Error fetching today's workouts:", fetchError);
      return { success: false, deleted: 0, error: fetchError.message };
    }

    if (!todaysWorkouts || todaysWorkouts.length === 0) {
      return { success: true, deleted: 0 };
    }

    const workoutIds = todaysWorkouts.map((w) => w.id);

    // Delete workout logs first (foreign key constraint)
    const { error: logsError } = await supabase
      .from("workout_logs")
      .delete()
      .in("workout_id", workoutIds)
      .eq("user_id", userId);

    if (logsError) {
      console.error("Error deleting workout logs:", logsError);
      return { success: false, deleted: 0, error: logsError.message };
    }

    // Delete workouts
    const { error: workoutsError } = await supabase
      .from("workouts")
      .delete()
      .in("id", workoutIds)
      .eq("user_id", userId);

    if (workoutsError) {
      console.error("Error deleting workouts:", workoutsError);
      return { success: false, deleted: 0, error: workoutsError.message };
    }

    // Remove from appState
    appState.user.history.workouts = appState.user.history.workouts.filter(
      (w) => !workoutIds.includes(w.id)
    );

    console.log(`Cleared ${workoutIds.length} workout(s) from today`);
    return { success: true, deleted: workoutIds.length };
  } catch (error) {
    console.error("Unexpected error clearing today's workouts:", error);
    return { success: false, deleted: 0, error: error.message };
  }
}
