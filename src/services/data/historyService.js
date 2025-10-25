/* ==========================================================================
   HISTORY SERVICE - Workout History Management

   Manages workout history with immediate database persistence. All log
   operations (add/update/remove) trigger instant saves to both localStorage
   and Supabase database for real-time backup.

   Architecture: Immediate save pattern
   - Every log/skip/edit triggers saveWorkoutToDatabase() (fire-and-forget)
   - LocalStorage persisted first, then async database save
   - Session header metadata built from current workout state
   - Workout created on first log, removed if all logs cleared

   🔒 CEMENT: Partner mode log filtering
   - Partner mode: Only logs left side (user1) to avoid duplication
   - Right side (user2) skipped since it's mirrored from left
   - Session header dynamically updates with plan, session type, and body part

   Dependencies: appState, formatTimestamp, persistenceService, programConfig,
                 workoutSyncService
   Used by: Active card actions (log/skip), workout log (clear/update sets)
   ========================================================================== */

import { appState } from "state";
import { formatTimestamp } from "utils";
import * as persistenceService from "services/core/persistenceService.js";
import { programConfig } from "config";
import { saveWorkoutToDatabase, deleteWorkoutFromDatabase } from "./workoutSyncService.js";

function getSessionHeaderInfo() {
  const { session, weeklyPlan, allExercises } = appState;
  const currentPlan = programConfig[session.currentWorkoutPlanName];

  if (!currentPlan) {
    console.error(
      "Configuration for plan not found:",
      session.currentWorkoutPlanName
    );
    return null;
  }

  const firstLog =
    session.workoutLog.find(
      (log) => log.status === "completed" || log.status === "skipped"
    ) || session.workoutLog[0];
  if (!firstLog) return null;

  let headerInfo = {
    planName: session.currentWorkoutPlanName, // CEMENTED FIX (Issue 2): Persist the plan name.
    sessionTypeName: session.currentTimeOptionName,
    sessionColorClass: session.currentSessionColorClass,
  };

  if (appState.superset.isActive) {
    const day1Info = weeklyPlan[appState.superset.day1];
    const day2Info = weeklyPlan[appState.superset.day2];
    headerInfo.bodyPart = `${day1Info.title} & ${day2Info.title}`;
    headerInfo.bodyPartColorKey = "cc1";
    headerInfo.bodyPart2ColorKey = "cc3";
  } else if (appState.partner.isActive) {
    const dayName = firstLog.exercise.day;
    const dayInfo = weeklyPlan[dayName] || { title: "N/A", type: "N/A" };
    const exerciseForColor = allExercises.find((ex) => ex.day === dayName);
    headerInfo.dayName = dayName;
    headerInfo.bodyPart = `${dayInfo.title} (Partner)`;
    headerInfo.bodyPartColorKey = exerciseForColor
      ? exerciseForColor[currentPlan.colorKey]
      : "cc1";
    headerInfo.type = dayInfo.type;
  } else {
    const dayName = firstLog.exercise.day;
    const dayInfo = weeklyPlan[dayName] || { title: "N/A", type: "N/A" };
    const exerciseForColor = allExercises.find((ex) => ex.day === dayName);
    headerInfo.dayName = dayName;
    headerInfo.bodyPart = dayInfo.title;
    headerInfo.bodyPartColorKey = exerciseForColor
      ? exerciseForColor[currentPlan.colorKey]
      : "cc1";
    headerInfo.type = dayInfo.type;
  }

  return headerInfo;
}

export function addOrUpdateLog(logEntry) {
  if (appState.partner.isActive && logEntry.supersetSide === "right") {
    return;
  }

  const { user, session } = appState;
  const history = user.history.workouts;
  let workout = history.find((w) => w.id === session.id);

  if (!workout) {
    const headerInfo = getSessionHeaderInfo();
    if (!headerInfo) return;

    workout = {
      id: session.id,
      timestamp: new Date().toISOString(),
      ...headerInfo,
      logs: [],
    };
    history.unshift(workout);
  }

  Object.assign(workout, getSessionHeaderInfo());

  const existingLogIndex = workout.logs.findIndex(
    (l) =>
      l.exercise.exercise_name === logEntry.exercise.exercise_name &&
      l.setNumber === logEntry.setNumber &&
      l.supersetSide === logEntry.supersetSide
  );

  const logCopy = JSON.parse(JSON.stringify(logEntry));

  if (existingLogIndex > -1) {
    workout.logs[existingLogIndex] = logCopy;
  } else {
    workout.logs.push(logCopy);
  }

  persistenceService.saveState();

  // Immediately save to database if user is authenticated
  if (appState.auth?.isAuthenticated) {
    saveWorkoutToDatabase(workout).catch((error) => {
      console.error("Failed to save workout to database:", error);
    });
  }
}

