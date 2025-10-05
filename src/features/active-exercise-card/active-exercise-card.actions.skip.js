import { appState } from "state";
import { formatTimestamp } from "utils";
import {
  startNormalRestTimer,
  startSupersetRestTimer,
} from "services/timer/timerService.js";
import {
  handleNormalRestCompletion,
  handleSupersetRestCompletion,
} from "services/timer/timerCompletionService.js";
import { canLogDualModeSide, recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { updateWorkoutCompletionState } from "services/workout/workoutStateService.js";
import * as historyService from "services/data/historyService.js";
import * as selectorService from "services/ui/selectorService.js";

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
        recalculateCurrentStateAfterLogChange();
        updateWorkoutCompletionState();
      }
    } else {
      appState.session.lastLoggedSet.normal = lastLoggedData;
      startNormalRestTimer("skip");
    }
  } else {
    updateWorkoutCompletionState();
    recalculateCurrentStateAfterLogChange();
  }
}

/* === SKIP REST === */
export function handleSkipRest(side = null) {
  if (appState.superset.isActive || appState.partner.isActive) {
    if (!side) return;
    handleSupersetRestCompletion(appState.rest.superset[side], { wasSkipped: true });
  } else {
    handleNormalRestCompletion(appState.rest.normal, { wasSkipped: true });
  }
}
