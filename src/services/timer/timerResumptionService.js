/* ==========================================================================
   TIMER RESUMPTION SERVICE - Tab Visibility & State Restore

   Handles timer synchronization when tab becomes visible and timer state
   restoration from localStorage on app load.

   🔒 CEMENT: Recovering animation resynchronization
   - Finds recovering-text elements after tab resume
   - Calculates elapsed time from timer startTime
   - Sets negative animation-delay to resume from current position
   - Forces animation restart with reflow trick

   Dependencies: appState, timerService, timerCompletionService
   Used by: timerService (startup), appInitializerService (load state)
   ========================================================================== */

import { appState } from "state";
import { getRenderers, createTimerInterval } from "./timerService.js";
import { handleCompletion } from "./timerCompletionService.js";

let visibilityChangeHandler = null;

/* === TAB VISIBILITY SYNC === */
function handleTimerVisibilityChange() {
  if (document.visibilityState !== "visible") return;

  const resyncTimer = (restState) => {
    if (restState.type === "none" || !restState.startTime) return;

    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    const newTimeRemaining = Math.max(0, 300 - elapsedSeconds);

    if (newTimeRemaining !== restState.timeRemaining) {
      restState.timeRemaining = newTimeRemaining;
      const minutesElapsed = Math.floor(elapsedSeconds / 60);

      for (let i = 0; i < 5; i++) {
        if (i < minutesElapsed) {
          restState.completedSegments[i] = true;
        }
      }
    }
  };

  resyncTimer(appState.rest.normal);
  resyncTimer(appState.rest.superset.left);
  resyncTimer(appState.rest.superset.right);

  if (appState.ui.currentPage === "workout") {
    const renderers = getRenderers();
    renderers.renderAll();
    resyncRecoveringAnimations();
  }
}

function resyncRecoveringAnimations() {
  const recoveringElements = document.querySelectorAll('.recovering-text, .dual-mode-recovering-text');

  recoveringElements.forEach(element => {
    const normalRest = appState.rest.normal;
    const supersetLeft = appState.rest.superset.left;
    const supersetRight = appState.rest.superset.right;

    let elapsedSeconds = 0;

    if (normalRest.type === "log" && normalRest.startTime) {
      elapsedSeconds = Math.floor((Date.now() - normalRest.startTime) / 1000);
    } else if (supersetLeft.type === "log" && supersetLeft.startTime) {
      elapsedSeconds = Math.floor((Date.now() - supersetLeft.startTime) / 1000);
    } else if (supersetRight.type === "log" && supersetRight.startTime) {
      elapsedSeconds = Math.floor((Date.now() - supersetRight.startTime) / 1000);
    }

    if (elapsedSeconds > 0) {
      const animationDelay = -elapsedSeconds + 's';
      element.style.animationDelay = animationDelay;
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = `recovering-progression 60s linear infinite ${animationDelay}`;
    }
  });
}

export function registerVisibilityHandler() {
  if (!visibilityChangeHandler) {
    visibilityChangeHandler = handleTimerVisibilityChange;
    document.addEventListener("visibilitychange", visibilityChangeHandler);
  }
}

export function unregisterVisibilityHandler() {
  if (visibilityChangeHandler) {
    document.removeEventListener("visibilitychange", visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
}

/* === STATE RESTORATION === */
export function resumeTimersFromState() {
  const resume = (restState, side = null) => {
    if (restState.type === "none" || !restState.startTime) return;

    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    const newTimeRemaining = Math.max(0, 300 - elapsedSeconds);

    restState.timeRemaining = newTimeRemaining;

    const minutesElapsed = Math.floor(elapsedSeconds / 60);
    for (let i = 0; i < 5; i++) {
      if (i < minutesElapsed) {
        restState.completedSegments[i] = true;
      }
    }

    if (newTimeRemaining <= 0) {
      handleCompletion(restState, { wasSkipped: false });
    } else {
      const completionHandler = side
        ? (rs, opts) => handleCompletion(rs, opts)
        : (rs, opts) => handleCompletion(rs, opts);
      createTimerInterval(restState, side, completionHandler);
    }
  };

  resume(appState.rest.normal);
  resume(appState.rest.superset.left, "left");
  resume(appState.rest.superset.right, "right");
}