/**
 * Remove a logged set from workout history
 *
 * Purpose: Delete a specific logged set when user clicks Clear in edit log selector.
 * Filters out matching log entry by exercise name, set number, and superset side.
 *
 * Database Sync Logic:
 * - If last log removed (0 logs remaining): Deletes entire workout from database
 *   to prevent zombie/orphaned workout headers in My Data
 * - If logs still remain: Saves updated workout to database with remaining logs
 * - Fire-and-forget async pattern (catches errors, doesn't block UI)
 *
 * Why delete on empty: Prevents "No sets logged" workout headers appearing in
 * My Data workout history list. User expects cleared logs to disappear completely.
 *
 * @param {Object} logEntry - The log entry to remove (contains exercise, setNumber, supersetSide)
 */
export function removeLog(logEntry) {
  const { user, session } = appState;
  let history = user.history.workouts;
  const workoutIndex = history.findIndex((w) => w.id === session.id);

  if (workoutIndex > -1) {
    const workout = history[workoutIndex];

    history[workoutIndex].logs = history[workoutIndex].logs.filter(
      (l) =>
        !(
          l.exercise.exercise_name === logEntry.exercise.exercise_name &&
          l.setNumber === logEntry.setNumber &&
          l.supersetSide === logEntry.supersetSide
        )
    );

    const logsRemainingAfterRemoval = history[workoutIndex].logs.length;

    if (logsRemainingAfterRemoval === 0) {
      history.splice(workoutIndex, 1);
    }

    persistenceService.saveState();

    // Handle database update if user is authenticated
    if (appState.auth?.isAuthenticated) {
      if (logsRemainingAfterRemoval === 0) {
        // Last log was cleared - delete entire workout from database
        deleteWorkoutFromDatabase(workout.id).catch((error) => {
          console.error("Failed to delete workout from database:", error);
        });
      } else {
        // Still has logs - save updated workout to database
        saveWorkoutToDatabase(workout).catch((error) => {
          console.error("Failed to save workout to database:", error);
        });
      }
    }
  }
}

/**
 * Mark current workout session as committed
 *
 * Purpose: Sets isCommitted flag and captures completion timestamp when workout is complete.
 * Called when user reaches workout complete screen, starts new workout, or saves via reset.
 *
 * Committed workouts become selectable in My Data history for editing individual logs.
 * Completion timestamp is displayed in My Data to show when workout was finished.
 */
export function markCurrentWorkoutCommitted() {
  const { user, session } = appState;
  const workout = user.history.workouts.find((w) => w.id === session.id);

  if (workout && !workout.isCommitted) {
    workout.isCommitted = true;
    workout.completedTimestamp = new Date().toISOString();
    persistenceService.saveState();

    // Save to database if authenticated
    if (appState.auth?.isAuthenticated) {
      saveWorkoutToDatabase(workout).catch((error) => {
        console.error("Failed to mark workout committed in database:", error);
      });
    }
  }
}

/**
 * Update a historical log entry from Edit Workout modal
 *
 * Purpose: Allows editing reps/weight for completed workout logs in My Data.
 * Finds specific log by workout ID, set number, and superset side, updates values,
 * then saves to both localStorage and database.
 *
 * @param {number} workoutId - ID of the workout session
 * @param {number} setNumber - Set number within the workout
 * @param {string} supersetSide - 'left', 'right', or '' for normal mode
 * @param {number} reps - New reps value
 * @param {number} weight - New weight value
 */
