/* ==========================================================================
   ACTION SERVICE - Event Delegation System

   Central event delegation for all user interactions. Routes DOM events to
   appropriate action handlers based on data-action attributes.

   🔒 CEMENT: Event delegation architecture
   - Single body click listener routes all data-action events
   - Selector list items handled separately (day/plan/time/exercise changes)
   - Summary clicks toggle selectors via selectorService
   - Click-outside closes selectors and side nav
   - Escape key closes modals, side nav, video player, or selectors

   Dependencies: appState, selectorService, persistenceService, actionHandlers
   Used by: appInitializerService.js (initialization)
   ========================================================================== */

import { appState } from "state";
import * as selectorService from "services/ui/selectorService.js";
import * as persistenceService from "services/core/persistenceService.js";
import { handleCloseSideNav } from "features/side-nav/side-nav.index.js";
import { handleCloseVideo } from "features/video-player/video-player.index.js";
import * as modalService from "services/ui/modalService.js";
import * as actionHandlers from "./actionHandlers.js";

function handleVisibilityChangeForSelectors() {
  if (document.visibilityState === "hidden") {
    selectorService.closeAll();
  }
}

export function initialize(dependencies) {
  actionHandlers.initialize(dependencies);
  const actions = actionHandlers.getActionHandlers();
  const selectorHandlers = actionHandlers.getSelectorHandlers();

  /* === CLICK DELEGATION === */
  document.body.addEventListener("click", (event) => {
    try {
      const target = event.target;

      /* Handle selector summary clicks (toggle) - MUST come before data-action check */
      /* This prevents summary clicks from triggering parent data-action attributes */
      const summaryTarget = target.closest("summary");
      if (summaryTarget) {
        event.preventDefault();
        const parentDetails = summaryTarget.parentElement;
        if (parentDetails.classList.contains("is-muted")) return;
        selectorService.toggle(parentDetails);
        return;
      }

      /* Handle data-action buttons/elements */
      const actionTarget = target.closest("[data-action]");
      if (actionTarget) {
        const { action, logIndex: logIndexStr, side, videoUrl } = actionTarget.dataset;
        const logIndex = logIndexStr ? parseInt(logIndexStr, 10) : null;

        if (actions[action]) {
          actions[action](event, side || logIndex || videoUrl);
          return;
        }
      }

      /* Handle selector list item clicks */
      const listItemTarget = target.closest("details[open] li");
      if (listItemTarget) {
        if (listItemTarget.classList.contains("is-muted") || listItemTarget.dataset.action)
          return;

        event.stopPropagation();

        const { day, plan, time, exerciseSwap, historyTab } = listItemTarget.dataset;

        if (historyTab) selectorHandlers.handleHistoryTab(historyTab);
        if (day) {
          const parentDetails = listItemTarget.closest("details");
          selectorHandlers.handleDaySelection(day, listItemTarget);
        }
        if (plan) selectorHandlers.handlePlanSelection(plan);
        if (time) selectorHandlers.handleTimeSelection(time);
        if (exerciseSwap) selectorHandlers.handleExerciseSwapSelection(exerciseSwap);

        /* Close selectors after selection */
        if (appState.ui.isConfigHeaderExpanded) {
          selectorService.closeAllExceptConfigHeader();
        } else {
          selectorService.closeAll();
        }

        /* Unlock config header after all operations complete */
        if (appState.ui.configHeaderLocked) {
          appState.ui.configHeaderLocked = false;
          persistenceService.saveState();
        }

        return;
      }

      /* Click outside - close selectors and side nav */
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

  /* === ESCAPE KEY HANDLER === */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (appState.ui.sideNav.isOpen) handleCloseSideNav();
      else if (appState.ui.videoPlayer.isVisible) handleCloseVideo();
      else if (appState.ui.activeModal) modalService.close();
      else selectorService.closeAll();
    }
  });

  /* === VISIBILITY CHANGE === */
  document.addEventListener("visibilitychange", handleVisibilityChangeForSelectors);

  /* === PERSISTENCE ON UNLOAD === */
  window.addEventListener("beforeunload", persistenceService.saveState);
}
