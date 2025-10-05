import { appState } from "state";
import * as navigationService from "services/navigationService.js";
import * as scrollService from "services/scrollService.js";
import * as selectorService from "services/selectorService.js";
import * as persistenceService from "services/persistenceService.js";
import * as workoutService from "services/workoutService.js";
import * as modalService from "services/modalService.js";
import { getNextWorkoutDay } from "utils";
import { canCycleToSession } from "utils/sessionValidation.js";
import { renderConfigHeader, renderSessionDisplay, notifyConfigHeaderToggled } from "features/config-card/config-card.header.index.js";

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
            appState.ui.supersetModal.selection.day2 =
              getNextWorkoutDay(initialDay1);
            // Remember if config header was expanded before opening modal
            appState.ui.wasConfigHeaderExpandedBeforeModal = appState.ui.isConfigHeaderExpanded;
            // Lock config header to keep it open while modal is displayed
            if (appState.ui.isConfigHeaderExpanded) {
              appState.ui.configHeaderLocked = true;
            }
            // Allow stacking if config modal is open
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
            // Remember if config header was expanded before opening modal
            appState.ui.wasConfigHeaderExpandedBeforeModal = appState.ui.isConfigHeaderExpanded;
            // Lock config header to keep it open while modal is displayed
            if (appState.ui.isConfigHeaderExpanded) {
              appState.ui.configHeaderLocked = true;
            }
            // Allow stacking if config modal is open
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
            coreActions.updateActiveWorkoutPreservingLogs(); // Update workout log for new session + recalculate time
          },
          cyclePreviousSession: () => {
            cyclePreviousSession();
            coreActions.updateActiveWorkoutPreservingLogs(); // Update workout log for new session + recalculate time
          },
          toggleConfigHeader: () => {
            // One-selector-to-rule-them-all: Check if external selector group is open
            const openSelector = document.querySelector("details[open]");

            if (openSelector) {
              // Determine if it's in a different group (exercise or log group)
              const isInsideConfigHeader = openSelector.closest("#config-header");
              const isInsideModal = openSelector.closest(".superset-modal-container, .config-modal-container");
              const isInConfigGroup = isInsideConfigHeader || isInsideModal;

              if (!isInConfigGroup) {
                // External group (exercise or log) is open - close it but don't toggle config
                selectorService.closeAll();
                return; // Block toggle until external selector is closed
              }
            }

            const wasExpanded = appState.ui.isConfigHeaderExpanded;
            appState.ui.isConfigHeaderExpanded = !appState.ui.isConfigHeaderExpanded;

            // Save snapshot when opening config header
            if (!wasExpanded && appState.ui.isConfigHeaderExpanded) {
              appState.ui.configHeaderSnapshot = {
                currentDayName: appState.session.currentDayName,
                currentTimeOptionName: appState.session.currentTimeOptionName,
                currentSessionColorClass: appState.session.currentSessionColorClass,
              };
            }

            notifyConfigHeaderToggled(); // Prevent click-outside from triggering immediately
            renderConfigHeader(); // Targeted render to avoid animation resets
            persistenceService.saveState();
          },
          cancelConfigHeaderChanges: () => {
            // Restore snapshot values
            if (appState.ui.configHeaderSnapshot) {
              const snapshot = appState.ui.configHeaderSnapshot;
              const needsRestore =
                appState.session.currentDayName !== snapshot.currentDayName ||
                appState.session.currentTimeOptionName !== snapshot.currentTimeOptionName;

              // Close config header and clear snapshot
              appState.ui.isConfigHeaderExpanded = false;
              appState.ui.configHeaderSnapshot = null;
              notifyConfigHeaderToggled();

              if (needsRestore) {
                // Restore snapshot values
                appState.session.currentDayName = snapshot.currentDayName;
                appState.session.currentTimeOptionName = snapshot.currentTimeOptionName;
                appState.session.currentSessionColorClass = snapshot.currentSessionColorClass;

                // Full update to regenerate workout log and active exercise card (includes renderAll)
                coreActions.updateActiveWorkoutAndLog();
              } else {
                // No changes to revert, just render config header
                renderConfigHeader();
              }
            } else {
              // No snapshot, just close
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
          closeSupersetModal: () => {
            // Unlock config header
            appState.ui.configHeaderLocked = false;

            // Restore config header state when canceling (user didn't make changes)
            const shouldRestore = appState.ui.wasConfigHeaderExpandedBeforeModal;
            if (shouldRestore) {
              appState.ui.isConfigHeaderExpanded = true;
              appState.ui.wasConfigHeaderExpandedBeforeModal = false;
            }

            modalService.close();

            // Re-render after modal closes if we need to restore
            if (shouldRestore) {
              // Use setTimeout to ensure modal close rendering completes first
              setTimeout(() => {
                renderConfigHeader();
                persistenceService.saveState();
              }, 0);
            }
          },
          confirmSuperset: () => {
            handleConfirmSuperset();
            coreActions.updateActiveWorkoutAndLog();
            // Unlock config header AFTER everything settles
            setTimeout(() => {
              appState.ui.configHeaderLocked = false;
              persistenceService.saveState();
            }, 0);
          },
          closePartnerModal: () => {
            // Unlock config header
            appState.ui.configHeaderLocked = false;

            // Restore config header state when canceling (user didn't make changes)
            const shouldRestore = appState.ui.wasConfigHeaderExpandedBeforeModal;
            if (shouldRestore) {
              appState.ui.isConfigHeaderExpanded = true;
              appState.ui.wasConfigHeaderExpandedBeforeModal = false;
            }

            modalService.close();

            // Re-render after modal closes if we need to restore
            if (shouldRestore) {
              // Use setTimeout to ensure modal close rendering completes first
              setTimeout(() => {
                renderConfigHeader();
                persistenceService.saveState();
              }, 0);
            }
          },
          confirmPartnerWorkout: () => {
            handleConfirmPartnerWorkout();
            coreActions.updateActiveWorkoutAndLog();
            // Unlock config header AFTER everything settles
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

        // Prevent event from bubbling to document-level click handlers
        event.stopPropagation();

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
            // Lock config header to prevent collapsing during operation
            const wasExpanded = appState.ui.isConfigHeaderExpanded;

            if (wasExpanded) {
              appState.ui.configHeaderLocked = true;
              appState.ui.isConfigHeaderExpanded = true;
            }

            handleDayChange(day);
            coreActions.updateActiveWorkoutAndLog(); // This calls renderAll()

            // Note: Unlock happens after selector closing at the end of this handler
            // This ensures the lock is active during the entire operation
          }
        }
        if (plan) {
          // Lock config header to prevent collapsing during operation
          const wasExpanded = appState.ui.isConfigHeaderExpanded;
          if (wasExpanded) {
            appState.ui.configHeaderLocked = true;
            appState.ui.isConfigHeaderExpanded = true; // Ensure expanded BEFORE renderAll
          }

          handlePlanChange(plan);
          coreActions.updateActiveWorkoutAndLog(); // This calls renderAll()

          // Note: Unlock happens after selector closing at the end of this handler
        }
        if (time) {
          // 🔒 CEMENT: Validate before cycling to prevent removing logged sets
          if (canCycleToSession(time)) {
            handleTimeChange(time);
            coreActions.updateActiveWorkoutPreservingLogs(); // Preserve logged sets + targeted render
          }
        }
        if (exerciseSwap) {
          // Lock config header to prevent collapsing during operation
          const wasExpanded = appState.ui.isConfigHeaderExpanded;
          if (wasExpanded) {
            appState.ui.configHeaderLocked = true;
            appState.ui.isConfigHeaderExpanded = true; // Ensure expanded BEFORE renderAll
          }

          handleExerciseSwap(exerciseSwap);
          coreActions.renderAll(); // This calls renderAll()

          // Note: Unlock happens after selector closing at the end of this handler
        }
        // If config header is expanded, don't close its internal selectors
        if (appState.ui.isConfigHeaderExpanded) {
          selectorService.closeAllExceptConfigHeader();
        } else {
          selectorService.closeAll();
        }

        // Unlock config header after all operations complete
        if (appState.ui.configHeaderLocked) {
          appState.ui.configHeaderLocked = false;
          persistenceService.saveState();
        }

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
