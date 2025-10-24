/* ==========================================================================
   ACTION HANDLERS - Modal Operations

   Handles all modal open/close/confirm actions:
   - Superset modal: Day1/Day2 selection with state snapshot/restore
   - Partner modal: User1/User2 day selection with state snapshot/restore
   - Reset modals: Workout reset confirmation and options
   - New Workout modal: "Begin Another Workout" confirmation
   - Video player modal: Exercise demonstration videos

   State Snapshot/Restore Pattern:
   Modal open → save previousDualModeState snapshot
   Cancel → restore from snapshot
   Confirm → clear snapshot (accept new state)

   Config Header Integration:
   - Lock config header when modal opens (if already expanded)
   - Restore config header state after modal closes
   - Trigger animations after confirmation

   Dependencies: appState, modal handlers, modalService, animation services
   Used by: actionHandlers.index.js (combined action map)
   ========================================================================== */

import { appState } from "state";
import { getNextWorkoutDay } from "utils";
import * as modalService from "services/ui/modalService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { triggerLetsGoButtonPulse, animateSelectors } from "services/ui/selectorAnimationService.js";
import { renderConfigHeader } from "features/config-card/config-card.header.index.js";
import { handleCloseSideNav } from "features/side-nav/side-nav.index.js";
import { refreshMyDataPageDisplay } from "features/my-data/my-data.index.js";
import {
  handleConfirmSuperset,
} from "features/superset-modal/superset-modal.index.js";
import {
  handleConfirmPartnerWorkout,
} from "features/partner-modal/partner-modal.index.js";
import { handleConfirmReset } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
import { handleConfirmNewWorkout } from "features/new-workout-modal/new-workout-modal.index.js";
import { markCurrentWorkoutCommitted, updateHistoricalLog, deleteHistoricalLog } from "services/data/historyService.js";
import {
  handleResetWorkoutDefaults,
  handleResetWorkoutAndClearLogs,
  handleClearMyData,
} from "features/reset-modal/reset-modal.index.js";
import {
  handleShowVideo,
  handleCloseVideo,
} from "features/video-player/video-player.index.js";

/**
 * Get modal action handlers
 * @param {Object} coreActions - Core action dependencies
 * @returns {Object} Modal action handlers
 */
