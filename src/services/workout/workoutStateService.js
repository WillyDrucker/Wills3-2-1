/* ==========================================================================
   WORKOUT STATE SERVICE - Completion & Messages

   Manages workout completion state detection and active card message updates.
   Determines when workout is complete and what message to show user.

   🔒 CEMENT: "Begin Exercise" message logic
   - "Begin Exercise - Log Results" for first set
   - "Begin Next Set" when returning to same muscle group
   - "Begin Next Exercise" when starting new muscle group
   - "Last Exercise!" when only one pending set remains

   Dependencies: appState
   Used by: workoutProgressionService, timerService
   ========================================================================== */

import { appState } from "state";

/* === COMPLETION STATE MANAGEMENT === */
export function updateWorkoutCompletionState() {
  const wasAlreadyComplete = appState.session.isWorkoutComplete;

  const hasPendingSets = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );
  const areTimersActive =
    appState.rest.normal.type !== "none" ||
    appState.rest.superset.left.type !== "none" ||
    appState.rest.superset.right.type !== "none";

  if (!hasPendingSets && !areTimersActive) {
    if (!wasAlreadyComplete && appState.session.workoutLog.length > 0) {
      appState.session.isWorkoutComplete = true;
      appState.session.playCompletionAnimation = true;
    }
  } else {
    appState.session.isWorkoutComplete = false;
  }
}

/* === ACTIVE CARD MESSAGE UPDATES === */
export function updateActiveCardMessage() {
  const { session } = appState;
  const { workoutLog, currentLogIndex } = session;

  if (session.isWorkoutComplete || workoutLog.length === 0) return;

  const currentLog = workoutLog[currentLogIndex];
  if (!currentLog) return;

  const pendingSets = workoutLog.filter((log) => log.status === "pending");
  if (pendingSets.length === 1) {
    session.activeCardMessage = "Last Exercise!";
    return;
  }

  if (currentLogIndex === 0) {
    session.activeCardMessage = "Begin Exercise - Log Results";
    return;
  }

  const hasPreviousSets = workoutLog.some(
    (log) =>
      (log.status === "completed" || log.status === "skipped") &&
      log.exercise.muscle_group === currentLog.exercise.muscle_group &&
      log.supersetSide === currentLog.supersetSide
  );

  if (hasPreviousSets) {
    session.activeCardMessage = "Begin Next Set";
  } else {
    session.activeCardMessage = "Begin Next Exercise";
  }
}
