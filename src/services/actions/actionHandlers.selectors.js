/* ==========================================================================
   ACTION HANDLERS - Selector Interactions

   Handles selector dropdown interactions for day, plan, time, exercise swap,
   and history tab selections. Each selector triggers appropriate state updates,
   animations, and re-renders.

   Selector Context Detection:
   - Config header selectors: Day, Plan, Time
   - Modal selectors: Superset (day1/day2), Partner (user1/user2)
   - Exercise swap selector: In active exercise card
   - History tab selector: In My Data page

   Config Header Locking:
   When config is expanded and selector changes occur, lock is set to prevent
   premature collapse. Lock cleared when selector animation completes.

   "Let's Go!" Button Pulse Triggers:
   - Day selection: Trigger pulse + selector animation immediately
   - Plan selection: Trigger pulse only if not already pulsing
   - Time selection: Trigger pulse only if not already pulsing (non-interrupting)

   Dependencies: appState, config-card, modal handlers, animation services
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import { appState } from "state";
import { canCycleToSession } from "utils";
import { triggerLetsGoButtonPulse, animateSelector } from "services/ui/selectorAnimationService.js";
import {
  handleDayChange,
  handlePlanChange,
  handleTimeChange,
} from "features/config-card/config-card.index.js";
import { handleExerciseSwap } from "features/active-exercise-card/active-exercise-card.index.js";
import { handleSupersetSelection } from "features/superset-modal/superset-modal.index.js";
import { handlePartnerDaySelection } from "features/partner-modal/partner-modal.index.js";
import { handleHistoryTabChange } from "features/my-data/my-data.index.js";

/**
 * Get selector action handlers
 * @param {Object} coreActions - Core action dependencies
 * @returns {Object} Selector action handlers
 */
export function getSelectorHandlers(coreActions) {
  return {
    handleHistoryTab: (historyTab) => handleHistoryTabChange(historyTab),

    handleDaySelection: (day, parentDetails) => {
      const parentPartnerModal = parentDetails.closest("#partner-modal-container");
      const parentSupersetModal = parentDetails.closest("#superset-selection-modal-container");

      if (parentPartnerModal) {
        // Partner modal day selection
        if (parentDetails.id === "partner-user1-day-selector")
          handlePartnerDaySelection("user1Day", day);
        if (parentDetails.id === "partner-user2-day-selector")
          handlePartnerDaySelection("user2Day", day);
      } else if (parentSupersetModal) {
        // Superset modal day selection
        const selectorId = parentDetails.id === "superset-primary-focus-selector" ? "day1" : "day2";
        handleSupersetSelection(selectorId, day);
      } else {
        // Config header day selection
        const wasExpanded = appState.ui.isConfigHeaderExpanded;
        if (wasExpanded) {
          appState.ui.configHeaderLocked = true;
          appState.ui.isConfigHeaderExpanded = true;
        }
        handleDayChange(day);
        coreActions.updateActiveWorkoutAndLog();

        // Trigger pulse and selector animation immediately when selector displays
        appState.ui.isLetsGoButtonPulsing = false;
        triggerLetsGoButtonPulse(appState);
        animateSelector('config-header-day-selector');
      }
    },

    handlePlanSelection: (plan) => {
      const wasExpanded = appState.ui.isConfigHeaderExpanded;
      if (wasExpanded) {
        appState.ui.configHeaderLocked = true;
        appState.ui.isConfigHeaderExpanded = true;
      }
      handlePlanChange(plan);
      coreActions.updateActiveWorkoutAndLog();

      // Trigger Let's Go button pulse (only if not already pulsing)
      if (!appState.ui.isLetsGoButtonPulsing) {
        triggerLetsGoButtonPulse(appState);
      }
    },

    handleTimeSelection: (time) => {
      if (canCycleToSession(time)) {
        handleTimeChange(time);
        coreActions.updateActiveWorkoutPreservingLogs();
        // Trigger pulse only if not already pulsing (won't interrupt ongoing animation)
        triggerLetsGoButtonPulse(appState);
      }
    },

    handleExerciseSwapSelection: (exerciseSwap) => {
      const wasExpanded = appState.ui.isConfigHeaderExpanded;
      if (wasExpanded) {
        appState.ui.configHeaderLocked = true;
        appState.ui.isConfigHeaderExpanded = true;
      }
      handleExerciseSwap(exerciseSwap);
      coreActions.renderAll();
    },
  };
}