export function getModalHandlers(coreActions) {
  return {
    // === SUPERSET MODAL ===
    openSupersetModal: () => {
      // Save current state before modal opens (for Cancel restoration)
      appState.ui.previousDualModeState = {
        superset: {
          isActive: appState.superset.isActive,
          day1: appState.superset.day1,
          day2: appState.superset.day2,
          bonusMinutes: appState.superset.bonusMinutes,
          timeDeductionSetIndexes: [...(appState.superset.timeDeductionSetIndexes || [])]
        },
        partner: {
          isActive: appState.partner.isActive,
          user1Day: appState.partner.user1Day,
          user2Day: appState.partner.user2Day
        },
        workoutLog: appState.session.workoutLog ? [...appState.session.workoutLog] : null
      };

      let initialDay1 = appState.session.currentDayName;
      if (appState.weeklyPlan[initialDay1]?.title === "Rest") {
        initialDay1 = getNextWorkoutDay(initialDay1);
      }
      appState.ui.supersetModal.selection.day1 = initialDay1;
      appState.ui.supersetModal.selection.day2 = getNextWorkoutDay(initialDay1);
      appState.ui.wasConfigHeaderExpandedBeforeModal = appState.ui.isConfigHeaderExpanded;
      if (appState.ui.isConfigHeaderExpanded) {
        appState.ui.configHeaderLocked = true;
      }
      const allowStacking = appState.ui.activeModal === "config";
      modalService.open("superset", allowStacking);
    },

    closeSupersetModal: () => {
      // Restore previous dual-mode state (Cancel = revert to last known working state)
      if (appState.ui.previousDualModeState) {
        const prev = appState.ui.previousDualModeState;

        // Restore superset state
        appState.superset.isActive = prev.superset.isActive;
        appState.superset.day1 = prev.superset.day1;
        appState.superset.day2 = prev.superset.day2;
        appState.superset.bonusMinutes = prev.superset.bonusMinutes;
        appState.superset.timeDeductionSetIndexes = prev.superset.timeDeductionSetIndexes;

        // Restore partner state
        appState.partner.isActive = prev.partner.isActive;
        appState.partner.user1Day = prev.partner.user1Day;
        appState.partner.user2Day = prev.partner.user2Day;

        // Restore workout log
        if (prev.workoutLog) {
          appState.session.workoutLog = prev.workoutLog;
          recalculateCurrentStateAfterLogChange();
        }

        // Clear saved state
        appState.ui.previousDualModeState = null;
      }

      appState.ui.configHeaderLocked = false;
      const shouldRestore = appState.ui.wasConfigHeaderExpandedBeforeModal;
      if (shouldRestore) {
        appState.ui.isConfigHeaderExpanded = true;
        appState.ui.wasConfigHeaderExpandedBeforeModal = false;
      }
      modalService.close();
      if (shouldRestore) {
        setTimeout(() => {
          renderConfigHeader();
          persistenceService.saveState();
        }, 0);
      }
    },

    confirmSuperset: () => {
      handleConfirmSuperset();
      coreActions.updateActiveWorkoutAndLog();
      // Clear saved state (confirmation = accept new state)
      appState.ui.previousDualModeState = null;
      setTimeout(() => {
        appState.ui.configHeaderLocked = false;
        persistenceService.saveState();

        // Trigger pulse and selector animations immediately when selector displays
        appState.ui.isLetsGoButtonPulsing = false;
        triggerLetsGoButtonPulse(appState);
        animateSelectors(['current-plan-selector', 'config-header-day-selector']);
      }, 0);
    },

    // === PARTNER MODAL ===
    openPartnerMode: () => {
      // Save current state before modal opens (for Cancel restoration)
      appState.ui.previousDualModeState = {
        superset: {
          isActive: appState.superset.isActive,
          day1: appState.superset.day1,
          day2: appState.superset.day2,
          bonusMinutes: appState.superset.bonusMinutes,
          timeDeductionSetIndexes: [...(appState.superset.timeDeductionSetIndexes || [])]
        },
        partner: {
          isActive: appState.partner.isActive,
          user1Day: appState.partner.user1Day,
          user2Day: appState.partner.user2Day
        },
        workoutLog: appState.session.workoutLog ? [...appState.session.workoutLog] : null
      };

      let initialDay = appState.session.currentDayName;
      if (appState.weeklyPlan[initialDay]?.title === "Rest") {
        initialDay = getNextWorkoutDay(initialDay);
      }
      appState.partner.user1Day = initialDay;
      appState.partner.user2Day = initialDay;
      appState.ui.wasConfigHeaderExpandedBeforeModal = appState.ui.isConfigHeaderExpanded;
      if (appState.ui.isConfigHeaderExpanded) {
        appState.ui.configHeaderLocked = true;
      }
      const allowStacking = appState.ui.activeModal === "config";
      modalService.open("partner", allowStacking);
    },

    closePartnerModal: () => {
      // Restore previous dual-mode state (Cancel = revert to last known working state)
      if (appState.ui.previousDualModeState) {
        const prev = appState.ui.previousDualModeState;

        // Restore superset state
        appState.superset.isActive = prev.superset.isActive;
        appState.superset.day1 = prev.superset.day1;
        appState.superset.day2 = prev.superset.day2;
        appState.superset.bonusMinutes = prev.superset.bonusMinutes;
        appState.superset.timeDeductionSetIndexes = prev.superset.timeDeductionSetIndexes;

        // Restore partner state
        appState.partner.isActive = prev.partner.isActive;
        appState.partner.user1Day = prev.partner.user1Day;
        appState.partner.user2Day = prev.partner.user2Day;

        // Restore workout log
        if (prev.workoutLog) {
          appState.session.workoutLog = prev.workoutLog;
          recalculateCurrentStateAfterLogChange();
        }

        // Clear saved state
        appState.ui.previousDualModeState = null;
      }

      appState.ui.configHeaderLocked = false;
      const shouldRestore = appState.ui.wasConfigHeaderExpandedBeforeModal;
      if (shouldRestore) {
        appState.ui.isConfigHeaderExpanded = true;
        appState.ui.wasConfigHeaderExpandedBeforeModal = false;
      }
      modalService.close();
      if (shouldRestore) {
        setTimeout(() => {
          renderConfigHeader();
          persistenceService.saveState();
        }, 0);
      }
    },

    confirmPartnerWorkout: () => {
      handleConfirmPartnerWorkout();
      coreActions.updateActiveWorkoutAndLog();
      // Clear saved state (confirmation = accept new state)
      appState.ui.previousDualModeState = null;
      setTimeout(() => {
        appState.ui.configHeaderLocked = false;
        persistenceService.saveState();

        // Trigger pulse and selector animations immediately when selector displays
        appState.ui.isLetsGoButtonPulsing = false;
        triggerLetsGoButtonPulse(appState);
        animateSelectors(['current-plan-selector', 'config-header-day-selector']);
      }, 0);
    },

    // === RESET MODALS ===
    openResetConfirmationModal: () => modalService.open("reset"),

    closeResetConfirmationModal: () => modalService.close(),

    confirmReset: () => {
      handleConfirmReset();
      coreActions.resetSessionAndLogs();
    },

    openResetOptionsModal: () => {
      handleCloseSideNav();
      modalService.open("resetOptions");
    },

    closeResetOptionsModal: () => modalService.close(),

    resetWorkoutDefaults: () => {
      if (handleResetWorkoutDefaults()) {
        modalService.close();
        coreActions.updateActiveWorkoutAndLog();
      }
    },

    resetWorkoutAndClearLogs: () => {
      handleResetWorkoutAndClearLogs();
      modalService.close();
      coreActions.updateActiveWorkoutAndLog();
    },

    clearMyData: () => {
      handleClearMyData();
      modalService.close();
      coreActions.renderAll();
    },

    saveMyDataAndReset: () => {
      // Mark current workout as committed before resetting
      markCurrentWorkoutCommitted();
      handleConfirmReset();
      // Reset session/logs but keep database entries (saves workout to My Data)
      coreActions.resetSessionAndLogs();
    },

    // === NEW WORKOUT MODAL ===
    // Triggered from workout-results-card "Begin Another Workout" button
    // Confirms workout saved to My Data, then resets Today's Workout
    openNewWorkoutModal: () => modalService.open("newWorkout"),

    closeNewWorkoutModal: () => modalService.close(),

    confirmNewWorkout: () => {
      // Mark current workout as committed before resetting
      markCurrentWorkoutCommitted();
      handleConfirmNewWorkout();
      // Reset session/logs but keep database entries (workout preserved in My Data)
      coreActions.resetSessionAndLogs();
    },

    // === HISTORY WORKOUT SELECTOR INTERACTION ===
    // Select a workout session - two-step behavior: close current, then click again to open new
    // Click-inside-to-close: Clicking anywhere in active selector closes it (except Edit button)
    selectHistoryWorkout: (event) => {
      // Prevent default to avoid view jumping
      event.preventDefault();

      // Check if Edit button was clicked - if so, let it handle the action
      if (event.target.closest(".history-edit-button")) {
        return; // Edit button handles its own logic
      }

      const selector = event.target.closest(".workout-session-selector");
      if (selector) {
        const workoutId = Number(selector.dataset.workoutId);

        // TWO-STEP BEHAVIOR: If there's already an active selection (any selector)
        // First click closes it, user must click again to open new selector
        if (appState.ui.selectedHistoryWorkoutId !== null) {
          // If clicking the already-active selector, close it (click-inside-to-close)
          // If clicking a different selector, also close the current one (two-step)
          appState.ui.selectedHistoryWorkoutId = null;
        } else {
          // No active selection, open this selector
          appState.ui.selectedHistoryWorkoutId = workoutId;
        }

        // Fast re-render without database reload
        refreshMyDataPageDisplay();
      }
    },

    // Cancel workout selection - closes popped selector
    cancelHistorySelection: () => {
      appState.ui.selectedHistoryWorkoutId = null;
      // Fast re-render without database reload
      refreshMyDataPageDisplay();
    },

    // === EDIT WORKOUT MODAL ===
    // Triggered from Edit button on active workout selector
    // Opens modal for editing historical workout logs
    openEditWorkoutModal: (event) => {
      // Prevent default to avoid scroll jumping
      event.preventDefault();
      event.stopPropagation();

      const button = event.target.closest(".history-edit-button");
      if (button) {
        const workoutId = Number(button.dataset.workoutId);
        appState.ui.selectedWorkoutId = workoutId;

        // Clear history selector selection when opening modal
        appState.ui.selectedHistoryWorkoutId = null;

        // Open modal (scroll preservation handled by refreshMyDataPageDisplay)
        modalService.open("editWorkout");
      }
    },

    closeEditWorkoutModal: () => {
      appState.ui.selectedWorkoutId = null;
      // Close modal (scroll preservation handled by refreshMyDataPageDisplay)
      modalService.close();
    },

    cancelWorkoutLog: (event) => {
      // Close the details element (edit panel)
      const details = event.target.closest("details");
      if (details) details.open = false;
    },

    updateWorkoutLog: (event) => {
      const button = event.target;
      const workoutId = Number(button.dataset.workoutId);
      const setNumber = Number(button.dataset.setNumber);
      const supersetSide = button.dataset.supersetSide || "";

      // Find the details element (parent of edit panel)
      const details = button.closest("details");
      if (!details) return;

      // Find the input fields
      const logIndex = `${workoutId}-${setNumber}-${supersetSide || "normal"}`;
      const repsInput = document.getElementById(`reps-edit-${logIndex}-input`);
      const weightInput = document.getElementById(`weight-edit-${logIndex}-input`);

      if (!repsInput || !weightInput) {
        console.error("Input fields not found for log:", logIndex);
        return;
      }

      const reps = Number(repsInput.value);
      const weight = Number(weightInput.value);

      // Update the log in history
      updateHistoricalLog(workoutId, setNumber, supersetSide, reps, weight);

      // Close the edit panel
      details.open = false;

      // Re-render to show updated values
      coreActions.renderAll();
    },

    deleteWorkoutLog: (event) => {
      const button = event.target;
      const workoutId = Number(button.dataset.workoutId);
      const setNumber = Number(button.dataset.setNumber);
      const supersetSide = button.dataset.supersetSide || "";

      // Store context for Delete Log modal
      appState.ui.deleteLogContext = {
        workoutId,
        setNumber,
        supersetSide,
      };

      // Open Delete Log confirmation modal
      modalService.open("deleteLog");
    },

    closeDeleteLogModal: () => {
      appState.ui.deleteLogContext = null;
      modalService.close();
    },

    confirmDeleteLog: () => {
      const context = appState.ui.deleteLogContext;
      if (!context) {
        console.error("Delete log context not found");
        return;
      }

      const { workoutId, setNumber, supersetSide } = context;

      // Delete the log (returns true if entire workout was deleted)
      const wasWorkoutDeleted = deleteHistoricalLog(workoutId, setNumber, supersetSide);

      // Close Delete Log modal
      appState.ui.deleteLogContext = null;
      modalService.close();

      // If entire workout was deleted, also close Update History modal
      if (wasWorkoutDeleted) {
        appState.ui.selectedWorkoutId = null;
      }

      // Re-render to show updated state
      coreActions.renderAll();
    },

    // === VIDEO PLAYER ===
    showVideo: (event, videoUrl) => handleShowVideo(videoUrl),

    closeVideo: handleCloseVideo,
  };
}
