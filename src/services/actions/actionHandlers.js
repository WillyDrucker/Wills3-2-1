/* ==========================================================================
   ACTION HANDLERS - Event Callback Implementations

   All data-action callback functions for the event delegation system. Each
   handler is called from actionService.js when a matching data-action is found.

   Config header locking prevents collapse during selector operations:
   - Lock set before operation: configHeaderLocked = true
   - Unlock after operation completes and selectors close
   - Ensures expanded state persists during day/plan/exercise changes

   "Let's Go!" button pulse animation triggers:
   - confirmSuperset: Triggered immediately when selector displays after confirmation
   - confirmPartnerWorkout: Triggered immediately when selector displays after confirmation
   - handleDaySelection: Triggered immediately when Current Focus selector displays
   - cycleNextSession: Triggered only if not already pulsing (non-interrupting)
   - cyclePreviousSession: Triggered only if not already pulsing (non-interrupting)
   - handleTimeSelection: Triggered only if not already pulsing (non-interrupting)
   - Animation runs in parallel with selector grow/glow animations
   - Session changes won't interrupt ongoing pulse from superset/partner/day changes

   Quick Button grow animations (on "Let's Go!" close only):
   - toggleConfigHeader: Detects changes in plan/focus/session values
   - Compares snapshot to current state on config close
   - Triggers grow-snap animations on changed Quick Buttons
   - Animations run simultaneously, never on Cancel

   Dependencies: appState, feature handlers, core services, persistenceService,
                 selectorAnimationService
   Used by: actions/actionService.js (action map)
   ========================================================================== */

import { appState } from "state";
import * as navigationService from "services/core/navigationService.js";
import * as scrollService from "services/ui/scrollService.js";
import * as selectorService from "services/ui/selectorService.js";
import { animateSelector, animateSelectors, triggerLetsGoButtonPulse, stopLetsGoButtonPulse, restoreLetsGoButtonPulse } from "services/ui/selectorAnimationService.js";
import * as persistenceService from "services/core/persistenceService.js";
import * as workoutService from "services/workout/workoutService.js";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import * as modalService from "services/ui/modalService.js";
import { getNextWorkoutDay } from "utils";
import { canCycleToSession } from "utils";
import { signOut as authSignOut } from "services/authService.js";
import { renderConfigHeader, renderSessionDisplay, notifyConfigHeaderToggled, initializeConfigHeader, cancelConfigChanges } from "features/config-card/config-card.header.index.js";

import {
  handleHistoryTabChange,
  handlePreviousWeek,
  handleNextWeek,
} from "features/my-data/my-data.index.js";
import {
  handleOpenSideNav,
  handleCloseSideNav,
} from "features/side-nav/side-nav.index.js";
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
import {
  handleSupersetSelection,
  handleConfirmSuperset,
} from "features/superset-modal/superset-modal.index.js";
import {
  handlePartnerDaySelection,
  handleConfirmPartnerWorkout,
} from "features/partner-modal/partner-modal.index.js";
import {
  handleUpdateLog,
  handleClearSet,
} from "features/workout-log/workout-log.index.js";
import {
  handleDayChange,
  handlePlanChange,
  handleTimeChange,
  saveConfigState,
  restoreConfigState,
  clearConfigState,
  resetToDefaults,
} from "features/config-card/config-card.index.js";
import {
  handleLogSet,
  handleSkipSet,
  handleSkipRest,
  handleExerciseSwap,
} from "features/active-exercise-card/active-exercise-card.index.js";
import {
  cycleNextSession,
  cyclePreviousSession,
} from "features/config-card/config-card.header.index.js";
import { toggleFullScreen } from "lib/fullscreen.js";

let coreActions = {};

export function initialize(dependencies) {
  coreActions = dependencies;
  initializeConfigHeader(dependencies.updateActiveWorkoutPreservingLogs);
}

