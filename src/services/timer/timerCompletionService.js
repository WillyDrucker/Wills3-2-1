/* ==========================================================================
   TIMER COMPLETION SERVICE - Timer Finish & Skip Animations

   Handles rest timer completion, skip animations, and fadeout sequences. Manages
   cycle ID isolation to prevent dual-mode animation cross-contamination.

   🔒 CEMENT: Skip animation with cycle ID isolation
   - Tracks skipAnimationCycleId to prevent cross-contamination in dual-mode
   - 3-second cooldown prevents rapid re-triggering
   - 5-second defensive cleanup catches stale animation flags
   - Only clears animation if triggered by same cycle ID

   🔒 CEMENT: Header reset on completion (v5.0.2)
   - "Current Exercise" header restored whenever any timer completes/skips
   - Single source of truth for header state reset

   Dependencies: appState, workoutProgressionService, workoutStateService,
                 workoutService, timerService
   Used by: timerService (interval completion), active-exercise-card (skip rest)
   ========================================================================== */

import { appState } from "state";
import { recalculateCurrentStateAfterLogChange } from "services/workout/workoutProgressionService.js";
import { updateWorkoutCompletionState } from "services/workout/workoutStateService.js";
import { updateWorkoutTimeRemaining } from "services/workout/workoutService.js";
import { getRenderers } from "./timerService.js";
import { unregisterVisibilityHandler } from "./timerResumptionService.js";

/* === TIMER COMPLETION HANDLING === */
export function handleCompletion(restState, options = {}) {
  const cycleId = restState.triggeringCycleId;
  if (restState.type === "none" && !options.wasSkipped) return;
  if (restState.timerId) clearInterval(restState.timerId);
  restState.timerId = null;

  /* 🔒 CEMENT: Header reset (v5.0.2) - Single source of truth */
  appState.session.activeCardHeaderMessage = "Current Exercise";

  const log = appState.session.workoutLog[restState.triggeringSetIndex];
  if (log) {
    log.restCompleted = true;
    if (options.wasSkipped) {
      log.restWasSkipped = true;
      log.skippedRestValue = restState.timeRemaining;

      /* 🔒 CEMENT: Skip animation with progress preservation and defensive cleanup */
      const now = Date.now();
      const lastSkipTime = log.lastSkipAnimationTime || 0;
      const timeSinceLastSkip = now - lastSkipTime;

      /* Defensive cleanup prevents corrupted animation state */
      if (log.isSkipAnimating && timeSinceLastSkip > 5000) {
        log.isSkipAnimating = false;
        log.lastSkipAnimationTime = null;
        log.skipAnimationCycleId = null;
      }

      /* 3-second cooldown prevents rapid re-triggering in dual-mode */
      if (!log.isSkipAnimating && timeSinceLastSkip > 3000) {
        log.isSkipAnimating = true;
        log.lastSkipAnimationTime = now;
        log.skipAnimationCycleId = restState.triggeringCycleId;

        setTimeout(() => {
          /* Only clear animation if triggered by this specific cycle */
          if (log.skipAnimationCycleId === restState.triggeringCycleId) {
            log.isSkipAnimating = false;
            log.lastSkipAnimationTime = null;
            log.skipAnimationCycleId = null;
          }
        }, 2000);
      }
    }
  }

  restState.finalAnimationType = restState.type;
  restState.isFadingOut = true;
  restState.type = "none";
  restState.animationStartTime = Date.now();

  if (
    appState.rest.normal.type === "none" &&
    appState.rest.superset.left.type === "none" &&
    appState.rest.superset.right.type === "none"
  ) {
    unregisterVisibilityHandler();
  }

  recalculateCurrentStateAfterLogChange({ shouldScroll: true });
  updateWorkoutTimeRemaining();
  updateWorkoutCompletionState();

  const renderers = getRenderers();
  if (
    appState.ui.currentPage === "workout" &&
    !appState.ui.videoPlayer.isVisible
  ) {
    renderers.renderAll();
  }

  setTimeout(() => {
    if (restState.triggeringCycleId === cycleId) {
      restState.isFadingOut = false;
      restState.finalAnimationType = "none";
      restState.triggeringSetIndex = null;
      restState.animationStartTime = null;
      restState.timeRemaining = 300;
    }
  }, 4000);
}

/* === PUBLIC API === */
export function handleNormalRestCompletion(restState, options = {}) {
  handleCompletion(restState, options);
}

export function handleSupersetRestCompletion(restState, options = {}) {
  handleCompletion(restState, options);
}
