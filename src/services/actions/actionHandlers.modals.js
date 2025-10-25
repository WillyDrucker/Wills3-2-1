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
          console.log("RAW workout from state (before clone):", {
            id: workoutId,
            firstLog: workout.logs[0] ? {
              reps: workout.logs[0].reps,
              weight: workout.logs[0].weight,
              types: [typeof workout.logs[0].reps, typeof workout.logs[0].weight]
            } : null,
            allLogsWeights: workout.logs.map(l => `Set ${l.setNumber}: ${l.weight} (${typeof l.weight})`)
          });

          // Deep clone and normalize reps/weight to numbers
          const clonedWorkout = JSON.parse(JSON.stringify(workout));
          clonedWorkout.logs = clonedWorkout.logs.map(log => ({
            ...log,
            reps: Number(log.reps),
            weight: Number(log.weight)
          }));

          appState.ui.editWorkout.originalWorkout = clonedWorkout;
          appState.ui.editWorkout.hasChanges = false;

          console.log("Stored original workout with normalized values:", {
            id: workoutId,
            firstLog: clonedWorkout.logs[0] ? {
              reps: clonedWorkout.logs[0].reps,
              weight: clonedWorkout.logs[0].weight,
              types: [typeof clonedWorkout.logs[0].reps, typeof clonedWorkout.logs[0].weight]
            } : null,
            allLogsWeights: clonedWorkout.logs.map(l => `Set ${l.setNumber}: ${l.weight}`)
          });
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

      console.log("RAW current workout from state (before normalization):", {
        firstLog: currentWorkout.logs[0] ? {
          reps: currentWorkout.logs[0].reps,
          weight: currentWorkout.logs[0].weight,
          types: [typeof currentWorkout.logs[0].reps, typeof currentWorkout.logs[0].weight]
        } : null,
        allLogsWeights: currentWorkout.logs.map(l => `Set ${l.setNumber}: ${l.weight} (${typeof l.weight})`)
      });

      // Normalize current workout as well (create a copy to avoid mutating state)
      currentWorkout = {
        ...currentWorkout,
        logs: currentWorkout.logs.map(log => ({
          ...log,
          reps: Number(log.reps),
          weight: Number(log.weight)
        }))
      };

      console.log("Comparing workouts:", {
        originalFirstLog: originalWorkout.logs[0] ? {
          reps: originalWorkout.logs[0].reps,
          weight: originalWorkout.logs[0].weight,
          types: [typeof originalWorkout.logs[0].reps, typeof originalWorkout.logs[0].weight]
        } : null,
        currentFirstLog: currentWorkout.logs[0] ? {
          reps: currentWorkout.logs[0].reps,
          weight: currentWorkout.logs[0].weight,
          types: [typeof currentWorkout.logs[0].reps, typeof currentWorkout.logs[0].weight]
        } : null,
        originalAllWeights: originalWorkout.logs.map(l => `Set ${l.setNumber}: ${l.weight}`),
        currentAllWeights: currentWorkout.logs.map(l => `Set ${l.setNumber}: ${l.weight}`)
      });

      // Check if number of logs changed (deletion) - each deleted log counts as 1 change
      const deletedCount = Math.abs(currentWorkout.logs.length - originalWorkout.logs.length);
      if (deletedCount > 0) {
        console.log("Change detected: log count changed", {
          original: originalWorkout.logs.length,
          current: currentWorkout.logs.length,
          deletedCount
        });
        changeCount += deletedCount;
      }

      // Check state changes (logs that were updated and saved)
      for (let i = 0; i < Math.min(currentWorkout.logs.length, originalWorkout.logs.length); i++) {
        const currentLog = currentWorkout.logs[i];
        const originalLog = originalWorkout.logs[i];

        const originalRepsNum = Number(originalLog.reps);
        const originalWeightNum = Number(originalLog.weight);
        const currentRepsNum = Number(currentLog.reps);
        const currentWeightNum = Number(currentLog.weight);

        if (currentRepsNum !== originalRepsNum || currentWeightNum !== originalWeightNum) {
          console.log("State change detected:", {
            index: i,
            exercise: currentLog.exercise?.exercise_name || "unknown",
            set: currentLog.setNumber
          });
          changeCount++;
        }
      }

      // Check uncommitted input field changes using captured panel states
      // (captured on mousedown before details elements close)
      const openPanelStates = editWorkout.openPanelStates || [];
      console.log("Checking uncommitted input changes from captured states:", openPanelStates);

      for (const panelState of openPanelStates) {
        if (panelState.reps !== panelState.originalReps || panelState.weight !== panelState.originalWeight) {
          const originalLog = originalWorkout.logs[panelState.index];
          console.log("Uncommitted input change detected:", {
            index: panelState.index,
            exercise: originalLog.exercise?.exercise_name || "unknown",
            set: originalLog.setNumber,
            inputValues: { reps: panelState.reps, weight: panelState.weight },
            originalValues: { reps: panelState.originalReps, weight: panelState.originalWeight }
          });
          changeCount++;
        }
      }

      const hasChanges = changeCount > 0;
      console.log("Total changes:", { hasChanges, changeCount });

      return { hasChanges, changeCount };
    },

    // Capture edit panel state before details elements close (called on mousedown)
    prepareCancelEditWorkout: () => {
      console.log("prepareCancelEditWorkout - starting");

      // Store which panels are currently open BEFORE they close from the click
      const hasOriginal = appState.ui.editWorkout.originalWorkout !== null;
      if (!hasOriginal) {
        console.log("  No original workout, skipping");
        return;
      }

      const { selectedWorkoutId, editWorkout } = appState.ui;
      const { originalWorkout } = editWorkout;

      console.log("  Checking for open panels...");

      // Store current state of open panels (before they close)
      const openPanelStates = [];
      for (let i = 0; i < originalWorkout.logs.length; i++) {
        const originalLog = originalWorkout.logs[i];
        const logIndex = `${selectedWorkoutId}-${originalLog.setNumber}-${originalLog.supersetSide || "normal"}`;

        const repsInput = document.getElementById(`reps-edit-${logIndex}-input`);
        const weightInput = document.getElementById(`weight-edit-${logIndex}-input`);

        console.log(`  Log ${i} (${originalLog.exercise?.exercise_name} Set ${originalLog.setNumber}):`, {
          logIndex,
          repsInputFound: !!repsInput,
          weightInputFound: !!weightInput
        });

        if (repsInput && weightInput) {
          const inputReps = Number(repsInput.value);
          const inputWeight = Number(weightInput.value);
          const originalReps = Number(originalLog.reps);
          const originalWeight = Number(originalLog.weight);

          console.log(`    Input values:`, {
            currentInputValues: { reps: inputReps, weight: inputWeight },
            originalValues: { reps: originalReps, weight: originalWeight },
            hasDifference: inputReps !== originalReps || inputWeight !== originalWeight
          });

          // Check if input differs from original (uncommitted change)
          // Don't check if panel is open - panel may have closed when user moved mouse away
          if (inputReps !== originalReps || inputWeight !== originalWeight) {
            const state = {
              index: i,
              logIndex,
              exercise: originalLog.exercise?.exercise_name,
              reps: inputReps,
              weight: inputWeight,
              originalReps: originalReps,
              originalWeight: originalWeight
            };
            openPanelStates.push(state);
            console.log(`    ✓ Capturing uncommitted change:`, state);
          } else {
            console.log(`    ✗ No changes, skipping`);
          }
        }
      }

      // Store in state for cancelEditWorkout to use
      appState.ui.editWorkout.openPanelStates = openPanelStates;
      console.log("Final captured open panel states:", openPanelStates);
    },

    cancelEditWorkout: () => {
      // Check for unsaved changes (only if original workout was stored)
      const hasOriginal = appState.ui.editWorkout.originalWorkout !== null;

      console.log("cancelEditWorkout - checking for changes", {
        hasOriginal,
        selectedWorkoutId: appState.ui.selectedWorkoutId
      });

      const changeResult = hasOriginal ? getModalHandlers(coreActions).hasEditWorkoutChanges() : { hasChanges: false, changeCount: 0 };

      console.log("cancelEditWorkout - result:", changeResult);

      // Clear captured panel states after use
      appState.ui.editWorkout.openPanelStates = null;

      if (changeResult.hasChanges) {
        // Store change count for Cancel Changes modal to display
        appState.ui.editWorkout.changeCount = changeResult.changeCount;

        // Open Cancel Changes modal (stacked on top of Edit Workout modal)
        modalService.open("cancelChanges", true, true);
      } else {
        // No changes (or no original to compare), close normally
        // Clear selector state but keep workout ID until after modal closes
        appState.ui.selectedHistoryWorkoutId = null;
        appState.ui.editWorkout.originalWorkout = null;
        appState.ui.editWorkout.hasChanges = false;
        appState.ui.editWorkout.changeCount = 0;

        // Close modal first (needs selectedWorkoutId for final render)
        modalService.close();

        // Then clear workout ID and refresh display
        appState.ui.selectedWorkoutId = null;
        if (appState.ui.currentPage === "myData") {
          refreshMyDataPageDisplay();
        }
      }
    },

    handleEditWorkoutBackdropClick: () => {
      // First capture panel state, then cancel
      getModalHandlers(coreActions).prepareCancelEditWorkout();
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
      appState.ui.editWorkout.originalWorkout = null;
      appState.ui.editWorkout.hasChanges = false;

      // Close Delete Workout modal (will also close Edit Workout modal via stack)
      modalService.close();

      // Clear workout ID after modal closes
      appState.ui.selectedWorkoutId = null;

      // Refresh My Data display without full render (modal close already rendered)
      if (appState.ui.currentPage === "myData") {
        refreshMyDataPageDisplay();
      }
    },

    cancelDeleteWorkout: () => {
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

      console.log("confirmCancelChanges - starting", {
        selectedWorkoutId,
        hasOriginal: !!originalWorkout
      });

      if (!selectedWorkoutId || !originalWorkout) {
        console.error("Cannot restore workout - missing original state", {
          selectedWorkoutId,
          hasOriginal: !!originalWorkout
        });
        modalService.close();
        return;
      }

      console.log("Before restore:", {
        originalFirstLog: originalWorkout.logs[0] ? {
          reps: originalWorkout.logs[0].reps,
          weight: originalWorkout.logs[0].weight
        } : null
      });

      // Restore workout using historyService (updates state and database)
      const restored = restoreEntireWorkout(selectedWorkoutId, originalWorkout);

      if (!restored) {
        console.error("Failed to restore workout");
        modalService.close();
        return;
      }

      console.log("After restore - checking state:", {
        restoredFirstLog: appState.user.history.workouts.find(w => w.id === selectedWorkoutId)?.logs[0] ? {
          reps: appState.user.history.workouts.find(w => w.id === selectedWorkoutId).logs[0].reps,
          weight: appState.user.history.workouts.find(w => w.id === selectedWorkoutId).logs[0].weight
        } : null
      });

      // Clear selector and edit state
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;
      appState.ui.editWorkout.hasChanges = false;
      appState.ui.editWorkout.changeCount = 0;

      // Close all modals (Cancel Changes + Edit Workout) and return to My Data
      modalService.closeAll();

      // Clear workout ID after modals are closed
      appState.ui.selectedWorkoutId = null;

      // Refresh My Data display without full render (modal close already rendered)
      if (appState.ui.currentPage === "myData") {
        refreshMyDataPageDisplay();
      }
    },

    updateWorkout: () => {
      // Mark that changes have been made (for tracking purposes)
      appState.ui.editWorkout.hasChanges = true;

      // Clear selector and edit state
      appState.ui.selectedHistoryWorkoutId = null;
      appState.ui.editWorkout.originalWorkout = null;

      // Close Edit Workout modal
      modalService.close();

      // Clear workout ID after modal closes
      appState.ui.selectedWorkoutId = null;

      // Refresh My Data display without full render (modal close already rendered)
      if (appState.ui.currentPage === "myData") {
        refreshMyDataPageDisplay();
      }
    },

    // === VIDEO PLAYER ===
    showVideo: (event, videoUrl) => handleShowVideo(videoUrl),

    closeVideo: handleCloseVideo,
  };
}