export function updateHistoricalLog(workoutId, setNumber, supersetSide, reps, weight) {
  const { user } = appState;
  const workout = user.history.workouts.find((w) => w.id === workoutId);

  if (!workout) {
    console.error("Workout not found:", workoutId);
    return;
  }

  // Find the specific log entry
  const log = workout.logs.find(
    (l) =>
      l.setNumber === setNumber &&
      (l.supersetSide || "") === supersetSide
  );

  if (!log) {
    console.error("Log not found:", { workoutId, setNumber, supersetSide });
    return;
  }

  // Update the log values
  log.reps = Number(reps);
  log.weight = Number(weight);

  persistenceService.saveState();

  // Save to database if authenticated
  if (appState.auth?.isAuthenticated) {
    saveWorkoutToDatabase(workout).catch((error) => {
      console.error("Failed to update historical log in database:", error);
    });
  }
}

/**
 * Delete a historical log entry from Edit Workout modal
 *
 * Purpose: Removes a specific log from a completed workout. If it's the last log,
 * deletes the entire workout from history and database.
 *
 * Cascade Logic:
 * - Last log: Deletes entire workout from database and removes from history
 * - Not last log: Removes log from workout.logs array and saves updated workout
 *
 * @param {number} workoutId - ID of the workout session
 * @param {number} setNumber - Set number within the workout
 * @param {string} supersetSide - 'left', 'right', or '' for normal mode
 * @returns {boolean} - True if entire workout was deleted, false if just one log removed
 */
export function deleteHistoricalLog(workoutId, setNumber, supersetSide) {
  const { user } = appState;
  const workoutIndex = user.history.workouts.findIndex((w) => w.id === workoutId);

  if (workoutIndex === -1) {
    console.error("Workout not found:", workoutId);
    return false;
  }

  const workout = user.history.workouts[workoutIndex];

  // Remove the specific log
  workout.logs = workout.logs.filter(
    (l) =>
      !(l.setNumber === setNumber && (l.supersetSide || "") === supersetSide)
  );

  const isLastLog = workout.logs.length === 0;

  if (isLastLog) {
    // Remove entire workout from history
    user.history.workouts.splice(workoutIndex, 1);
  }

  persistenceService.saveState();

  // Handle database update if authenticated
  if (appState.auth?.isAuthenticated) {
    if (isLastLog) {
      // Delete entire workout from database
      deleteWorkoutFromDatabase(workoutId).catch((error) => {
        console.error("Failed to delete workout from database:", error);
      });
    } else {
      // Save updated workout (with removed log) to database
      saveWorkoutToDatabase(workout).catch((error) => {
        console.error("Failed to save updated workout to database:", error);
      });
    }
  }

  return isLastLog;
}

/**
 * Delete entire workout session from history
 * Removes workout from appState and database
 * @param {number} workoutId - ID of workout to delete
 * @returns {boolean} - True if deleted successfully, false otherwise
 */
export function deleteEntireWorkout(workoutId) {
  const { user } = appState;
  const workoutIndex = user.history.workouts.findIndex((w) => w.id === workoutId);

  if (workoutIndex === -1) {
    console.error("Workout not found:", workoutId);
    return false;
  }

  // Remove entire workout from history
  user.history.workouts.splice(workoutIndex, 1);

  persistenceService.saveState();

  // Handle database deletion if authenticated
  if (appState.auth?.isAuthenticated) {
    deleteWorkoutFromDatabase(workoutId).catch((error) => {
      console.error("Failed to delete workout from database:", error);
    });
  }

  return true;
}

/**
 * Restore entire workout from backup (used when canceling changes in Edit Workout modal)
 * Updates workout in history and syncs to database
 * @param {number} workoutId - ID of workout to restore
 * @param {Object} restoredWorkout - The complete workout object to restore
 * @returns {boolean} - True if restored successfully, false otherwise
 */
export function restoreEntireWorkout(workoutId, restoredWorkout) {
  const { user } = appState;
  const workoutIndex = user.history.workouts.findIndex((w) => w.id === workoutId);

  if (workoutIndex === -1) {
    console.error("Workout not found for restore:", workoutId);
    return false;
  }

  console.log("Restoring entire workout:", {
    workoutIndex,
    workoutId,
    logsCount: restoredWorkout.logs.length
  });

  // Replace entire workout (deep clone to avoid reference issues)
  user.history.workouts[workoutIndex] = JSON.parse(JSON.stringify(restoredWorkout));

  persistenceService.saveState();

  // Save restored workout to database if authenticated
  if (appState.auth?.isAuthenticated) {
    saveWorkoutToDatabase(user.history.workouts[workoutIndex]).catch((error) => {
      console.error("Failed to restore workout to database:", error);
    });
  }

  return true;
}
