import { appState } from "state";
import { formatTimestamp } from "utils";
import {
  startNormalRestTimer,
  startSupersetRestTimer,
  handleNormalRestCompletion,
  handleSupersetRestCompletion,
} from "services/timerService.js";
import * as workoutService from "services/workoutService.js";
import { canLogDualModeSide } from "services/workoutService.js";
import * as historyService from "services/historyService.js";
import * as selectorService from "services/selectorService.js";

/* ==========================================================================
   ACTIVE EXERCISE CARD - Skip Actions

   Handles skipping sets and rest periods for both normal and dual-mode workouts.

   Dependencies: timerService, workoutService, historyService, selectorService
   Used by: active-exercise-card.actions.js
   ========================================================================== */

/* === SKIP SET === */
export function handleSkipSet(side = null) {
  selectorService.closeAll();
  let targetLogEntry, targetIndex;
  const sourceLogEntry =
    appState.session.workoutLog[appState.session.currentLogIndex];
  if (!sourceLogEntry) return;

  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return;

    /* 🔒 CEMENT: Skip actions follow same alternating pattern as log actions */
    if (!canLogDualModeSide(side)) return;

    targetIndex = appState.session.workoutLog.findIndex(
      (log) => log.status === "pending" && log.supersetSide === side
    );
    if (targetIndex === -1) return;
    targetLogEntry = appState.session.workoutLog[targetIndex];
  } else {
    targetIndex = appState.session.currentLogIndex;
    targetLogEntry = sourceLogEntry;
  }
  if (!targetLogEntry) return;

  targetLogEntry.status = "skipped";
  targetLogEntry.timestamp = formatTimestamp(new Date());
  historyService.addOrUpdateLog(targetLogEntry);

  const hasMoreOverallPending = appState.session.workoutLog.some(
    (log) => log.status === "pending"
  );

  if (hasMoreOverallPending) {
    const lastLoggedData = {
      index: targetIndex,
      weight: sourceLogEntry.weight,
      reps: sourceLogEntry.reps,
    };
    if (appState.superset.isActive || appState.partner.isActive) {
      const target = side === "left" ? "supersetLeft" : "supersetRight";
      appState.session.lastLoggedSet[target] = lastLoggedData;
      if (
        appState.superset.isActive &&
        appState.superset.timeDeductionSetIndexes.includes(targetIndex)
      ) {
        appState.superset.bonusMinutes = Math.max(
          0,
          appState.superset.bonusMinutes - 1
        );
      }
      const hasMoreSetsOnThisSide = appState.session.workoutLog.some(
        (log) => log.status === "pending" && log.supersetSide === side
      );
      if (hasMoreSetsOnThisSide) {
        startSupersetRestTimer(side, "skip");
      } else {
        workoutService.recalculateCurrentStateAfterLogChange();
        workoutService.updateWorkoutCompletionState();
      }
    } else {
      appState.session.lastLoggedSet.normal = lastLoggedData;
      startNormalRestTimer("skip");
    }
  } else {
    workoutService.updateWorkoutCompletionState();
    workoutService.recalculateCurrentStateAfterLogChange();
  }
}

/* === SKIP REST === */
export function handleSkipRest(side = null) {
  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return;
    handleSupersetRestCompletion(side, { wasSkipped: true });
  } else {
    handleNormalRestCompletion({ wasSkipped: true });
  }
}
