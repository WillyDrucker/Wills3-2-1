import { appState } from "state";
import { getWorkoutCardHTML } from "./active-exercise-card.templates.workoutCard.js";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Template Entry Point

   Main template selector for active exercise card.
   Routes to rest day, completion waiting, or workout card display.

   Dependencies: workoutCard template
   Used by: active-exercise-card.index.js
   ========================================================================== */

export function getActiveExerciseCardTemplate() {
  const { workoutLog, isWorkoutComplete, currentLogIndex } = appState.session;

  if (workoutLog.length === 0) {
    return `<div class="card rest-day-container"><span class="rest-day-text">Rest Day</span></div>`;
  }

  if (isWorkoutComplete || (currentLogIndex === -1 && !isWorkoutComplete)) {
    return `<div class="card" id="active-card-container"><h2 class="card-header">Finishing up...</h2><div class="waiting-card-message">Waiting for the last timer to complete.</div></div>`;
  }

  const logEntry = workoutLog[currentLogIndex];
  if (!logEntry) {
    return `<div class="card" id="active-card-container"><h2 class="card-header">Finishing up...</h2><div class="waiting-card-message">Waiting for the last timer to complete.</div></div>`;
  }

  return getWorkoutCardHTML(logEntry);
}
