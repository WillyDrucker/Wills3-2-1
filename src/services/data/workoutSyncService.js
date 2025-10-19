/* ==========================================================================
   WORKOUT SYNC SERVICE - Supabase Database Integration

   Manages immediate database persistence for workout data with sequential
   save queue to prevent race conditions. All workout actions (log/skip/edit)
   trigger immediate saves to Supabase as source of truth.

   Architecture: Immediate save pattern with sequential queue
   - Save queue ensures operations complete in order (prevents data loss)
   - UPSERT pattern: checks existence, updates if found, inserts if new
   - ID conversion: Database stores strings, app uses numbers (conversion on load)
   - Admin functions: Clear Daily Data for willy.drucker@gmail.com
   - Foreign key handling: Deletes logs before workouts (constraint compliance)

   Dependencies: supabaseClient.js, appState
   Used by: historyService (immediate saves), my-data (load/clear operations)
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
      logs: workout.workout_logs.map((log) => ({
        exercise: log.exercise_data,
        setNumber: log.set_number,
        weight: log.weight,
        reps: log.reps,
        status: log.status,
        supersetSide: log.superset_side,
      })),
    }));

    return { workouts: transformedWorkouts };
  } catch (error) {
    console.error("Unexpected error loading workouts:", error);
    return { workouts: [], error: error.message };
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
      logs: workout.workout_logs.map((log) => ({
        exercise: log.exercise_data,
        setNumber: log.set_number,
        weight: log.weight,
        reps: log.reps,
        status: log.status,
        supersetSide: log.superset_side,
      })),
    }));

    return { workouts: transformedWorkouts };
  } catch (error) {
    console.error("Unexpected error loading body part history:", error);
    return { workouts: [], error: error.message };
  }
}

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
    console.log("Migrating localStorage workouts to database...");
    const result = await migrateLocalWorkoutsToDatabase(
      appState.user.history.workouts
    );
    console.log(
      `Migration complete: ${result.migrated} workouts migrated, ${result.errors.length} errors`
    );
    if (result.errors.length > 0) {
      console.error("Migration errors:", result.errors);
    }
  } else if (dbWorkouts.length > 0) {
    // Load database workouts into appState (database is source of truth)
    appState.user.history.workouts = dbWorkouts;
    console.log(`Loaded ${dbWorkouts.length} workouts from database`);
  }
}
