import { appState } from "state";
import * as workoutService from "services/workoutService.js";
import * as youtubeService from "services/youtubeService.js";
import { programConfig } from "config";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Actions Index

   Main actions entry point with re-exports and input/swap handlers.
   Log and skip actions separated into focused modules.

   Dependencies: workoutService, youtubeService, programConfig
   Used by: active-exercise-card.index.js
   ========================================================================== */

// Re-export log and skip actions
export { handleLogSet } from "./active-exercise-card.actions.log.js";
export { handleSkipSet, handleSkipRest } from "./active-exercise-card.actions.skip.js";

/* === INPUT VALIDATION === */
function flashInputError(inputId) {
  const buttons = document.querySelectorAll(
    `button[data-input-id="${inputId}"]`
  );
  buttons.forEach((button) => {
    button.classList.add("button-is-flashing");
    setTimeout(() => button.classList.remove("button-is-flashing"), 1700);
  });
}

/* === NUMBER INPUT === */
export function handleNumberInputChange(inputId, value) {
  const cleanValue = Math.max(0, Math.min(999, parseFloat(value) || 0));
  const logEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!logEntry) return;

  if (inputId === "weight") logEntry.weight = cleanValue;
  else if (inputId === "reps") logEntry.reps = cleanValue;
}

/* === EXERCISE SWAP === */
export function handleExerciseSwap(newExerciseOrder) {
  const logIndex = appState.session.currentLogIndex;
  const currentLogEntry = appState.session.workoutLog[logIndex];
  const targetMuscleGroup = currentLogEntry.exercise.muscle_group;
  const currentPlan = programConfig[appState.session.currentWorkoutPlanName];
  const dayForSwap =
    appState.superset.isActive || appState.partner.isActive
      ? currentLogEntry.exercise.day
      : appState.session.currentDayName;

  const newExercise = appState.allExercises.find(
    (ex) =>
      ex[currentPlan.orderKey] === newExerciseOrder &&
      ex.day === dayForSwap &&
      ex.muscle_group === targetMuscleGroup
  );
  if (!newExercise) return;

  const finalExerciseData = youtubeService.getExerciseWithLink(newExercise);

  const oldExerciseName = currentLogEntry.exercise.exercise_name;
  appState.session.workoutLog.forEach((log) => {
    if (
      log.exercise.exercise_name === oldExerciseName &&
      log.supersetSide === currentLogEntry.supersetSide
    ) {
      log.exercise = finalExerciseData;
    }
  });

  workoutService.recalculateCurrentStateAfterLogChange();
}
