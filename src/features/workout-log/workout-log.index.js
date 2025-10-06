/* ==========================================================================
   WORKOUT LOG - Business Logic

   Handles workout log rendering, updates, and clearing. Manages animation
   state tracking, history updates, and dual-mode reset logic.

   🔒 CEMENT: Animation state tracking with timestamp
   - Tracks animation start time for progress preservation during re-renders
   - 5-second defensive cleanup catches stale animation flags
   - Dual-mode side-specific reset prevents cross-side interference

   Dependencies: appState, ui, getWorkoutLogTemplate, workoutService,
                 historyService, timerService
   Used by: actionService (updateLog, clearSet actions), main.js (renderWorkoutLog)
   ========================================================================== */

import { appState } from "state";
import { ui } from "ui";
import { getWorkoutLogTemplate } from "./workout-log.template.js";
import { resetExerciseForMuscleGroup, recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import * as historyService from "services/data/historyService.js";
import {
  handleNormalRestCompletion,
  handleSupersetRestCompletion,
} from "services/timer/timerCompletionService.js";

export function renderWorkoutLog() {
  ui.workoutFooter.innerHTML = getWorkoutLogTemplate();
}

export function handleUpdateLog(index, newWeight, newReps) {
  const log = appState.session.workoutLog[index];
  if (!log || (log.weight === newWeight && log.reps === newReps)) {
    return false;
  }

  log.weight = newWeight;
  log.reps = newReps;
  if (log.status === "skipped" && newWeight > 0 && newReps > 0) {
    log.status = "completed";
  }

  // 🔒 CEMENT: Defensive cleanup prevents corrupted animation state
  // Timeout catches stale flags that weren't properly cleared
  const now = Date.now();
  if (log.isAnimating && log.animationStartTime && (now - log.animationStartTime) > 2200) {
    log.isAnimating = false;
    log.animationStartTime = null;
  }

  // 🔒 CEMENT: Animation state tracking with timestamp for progress preservation
  // Essential for preventing re-triggering during dual-mode renderAll() operations
  log.isAnimating = true;
  log.animationStartTime = now; // Track when animation started for progress calculation
  historyService.addOrUpdateLog(log);
  setTimeout(() => {
    log.isAnimating = false;
    log.animationStartTime = null; // Clear tracking after animation completes
  }, 1900); /* CEMENT: 1900ms matches animation duration (1.8s + buffer) */

  return true;
}

export function handleClearSet(index) {
  const logToClear = { ...appState.session.workoutLog[index] };
  if (!logToClear || logToClear.status === "pending") return;

  historyService.removeLog(logToClear);

  const muscleGroupToReset = logToClear.exercise.muscle_group;
  const dayForReset =
    appState.superset.isActive || appState.partner.isActive
      ? logToClear.exercise.day
      : appState.session.currentDayName;

  // 🔒 CEMENT: Stop timer if clearing the set that triggered it
  if (appState.superset.isActive || appState.partner.isActive) {
    const restState = appState.rest.superset[logToClear.supersetSide];
    if (restState.type !== "none" && index === restState.triggeringSetIndex) {
      handleSupersetRestCompletion(restState, {
        wasSkipped: false,
      });
    }
  } else {
    const restState = appState.rest.normal;
    if (restState.type !== "none" && index === restState.triggeringSetIndex) {
      handleNormalRestCompletion(restState, {
        wasSkipped: false,
      });
    }
  }

  const sessionLogToUpdate = appState.session.workoutLog[index];
  sessionLogToUpdate.status = "pending";
  sessionLogToUpdate.timestamp = "";
  sessionLogToUpdate.restCompleted = false;
  sessionLogToUpdate.restWasSkipped = false;

  const lastCompletedIndex = appState.session.workoutLog.findLastIndex(
    (log) =>
      (log.status === "completed" || log.status === "skipped") &&
      log.exercise.muscle_group === logToClear.exercise.muscle_group
  );

  if (lastCompletedIndex > -1) {
    const lastCompletedLog = appState.session.workoutLog[lastCompletedIndex];
    sessionLogToUpdate.weight = lastCompletedLog.weight;
    sessionLogToUpdate.reps = lastCompletedLog.reps;
  } else {
    sessionLogToUpdate.weight = 0;
    sessionLogToUpdate.reps = 10;
  }

  // 🔒 CEMENT: In dual mode, check if any sets remain completed on THIS SIDE only
  // Prevents resetting exercises when clearing one side but other side still has completed sets
  const remainingCompleted = appState.session.workoutLog.some(
    (log) => {
      const muscleGroupMatches = log.exercise.muscle_group === muscleGroupToReset;
      const statusMatches = log.status === "completed";

      // In dual mode, only count completed sets on the same side
      if (appState.superset.isActive || appState.partner.isActive) {
        return muscleGroupMatches && statusMatches && log.supersetSide === logToClear.supersetSide;
      }

      return muscleGroupMatches && statusMatches;
    }
  );

  if (!remainingCompleted) {
    // Pass the superset side to ensure we only reset exercises on this side
    resetExerciseForMuscleGroup(
      muscleGroupToReset,
      dayForReset,
      logToClear.supersetSide
    );
  }

  recalculateCurrentStateAfterLogChange({ shouldScroll: true });
}
