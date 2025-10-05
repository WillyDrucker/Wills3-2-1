/* ==========================================================================
   ACTION HANDLERS - Event Callback Implementations

   All data-action callback functions for the event delegation system. Each
   handler is called from actionService.js when a matching data-action is found.

   🔒 CEMENT: Config header locking prevents collapse during selector operations
   - Lock set before operation: configHeaderLocked = true
   - Unlock after operation completes and selectors close
   - Ensures expanded state persists during day/plan/exercise changes

   Dependencies: appState, feature handlers, core services, persistenceService
   Used by: actions/actionService.js (action map)
   ========================================================================== */

import { appState } from "state";
import * as navigationService from "services/core/navigationService.js";
import * as scrollService from "services/ui/scrollService.js";
import * as selectorService from "services/ui/selectorService.js";
import * as persistenceService from "services/core/persistenceService.js";
import * as workoutService from "services/workout/workoutService.js";
import * as modalService from "services/ui/modalService.js";
import { getNextWorkoutDay } from "utils";
import { canCycleToSession } from "utils";
import { renderConfigHeader, renderSessionDisplay, notifyConfigHeaderToggled } from "features/config-card/config-card.header.index.js";

import {
  handleHistoryTabChange,
  handlePreviousWeek,
  handleNextWeek,
  handleClearHistory,
} from "features/my-data/my-data.index.js";
import {
  handleOpenSideNav,
  handleCloseSideNav,
} from "features/side-nav/side-nav.index.js";
import { handleConfirmReset } from "features/reset-confirmation-modal/reset-confirmation-modal.index.js";
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
    openSideNav: handleOpenSideNav,
    closeSideNav: handleCloseSideNav,
    closeSideNavIfBlank: (e) => {
      if (e.target.classList.contains("side-nav-content"))
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
    clearHistory: handleClearHistory,
    scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToActiveCard: () => {
      const activeCardElement = document.getElementById('active-exercise-card') || document.getElementById('dual-mode-card');
      if (activeCardElement) {
        activeCardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    openSupersetModal: () => {
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
    },
    cyclePreviousSession: () => {
      cyclePreviousSession();
      coreActions.updateActiveWorkoutPreservingLogs();
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
        };
      }
      notifyConfigHeaderToggled();
      renderConfigHeader();
      persistenceService.saveState();
    },
    cancelConfigHeaderChanges: () => {
      if (appState.ui.configHeaderSnapshot) {
        const snapshot = appState.ui.configHeaderSnapshot;
        const needsRestore =
          appState.session.currentDayName !== snapshot.currentDayName ||
          appState.session.currentTimeOptionName !== snapshot.currentTimeOptionName;
        appState.ui.isConfigHeaderExpanded = false;
        appState.ui.configHeaderSnapshot = null;
        notifyConfigHeaderToggled();
        if (needsRestore) {
          appState.session.currentDayName = snapshot.currentDayName;
          appState.session.currentTimeOptionName = snapshot.currentTimeOptionName;
          appState.session.currentSessionColorClass = snapshot.currentSessionColorClass;
          coreActions.updateActiveWorkoutAndLog();
        } else {
          renderConfigHeader();
        }
      } else {
        appState.ui.isConfigHeaderExpanded = false;
        notifyConfigHeaderToggled();
        renderConfigHeader();
      }
      persistenceService.saveState();
    },
    openResetConfirmationModal: () => modalService.open("reset"),
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
        workoutService.recalculateCurrentStateAfterLogChange({ shouldScroll: true });
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
      setTimeout(() => {
        appState.ui.configHeaderLocked = false;
        persistenceService.saveState();
      }, 0);
    },
    closePartnerModal: () => {
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
      setTimeout(() => {
        appState.ui.configHeaderLocked = false;
        persistenceService.saveState();
      }, 0);
    },
    closeResetConfirmationModal: () => modalService.close(),
    confirmReset: () => {
      handleConfirmReset();
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
        const selectorId = parentDetails.id === "superset-selector-1" ? "day1" : "day2";
        handleSupersetSelection(selectorId, day);
      } else {
        const wasExpanded = appState.ui.isConfigHeaderExpanded;
        if (wasExpanded) {
          appState.ui.configHeaderLocked = true;
          appState.ui.isConfigHeaderExpanded = true;
        }
        handleDayChange(day);
        coreActions.updateActiveWorkoutAndLog();
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
    },
    handleTimeSelection: (time) => {
      if (canCycleToSession(time)) {
        handleTimeChange(time);
        coreActions.updateActiveWorkoutPreservingLogs();
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