export function getActionHandlers() {
  return {
    goHome: () => {
      navigationService.goToPage("home");
      coreActions.renderAll();
      persistenceService.saveState();
    },
    goToWorkout: () => {
      navigationService.goToPage("workout");
      coreActions.renderAll();
      persistenceService.saveState();
    },
    goToMyData: () => {
      navigationService.goToPage("myData");
      coreActions.renderAll();
      persistenceService.saveState();
    },
    goToProfile: () => {
      navigationService.goToPage("profile");
      handleCloseSideNav();
      coreActions.renderAll();
      persistenceService.saveState();
    },
    openSideNav: handleOpenSideNav,
    closeSideNav: handleCloseSideNav,
    closeSideNavIfBlank: (e) => {
      if (e.target.classList.contains("side-nav-content"))
        handleCloseSideNav();
    },
    signOut: async () => {
      const { error } = await authSignOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      handleCloseSideNav();
    },
    nukeEverything: persistenceService.nukeEverything,
    toggleFullScreen: () => {
      toggleFullScreen();
      handleCloseSideNav();
    },
    replayAnimation: (e) => {
      const container = e.target.closest(".completion-animation-container");
      if (!container) return;
      const plates = container.querySelectorAll(".plate");
      plates.forEach((plate) => {
        plate.style.animation = "none";
        void plate.offsetHeight;
        plate.style.animation = "";
      });
    },
    previousWeek: handlePreviousWeek,
    nextWeek: handleNextWeek,
    scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToActiveCard: () => {
      const activeCardElement = document.getElementById('active-exercise-card') || document.getElementById('dual-mode-card');
      if (activeCardElement) {
        activeCardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
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
    resetToDefaults: () => {
      resetToDefaults();
      coreActions.updateActiveWorkoutAndLog();
      coreActions.renderAll();
    },
    cycleNextSession: () => {
      cycleNextSession();
      coreActions.updateActiveWorkoutPreservingLogs();
      // Trigger pulse only if not already pulsing (won't interrupt ongoing animation)
      triggerLetsGoButtonPulse(appState);
    },
    cyclePreviousSession: () => {
      cyclePreviousSession();
      coreActions.updateActiveWorkoutPreservingLogs();
      // Trigger pulse only if not already pulsing (won't interrupt ongoing animation)
      triggerLetsGoButtonPulse(appState);
    },
    toggleConfigHeader: () => {
      const openSelector = document.querySelector("details[open]");
      if (openSelector) {
        const isInsideConfigHeader = openSelector.closest("#config-header");
        const isInsideModal = openSelector.closest(".superset-modal-container, .config-modal-container");
        const isInConfigGroup = isInsideConfigHeader || isInsideModal;
        if (!isInConfigGroup) {
          selectorService.closeAll();
          return;
        }
      }
      const wasExpanded = appState.ui.isConfigHeaderExpanded;
      appState.ui.isConfigHeaderExpanded = !appState.ui.isConfigHeaderExpanded;
      if (!wasExpanded && appState.ui.isConfigHeaderExpanded) {
        appState.ui.configHeaderSnapshot = {
          currentDayName: appState.session.currentDayName,
          currentTimeOptionName: appState.session.currentTimeOptionName,
          currentSessionColorClass: appState.session.currentSessionColorClass,
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
      }
      // Stop pulse when closing config
      if (wasExpanded && !appState.ui.isConfigHeaderExpanded) {
        stopLetsGoButtonPulse(appState);
      }

      // Detect changes for Quick Button animations (only on "Let's Go!" close)
      let animationFlags = null;
      if (wasExpanded && !appState.ui.isConfigHeaderExpanded && appState.ui.configHeaderSnapshot) {
        const snapshot = appState.ui.configHeaderSnapshot;

        // Check what changed
        const dayChanged = appState.session.currentDayName !== snapshot.currentDayName;
        const sessionChanged = appState.session.currentTimeOptionName !== snapshot.currentTimeOptionName;
        const supersetChanged = appState.superset.isActive !== snapshot.superset.isActive ||
                                appState.superset.day1 !== snapshot.superset.day1 ||
                                appState.superset.day2 !== snapshot.superset.day2;
        const partnerChanged = appState.partner.isActive !== snapshot.partner.isActive ||
                               appState.partner.user1Day !== snapshot.partner.user1Day ||
                               appState.partner.user2Day !== snapshot.partner.user2Day;

        // Determine which buttons to animate
        animationFlags = {
          animatePlan: supersetChanged || partnerChanged,
          animateFocus: dayChanged || supersetChanged || partnerChanged,
          animateSession: sessionChanged
        };
      }
      notifyConfigHeaderToggled();
      renderConfigHeader(animationFlags);
      persistenceService.saveState();
    },
    cancelConfigHeaderChanges: () => {
      cancelConfigChanges();
    },
    openResetConfirmationModal: () => modalService.open("reset"),
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
    setNormalMode: () => {
      selectorService.closeAll();
      navigationService.setNormalMode();
      coreActions.updateActiveWorkoutAndLog();
    },
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
          renderConfigHeader(animationFlags);
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
          renderConfigHeader(animationFlags);
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
    closeResetConfirmationModal: () => modalService.close(),
    confirmReset: () => {
      handleConfirmReset();
      coreActions.resetSessionAndLogs();
    },
    saveMyDataAndReset: () => {
      handleConfirmReset();
      // Reset session/logs but keep database entries (saves workout to My Data)
      coreActions.resetSessionAndLogs();
    },

    // === NEW WORKOUT MODAL ACTIONS (v5.5.5) ===
    // Triggered from workout-results-card "Begin Another Workout" button
    // Confirms workout saved to My Data, then resets Today's Workout
    openNewWorkoutModal: () => modalService.open("newWorkout"),
    closeNewWorkoutModal: () => modalService.close(),
    confirmNewWorkout: () => {
      handleConfirmNewWorkout();
      // Reset session/logs but keep database entries (workout preserved in My Data)
      coreActions.resetSessionAndLogs();
    },
    showVideo: (event, videoUrl) => handleShowVideo(videoUrl),
    closeVideo: handleCloseVideo,
  };
}

export function getSelectorHandlers() {
  return {
    handleHistoryTab: (historyTab) => handleHistoryTabChange(historyTab),
    handleDaySelection: (day, parentDetails) => {
      const parentPartnerModal = parentDetails.closest("#partner-modal-container");
      const parentSupersetModal = parentDetails.closest("#superset-selection-modal-container");
      if (parentPartnerModal) {
        if (parentDetails.id === "partner-user1-day-selector")
          handlePartnerDaySelection("user1Day", day);
        if (parentDetails.id === "partner-user2-day-selector")
          handlePartnerDaySelection("user2Day", day);
      } else if (parentSupersetModal) {
        const selectorId = parentDetails.id === "superset-primary-focus-selector" ? "day1" : "day2";
        handleSupersetSelection(selectorId, day);
      } else {
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
