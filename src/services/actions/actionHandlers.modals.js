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
import { renderEditWorkoutModal } from "features/edit-workout-modal/edit-workout-modal.index.js";
import {
  handleConfirmSuperset,
} from "features/superset-modal/superset-modal.index.js";
import {
  handleConfirmPartnerWorkout,
} from "features/partner-modal/partner-modal.index.js";
import { handleConfirmReset } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
import { handleConfirmNewWorkout } from "features/new-workout-modal/new-workout-modal.index.js";
import { markCurrentWorkoutCommitted, updateHistoricalLog, deleteHistoricalLog, deleteEntireWorkout, restoreEntireWorkout } from "services/data/historyService.js";
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
      // Delete current workout from history and database before resetting
      const currentSessionId = appState.session.id;
      if (currentSessionId) {
        deleteEntireWorkout(currentSessionId);
      }
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

        // Store original workout state for change tracking (deep clone with normalized numbers)
        const workout = appState.user.history.workouts.find((w) => w.id === workoutId);
        if (workout) {
          // Deep clone and normalize reps/weight to numbers
          const clonedWorkout = JSON.parse(JSON.stringify(workout));
          clonedWorkout.logs = clonedWorkout.logs.map(log => ({
            ...log,
            reps: Number(log.reps),
            weight: Number(log.weight)
          }));

          appState.ui.editWorkout.originalWorkout = clonedWorkout;
          appState.ui.editWorkout.hasChanges = false;
        }

        // Clear history selector selection when opening modal
        appState.ui.selectedHistoryWorkoutId = null;

        // Open modal with skipPageRender to avoid reloading My Data page
        modalService.open("editWorkout", false, true);
      }
    },

    closeEditWorkoutModal: () => {
      // Clear selector and edit state
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;
      appState.ui.editWorkout.hasChanges = false;

      // Close modal first (needs selectedWorkoutId for final render)
      modalService.close();

      // Then clear workout ID and refresh display
      appState.ui.selectedWorkoutId = null;
      if (appState.ui.currentPage === "myData") {
        refreshMyDataPageDisplay();
      }
    },

    cancelWorkoutLog: (event) => {
      // Close the details element (edit panel)
      const details = event.target.closest("details");
      if (details) {
        details.open = false;
        // Clear selector-open state to unmute other edit panels
        document.body.classList.remove('is-selector-open');
      }
    },

    updateWorkoutLog: (event) => {
      const button = event.target;
      const workoutId = Number(button.dataset.workoutId);
      const setNumber = Number(button.dataset.setNumber);
      const supersetSide = button.dataset.supersetSide || "";
      const exerciseName = button.dataset.exerciseName;
      const logIndex = Number(button.dataset.logIndex); // Unique index for input field IDs

      // Find the details element (parent of edit panel)
      const details = button.closest("details");
      if (!details) return;

      // Find the input fields using unique index-based ID
      const logId = `${workoutId}-${logIndex}`;
      const repsInput = document.getElementById(`reps-edit-${logId}-input`);
      const weightInput = document.getElementById(`weight-edit-${logId}-input`);

      if (!repsInput || !weightInput) {
        console.error("Input fields not found for log:", logId);
        return;
      }

      const reps = Number(repsInput.value);
      const weight = Number(weightInput.value);

      // Update the log in history (now includes exerciseName for correct identification)
      updateHistoricalLog(workoutId, setNumber, supersetSide, exerciseName, reps, weight);

      // Close the edit panel
      details.open = false;

      // Re-render only the Edit Workout modal (don't trigger full page render)
      renderEditWorkoutModal();
    },

    deleteWorkoutLog: (event) => {
      // Prevent event from bubbling to backdrop and triggering backdrop click handler
      event.stopPropagation();
      event.preventDefault();

      const button = event.target.closest('.button-clear-set');
      if (!button) {
        console.error("Delete button not found in event delegation");
        return;
      }

      const workoutId = Number(button.dataset.workoutId);
      const setNumber = Number(button.dataset.setNumber);
      const supersetSide = button.dataset.supersetSide || "";
      const exerciseName = button.dataset.exerciseName;

      // Store context for Delete Log modal
      appState.ui.deleteLogContext = {
        workoutId,
        setNumber,
        supersetSide,
        exerciseName,
      };

      // Close the edit panel before opening modal
      const details = button.closest("details");
      if (details) {
        details.open = false;
        document.body.classList.remove('is-selector-open');
      }

      // Open Delete Log confirmation modal (stacked on Edit Workout modal)
      modalService.open("deleteLog", true, true);
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

      const { workoutId, setNumber, supersetSide, exerciseName } = context;

      // Delete the log (returns true if entire workout was deleted)
      const wasWorkoutDeleted = deleteHistoricalLog(workoutId, setNumber, supersetSide, exerciseName);

      // Clear delete context
      appState.ui.deleteLogContext = null;

      // If entire workout was deleted, clear ALL selector and modal state BEFORE closing
      if (wasWorkoutDeleted) {
        // Clear selector state (prevents selector from staying open)
        appState.ui.selectedHistoryWorkoutId = null;
        appState.ui.selectedWorkoutId = null;

        // Clear Edit Workout modal state
        appState.ui.editWorkout.originalWorkout = null;
        appState.ui.editWorkout.hasChanges = false;
        appState.ui.editWorkout.changeCount = 0;

        // Close Delete Log modal (returns to Edit Workout)
        modalService.close();

        // Close Edit Workout modal immediately (workout no longer exists)
        modalService.close(false);

        // Refresh My Data page to remove deleted workout selector
        refreshMyDataPageDisplay();
      } else {
        // Just one log deleted, stay in Edit Workout modal
        modalService.close();
      }
    },

    // === EDIT WORKOUT MODAL ENHANCEMENTS ===
    // Check if workout has been modified (logs deleted, state changes, or uncommitted input changes)
    // Returns object: { hasChanges: boolean, changeCount: number }
    hasEditWorkoutChanges: () => {
      const { selectedWorkoutId, editWorkout } = appState.ui;
      const { originalWorkout } = editWorkout;

      if (!selectedWorkoutId || !originalWorkout) return { hasChanges: false, changeCount: 0 };

      let currentWorkout = appState.user.history.workouts.find((w) => w.id === selectedWorkoutId);
      if (!currentWorkout) return { hasChanges: false, changeCount: 0 };

      let changeCount = 0;

      // Normalize current workout as well (create a copy to avoid mutating state)
      currentWorkout = {
        ...currentWorkout,
        logs: currentWorkout.logs.map(log => ({
          ...log,
          reps: Number(log.reps),
          weight: Number(log.weight)
        }))
      };

      // Check if number of logs changed (deletion) - each deleted log counts as 1 change
      const deletedCount = Math.abs(currentWorkout.logs.length - originalWorkout.logs.length);
      if (deletedCount > 0) {
        changeCount += deletedCount;
      }

      // Check state changes (logs that were updated and saved)
      // Use identity-based comparison instead of index-based to avoid false positives when logs are deleted
      // Create map of original logs by identity (exercise name + set number + superset side)
      const originalLogsMap = new Map();
      originalWorkout.logs.forEach(log => {
        const key = `${log.exercise.exercise_name}-${log.setNumber}-${log.supersetSide || ''}`;
        originalLogsMap.set(key, { reps: Number(log.reps), weight: Number(log.weight) });
      });

      // Compare current logs to original by identity
      currentWorkout.logs.forEach(log => {
        const key = `${log.exercise.exercise_name}-${log.setNumber}-${log.supersetSide || ''}`;
        const original = originalLogsMap.get(key);

        if (original) {
          const currentReps = Number(log.reps);
          const currentWeight = Number(log.weight);

          if (currentReps !== original.reps || currentWeight !== original.weight) {
            changeCount++;
          }
        }
      });

      const hasChanges = changeCount > 0;
      return { hasChanges, changeCount };
    },

    cancelEditWorkout: () => {
      // Check for unsaved changes (only if original workout was stored)
      const hasOriginal = appState.ui.editWorkout.originalWorkout !== null;

      const changeResult = hasOriginal ? getModalHandlers(coreActions).hasEditWorkoutChanges() : { hasChanges: false, changeCount: 0 };

      if (changeResult.hasChanges) {
        // Store change count for Cancel Changes modal to display
        appState.ui.editWorkout.changeCount = changeResult.changeCount;

        // Open Cancel Changes modal (stacked on top of Edit Workout modal)
        modalService.open("cancelChanges", true, true);
      } else {
        // No changes (or no original to compare), close normally
        // Clear selector state BEFORE closing modal
        appState.ui.selectedHistoryWorkoutId = null;
        appState.ui.selectedWorkoutId = null;
        appState.ui.editWorkout.originalWorkout = null;
        appState.ui.editWorkout.hasChanges = false;
        appState.ui.editWorkout.changeCount = 0;

        // Close modal without full page render (faster, no DB reload)
        modalService.close(false);

        // Update My Data page display to close selector (preserves scroll automatically)
        refreshMyDataPageDisplay();
      }
    },

    handleEditWorkoutBackdropClick: (event) => {
      // Verify the click was actually on the Edit Workout backdrop, not from a nested modal
      // This prevents clicks from Delete Workout modal from triggering cancel flow
      const target = event?.target;
      const isEditWorkoutBackdrop = target?.classList.contains('superset-modal-backdrop') &&
                                    target?.dataset.action === 'handleEditWorkoutBackdropClick';

      if (!isEditWorkoutBackdrop) {
        return;
      }

      // Cancel the edit workout modal
      getModalHandlers(coreActions).cancelEditWorkout();
    },

    openDeleteWorkoutModal: () => {
      // Open Delete Workout confirmation modal (stacked on top of Edit Workout modal)
      modalService.open("deleteWorkout", true, true);
    },

    confirmDeleteWorkout: () => {
      const workoutId = appState.ui.selectedWorkoutId;
      if (!workoutId) {
        console.error("No workout selected for deletion");
        return;
      }

      // Delete entire workout from history and database
      deleteEntireWorkout(workoutId);

      // Clear selector and edit state
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.selectedWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;
      appState.ui.editWorkout.hasChanges = false;

      // Close ALL modals without full page render (faster, no DB reload)
      modalService.closeAll(false);

      // Update My Data page display to show deletion (preserves scroll automatically)
      refreshMyDataPageDisplay();
    },

    cancelDeleteWorkout: (event) => {
      // Prevent event from bubbling to Edit Workout backdrop
      if (event) {
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stop all handlers
        event.preventDefault();
      }
      // Close Delete Workout modal, return to Edit Workout modal
      modalService.close();
    },

    declineCancelChanges: () => {
      // Close Cancel Changes modal, return to Edit Workout modal
      modalService.close();
    },

    confirmCancelChanges: () => {
      const { selectedWorkoutId, editWorkout } = appState.ui;
      const { originalWorkout } = editWorkout;

      if (!selectedWorkoutId || !originalWorkout) {
        console.error("Cannot restore workout - missing original state", {
          selectedWorkoutId,
          hasOriginal: !!originalWorkout
        });
        modalService.close();
        return;
      }

      // Restore workout using historyService (updates state and database)
      const restored = restoreEntireWorkout(selectedWorkoutId, originalWorkout);

      if (!restored) {
        console.error("Failed to restore workout");
        modalService.close();
        return;
      }

      // Clear selector and edit state BEFORE closing modals
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.selectedWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;
      appState.ui.editWorkout.hasChanges = false;
      appState.ui.editWorkout.changeCount = 0;

      // Close all modals without full page render (faster, no DB reload)
      modalService.closeAll(false);

      // Update My Data page display to show restored data (preserves scroll automatically)
      refreshMyDataPageDisplay();
    },

    updateWorkout: () => {
      // Mark that changes have been made (for tracking purposes)
      appState.ui.editWorkout.hasChanges = true;

      // Clear selector and edit state BEFORE closing modal
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.selectedWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;

      // Close modal without full page render (faster, no DB reload)
      modalService.close(false);

      // Update My Data page display to show changes (preserves scroll automatically)
      refreshMyDataPageDisplay();
    },

    // === VIDEO PLAYER ===
    showVideo: (event, videoUrl) => handleShowVideo(videoUrl),

    closeVideo: handleCloseVideo,
  };
}
