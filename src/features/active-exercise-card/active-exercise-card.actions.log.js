import { appState } from "state";
import { formatTimestamp } from "utils";
import {
  startNormalRestTimer,
  startSupersetRestTimer,
} from "services/timerService.js";
import * as workoutService from "services/workoutService.js";
import * as historyService from "services/historyService.js";
import * as selectorService from "services/selectorService.js";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Log Set Actions

   Handles logging exercise sets for both normal and dual-mode workouts.
   Validates inputs, updates state, triggers rest timers.

   Dependencies: timerService, workoutService, historyService, selectorService
   Used by: active-exercise-card.actions.js
   ========================================================================== */

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

/* === LOG SET === */
export function handleLogSet(side = null) {
  selectorService.closeAll();
  const sourceLogEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!sourceLogEntry) return false;

  let targetLogEntry, targetIndex;

  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return false;
    targetIndex = appState.session.workoutLog.findIndex(
      (log) => log.status === "pending" && log.supersetSide === side
    );
    if (targetIndex === -1) return false;
    targetLogEntry = appState.session.workoutLog[targetIndex];
    targetLogEntry.weight = sourceLogEntry.weight;
    targetLogEntry.reps = sourceLogEntry.reps;
  } else {
    targetIndex = appState.session.currentLogIndex;
    targetLogEntry = sourceLogEntry;
  }

  if (targetLogEntry.weight === 0 || targetLogEntry.reps === 0) {
    if (targetLogEntry.weight === 0) flashInputError("weight");
    if (targetLogEntry.reps === 0) flashInputError("reps");
    return false;
  }

  targetLogEntry.status = "completed";
  targetLogEntry.timestamp = formatTimestamp(new Date());

  /* 🔒 CEMENT: Animation state tracking with timestamp for progress preservation */
  const now = Date.now();
  if (targetLogEntry.isAnimating && targetLogEntry.animationStartTime && (now - targetLogEntry.animationStartTime) > 5000) {
    targetLogEntry.isAnimating = false;
    targetLogEntry.animationStartTime = null;
  }

  targetLogEntry.isAnimating = true;
  targetLogEntry.animationStartTime = now;
  historyService.addOrUpdateLog(targetLogEntry);
  setTimeout(() => {
    targetLogEntry.isAnimating = false;
    targetLogEntry.animationStartTime = null;
  }, 1500);

  const hasMoreOverallPending = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );

  if (hasMoreOverallPending) {
    if (appState.superset.isActive || appState.partner.isActive) {
      const target = side === "left" ? "supersetLeft" : "supersetRight";
      appState.session.lastLoggedSet[target] = {
        index: targetIndex,
        weight: targetLogEntry.weight,
        reps: targetLogEntry.reps,
      };
      const hasMoreSetsOnThisSide = appState.session.workoutLog.some(
        (log) => log.status === "pending" && log.supersetSide === side
      );
      if (hasMoreSetsOnThisSide) {
        startSupersetRestTimer(side, "log");
      } else {
        workoutService.recalculateCurrentStateAfterLogChange();
        workoutService.updateWorkoutCompletionState();
      }
    } else {
      appState.session.lastLoggedSet.normal = {
        index: targetIndex,
        weight: targetLogEntry.weight,
        reps: targetLogEntry.reps,
      };
      startNormalRestTimer("log");
    }
  } else {
    workoutService.updateWorkoutCompletionState();
    workoutService.recalculateCurrentStateAfterLogChange();
  }
  return true;
}
