/* ==========================================================================
   WORKOUT SYNC SERVICE - Load Operations

   Handles loading workout data from Supabase database.
   Transforms database format (snake_case, string IDs) to app format
   (camelCase, number IDs).

   Load Operations:
   - loadWorkoutsFromDatabase: Load all workouts for current user
   - getLastBodyPartLifts: Query recent workouts for specific body part

   ID Conversion:
   Database stores workout IDs as strings, app uses numbers.
   All load operations convert string IDs to numbers for consistency.

   Dependencies: supabaseClient, appState
   Used by: appInitializerService (startup), my-data (history display)
   ========================================================================== */

import { supabase } from "lib/supabaseClient.js";
import { appState } from "state";

/**
 * Load all workouts from Supabase for current user
 * @returns {Promise<{workouts: Array, error?: string}>}
 */
export async function loadWorkoutsFromDatabase() {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { workouts: [], error: "User not authenticated" };
    }

    const { data: workouts, error: workoutsError } = await supabase
      .from("workouts")
      .select(`
        *,
        workout_logs (*)
      `)
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (workoutsError) {
      console.error("Error loading workouts:", workoutsError);
      return { workouts: [], error: workoutsError.message };
    }

    // Transform database format to app format
    const transformedWorkouts = workouts.map((workout) => ({
      id: Number(workout.id), // Convert string ID to number for consistency
      timestamp: workout.timestamp,
      planName: workout.plan_name,
      sessionTypeName: workout.session_type_name,
      sessionColorClass: workout.session_color_class,
      bodyPart: workout.body_part,
      bodyPartColorKey: workout.body_part_color_key,
      bodyPart2ColorKey: workout.body_part_2_color_key,
      isCommitted: workout.is_committed || false,
      completedTimestamp: workout.completed_timestamp || null,
      logs: workout.workout_logs.map((log) => ({
        exercise: log.exercise_data,
        setNumber: log.set_number,
        weight: log.weight,
        reps: log.reps,
        status: log.status,
        supersetSide: log.superset_side,
        userName: log.user_name || null,
      })),
    }));

    return { workouts: transformedWorkouts };
  } catch (error) {
    console.error("Unexpected error loading workouts:", error);
    return { workouts: [], error: error.message };
  }
}

/**
 * Load plan progress from Supabase for current user
 * Used for Plan Results page to show historical and active plans
 * @returns {Promise<{planProgress: Array, error?: string}>}
 */
export async function loadPlanProgressFromDatabase() {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { planProgress: [], error: "User not authenticated" };
    }

    const { data: planProgress, error } = await supabase
      .from("plan_progress")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error loading plan progress:", error);
      return { planProgress: [], error: error.message };
    }

    // Transform database format to app format (snake_case → camelCase)
    const transformedProgress = planProgress.map((plan) => ({
      id: plan.id,
      user_id: plan.user_id,
      plan_id: plan.plan_id,
      plan_duration_weeks: plan.plan_duration_weeks,
      start_date: plan.start_date,
      end_date: plan.end_date,
      status: plan.status,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }));

    return { planProgress: transformedProgress };
  } catch (error) {
    console.error("Unexpected error loading plan progress:", error);
    return { planProgress: [], error: error.message };
  }
}

/**
 * Get last lifts for a specific body part
 * @param {string} bodyPart - Body part to query (e.g., "Arms", "Chest")
 * @param {number} limit - Number of workouts to return (default: 5)
 * @returns {Promise<{workouts: Array, error?: string}>}
 */
export async function getLastBodyPartLifts(bodyPart, limit = 5) {
  try {
    const userId = appState.auth?.user?.id;
    if (!userId) {
      return { workouts: [], error: "User not authenticated" };
    }

    const { data: workouts, error } = await supabase
      .from("workouts")
      .select(`
        *,
        workout_logs (*)
      `)
      .eq("user_id", userId)
      .eq("body_part", bodyPart)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error loading body part history:", error);
      return { workouts: [], error: error.message };
    }

    // Transform to app format
    const transformedWorkouts = workouts.map((workout) => ({
      id: Number(workout.id), // Convert string ID to number for consistency
      timestamp: workout.timestamp,
      planName: workout.plan_name,
      sessionTypeName: workout.session_type_name,
      sessionColorClass: workout.session_color_class,
      bodyPart: workout.body_part,
      bodyPartColorKey: workout.body_part_color_key,
      bodyPart2ColorKey: workout.body_part_2_color_key,
      isCommitted: workout.is_committed || false,
      completedTimestamp: workout.completed_timestamp || null,
      logs: workout.workout_logs.map((log) => ({
        exercise: log.exercise_data,
        setNumber: log.set_number,
        weight: log.weight,
        reps: log.reps,
        status: log.status,
        supersetSide: log.superset_side,
        userName: log.user_name || null,
      })),
    }));

    return { workouts: transformedWorkouts };
  } catch (error) {
    console.error("Unexpected error loading body part history:", error);
    return { workouts: [], error: error.message };
  }
}
