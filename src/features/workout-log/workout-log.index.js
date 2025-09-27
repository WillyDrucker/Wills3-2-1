import { appState } from "state";
import { ui } from "ui";
import { getWorkoutLogTemplate } from "./workout-log.template.js";
import * as workoutService from "services/workoutService.js";
import * as historyService from "services/historyService.js";
import {
  handleNormalRestCompletion,
  handleSupersetRestCompletion,
} from "services/timerService.js";

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
  // 5-second timeout catches stale flags that weren't properly cleared
  const now = Date.now();
  if (log.isAnimating && log.animationStartTime && (now - log.animationStartTime) > 5000) {
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
  }, 2000);

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

  if (appState.superset.isActive || appState.partner.isActive) {
    const restState = appState.rest.superset[logToClear.supersetSide];
    if (restState.type !== "none" && index === restState.triggeringSetIndex) {
      handleSupersetRestCompletion(logToClear.supersetSide, {
        wasSkipped: false,
      });
    }
  } else {
    const restState = appState.rest.normal;
    if (restState.type !== "none" && index === restState.triggeringSetIndex) {
      handleNormalRestCompletion({ wasSkipped: false });
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

  const remainingCompleted = appState.session.workoutLog.some(
    (log) =>
      log.exercise.muscle_group === muscleGroupToReset &&
      log.status === "completed"
  );

  if (!remainingCompleted) {
    workoutService.resetExerciseForMuscleGroup(muscleGroupToReset, dayForReset);
  }

  workoutService.recalculateCurrentStateAfterLogChange({ shouldScroll: true });
}
