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

/**
 * Create or update plan progress entry in Supabase
 * Used when user activates or switches plans
 * @param {Object} planData - Plan progress data
 * @param {string} planData.plan_id - Plan name (e.g., "Will's 3-2-1")
 * @param {number} planData.plan_duration_weeks - Total weeks (15, 12, 11, etc.)
 * @param {string} planData.status - Status ("active", "completed", "switched")
 * @param {string|Date} planData.start_date - When plan was started
 * @param {string|Date|null} planData.end_date - When plan ended (null if active)
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function savePlanProgressToDatabase(planData) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const progressData = {
      user_id: userId,
      plan_id: planData.plan_id,
      plan_duration_weeks: planData.plan_duration_weeks,
      start_date: new Date(planData.start_date).toISOString(),
      end_date: planData.end_date ? new Date(planData.end_date).toISOString() : null,
      status: planData.status,
      updated_at: new Date().toISOString(),
    };

    // Check if this plan already exists for this user
    const { data: existingPlan } = await supabase
      .from("plan_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_id", planData.plan_id)
      .eq("start_date", progressData.start_date)
      .maybeSingle();

    if (existingPlan) {
      // UPDATE existing plan progress
      const { data, error } = await supabase
        .from("plan_progress")
        .update(progressData)
        .eq("id", existingPlan.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating plan progress:", error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } else {
      // INSERT new plan progress
      const { data, error } = await supabase
        .from("plan_progress")
        .insert([progressData])
        .select()
        .single();

      if (error) {
        console.error("Error inserting plan progress:", error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    }
  } catch (error) {
    console.error("Unexpected error saving plan progress:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing plan progress status (e.g., mark as "switched" when changing plans)
 * @param {string} planId - Plan name to update
 * @param {string} startDate - Start date of the plan to update
 * @param {string} status - New status ("active", "completed", "switched")
 * @param {string|Date|null} endDate - When plan ended (null if still active)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePlanProgressStatus(planId, startDate, status, endDate = null) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const updateData = {
      status,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("plan_progress")
      .update(updateData)
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("start_date", new Date(startDate).toISOString());

    if (error) {
      console.error("Error updating plan progress status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating plan progress status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a plan progress entry from Supabase
 * Used when user clears a plan from Plan Results
 * @param {string} planProgressId - UUID of plan_progress entry to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePlanProgress(planProgressId) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("plan_progress")
      .delete()
      .eq("id", planProgressId)
      .eq("user_id", userId); // Security: ensure user can only delete their own entries

    if (error) {
      console.error("Error deleting plan progress:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting plan progress:", error);
    return { success: false, error: error.message };
  }
}
