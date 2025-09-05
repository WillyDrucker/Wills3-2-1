import { appState } from "state";
import * as navigationService from "services/navigationService.js";
import * as scrollService from "services/scrollService.js";
import * as selectorService from "services/selectorService.js";
import * as persistenceService from "services/persistenceService.js";
import * as workoutService from "services/workoutService.js";
import * as modalService from "services/modalService.js";
import { getNextWorkoutDay } from "utils";

// Feature Handlers
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
} from "features/config-card/config-card.index.js";
import {
  handleLogSet,
  handleSkipSet,
  handleSkipRest,
  handleExerciseSwap,
} from "features/active-exercise-card/active-exercise-card.index.js";
import { toggleFullScreen } from "lib/fullscreen.js";

let coreActions = {};

function handleVisibilityChangeForSelectors() {
  if (document.visibilityState === "hidden") {
    selectorService.closeAll();
  }
}

export function initialize(dependencies) {
  coreActions = dependencies;

  document.body.addEventListener("click", (event) => {
    try {
      const target = event.target;

      const actionTarget = target.closest("[data-action]");
      if (actionTarget) {
        const {
          action,
          logIndex: logIndexStr,
          side,
          videoUrl,
        } = actionTarget.dataset;
        const logIndex = logIndexStr ? parseInt(logIndexStr, 10) : null;

        const actions = {
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
            const container = e.target.closest(
              ".completion-animation-container"
            );
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
          scrollToActiveCard: scrollService.scrollToActiveCard,
          scrollToWorkoutLog: scrollService.scrollToWorkoutLog,
          scrollToConfigCard: scrollService.scrollToConfigCard,
          openSupersetModal: () => {
            let initialDay1 = appState.session.currentDayName;
            if (appState.weeklyPlan[initialDay1]?.title === "Rest") {
              initialDay1 = getNextWorkoutDay(initialDay1);
            }
            appState.ui.supersetModal.selection.day1 = initialDay1;
            appState.ui.supersetModal.selection.day2 =
              getNextWorkoutDay(initialDay1);
            modalService.open("superset");
          },
          openPartnerMode: () => {
            let initialDay = appState.session.currentDayName;
            if (appState.weeklyPlan[initialDay]?.title === "Rest") {
              initialDay = getNextWorkoutDay(initialDay);
            }
            appState.partner.user1Day = initialDay;
            appState.partner.user2Day = initialDay;
            modalService.open("partner");
          },
          openResetConfirmationModal: () => modalService.open("reset"),
          setNormalMode: () => {
            selectorService.closeAll();
            navigationService.setNormalMode();
            coreActions.updateActiveWorkoutAndLog();
          },
          logSet: () => {
            if (handleLogSet(side)) {
              coreActions.renderAll();
              persistenceService.saveState();
            }
          },
          skipSet: () => {
            handleSkipSet(side);
            coreActions.renderAll();
            persistenceService.saveState();
          },
          skipRest: () => handleSkipRest(side),
          updateLog: () => {
            if (
              handleUpdateLog(
                logIndex,
                parseFloat(
                  document.getElementById(`weight-edit-${logIndex}-input`).value
                ),
                parseFloat(
                  document.getElementById(`reps-edit-${logIndex}-input`).value
                )
              )
            ) {
              workoutService.recalculateCurrentStateAfterLogChange({
                shouldScroll: true,
              });
              coreActions.renderAll();
              persistenceService.saveState();
            }
            selectorService.closeAll();
          },
          clearSet: () => {
            selectorService.closeAll();
            handleClearSet(logIndex);
            coreActions.renderAll();
            persistenceService.saveState();
          },
          cancelLog: selectorService.closeAll,
          closeSupersetModal: () => modalService.close(),
          confirmSuperset: () => {
            handleConfirmSuperset();
            coreActions.updateActiveWorkoutAndLog();
          },
          closePartnerModal: () => modalService.close(),
          confirmPartnerWorkout: () => {
            handleConfirmPartnerWorkout();
            coreActions.updateActiveWorkoutAndLog();
          },
          closeResetConfirmationModal: () => modalService.close(),
          confirmReset: () => {
            handleConfirmReset();
            coreActions.resetSessionAndLogs();
          },
          showVideo: () => handleShowVideo(videoUrl),
          closeVideo: handleCloseVideo,
        };

        if (actions[action]) {
          actions[action](event);
          return;
        }
      }

      const listItemTarget = target.closest("details[open] li");
      if (listItemTarget) {
        if (
          listItemTarget.classList.contains("is-muted") ||
          listItemTarget.dataset.action
        )
          return;

        const { day, plan, time, exerciseSwap, historyTab } =
          listItemTarget.dataset;

        if (historyTab) handleHistoryTabChange(historyTab);
        if (day) {
          const parentPartnerModal = listItemTarget.closest(
            "#partner-modal-container"
          );
          const parentSupersetModal = listItemTarget.closest(
            "#superset-selection-modal-container"
          );
          if (parentPartnerModal) {
            const parentDetails = listItemTarget.closest("details");
            if (parentDetails.id === "partner-user1-day-selector")
              handlePartnerDaySelection("user1Day", day);
            if (parentDetails.id === "partner-user2-day-selector")
              handlePartnerDaySelection("user2Day", day);
          } else if (parentSupersetModal) {
            const parentDetails = listItemTarget.closest("details");
            const selectorId =
              parentDetails.id === "superset-selector-1" ? "day1" : "day2";
            handleSupersetSelection(selectorId, day);
          } else {
            handleDayChange(day);
            coreActions.updateActiveWorkoutAndLog();
          }
        }
        if (plan) {
          handlePlanChange(plan);
          coreActions.updateActiveWorkoutAndLog();
        }
        if (time) {
          handleTimeChange(time);
          coreActions.updateActiveWorkoutAndLog();
        }
        if (exerciseSwap) {
          handleExerciseSwap(exerciseSwap);
          coreActions.renderAll();
          persistenceService.saveState();
        }
        selectorService.closeAll();
        return;
      }

      const summaryTarget = target.closest("summary");
      if (summaryTarget) {
        event.preventDefault();
        const parentDetails = summaryTarget.parentElement;
        if (parentDetails.classList.contains("is-muted")) return;
        selectorService.toggle(parentDetails);
        return;
      }

      const nextUpTarget = target.closest(".is-next-up-clickable");
      if (nextUpTarget) {
        scrollService.scrollToActiveCard();
        return;
      }
      if (
        !target.closest(
          "details, .side-nav-content, .superset-modal-content, .video-content-wrapper"
        )
      ) {
        selectorService.closeAll();
        handleCloseSideNav();
      }
    } catch (error) {
      console.error("An error occurred in the event listener:", error);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (appState.ui.sideNav.isOpen) handleCloseSideNav();
      else if (appState.ui.videoPlayer.isVisible) handleCloseVideo();
      else if (appState.ui.activeModal) modalService.close();
      else selectorService.closeAll();
    }
  });

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChangeForSelectors
  );
  window.addEventListener("beforeunload", persistenceService.saveState);
}
