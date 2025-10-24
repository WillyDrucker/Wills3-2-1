/* ==========================================================================
   WORKOUT SYNC SERVICE - Save Operations

   Handles workout save operations to Supabase database with sequential queue
   to prevent race conditions. Implements UPSERT pattern (update if exists,
   insert if new).

   Save Queue Pattern:
   - All saves added to sequential promise chain
   - Ensures operations complete in order
   - Prevents race conditions and data loss

   UPSERT Logic:
   1. Check if workout exists (by ID + user_id)
   2. If exists: UPDATE workout + DELETE old logs + INSERT new logs
   3. If new: INSERT workout + INSERT logs

   Dependencies: supabaseClient, appState
   Used by: historyService (immediate saves after log/skip/edit)
   ========================================================================== */

import { supabase } from "lib/supabaseClient.js";
import { appState } from "state";

// Save queue to prevent race conditions
let saveQueue = Promise.resolve();

/**
 * Save workout and logs to Supabase (UPSERT pattern)
 * Checks if workout exists and UPDATEs if found, INSERTs if new
 * Uses a queue to ensure saves happen sequentially and prevent race conditions
 * @param {Object} workout - Workout session object from historyService
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveWorkoutToDatabase(workout) {
  // Add to queue and wait for previous saves to complete
  return new Promise((resolve) => {
    saveQueue = saveQueue.then(() => performSave(workout).then(resolve));
  });
}

/**
 * Internal function that performs the actual database save
 * @private
 */
async function performSave(workout) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if workout already exists
    const { data: existingWorkout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workout.id)
      .eq("user_id", userId)
      .maybeSingle();

    const workoutData = {
      id: workout.id,
      user_id: userId,
      timestamp: new Date(workout.timestamp).toISOString(),
      plan_name: workout.planName,
      session_type_name: workout.sessionTypeName,
      session_color_class: workout.sessionColorClass,
      body_part: workout.bodyPart,
      body_part_color_key: workout.bodyPartColorKey,
      body_part_2_color_key: workout.bodyPart2ColorKey || null,
      is_committed: workout.isCommitted || false,
      completed_timestamp: workout.completedTimestamp || null,
    };

    if (existingWorkout) {
      // UPDATE existing workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .update(workoutData)
        .eq("id", workout.id)
        .eq("user_id", userId);

      if (workoutError) {
        console.error("Error updating workout:", workoutError);
        return { success: false, error: workoutError.message };
      }

      // Delete old logs for this workout
      const { error: deleteError } = await supabase
        .from("workout_logs")
        .delete()
        .eq("workout_id", workout.id)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting old workout logs:", deleteError);
        return { success: false, error: deleteError.message };
      }
    } else {
      // INSERT new workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .insert(workoutData);

      if (workoutError) {
        console.error("Error inserting workout:", workoutError);
        return { success: false, error: workoutError.message };
      }
    }

    // Insert workout logs (fresh copy after delete or new insert)
    const logsToInsert = workout.logs.map((log) => ({
      workout_id: workout.id,
      user_id: userId,
      exercise_data: log.exercise,
      set_number: log.setNumber,
      weight: log.weight,
      reps: log.reps,
      status: log.status,
      superset_side: log.supersetSide || null,
    }));

    if (logsToInsert.length > 0) {
      const { error: logsError } = await supabase
        .from("workout_logs")
        .insert(logsToInsert);

      if (logsError) {
        console.error("Error saving workout logs:", logsError);
        return { success: false, error: logsError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving workout:", error);
    return { success: false, error: error.message };
  }
}
