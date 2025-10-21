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
import {
  handleConfirmSuperset,
} from "features/superset-modal/superset-modal.index.js";
import {
  handleConfirmPartnerWorkout,
} from "features/partner-modal/partner-modal.index.js";
import { handleConfirmReset } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
import { handleConfirmNewWorkout } from "features/new-workout-modal/new-workout-modal.index.js";
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
      handleConfirmNewWorkout();
      // Reset session/logs but keep database entries (workout preserved in My Data)
      coreActions.resetSessionAndLogs();
    },

    // === VIDEO PLAYER ===
    showVideo: (event, videoUrl) => handleShowVideo(videoUrl),

    closeVideo: handleCloseVideo,
  };
}
