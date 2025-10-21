/* ==========================================================================
   ACTION HANDLERS - Workout Actions

   Handles workout set logging, skipping, and editing actions.
   Triggers re-renders and state persistence after each operation.

   Workout Actions:
   - logSet: Log weight/reps for current set
   - skipSet: Skip current set (marks as skipped)
   - skipRest: Skip rest timer (advance to next set immediately)
   - updateLog: Edit existing log entry (weight/reps)
   - clearSet: Remove log entry entirely
   - cancelLog: Close edit selector without saving

   State Updates:
   - recalculateCurrentStateAfterLogChange: Update progression after edits
   - renderAll: Re-render all UI sections
   - saveState: Persist to localStorage/database

   Dependencies: active-exercise-card, workout-log, selectorService,
                 workoutProgressionService, persistenceService
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import * as selectorService from "services/ui/selectorService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import {
  handleLogSet,
  handleSkipSet,
  handleSkipRest,
} from "features/active-exercise-card/active-exercise-card.index.js";
import {
  handleUpdateLog,
  handleClearSet,
} from "features/workout-log/workout-log.index.js";

/**
 * Get workout action handlers
 * @param {Object} coreActions - Core action dependencies
 * @returns {Object} Workout action handlers
 */
export function getWorkoutHandlers(coreActions) {
  return {
    logSet: (event, side) => {
      if (handleLogSet(side)) {
        coreActions.renderAll();
        persistenceService.saveState();
      }
    },

    skipSet: (event, side) => {
      handleSkipSet(side);
      coreActions.renderAll();
      persistenceService.saveState();
    },

    skipRest: (event, side) => handleSkipRest(side),

    updateLog: (event, logIndex) => {
      if (
        handleUpdateLog(
          logIndex,
          parseFloat(document.getElementById(`weight-edit-${logIndex}-input`).value),
          parseFloat(document.getElementById(`reps-edit-${logIndex}-input`).value)
        )
      ) {
        recalculateCurrentStateAfterLogChange({ shouldScroll: true });
        coreActions.renderAll();
        persistenceService.saveState();
      }
      selectorService.closeAll();
    },

    clearSet: (event, logIndex) => {
      selectorService.closeAll();
      handleClearSet(logIndex);
      coreActions.renderAll();
      persistenceService.saveState();
    },

    cancelLog: selectorService.closeAll,
  };
}
