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
