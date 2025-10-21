/* ==========================================================================
   CONFIG HEADER - Cancel Logic

   Handles cancellation of config changes with state restoration from snapshot.
   Shared logic used by both Cancel button and click-outside handler.

   Cancel Flow:
   1. Stop pulse animation (config is closing)
   2. Clear locks and flags
   3. Close any open selectors
   4. Check if changes were made (session or dual-mode)
   5. If changed: Restore from snapshot + recalculate + re-render cards
   6. If unchanged: Just close header

   State Restoration:
   - Session values: day, time, color class
   - Dual-mode state: superset (isActive, day1, day2, bonusMinutes, timeDeductionSetIndexes)
   - Dual-mode state: partner (isActive, user1Day, user2Day)
   - Workout log: Preserved logged sets, recalculate progression

   CRITICAL: Avoid calling updateActiveWorkoutPreservingLogs() which would
   restart animations. Just restore state values, call minimal required
   functions, then render config header (doesn't touch active cards).

   Dependencies: appState, selectorService, stopLetsGoButtonPulse,
                 workoutProgressionService, workoutService, persistenceService,
                 active-exercise-card, workout-log
   Used by: actionHandlers.config.js, config-card.header.handlers.js
   ========================================================================== */

import { appState } from "state";
import * as selectorService from "services/ui/selectorService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { stopLetsGoButtonPulse } from "services/ui/selectorAnimationService.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { updateWorkoutTimeRemaining } from "services/workout/workoutService.js";
import { renderActiveExerciseCard } from "features/active-exercise-card/active-exercise-card.index.js";
import { renderWorkoutLog } from "features/workout-log/workout-log.index.js";
import { renderConfigHeader } from "./config-card.header.render.js";

/**
 * Cancel config changes and revert to snapshot
 * Shared logic used by both Cancel button and click-outside handler
 * Preserves logged workout history during restoration
 * @param {Object} ignoreNextOutsideClickRef - Reference to ignoreNextOutsideClick flag
 */
export function cancelConfigChanges(ignoreNextOutsideClickRef) {
  // Stop pulse animation when canceling (config is closing)
  stopLetsGoButtonPulse(appState);

  // Clear any locks and flags that might prevent closing
  appState.ui.configHeaderLocked = false;
  ignoreNextOutsideClickRef.value = false;

  // Close any open selectors inside config header
  selectorService.closeAll();

  if (appState.ui.configHeaderSnapshot) {
    const snapshot = appState.ui.configHeaderSnapshot;

    // Check if any session settings changed
    const sessionChanged =
      appState.session.currentDayName !== snapshot.currentDayName ||
      appState.session.currentTimeOptionName !== snapshot.currentTimeOptionName;

    // Check if dual-mode state changed
    const dualModeChanged =
      appState.superset.isActive !== snapshot.superset.isActive ||
      appState.superset.day1 !== snapshot.superset.day1 ||
      appState.superset.day2 !== snapshot.superset.day2 ||
      appState.partner.isActive !== snapshot.partner.isActive ||
      appState.partner.user1Day !== snapshot.partner.user1Day ||
      appState.partner.user2Day !== snapshot.partner.user2Day;

    const needsRestore = sessionChanged || dualModeChanged;

    appState.ui.isConfigHeaderExpanded = false;
    appState.ui.configHeaderSnapshot = null;

    if (needsRestore) {
      // Restore session values
      appState.session.currentDayName = snapshot.currentDayName;
      appState.session.currentTimeOptionName = snapshot.currentTimeOptionName;
      appState.session.currentSessionColorClass = snapshot.currentSessionColorClass;

      // Restore dual-mode state
      if (snapshot.superset) {
        appState.superset.isActive = snapshot.superset.isActive;
        appState.superset.day1 = snapshot.superset.day1;
        appState.superset.day2 = snapshot.superset.day2;
        appState.superset.bonusMinutes = snapshot.superset.bonusMinutes;
        appState.superset.timeDeductionSetIndexes = snapshot.superset.timeDeductionSetIndexes;
      }

      if (snapshot.partner) {
        appState.partner.isActive = snapshot.partner.isActive;
        appState.partner.user1Day = snapshot.partner.user1Day;
        appState.partner.user2Day = snapshot.partner.user2Day;
      }

      // Restore workout log if session or dual-mode changed
      if ((sessionChanged || dualModeChanged) && snapshot.workoutLog) {
        appState.session.workoutLog = snapshot.workoutLog;
        recalculateCurrentStateAfterLogChange();
        updateWorkoutTimeRemaining();
        renderActiveExerciseCard();
        renderWorkoutLog();
      }

      // Just close the config header - no need to regenerate workout
      // State is already restored from snapshot, preserving all animations
      renderConfigHeader();
    } else {
      // No changes, just close header
      appState.ui.isConfigHeaderExpanded = false;
      appState.ui.configHeaderSnapshot = null;
      renderConfigHeader();
    }
  } else {
    // No snapshot, just close header
    appState.ui.isConfigHeaderExpanded = false;
    renderConfigHeader();
  }

  persistenceService.saveState();
}
