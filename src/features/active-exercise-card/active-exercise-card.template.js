import { appState } from "state";
import { getWorkoutCardHTML } from "./active-exercise-card.templates.workoutCard.js";

export function getActiveExerciseCardTemplate() {
  const { workoutLog, isWorkoutComplete, currentLogIndex } = appState.session;

  if (workoutLog.length === 0) {
    return `<div class="card rest-day-container"><span class="rest-day-text">Rest Day</span></div>`;
  }

  // CEMENTED REFACTOR: The completion card is now its own component. The active card now only
  // shows a "waiting" state when the workout is finished, until the new results card is rendered
  // by the main render loop in its place.
  if (isWorkoutComplete || (currentLogIndex === -1 && !isWorkoutComplete)) {
    return `<div class="card" id="active-card-container"><h2 class="card-header">Finishing up...</h2><div class="waiting-card-message">Waiting for the last timer to complete.</div></div>`;
  }

  const logEntry = workoutLog[currentLogIndex];
  if (!logEntry) {
    // This case should now be handled by the `isWorkoutComplete` check above, but is kept as a fallback.
    return `<div class="card" id="active-card-container"><h2 class="card-header">Finishing up...</h2><div class="waiting-card-message">Waiting for the last timer to complete.</div></div>`;
  }

  return getWorkoutCardHTML(logEntry);
}
