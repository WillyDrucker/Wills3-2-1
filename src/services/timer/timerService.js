/* ==========================================================================
   TIMER SERVICE - Rest Timer Core

   Creates and manages rest timer intervals for normal and dual-mode workouts.
   Handles timer initialization, tick updates, and segment completion animations.

   🔒 CEMENT: "Next Exercise Up" header logic
   - Normal mode: Header changes immediately when timer starts
   - Dual mode: Header only changes when OTHER side timer is already running
   - Ensures user clarity on which exercise is truly "next up"

   Dependencies: appState, workoutService (advanceToNextExercise, updateWorkoutTimeRemaining),
                 formatTime utility
   Used by: active-exercise-card (log/skip actions), timerCompletionService
   ========================================================================== */

import { appState } from "state";
import { formatTime } from "utils";
import * as workoutService from "services/workout/workoutProgressionService.js";
import { updateWorkoutTimeRemaining } from "services/workout/workoutService.js";
import { registerVisibilityHandler } from "./timerResumptionService.js";
import { handleNormalRestCompletion, handleSupersetRestCompletion } from "./timerCompletionService.js";

let renderers = {};

export function initialize(rendererCallbacks) {
  renderers = rendererCallbacks;
}

export function getRenderers() {
  return renderers;
}

/* === TIMER INTERVAL MANAGEMENT === */
export function createTimerInterval(restState, side = null, handleCompletion) {
  let lastMinutesElapsed = Math.floor((300 - restState.timeRemaining) / 60);

  restState.timerId = setInterval(() => {
    const elapsedSeconds = Math.floor(
      (Date.now() - restState.startTime) / 1000
    );
    restState.timeRemaining = Math.max(0, 300 - elapsedSeconds);

    if (appState.ui.currentPage === "workout") {
      const timerSelector = side
        ? `.timer-display[data-side="${side}"]`
        : ".timer-display";
      const timerDisplay = document.querySelector(timerSelector);
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(restState.timeRemaining);
      }
    }

    const currentMinutesElapsed = Math.floor(elapsedSeconds / 60);
    if (currentMinutesElapsed > lastMinutesElapsed) {
      lastMinutesElapsed = currentMinutesElapsed;
      updateWorkoutTimeRemaining();

      if (appState.ui.currentPage === "workout") {
        renderers.renderConfigHeaderLine();

        if (currentMinutesElapsed > 0 && currentMinutesElapsed <= 5) {
          const segmentIndex = currentMinutesElapsed - 1;
          if (restState.completedSegments[segmentIndex] === false) {
            restState.completedSegments[segmentIndex] = true;
            restState.animatingSegments[segmentIndex] = true;
            renderers.renderActiveExerciseCard();
            setTimeout(() => {
              if (restState.timerId && appState.ui.currentPage === "workout") {
                restState.animatingSegments[segmentIndex] = false;
                renderers.renderActiveExerciseCard();
              }
            }, 1200);
          }
        }
      }
    }

    if (
      side &&
      appState.superset.isActive &&
      appState.superset.timeDeductionSetIndexes.includes(
        restState.triggeringSetIndex
      ) &&
      restState.timeRemaining === 30 &&
      appState.superset.bonusMinutes > 0
    ) {
      appState.superset.bonusMinutes--;
      if (appState.ui.currentPage === "workout") {
        updateWorkoutTimeRemaining();
        renderers.renderConfigHeaderLine();
      }
    }

    if (restState.timeRemaining <= 0) {
      handleCompletion(restState, { wasSkipped: false });
    }
  }, 1000);
}

/* === TIMER STARTUP === */
export function startTimer(restState, type, side = null, handleCompletion) {
  if (restState.timerId) clearInterval(restState.timerId);

  /* 🔒 CEMENT: Dynamic "Next Exercise Up" header logic */
  if (!side) {
    appState.session.activeCardHeaderMessage = "Next Exercise Up";
  } else {
    const isLeftActive = appState.rest.superset.left.type !== "none";
    const isRightActive = appState.rest.superset.right.type !== "none";
    if (
      (side === "left" && isRightActive) ||
      (side === "right" && isLeftActive)
    ) {
      appState.session.activeCardHeaderMessage = "Next Exercise Up";
    }
  }

  workoutService.advanceToNextExercise();

  const lastLoggedSet = side
    ? appState.session.lastLoggedSet[
        side === "left" ? "supersetLeft" : "supersetRight"
      ]
    : appState.session.lastLoggedSet.normal;

  Object.assign(restState, {
    type,
    startTime: Date.now(),
    timeRemaining: 300,
    completedSegments: Array(5).fill(false),
    animatingSegments: Array(5).fill(false),
    isFadingOut: false,
    triggeringSetIndex: lastLoggedSet.index,
    triggeringCycleId: Date.now(),
  });

  registerVisibilityHandler();

  updateWorkoutTimeRemaining();
  renderers.renderAll();
  createTimerInterval(restState, side, handleCompletion);
}

/* === PUBLIC API === */
export function startNormalRestTimer(type) {
  startTimer(appState.rest.normal, type, null, handleNormalRestCompletion);
}

export function startSupersetRestTimer(side, type) {
  startTimer(appState.rest.superset[side], type, side, handleSupersetRestCompletion);
}
